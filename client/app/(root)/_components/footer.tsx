import Image from "next/image";
import Link from "next/link";
import { RiTwitterXLine } from "react-icons/ri";
import { RxInstagramLogo } from "react-icons/rx";
import { PiLinkedinLogo } from "react-icons/pi";
import { PiFacebookLogo } from "react-icons/pi";

import Wrapper from "@/components/shared/wrapper";
import { siteConfig } from "@/config/site.config";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  routes: [
    {
      title: "Quick Links",
      routes: [
        { label: "Home", path: "/" },
        { label: "About Us", path: "/about" },
        { label: "Marketplace", path: "/market" },
        { label: "Contact Us", path: "/contact" },
        { label: "Onboarding", path: "/onboarding" },
      ],
    },
    {
      title: "Legal",
      routes: [
        { label: "Terms of Service", path: "/" },
        { label: "Privacy Policy", path: "/" },
        { label: "Cookie Policy", path: "/" },
        { label: "Disclaimers", path: "/" },
      ],
    },
    {
      title: "Contact",
      routes: [
        { label: "About Cylo", path: "/about" },
        { label: "FAQ", path: "/contact" },
        { label: "Contact Us", path: "/contact" },
        { label: "Support", path: "/contact" },
      ],
    },
  ],
  socials: [
    {
      label: "AgricCylo - X (Twitter)",
      icon: RiTwitterXLine,
      path: "https://x.com/AgricCylo",
    },
    {
      label: "Instagram",
      icon: RxInstagramLogo,
      path: undefined as string | undefined,
    },
    {
      label: "LinkedIn",
      icon: PiLinkedinLogo,
      path: undefined as string | undefined,
    },
    {
      label: "FaceBook",
      icon: PiFacebookLogo,
      path: undefined as string | undefined,
    },
  ],
};

const Footer = () => {
  return (
    <footer className="bg-canvas-dark flex w-full flex-col text-white">
      <Wrapper className="flex flex-col pt-20 pb-10 sm:pb-16">
        <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-2">
          <nav>
            <ul role="list" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {footerLinks.routes.map((link, index) => (
                <li key={index}>
                  <div className="font-display text-lg font-semibold tracking-wider">
                    {link.title}
                  </div>
                  <ul role="list" className="mt-4 text-sm">
                    {link.routes.map((route) => (
                      <li key={route.label} className="mt-4">
                        <a
                          className="hover:text-primary transition"
                          href={route.path}
                        >
                          {route.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex lg:justify-end">
            <div className="w-full sm:max-w-[363px]">
              <div className="flex items-center justify-start md:w-full md:max-w-[180px] lg:max-w-[240px]">
                <Link href="/" className="-ml-1 w-fit">
                  <Image
                    src="/logo-light.svg"
                    alt={siteConfig.title}
                    height={49}
                    width={131}
                    priority
                    quality={100}
                    className="!h-[34px] !w-[100px] object-contain sm:h-[49px] sm:w-[131px]"
                  />
                </Link>
              </div>
              <p className="mt-3 text-[15px] leading-[1.6]">
                Building a fair and transparent agricultural marketplace on the
                blockchain.
              </p>

              <div className="mt-6 flex items-center gap-5">
                {footerLinks.socials.map((social, index) => (
                  <button
                    key={index}
                    disabled={!social.path}
                    className="size-fit focus-visible:ring-0 focus-visible:outline-0 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Link
                      title={social.label}
                      href={social.path ?? "/"}
                      target={social.path ? "_blank" : "_self"}
                    >
                      <social.icon className="size-6 cursor-pointer transition" />
                    </Link>
                  </button>
                ))}
                <span className="bg-border/30 h-px w-full flex-1" />
              </div>
            </div>
          </div>
        </div>
        <Separator className="bg-border/30 my-10 sm:my-16" />
        <div className="border-t-border/30 flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="flex items-center gap-3">
            <span className="text-sm font-medium">Powered by</span>{" "}
            <Link href="https://www.starknet.io/" target="_blank">
              <Image
                src="/assets/starknet-light.svg"
                alt="starknet"
                width={95}
                height={24}
                priority
                quality={100}
              />
            </Link>
          </p>

          <p className="text-sm font-medium">
            © 2025 {siteConfig.title}. All rights reserved.
          </p>
        </div>
      </Wrapper>
    </footer>
  );
};

export default Footer;
