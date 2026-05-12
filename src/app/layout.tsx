import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";
import "./globals.css";

const interVariable = localFont({
  src: "../../public/fonts/InterVariable.woff2",
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Clinch — AI-Powered Proposals & Invoices for Freelancers",
    template: "%s | Clinch",
  },
  description:
    "Generate professional proposals in seconds with AI. Create branded invoices with Stripe payment links. Win more clients and get paid faster.",
  keywords: [
    "freelancer proposals",
    "AI proposal generator",
    "invoice builder",
    "stripe payment links",
    "freelance tools",
  ],
  authors: [{ name: "Clinch" }],
  openGraph: {
    title: "Clinch — AI-Powered Proposals & Invoices for Freelancers",
    description:
      "Generate professional proposals in seconds with AI. Create branded invoices with Stripe payment links.",
    url: "https://clinch.dev",
    siteName: "Clinch",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clinch — AI-Powered Proposals & Invoices for Freelancers",
    description:
      "Generate professional proposals in seconds with AI. Win more clients, get paid faster.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${interVariable.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className:
                "bg-surface-2 border border-white/[0.08] text-text-primary rounded-lg shadow-elevated",
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
