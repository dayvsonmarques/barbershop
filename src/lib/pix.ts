// EMVCo TLV PIX BR Code generator

export type GeneratePixCodeParams = {
  pixKey: string;
  amount: number;
  merchantName: string;
  merchantCity: string;
  txId?: string;
};

function tlv(id: string, value: string): string {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function generatePixCode({
  pixKey,
  amount,
  merchantName,
  merchantCity,
  txId = "***",
}: GeneratePixCodeParams): string {
  // ID 00: Payload format indicator
  const payloadFormatIndicator = tlv("00", "01");

  // ID 26: Merchant account information (PIX)
  const gui = tlv("00", "BR.GOV.BCB.PIX");
  const key = tlv("01", pixKey);
  const merchantAccountInfo = tlv("26", gui + key);

  // ID 52: Merchant category code
  const merchantCategoryCode = tlv("52", "0000");

  // ID 53: Transaction currency (986 = BRL)
  const transactionCurrency = tlv("53", "986");

  // ID 54: Transaction amount
  const amountStr = amount.toFixed(2);
  const transactionAmount = tlv("54", amountStr);

  // ID 58: Country code
  const countryCode = tlv("58", "BR");

  // ID 59: Merchant name (max 25 chars)
  const safeName = merchantName.slice(0, 25);
  const merchantNameField = tlv("59", safeName);

  // ID 60: Merchant city (max 15 chars)
  const safeCity = merchantCity.slice(0, 15);
  const merchantCityField = tlv("60", safeCity);

  // ID 62: Additional data field template
  const safeTxId = (txId || "***").slice(0, 25);
  const referenceLabel = tlv("05", safeTxId);
  const additionalData = tlv("62", referenceLabel);

  // Assemble payload without CRC
  const payload =
    payloadFormatIndicator +
    merchantAccountInfo +
    merchantCategoryCode +
    transactionCurrency +
    transactionAmount +
    countryCode +
    merchantNameField +
    merchantCityField +
    additionalData +
    "6304"; // ID 63 for CRC, length 04

  const checksum = crc16(payload);
  return payload + checksum;
}
