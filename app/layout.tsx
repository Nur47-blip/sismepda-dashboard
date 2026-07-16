import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { AppShell } from "@/components/layout/app-shell"
import { Toaster } from "@/components/ui/sonner"
import { SessionProvider } from "@/components/auth/session-provider"
import { SiteBranding } from "@/components/site-branding"
import { DEFAULT_WEBSITE_TITLE } from "@/lib/site-branding"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: DEFAULT_WEBSITE_TITLE,
  description:
    "Ringkasan absensi dan kelengkapan input harian untuk admin dan guru. Pantau kehadiran siswa dan progress input tiap kelas dalam satu tampilan.",
  generator: "v0.app",
  icons: {
    icon: [{ url: "/favicon.ico" }],
    apple: "/favicon.ico",
  },
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f4f2fb",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`light ${jakarta.variable}`}>
      <body className="bg-background font-sans antialiased">
        <SiteBranding />
        <SessionProvider><AppShell>{children}</AppShell></SessionProvider>
        <Toaster position="top-center" />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
