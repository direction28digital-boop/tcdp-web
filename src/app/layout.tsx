import type { Metadata } from "next";
import "./globals.css";
import { ASSETS } from "@/lib/assets";
import { BASE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "The CrAZy Dog People · Save a Phoenix shelter dog",
    template: "%s · The CrAZy Dog People",
  },
  description:
    "Dogs on the Maricopa County priority list have days, not weeks. Apply once and open your door. AZ Pound Pups, powered by The CrAZy Dog People.",
  openGraph: {
    title: "The CrAZy Dog People · Save a Phoenix shelter dog",
    description:
      "Dogs on the Maricopa County priority list have days, not weeks. Apply once and open your door.",
    url: BASE_URL,
    siteName: "The CrAZy Dog People",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The CrAZy Dog People · Save a Phoenix shelter dog",
    description:
      "Dogs on the Maricopa County priority list have days, not weeks. Apply once and open your door.",
  },
  icons: { icon: ASSETS.siteIcon },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
