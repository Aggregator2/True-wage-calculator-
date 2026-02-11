import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrueWage | UK True Hourly Wage Calculator",
  description: "Calculate your real hourly wage after UK taxes, commute time, and unpaid work hours. See what you really earn with our comprehensive calculator using 2025/26 tax rates.",
  keywords: "UK salary calculator, true hourly wage, take home pay, tax calculator, FIRE calculator, commute costs",
  openGraph: {
    title: "TrueWage | UK True Hourly Wage Calculator",
    description: "Discover what you really earn per hour after taxes and hidden costs",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@500,700,800,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
