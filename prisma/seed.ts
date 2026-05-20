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
  
  const hairCategory = await prisma.serviceCategory.create({
    data: {
      name: "Cabelo",
      description: "Serviços de corte e tratamento capilar",
    },
  });

  const beardCategory = await prisma.serviceCategory.create({
    data: {
      name: "Barba",
      description: "Serviços de barba e bigode",
    },
  });

  const comboCategory = await prisma.serviceCategory.create({
    data: {
      name: "Combo",
      description: "Pacotes combinados",
    },
  });

  await prisma.service.createMany({
    data: [
      {
        categoryId: hairCategory.id,
        name: "Corte Simples",
        description: "Corte de cabelo tradicional",
        duration: 30,
        price: 40.0,
      },
      {
        categoryId: hairCategory.id,
        name: "Corte + Desenho",
        description: "Corte com desenho personalizado",
        duration: 45,
        price: 55.0,
      },
      {
        categoryId: beardCategory.id,
        name: "Barba Completa",
        description: "Aparar e finalizar barba",
        duration: 20,
        price: 30.0,
      },
      {
        categoryId: beardCategory.id,
        name: "Barba + Bigode",
        description: "Barba e bigode aparados",
        duration: 25,
        price: 35.0,
      },
      {
        categoryId: comboCategory.id,
        name: "Cabelo + Barba",
        description: "Corte de cabelo + barba completa",
        duration: 50,
        price: 65.0,
      },
    ],
  });

  // ============================================
  // 6. BARBERS
  // ============================================
  console.log("💈 Creating barbers...");
  
  const barber1 = await prisma.barber.create({
    data: {
      name: "Edmilson Rodrigues",
      email: "edmilson@edbarbearia.com",
      phone: "(81) 99896-6292",
      bio: "Fundador da ED Barbearia e barbeiro profissional em Recife",
    },
  });

  const barber2 = await prisma.barber.create({
    data: {
      name: "Carlos Santos",
      email: "carlos@edbarbearia.com",
      phone: "(81) 98765-1234",
      bio: "Especialista em cortes modernos e desenhos",
    },
  });

  // ============================================
  // 7. AVAILABILITY
  // ============================================
  console.log("📅 Creating barber availability...");
  
  const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  
  for (const barber of [barber1, barber2]) {
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

  await prisma.product.createMany({
    data: [
      {
        categoryId: pomadeCategory.id,
        name: "Pomada Modeladora Forte",
        description: "Fixação extra forte",
        price: 45.0,
        stock: 15,
      },
      {
        categoryId: pomadeCategory.id,
        name: "Pomada Brilho Natural",
        description: "Brilho e fixação média",
        price: 40.0,
        stock: 20,
      },
      {
        categoryId: beardOilCategory.id,
        name: "Óleo para Barba Cedarwood",
        description: "Aroma amadeirado",
        price: 55.0,
        stock: 10,
      },
    ],
  });

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
      address: "Rua Casa Amarela, 73, Casa Amarela — Recife, PE",
      latitude: -8.0260634,
      longitude: -34.9196525,
      instagramUrl: "https://www.instagram.com/edbarbearia/",
      instagramUsername: "edbarbearia",
      phone: "(81) 99896-6292",
      email: "edmilson.barbearia7@gmail.com",
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
