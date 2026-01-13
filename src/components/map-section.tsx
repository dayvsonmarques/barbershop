"use client";

import { useEffect, useRef } from "react";

export function MapSection() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined" || !mapRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      // Check if map is already initialized
      if (mapRef.current?.querySelector(".leaflet-container")) return;

      // Coordinates for the establishment (example: São Paulo center)
      const lat = -23.5505;
      const lng = -46.6333;

      // Create map
      const map = L.map(mapRef.current!).setView([lat, lng], 15);

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Custom marker icon
      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            background-color: #2563eb;
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
              font-size: 20px;
            ">💈</div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      // Add marker
      L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(
          `
          <div style="text-align: center; padding: 8px;">
            <strong style="font-size: 16px; display: block; margin-bottom: 4px;">ED Barbearia</strong>
            <p style="margin: 0; color: #666;">Rua Exemplo, 123</p>
            <p style="margin: 0; color: #666;">São Paulo - SP</p>
          </div>
        `
        );
    });

    // Import Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Onde Estamos
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Venha nos visitar e conheça nossas instalações
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div
            ref={mapRef}
            className="w-full h-[500px] rounded-lg shadow-lg overflow-hidden"
          />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-3">📍</div>
              <h3 className="font-semibold text-gray-900 mb-2">Endereço</h3>
              <p className="text-gray-600">Rua Exemplo, 123</p>
              <p className="text-gray-600">São Paulo - SP</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-3">📞</div>
              <h3 className="font-semibold text-gray-900 mb-2">Telefone</h3>
              <p className="text-gray-600">(11) 9999-9999</p>
              <p className="text-gray-600">Segunda a Sábado</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-3">🕐</div>
              <h3 className="font-semibold text-gray-900 mb-2">Horário</h3>
              <p className="text-gray-600">Seg-Sex: 9h às 20h</p>
              <p className="text-gray-600">Sábado: 9h às 18h</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
