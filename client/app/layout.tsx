import type { Metadata } from "next";
import { montserratAlternates } from "@/fonts";
import { siteConfig } from "@/config/site.config";
import { GlobalProvider } from "./provider";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.description,
  icons: siteConfig.icons,
  openGraph: {
    title: siteConfig.ogTitle,
    description: siteConfig.ogDescription,
    url: siteConfig.url,
    siteName: siteConfig.title,
    type: "website",
  },
  twitter: {
    card: siteConfig.tCard,
    title: siteConfig.tTitle,
    description: siteConfig.tDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserratAlternates.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <GlobalProvider>{children}</GlobalProvider>
      </body>
    </html>
  );
}
