"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PublicSettings = {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string | null;
  openingHours?: Record<string, string>;
};

export function MapSection() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [settings, setSettings] = useState<PublicSettings | null>(null);

  const tileUrl =
    process.env.NEXT_PUBLIC_MAP_TILE_URL ??
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileAttribution =
    process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ?? "© OpenStreetMap contributors";

  const fallbackLat = Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LAT ?? -8.047562);
  const fallbackLng = Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LNG ?? -34.877);
  const fallbackZoom = Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM ?? 15);

  const mapCenter = useMemo(() => {
    const lat = settings?.latitude ?? fallbackLat;
    const lng = settings?.longitude ?? fallbackLng;
    return { lat, lng };
  }, [settings?.latitude, settings?.longitude, fallbackLat, fallbackLng]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/public/settings");
        if (!res.ok) return;
        const json = (await res.json()) as { data?: PublicSettings | null };
        if (json.data) setSettings(json.data);
      } catch {
        // ignore
      }
    };

    load();
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined" || !mapRef.current) return;

    // Import Leaflet CSS once
    if (!document.querySelector('link[data-leaflet="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.setAttribute("data-leaflet", "true");
      document.head.appendChild(link);
    }

    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((leafletModule) => {
      const L = (leafletModule as any).default ?? leafletModule;

      // Initialize map once
      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current!).setView(
          [mapCenter.lat, mapCenter.lng],
          fallbackZoom
        );

        L.tileLayer(tileUrl, {
          attribution: tileAttribution,
        }).addTo(map);

        const customIcon = L.divIcon({
          className: "custom-marker",
          html: `
            <div style="
              background-color: #000;
              width: 40px;
              height: 40px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(45deg);
                width: 14px;
                height: 14px;
                border-radius: 9999px;
                background: white;
              "></div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        });

        const marker = L.marker([mapCenter.lat, mapCenter.lng], { icon: customIcon }).addTo(map);
        markerRef.current = marker;
        mapInstanceRef.current = map;
      }

      // Update marker + view when settings change
      const map = mapInstanceRef.current;
      if (map) {
        map.setView([mapCenter.lat, mapCenter.lng], map.getZoom());
      }

      if (markerRef.current) {
        markerRef.current.setLatLng([mapCenter.lat, mapCenter.lng]);

        const name = settings?.name ?? "ED Barbearia";
        const address = settings?.address ?? "";

        markerRef.current.bindPopup(
          `
            <div style="text-align: center; padding: 8px;">
              <strong style="font-size: 16px; display: block; margin-bottom: 4px;">${name}</strong>
              <p style="margin: 0; color: #666;">${address}</p>
            </div>
          `.trim()
        );
      }
    });

    return () => {
      // Do not destroy map on re-render; keep instance.
    };
  }, [mapCenter.lat, mapCenter.lng, fallbackZoom, tileUrl, tileAttribution, settings?.address, settings?.name]);

  const addressLines = (settings?.address ?? "").split("\n").filter(Boolean);
  const hoursSummary = buildHoursSummary(settings?.openingHours ?? {});

  return (
    <section className="py-20 bg-black text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Onde Estamos
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Venha nos visitar e conheça nossas instalações
          </p>
        </div>

        <div>
          <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
            <div ref={mapRef} className="h-[75vh] w-screen overflow-hidden" />
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="rounded-lg border border-white/10 bg-white p-6 text-black">
              <h3 className="font-semibold mb-2">Endereço</h3>
              {addressLines.length > 0 ? (
                addressLines.map((line) => (
                  <p key={line} className="text-black/70">
                    {line}
                  </p>
                ))
              ) : (
                <p className="text-black/70">Endereço não informado</p>
              )}
            </div>
            <div className="rounded-lg border border-white/10 bg-white p-6 text-black">
              <h3 className="font-semibold mb-2">Telefone</h3>
              <p className="text-black/70">
                {settings?.phone ? settings.phone : "Telefone não informado"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white p-6 text-black">
              <h3 className="font-semibold mb-2">Horário</h3>
              {hoursSummary.map((line) => (
                <p key={line} className="text-black/70">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function buildHoursSummary(openingHours: Record<string, string>): string[] {
  const monday = openingHours.monday;
  const tuesday = openingHours.tuesday;
  const wednesday = openingHours.wednesday;
  const thursday = openingHours.thursday;
  const friday = openingHours.friday;
  const saturday = openingHours.saturday;
  const sunday = openingHours.sunday;

  const week = [monday, tuesday, wednesday, thursday, friday].filter(Boolean);
  const allWeekSame = week.length === 5 && week.every((v) => v === week[0]);

  const lines: string[] = [];
  if (allWeekSame) {
    lines.push(`Seg-Sex: ${week[0]}`);
  } else if (week.length > 0) {
    lines.push("Seg-Sex: consulte horários");
  }

  if (saturday) lines.push(`Sábado: ${saturday}`);
  if (sunday) lines.push(`Domingo: ${sunday}`);

  if (lines.length === 0) return ["Horário não informado"];
  return lines;
}
