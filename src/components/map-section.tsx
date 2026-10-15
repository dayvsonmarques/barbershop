"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { SectionLabel } from "@/components/ui/section-label";


type PublicSettings = {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

// Quantos tiles podem falhar (sem nenhum carregar) antes de ocultar o mapa
const MAX_TILE_ERRORS = 3;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function MapSection() {
  const mapRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);

  const tileUrl =
    process.env.NEXT_PUBLIC_MAP_TILE_URL ??
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileAttribution =
    process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ??
    "© OpenStreetMap contributors";
  const zoom = Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM ?? 17);

  const address = settings?.address?.trim() ?? "";
  const lat = settings?.latitude;
  const lng = settings?.longitude;
  const hasCoords =
    Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
  const showMap = hasCoords && !mapFailed;

  useEffect(() => {
    fetch("/api/public/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data) setSettings(json.data as PublicSettings);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Só carrega o Leaflet e os tiles quando a seção se aproxima da tela
  useEffect(() => {
    const el = mapRef.current;
    if (!showMap || !el) return;

    let map: LeafletMap | null = null;
    let cancelled = false;

    const init = async () => {
      if (!document.querySelector('link[data-leaflet="true"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.setAttribute("data-leaflet", "true");
        document.head.appendChild(link);
      }

      const leafletModule = await import("leaflet");
      const L = leafletModule.default ?? leafletModule;
      if (cancelled || lat === undefined || lng === undefined) return;

      const leafletMap = L.map(el, { scrollWheelZoom: false }).setView([lat, lng], zoom);
      map = leafletMap;

      let tileErrors = 0;
      let tileLoaded = false;
      L.tileLayer(tileUrl, { attribution: tileAttribution })
        .on("tileload", () => { tileLoaded = true; })
        .on("tileerror", () => {
          tileErrors += 1;
          if (!tileLoaded && tileErrors >= MAX_TILE_ERRORS) {
            map?.remove();
            map = null;
            setMapFailed(true);
          }
        })
        .addTo(leafletMap);

      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="background-color:#000;width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:14px;height:14px;border-radius:9999px;background:white;"></div>
          </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(leafletMap);
      marker.bindPopup(
        `<div style="text-align:center;padding:8px;">
          <strong style="font-size:16px;display:block;margin-bottom:4px;">${escapeHtml(settings?.name ?? "Barbearia")}</strong>
          ${address ? `<p style="margin:0;color:#666;">${escapeHtml(address)}</p>` : ""}
        </div>`.trim()
      );
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        init().catch(() => setMapFailed(true));
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
      map?.remove();
    };
  }, [loaded, showMap, lat, lng, zoom, tileUrl, tileAttribution, address, settings?.name]);

  // Sem endereço nem coordenadas cadastrados no admin: não exibe a seção
  if (!loaded || (!address && !hasCoords)) return null;

  const routeDestination = hasCoords
    ? `${lat},${lng}`
    : encodeURIComponent(address);

  return (
    <section id="local" className="bg-background-primary py-24">
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <SectionLabel label="Localização" />
        <h2
          className="font-heading text-text-primary mb-3"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "1.1" }}
        >
          Onde estamos
        </h2>
        {address && (
          <p className="text-text-secondary text-lg mb-6">{address}</p>
        )}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${routeDestination}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-gold text-gold px-5 py-2.5 text-sm uppercase tracking-widest font-heading hover:bg-gold hover:text-background-primary transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          Simular rota
        </a>
      </div>
      {showMap && (
        <div
          ref={mapRef}
          className="h-[60vh] md:h-[30vh] lg:h-[60vh] w-full"
          style={{ filter: "grayscale(1) contrast(1.08)" }}
        />
      )}
    </section>
  );
}
