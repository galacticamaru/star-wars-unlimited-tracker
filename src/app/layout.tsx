import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito_Sans, Oxanium } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { NavBar } from '@/components/nav-bar';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

const oxaniumHeading = Oxanium({subsets:['latin'],variable:'--font-heading'});

const nunitoSans = Nunito_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SWU Tracker",
  description: "Star Wars Unlimited card collection and deck builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", nunitoSans.variable, oxaniumHeading.variable)}
    >
      <body className="min-h-full flex flex-col">
        <NavBar />
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
