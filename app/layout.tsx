import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import SessionProvider from "./components/SessionProvider";
import QueryClientProvider from "./components/QueryClientProvider";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "WishTune - Create Celebration Songs",
  description: "Create personalized songs for birthdays and special celebrations in just a few clicks",
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
    <html lang="en">
      <body className={rubik.variable}>
        <QueryClientProvider>
          <SessionProvider>{children}</SessionProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
