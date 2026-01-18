import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#00C48C' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

export const metadata: Metadata = {
  title: "Admin Tonny - Sistema de Inventario",
  description: "Sistema de administracion de inventario y materiales para Tonny",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Admin Tonny',
  },
  icons: {
    icon: "/logos/icono-webapp-64x64.png",
    apple: [
      { url: '/logos/icono-webapp-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/logos/icono-webapp-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/logos/icono-webapp-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/logos/icono-webapp-128x128.png', sizes: '128x128', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="touch-manipulation">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/logos/icono-webapp-180x180.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logos/icono-webapp-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/logos/icono-webapp-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/logos/icono-webapp-144x144.png" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
