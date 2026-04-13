import { RiArrowRightUpLine } from "react-icons/ri";

import Wrapper from "@/components/shared/wrapper";
import { Button, buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site.config";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const CTA = () => {
  return (
    <div className="mb-16 md:mb-56">
      <Wrapper>
        <div className="bg-foreground rounded-4xl px-6 pt-20 pb-10 sm:px-8 md:px-12 md:py-32">
          <div className="mx-auto max-w-4xl">
            <div className="max-w-xl">
              <h2 className="font-display text-background text-2xl font-medium text-balance sm:text-3xl md:text-4xl">
                Join the Future of Agriculture
              </h2>
              <div className="mt-3 flex sm:mt-6">
                <p className="text-background/80 text-base sm:leading-[1.6]">
                  Whether you&apos;re a farmer looking to sell directly or a
                  buyer seeking fresh, quality products, {siteConfig.title} is
                  your trusted marketplace.
                </p>
              </div>

              <Separator className="bg-border/30 my-10" />

              <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:gap-2">
                <Link
                  href="/market"
                  className={buttonVariants({
                    size: "lg",
                    variant: "secondary",
                  })}
                >
                  <span>Explore Marketplace</span>
                </Link>
                <Button variant="link" size="lg" className="group !text-white">
                  <span>Get Started</span>
                  <RiArrowRightUpLine className="size-5 transition-all ease-in-out group-hover:rotate-45 sm:!size-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Wrapper>
    </div>
  );
};

export default CTA;
