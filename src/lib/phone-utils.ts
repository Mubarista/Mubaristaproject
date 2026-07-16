export const COUNTRY_CODES = [
  "+250",
  "+1",
  "+7",
  "+20",
  "+27",
  "+30",
  "+31",
  "+32",
  "+33",
  "+34",
  "+36",
  "+39",
  "+40",
  "+41",
  "+42",
  "+43",
  "+44",
  "+45",
  "+46",
  "+47",
  "+48",
  "+49",
  "+51",
  "+52",
  "+53",
  "+54",
  "+55",
  "+56",
  "+57",
  "+58",
  "+60",
  "+61",
  "+62",
  "+63",
  "+64",
  "+65",
  "+66",
  "+81",
  "+82",
  "+84",
  "+86",
  "+90",
  "+91",
  "+92",
  "+93",
  "+94",
  "+95",
  "+98",
  "+211",
  "+212",
  "+213",
  "+216",
  "+218",
  "+220",
  "+221",
  "+222",
  "+223",
  "+224",
  "+225",
  "+226",
  "+227",
  "+228",
  "+229",
  "+230",
  "+231",
  "+232",
  "+233",
  "+234",
  "+235",
  "+236",
  "+237",
  "+238",
  "+239",
  "+240",
  "+241",
  "+242",
  "+243",
  "+244",
  "+245",
  "+246",
  "+247",
  "+248",
  "+249",
  "+251",
  "+252",
  "+253",
  "+254",
  "+255",
  "+256",
  "+257",
  "+258",
  "+260",
  "+261",
  "+262",
  "+263",
  "+264",
  "+265",
  "+266",
  "+267",
  "+268",
  "+269",
  "+290",
  "+291",
  "+297",
  "+298",
  "+299",
  "+350",
  "+351",
  "+352",
  "+353",
  "+354",
  "+355",
  "+356",
  "+357",
  "+358",
  "+359",
  "+370",
  "+371",
  "+372",
  "+373",
  "+374",
  "+375",
  "+376",
  "+377",
  "+378",
  "+379",
  "+380",
  "+381",
  "+382",
  "+383",
  "+385",
  "+386",
  "+387",
  "+389",
  "+420",
  "+421",
  "+423",
  "+500",
  "+501",
  "+502",
  "+503",
  "+504",
  "+505",
  "+506",
  "+507",
  "+508",
  "+509",
  "+590",
  "+591",
  "+592",
  "+593",
  "+594",
  "+595",
  "+596",
  "+597",
  "+598",
  "+599",
  "+670",
  "+672",
  "+673",
  "+674",
  "+675",
  "+676",
  "+677",
  "+678",
  "+679",
  "+680",
  "+681",
  "+682",
  "+683",
  "+684",
  "+685",
  "+686",
  "+687",
  "+688",
  "+689",
  "+690",
  "+691",
  "+692",
  "+693",
  "+694",
  "+695",
  "+696",
  "+697",
  "+698",
  "+699",
  "+850",
  "+852",
  "+853",
  "+855",
  "+856",
  "+880",
  "+886",
  "+960",
  "+961",
  "+962",
  "+963",
  "+964",
  "+965",
  "+966",
  "+967",
  "+968",
  "+970",
  "+971",
  "+972",
  "+973",
  "+974",
  "+975",
  "+976",
  "+977",
  "+992",
  "+993",
  "+994",
  "+995",
  "+996",
  "+998",
  "+1242",
  "+1246",
  "+1264",
  "+1268",
  "+1284",
  "+1340",
  "+1345",
  "+1441",
  "+1473",
  "+1649",
  "+1664",
  "+1670",
  "+1671",
  "+1684",
  "+1721",
  "+1758",
  "+1767",
  "+1784",
  "+1787",
  "+1809",
  "+1829",
  "+1849",
  "+1868",
  "+1869",
  "+1876",
  "+1939",
] as const;

const SORTED_BY_LENGTH = [...COUNTRY_CODES].sort((a, b) => {
  if (a.length !== b.length) return b.length - a.length;
  return parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10);
});

export interface PhoneParseResult {
  countryCode: string;
  localNumber: string;
  matched: boolean;
}

export interface PhoneValidationResult {
  valid: boolean;
  error?: string;
}

export function parsePhoneValue(value: string): PhoneParseResult {
  const digits = (value || "").replace(/\D/g, "");

  for (const code of SORTED_BY_LENGTH) {
    const codeDigits = code.slice(1);
    if (digits.startsWith(codeDigits)) {
      return {
        countryCode: codeDigits,
        localNumber: digits.slice(codeDigits.length),
        matched: true,
      };
    }
  }

  return {
    countryCode: "250",
    localNumber: digits,
    matched: false,
  };
}

export function validatePhoneNumber(phone: string): PhoneValidationResult {
  const trimmed = (phone || "").trim();

  if (!trimmed) {
    return { valid: false, error: "Phone number is required" };
  }

  if (!trimmed.startsWith("+")) {
    return {
      valid: false,
      error: "Phone number must start with + and include a country code",
    };
  }

  const parsed = parsePhoneValue(trimmed);

  if (!parsed.matched) {
    return {
      valid: false,
      error: "Phone number must use a valid country code",
    };
  }

  if (!parsed.localNumber || parsed.localNumber.length < 1) {
    return {
      valid: false,
      error: "Phone number must include a local number",
    };
  }

  if (parsed.localNumber.length > 9) {
    return {
      valid: false,
      error: "Phone number local number must not exceed 9 digits",
    };
  }

  return { valid: true };
}
