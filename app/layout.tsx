import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../contexts/AuthContext'

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins'
})

export const metadata: Metadata = {
  title: 'Game Essência',
  description: 'Game Essência – Sua Jornada de Conquistas. Acompanhe seu desempenho, conquiste medalhas e avance nas missões do Game Essência!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.variable} font-sans`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}