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

  const defaultAddress = "Rua casa amarela,73, Recife, Brasil, CEP: 52070-330";

  const tileUrl =
    process.env.NEXT_PUBLIC_MAP_TILE_URL ??
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  const tileAttribution =
    process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ??
    "© OpenStreetMap contributors © CARTO";

  const fallbackLat = Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LAT ?? -8.0260634);
  const fallbackLng = Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LNG ?? -34.9196525);
  const fallbackZoom = Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM ?? 16);

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
        const map = L.map(mapRef.current!, {
          scrollWheelZoom: false,
        }).setView([mapCenter.lat, mapCenter.lng], fallbackZoom);

        // Safety: ensure scroll wheel zoom is disabled.
        map.scrollWheelZoom.disable();

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
        const address = settings?.address ?? defaultAddress;

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
  }, [mapCenter.lat, mapCenter.lng, fallbackZoom, tileUrl, tileAttribution, settings?.address, settings?.name, defaultAddress]);

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
            <div
              ref={mapRef}
              className="h-[75vh] w-screen overflow-hidden"
              style={{ filter: "grayscale(1) contrast(1.08)" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
