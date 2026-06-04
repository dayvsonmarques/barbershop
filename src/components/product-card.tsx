import Image from "next/image";
import Link from "next/link";

type Props = {
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  primaryImageUrl: string | null;
};

export function ProductCard({ name, slug, price, discountPrice, primaryImageUrl }: Props) {
  const displayPrice = discountPrice ?? price;
  const discountPct = discountPrice ? Math.round((1 - discountPrice / price) * 100) : null;

  const fmt = (n: number) =>
    Number(n).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return (
    <Link href={`/produtos/${slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-background-tertiary border border-border mb-3">
        {primaryImageUrl ? (
          <Image
            src={primaryImageUrl}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-border">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
        )}
        {discountPct && (
          <span className="absolute top-2 left-2 bg-gold text-background-primary text-xs font-bold px-2 py-0.5">
            -{discountPct}%
          </span>
        )}
      </div>
      <h3 className="text-text-primary text-sm font-medium leading-snug mb-1 line-clamp-2">{name}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-gold font-semibold text-base">R$ {fmt(displayPrice)}</span>
        {discountPrice && (
          <span className="text-text-secondary text-sm line-through">R$ {fmt(price)}</span>
        )}
      </div>
    </Link>
  );
}
