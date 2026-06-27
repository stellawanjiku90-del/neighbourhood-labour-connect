export const COUNTRY_OPTIONS = [
  { code: "KE", name: "Kenya", dial: "254", flag: "🇰🇪" },
  { code: "UG", name: "Uganda", dial: "256", flag: "🇺🇬" },
  { code: "TZ", name: "Tanzania", dial: "255", flag: "🇹🇿" },
  { code: "NG", name: "Nigeria", dial: "234", flag: "🇳🇬" },
  { code: "GH", name: "Ghana", dial: "233", flag: "🇬🇭" },
  { code: "RW", name: "Rwanda", dial: "250", flag: "🇷🇼" },
  { code: "ET", name: "Ethiopia", dial: "251", flag: "🇪🇹" },
  { code: "ZM", name: "Zambia", dial: "260", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", dial: "263", flag: "🇿🇼" },
  { code: "MW", name: "Malawi", dial: "265", flag: "🇲🇼" },
  { code: "MZ", name: "Mozambique", dial: "258", flag: "🇲🇿" },
  { code: "ZA", name: "South Africa", dial: "27", flag: "🇿🇦" },
  { code: "EG", name: "Egypt", dial: "20", flag: "🇪🇬" },
  { code: "MA", name: "Morocco", dial: "212", flag: "🇲🇦" },
  { code: "IN", name: "India", dial: "91", flag: "🇮🇳" },
  { code: "PK", name: "Pakistan", dial: "92", flag: "🇵🇰" },
  { code: "BD", name: "Bangladesh", dial: "880", flag: "🇧🇩" },
  { code: "PH", name: "Philippines", dial: "63", flag: "🇵🇭" },
  { code: "ID", name: "Indonesia", dial: "62", flag: "🇮🇩" },
  { code: "US", name: "United States", dial: "1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dial: "44", flag: "🇬🇧" },
  { code: "CA", name: "Canada", dial: "1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dial: "61", flag: "🇦🇺" },
  { code: "AE", name: "United Arab Emirates", dial: "971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", dial: "966", flag: "🇸🇦" },
  { code: "QA", name: "Qatar", dial: "974", flag: "🇶🇦" },
  { code: "DE", name: "Germany", dial: "49", flag: "🇩🇪" },
  { code: "FR", name: "France", dial: "33", flag: "🇫🇷" },
  { code: "NL", name: "Netherlands", dial: "31", flag: "🇳🇱" },
];

export const DEFAULT_COUNTRY = COUNTRY_OPTIONS[0];

export const getCountryByCode = (code) =>
  COUNTRY_OPTIONS.find((c) => c.code === code) || null;