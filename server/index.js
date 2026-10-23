import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();
const require = createRequire(import.meta.url);
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'));
fs.mkdirSync(uploadDir, { recursive: true });

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use('/uploads', express.static(uploadDir));

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';
const PORT = Number(process.env.PORT || 3000);
const ADMIN_PHONES = (process.env.ADMIN_PHONES || '').split(',').map(v => v.trim()).filter(Boolean);

const publicUser = (u) => u ? ({
  id: u.id, phone: u.phone, role: u.role, email: u.email,
  profile: serialize(u.profile) || null,
  full_name: [u.profile?.firstName, u.profile?.surname].filter(Boolean).join(' ') || u.phone,
  profile_completed: !!u.profile?.profileCompleted,
}) : null;

function signUser(user) { return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }); }
function signVerificationToken(payment) {
  return jwt.sign({ verificationId: payment.id, phone: payment.phone, purpose: payment.purpose, kind: 'intasend_payment_verification' }, JWT_SECRET, { expiresIn: '30m' });
}
async function verifyPaymentToken(token, purpose) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.kind !== 'intasend_payment_verification' || payload.purpose !== purpose) throw new Error('Invalid verification token');
    const payment = await prisma.verificationPayment.findUnique({ where: { id: payload.verificationId } });
    if (!payment || payment.status !== 'SUCCESS' || !payment.paidAt || payment.expiresAt < new Date() || payment.phone !== payload.phone) throw new Error('Invalid or expired verification session');
    return payload;
  } catch (e) {
    if (e?.status) throw e;
    throw Object.assign(new Error('Verification session expired. Please complete verification again.'), { status: 401 });
  }
}
function normalizePhoneNumber(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('00')) return '+' + cleaned.slice(2);
  if (/^0[17]\d{8}$/.test(cleaned)) return '+254' + cleaned.slice(1);
  return '+' + cleaned;
}
function intasendPhone(phone) {
  const normalized = normalizePhoneNumber(phone);
  return normalized?.startsWith('+') ? normalized.slice(1) : normalized;
}
function intasendClient() {
  const secret = process.env.INTASEND_API_KEY;
  const publishable = process.env.INTASEND_PUBLISHABLE_KEY;
  if (!secret || !publishable) throw Object.assign(new Error('IntaSend is not configured on the server.'), { status: 503 });
  const IntaSend = require('intasend-node');
  const test = String(process.env.INTASEND_TEST_ENVIRONMENT || '').toLowerCase() === 'true' || secret.includes('test') || publishable.includes('test');
  return new IntaSend(publishable, secret, test);
}
async function startIntaSendVerification(phone, purpose) {
  const amount = Number(process.env.PHONE_VERIFICATION_AMOUNT_KES || 100);
  if (!Number.isFinite(amount) || amount <= 0) throw Object.assign(new Error('Invalid phone verification amount configured.'), { status: 500 });
  const apiRef = `NLC-VERIFY-${crypto.randomUUID()}`;
  const client = intasendClient();
  const response = await client.collection().mpesaStkPush({
    first_name: 'Neighbourhood', last_name: 'Labour Connect',
    email: process.env.VERIFICATION_RECEIPT_EMAIL || 'support@example.com',
    host: process.env.APP_URL || 'https://localhost', amount,
    phone_number: intasendPhone(phone), api_ref: apiRef,
  });
  const invoiceId = response?.invoice?.invoice_id || response?.invoice_id || response?.id || null;
  const payment = await prisma.verificationPayment.create({ data: { phone, purpose, invoiceId, apiRef, amount, currency: 'KES', status: 'PENDING', expiresAt: new Date(Date.now() + 15 * 60 * 1000) } });
  return { payment, providerResponse: response };
}
async function refreshVerificationPayment(payment) {
  if (!payment || payment.status !== 'PENDING' || payment.expiresAt < new Date() || !payment.invoiceId) return payment;
  const response = await intasendClient().collection().status(payment.invoiceId);
  const state = String(response?.invoice?.state || response?.state || response?.status || '').toUpperCase();
  let status = payment.status;
  if (['SUCCESS','COMPLETED','COMPLETE','PAID'].includes(state)) status = 'SUCCESS';
  else if (['FAILED','CANCELLED','CANCELED','REJECTED'].includes(state)) status = 'FAILED';
  if (status !== payment.status) return prisma.verificationPayment.update({ where: { id: payment.id }, data: { status, paidAt: status === 'SUCCESS' ? new Date() : null } });
  return payment;
}
async function auth(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(h.slice(7), JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { profile: true } });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user; next();
  } catch { return res.status(401).json({ error: 'Invalid or expired session' }); }
}
const adminOnly = (req, res, next) => req.user?.role === 'admin' ? next() : res.status(403).json({ error: 'Admin only' });

