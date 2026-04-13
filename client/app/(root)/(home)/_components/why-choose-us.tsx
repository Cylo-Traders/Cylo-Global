import Wrapper from "@/components/shared/wrapper";
import { siteConfig } from "@/config/site.config";
import Image from "next/image";

const benefits = [
  {
    title: "Secure Transactions.",
    description:
      "Payments are held in escrow on the blockchain until delivery is confirmed, ensuring trust for both buyers and farmers.",
  },
  {
    title: "Low Fees.",
    description:
      "Enjoy a transparent 2.5% platform fee, keeping more value in the hands of farmers and buyers.",
  },
  {
    title: "Decentralized & Transparent.",
    description:
      "Built on Starknet for fast, low-cost, and verifiable transactions without intermediaries.",
  },
  {
    title: "Easy Order Management.",
    description:
      "Place, confirm, or cancel orders seamlessly with our intuitive smart contract system.",
  },
];

const WhyChooseUs = () => {
  return (
    <section id="why-choose-us" className="mb-16 md:mb-40">
      <Wrapper className="space-y-12">
        <div className="w-full">
          <h2 className="text-foreground max-w-[672px] text-2xl leading-none font-semibold sm:text-3xl md:text-4xl lg:text-[40px]">
            Why Choose {siteConfig.title}?
          </h2>
          <p className="text-muted-foreground mt-4 max-w-[672px] text-base font-normal md:text-lg lg:leading-[1.5]">
            Our decentralized platform provides unmatched benefits for both
            farmers and buyers.
          </p>
        </div>

        <div className="lg:flex lg:items-center lg:justify-end">
          <div className="flex justify-center lg:w-1/2 lg:justify-end lg:pr-12">
            <div className="w-full flex-none md:w-[33.75rem] lg:w-[45rem]">
              <div className="relative flex aspect-719/680 w-full justify-center transition duration-500 lg:justify-end">
                <svg viewBox="0 0 655 680" fill="none" className="h-full">
                  <g clipPath="url(#:S1:-clip)" className="group">
                    <g className="origin-center scale-100 transition delay-150 duration-700 motion-safe:group-hover:scale-110">
                      <foreignObject width="655" height="680">
                        <Image
                          alt=""
                          priority
                          quality={100}
                          width={2400}
                          height={3000}
                          decoding="async"
                          className="bg-secondary aspect-[655/680] w-full object-cover object-center"
                          data-nimg="1"
                          sizes="(min-width: 1024px) 41rem, 31rem"
                          src="https://images.pexels.com/photos/2933243/pexels-photo-2933243.jpeg?auto=compress&cs=tinysrgb&w=1920"
                        />
                      </foreignObject>
                    </g>
                    <use
                      href="#:S1:-shape"
                      strokeWidth="2"
                      className="stroke-muted-foreground/50"
                    ></use>
                  </g>
                  <defs>
                    <clipPath id=":S1:-clip">
                      <path
                        id=":S1:-shape"
                        d="M537.827 9.245A11.5 11.5 0 0 1 549.104 0h63.366c7.257 0 12.7 6.64 11.277 13.755l-25.6 128A11.5 11.5 0 0 1 586.87 151h-28.275a15.999 15.999 0 0 0-15.689 12.862l-59.4 297c-1.98 9.901 5.592 19.138 15.689 19.138h17.275l.127.001c.85.009 1.701.074 2.549.009 11.329-.874 21.411-7.529 24.88-25.981.002-.012.016-.016.023-.007.008.009.022.005.024-.006l24.754-123.771A11.5 11.5 0 0 1 580.104 321h63.366c7.257 0 12.7 6.639 11.277 13.755l-25.6 128A11.5 11.5 0 0 1 617.87 472H559c-22.866 0-28.984 7.98-31.989 25.931-.004.026-.037.035-.052.014-.015-.02-.048-.013-.053.012l-24.759 123.798A11.5 11.5 0 0 1 490.87 631h-29.132a14.953 14.953 0 0 0-14.664 12.021c-4.3 21.502-23.18 36.979-45.107 36.979H83.502c-29.028 0-50.8-26.557-45.107-55.021l102.4-512C145.096 91.477 163.975 76 185.902 76h318.465c10.136 0 21.179-5.35 23.167-15.288l10.293-51.467Zm-512 160A11.5 11.5 0 0 1 37.104 160h63.366c7.257 0 12.7 6.639 11.277 13.755l-25.6 128A11.5 11.5 0 0 1 74.87 311H11.504c-7.257 0-12.7-6.639-11.277-13.755l25.6-128Z"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      ></path>
                    </clipPath>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          <ul
            role="list"
            className="text-muted-foreground mt-16 text-base lg:mt-0 lg:w-1/2 lg:min-w-[33rem] lg:pl-4"
          >
            {benefits.map((benefit, index) => (
              <li key={index} className="group mt-10 first:mt-0">
                <div style={{ opacity: 1, transform: "none" }}>
                  <div className="after:bg-border relative pt-10 group-first:pt-0 before:absolute before:top-0 before:left-0 before:h-px before:w-6 before:bg-neutral-950 group-first:before:hidden after:absolute after:top-0 after:right-0 after:left-8 after:h-px group-first:after:hidden">
                    <strong className="text-foreground font-semibold">
                      {benefit.title}{" "}
                    </strong>
                    {benefit.description}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Wrapper>
    </section>
  );
};

export default WhyChooseUs;
