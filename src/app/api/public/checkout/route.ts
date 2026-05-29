import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validations/checkout";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = checkoutSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.error.issues },
      { status: 400 }
    );
  }

  const { customerName, customerPhone, items } = validation.data;

  // Pre-check: products exist and are active
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Produto ${item.productId} não encontrado` },
        { status: 400 }
      );
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `Estoque insuficiente para "${product.name}"` },
        { status: 400 }
      );
    }
  }

  const total = items.reduce((sum, item) => {
    const p = products.find((x) => x.id === item.productId)!;
    return sum + Number(p.discountPrice ?? p.price) * item.quantity;
  }, 0);

  const settings = await prisma.establishmentSettings.findUnique({ where: { id: 1 } });

  // Atomic: decrement stock + create order in one transaction
  let order: { id: number };
  try {
    order = await prisma.$transaction(async (tx) => {
      // Atomically decrement stock with a lower-bound guard
      for (const item of items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          const p = products.find((x) => x.id === item.productId)!;
          throw new Error(`STOCK_INSUFFICIENT:${p.name}`);
        }
      }

      return tx.order.create({
        data: {
          customerName,
          customerPhone,
          total,
          items: {
            create: items.map((item) => {
              const p = products.find((x) => x.id === item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: Number(p.discountPrice ?? p.price),
              };
            }),
          },
        },
      });
    });
  } catch (err: any) {
    if (err.message?.startsWith("STOCK_INSUFFICIENT:")) {
      const name = err.message.replace("STOCK_INSUFFICIENT:", "");
      return NextResponse.json(
        { error: `Estoque insuficiente para "${name}"` },
        { status: 409 }
      );
    }
    throw err;
  }

  return NextResponse.json({
    orderId: order.id,
    total,
    pixKey: settings?.pixKey ?? "",
    storeName: settings?.name ?? "ED Barbearia",
    merchantCity: settings?.address?.split(",")[1]?.trim().split("—")[0]?.trim() ?? "Recife",
  });
}
