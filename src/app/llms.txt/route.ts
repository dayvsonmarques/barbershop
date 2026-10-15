import { prisma } from "@/lib/prisma";
import { formatBRL, getSiteSettings, getSiteUrl } from "@/lib/site";
import { courseSlug } from "@/lib/slug";
import { formatOpeningHours } from "@/lib/opening-hours";

export const dynamic = "force-dynamic";

// Resumo em texto do negócio para assistentes de IA (GEO / llms.txt)
export async function GET() {
  const siteUrl = getSiteUrl();
  const [settings, services, courses] = await Promise.all([
    getSiteSettings(),
    prisma.service
      .findMany({ where: { isActive: true }, select: { name: true, price: true, duration: true }, orderBy: { id: "asc" } })
      .catch(() => []),
    prisma.course
      .findMany({ where: { isActive: true }, select: { id: true, name: true, durationHours: true }, orderBy: { name: "asc" } })
      .catch(() => []),
  ]);

  const name = settings?.name ?? "Barbearia";
  const lines: string[] = [
    `# ${name}`,
    "",
    `> Barbearia com agendamento online: cortes, barba e cuidados masculinos.`,
    "",
    "## Informações",
  ];
  if (settings?.address) lines.push(`- Endereço: ${settings.address}`);
  if (settings?.openingHours) lines.push(`- Horário de funcionamento: ${formatOpeningHours(settings.openingHours)}`);
  if (settings?.phone) lines.push(`- Telefone/WhatsApp: ${settings.phone}`);
  if (settings?.email) lines.push(`- E-mail: ${settings.email}`);
  if (settings?.instagramUrl) lines.push(`- Instagram: ${settings.instagramUrl}`);
  lines.push(`- Agendamento online: ${siteUrl}/agendar`);

  if (services.length > 0) {
    lines.push("", "## Serviços");
    for (const s of services) {
      lines.push(`- ${s.name}: ${formatBRL(Number(s.price))} (${s.duration} min)`);
    }
  }

  if (courses.length > 0) {
    lines.push("", "## Cursos");
    for (const c of courses) {
      lines.push(`- [${c.name}](${siteUrl}/cursos/${courseSlug(c)}): ${c.durationHours}h`);
    }
  }

  lines.push(
    "",
    "## Páginas",
    `- [Início](${siteUrl}/)`,
    `- [Serviços](${siteUrl}/servicos)`,
    `- [Loja](${siteUrl}/produtos)`,
    `- [Cursos](${siteUrl}/cursos)`,
    `- [Agendar](${siteUrl}/agendar)`,
    ""
  );

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
