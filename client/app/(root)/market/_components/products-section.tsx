"use client";

import { GoArrowRight } from "react-icons/go";
import { Button } from "@/components/ui/button";
import Wrapper from "@/components/shared/wrapper";
import ProductCard from "@/app/(root)/_components/product-card";
import productsData from "@/lib/data/products.json";
import type { IProduct } from "@/lib/types";

const products = productsData as IProduct[];

export function ProductsSection() {
  return (
    <div className="mb-16 md:mb-40">
      <div className="flex flex-col items-center gap-10">
        <Wrapper className="flex items-center justify-between">
          <h2 className="text-foreground max-w-[672px] text-2xl leading-none font-semibold sm:text-3xl md:text-4xl lg:text-[40px]">
            Explore Marketplace
          </h2>
        </Wrapper>
        <Wrapper
          max2
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Wrapper>
        <Button>
          <span>View All Items</span>
          <GoArrowRight className="!size-5" />
        </Button>
      </div>
    </div>
  );
}
