'use client'
import "./App.scss"
import { AuthProvider } from './context/userAuthContext'
import { BrowserRouter } from 'react-router-dom'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Adaptive Flashcards</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Alan+Sans:wght@300..900&family=Sen:wght@400..800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <BrowserRouter>
          <AuthProvider>
            {children}
          </AuthProvider>
        </BrowserRouter>
      </body>
    </html>
  );
}
