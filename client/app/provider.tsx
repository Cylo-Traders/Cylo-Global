"use client";

import gsap from "gsap";
import { ReactLenis } from "lenis/react";
import { useEffect, useRef } from "react";
import type { LenisRef } from "lenis/react";
import type { FC, ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import NextJsToploader from "nextjs-toploader";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { PrivyProvider } from "@/components/providers/privy-provider";
import { QueryProvider } from "@/components/providers/query-provider";

interface GlobalProviderProps {
  children: ReactNode;
}

const GlobalProvider: FC<GlobalProviderProps> = ({ children }) => {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);

    return () => gsap.ticker.remove(update);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <ReactLenis root options={{ autoRaf: false }} ref={lenisRef}>
        <PrivyProvider>
          <QueryProvider>
          <Analytics />
          <Toaster richColors theme="light" />
          <NextJsToploader
            showSpinner={false}
            showForHashAnchor={false}
            showAtBottom={false}
            color="var(--primary)"
          />
          {children}
          </QueryProvider>
        </PrivyProvider>
      </ReactLenis>
    </ThemeProvider>
  );
};

export { GlobalProvider };
