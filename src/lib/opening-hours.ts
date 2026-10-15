const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABEL: Record<string, string> = {
  monday: "Seg", tuesday: "Ter", wednesday: "Qua", thursday: "Qui",
  friday: "Sex", saturday: "Sáb", sunday: "Dom",
};

function formatHourRange(range: string): string {
  const [start, end] = range.split("-");
  const fmt = (t: string) => t.replace(/^0/, "").replace(":00", "h").replace(/:(\d+)/, "h$1");
  return end ? `${fmt(start)} às ${fmt(end)}` : range;
}

export function formatOpeningHours(raw?: string): string {
  if (!raw) return "Horário não informado";
  let parsed: Record<string, string>;
  try { parsed = JSON.parse(raw); } catch { return raw; }

  const days = DAY_KEYS.filter((d) => parsed[d]);
  const groups: { days: string[]; hours: string }[] = [];

  for (const day of days) {
    const hours = parsed[day];
    const last = groups[groups.length - 1];
    if (last && last.hours === hours) {
      last.days.push(DAY_LABEL[day]);
    } else {
      groups.push({ days: [DAY_LABEL[day]], hours });
    }
  }

  return groups
    .filter(({ hours }) => hours.toLowerCase() !== "fechado")
    .map(({ days: ds, hours }) => {
      const label = ds.length > 2 ? `${ds[0]} a ${ds[ds.length - 1]}` : ds.join(", ");
      return `${label}: ${formatHourRange(hours)}`;
    })
    .join(" | ");
}

const SCHEMA_DAY: Record<string, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
  friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

/** Converte o JSON de horários em openingHoursSpecification (schema.org). */
export function toOpeningHoursSpecification(raw?: string) {
  if (!raw) return [];
  let parsed: Record<string, string>;
  try { parsed = JSON.parse(raw); } catch { return []; }

  return DAY_KEYS.flatMap((day) => {
    const match = parsed[day]?.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
    if (!match) return [];
    return [{
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${SCHEMA_DAY[day]}`,
      opens: match[1].padStart(5, "0"),
      closes: match[2].padStart(5, "0"),
    }];
  });
}
