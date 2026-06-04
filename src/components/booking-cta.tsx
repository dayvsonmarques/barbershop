// src/components/booking-cta.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@/components/ui/calendar-icon";
import { SectionLabel } from "@/components/ui/section-label";

export function BookingCTA() {
  return (
    <section className="bg-background-secondary py-24">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <SectionLabel label="Agendamento" />
        <h2
          className="font-heading text-text-primary mb-6"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          Pronto para o próximo corte?
        </h2>
        <p className="text-text-secondary text-2xl mb-10 max-w-xl mx-auto leading-relaxed">
          Agende agora mesmo e garanta seu horário com os melhores barbeiros de
          Recife.
        </p>
        <Link href="/agendar">
          <Button variant="primary" size="lg">
            <CalendarIcon size={16} />
            Agendar Agora
          </Button>
        </Link>
      </div>
    </section>
  );
}
