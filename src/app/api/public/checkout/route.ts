import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validations/checkout";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = checkoutSchema.parse(body);

    // Fetch all products to validate stock
    const productIds = validated.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, name: true, price: true, discountPrice: true, stock: true },
    });

    // Check all products exist and have sufficient stock
    for (const item of validated.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Produto #${item.productId} não encontrado ou inativo` },
          { status: 404 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Estoque insuficiente para "${product.name}"` },
          { status: 409 }
        );
      }
    }

    // Calculate total
    const total = validated.items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const unitPrice = Number(product.discountPrice ?? product.price);
      return sum + unitPrice * item.quantity;
    }, 0);

    // Create order and items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerName: validated.customerName,
          customerPhone: validated.customerPhone,
          total,
          status: "PENDING",
          items: {
            create: validated.items.map((item) => {
              const product = products.find((p) => p.id === item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: Number(product.discountPrice ?? product.price),
              };
            }),
          },
        },
      });
      return newOrder;
    });

    // Fetch store settings for PIX key and store name
    const settings = await prisma.establishmentSettings.findUnique({
      where: { id: 1 },
      select: { name: true, pixKey: true, address: true },
    });

    return NextResponse.json(
      {
        orderId: order.id,
        total,
        pixKey: settings?.pixKey ?? null,
        storeName: settings?.name ?? "ED Barbearia",
        merchantCity: extractCity(settings?.address ?? "Recife"),
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Checkout error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Erro ao processar pedido" }, { status: 500 });
  }
}

function extractCity(address: string): string {
  // Attempt to extract city from address string like "Rua X, Recife - PE"
  const match = address.match(/,\s*([^,-]+)(?:\s*-|$)/);
  if (match) return match[1].trim().slice(0, 15);
  return address.slice(0, 15);
}
