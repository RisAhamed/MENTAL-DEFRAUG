import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"],
  fallback: ["system-ui", "arial"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: "Mental Defrag",
  description: "Recover smarter after every session",
  openGraph: {
    title: "Mental Defrag",
    description: "Recover smarter after every session",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mental Defrag",
    description: "Recover smarter after every session",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-[#0F0F0F] text-[#F5F5F5]`}
      >
        {children}
      </body>
    </html>
  );
}