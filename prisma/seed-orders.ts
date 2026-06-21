import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const NAMES = [
  "Carlos Eduardo", "Rafael Souza", "Lucas Mendes", "Matheus Oliveira", "Gabriel Santos",
  "Felipe Costa", "Bruno Ferreira", "Thiago Alves", "Diego Lima", "André Carvalho",
  "Rodrigo Martins", "Gustavo Pereira", "Henrique Rocha", "Vinícius Nunes", "Leonardo Silva",
  "Pedro Gomes", "João Victor", "Caio Freitas", "Marcelo Ribeiro", "Alexandre Dias",
  "Danilo Correia", "Eduardo Fonseca", "Fábio Castro", "Igor Teixeira", "Júlio Barbosa",
  "Leandro Araújo", "Márcio Cardoso", "Nathan Moreira", "Otávio Pinto", "Paulo Leal",
  "Renato Batista", "Samuel Cunha", "Tiago Monteiro", "Ulisses Borges", "Wellington Cruz",
];

const PHONES = [
  "81999990001", "81999990002", "81999990003", "81999990004", "81999990005",
  "81999990006", "81999990007", "81999990008", "81999990009", "81999990010",
  "81999990011", "81999990012", "81999990013", "81999990014", "81999990015",
  "81999990016", "81999990017", "81999990018", "81999990019", "81999990020",
  "81999990021", "81999990022", "81999990023", "81999990024", "81999990025",
  "81999990026", "81999990027", "81999990028", "81999990029", "81999990030",
  "81999990031", "81999990032", "81999990033", "81999990034", "81999990035",
];

const STATUSES: ("PENDING" | "PAID" | "CANCELLED")[] = [
  "PAID", "PAID", "PAID", "PAID", "PAID",
  "PAID", "PAID", "PAID", "PAID", "PAID",
  "PAID", "PAID", "PAID", "PAID", "PAID",
  "PAID", "PAID", "PAID", "PAID", "PAID",
  "PENDING", "PENDING", "PENDING", "PENDING", "PENDING",
  "PENDING", "PENDING", "PENDING",
  "CANCELLED", "CANCELLED", "CANCELLED", "CANCELLED", "CANCELLED",
  "PAID", "PAID",
];

function randomDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, price: true } });
  if (products.length === 0) {
    console.error("No products found. Run the main seed first.");
    throw new Error("No products found");
  }

  for (let i = 0; i < 35; i++) {
    const count = Math.floor(Math.random() * 3) + 1;
    const picked = [...products].sort(() => Math.random() - 0.5).slice(0, count);
    const items = picked.map((p) => ({
      productId: p.id,
      quantity: Math.floor(Math.random() * 2) + 1,
      unitPrice: p.price,
    }));
    const total = items.reduce((sum, it) => sum + Number(it.unitPrice) * it.quantity, 0);

    await prisma.order.create({
      data: {
        customerName: NAMES[i],
        customerPhone: PHONES[i],
        status: STATUSES[i],
        total,
        createdAt: randomDate(60),
        items: { create: items },
      },
    });
  }

  console.log("✅ 35 fake orders created.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
