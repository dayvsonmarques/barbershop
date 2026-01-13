export function AboutSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Sobre a ED Barbearia
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              Com anos de experiência, a ED Barbearia se consolidou como
              referência em cortes masculinos e cuidados com a barba. Nossa
              missão é proporcionar não apenas um corte de cabelo, mas uma
              experiência completa de cuidado e estilo.
            </p>
            <p className="text-lg text-gray-600 mb-4">
              Nossa equipe é formada por profissionais altamente qualificados e
              apaixonados pelo que fazem. Utilizamos técnicas tradicionais
              combinadas com tendências modernas para garantir que cada cliente
              saia satisfeito.
            </p>
            <p className="text-lg text-gray-600 mb-6">
              Além dos serviços de barbearia, oferecemos produtos de qualidade
              premium e cursos profissionalizantes para quem deseja ingressar
              nesta arte milenar.
            </p>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  10+
                </div>
                <div className="text-sm text-gray-600">Anos de Experiência</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  5000+
                </div>
                <div className="text-sm text-gray-600">Clientes Satisfeitos</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  100%
                </div>
                <div className="text-sm text-gray-600">Qualidade Garantida</div>
              </div>
            </div>
          </div>
          <div className="relative h-[600px] rounded-lg overflow-hidden shadow-2xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: "url(/images/about.jpg)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
