'use client'
import "./App.scss"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Adaptive Flashcards</title>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
