import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agendar horário",
  description: "Escolha o serviço, o barbeiro e o melhor horário. Agendamento online em poucos passos.",
  alternates: { canonical: "/agendar" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
