import twilio from "twilio";

const client =
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
  if (!client) {
    console.warn("Twilio not configured — skipping SMS");
    return;
  }

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: formatPhone(to),
  });
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
