"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SectionLabel } from "@/components/ui/section-label";

type Post = {
  id: string;
  caption?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  media_type?: string;
};

export function InstagramFeed() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch("/api/public/instagram?limit=6")
      .then((r) => r.json())
      .then((data: { data: Post[] }) => {
        if (data.data?.length) setPosts(data.data);
      })
      .catch(() => undefined);
  }, []);

  const items: Post[] = posts.length > 0 ? posts : Array.from({ length: 6 }, (_, i) => ({ id: String(i) }));

  return (
    <section id="instagram" className="bg-background-secondary py-24">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel label="Instagram" />
        <h2
          className="font-heading text-text-primary mb-12"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          @edbarbearia
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {items.map((post) => {
            const imgSrc = post.media_url ?? post.thumbnail_url;
            return (
              <a
                key={post.id}
                href={post.permalink ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square block overflow-hidden bg-background-tertiary border border-border hover:border-gold/50 transition-colors duration-300 group relative"
              >
                {imgSrc && (
                  <Image
                    src={imgSrc}
                    alt={post.caption?.slice(0, 80) ?? "Post do Instagram"}
                    fill
                    sizes="(max-width: 768px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                )}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
