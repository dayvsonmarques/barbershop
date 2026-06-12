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

  for (const barber of [barber1, barber3, barber4]) {
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
        { url: "https://images.unsplash.com/photo-1775127741393-2b571811bb01?auto=format&fit=crop&w=800&h=800", title: "Pomada sendo aplicada", description: "Produto de fixação extra forte — basta uma pequena quantidade para modelar.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1775127741095-86ee33b6b385?auto=format&fit=crop&w=800&h=800", title: "Pote de 120g", description: "Tampa rosqueável que preserva a consistência e o aroma do produto.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1775126251005-09f10848a43c?auto=format&fit=crop&w=800&h=800", title: "Linha completa de pomadas", description: "Faça parte da linha premium de modelagem para cabelo masculino.", position: 2, isPrimary: false },
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
        { url: "https://images.unsplash.com/photo-1775127741095-86ee33b6b385?auto=format&fit=crop&w=800&h=800", title: "Frasco de pomada brilhante", description: "Fórmula de alta brilhância com fixação média para o dia a dia.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1775126454590-f6c47fbaa5c1?auto=format&fit=crop&w=800&h=800", title: "Coleção de produtos", description: "Combinação ideal com outros produtos da linha para resultado profissional.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1775127741393-2b571811bb01?auto=format&fit=crop&w=800&h=800", title: "Textura do produto", description: "Textura leve que se espalha facilmente sem pesar o fio.", position: 2, isPrimary: false },
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
        { url: "https://images.unsplash.com/photo-1775126251005-09f10848a43c?auto=format&fit=crop&w=800&h=800", title: "Duo matte", description: "Dois produtos coordenados para um look natural e texturizado sem reflexos.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1701976857871-a46363644519?auto=format&fit=crop&w=800&h=800", title: "Linha de produtos matte", description: "Diversos produtos para criar o visual mais natural e moderno.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1647140655311-b36dc374a95a?auto=format&fit=crop&w=800&h=800", title: "Grooming profissional", description: "Coleção de produtos de styling usados pelos melhores barbeiros.", position: 2, isPrimary: false },
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
        { url: "https://images.unsplash.com/photo-1732861612244-5704d12e9397?auto=format&fit=crop&w=800&h=800", title: "Pote de cera modeladora", description: "Embalagem compacta com cera de acabamento flexível. Ideal para retoques.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1775126454590-f6c47fbaa5c1?auto=format&fit=crop&w=800&h=800", title: "Linha styling", description: "A cera faz parte de uma linha completa de modelagem masculina.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1701976857871-a46363644519?auto=format&fit=crop&w=800&h=800", title: "Variedade de styling", description: "Combine com outros produtos da linha para um look personalizado.", position: 2, isPrimary: false },
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
        { url: "https://images.unsplash.com/photo-1673350963997-fc802e774580?auto=format&fit=crop&w=800&h=800", title: "Frasco âmbar 30ml", description: "Frasco conta-gotas que protege a fórmula da oxidação e luz UV.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1673350963924-cb4267d9b6eb?auto=format&fit=crop&w=800&h=800", title: "Óleo sobre madeira", description: "Aroma amadeirado de cedro que complementa o ambiente do banheiro.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1620018646973-e3e257a1002c?auto=format&fit=crop&w=800&h=800", title: "Aplicação precisa", description: "Aplique 3 a 5 gotas nas palmas e massageie na barba úmida.", position: 2, isPrimary: false },
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
        { url: "https://images.unsplash.com/photo-1673350963924-cb4267d9b6eb?auto=format&fit=crop&w=800&h=800", title: "Frasco sobre superfície natural", description: "Óleo de barba cítrico em frasco âmbar de 30ml com conta-gotas.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1694538991472-60a784a9b4cb?auto=format&fit=crop&w=800&h=800", title: "Blend de óleos", description: "Coleção de frascos escuros que preservam os óleos essenciais cítricos.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1673350963997-fc802e774580?auto=format&fit=crop&w=800&h=800", title: "Detalhe do frasco", description: "Bergamota, limão siciliano e laranja doce em blend equilibrado.", position: 2, isPrimary: false },
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
        { url: "https://images.unsplash.com/photo-1620018646973-e3e257a1002c?auto=format&fit=crop&w=800&h=800", title: "Frasco conta-gotas", description: "Óleo vegano de rápida absorção com notas de baunilha e almíscar.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1673350963997-fc802e774580?auto=format&fit=crop&w=800&h=800", title: "Textura do óleo", description: "Óleo leve que não deixa resíduo gorduroso na barba.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1694538991472-60a784a9b4cb?auto=format&fit=crop&w=800&h=800", title: "Linha de óleos", description: "Frascos escuros que protegem a fórmula e mantêm o aroma duradouro.", position: 2, isPrimary: false },
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
        { url: "https://images.unsplash.com/photo-1775126454589-53b494ca57ac?auto=format&fit=crop&w=800&h=800", title: "Frasco do bálsamo", description: "Embalagem com dosador que facilita a aplicação sem desperdício.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1775126455263-ed926ab25fa4?auto=format&fit=crop&w=800&h=800", title: "Bálsamo sobre fundo limpo", description: "Fórmula com manteiga de karité, aloe vera e vitamina E.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1775126454572-86a56047b286?auto=format&fit=crop&w=800&h=800", title: "Uso no banheiro", description: "Ideal para aplicar após o banho em barba seca ou ligeiramente úmida.", position: 2, isPrimary: false },
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
        { url: "https://images.unsplash.com/photo-1747858989102-cca0f4dc4a11?auto=format&fit=crop&w=800&h=800", title: "Frasco do shampoo", description: "Frasco de 250ml com bomba dosadora. Fórmula sem sulfatos agressivos.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1597931752949-98c74b5b159f?auto=format&fit=crop&w=800&h=800", title: "Embalagem com dosador", description: "Dosador preciso que evita desperdício e facilita a aplicação no banho.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1604603815783-2bd94c5a819f?auto=format&fit=crop&w=800&h=800", title: "Produto limpo e prático", description: "Extrato de menta-pimenta, piritiona de zinco e ácido salicílico.", position: 2, isPrimary: false },
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
        { url: "https://images.unsplash.com/photo-1747098393451-6b985f62a2c2?auto=format&fit=crop&w=800&h=800", title: "Dupla shampoo e condicionador", description: "Linha completa com shampoo fortalecedor e condicionador nutritivo.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1747858989102-cca0f4dc4a11?auto=format&fit=crop&w=800&h=800", title: "Frasco de shampoo", description: "Complexo B7 + queratina hidrolisada para reconstrução do fio.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1553265331-3032aacd1a76?auto=format&fit=crop&w=800&h=800", title: "Produto e escova", description: "Use em conjunto com escova de cerdas macias para melhores resultados.", position: 2, isPrimary: false },
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
        { url: "https://images.unsplash.com/photo-1643123158858-eac2aabaa1ec?auto=format&fit=crop&w=800&h=800", title: "Frasco do condicionador", description: "Frasco de 250ml com válvula dosadora. Textura rica e cremosa.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1643123158523-2950acbdfd68?auto=format&fit=crop&w=800&h=800", title: "Embalagem clean", description: "Design minimalista com ingredientes 100% naturais listados no rótulo.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1643123158509-b07b9fd5e802?auto=format&fit=crop&w=800&h=800", title: "Linha de cuidados", description: "Óleo de argan marroquino prensado a frio em fórmula de alta concentração.", position: 2, isPrimary: false },
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
        { url: "https://images.unsplash.com/photo-1556228720-210aabb357b7?auto=format&fit=crop&w=800&h=800", title: "Kit de higiene pessoal", description: "Conjunto coordenado com shampoo e condicionador específicos para barba.", position: 0, isPrimary: true },
        { url: "https://images.unsplash.com/photo-1747098393451-6b985f62a2c2?auto=format&fit=crop&w=800&h=800", title: "Shampoo e condicionador", description: "Fórmulas desenvolvidas para uso em sequência com máximo resultado.", position: 1, isPrimary: false },
        { url: "https://images.unsplash.com/photo-1553265331-3032aacd1a76?auto=format&fit=crop&w=800&h=800", title: "Acessórios inclusos", description: "Kit acompanha escova para distribuição uniforme do produto na barba.", position: 2, isPrimary: false },
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
  // 10. TESTIMONIALS
  // ============================================
  console.log("💬 Creating testimonials...");

  await prisma.testimonial.createMany({
    data: [
      {
        author: "Ronald Vinicius",
        quote: "Muito agradável, um ótimo ambiente com ótimos profissionais.",
        avatarUrl: "/images/testimonials/avatar-01.png",
        rating: 5,
        position: 0,
      },
      {
        author: "Vinícius Lopes",
        quote: "Profissionais sensacionais, excelente ambiente climatizado, cortes agendados sem necessidade de espera. Recomendo e sou cliente há anos!",
        avatarUrl: "/images/testimonials/avatar-02.png",
        rating: 5,
        position: 1,
      },
      {
        author: "Marcos Egito",
        quote: "Atendimento muito bom, os rapazes são muito educados e prestativos. Fazem aquilo que você pede, nada mais nada menos — eles até sugerem caso você peça. Muito bom o resultado do corte de cabelo.",
        avatarUrl: "/images/testimonials/avatar-03.png",
        rating: 5,
        position: 2,
      },
      {
        author: "Adricia Rodrigues",
        quote: "Amei demais o meu corte de cabelo, foi realmente como eu esperava. Aconselho demais vocês fazerem nessa barbearia, todos são um amor de pessoa, top!",
        avatarUrl: "/images/testimonials/avatar-04.png",
        rating: 5,
        position: 3,
      },
      {
        author: "Mateus Willis",
        quote: "Ambiente profissional, bastante organizado com barbeiros impecáveis. Preço acessível e tem até cafezinho. Nota 1000.",
        avatarUrl: "/images/testimonials/avatar-05.png",
        rating: 5,
        position: 4,
      },
      {
        author: "Pato Marques",
        quote: "Ótima barbearia. Atendimento excelente, profissionais muito bons, ambiente aconchegante. Estou frequentando há mais de um ano, só tenho a agradecer.",
        avatarUrl: "/images/testimonials/avatar-06.png",
        rating: 5,
        position: 5,
      },
    ],
  });

  // ============================================
  // 11. ESTABLISHMENT SETTINGS
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
