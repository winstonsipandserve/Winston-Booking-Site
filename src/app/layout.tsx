import type { Metadata } from "next";
import { Parisienne, Fraunces, Manrope } from "next/font/google";
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
    <html lang="en" className={`${parisienne.variable} ${fraunces.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
