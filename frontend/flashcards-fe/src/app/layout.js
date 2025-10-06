'use client'
import "./App.scss"
import "./screens/layout/BaseLayout.scss"
import { AuthProvider } from './context/userAuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

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
        <AuthProvider>
          <div className="fc-baselayout-wrapper">
            <Navbar />
            <main className="fc-screen-container">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
