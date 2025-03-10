import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { MockDataProvider } from "./utils/mockDataContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SandSwitch | Service Exchange Platform",
  description:
    "A bartering platform for exchanging services within the CEGEP John Abbott community",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <MockDataProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </MockDataProvider>
      </body>
    </html>
  );
}
