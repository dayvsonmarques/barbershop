import { useState } from "react";

export type Sort = { col: string; dir: "asc" | "desc" };

type Props = {
  label: string;
  field: string;
  sort: Sort;
  onSort: (field: string) => void;
  className?: string;
  right?: boolean;
};

export function SortHeader({ label, field, sort, onSort, className = "", right = false }: Props) {
  const active = sort.col === field;
  return (
    <th
      className={`px-4 py-3 text-xs font-medium uppercase tracking-wider cursor-pointer select-none whitespace-nowrap group ${right ? "text-right" : "text-left"} ${className}`}
      onClick={() => onSort(field)}
    >
      <span className={`inline-flex items-center gap-1 ${right ? "flex-row-reverse" : ""} ${active ? "text-[#C9A84C]" : "text-gray-500 group-hover:text-gray-700"}`}>
        {label}
        <span className="flex flex-col leading-none">
          <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor"
            className={active && sort.dir === "asc" ? "opacity-100" : "opacity-25"}>
            <path d="M3.5 0L7 5H0z" />
          </svg>
          <svg width="7" height="5" viewBox="0 0 7 5" fill="currentColor"
            className={active && sort.dir === "desc" ? "opacity-100" : "opacity-25"}>
            <path d="M3.5 5L0 0h7z" />
          </svg>
        </span>
      </span>
    </th>
  );
}

export function useSort(initial: string, initialDir: "asc" | "desc" = "asc") {
  const [sort, setSort] = useState<Sort>({ col: initial, dir: initialDir });
  function toggle(col: string) {
    setSort(s => s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" });
  }
  return { sort, toggle };
}

function deepGet(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj);
}

export function sortData<T>(data: T[], sort: Sort): T[] {
  return [...data].sort((a, b) => {
    const va = deepGet(a, sort.col) ?? "";
    const vb = deepGet(b, sort.col) ?? "";
    const cmp = typeof va === "number" && typeof vb === "number"
      ? va - vb
      : String(va).localeCompare(String(vb), "pt-BR", { sensitivity: "base" });
    return sort.dir === "asc" ? cmp : -cmp;
  });
}
