CREATE TABLE "blocked_slots" (
  "id" SERIAL NOT NULL,
  "barberId" INTEGER NOT NULL,
  "date" DATE NOT NULL,
  "time" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "blocked_slots_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "blocked_slots" ADD CONSTRAINT "blocked_slots_barberId_date_time_key" UNIQUE ("barberId", "date", "time");
ALTER TABLE "blocked_slots" ADD CONSTRAINT "blocked_slots_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