function normalizeEntityName(name) {
  const allowed = ['Conversation','DeviceToken','InAppNotification','JobBid','Message','NotificationLog','Referral','ReferralEarning','Review','ServiceProvider','ServiceRequest','Subscription','UserPresence','UserProfile','WithdrawalRequest'];
  if (!allowed.includes(name)) throw Object.assign(new Error('Unknown entity'), { status: 404 });
  return name[0].toLowerCase() + name.slice(1);
}
function snakeToCamel(k){ return k.replace(/_([a-z])/g, (_,c)=>c.toUpperCase()); }
function camelToSnake(k){ return k.replace(/[A-Z]/g, m=>'_'+m.toLowerCase()); }
function serialize(v) {
  if (!v) return v;
  const out = {};
  for (const [k,val] of Object.entries(v)) out[camelToSnake(k)] = val instanceof Date ? val.toISOString() : val;
  return out;
}
function mapInput(body) {
  const out={};
  for(const [k,v] of Object.entries(body||{})){ if(k==='created_date'||k==='updated_date') continue; out[snakeToCamel(k)]=v; }
  return out;
}
function whereFromFilters(filters = {}) {
  const where = {};
  for (const [rawK, rawV] of Object.entries(filters || {})) {
    if (rawV === undefined || rawV === null || rawV === '') continue;
    const k=snakeToCamel(rawK); let v=rawV;
    if (v === 'true') v=true; else if(v==='false') v=false; else if(typeof v==='string' && v!=='' && !Number.isNaN(Number(v)) && ['lat','lng','budget','charge','amount','amount_kes','rating','service_radius_km','years_experience','stars','level'].includes(rawK)) v=Number(v);
    where[k]=v;
  }
  return where;
}

async function bootstrapAdmins(){
  if(!ADMIN_PHONES.length) return;
  const pinHash=process.env.ADMIN_INITIAL_PIN_HASH||null;
  for(const phone of ADMIN_PHONES){
    let u=await prisma.user.findUnique({where:{phone},include:{profile:true}});
    if(!u){
      u=await prisma.user.create({data:{phone,role:'admin',profile:{create:{phone,role:'admin',pinHash,profileCompleted:true,referralCode:await uniqueReferralCode()}}},include:{profile:true}});
    } else if(u.role!=='admin'){
      u=await prisma.user.update({where:{id:u.id},data:{role:'admin'},include:{profile:true}});
      await prisma.userProfile.update({where:{userId:u.id},data:{role:'admin',profileCompleted:true}});
    }
  }
}

// Health/readiness
app.get('/api/health', async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ ok: true, service: 'neighbourhood-labour-connect', database: 'ok', time: new Date().toISOString() }); }
  catch (e) { res.status(503).json({ ok: false, database: 'unavailable' }); }
});
app.get('/api/config/public', (_req,res) => res.json({
  appName: process.env.APP_NAME || 'Neighbourhood Labour Connect',
  phoneVerification: { provider: 'intasend-payment', configured: !!(process.env.INTASEND_API_KEY && process.env.INTASEND_PUBLISHABLE_KEY), amountKes: Number(process.env.PHONE_VERIFICATION_AMOUNT_KES || 100) },
  firebase: process.env.FIREBASE_WEB_CONFIG ? JSON.parse(process.env.FIREBASE_WEB_CONFIG) : null,
  vapidKey: process.env.VAPID_PUBLIC_KEY || null,
  paymentPublicKey: process.env.INTASEND_PUBLISHABLE_KEY || null,
}));

// Standalone authentication API. Phone verification is completed through an IntaSend
// M-Pesa STK Push. A successful verification payment creates a short-lived server token.
app.post('/api/auth/verification/start', async (req,res) => {
  try {
    const phone = normalizePhoneNumber(req.body.phone);
    const purpose = req.body.purpose === 'reset_pin' ? 'reset_pin' : 'registration';
    if (!phone || phone.length < 10) return res.status(400).json({ error: 'Please provide a valid phone number.' });
    const recent = await prisma.verificationPayment.findFirst({ where: { phone, purpose, createdAt: { gt: new Date(Date.now() - 30 * 1000) } }, orderBy: { createdAt: 'desc' } });
    if (recent) return res.status(429).json({ error: 'A verification payment is already being processed. Please wait for the M-Pesa prompt.' });
    const { payment } = await startIntaSendVerification(phone, purpose);
    res.json({ ok:true, verification_id:payment.id, amount_kes:payment.amount, status:payment.status, phone, expires_at:payment.expiresAt.toISOString() });
  } catch(e) { res.status(e.status || 400).json({ error:e.message }); }
});

