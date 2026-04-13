"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MapPin } from "lucide-react";
import Wrapper from "@/components/shared/wrapper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import farmersData from "@/lib/data/farmers.json";

const FarmerMap = dynamic(() => import("./farmer-map").then((m) => m.FarmerMap), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-[28px]" />,
});

const distances = [
  { label: "10 km", value: 10 },
  { label: "25 km", value: 25 },
  { label: "50 km", value: 50 },
  { label: "100 km", value: 100 },
  { label: "All", value: 0 },
];

export function FarmerMapSection() {
  const [radius, setRadius] = useState(0);

  return (
    <section className="py-12">
      <Wrapper>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              <h2 className="text-xl font-bold sm:text-2xl">Find Farmers Near You</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Discover local farmers on the map and buy directly
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {distances.map((d) => (
              <Button
                key={d.value}
                variant={radius === d.value ? "default" : "outline"}
                size="sm"
                onClick={() => setRadius(d.value)}
              >
                {d.label}
              </Button>
            ))}
          </div>
        </div>
        <FarmerMap farmers={farmersData} />
      </Wrapper>
    </section>
  );
}
