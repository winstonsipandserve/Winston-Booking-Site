import type { Metadata } from "next";
import { Lora } from "next/font/google";
import "./globals.css";

const lora = Lora({ variable: "--font-lora", subsets: ["latin"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Winston Sip & Serve",
  description:
    "Tennis, pickleball, and golf simulator bays — paired with craft coffee and a members-only bar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${lora.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
