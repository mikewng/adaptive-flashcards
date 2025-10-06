'use client'
import "./App.scss"
import { AuthProvider } from './context/userAuthContext'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Adaptive Flashcards</title>
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
