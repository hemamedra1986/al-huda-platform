import type { Metadata } from "next";
import "./globals.css";
import PlatformSettingsProvider from "@/app/components/PlatformSettingsProvider";

export const metadata: Metadata = {
  title: "منصة الهُدى",
  description: "منصة الهُدى للتعليم الإسلامي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        <PlatformSettingsProvider>{children}</PlatformSettingsProvider>
      </body>
    </html>
  );
}
