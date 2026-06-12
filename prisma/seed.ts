import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── helpers ────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedHour(): number {
  // Peak: 9h-12h (weight 4), 14h-18h (weight 5), off-peak lower weight
  const slots = [
    ...Array(2).fill(8),
    ...Array(4).fill(9),
    ...Array(4).fill(10),
    ...Array(4).fill(11),
    ...Array(3).fill(12),
    ...Array(2).fill(13),
    ...Array(5).fill(14),
    ...Array(5).fill(15),
    ...Array(5).fill(16),
    ...Array(4).fill(17),
    ...Array(2).fill(18),
    ...Array(1).fill(19),
  ];
  return pick(slots);
}

function randomWorkdayOffset(maxDaysBack: number): number {
  // Pick a random offset, but re-roll until it's a workday (Mon-Sat)
  // Weight: Fri=3x, Sat=3x, Mon-Thu=1x each
  for (let attempt = 0; attempt < 50; attempt++) {
    const offset = Math.floor(Math.random() * maxDaysBack);
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const dow = d.getDay(); // 0=sun
    if (dow === 0) continue; // skip sunday
    // extra weight for fri (5) and sat (6)
    if (dow === 5 || dow === 6) return offset;
    if (dow === 5 || dow === 6) return offset;
    if (dow === 5 || dow === 6) return offset;
    return offset;
  }
  // fallback: find nearest monday from a random offset
  const offset = Math.floor(Math.random() * maxDaysBack);
  const d = new Date();
  d.setDate(d.getDate() - offset);
  while (d.getDay() === 0) d.setDate(d.getDate() - 1);
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

const CUSTOMER_NAMES = [
  "Carlos Almeida", "Rafael Souza", "Lucas Ferreira", "Mateus Lima",
  "Gabriel Oliveira", "Pedro Costa", "Thiago Santos", "Bruno Rodrigues",
  "Vinícius Pereira", "Henrique Moura", "Felipe Barbosa", "Diego Carvalho",
  "Eduardo Lopes", "Marcelo Ribeiro", "André Martins", "Rodrigo Pinto",
  "Fernando Silva", "Ricardo Nunes", "Leandro Castro", "Gustavo Araújo",
  "João Victor", "Alex Mendes", "Patrick Vieira", "Cauã Braga",
  "Igor Ramos", "Marcos Egito", "Pato Marques", "Vinícius Lopes",
  "Mateus Willis", "Adriano Campos", "Silvio Borges", "Renato Freitas",
  "Fábio Cunha", "Gilberto Nogueira", "Sérgio Monteiro", "Cláudio Teixeira",
  "Wellington Alves", "Nathan Correia", "Kaique Melo", "Samuel Torres",
  "Davi Nascimento", "Isac Rocha", "Yago Figueiredo", "Enzo Cardoso",
  "Arthur Medeiros", "Cauê Soares", "Nícolas Batista", "Cristian Azevedo",
  "Hudson Domingues", "Robson Gomes",
];

const CUSTOMER_PHONES = CUSTOMER_NAMES.map(
  (_, i) => `(81) 9${String(9000 + i * 13).padStart(4, "0")}-${String(1000 + i * 37).padStart(4, "0")}`
);

async function main() {
  console.log("🌱 Starting database seed...");

  await prisma.$executeRaw`TRUNCATE TABLE "users", "groups", "permissions", "user_groups", "group_permissions", "password_resets", "service_categories", "services", "barbers", "barber_availability", "availability_exceptions", "bookings", "product_categories", "products", "courses", "establishment_settings", "testimonials" CASCADE`;

  // ============================================
  // 1. PERMISSIONS
  // ============================================
  console.log("📋 Creating permissions...");

  const resources = ["users", "groups", "barbers", "services", "bookings", "products", "courses", "settings", "testimonials"];
  const actions = ["view", "create", "update", "delete"];

  const permissions = [];
  for (const resource of resources) {
    for (const action of actions) {
      permissions.push({
        resource,
        action,
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`,
      });
    }
  }

  await prisma.permission.createMany({ data: permissions });

  // ============================================
  // 2. GROUPS
  // ============================================
  console.log("👥 Creating groups...");

  const adminGroup = await prisma.group.create({
    data: { name: "Administrador", description: "Acesso total ao sistema" },
  });
  const receptionistGroup = await prisma.group.create({
    data: { name: "Recepcionista", description: "Gerenciamento de agendamentos e clientes" },
  });
  const barberGroup = await prisma.group.create({
    data: { name: "Barbeiro", description: "Visualização de agendamentos próprios" },
  });

  // ============================================
  // 3. GROUP PERMISSIONS
  // ============================================
  console.log("🔐 Assigning permissions to groups...");

  const allPermissions = await prisma.permission.findMany();
  await prisma.groupPermission.createMany({
    data: allPermissions.map((p) => ({ groupId: adminGroup.id, permissionId: p.id })),
  });

  const receptionistPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { resource: "bookings" },
        { resource: "barbers" },
        { resource: "services" },
        { resource: "products", action: "view" },
      ],
    },
  });
  await prisma.groupPermission.createMany({
    data: receptionistPermissions.map((p) => ({ groupId: receptionistGroup.id, permissionId: p.id })),
  });

  const barberPermissions = await prisma.permission.findMany({
    where: { resource: "bookings", action: "view" },
  });
  await prisma.groupPermission.createMany({
    data: barberPermissions.map((p) => ({ groupId: barberGroup.id, permissionId: p.id })),
  });

  // ============================================
  // 4. USERS
  // ============================================
  console.log("👤 Creating users...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  const adminUser = await prisma.user.create({
    data: { email: "edmilson.barbearia7@gmail.com", password: hashedPassword, name: "Edmilson Rodrigues" },
  });
  const receptionistUser = await prisma.user.create({
    data: { email: "recepcao@edbarbearia.com", password: hashedPassword, name: "Recepcionista" },
  });

  await prisma.userGroup.createMany({
    data: [
      { userId: adminUser.id, groupId: adminGroup.id },
      { userId: receptionistUser.id, groupId: receptionistGroup.id },
    ],
  });

  // ============================================
  // 5. SERVICE CATEGORIES & SERVICES
  // ============================================
  console.log("✂️ Creating service categories and services...");

  const catCorte = await prisma.serviceCategory.create({ data: { name: "Corte", description: "Cortes masculinos e infantil" } });
  const catBarba = await prisma.serviceCategory.create({ data: { name: "Barba", description: "Serviços de barba e barboterapia" } });
  const catCombo = await prisma.serviceCategory.create({ data: { name: "Combo", description: "Pacotes combinados com desconto" } });
  const catTratamento = await prisma.serviceCategory.create({ data: { name: "Tratamento", description: "Hidratação, botox e cuidados capilares" } });
  const catEstetica = await prisma.serviceCategory.create({ data: { name: "Estética", description: "Sobrancelha e cuidados com a aparência" } });

  const services = await prisma.$transaction([
    prisma.service.create({ data: { categoryId: catCorte.id,     name: "Corte de Cabelo",       description: "", duration: 30, price: 50.0  } }),
    prisma.service.create({ data: { categoryId: catCorte.id,     name: "Corte Infantil",         description: "", duration: 50, price: 50.0  } }),
    prisma.service.create({ data: { categoryId: catBarba.id,     name: "Barba Simples",           description: "", duration: 30, price: 35.0  } }),
    prisma.service.create({ data: { categoryId: catBarba.id,     name: "Barboterapia",            description: "", duration: 30, price: 50.0  } }),
    prisma.service.create({ data: { categoryId: catCombo.id,     name: "Corte + Barba",           description: "", duration: 50, price: 80.0  } }),
    prisma.service.create({ data: { categoryId: catCombo.id,     name: "Corte + Barboterapia",    description: "", duration: 60, price: 90.0  } }),
    prisma.service.create({ data: { categoryId: catCombo.id,     name: "Corte + Sobrancelha",     description: "", duration: 40, price: 65.0  } }),
    prisma.service.create({ data: { categoryId: catCombo.id,     name: "Corte + Hidratação",      description: "", duration: 60, price: 70.0  } }),
    prisma.service.create({ data: { categoryId: catTratamento.id, name: "Hidratação Capilar",     description: "", duration: 40, price: 50.0  } }),
    prisma.service.create({ data: { categoryId: catTratamento.id, name: "Botox Capilar",          description: "", duration: 50, price: 100.0 } }),
    prisma.service.create({ data: { categoryId: catEstetica.id,  name: "Design de Sobrancelha",   description: "", duration: 20, price: 20.0  } }),
  ]);

  // Service weights: corte > combo >> others (realistic distribution)
  const serviceWeights = [
    ...Array(30).fill(services[0]), // Corte de Cabelo
    ...Array(8).fill(services[1]),  // Corte Infantil
    ...Array(12).fill(services[2]), // Barba Simples
    ...Array(6).fill(services[3]),  // Barboterapia
    ...Array(20).fill(services[4]), // Corte + Barba
    ...Array(10).fill(services[5]), // Corte + Barboterapia
    ...Array(8).fill(services[6]),  // Corte + Sobrancelha
    ...Array(6).fill(services[7]),  // Corte + Hidratação
    ...Array(4).fill(services[8]),  // Hidratação Capilar
    ...Array(2).fill(services[9]),  // Botox Capilar
    ...Array(4).fill(services[10]), // Design de Sobrancelha
  ];

  // ============================================
  // 6. BARBERS
  // ============================================
  console.log("💈 Creating barbers...");

  const barber1 = await prisma.barber.create({
    data: { name: "ED", email: "edmilson@edbarbearia.com", phone: "(81) 99896-6292", bio: null, photoUrl: "/images/barbers/ed.png" },
  });
  const barber2 = await prisma.barber.create({
    data: { name: "Erywerton (Vevel)", email: "erywerton@edbarbearia.com", phone: "", bio: null, photoUrl: "/images/barbers/vevel.png" },
  });
  const barber3 = await prisma.barber.create({
    data: { name: "Ronald Vinicius", email: "ronald@edbarbearia.com", phone: "", bio: null },
  });

  const barbers = [barber1, barber2, barber3];

  // ============================================
  // 7. AVAILABILITY
  // ============================================
  console.log("📅 Creating barber availability...");

  const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  for (const barber of barbers) {
    for (const day of weekdays) {
      await prisma.barberAvailability.create({
        data: { barberId: barber.id, recurrenceType: "WEEKLY", dayOfWeek: day as any, startTime: "09:00", endTime: "18:00" },
      });
    }
    await prisma.barberAvailability.create({
      data: { barberId: barber.id, recurrenceType: "WEEKLY", dayOfWeek: "SATURDAY", startTime: "09:00", endTime: "14:00" },
    });
  }

  // ============================================
  // 8. PRODUCT CATEGORIES & PRODUCTS
  // ============================================
  console.log("🛍️ Creating product categories and products...");

  const pomadeCategory = await prisma.productCategory.create({ data: { name: "Pomadas", description: "Pomadas para cabelo" } });
  const beardOilCategory = await prisma.productCategory.create({ data: { name: "Óleos para Barba", description: "Óleos para tratamento de barba" } });
  const shampooCategory = await prisma.productCategory.create({ data: { name: "Shampoos e Condicionadores", description: "Shampoos e condicionadores para cabelo e barba" } });

  const productData = [
    { categoryId: pomadeCategory.id,   name: "Pomada Modeladora Extra Forte", slug: "pomada-modeladora-extra-forte", description: "Fixação extra forte para looks definidos.", price: 49.90, discountPrice: 39.90, stock: 20, images: [{ url: "https://images.unsplash.com/photo-1775127741393-2b571811bb01?auto=format&fit=crop&w=800&h=800", title: "Pomada", description: "", position: 0, isPrimary: true }] },
    { categoryId: pomadeCategory.id,   name: "Pomada Brilho Natural",          slug: "pomada-brilho-natural",          description: "Brilho intenso com fixação média.",           price: 44.90, discountPrice: null,  stock: 15, images: [{ url: "https://images.unsplash.com/photo-1775127741095-86ee33b6b385?auto=format&fit=crop&w=800&h=800", title: "Pomada", description: "", position: 0, isPrimary: true }] },
    { categoryId: pomadeCategory.id,   name: "Pomada Matte Opaco",             slug: "pomada-matte-opaco",             description: "Acabamento matte sem brilho.",               price: 42.90, discountPrice: 34.90, stock: 18, images: [{ url: "https://images.unsplash.com/photo-1775126251005-09f10848a43c?auto=format&fit=crop&w=800&h=800", title: "Pomada", description: "", position: 0, isPrimary: true }] },
    { categoryId: pomadeCategory.id,   name: "Cera Modeladora Flexível",       slug: "cera-modeladora-flexivel",       description: "Fixação flexível para retoques.",             price: 38.90, discountPrice: null,  stock: 25, images: [{ url: "https://images.unsplash.com/photo-1732861612244-5704d12e9397?auto=format&fit=crop&w=800&h=800", title: "Cera", description: "", position: 0, isPrimary: true }] },
    { categoryId: beardOilCategory.id, name: "Óleo para Barba Cedarwood",      slug: "oleo-para-barba-cedarwood",      description: "Aroma amadeirado. Hidrata com argan.",       price: 59.90, discountPrice: 49.90, stock: 12, images: [{ url: "https://images.unsplash.com/photo-1673350963997-fc802e774580?auto=format&fit=crop&w=800&h=800", title: "Óleo", description: "", position: 0, isPrimary: true }] },
    { categoryId: beardOilCategory.id, name: "Óleo para Barba Citrus Fresh",   slug: "oleo-para-barba-citrus-fresh",   description: "Aroma cítrico refrescante.",                 price: 55.90, discountPrice: null,  stock: 10, images: [{ url: "https://images.unsplash.com/photo-1673350963924-cb4267d9b6eb?auto=format&fit=crop&w=800&h=800", title: "Óleo", description: "", position: 0, isPrimary: true }] },
    { categoryId: beardOilCategory.id, name: "Óleo para Barba Vanilla Musk",   slug: "oleo-para-barba-vanilla-musk",   description: "Baunilha e almíscar. Hidratação profunda.", price: 57.90, discountPrice: 45.90, stock: 8,  images: [{ url: "https://images.unsplash.com/photo-1620018646973-e3e257a1002c?auto=format&fit=crop&w=800&h=800", title: "Óleo", description: "", position: 0, isPrimary: true }] },
    { categoryId: beardOilCategory.id, name: "Bálsamo Hidratante para Barba",  slug: "balsamo-hidratante-para-barba",  description: "Bálsamo leave-in para barba longa.",        price: 52.90, discountPrice: null,  stock: 14, images: [{ url: "https://images.unsplash.com/photo-1775126454589-53b494ca57ac?auto=format&fit=crop&w=800&h=800", title: "Bálsamo", description: "", position: 0, isPrimary: true }] },
    { categoryId: shampooCategory.id,  name: "Shampoo Anticaspa Mentolado",    slug: "shampoo-anticaspa-mentolado",    description: "Controle eficaz da caspa com menta.",       price: 36.90, discountPrice: 28.90, stock: 22, images: [{ url: "https://images.unsplash.com/photo-1747858989102-cca0f4dc4a11?auto=format&fit=crop&w=800&h=800", title: "Shampoo", description: "", position: 0, isPrimary: true }] },
    { categoryId: shampooCategory.id,  name: "Shampoo Fortalecedor com Biotina", slug: "shampoo-fortalecedor-com-biotina", description: "Biotina e queratina para cabelos fortes.", price: 42.90, discountPrice: null, stock: 18, images: [{ url: "https://images.unsplash.com/photo-1747098393451-6b985f62a2c2?auto=format&fit=crop&w=800&h=800", title: "Shampoo", description: "", position: 0, isPrimary: true }] },
    { categoryId: shampooCategory.id,  name: "Condicionador Nutritivo de Argan", slug: "condicionador-nutritivo-de-argan", description: "Óleo de argan para cabelos macios.",    price: 39.90, discountPrice: null, stock: 16, images: [{ url: "https://images.unsplash.com/photo-1643123158858-eac2aabaa1ec?auto=format&fit=crop&w=800&h=800", title: "Condicionador", description: "", position: 0, isPrimary: true }] },
    { categoryId: shampooCategory.id,  name: "Kit Shampoo + Condicionador Barba", slug: "kit-shampoo-condicionador-barba", description: "Kit completo para higiene da barba.",  price: 79.90, discountPrice: null, stock: 9,  images: [{ url: "https://images.unsplash.com/photo-1556228720-210aabb357b7?auto=format&fit=crop&w=800&h=800", title: "Kit", description: "", position: 0, isPrimary: true }] },
  ];

  for (const { images, discountPrice, ...data } of productData) {
    await prisma.product.create({
      data: { ...data, discountPrice: discountPrice ?? undefined, images: { create: images } },
    });
  }

  // ============================================
  // 9. COURSES
  // ============================================
  console.log("🎓 Creating courses...");

  await prisma.course.createMany({
    data: [
      { name: "Curso de Barbeiro Profissional",    description: "Aprenda todas as técnicas de corte e finalização", type: "PRESENCIAL", durationHours: 80, price: 1500.0 },
      { name: "Workshop de Desenhos em Cabelo",    description: "Técnicas avançadas de desenhos e degradê",         type: "PRESENCIAL", durationHours: 16, price: 450.0  },
      { name: "Curso Online: Barbeiro Iniciante",  description: "Fundamentos da barbearia (vídeo-aulas)",           type: "ONLINE",     durationHours: 40, price: 350.0  },
    ],
  });

  // ============================================
  // 10. TESTIMONIALS
  // ============================================
  console.log("💬 Creating testimonials...");

  await prisma.testimonial.createMany({
    data: [
      { author: "Ronald Vinicius",  quote: "Muito agradável, um ótimo ambiente com ótimos profissionais.", avatarUrl: "/images/testimonials/avatar-01.png", rating: 5, position: 0 },
      { author: "Vinícius Lopes",   quote: "Profissionais sensacionais, excelente ambiente climatizado, cortes agendados sem necessidade de espera. Recomendo e sou cliente há anos!", avatarUrl: "/images/testimonials/avatar-02.png", rating: 5, position: 1 },
      { author: "Marcos Egito",     quote: "Atendimento muito bom, os rapazes são muito educados e prestativos. Fazem aquilo que você pede, nada mais nada menos — eles até sugerem caso você peça.", avatarUrl: "/images/testimonials/avatar-03.png", rating: 5, position: 2 },
      { author: "Adricia Rodrigues", quote: "Amei demais o meu corte de cabelo, foi realmente como eu esperava. Aconselho demais vocês fazerem nessa barbearia, todos são um amor de pessoa, top!", avatarUrl: "/images/testimonials/avatar-04.png", rating: 5, position: 3 },
      { author: "Mateus Willis",    quote: "Ambiente profissional, bastante organizado com barbeiros impecáveis. Preço acessível e tem até cafezinho. Nota 1000.", avatarUrl: "/images/testimonials/avatar-05.png", rating: 5, position: 4 },
      { author: "Pato Marques",     quote: "Ótima barbearia. Atendimento excelente, profissionais muito bons, ambiente aconchegante. Estou frequentando há mais de um ano, só tenho a agradecer.", avatarUrl: "/images/testimonials/avatar-06.png", rating: 5, position: 5 },
    ],
  });

  // ============================================
  // 11. ESTABLISHMENT SETTINGS
  // ============================================
  console.log("⚙️ Creating establishment settings...");

  await prisma.establishmentSettings.create({
    data: {
      name: "ED Barbearia",
      openingHours: JSON.stringify({ monday: "09:00-19:00", tuesday: "09:00-19:00", wednesday: "09:00-19:00", thursday: "09:00-19:00", friday: "09:00-19:00", saturday: "09:00-19:00", sunday: "Fechado" }),
      address: "Rua Paula Batista, 604, Casa Amarela — Recife, PE, 52070-070",
      latitude: -8.027572,
      longitude: -34.916773,
      instagramUrl: "https://www.instagram.com/edbarbearia/",
      instagramUsername: "edbarbearia",
      phone: "(81) 99896-6292",
      email: "edmilson.barbearia7@gmail.com",
      pixKey: "edmilson.barbearia7@gmail.com",
    },
  });

  // ============================================
  // 12. TEST BOOKINGS — ~350 agendamentos em 12 meses
  // ============================================
  console.log("📆 Creating test bookings (~350)...");

  const MAX_DAYS_BACK = 90;
  const usedSlots = new Set<string>(); // "barberId:timestamp" to avoid unique constraint
  let created = 0;

  const statusPool = [
    ...Array(55).fill("COMPLETED"),
    ...Array(20).fill("CONFIRMED"),
    ...Array(15).fill("CANCELLED"),
    ...Array(10).fill("PENDING"),
  ];

  const attempts = 600; // try more than needed to hit ~350 despite slot collisions
  for (let i = 0; i < attempts; i++) {
    const offsetDays = randomWorkdayOffset(MAX_DAYS_BACK);
    const hour = weightedHour();
    const minute = pick([0, 30]);

    const date = new Date();
    date.setDate(date.getDate() - offsetDays);
    date.setHours(hour, minute, 0, 0);

    // skip sundays
    if (date.getDay() === 0) continue;
    // saturdays: only up to 14:00
    if (date.getDay() === 6 && hour >= 14) continue;

    const barber = pick(barbers);
    const slotKey = `${barber.id}:${date.getTime()}`;
    if (usedSlots.has(slotKey)) continue;
    usedSlots.add(slotKey);

    const customerIdx = Math.floor(Math.random() * CUSTOMER_NAMES.length);
    const service = pick(serviceWeights);

    // future bookings = PENDING or CONFIRMED; past = COMPLETED, CONFIRMED, or CANCELLED
    let status: string;
    if (offsetDays <= 0) {
      status = pick(["PENDING", "CONFIRMED", "CONFIRMED"]);
    } else if (offsetDays < 3) {
      status = pick(["CONFIRMED", "COMPLETED", "COMPLETED", "CANCELLED"]);
    } else {
      status = pick(statusPool);
    }

    await prisma.booking.create({
      data: {
        barberId: barber.id,
        serviceId: service.id,
        customerName: CUSTOMER_NAMES[customerIdx],
        customerPhone: CUSTOMER_PHONES[customerIdx],
        customerEmail: null,
        scheduledAt: date,
        status: status as any,
        notes: null,
      },
    });

    created++;
    if (created >= 350) break;
  }

  console.log(`✅ Created ${created} test bookings.`);
  console.log("✅ Seed completed successfully!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
