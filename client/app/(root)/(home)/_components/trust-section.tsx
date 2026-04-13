import { IoShieldHalf } from "react-icons/io5";
import { GoLock } from "react-icons/go";
import { HiOutlineDocumentCheck } from "react-icons/hi2";

import Wrapper from "@/components/shared/wrapper";
import { siteConfig } from "@/config/site.config";

const trusts = [
  {
    title: "Secure Smart Contracts",
    description:
      "Our smart contract system ensures secure and transparent transactions between farmers and buyers.",
    icon: IoShieldHalf,
  },
  {
    title: "Escrow Protection",
    description:
      "Payments are held in escrow until delivery is confirmed, ensuring trust for both parties.",
    icon: GoLock,
  },
  {
    title: "Transparent Records",
    description:
      "All transactions are recorded on the blockchain for permanent verification.",
    icon: HiOutlineDocumentCheck,
  },
];

const Testimonies = () => {
  return (
    <section
      id="trust"
      className="bg-secondary/50 dark:bg-[#0f1a10]/60 dark:border-primary/10 mb-16 border-y py-10 md:mb-40 md:py-32"
    >
      <Wrapper>
        <div className="grid grid-cols-1 gap-10 md:gap-20 lg:grid-cols-2 lg:gap-10">
          <div className="w-full">
            <h2 className="text-primary text-2xl font-medium sm:text-3xl md:text-4xl lg:text-[40px]">
              Built for Trust
            </h2>
            <p className="text-muted-foreground mt-4 text-base md:text-lg lg:leading-[1.5]">
              {siteConfig.title} leverages Starknet&apos;s blockchain technology
              to ensure every transaction is secure, transparent, and
              verifiable.
            </p>

            <ul role="list" className="text-muted-foreground my-8 text-sm">
              {trusts.map((list, index) => (
                <li key={index} className="mt-5 flex items-start gap-4">
                  <list.icon className="!size-6" />
                  <div className="flex flex-1 flex-col gap-1">
                    <p className="text-foreground text-base font-semibold">
                      {list.title}
                    </p>
                    <p className="text-base">{list.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="text-muted-foreground mt-4 text-base md:text-lg lg:leading-[1.5]">
              Our smart contracts handle payments, refunds, and fees
              automatically, so farmers and buyers can trade with confidence.
            </p>
          </div>

          <div className="relative flex size-full items-center justify-end">
            <div className="bg-background mx-auto flex-1 rounded-3xl border p-4 sm:p-6 md:max-w-[90%] lg:mr-0 lg:ml-auto">
              <div className="bg-secondary mb-5 rounded-2xl border p-4 sm:mb-6 sm:p-6">
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <div className="flex items-center">
                    <div className="bg-background flex size-8 items-center justify-center rounded-full border">
                      <span className="text-xs font-bold">JD</span>
                    </div>
                    <span className="ml-3 font-medium">Farmer John Doe</span>
                  </div>
                  <span className="text-muted-foreground text-xs font-medium">
                    Yesterday
                  </span>
                </div>
                <blockquote className="font-display relative text-base leading-[1.6] font-medium italic">
                  <p>
                    &ldquo;{siteConfig.title} makes selling my crops easy and
                    secure! I love that I can reach buyers directly and get paid
                    quickly without worrying about payment issues.&rdquo;
                  </p>
                </blockquote>
              </div>

              <div className="mb-5 ml-4 flex items-center space-x-2 sm:mb-6">
                <div className="mt-px size-2 animate-pulse rounded-full bg-green-600"></div>
                <p className="text-sm text-green-600">Secured by Starknet</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-secondary rounded-lg border p-3 sm:rounded-2xl">
                  <div className="text-xl font-bold text-green-600 sm:text-2xl">
                    100%
                  </div>
                  <div className="text-sm font-medium">Secure</div>
                </div>
                <div className="bg-secondary rounded-lg border p-3 sm:rounded-2xl">
                  <div className="text-xl font-bold text-green-600 sm:text-2xl">
                    2.5%
                  </div>
                  <div className="text-sm font-medium">Fee</div>
                </div>
                <div className="bg-secondary rounded-lg border p-3 sm:rounded-2xl">
                  <div className="text-xl font-bold text-green-600 sm:text-2xl">
                    24/7
                  </div>
                  <div className="text-sm font-medium">Trading</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Wrapper>
    </section>
  );
};

export default Testimonies;
