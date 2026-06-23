import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsApp, sendSMS, otpMessage } from "@/lib/sms";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  phone: z.string().min(10, "Número inválido").max(20),
  channel: z.enum(["whatsapp", "sms"]).default("whatsapp"),
});

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { phone, channel } = parsed.data;

  // 3 OTPs per phone per 10 minutes — prevents WhatsApp spam
  const rl = checkRateLimit(`otp:${phone.replace(/\D/g, "")}`, { maxRequests: 3, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await prisma.phoneOtp.create({ data: { phone, code, expiresAt } });

  if (channel === "sms") {
    await sendSMS(phone, otpMessage(code));
  } else {
    await sendWhatsApp(phone, otpMessage(code));
  }

  return NextResponse.json({ ok: true });
}
