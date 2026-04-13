"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import type { IFarmer } from "@/lib/types";

const farmerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface FarmerMapProps {
  farmers: IFarmer[];
}

export function FarmerMap({ farmers }: FarmerMapProps) {
  const center: [number, number] = [6.5244, 3.3792]; // Lagos default

  return (
    <div className="overflow-hidden rounded-[28px] border">
      <MapContainer
        center={center}
        zoom={5}
        scrollWheelZoom={false}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {farmers.map((farmer) =>
          farmer.latitude && farmer.longitude ? (
            <Marker
              key={farmer.wallet}
              position={[farmer.latitude, farmer.longitude]}
              icon={farmerIcon}
            >
              <Popup>
                <div className="min-w-[160px] space-y-2 p-1">
                  <p className="font-semibold">{farmer.displayName}</p>
                  <p className="text-xs text-gray-600">
                    {farmer.city}, {farmer.country}
                  </p>
                  <p className="text-xs text-gray-500">{farmer.totalOrders} orders</p>
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/market/${farmer.wallet}`}>View Products</Link>
                  </Button>
                </div>
              </Popup>
            </Marker>
          ) : null,
        )}
      </MapContainer>
    </div>
  );
}
