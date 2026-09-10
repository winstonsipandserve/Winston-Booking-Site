import type { Metadata } from "next";
import Script from "next/script";
import { Parisienne, Fraunces, Manrope } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ADMIN_THEME_INIT_SCRIPT } from "@/lib/admin-theme-init-script";
import "./globals.css";

const parisienne = Parisienne({ variable: "--font-parisienne", subsets: ["latin"], weight: "400" });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Winston Sip & Serve",
  description:
    "Tennis, pickleball, and golf simulator bays — paired with craft coffee and a members-only bar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${parisienne.variable} ${fraunces.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Script
          id="admin-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: ADMIN_THEME_INIT_SCRIPT }}
        />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
