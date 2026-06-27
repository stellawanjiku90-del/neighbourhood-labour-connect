// Comprehensive global country list with mobile number lengths (digits after dial code).
// `length` = typical mobile subscriber number length used for placeholder + validation.
export const COUNTRY_OPTIONS = [
  // East Africa
  { code: "KE", name: "Kenya", dial: "254", flag: "🇰🇪", length: 9 },
  { code: "UG", name: "Uganda", dial: "256", flag: "🇺🇬", length: 9 },
  { code: "TZ", name: "Tanzania", dial: "255", flag: "🇹🇿", length: 9 },
  { code: "RW", name: "Rwanda", dial: "250", flag: "🇷🇼", length: 9 },
  { code: "ET", name: "Ethiopia", dial: "251", flag: "🇪🇹", length: 9 },
  { code: "BI", name: "Burundi", dial: "257", flag: "🇧🇮", length: 8 },
  { code: "SS", name: "South Sudan", dial: "211", flag: "🇸🇸", length: 9 },
  { code: "SO", name: "Somalia", dial: "252", flag: "🇸🇴", length: 8 },
  { code: "ER", name: "Eritrea", dial: "291", flag: "🇪🇷", length: 7 },
  { code: "DJ", name: "Djibouti", dial: "253", flag: "🇩🇯", length: 8 },

  // West Africa
  { code: "NG", name: "Nigeria", dial: "234", flag: "🇳🇬", length: 10 },
  { code: "GH", name: "Ghana", dial: "233", flag: "🇬🇭", length: 9 },
  { code: "CI", name: "Côte d'Ivoire", dial: "225", flag: "🇨🇮", length: 10 },
  { code: "SN", name: "Senegal", dial: "221", flag: "🇸🇳", length: 9 },
  { code: "ML", name: "Mali", dial: "223", flag: "🇲🇱", length: 8 },
  { code: "BF", name: "Burkina Faso", dial: "226", flag: "🇧🇫", length: 8 },
  { code: "NE", name: "Niger", dial: "227", flag: "🇳🇪", length: 8 },
  { code: "GN", name: "Guinea", dial: "224", flag: "🇬🇳", length: 9 },
  { code: "BJ", name: "Benin", dial: "229", flag: "🇧🇯", length: 8 },
  { code: "TG", name: "Togo", dial: "228", flag: "🇹🇬", length: 8 },
  { code: "SL", name: "Sierra Leone", dial: "232", flag: "🇸🇱", length: 8 },
  { code: "LR", name: "Liberia", dial: "231", flag: "🇱🇷", length: 8 },
  { code: "MR", name: "Mauritania", dial: "222", flag: "🇲🇷", length: 8 },
  { code: "GM", name: "Gambia", dial: "220", flag: "🇬🇲", length: 7 },
  { code: "GW", name: "Guinea-Bissau", dial: "245", flag: "🇬🇼", length: 9 },
  { code: "CV", name: "Cape Verde", dial: "238", flag: "🇨🇻", length: 7 },

  // Central Africa
  { code: "CM", name: "Cameroon", dial: "237", flag: "🇨🇲", length: 9 },
  { code: "CD", name: "DR Congo", dial: "243", flag: "🇨🇩", length: 9 },
  { code: "CG", name: "Congo", dial: "242", flag: "🇨🇬", length: 9 },
  { code: "CF", name: "Central African Republic", dial: "236", flag: "🇨🇫", length: 8 },
  { code: "TD", name: "Chad", dial: "235", flag: "🇹🇩", length: 8 },
  { code: "GQ", name: "Equatorial Guinea", dial: "240", flag: "🇬🇶", length: 9 },
  { code: "GA", name: "Gabon", dial: "241", flag: "🇬🇦", length: 8 },
  { code: "ST", name: "São Tomé & Príncipe", dial: "239", flag: "🇸🇹", length: 7 },

  // Southern Africa
  { code: "ZA", name: "South Africa", dial: "27", flag: "🇿🇦", length: 9 },
  { code: "ZM", name: "Zambia", dial: "260", flag: "🇿🇲", length: 9 },
  { code: "ZW", name: "Zimbabwe", dial: "263", flag: "🇿🇼", length: 9 },
  { code: "MW", name: "Malawi", dial: "265", flag: "🇲🇼", length: 9 },
  { code: "MZ", name: "Mozambique", dial: "258", flag: "🇲🇿", length: 9 },
  { code: "BW", name: "Botswana", dial: "267", flag: "🇧🇼", length: 8 },
  { code: "NA", name: "Namibia", dial: "264", flag: "🇳🇦", length: 9 },
  { code: "LS", name: "Lesotho", dial: "266", flag: "🇱🇸", length: 8 },
  { code: "SZ", name: "Eswatini", dial: "268", flag: "🇸🇿", length: 8 },
  { code: "AO", name: "Angola", dial: "244", flag: "🇦🇴", length: 9 },
  { code: "MG", name: "Madagascar", dial: "261", flag: "🇲🇬", length: 9 },
  { code: "MU", name: "Mauritius", dial: "230", flag: "🇲🇺", length: 8 },

  // North Africa
  { code: "EG", name: "Egypt", dial: "20", flag: "🇪🇬", length: 10 },
  { code: "MA", name: "Morocco", dial: "212", flag: "🇲🇦", length: 9 },
  { code: "DZ", name: "Algeria", dial: "213", flag: "🇩🇿", length: 9 },
  { code: "TN", name: "Tunisia", dial: "216", flag: "🇹🇳", length: 8 },
  { code: "LY", name: "Libya", dial: "218", flag: "🇱🇾", length: 9 },
  { code: "SD", name: "Sudan", dial: "249", flag: "🇸🇩", length: 9 },

  // Middle East
  { code: "SA", name: "Saudi Arabia", dial: "966", flag: "🇸🇦", length: 9 },
  { code: "AE", name: "United Arab Emirates", dial: "971", flag: "🇦🇪", length: 9 },
  { code: "QA", name: "Qatar", dial: "974", flag: "🇶🇦", length: 8 },
  { code: "KW", name: "Kuwait", dial: "965", flag: "🇰🇼", length: 8 },
  { code: "BH", name: "Bahrain", dial: "973", flag: "🇧🇭", length: 8 },
  { code: "OM", name: "Oman", dial: "968", flag: "🇴🇲", length: 8 },
  { code: "YE", name: "Yemen", dial: "967", flag: "🇾🇪", length: 9 },
  { code: "JO", name: "Jordan", dial: "962", flag: "🇯🇴", length: 9 },
  { code: "LB", name: "Lebanon", dial: "961", flag: "🇱🇧", length: 8 },
  { code: "IQ", name: "Iraq", dial: "964", flag: "🇮🇶", length: 10 },
  { code: "SY", name: "Syria", dial: "963", flag: "🇸🇾", length: 9 },
  { code: "IR", name: "Iran", dial: "98", flag: "🇮🇷", length: 10 },
  { code: "IL", name: "Israel", dial: "972", flag: "🇮🇱", length: 9 },
  { code: "PS", name: "Palestine", dial: "970", flag: "🇵🇸", length: 9 },
  { code: "AF", name: "Afghanistan", dial: "93", flag: "🇦🇫", length: 9 },

  // South Asia
  { code: "IN", name: "India", dial: "91", flag: "🇮🇳", length: 10 },
  { code: "PK", name: "Pakistan", dial: "92", flag: "🇵🇰", length: 10 },
  { code: "BD", name: "Bangladesh", dial: "880", flag: "🇧🇩", length: 10 },
  { code: "LK", name: "Sri Lanka", dial: "94", flag: "🇱🇰", length: 9 },
  { code: "NP", name: "Nepal", dial: "977", flag: "🇳🇵", length: 10 },
  { code: "BT", name: "Bhutan", dial: "975", flag: "🇧🇹", length: 8 },
  { code: "MV", name: "Maldives", dial: "960", flag: "🇲🇻", length: 7 },

  // Southeast Asia
  { code: "ID", name: "Indonesia", dial: "62", flag: "🇮🇩", length: 10 },
  { code: "PH", name: "Philippines", dial: "63", flag: "🇵🇭", length: 10 },
  { code: "VN", name: "Vietnam", dial: "84", flag: "🇻🇳", length: 9 },
  { code: "TH", name: "Thailand", dial: "66", flag: "🇹🇭", length: 9 },
  { code: "MY", name: "Malaysia", dial: "60", flag: "🇲🇾", length: 9 },
  { code: "SG", name: "Singapore", dial: "65", flag: "🇸🇬", length: 8 },
  { code: "MM", name: "Myanmar", dial: "95", flag: "🇲🇲", length: 9 },
  { code: "KH", name: "Cambodia", dial: "855", flag: "🇰🇭", length: 9 },
  { code: "LA", name: "Laos", dial: "856", flag: "🇱🇦", length: 9 },
  { code: "BN", name: "Brunei", dial: "673", flag: "🇧🇳", length: 7 },
  { code: "TL", name: "Timor-Leste", dial: "670", flag: "🇹🇱", length: 8 },

  // East Asia
  { code: "CN", name: "China", dial: "86", flag: "🇨🇳", length: 11 },
  { code: "JP", name: "Japan", dial: "81", flag: "🇯🇵", length: 10 },
  { code: "KR", name: "South Korea", dial: "82", flag: "🇰🇷", length: 10 },
  { code: "TW", name: "Taiwan", dial: "886", flag: "🇹🇼", length: 9 },
  { code: "HK", name: "Hong Kong", dial: "852", flag: "🇭🇰", length: 8 },
  { code: "MO", name: "Macau", dial: "853", flag: "🇲🇴", length: 8 },
  { code: "MN", name: "Mongolia", dial: "976", flag: "🇲🇳", length: 8 },

  // Central Asia
  { code: "KZ", name: "Kazakhstan", dial: "7", flag: "🇰🇿", length: 10 },
  { code: "UZ", name: "Uzbekistan", dial: "998", flag: "🇺🇿", length: 9 },
  { code: "KG", name: "Kyrgyzstan", dial: "996", flag: "🇰🇬", length: 9 },
  { code: "TJ", name: "Tajikistan", dial: "992", flag: "🇹🇯", length: 9 },
  { code: "TM", name: "Turkmenistan", dial: "993", flag: "🇹🇲", length: 8 },

  // Europe (Western)
  { code: "GB", name: "United Kingdom", dial: "44", flag: "🇬🇧", length: 10 },
  { code: "IE", name: "Ireland", dial: "353", flag: "🇮🇪", length: 9 },
  { code: "FR", name: "France", dial: "33", flag: "🇫🇷", length: 9 },
  { code: "DE", name: "Germany", dial: "49", flag: "🇩🇪", length: 11 },
  { code: "IT", name: "Italy", dial: "39", flag: "🇮🇹", length: 10 },
  { code: "ES", name: "Spain", dial: "34", flag: "🇪🇸", length: 9 },
  { code: "PT", name: "Portugal", dial: "351", flag: "🇵🇹", length: 9 },
  { code: "NL", name: "Netherlands", dial: "31", flag: "🇳🇱", length: 9 },
  { code: "BE", name: "Belgium", dial: "32", flag: "🇧🇪", length: 9 },
  { code: "LU", name: "Luxembourg", dial: "352", flag: "🇱🇺", length: 8 },
  { code: "AT", name: "Austria", dial: "43", flag: "🇦🇹", length: 11 },
  { code: "CH", name: "Switzerland", dial: "41", flag: "🇨🇭", length: 9 },
  { code: "LI", name: "Liechtenstein", dial: "423", flag: "🇱🇮", length: 7 },
  { code: "MC", name: "Monaco", dial: "377", flag: "🇲🇨", length: 8 },
  { code: "AD", name: "Andorra", dial: "376", flag: "🇦🇩", length: 6 },
  { code: "SM", name: "San Marino", dial: "378", flag: "🇸🇲", length: 9 },

  // Europe (Nordic)
  { code: "SE", name: "Sweden", dial: "46", flag: "🇸🇪", length: 9 },
  { code: "NO", name: "Norway", dial: "47", flag: "🇳🇴", length: 8 },
  { code: "DK", name: "Denmark", dial: "45", flag: "🇩🇰", length: 8 },
  { code: "FI", name: "Finland", dial: "358", flag: "🇫🇮", length: 9 },
  { code: "IS", name: "Iceland", dial: "354", flag: "🇮🇸", length: 7 },

  // Europe (Central/Eastern)
  { code: "PL", name: "Poland", dial: "48", flag: "🇵🇱", length: 9 },
  { code: "CZ", name: "Czechia", dial: "420", flag: "🇨🇿", length: 9 },
  { code: "SK", name: "Slovakia", dial: "421", flag: "🇸🇰", length: 9 },
  { code: "HU", name: "Hungary", dial: "36", flag: "🇭🇺", length: 9 },
  { code: "RO", name: "Romania", dial: "40", flag: "🇷🇴", length: 9 },
  { code: "BG", name: "Bulgaria", dial: "359", flag: "🇧🇬", length: 9 },
  { code: "GR", name: "Greece", dial: "30", flag: "🇬🇷", length: 10 },
  { code: "HR", name: "Croatia", dial: "385", flag: "🇭🇷", length: 9 },
  { code: "RS", name: "Serbia", dial: "381", flag: "🇷🇸", length: 9 },
  { code: "SI", name: "Slovenia", dial: "386", flag: "🇸🇮", length: 8 },
  { code: "BA", name: "Bosnia & Herzegovina", dial: "387", flag: "🇧🇦", length: 8 },
  { code: "MK", name: "North Macedonia", dial: "389", flag: "🇲🇰", length: 8 },
  { code: "ME", name: "Montenegro", dial: "382", flag: "🇲🇪", length: 8 },
  { code: "AL", name: "Albania", dial: "355", flag: "🇦🇱", length: 9 },
  { code: "EE", name: "Estonia", dial: "372", flag: "🇪🇪", length: 8 },
  { code: "LV", name: "Latvia", dial: "371", flag: "🇱🇻", length: 8 },
  { code: "LT", name: "Lithuania", dial: "370", flag: "🇱🇹", length: 8 },
  { code: "BY", name: "Belarus", dial: "375", flag: "🇧🇾", length: 9 },
  { code: "UA", name: "Ukraine", dial: "380", flag: "🇺🇦", length: 9 },
  { code: "MD", name: "Moldova", dial: "373", flag: "🇲🇩", length: 8 },
  { code: "RU", name: "Russia", dial: "7", flag: "🇷🇺", length: 10 },
  { code: "GE", name: "Georgia", dial: "995", flag: "🇬🇪", length: 9 },
  { code: "AM", name: "Armenia", dial: "374", flag: "🇦🇲", length: 8 },
  { code: "AZ", name: "Azerbaijan", dial: "994", flag: "🇦🇿", length: 9 },
  { code: "TR", name: "Turkey", dial: "90", flag: "🇹🇷", length: 10 },
  { code: "CY", name: "Cyprus", dial: "357", flag: "🇨🇾", length: 8 },
  { code: "MT", name: "Malta", dial: "356", flag: "🇲🇹", length: 8 },

  // North America
  { code: "US", name: "United States", dial: "1", flag: "🇺🇸", length: 10 },
  { code: "CA", name: "Canada", dial: "1", flag: "🇨🇦", length: 10 },
  { code: "MX", name: "Mexico", dial: "52", flag: "🇲🇽", length: 10 },

  // Central America & Caribbean
  { code: "GT", name: "Guatemala", dial: "502", flag: "🇬🇹", length: 8 },
  { code: "HN", name: "Honduras", dial: "504", flag: "🇭🇳", length: 8 },
  { code: "SV", name: "El Salvador", dial: "503", flag: "🇸🇻", length: 8 },
  { code: "NI", name: "Nicaragua", dial: "505", flag: "🇳🇮", length: 8 },
  { code: "CR", name: "Costa Rica", dial: "506", flag: "🇨🇷", length: 8 },
  { code: "PA", name: "Panama", dial: "507", flag: "🇵🇦", length: 8 },
  { code: "CU", name: "Cuba", dial: "53", flag: "🇨🇺", length: 8 },
  { code: "DO", name: "Dominican Republic", dial: "1", flag: "🇩🇴", length: 10 },
  { code: "HT", name: "Haiti", dial: "509", flag: "🇭🇹", length: 8 },
  { code: "JM", name: "Jamaica", dial: "1", flag: "🇯🇲", length: 10 },
  { code: "TT", name: "Trinidad & Tobago", dial: "1", flag: "🇹🇹", length: 10 },
  { code: "BS", name: "Bahamas", dial: "1", flag: "🇧🇸", length: 10 },
  { code: "BB", name: "Barbados", dial: "1", flag: "🇧🇧", length: 10 },

  // South America
  { code: "BR", name: "Brazil", dial: "55", flag: "🇧🇷", length: 11 },
  { code: "AR", name: "Argentina", dial: "54", flag: "🇦🇷", length: 10 },
  { code: "CO", name: "Colombia", dial: "57", flag: "🇨🇴", length: 10 },
  { code: "CL", name: "Chile", dial: "56", flag: "🇨🇱", length: 9 },
  { code: "PE", name: "Peru", dial: "51", flag: "🇵🇪", length: 9 },
  { code: "VE", name: "Venezuela", dial: "58", flag: "🇻🇪", length: 10 },
  { code: "EC", name: "Ecuador", dial: "593", flag: "🇪🇨", length: 9 },
  { code: "BO", name: "Bolivia", dial: "591", flag: "🇧🇴", length: 8 },
  { code: "PY", name: "Paraguay", dial: "595", flag: "🇵🇾", length: 9 },
  { code: "UY", name: "Uruguay", dial: "598", flag: "🇺🇾", length: 8 },
  { code: "GY", name: "Guyana", dial: "592", flag: "🇬🇾", length: 7 },
  { code: "SR", name: "Suriname", dial: "597", flag: "🇸🇷", length: 7 },

  // Oceania
  { code: "AU", name: "Australia", dial: "61", flag: "🇦🇺", length: 9 },
  { code: "NZ", name: "New Zealand", dial: "64", flag: "🇳🇿", length: 9 },
  { code: "PG", name: "Papua New Guinea", dial: "675", flag: "🇵🇬", length: 8 },
  { code: "FJ", name: "Fiji", dial: "679", flag: "🇫🇯", length: 7 },
  { code: "SB", name: "Solomon Islands", dial: "677", flag: "🇸🇧", length: 7 },
  { code: "VU", name: "Vanuatu", dial: "678", flag: "🇻🇺", length: 7 },
  { code: "WS", name: "Samoa", dial: "685", flag: "🇼🇸", length: 7 },
  { code: "TO", name: "Tonga", dial: "676", flag: "🇹🇴", length: 7 },
  { code: "KI", name: "Kiribati", dial: "686", flag: "🇰🇮", length: 5 },
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