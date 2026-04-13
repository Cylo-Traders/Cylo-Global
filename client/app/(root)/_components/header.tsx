import Link from "next/link";
import Image from "next/image";

import Wrapper from "@/components/shared/wrapper";
import { siteConfig } from "@/config/site.config";
import ConnectWallet from "@/components/shared/connect-wallet";
import { Separator } from "@/components/ui/separator";
import CartSidebar from "./cart-sidebar";

const navItems = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "About",
    href: "/#how-it-works",
  },
  {
    title: "Marketplace",
    href: "/market",
  },
  {
    title: "Contact Us",
    href: "/",
  },
];

const Header = () => {
  return (
    <header className="fixed top-0 left-0 z-50 flex h-20 w-full flex-col justify-end backdrop-blur-3xl transition-colors duration-300 ease-in-out md:h-28">
      <Wrapper
        max2
        className="mt-auto flex items-center justify-between pb-2 md:pb-4"
      >
        <div className="flex items-center justify-start md:w-full md:max-w-[180px] lg:max-w-[240px]">
          <Link href="/" className="-ml-1 w-fit">
            <Image
              src="/logo.svg"
              alt={siteConfig.title}
              height={49}
              width={131}
              priority
              quality={100}
              className="!h-[34px] !w-[100px] object-contain sm:h-[49px] sm:w-[131px]"
            />
          </Link>
        </div>

        <ul className="hidden flex-1 items-center justify-center gap-7 md:flex lg:gap-8 xl:gap-10">
          {navItems.map((item, index) => (
            <li key={item.title ?? index}>
              <Link
                href={item.href}
                className="text-sm font-normal transition-colors lg:text-lg"
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex w-full max-w-[180px] items-center justify-end lg:max-w-[240px]">
          <ConnectWallet />
          <div className="ml-3 flex items-center gap-3 sm:ml-4 sm:gap-4">
            <Separator orientation="vertical" className="!h-5" />
            <CartSidebar />
          </div>
        </div>
      </Wrapper>
    </header>
  );
};

export default Header;
