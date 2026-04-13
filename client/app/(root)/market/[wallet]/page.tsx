import Image from "next/image";
import { MapPin, Star, Package } from "lucide-react";
import Wrapper from "@/components/shared/wrapper";
import ProductCard from "@/app/(root)/_components/product-card";
import farmersData from "@/lib/data/farmers.json";
import productsData from "@/lib/data/products.json";
import type { IFarmer, IProduct } from "@/lib/types";

const farmers = farmersData as IFarmer[];
const products = productsData as IProduct[];

export function generateStaticParams() {
  return farmers.map((f) => ({ wallet: f.wallet }));
}

export default async function FarmerProfilePage({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet } = await params;
  const farmer = farmers.find((f) => f.wallet === wallet) ?? farmers[0];
  const farmerProducts = products.filter((p) => p.farmer.wallet === wallet);

  return (
    <>
      <section className="bg-secondary/30 pt-28 pb-12 md:pt-36">
        <Wrapper>
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <Image
              src={farmer.avatar}
              alt={farmer.displayName}
              width={100}
              height={100}
              className="rounded-full border-4 border-background shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{farmer.displayName}</h1>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
                <span className="flex items-center gap-1">
                  <MapPin className="size-4" />
                  {farmer.city}, {farmer.country}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="size-4 text-[#FCCD29]" />
                  {farmer.rating} rating
                </span>
                <span className="flex items-center gap-1">
                  <Package className="size-4" />
                  {farmer.totalOrders} orders
                </span>
              </div>
              <p className="mt-3 max-w-lg text-sm text-muted-foreground">{farmer.bio}</p>
            </div>
          </div>
        </Wrapper>
      </section>

      <section className="py-12">
        <Wrapper>
          <h2 className="mb-6 text-xl font-bold">
            Products ({farmerProducts.length})
          </h2>
          {farmerProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {farmerProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground">
              This farmer has no products listed yet.
            </p>
          )}
        </Wrapper>
      </section>
    </>
  );
}
