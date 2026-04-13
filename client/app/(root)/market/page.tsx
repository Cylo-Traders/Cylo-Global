import MarketHero from "./_components/market-hero";
import { FarmerMapSection } from "./_components/farmer-map-section";
import { ProductsSection } from "./_components/products-section";
import { FarmersSection } from "./_components/farmers-section";

export const metadata = {
  title: "Marketplace",
};

export default function MarketPage() {
  return (
    <div className="flex flex-col">
      <MarketHero />
      <FarmerMapSection />
      <ProductsSection />
      <FarmersSection />
    </div>
  );
}
