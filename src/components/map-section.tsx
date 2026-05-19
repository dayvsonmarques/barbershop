// src/components/map-section.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SectionLabel } from "@/components/ui/section-label";

type PublicSettings = {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export function MapSection() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [settings, setSettings] = useState<PublicSettings | null>(null);

  const tileUrl =
    process.env.NEXT_PUBLIC_MAP_TILE_URL ??
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  const tileAttribution =
    process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ??
    "© OpenStreetMap contributors © CARTO";

  const fallbackLat = Number(
    process.env.NEXT_PUBLIC_MAP_DEFAULT_LAT ?? -8.0260634
  );
  const fallbackLng = Number(
    process.env.NEXT_PUBLIC_MAP_DEFAULT_LNG ?? -34.9196525
  );
  const fallbackZoom = Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM ?? 16);

  const mapCenter = useMemo(
    () => ({
      lat: settings?.latitude ?? fallbackLat,
      lng: settings?.longitude ?? fallbackLng,
    }),
    [settings?.latitude, settings?.longitude, fallbackLat, fallbackLng]
  );

  useEffect(() => {
    fetch("/api/public/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data) setSettings(json.data as PublicSettings);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    if (!document.querySelector('link[data-leaflet="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.setAttribute("data-leaflet", "true");
      document.head.appendChild(link);
    }

    import("leaflet").then((leafletModule) => {
      const L = (leafletModule as any).default ?? leafletModule;

      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current!, {
          scrollWheelZoom: false,
        }).setView([mapCenter.lat, mapCenter.lng], fallbackZoom);

        map.scrollWheelZoom.disable();

        L.tileLayer(tileUrl, { attribution: tileAttribution }).addTo(map);

        const customIcon = L.divIcon({
          className: "custom-marker",
          html: `
            <div style="background-color:#000;width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);width:14px;height:14px;border-radius:9999px;background:white;"></div>
            </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        });

        const marker = L.marker([mapCenter.lat, mapCenter.lng], {
          icon: customIcon,
        }).addTo(map);
        markerRef.current = marker;
        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;
      if (map) map.setView([mapCenter.lat, mapCenter.lng], map.getZoom());

      if (markerRef.current) {
        markerRef.current.setLatLng([mapCenter.lat, mapCenter.lng]);
        markerRef.current.bindPopup(
          `<div style="text-align:center;padding:8px;">
            <strong style="font-size:16px;display:block;margin-bottom:4px;">${settings?.name ?? "ED Barbearia"}</strong>
            <p style="margin:0;color:#666;">${settings?.address ?? "Rua casa amarela, 73, Recife"}</p>
          </div>`.trim()
        );
      }
    });
  }, [
    mapCenter.lat,
    mapCenter.lng,
    fallbackZoom,
    tileUrl,
    tileAttribution,
    settings?.address,
    settings?.name,
  ]);

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
        <p className="text-text-secondary">
          {settings?.address ?? "Rua casa amarela, 73 — Recife, PE"}
        </p>
      </div>
      <div className="border-y border-border">
        <div
          ref={mapRef}
          className="h-[60vh] w-full"
          style={{ filter: "grayscale(1) contrast(1.08)" }}
        />
      </div>
    </section>
  );
}
