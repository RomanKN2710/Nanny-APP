import type { Metadata, Viewport } from "next";
import { getLang } from "@/lib/context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nest",
  description: "Hours account, family calendar and school plans for our family and nanny.",
  appleWebApp: { capable: true, title: "Nest", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fff8f1",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={await getLang()}>
      <body>{children}</body>
    </html>
  );
}
