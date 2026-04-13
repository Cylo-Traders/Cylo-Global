import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { FC } from "react";
import { GoPlus } from "react-icons/go";
import type { IFarmer } from "@/lib/types";

const FarmerCard: FC<{ farmer: IFarmer }> = ({ farmer }) => {
  const { displayName, username, avatar, country, wallet } = farmer;

  return (
    <div className="border-foreground group rounded-[40px] border-2 p-6">
      <div className="mb-5">
        <div className="bg-secondary border-foreground relative aspect-square w-full overflow-hidden rounded-[40px] border-2">
          <Image
            src={avatar}
            alt={displayName ?? username ?? "Farmer's Image"}
            priority
            quality={100}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-125"
          />
        </div>
      </div>

      <div className="flex flex-col">
        <p className="text-base font-semibold">
          {displayName ? displayName : `@${username}`}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 md:gap-4">
          <p className="text-sm font-medium">{country}</p>

          <Button size="sm" className="!h-8" asChild>
            <Link href={`/market/${wallet}`}>
              <span className="text-xs font-semibold">Explore Products</span>
              <GoPlus className="!size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FarmerCard;
