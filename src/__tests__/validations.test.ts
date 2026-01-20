import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  serviceSchema,
  serviceCategorySchema,
} from "@/lib/validations/services";
import { barberSchema } from "@/lib/validations/barbers";
import { bookingCreateSchema } from "@/lib/validations/bookings";
import {
  productSchema,
  courseSchema,
} from "@/lib/validations/products-courses";

describe("Service Validations", () => {
  describe("serviceCategorySchema", () => {
    it("should validate a valid service category", () => {
      const validCategory = {
        name: "Cortes",
        description: "Cortes de cabelo",
        isActive: true,
      };

      const result = serviceCategorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
    });

    it("should reject category with invalid name", () => {
      const invalidCategory = {
        name: "",
        description: "Test",
        isActive: true,
      };

      const result = serviceCategorySchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
    });

    it("should allow optional description", () => {
      const category = {
        name: "Cortes",
        isActive: true,
      };

      const result = serviceCategorySchema.safeParse(category);
      expect(result.success).toBe(true);
    });
  });

  describe("serviceSchema", () => {
    it("should validate a valid service", () => {
      const validService = {
        categoryId: 1,
        name: "Corte Masculino",
        description: "Corte de cabelo masculino",
        duration: 30,
        price: 35.0,
        isActive: true,
      };

      const result = serviceSchema.safeParse(validService);
      expect(result.success).toBe(true);
    });

    it("should reject service with invalid duration", () => {
      const invalidService = {
        categoryId: 1,
        name: "Corte",
        duration: 0,
        price: 35.0,
        isActive: true,
      };

      const result = serviceSchema.safeParse(invalidService);
      expect(result.success).toBe(false);
    });

    it("should reject service with negative price", () => {
      const invalidService = {
        categoryId: 1,
        name: "Corte",
        duration: 30,
        price: -10,
        isActive: true,
      };

      const result = serviceSchema.safeParse(invalidService);
      expect(result.success).toBe(false);
    });

    it("should enforce minimum duration of 5 minutes", () => {
      const service = {
        categoryId: 1,
        name: "Corte",
        duration: 4,
        price: 35.0,
        isActive: true,
      };

      const result = serviceSchema.safeParse(service);
      expect(result.success).toBe(false);
    });

    it("should enforce maximum duration of 480 minutes", () => {
      const service = {
        categoryId: 1,
        name: "Corte",
        duration: 481,
        price: 35.0,
        isActive: true,
      };

      const result = serviceSchema.safeParse(service);
      expect(result.success).toBe(false);
    });
  });
});

describe("Barber Validations", () => {
  it("should validate a valid barber", () => {
    const validBarber = {
      name: "João Silva",
      email: "joao@example.com",
      phone: "(11) 99999-9999",
      bio: "Barbeiro profissional com 10 anos de experiência",
      isActive: true,
    };

    const result = barberSchema.safeParse(validBarber);
    expect(result.success).toBe(true);
  });

  it("should reject barber with invalid email", () => {
    const invalidBarber = {
      name: "João Silva",
      email: "invalid-email",
      phone: "(11) 99999-9999",
      isActive: true,
    };

    const result = barberSchema.safeParse(invalidBarber);
    expect(result.success).toBe(false);
  });

  it("should require name", () => {
    const barber = {
      email: "joao@example.com",
      phone: "(11) 99999-9999",
      isActive: true,
    };

    const result = barberSchema.safeParse(barber);
    expect(result.success).toBe(false);
  });

  it("should allow optional fields", () => {
    const minimalBarber = {
      name: "João Silva",
      isActive: true,
    };

    const result = barberSchema.safeParse(minimalBarber);
    expect(result.success).toBe(true);
  });
});

describe("Booking Validations", () => {
  it("should validate a valid booking", () => {
    const validBooking = {
      barberId: 1,
      serviceId: 1,
      scheduledAt: new Date().toISOString(),
      customerName: "Maria Santos",
      customerEmail: "maria@example.com",
      customerPhone: "(11) 98888-8888",
      status: "PENDING",
    };

    const result = bookingCreateSchema.safeParse(validBooking);
    expect(result.success).toBe(true);
  });

  it("should reject booking without customer name", () => {
    const invalidBooking = {
      barberId: 1,
      serviceId: 1,
      scheduledAt: new Date().toISOString(),
      customerEmail: "maria@example.com",
      status: "PENDING",
    };

    const result = bookingCreateSchema.safeParse(invalidBooking);
    expect(result.success).toBe(false);
  });

  it("should validate booking status enum", () => {
    const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

    validStatuses.forEach((status) => {
      const booking = {
        barberId: 1,
        serviceId: 1,
        scheduledAt: new Date().toISOString(),
        customerName: "Maria Santos",
        status,
      };

      const result = bookingCreateSchema.safeParse(booking);
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid booking status", () => {
    const booking = {
      barberId: 1,
      serviceId: 1,
      scheduledAt: new Date().toISOString(),
      customerName: "Maria Santos",
      status: "INVALID_STATUS",
    };

    const result = bookingCreateSchema.safeParse(booking);
    expect(result.success).toBe(false);
  });
});

describe("Product Validations", () => {
  it("should validate a valid product", () => {
    const validProduct = {
      categoryId: 1,
      name: "Pomada Modeladora",
      description: "Pomada para modelagem de cabelo",
      price: 45.0,
      stock: 10,
      isActive: true,
    };

    const result = productSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("should reject product with negative stock", () => {
    const invalidProduct = {
      categoryId: 1,
      name: "Pomada",
      price: 45.0,
      stock: -1,
      isActive: true,
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });

  it("should reject product with negative price", () => {
    const invalidProduct = {
      categoryId: 1,
      name: "Pomada",
      price: -10,
      stock: 10,
      isActive: true,
    };

    const result = productSchema.safeParse(invalidProduct);
    expect(result.success).toBe(false);
  });
});

describe("Course Validations", () => {
  it("should validate a valid course", () => {
    const validCourse = {
      name: "Barbeiro Profissional",
      description: "Curso completo de barbearia",
      type: "PRESENCIAL",
      durationHours: 40,
      price: 1200.0,
      isActive: true,
    };

    const result = courseSchema.safeParse(validCourse);
    expect(result.success).toBe(true);
  });

  it("should validate course type enum", () => {
    const validTypes = ["PRESENCIAL", "ONLINE"];

    validTypes.forEach((type) => {
      const course = {
        name: "Curso Teste",
        type,
        durationHours: 40,
        price: 1000.0,
        isActive: true,
      };

      const result = courseSchema.safeParse(course);
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid course type", () => {
    const course = {
      name: "Curso Teste",
      type: "HYBRID",
      durationHours: 40,
      price: 1000.0,
      isActive: true,
    };

    const result = courseSchema.safeParse(course);
    expect(result.success).toBe(false);
  });

  it("should enforce minimum duration of 1 hour", () => {
    const course = {
      name: "Curso Teste",
      type: "ONLINE",
      durationHours: 0,
      price: 1000.0,
      isActive: true,
    };

    const result = courseSchema.safeParse(course);
    expect(result.success).toBe(false);
  });
});
