import twilio from "twilio";

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55")) return `+${digits}`;
  if (digits.length === 11 || digits.length === 10) return `+55${digits}`;
  return `+${digits}`;
}

export async function sendSMS(to: string, message: string): Promise<void> {
  if (!twilioClient) {
    console.warn("Twilio not configured — skipping SMS");
    return;
  }

  await twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: formatPhone(to),
  });
}

export async function sendWhatsApp(to: string, message: string): Promise<void> {
  const url = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;

  if (!url || !apiKey || !instance) {
    console.warn("Evolution API not configured — skipping WhatsApp");
    return;
  }

  const number = formatPhone(to).replace("+", "");

  const response = await fetch(`${url}/message/sendText/${instance}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({ number, text: message }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Evolution API error ${response.status}: ${body}`);
  }
}

export function otpMessage(code: string): string {
  return `Seu código de verificação ED Barbearia é: *${code}*\nVálido por 10 minutos.`;
}

export function bookingConfirmationMessage(data: {
  customerName: string;
  serviceName: string;
  barberName: string;
  date: string;
  time: string;
}): string {
  return `Olá, ${data.customerName}! ✂️ Seu agendamento foi confirmado.\n\nServiço: ${data.serviceName}\nBarbeiro: ${data.barberName}\nData: ${data.date}\nHorário: ${data.time}\n\nAté lá!`;
}
