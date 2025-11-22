import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import SessionProvider from "./components/SessionProvider";
import QueryClientProvider from "./components/QueryClientProvider";
import GoogleTagManager from "./components/GoogleTagManager";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: {
    default: "WishTune - Create Personalized Celebration Songs with AI",
    template: "%s | WishTune"
  },
  description: "Create personalized AI-powered celebration songs for birthdays, anniversaries, weddings, and more. Choose from multiple music styles and download your unique song in minutes.",
  keywords: ["celebration songs", "birthday songs", "AI music", "personalized songs", "custom songs", "anniversary songs", "wedding songs"],
  authors: [{ name: "WishTune" }],
  creator: "WishTune",
  publisher: "WishTune",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://wishtune.ai'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "WishTune - Create Personalized Celebration Songs",
    description: "Create personalized AI-powered celebration songs for any special occasion. Multiple music styles, instant generation.",
    url: 'https://wishtune.ai',
    siteName: 'WishTune',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "WishTune - Create Personalized Celebration Songs",
    description: "Create personalized AI-powered celebration songs for any special occasion.",
    creator: '@wishtune',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  icons: {
    icon: [
      { url: '/icon-96.png', type: 'image/png' },
    ],
    shortcut: '/icon-96.png',
    apple: '/icon-96.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#FFF5EB]">
      <body className={`${rubik.variable}`}>
        <GoogleTagManager />
        <QueryClientProvider>
          <SessionProvider>{children}</SessionProvider>
        </QueryClientProvider>
        <div className="py-6 text-center text-xs text-[#A78973]/60">
          © {new Date().getFullYear()} heroicsoft. All rights reserved.
        </div>
      </body>
    </html>
  );
}
