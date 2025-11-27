// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import RemoveNewButton from "@/components/ui/remove-new-button";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Greanly",
  description: "Greanly — your sustainability companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          {/* Remove stray “New” buttons rendered globally by any library/component */}
          <RemoveNewButton />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
