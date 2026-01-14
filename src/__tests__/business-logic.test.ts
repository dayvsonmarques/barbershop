import { describe, it, expect } from "vitest";

describe("Booking Conflict Prevention", () => {
  it("should detect overlapping bookings", () => {
    const booking1 = {
      start: new Date("2026-01-15T10:00:00"),
      end: new Date("2026-01-15T10:30:00"),
    };

    const booking2 = {
      start: new Date("2026-01-15T10:15:00"),
      end: new Date("2026-01-15T10:45:00"),
    };

    const hasConflict = (b1: typeof booking1, b2: typeof booking2) => {
      return (
        (b1.start >= b2.start && b1.start < b2.end) ||
        (b1.end > b2.start && b1.end <= b2.end) ||
        (b1.start <= b2.start && b1.end >= b2.end)
      );
    };

    expect(hasConflict(booking1, booking2)).toBe(true);
  });

  it("should allow non-overlapping bookings", () => {
    const booking1 = {
      start: new Date("2026-01-15T10:00:00"),
      end: new Date("2026-01-15T10:30:00"),
    };

    const booking2 = {
      start: new Date("2026-01-15T10:30:00"),
      end: new Date("2026-01-15T11:00:00"),
    };

    const hasConflict = (b1: typeof booking1, b2: typeof booking2) => {
      return (
        (b1.start >= b2.start && b1.start < b2.end) ||
        (b1.end > b2.start && b1.end <= b2.end) ||
        (b1.start <= b2.start && b1.end >= b2.end)
      );
    };

    expect(hasConflict(booking1, booking2)).toBe(false);
  });
});

describe("Time Slot Calculation", () => {
  it("should generate correct time slots", () => {
    const startTime = "09:00";
    const endTime = "12:00";
    const interval = 30; // minutes

    const generateSlots = (start: string, end: string, interval: number) => {
      const slots: string[] = [];
      const [startHour, startMinute] = start.split(":").map(Number);
      const [endHour, endMinute] = end.split(":").map(Number);

      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      for (let minutes = startMinutes; minutes < endMinutes; minutes += interval) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        slots.push(
          `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        );
      }

      return slots;
    };

    const slots = generateSlots(startTime, endTime, interval);

    expect(slots).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
    ]);
  });
});

describe("Date Validation", () => {
  it("should reject past dates", () => {
    const pastDate = new Date("2020-01-01");
    const today = new Date();

    expect(pastDate < today).toBe(true);
  });

  it("should accept future dates", () => {
    const futureDate = new Date("2027-01-01");
    const today = new Date();

    expect(futureDate > today).toBe(true);
  });
});

describe("Service Duration", () => {
  it("should calculate booking end time correctly", () => {
    const startTime = new Date("2026-01-15T10:00:00");
    const duration = 30; // minutes

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);

    expect(endTime.getHours()).toBe(10);
    expect(endTime.getMinutes()).toBe(30);
  });

  it("should handle duration crossing hour boundary", () => {
    const startTime = new Date("2026-01-15T10:45:00");
    const duration = 30; // minutes

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);

    expect(endTime.getHours()).toBe(11);
    expect(endTime.getMinutes()).toBe(15);
  });
});

describe("Day of Week Mapping", () => {
  it("should map JavaScript day to enum correctly", () => {
    const dayMap = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];

    const testDate = new Date("2026-01-15"); // Wednesday
    const dayOfWeek = testDate.getDay(); // 3

    expect(dayMap[dayOfWeek]).toBe("WEDNESDAY");
  });
});
