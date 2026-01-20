import Link from "next/link";

type ServiceCard = {
  title: string;
  description: string;
  link: string;
  linkText: string;
};

const cards: ServiceCard[] = [
  {
    title: "Serviços",
    description:
      "Cortes modernos, barba completa, design e muito mais. Confira todos os nossos serviços e agende seu horário.",
    link: "/servicos",
    linkText: "Ver Serviços",
  },
  {
    title: "Cursos",
    description:
      "Aprenda com os melhores profissionais. Oferecemos cursos presenciais e online para todos os níveis.",
    link: "/cursos",
    linkText: "Conhecer Cursos",
  },
  {
    title: "Agendamentos",
    description:
      "Sistema de agendamento online fácil e rápido. Escolha o barbeiro, serviço e horário que preferir.",
    link: "/agendar",
    linkText: "Agendar Agora",
  },
];

export function ServiceCards() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Nossos Diferenciais
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubra tudo o que a ED Barbearia tem a oferecer para você
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
            >
              <div className="h-1 w-12 rounded bg-yellow-500 mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {card.title}
              </h3>
              <p className="text-gray-600 mb-6">{card.description}</p>
              <Link
                href={card.link}
                className="inline-flex items-center font-semibold text-black hover:text-yellow-500"
              >
                {card.linkText}
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
