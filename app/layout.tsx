import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GioGPT - Privacy-Focused AI Assistant',
  description: 'A beautiful, private ChatGPT wrapper with multiple themes, image generation, and enhanced privacy. No data collection, conversations stay local.',
  keywords: [
    'AI assistant', 
    'ChatGPT', 
    'privacy', 
    'AI chat', 
    'image generation', 
    'OpenAI', 
    'private AI', 
    'secure chat',
    'AI wrapper',
    'GPT-4',
    'machine learning',
    'artificial intelligence'
  ],
  authors: [{ name: 'Jackson Giordano' }],
  creator: 'Jackson Giordano',
  publisher: 'GioTech',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://giogpt.vercel.app'), // Update this to your actual domain
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'GioGPT - Privacy-Focused AI Assistant',
    description: 'A beautiful, private AI assistant with multiple themes, image generation, and enhanced privacy. No data collection.',
    url: 'https://giogpt.vercel.app', // Update this to your actual domain
    siteName: 'GioGPT',
    images: [
      {
        url: '/giogpt.png',
        width: 1200,
        height: 630,
        alt: 'GioGPT - Privacy-Focused AI Assistant',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GioGPT - Privacy-Focused AI Assistant',
    description: 'A beautiful, private ChatGPT wrapper with multiple themes, image generation, and enhanced privacy.',
    images: ['/giogpt.png'],
    creator: '@giogpt', // Update this to your actual Twitter handle
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/g.png',
  },
  manifest: '/manifest.json', // You may want to create this file
  category: 'technology',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
