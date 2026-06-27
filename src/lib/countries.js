// Optimized country list for target markets (East Africa + major diaspora).
// `length` = typical mobile subscriber number length used for placeholder + validation.
export const COUNTRY_OPTIONS = [
  // East Africa (primary market)
  { code: "KE", name: "Kenya", dial: "254", flag: "🇰🇪", length: 9 },
  { code: "UG", name: "Uganda", dial: "256", flag: "🇺🇬", length: 9 },
  { code: "TZ", name: "Tanzania", dial: "255", flag: "🇹🇿", length: 9 },
  { code: "RW", name: "Rwanda", dial: "250", flag: "🇷🇼", length: 9 },
  { code: "ET", name: "Ethiopia", dial: "251", flag: "🇪🇹", length: 9 },
  { code: "BI", name: "Burundi", dial: "257", flag: "🇧🇮", length: 8 },
  { code: "SS", name: "South Sudan", dial: "211", flag: "🇸🇸", length: 9 },
  { code: "SO", name: "Somalia", dial: "252", flag: "🇸🇴", length: 8 },
  { code: "DJ", name: "Djibouti", dial: "253", flag: "🇩🇯", length: 8 },
  
  // Southern Africa
  { code: "ZA", name: "South Africa", dial: "27", flag: "🇿🇦", length: 9 },
  { code: "ZM", name: "Zambia", dial: "260", flag: "🇿🇲", length: 9 },
  { code: "ZW", name: "Zimbabwe", dial: "263", flag: "🇿🇼", length: 9 },
  { code: "MW", name: "Malawi", dial: "265", flag: "🇲🇼", length: 9 },
  { code: "MZ", name: "Mozambique", dial: "258", flag: "🇲🇿", length: 9 },
  { code: "BW", name: "Botswana", dial: "267", flag: "🇧🇼", length: 8 },
  { code: "NA", name: "Namibia", dial: "264", flag: "🇳🇦", length: 9 },
  
  // West Africa (major markets)
  { code: "NG", name: "Nigeria", dial: "234", flag: "🇳🇬", length: 10 },
  { code: "GH", name: "Ghana", dial: "233", flag: "🇬🇭", length: 9 },
  { code: "SN", name: "Senegal", dial: "221", flag: "🇸🇳", length: 9 },
  
  // Middle East (diaspora)
  { code: "AE", name: "UAE", dial: "971", flag: "🇦🇪", length: 9 },
  { code: "SA", name: "Saudi Arabia", dial: "966", flag: "🇸🇦", length: 9 },
  { code: "QA", name: "Qatar", dial: "974", flag: "🇶🇦", length: 8 },
  { code: "KW", name: "Kuwait", dial: "965", flag: "🇰🇼", length: 8 },
  { code: "OM", name: "Oman", dial: "968", flag: "🇴🇲", length: 8 },
  
  // South Asia (diaspora)
  { code: "IN", name: "India", dial: "91", flag: "🇮🇳", length: 10 },
  { code: "PK", name: "Pakistan", dial: "92", flag: "🇵🇰", length: 10 },
  { code: "BD", name: "Bangladesh", dial: "880", flag: "🇧🇩", length: 10 },
  { code: "LK", name: "Sri Lanka", dial: "94", flag: "🇱🇰", length: 9 },
  
  // Europe (diaspora)
  { code: "GB", name: "United Kingdom", dial: "44", flag: "🇬🇧", length: 10 },
  { code: "IE", name: "Ireland", dial: "353", flag: "🇮🇪", length: 9 },
  
  // North America (diaspora)
  { code: "US", name: "United States", dial: "1", flag: "🇺🇸", length: 10 },
  { code: "CA", name: "Canada", dial: "1", flag: "🇨🇦", length: 10 },
];

export const DEFAULT_COUNTRY = COUNTRY_OPTIONS[0];

export const getCountryByCode = (code) =>
  COUNTRY_OPTIONS.find((c) => c.code === code) || null;

// Build a grouped-digit placeholder from a country's mobile length, e.g. 9 -> "123 456 789"
export function placeholderForCountry(country) {
  const len = country?.length || 9;
  const digits = "1234567890".repeat(Math.ceil(len / 10)).slice(0, len);
  return digits.match(/.{1,3}/g)?.join(" ") || "";
}

// Group raw digits into 3-digit chunks for display
export function formatLocalNumber(rawDigits, maxLen) {
  const digits = (rawDigits || "").replace(/\D/g, "").slice(0, (maxLen || 9) + 2);
  return digits.match(/.{1,3}/g)?.join(" ") || "";
}