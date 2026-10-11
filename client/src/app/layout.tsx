import type { Metadata } from "next";
import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthProviderWrapper from "@/components/AuthProviderWrapper";

export const metadata: Metadata = {
  title: "boAt Warranty Lookup",
  description:
    "Check your boAt device warranty, submit claims and get support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AuthProviderWrapper>
          <Navbar />

          {children}

          <Footer />
        </AuthProviderWrapper>
      </body>
    </html>
  );
}