app.get('/api/auth/verification/status', async (req,res) => {
  try {
    const id=String(req.query.verification_id || '');
    if(!id) return res.status(400).json({error:'Verification ID is required.'});
    let payment=await prisma.verificationPayment.findUnique({where:{id}});
    if(!payment) return res.status(404).json({error:'Verification payment not found.'});
    if(payment.status==='PENDING') payment = payment.expiresAt < new Date() ? await prisma.verificationPayment.update({where:{id},data:{status:'EXPIRED'}}) : await refreshVerificationPayment(payment);
    const verified=payment.status==='SUCCESS';
    res.json({ok:true,verification_id:id,status:payment.status,verified,amount_kes:payment.amount,phone:payment.phone,expires_at:payment.expiresAt.toISOString(),verification_token:verified?signVerificationToken(payment):null});
  } catch(e) { res.status(e.status || 400).json({error:e.message}); }
});

app.post('/api/auth/register', async (req,res) => {
  try {
    const { phone, email, password, role='customer', pin_hash } = req.body;
    const safeRole = role === 'admin' && ADMIN_PHONES.includes(phone) ? 'admin' : (role === 'admin' ? 'customer' : role);
    if (!phone && !email) return res.status(400).json({ error: 'Phone or email is required' });
    const existing = phone ? await prisma.user.findUnique({ where: { phone } }) : await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Account already exists' });
    const user = await prisma.user.create({ data: { phone, email, role:safeRole, passwordHash: password ? await bcrypt.hash(password, 12) : null,
      profile: { create: { phone, role:safeRole, pinHash: pin_hash || null, profileCompleted: false, referralCode: await uniqueReferralCode() } } }, include: { profile: true } });
    res.json({ user: publicUser(user), access_token: signUser(user) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.post('/api/auth/login', async (req,res) => {
  const { phone, email, password, pin_hash } = req.body;
  const user = phone ? await prisma.user.findUnique({ where: { phone }, include: { profile: true } }) : await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  let ok = false;
  if (password && user.passwordHash) ok = await bcrypt.compare(password, user.passwordHash);
  if (pin_hash && user.profile?.pinHash) ok = pin_hash === user.profile.pinHash;
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ user: publicUser(user), access_token: signUser(user) });
});
app.get('/api/auth/me', auth, (req,res) => res.json(publicUser(req.user)));
app.post('/api/auth/logout', (_req,res) => res.json({ ok: true }));

async function uniqueReferralCode() {
  for (let i=0;i<10;i++) { const code = Math.random().toString(36).slice(2,9).toUpperCase(); if (!(await prisma.userProfile.findUnique({ where:{ referralCode:code } }))) return code; }
  return `NLC${Date.now().toString(36).toUpperCase()}`;
}

// Entity-compatible API used by the existing UI. Reads are scoped to the caller.
async function entityReadWhere(model, req){
  if(req.user.role==='admin') return {};
  const uid=req.user.id;
  if(model==='ServiceProvider') return {};
  if(model==='ServiceRequest') return {OR:[{customerId:uid},{assignedProviderId:uid},{status:'open'}]};
  if(model==='JobBid'){ const own=await prisma.serviceRequest.findMany({where:{customerId:uid},select:{id:true}}); return {OR:[{providerId:uid},{requestId:{in:own.map(x=>x.id)}}]}; }
  if(model==='Conversation') return {OR:[{customerId:uid},{providerId:uid}]};
  if(model==='Message'){ const cs=await prisma.conversation.findMany({where:{OR:[{customerId:uid},{providerId:uid}]},select:{id:true}}); return {conversationId:{in:cs.map(x=>x.id)}}; }
  if(model==='Review') return {};
  if(model==='UserProfile') return {userId:req.user.id};
  if(model==='Subscription') return {userId:uid};
  if(model==='Referral') return {referrerId:uid};
  if(model==='ReferralEarning') return {earnerId:uid};
  if(model==='WithdrawalRequest') return {userId:uid};
  if(['DeviceToken','InAppNotification','NotificationLog','UserPresence'].includes(model)) return {userId:uid};
  return {};
}
app.get('/api/entities/:entity', auth, async (req,res) => {
  try {
    const model = normalizeEntityName(req.params.entity); const { limit=100, sort } = req.query;
    const filters = { ...req.query }; delete filters.limit; delete filters.sort;
    const requested=whereFromFilters(filters); const scoped=await entityReadWhere(model,req);
    const where=Object.keys(scoped).length ? {AND:[requested,scoped]} : requested;
    const rows = await prisma[model].findMany({ where, take: Math.min(Number(limit)||100, 500), orderBy: sort ? { [snakeToCamel(String(sort).replace(/^-/,''))]: String(sort).startsWith('-') ? 'desc':'asc' } : { createdAt:'desc' } });
    res.json(rows.map(serialize));
  } catch(e) { res.status(e.status||400).json({ error:e.message }); }
});
function entityOwnerAllowed(model, row, req){
  if(req.user.role==='admin') return true;
  const uid=req.user.id;
  if(['UserProfile','ServiceProvider','UserPresence','DeviceToken'].includes(model)) return !row || row.userId===req.user.id || row.firebaseUid===uid || row.user_id===uid;
  if(model==='ServiceRequest') return !row || row.customerId===uid || row.customer_id===uid || row.assignedProviderId===uid || row.assigned_provider_id===uid;
  if(model==='JobBid') return !row || row.providerId===uid || row.provider_id===uid;
  if(model==='Conversation') return !row || row.customerId===uid || row.customer_id===uid || row.providerId===uid || row.provider_id===uid;
  if(model==='Message') return !row || row.senderId===uid || row.sender_id===uid;
  if(model==='Review') return true;
  if(model==='InAppNotification') return !row || row.userId===uid || row.user_id===uid;
  return true;
}
app.post('/api/entities/:entity', auth, async (req,res) => {
  try { const model=normalizeEntityName(req.params.entity); const data=mapInput(req.body);
    if(model==='UserProfile' && data.role==='admin' && !ADMIN_PHONES.includes(data.phone||req.user.phone) && req.user.role!=='admin') return res.status(403).json({error:'Admin role is restricted'});
    if(['Subscription','ReferralEarning','NotificationLog'].includes(model) && req.user.role!=='admin') return res.status(403).json({error:'Forbidden'});
    if(model==='InAppNotification' && data.userId!== (req.user.id) && req.user.role!=='admin') return res.status(403).json({error:'Forbidden'});
    if(model==='ServiceProvider' && req.user.role!=='provider' && req.user.role!=='admin') return res.status(403).json({error:'Provider account required'});
    if(model==='ServiceRequest' && req.user.role==='customer' && !(await prisma.subscription.findFirst({where:{userId:req.user.id,status:'active',periodEnd:{gt:new Date()}}}))) return res.status(402).json({error:'Active subscription required'});
    if(model==='JobBid' && req.user.role!=='provider') return res.status(403).json({error:'Provider account required'});
    if(model==='Conversation'){ const uid=req.user.id; if(data.customerId!==uid && data.providerId!==uid && req.user.role!=='admin') return res.status(403).json({error:'Forbidden'}); }
    if(model==='Message'){ const convo=await prisma.conversation.findUnique({where:{id:data.conversationId}}); const uid=req.user.id; if(!convo || (convo.customerId!==uid && convo.providerId!==uid && req.user.role!=='admin')) return res.status(403).json({error:'Forbidden'}); }
    const row=await prisma[model].create({ data }); res.json(serialize(row)); }
  catch(e){res.status(400).json({error:e.message});}
});
app.get('/api/entities/:entity/:id', auth, async(req,res)=>{
  try { const model=normalizeEntityName(req.params.entity); const row=await prisma[model].findUnique({where:{id:req.params.id}}); if(!row)return res.status(404).json({error:'Not found'}); if(!entityOwnerAllowed(model,row,req) && model!=='ServiceProvider' && model!=='Review')return res.status(403).json({error:'Forbidden'}); res.json(serialize(row)); }
  catch(e){res.status(400).json({error:e.message});}
});
app.patch('/api/entities/:entity/:id', auth, async(req,res)=>{
  try { const model=normalizeEntityName(req.params.entity); const existing=await prisma[model].findUnique({where:{id:req.params.id}}); if(!existing)return res.status(404).json({error:'Not found'});
    if(!entityOwnerAllowed(model,existing,req)) return res.status(403).json({error:'Forbidden'});
    const data=mapInput(req.body);
    if(model==='UserProfile' && data.role==='admin' && req.user.role!=='admin') delete data.role;
    const row=await prisma[model].update({where:{id:req.params.id},data}); res.json(serialize(row)); }
  catch(e){res.status(400).json({error:e.message});}
});
app.post('/api/entities/:entity/bulk-update', auth, async(req,res)=>{
  try { const model=normalizeEntityName(req.params.entity); const {filter={},data={}}=req.body; const rows=await prisma[model].findMany({where:whereFromFilters(filter)}); await Promise.all(rows.map(r=>prisma[model].update({where:{id:r.id},data:mapInput(data)}))); res.json({updated:rows.length}); }
  catch(e){res.status(400).json({error:e.message});}
});

// Function-compatible API. These are the former Base44 server functions, now implemented here.
app.post('/api/functions/:name', async (req,res,next)=>{
  const publicFunctions=new Set(['getUserProfile','getIntaSendConfig','getFirebaseConfig','saveUserProfile','resetPin']);
  if(publicFunctions.has(req.params.name)){
    if (req.headers.authorization) return auth(req,res,next);
    req.user=null;
    return next();
  }
  return auth(req,res,next);
}, async (req,res)=>{
  try { const result = await runFunction(req.params.name, req.body || {}, req); res.json({ data: result }); }
  catch(e){ res.status(e.status||400).json({ error:e.message }); }
});

async function getProfileByUid(uid) { return prisma.userProfile.findFirst({ where: { OR:[{userId:uid},{userId:uid}] } }); }
function b64url(input){return Buffer.from(input).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
let fcmTokenCache={token:null,expiresAt:0};
async function getFcmAccessToken(){
  if(fcmTokenCache.token && Date.now()<fcmTokenCache.expiresAt-60000) return fcmTokenCache.token;
  if(!process.env.FIREBASE_SERVICE_ACCOUNT) return null;
  const sa=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); const now=Math.floor(Date.now()/1000);
  const header=b64url(JSON.stringify({alg:'RS256',typ:'JWT'})); const payload=b64url(JSON.stringify({iss:sa.client_email,scope:'https://www.googleapis.com/auth/firebase.messaging',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
  const unsigned=`${header}.${payload}`; const signer=crypto.createSign('RSA-SHA256'); signer.update(unsigned); const assertion=`${unsigned}.${b64url(signer.sign(sa.private_key))}`;
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${encodeURIComponent(assertion)}`}); const data=await r.json(); if(!r.ok||!data.access_token) throw new Error('Unable to obtain Firebase messaging token'); fcmTokenCache={token:data.access_token,expiresAt:Date.now()+3500000}; return data.access_token;
}
async function sendFcm(tokens,title,body,link){
  if(!tokens.length) return 0; const access=await getFcmAccessToken(); if(!access) return 0; const sa=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); let sent=0;
  for(const token of tokens){ const r=await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,{method:'POST',headers:{Authorization:`Bearer ${access}`,'Content-Type':'application/json'},body:JSON.stringify({message:{token,notification:{title,body},webpush:{fcmOptions:{link:link||'/'},notification:{title,body,icon:'/icon.svg',badge:'/icon.svg'}}}})}); if(r.ok) sent++; } return sent;
}
async function notifyUser(userId,title,body,type='system',link=null) {
  await prisma.inAppNotification.create({data:{userId,title,body,type,read:false,link}});
  const p=await getProfileByUid(userId); const devices=await prisma.deviceToken.findMany({where:{userId}});
  let delivered=0; try{delivered=await sendFcm(devices.map(d=>d.token).filter(Boolean),title,body,link);}catch(e){console.error('FCM notification failed',e.message);}
  await prisma.notificationLog.create({data:{userId,userName:p ? `${p.firstName||''} ${p.surname||''}`.trim():null,type:title.toLowerCase().includes('bid')?'bid':type,title,body,status:delivered||!devices.length?'sent':'failed',deviceCount:delivered,error:delivered||!devices.length?null:'FCM delivery failed'}}).catch(()=>{});
  return delivered;
}
async function activateSub(targetId, activatedBy='system') {
  const profile=await getProfileByUid(targetId); if(!profile) throw Object.assign(new Error('Profile not found'),{status:404});
  await prisma.subscription.updateMany({where:{userId:targetId,status:'active'},data:{status:'expired'}});
  const sub=await prisma.subscription.create({data:{userId:targetId,userPhone:profile.phone,userName:`${profile.firstName||''} ${profile.surname||''}`.trim()||profile.phone,status:'active',amount:1,periodStart:new Date(),periodEnd:new Date(Date.now()+30*86400000),activatedBy}});
  let current=profile;
  const rates=[.10,.05,.02];
  for(let level=1;level<=3;level++){
    if(!current?.referredBy) break;
    const ref=await getProfileByUid(current.referredBy); if(!ref) break;
    const exists=await prisma.referralEarning.findFirst({where:{earnerId:ref.userId,sourceSubscriberId:targetId,level}});
    if(!exists) await prisma.referralEarning.create({data:{earnerId:ref.userId,earnerName:`${ref.firstName||''} ${ref.surname||''}`.trim()||ref.phone,sourceSubscriberId:targetId,sourceName:profile.phone,level,amount:Number((rates[level-1]).toFixed(2)),status:'pending'}});
    current=ref;
  }
  await prisma.referral.updateMany({where:{referredId:targetId,status:'registered'},data:{status:'subscribed'}}).catch(()=>{});
  return sub;
}

async function runFunction(name, body, req) {
  const uid = body.firebase_uid || req.user?.id;
  switch(name){
    case 'getUserProfile': { const p=body.firebase_uid||body.phone ? await prisma.userProfile.findFirst({where: body.firebase_uid?{userId:body.firebase_uid}:{phone:body.phone}}):req.user.profile; return {profile:serialize(p)}; }
    case 'saveUserProfile': {
      const verificationToken = body.verification_token;
      let otpPayload = null;
      if (verificationToken) otpPayload = await verifyPaymentToken(verificationToken, 'registration');
      const verifiedPhone = otpPayload?.phone || body.phone || req.user?.phone || null;
      let target = await prisma.userProfile.findFirst({ where: { phone: verifiedPhone } });
      const allowed=['phone','role','pinHash','pin_hash','firstName','first_name','surname','age','idType','id_type','idNumber','id_number','idPhotoUrl','id_photo_url','idNamesExtracted','id_names_extracted','idVerified','id_verified','profilePhotoUrl','profile_photo_url','locationName','location_name','lat','lng','profileCompleted','profile_completed','referralCode','referral_code','referredBy','referred_by','notifJobs','notif_jobs','notifMessages','notif_messages','notifBids','notif_bids','notifSubscription','notif_subscription','notifReferrals','notif_referrals','notifPayments','notif_payments','notifEmergency','notif_emergency'];
      const data={}; for(const k of allowed){if(body[k]!==undefined){const nk=snakeToCamel(k); data[nk]=body[k];}}
      if (verifiedPhone) data.phone = verifiedPhone;
      if(!target){
        if(!otpPayload && !req.user) throw Object.assign(new Error('Phone payment verification is required before creating an account.'),{status:401});
        const role=body.role||'customer';
        const user=await prisma.user.create({data:{phone:verifiedPhone,role,profile:{create:{phone:verifiedPhone,role,pinHash:data.pinHash||null,profileCompleted:false,referralCode:data.referralCode||await uniqueReferralCode()}}},include:{profile:true}});
        target=user.profile;
      }
      if(target.userId!==req.user?.id && req.user?.role!=='admin' && (!otpPayload || otpPayload.phone!==target.phone)) throw Object.assign(new Error('Forbidden'),{status:403});
      if(data.role==='admin' && req.user?.role!=='admin' && !ADMIN_PHONES.includes(target.phone||verifiedPhone)) throw Object.assign(new Error('Admin role is restricted'),{status:403});
      if(target.role==='admin' && req.user?.role!=='admin') delete data.role;
      const p=await prisma.userProfile.update({where:{id:target.id},data});
      await prisma.user.update({where:{id:p.userId},data:{role:p.role,phone:p.phone}});
      const fullUser=await prisma.user.findUnique({where:{id:p.userId},include:{profile:true}});
      if (otpPayload) await prisma.verificationPayment.update({where:{id:otpPayload.verificationId},data:{status:'CONSUMED'}}).catch(()=>{});
      return {profile:serialize(p),access_token:signUser(fullUser)};
    }
    case 'resetPin': {
      const otpPayload = await verifyPaymentToken(body.verification_token, 'reset_pin');
      const p=await prisma.userProfile.findFirst({where:{phone:otpPayload.phone}});
      if(!p) throw Object.assign(new Error('Profile not found'),{status:404});
      const updated=await prisma.userProfile.update({where:{id:p.id},data:{pinHash:body.pin_hash}});
      const user=await prisma.user.findUnique({where:{id:p.userId},include:{profile:true}});
      await prisma.verificationPayment.update({where:{id:otpPayload.verificationId},data:{status:'CONSUMED'}}).catch(()=>{});
      return {profile:serialize(updated),access_token:signUser(user)};
    }
    case 'checkSubscription': { const sub=await prisma.subscription.findFirst({where:{userId:uid,status:'active',periodEnd:{gt:new Date()}},orderBy:{periodEnd:'desc'}}); return {active:!!sub,subscription:serialize(sub),period_end:sub?.periodEnd?.toISOString()||null}; }
    case 'activateSubscription': { if(req.user.role!=='admin') throw Object.assign(new Error('Forbidden — admin only'),{status:403}); const sub=await activateSub(body.target_user_id, req.user.id); return {subscription:serialize(sub)}; }
    case 'getIntaSendConfig': return {publishable_key:process.env.INTASEND_PUBLISHABLE_KEY||null,public_key:process.env.INTASEND_PUBLISHABLE_KEY||null,live:!(process.env.INTASEND_API_KEY||'').includes('test')};
    case 'getFirebaseConfig': return process.env.FIREBASE_WEB_CONFIG ? JSON.parse(process.env.FIREBASE_WEB_CONFIG) : {};
    case 'setProviderAvailability': { const p=await prisma.serviceProvider.findFirst({where:{userId:uid}}); if(!p) throw Object.assign(new Error('Provider not found'),{status:404}); await prisma.serviceProvider.update({where:{id:p.id},data:{availabilityStatus:body.status,available:body.status!=='offline'}}); return {status:'updated',provider_status:body.status}; }
    case 'updatePresence': { const now=new Date(); const existing=await prisma.userPresence.findFirst({where:{userId:uid}}); const data={userId:uid,userName:req.user.profile?`${req.user.profile.firstName||''} ${req.user.profile.surname||''}`.trim():req.user.phone,role:req.user.role,lastActive:now,isOnline:existing?.providerStatus==='offline'?false:true,providerStatus:body.provider_status||existing?.providerStatus||(req.user.role==='provider'?'available':'online')}; const p=existing?await prisma.userPresence.update({where:{id:existing.id},data}):await prisma.userPresence.create({data}); return serialize(p); }
    case 'deleteAccount': await prisma.user.delete({where:{id:req.user.id}}); return {deleted:true};
    case 'requestPayout': { const p=await prisma.serviceProvider.findFirst({where:{userId:uid}}); const amount=Number(body.amount||0); if(!p||amount<=0) throw new Error('Invalid payout'); const r=await prisma.withdrawalRequest.create({data:{userId:uid,userName:p.name,userPhone:p.phone,provider:body.provider||'M-PESA',amount,amountKes:Number(body.amount_kes||amount),status:'pending'}}); return {request:serialize(r)}; }
    case 'getEarningsDashboard': { const earnings=await prisma.referralEarning.findMany({where:{earnerId:uid},orderBy:{createdAt:'desc'}}); const provider=await prisma.serviceProvider.findFirst({where:{userId:uid}}); return {earnings:earnings.map(serialize),provider:serialize(provider),total:earnings.reduce((s,e)=>s+Number(e.amount),0)}; }
    case 'getReferralDashboard': { const refs=await prisma.referral.findMany({where:{referrerId:uid},orderBy:{createdAt:'desc'}}); const earns=await prisma.referralEarning.findMany({where:{earnerId:uid},orderBy:{createdAt:'desc'}}); return {referrals:refs.map(serialize),earnings:earns.map(serialize),total_earnings:earns.reduce((s,e)=>s+Number(e.amount),0)}; }
    case 'getIpLocation': return {city:null,country:null,lat:null,lng:null};
    case 'sendJobNearbyNotifications': { const job=body.data||body; const providers=await prisma.serviceProvider.findMany({where:{available:true}}); let sent=0; for(const p of providers){ if(p.userId){ sent += await notifyUser(p.userId,'New job nearby',job.title||'A new service request is available','job_match','/jobs'); }} return {sent}; }
    case 'notifyCustomerOfBid': { const job=await prisma.serviceRequest.findUnique({where:{id:body.request_id}}); if(!job?.customerId) return {sent:0}; return {sent:await notifyUser(job.customerId,'New bid on your job',body.provider_name?`${body.provider_name} submitted a bid.`:'A provider submitted a bid.','bid','/jobs')}; }
    case 'getAdminData': { if(req.user.role!=='admin') throw Object.assign(new Error('Admin only'),{status:403}); const [users,providers,jobs,subs,reviews]=await Promise.all([prisma.userProfile.findMany(),prisma.serviceProvider.findMany(),prisma.serviceRequest.findMany(),prisma.subscription.findMany({where:{status:'active'}}),prisma.review.findMany()]); return {users:users.map(serialize),providers:providers.map(serialize),jobs:jobs.map(serialize),subscriptions:subs.map(serialize),reviews:reviews.map(serialize)}; }
    case 'getAdminStats': { if(req.user.role!=='admin') throw Object.assign(new Error('Admin only'),{status:403}); const [users,providers,jobs,online]=await Promise.all([prisma.user.count(),prisma.serviceProvider.count(),prisma.serviceRequest.count(),prisma.userPresence.count({where:{isOnline:true}})]); return {users,providers,jobs,online}; }
    case 'createMpesaPayment': {
      const profile=await getProfileByUid(uid); if(!profile?.phone) throw Object.assign(new Error('Profile not found'),{status:404});
      const apiKey=process.env.INTASEND_API_KEY, publishableKey=process.env.INTASEND_PUBLISHABLE_KEY; if(!apiKey||!publishableKey) throw Object.assign(new Error('IntaSend keys not configured'),{status:500});
      const base=apiKey.includes('test')||publishableKey.includes('test')?'https://sandbox.intasend.com':'https://payment.intasend.com';
      const phone=String(profile.phone).replace(/^\+/, ''); const name=`${profile.firstName||''} ${profile.surname||''}`.trim()||'Customer';
      const r=await fetch(`${base}/api/v1/payment/collection/`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},body:JSON.stringify({public_key:publishableKey,currency:'KES',method:'M-PESA',amount:Number(process.env.SUBSCRIPTION_KES||130),api_ref:`NLC|${uid}`,name,phone_number:phone,email:`${phone}@nlc.app`})});
      const raw=await r.text(); let data; try{data=JSON.parse(raw)}catch{throw Object.assign(new Error(`IntaSend returned HTTP ${r.status}`),{status:502})};
      if(!r.ok) throw Object.assign(new Error(data?.detail||data?.message||data?.error||'IntaSend payment error'),{status:400});
      return {invoice_id:data.invoice?.invoice_id||data.invoice?.id,state:data.invoice?.state,amount:Number(process.env.SUBSCRIPTION_KES||130),phone,environment:base.includes('sandbox')?'test':'live'};
    }
    case 'checkMpesaPayment': {
      const invoice_id=body.invoice_id; if(!invoice_id) throw Object.assign(new Error('invoice_id required'),{status:400});
      const apiKey=process.env.INTASEND_API_KEY, publishableKey=process.env.INTASEND_PUBLISHABLE_KEY; if(!apiKey||!publishableKey) throw Object.assign(new Error('IntaSend keys not configured'),{status:500});
      const base=apiKey.includes('test')||publishableKey.includes('test')?'https://sandbox.intasend.com':'https://payment.intasend.com';
      const r=await fetch(`${base}/api/v1/payment/status/`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${apiKey}`},body:JSON.stringify({public_key:publishableKey,invoice_id})});
      const raw=await r.text(); let data; try{data=JSON.parse(raw)}catch{return {state:'PENDING'}}; const state=data?.invoice?.state;
      if((state==='SUCCESS'||state==='COMPLETED') && uid){ const active=await prisma.subscription.findFirst({where:{userId:uid,status:'active',periodEnd:{gt:new Date()}}}); if(active)return {state:'SUCCESS',already_active:true,period_end:active.periodEnd.toISOString()}; const sub=await activateSub(uid,'intasend-payment'); return {state:'SUCCESS',activated:true,period_end:sub.periodEnd.toISOString()}; }
      return {state:state||'PENDING',reason:data?.invoice?.failed_reason};
    }
    default: throw Object.assign(new Error(`Function '${name}' is not implemented in standalone backend`),{status:404});
  }
}

app.post('/api/webhooks/intasend', async (req,res)=>{
  try {
    const secret=process.env.INTASEND_WEBHOOK_SECRET;
    if(secret && req.headers['x-intasend-challenge']!==secret && req.body?.challenge!==secret && req.body?.verification!==secret) return res.status(403).json({error:'Invalid challenge'});
    const invoice=req.body?.invoice||req.body?.data?.invoice||req.body?.payment||req.body?.data||req.body;
    const state=String(invoice?.state||invoice?.status||req.body?.state||req.body?.status||'').toUpperCase();
    const apiRef=invoice?.api_ref||invoice?.apiRef||req.body?.api_ref||req.body?.apiRef||'';
    const invoiceId=invoice?.invoice_id||invoice?.invoiceId||invoice?.id||req.body?.invoice_id||null;
    if(String(apiRef).startsWith('NLC-VERIFY-')) {
      const payment=await prisma.verificationPayment.findFirst({where:invoiceId?{invoiceId}:{apiRef:String(apiRef)}});
      if(payment && ['SUCCESS','COMPLETED','COMPLETE','PAID'].includes(state)) await prisma.verificationPayment.update({where:{id:payment.id},data:{status:'SUCCESS',paidAt:new Date()}});
      else if(payment && ['FAILED','CANCELLED','CANCELED','REJECTED'].includes(state)) await prisma.verificationPayment.update({where:{id:payment.id},data:{status:'FAILED'}});
      return res.json({received:true,verification:true});
    }
    if(!['SUCCESS','COMPLETED','COMPLETE','PAID'].includes(state)) return res.json({received:true,state:state||'UNKNOWN'});
    const uid=String(apiRef).split('|')[1]; if(!uid) return res.status(400).json({error:'No user ID in api_ref'});
    const active=await prisma.subscription.findFirst({where:{userId:uid,status:'active',periodEnd:{gt:new Date()}}}); if(active) return res.json({received:true,already_active:true});
    const sub=await activateSub(uid,'intasend-webhook'); res.json({received:true,activated:true,user_id:uid,period_end:sub.periodEnd.toISOString()});
  } catch(e){res.status(500).json({error:e.message});}
});

// File uploads: files are served by this same app; configure a persistent disk/object store for production.
const storage=multer.diskStorage({destination:uploadDir,filename:(_req,file,cb)=>cb(null,`${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`)});
const upload=multer({storage,limits:{fileSize:Number(process.env.MAX_UPLOAD_BYTES||20*1024*1024)}});
app.post('/api/uploads',auth,upload.single('file'),(req,res)=>{ if(!req.file)return res.status(400).json({error:'file required'}); res.json({url:`/uploads/${req.file.filename}`,name:req.file.originalname,size:req.file.size,mime:req.file.mimetype}); });

// Fallback to Vite production build.
const dist=path.resolve(__dirname,'../dist');
if(fs.existsSync(dist)){ app.use(express.static(dist)); app.get(/.*/,(req,res)=>{ if(req.path.startsWith('/api/')) return res.status(404).json({error:'API route not found'}); res.sendFile(path.join(dist,'index.html')); }); }

app.use((err,_req,res,_next)=>{ console.error(err); res.status(500).json({error:'Internal server error'}); });
bootstrapAdmins().then(()=>app.listen(PORT,()=>console.log(`Neighbourhood Labour Connect listening on ${PORT}`))).catch(err=>{console.error('Startup failed',err);process.exit(1)});
process.on('SIGTERM',async()=>{await prisma.$disconnect();process.exit(0)});
