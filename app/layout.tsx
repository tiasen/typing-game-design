import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "@/lib/language-context"
import { GuestProvider } from "@/lib/guest-context"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Type Master Kids - Learn Typing with Fun Games",
  description: "A fun and engaging typing practice app for elementary school students",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico"/>
        <meta name="robots" content="index, follow" />
  <meta name="keywords" content="typing, kids, games, learn, education, keyboard, practice, elementary, fun, 打字, 儿童, 游戏, 学习, 教育, 键盘, 练习, 小学生, 趣味" />
        <meta name="author" content="Type Master Kids" />
        <meta property="og:title" content="Type Master Kids - Learn Typing with Fun Games" />
        <meta property="og:description" content="A fun and engaging typing practice app for elementary school students" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:url" content="https://typing.tiansen.me" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Type Master Kids - Learn Typing with Fun Games" />
        <meta name="twitter:description" content="A fun and engaging typing practice app for elementary school students" />
        <meta name="twitter:image" content="/logo.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <GuestProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </GuestProvider>
      </body>
    </html>
  )
}
