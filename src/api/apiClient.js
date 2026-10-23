// Standalone API client. The standalone client is exposed as `apiClient`;
// components do not need a risky rewrite of every call site. There is NO Base44
// SDK/runtime dependency here; every request goes to this application's /api.

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'nlc_access_token';

const token = () => localStorage.getItem(TOKEN_KEY);
const headers = (json=true) => ({
  ...(json ? {'Content-Type':'application/json'} : {}),
  ...(token() ? {Authorization:`Bearer ${token()}`} : {})
});

async function request(path, options={}) {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...headers(options.body !== undefined), ...(options.headers||{}) } });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error(data?.error || data?.message || `Request failed (${res.status})`);
    err.status = res.status; err.data = data; throw err;
  }
  return data;
}

const makeEntity = (name) => ({
  async list(sort=null, limit=100) { return request(`/entities/${name}?${new URLSearchParams({...(sort?{sort}:{}),limit}).toString()}`); },
  async filter(filters={}, sort=null, limit=100) { return request(`/entities/${name}?${new URLSearchParams({...filters,...(sort?{sort}:{}),limit}).toString()}`); },
  async get(id) { return request(`/entities/${name}/${id}`); },
  async create(data) { return request(`/entities/${name}`, {method:'POST', body:JSON.stringify(data)}); },
  async update(id,data) { return request(`/entities/${name}/${id}`, {method:'PATCH', body:JSON.stringify(data)}); },
  async bulkUpdate(filter,data) { return request(`/entities/${name}/bulk-update`, {method:'POST',body:JSON.stringify({filter,data})}); },
  subscribe(callback) {
    // The original backend offered realtime subscriptions. Polling keeps the
    // app functional without a hosted realtime dependency; callers can safely
    // unsubscribe. The interval is intentionally modest to reduce load.
    const id=setInterval(()=>callback?.({type:'poll'}), 5000);
    return ()=>clearInterval(id);
  }
});

const auth = {
  async me() { return request('/auth/me'); },
  async loginViaEmailPassword(email,password) {
    const data=await request('/auth/login',{method:'POST',body:JSON.stringify({email,password})});
    if(data.access_token) localStorage.setItem(TOKEN_KEY,data.access_token);
    return data;
  },
  async register(payload) { return request('/auth/register',{method:'POST',body:JSON.stringify(payload)}); },
  async loginWithProvider() { throw new Error('Google sign-in is not configured in the standalone build. Use phone + PIN or email/password.'); },
  async verifyOtp() { throw new Error('Email OTP registration is not used by the standalone phone/PIN flow.'); },
  async resendOtp() { throw new Error('Email OTP is not configured in the standalone backend.'); },
  async resetPassword() { throw new Error('Password reset must be implemented through the configured email provider.'); },
  async resetPasswordRequest() { throw new Error('Password reset must be implemented through the configured email provider.'); },
  setToken(t) { if(t) localStorage.setItem(TOKEN_KEY,t); },
  clearToken() { localStorage.removeItem(TOKEN_KEY); },
  isAuthenticated() { return !!token(); },
};

const functions = {
  async invoke(name, body={}) { return request(`/functions/${encodeURIComponent(name)}`,{method:'POST',body:JSON.stringify(body)}); }
};

export const apiClient = {
  auth,
  functions,
  entities: new Proxy({}, { get: (_t,name) => makeEntity(name) })
};

export { TOKEN_KEY, request };
