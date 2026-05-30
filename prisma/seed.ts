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

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data (in development only)
  await prisma.$executeRaw`TRUNCATE TABLE "users", "groups", "permissions", "user_groups", "group_permissions", "password_resets", "service_categories", "services", "barbers", "barber_availability", "availability_exceptions", "bookings", "product_categories", "products", "courses", "establishment_settings" CASCADE`;

  // ============================================
  // 1. PERMISSIONS
  // ============================================
  console.log("📋 Creating permissions...");
  
  const resources = ["users", "groups", "barbers", "services", "bookings", "products", "courses", "settings"];
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
    data: {
      name: "Administrador",
      description: "Acesso total ao sistema",
    },
  });

  const receptionistGroup = await prisma.group.create({
    data: {
      name: "Recepcionista",
      description: "Gerenciamento de agendamentos e clientes",
    },
  });

  const barberGroup = await prisma.group.create({
    data: {
      name: "Barbeiro",
      description: "Visualização de agendamentos próprios",
    },
  });

  // ============================================
  // 3. GROUP PERMISSIONS
  // ============================================
  console.log("🔐 Assigning permissions to groups...");
  
  // Admin: all permissions
  const allPermissions = await prisma.permission.findMany();
  await prisma.groupPermission.createMany({
    data: allPermissions.map((p) => ({
      groupId: adminGroup.id,
      permissionId: p.id,
    })),
  });

  // Receptionist: bookings, barbers, services (all), products (view)
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
    data: receptionistPermissions.map((p) => ({
      groupId: receptionistGroup.id,
      permissionId: p.id,
    })),
  });

  // Barber: view bookings only
  const barberPermissions = await prisma.permission.findMany({
    where: {
      resource: "bookings",
      action: "view",
    },
  });
  await prisma.groupPermission.createMany({
    data: barberPermissions.map((p) => ({
      groupId: barberGroup.id,
      permissionId: p.id,
    })),
  });

  // ============================================
  // 4. USERS
  // ============================================
  console.log("👤 Creating users...");
  
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const adminUser = await prisma.user.create({
    data: {
      email: "edmilson.barbearia7@gmail.com",
      password: hashedPassword,
      name: "Edmilson Rodrigues",
    },
  });

  const receptionistUser = await prisma.user.create({
    data: {
      email: "recepcao@edbarbearia.com",
      password: hashedPassword,
      name: "Recepcionista",
    },
  });

  // Assign users to groups
  await prisma.userGroup.create({
    data: {
      userId: adminUser.id,
      groupId: adminGroup.id,
    },
  });

  await prisma.userGroup.create({
    data: {
      userId: receptionistUser.id,
      groupId: receptionistGroup.id,
    },
  });

  // ============================================
  // 5. SERVICE CATEGORIES & SERVICES
  // ============================================
  console.log("✂️ Creating service categories and services...");

  const catCorte = await prisma.serviceCategory.create({
    data: { name: "Corte", description: "Cortes masculinos e infantil" },
  });
  const catBarba = await prisma.serviceCategory.create({
    data: { name: "Barba", description: "Serviços de barba e barboterapia" },
  });
  const catCombo = await prisma.serviceCategory.create({
    data: { name: "Combo", description: "Pacotes combinados com desconto" },
  });
  const catTratamento = await prisma.serviceCategory.create({
    data: { name: "Tratamento", description: "Hidratação, botox e cuidados capilares" },
  });
  const catEstetica = await prisma.serviceCategory.create({
    data: { name: "Estética", description: "Sobrancelha e cuidados com a aparência" },
  });

  await prisma.service.createMany({
    data: [
      { categoryId: catCorte.id,     name: "Corte de Cabelo",                     description: "", duration: 30, price: 50.0  },
      { categoryId: catCorte.id,     name: "Corte Infantil",                       description: "", duration: 50, price: 50.0  },
      { categoryId: catBarba.id,     name: "Barba Simples",                        description: "", duration: 30, price: 35.0  },
      { categoryId: catBarba.id,     name: "Barboterapia",                         description: "", duration: 30, price: 50.0  },
      { categoryId: catCombo.id,     name: "Corte + Barba",                        description: "", duration: 50, price: 80.0  },
      { categoryId: catCombo.id,     name: "Corte + Barboterapia",                 description: "", duration: 60, price: 90.0  },
      { categoryId: catCombo.id,     name: "Corte + Sobrancelha",                  description: "", duration: 40, price: 65.0  },
      { categoryId: catCombo.id,     name: "Corte + Hidratação",                   description: "", duration: 60, price: 70.0  },
      { categoryId: catTratamento.id, name: "Hidratação Capilar",                  description: "", duration: 40, price: 50.0  },
      { categoryId: catTratamento.id, name: "Botox Capilar",                       description: "", duration: 50, price: 100.0 },
      { categoryId: catEstetica.id,  name: "Design de Sobrancelha",                description: "", duration: 20, price: 20.0  },
    ],
  });

  // ============================================
  // 6. BARBERS
  // ============================================
  console.log("💈 Creating barbers...");
  
  const barber1 = await prisma.barber.create({
    data: {
      name: "ED",
      email: "edmilson@edbarbearia.com",
      phone: "(81) 99896-6292",
      bio: null,
      photoUrl: "/images/barbers/ed.png",
    },
  });

  const barber2 = await prisma.barber.create({
    data: {
      name: "Daniel",
      email: "daniel@edbarbearia.com",
      phone: "",
      bio: null,
      photoUrl: "/images/barbers/daniel.png",
    },
  });

  const barber3 = await prisma.barber.create({
    data: {
      name: "Erywerton (Vevel)",
      email: "erywerton@edbarbearia.com",
      phone: "",
      bio: null,
      photoUrl: "/images/barbers/vevel.png",
    },
  });

  const barber4 = await prisma.barber.create({
    data: {
      name: "Ronald Vinicius",
      email: "ronald@edbarbearia.com",
      phone: "",
      bio: null,
    },
  });

  // ============================================
  // 7. AVAILABILITY
  // ============================================
  console.log("📅 Creating barber availability...");

  const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

  for (const barber of [barber1, barber2, barber3, barber4]) {
    for (const day of weekdays) {
      await prisma.barberAvailability.create({
        data: {
          barberId: barber.id,
          recurrenceType: "WEEKLY",
          dayOfWeek: day as any,
          startTime: "09:00",
          endTime: "18:00",
        },
      });
    }
    
    // Saturday: shorter hours
    await prisma.barberAvailability.create({
      data: {
        barberId: barber.id,
        recurrenceType: "WEEKLY",
        dayOfWeek: "SATURDAY",
        startTime: "09:00",
        endTime: "14:00",
      },
    });
  }

  // ============================================
  // 8. PRODUCT CATEGORIES & PRODUCTS
  // ============================================
  console.log("🛍️ Creating product categories and products...");
  
  const pomadeCategory = await prisma.productCategory.create({
    data: {
      name: "Pomadas",
      description: "Pomadas para cabelo",
    },
  });

  const beardOilCategory = await prisma.productCategory.create({
    data: {
      name: "Óleos para Barba",
      description: "Óleos para tratamento de barba",
    },
  });

  const shampooCategory = await prisma.productCategory.create({
    data: {
      name: "Shampoos e Condicionadores",
      description: "Shampoos e condicionadores para cabelo e barba",
    },
  });

  const products = [
    // Pomadas (4 products, 2 with discount)
    {
      categoryId: pomadeCategory.id,
      name: "Pomada Modeladora Extra Forte",
      slug: "pomada-modeladora-extra-forte",
      description: "Fixação extra forte para looks definidos e duradouros. Fórmula sem álcool.",
      price: 49.90,
      discountPrice: 39.90,
      stock: 20,
      images: [
        { url: "https://images.unsplash.com/photo-1587909209111-5097ee578ec3?auto=format&fit=crop&w=800&h=800", title: "Frasco principal", description: "Pote de 120g com tampa rosqueável. Ideal para uso diário.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1654424292734-c8e8b6d85a7b?auto=format&fit=crop&w=800&h=800", title: "Textura do produto", description: "Consistência firme que se distribui facilmente pelo cabelo.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1775126250995-8d2364537089?auto=format&fit=crop&w=800&h=800", title: "Detalhe da embalagem", description: "Rótulo com lista completa de ingredientes e modo de uso.", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: pomadeCategory.id,
      name: "Pomada Brilho Natural",
      slug: "pomada-brilho-natural",
      description: "Brilho intenso com fixação média. Ideal para cabelos lisos.",
      price: 44.90,
      discountPrice: null,
      stock: 15,
      images: [
        { url: "https://images.unsplash.com/photo-1560264641-1b5191cc63e2?auto=format&fit=crop&w=800&h=800", title: "Frasco principal", description: "Pote de 100g com fórmula de alta brilhância e fixação média.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1587225438173-701d7edc94f9?auto=format&fit=crop&w=800&h=800", title: "Brilho na mão", description: "Textura leve que se espalha facilmente sem pesar o fio.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1587909209111-5097ee578ec3?auto=format&fit=crop&w=800&h=800", title: "Detalhe da tampa", description: "Tampa com vedação que preserva a fórmula por mais tempo.", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: pomadeCategory.id,
      name: "Pomada Matte Opaco",
      slug: "pomada-matte-opaco",
      description: "Acabamento matte sem brilho para looks naturais e modernos.",
      price: 42.90,
      discountPrice: 34.90,
      stock: 18,
      images: [
        { url: "https://images.unsplash.com/photo-1654424292734-c8e8b6d85a7b?auto=format&fit=crop&w=800&h=800", title: "Frasco principal", description: "Pote de 100g com fórmula matte de longa duração.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1560264641-1b5191cc63e2?auto=format&fit=crop&w=800&h=800", title: "Acabamento matte no cabelo", description: "Resultado final: aspecto natural e texturizado sem reflexos.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1587225438173-701d7edc94f9?auto=format&fit=crop&w=800&h=800", title: "Detalhe da embalagem", description: "Design minimalista com informações de uso no verso.", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: pomadeCategory.id,
      name: "Cera Modeladora Flexível",
      slug: "cera-modeladora-flexivel",
      description: "Fixação flexível para retoques ao longo do dia. Fórmula leve.",
      price: 38.90,
      discountPrice: null,
      stock: 25,
      images: [
        { url: "https://images.unsplash.com/photo-1775126250995-8d2364537089?auto=format&fit=crop&w=800&h=800", title: "Pote da cera", description: "Pote de 80g com tampa de rosca. Prático para levar na bolsa.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1654424292734-c8e8b6d85a7b?auto=format&fit=crop&w=800&h=800", title: "Textura flexível", description: "Consistência maleável que permite remodelar o look durante o dia.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1560264641-1b5191cc63e2?auto=format&fit=crop&w=800&h=800", title: "Detalhe do rótulo", description: "Ingredientes naturais incluindo cera de abelha e manteiga de karité.", position: 2, isPrimary: false },
      ],
    },
    // Óleos para Barba (4 products, 2 with discount)
    {
      categoryId: beardOilCategory.id,
      name: "Óleo para Barba Cedarwood",
      slug: "oleo-para-barba-cedarwood",
      description: "Aroma amadeirado intenso. Hidrata e amacia a barba com óleo de argan.",
      price: 59.90,
      discountPrice: 49.90,
      stock: 12,
      images: [
        { url: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&h=800", title: "Frasco do óleo", description: "Frasco âmbar de 30ml com conta-gotas de precisão.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1620018646973-e3e257a1002c?auto=format&fit=crop&w=800&h=800", title: "Aplicação na barba", description: "Aplique 3 a 5 gotas nas palmas e massageie na barba úmida.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1672761431764-61b8d9a00dbb?auto=format&fit=crop&w=800&h=800", title: "Detalhe do conta-gotas", description: "Conta-gotas de vidro para dosagem precisa sem desperdício.", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: beardOilCategory.id,
      name: "Óleo para Barba Citrus Fresh",
      slug: "oleo-para-barba-citrus-fresh",
      description: "Aroma cítrico refrescante com notas de bergamota e limão.",
      price: 55.90,
      discountPrice: null,
      stock: 10,
      images: [
        { url: "https://images.unsplash.com/photo-1673350963997-fc802e774580?auto=format&fit=crop&w=800&h=800", title: "Frasco do óleo", description: "Frasco âmbar de 30ml com mistura de óleos essenciais cítricos.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1627876280688-24a58ba02f2c?auto=format&fit=crop&w=800&h=800", title: "Aroma cítrico", description: "Blend de bergamota, limão siciliano e laranja doce.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&h=800", title: "Detalhe da embalagem", description: "Caixa protetora com informações de composição e validade.", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: beardOilCategory.id,
      name: "Óleo para Barba Vanilla Musk",
      slug: "oleo-para-barba-vanilla-musk",
      description: "Combinação suave de baunilha e almíscar. Hidratação profunda.",
      price: 57.90,
      discountPrice: 45.90,
      stock: 8,
      images: [
        { url: "https://images.unsplash.com/photo-1620018646973-e3e257a1002c?auto=format&fit=crop&w=800&h=800", title: "Frasco do óleo", description: "Frasco âmbar de 30ml com blend vegano de óleos nutritivos.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1672761431764-61b8d9a00dbb?auto=format&fit=crop&w=800&h=800", title: "Textura do óleo", description: "Óleo leve de rápida absorção que não deixa resíduo gorduroso.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1673350963997-fc802e774580?auto=format&fit=crop&w=800&h=800", title: "Detalhe da tampa", description: "Tampa rosqueável com vedação que preserva o aroma.", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: beardOilCategory.id,
      name: "Bálsamo Hidratante para Barba",
      slug: "balsamo-hidratante-para-barba",
      description: "Bálsamo leave-in para controle e hidratação da barba longa.",
      price: 52.90,
      discountPrice: null,
      stock: 14,
      images: [
        { url: "https://images.unsplash.com/photo-1627876280688-24a58ba02f2c?auto=format&fit=crop&w=800&h=800", title: "Frasco do bálsamo", description: "Bisnaga de 60g com bico preciso para aplicação localizada.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&h=800", title: "Aplicação na barba longa", description: "Distribua uniformemente da raiz às pontas em barba seca ou úmida.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1620018646973-e3e257a1002c?auto=format&fit=crop&w=800&h=800", title: "Detalhe do rótulo", description: "Fórmula com manteiga de karité, aloe vera e vitamina E.", position: 2, isPrimary: false },
      ],
    },
    // Shampoos e Condicionadores (4 products, 1 with discount)
    {
      categoryId: shampooCategory.id,
      name: "Shampoo Anticaspa Mentolado",
      slug: "shampoo-anticaspa-mentolado",
      description: "Controle eficaz da caspa com sensação refrescante de menta.",
      price: 36.90,
      discountPrice: 28.90,
      stock: 22,
      images: [
        { url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&h=800", title: "Frasco do shampoo", description: "Frasco de 250ml com bomba dosadora. Fórmula sem sulfatos agressivos.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1701992678972-d5a053ad0fb0?auto=format&fit=crop&w=800&h=800", title: "Espuma de limpeza", description: "Espuma densa e cremosa que limpa profundamente sem ressecar.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1700709678035-b6606373aa52?auto=format&fit=crop&w=800&h=800", title: "Detalhe dos ingredientes", description: "Extrato de menta-pimenta, piritiona de zinco e ácido salicílico.", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: shampooCategory.id,
      name: "Shampoo Fortalecedor com Biotina",
      slug: "shampoo-fortalecedor-com-biotina",
      description: "Biotina e queratina para cabelos mais fortes e com menos queda.",
      price: 42.90,
      discountPrice: null,
      stock: 18,
      images: [
        { url: "https://images.unsplash.com/photo-1655892817271-c66841c2506e?auto=format&fit=crop&w=800&h=800", title: "Frasco do shampoo", description: "Frasco de 300ml com tampa flip-top. Aroma suave de coco.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&h=800", title: "Cabelo fortalecido", description: "Resultado visível após 4 semanas de uso: fios mais resistentes.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1701992678972-d5a053ad0fb0?auto=format&fit=crop&w=800&h=800", title: "Detalhe da biotina", description: "Complexo B7 + queratina hidrolisada para reconstrução do fio.", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: shampooCategory.id,
      name: "Condicionador Nutritivo de Argan",
      slug: "condicionador-nutritivo-de-argan",
      description: "Óleo de argan marroquino para cabelos macios e sem frizz.",
      price: 39.90,
      discountPrice: null,
      stock: 16,
      images: [
        { url: "https://images.unsplash.com/photo-1633171036157-78d53387fdc0?auto=format&fit=crop&w=800&h=800", title: "Frasco do condicionador", description: "Frasco de 250ml com válvula dosadora. Textura rica e cremosa.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1686121544103-f1bc403bd6da?auto=format&fit=crop&w=800&h=800", title: "Textura cremosa", description: "Consistência densa que penetra profundamente na estrutura do fio.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1686121544835-ce3f852fc86d?auto=format&fit=crop&w=800&h=800", title: "Detalhe do óleo de argan", description: "Óleo 100% puro de argan marroquino prensado a frio.", position: 2, isPrimary: false },
      ],
    },
    {
      categoryId: shampooCategory.id,
      name: "Kit Shampoo + Condicionador Barba",
      slug: "kit-shampoo-condicionador-barba",
      description: "Kit completo para higiene e cuidado da barba. Uso diário.",
      price: 79.90,
      discountPrice: null,
      stock: 9,
      images: [
        { url: "https://images.unsplash.com/photo-1635273051937-a0ddef9573b6?auto=format&fit=crop&w=800&h=800", title: "Kit completo", description: "Conjunto com shampoo 200ml e condicionador 150ml em embalagens coordenadas.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1599011176306-4a96f1516d4d?auto=format&fit=crop&w=800&h=800", title: "Shampoo e condicionador juntos", description: "Fórmulas desenvolvidas para uso em sequência e máximo resultado.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1567721971759-12402aedabf0?auto=format&fit=crop&w=800&h=800", title: "Detalhe das embalagens", description: "Embalagens compactas e resistentes, ideais para viagem.", position: 2, isPrimary: false },
      ],
    },
  ];

  for (const { images, discountPrice, ...data } of products) {
    await prisma.product.create({
      data: {
        ...data,
        discountPrice: discountPrice ?? undefined,
        images: { create: images },
      },
    });
  }

  // ============================================
  // 9. COURSES
  // ============================================
  console.log("🎓 Creating courses...");
  
  await prisma.course.createMany({
    data: [
      {
        name: "Curso de Barbeiro Profissional",
        description: "Aprenda todas as técnicas de corte e finalização",
        type: "PRESENCIAL",
        durationHours: 80,
        price: 1500.0,
      },
      {
        name: "Workshop de Desenhos em Cabelo",
        description: "Técnicas avançadas de desenhos e degradê",
        type: "PRESENCIAL",
        durationHours: 16,
        price: 450.0,
      },
      {
        name: "Curso Online: Barbeiro Iniciante",
        description: "Fundamentos da barbearia (vídeo-aulas)",
        type: "ONLINE",
        durationHours: 40,
        price: 350.0,
      },
    ],
  });

  // ============================================
  // 10. ESTABLISHMENT SETTINGS
  // ============================================
  console.log("⚙️ Creating establishment settings...");
  
  await prisma.establishmentSettings.create({
    data: {
      name: "ED Barbearia",
      openingHours: JSON.stringify({
        monday: "09:00-19:00",
        tuesday: "09:00-19:00",
        wednesday: "09:00-19:00",
        thursday: "09:00-19:00",
        friday: "09:00-19:00",
        saturday: "09:00-19:00",
        sunday: "Fechado",
      }),
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
