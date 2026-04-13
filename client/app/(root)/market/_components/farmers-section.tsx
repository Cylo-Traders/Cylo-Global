import Wrapper from "@/components/shared/wrapper";
import { Button } from "@/components/ui/button";
import FarmerCard from "@/app/(root)/_components/farmer-card";
import farmersData from "@/lib/data/farmers.json";
import type { IFarmer } from "@/lib/types";

const farmers = farmersData as IFarmer[];

export function FarmersSection() {
  return (
    <div className="mb-16 md:mb-40">
      <div className="flex flex-col items-center gap-10">
        <Wrapper className="flex items-center justify-between">
          <h2 className="text-foreground max-w-[672px] text-2xl leading-none font-semibold sm:text-3xl md:text-4xl lg:text-[40px]">
            Explore Sellers
          </h2>
          <Button variant="outline">View All</Button>
        </Wrapper>
        <Wrapper
          max2
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3"
        >
          {farmers.map((farmer) => (
            <FarmerCard key={farmer.wallet} farmer={farmer} />
          ))}
        </Wrapper>
      </div>
    </div>
  );
}
