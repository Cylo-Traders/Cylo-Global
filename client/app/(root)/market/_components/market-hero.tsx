import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";
import { RiArrowRightUpLine } from "react-icons/ri";
import Marquee from "react-fast-marquee";

import Wrapper from "@/components/shared/wrapper";
import { siteConfig } from "@/config/site.config";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MarketHero = () => {
  return (
    <Fragment>
      <div className="relative lg:h-[calc(100dvh-80px)]">
        <div className="absolute inset-0 size-full">
          <Image
            src="/images/market-hero.avif"
            alt="a-tractor-is-driving-through-a-field-at-sunset"
            fill
            className="size-full object-cover object-center"
            quality={100}
            priority
            sizes="100vw"
            loading="eager"
            placeholder="blur"
            blurDataURL="/images/home-hero.avif"
            unoptimized
            fetchPriority="high"
            draggable={false}
            decoding="async"
          />
        </div>
        <div className="from-background/90 via-background/85 to-background/25 relative bg-gradient-to-r pt-40 pb-20 sm:py-72 lg:h-full">
          <Wrapper>
            <h1 className="text-foreground max-w-[805px] text-3xl leading-[1.3] font-semibold sm:text-4xl md:text-5xl lg:text-[64px]">
              Discover and Trade Different Farm Produce with{" "}
              <span className="text-primary">{siteConfig.title}</span>.
            </h1>
            <p className="mt-2 max-w-[700px] text-base font-normal md:text-lg">
              Browse and purchase agricultural products directly from farmers
              around the world. All transactions are secured by Starknet
              blockchain technology.
            </p>

            <div className="mt-10 flex w-full flex-col gap-4 sm:flex-row sm:gap-6">
              <Link
                href="/market"
                className={buttonVariants({
                  size: "lg",
                  className: "group",
                })}
              >
                <span className="sm:text-base sm:font-semibold">
                  Upload Item
                </span>
                <RiArrowRightUpLine className="size-5 transition-all ease-in-out group-hover:rotate-45 sm:!size-6" />
              </Link>
            </div>
          </Wrapper>
        </div>
      </div>
      <Marquee
        pauseOnHover
        className="mb-16 bg-[#FCCD29] py-4 sm:h-20 sm:py-0 md:mb-40"
      >
        <div className="flex items-center space-x-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Fragment key={index}>
              <p className="text-base font-medium">Top Sellers.</p>
              <Link
                href="https://x.com/AgricCylo"
                target="_blank"
                className="bg-foreground flex h-11 items-center justify-center gap-2 rounded-full py-1.5 pr-3 pl-2 last-of-type:mr-5"
              >
                <Avatar className="size-7">
                  <AvatarImage />
                  <AvatarFallback className="text-sm font-medium">
                    AS
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs font-bold text-white">@AgricCylo</p>
              </Link>
            </Fragment>
          ))}
        </div>
      </Marquee>
    </Fragment>
  );
};

export default MarketHero;
