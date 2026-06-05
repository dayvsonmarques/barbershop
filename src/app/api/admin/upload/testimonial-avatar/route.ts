import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guards";
import { unlink } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "testimonials");

export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, "testimonials", "create");
  if (auth instanceof NextResponse) return auth;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Invalid type. Allowed: JPEG, PNG, WebP" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 5 MB limit" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${randomUUID()}.webp`;
    const filepath = join(UPLOAD_DIR, filename);

    await sharp(buffer)
      .resize(200, 200, { fit: "cover" })
      .webp({ quality: 85 })
      .toFile(filepath);

    return NextResponse.json({ url: `/uploads/testimonials/${filename}` });
  } catch (error) {
    console.error("Error processing avatar upload:", error);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePermission(request, "testimonials", "delete");
  if (auth instanceof NextResponse) return auth;

  const filePath = new URL(request.url).searchParams.get("file") ?? "";

  if (!filePath.startsWith("/uploads/testimonials/") || filePath.includes("..")) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  try {
    await unlink(join(process.cwd(), "public", filePath));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
