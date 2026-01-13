import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requestPasswordResetSchema } from "@/lib/validations";
import { generateResetToken } from "@/lib/auth";
import { sendEmail, generatePasswordResetEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimit = checkRateLimit(`password-reset:${ip}`, {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente mais tarde." },
        { status: 429 }
      );
    }

    // Validate input
    const validation = requestPasswordResetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    // Don't reveal if user exists (security best practice)
    if (!user) {
      return NextResponse.json({
        message: "Se o e-mail existir, você receberá instruções para redefinir sua senha.",
      });
    }

    // Generate reset token
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send email
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Recuperação de Senha - ED Barbearia",
        html: generatePasswordResetEmail(resetUrl, user.name),
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: "Se o e-mail existir, você receberá instruções para redefinir sua senha.",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
