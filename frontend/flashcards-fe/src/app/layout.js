'use client'
import "./globals.css"
import "./App.scss"
import "./screens/layout/BaseLayout.scss"
import { AuthProvider } from './context/userAuthContext'
import Navbar from './components/Navbar'
import { DeckProvider } from "./context/deckContext"
import { StudySessionProvider } from "./context/studySessionContext"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Cardex · Flashcards</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..600&family=Inter+Tight:wght@400;450;500;550;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <DeckProvider>
            <StudySessionProvider>
              <div className="fc-baselayout-wrapper">
                <Navbar />
                <main className="fc-screen-container">
                  {children}
                </main>
              </div>
            </StudySessionProvider>
          </DeckProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
