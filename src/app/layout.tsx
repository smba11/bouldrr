import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});
export const metadata: Metadata = {
  title: {
    default: "Bouldrr — Know what to build. Know what’s next.",
    template: "%s · Bouldrr",
  },
  description:
    "Turn a property, local rules, and your development goal into a clear plan. A map-first workspace for real-estate development.",
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geist.variable} data-scroll-behavior="smooth">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
