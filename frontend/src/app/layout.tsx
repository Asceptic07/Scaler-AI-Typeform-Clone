import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppToaster } from "@/components/ui/toaster";
import { AppearanceSync } from "@/components/ui/appearance-sync";
import { appearanceInitialization } from "@/lib/appearance";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Typeform Clone",
  description:
    "Better questions. Better conversations. Create and build your forms.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceInitialization }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AppearanceSync />
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
