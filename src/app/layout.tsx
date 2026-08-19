import type { Metadata } from "next"
import { Inter, Merriweather_Sans } from "next/font/google"
import Header from "@/components/header"
import BreakpointIndicator from "@components/breakpoint-indicator"
import "@styles/globals.css"
import s from "./styles.module.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})
const merriweatherSans = Merriweather_Sans({
  variable: "--font-merriweather-sans",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
})

export const metadata: Metadata = {
  title: {
    default: "Pittsburgh Forge — Weekly Roster Builder",
    template: "%s · Pittsburgh Forge Roster Builder",
  },
  description:
    "Client-side Matchday Squad builder for Pittsburgh Forge rugby — Portrait and Story PNG export for social.",
  applicationName: "Pittsburgh Forge Roster Builder",
  authors: [{ name: "Pittsburgh Forge" }],
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [{ url: "/images/pittsburgh-forge-crest.png", type: "image/png" }],
    apple: [{ url: "/images/pittsburgh-forge-crest.png", type: "image/png" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${merriweatherSans.variable}`}
    >
      <body data-theme="light">
        <BreakpointIndicator />
        <Header />
        <main className={s.main}>{children}</main>
      </body>
    </html>
  )
}
