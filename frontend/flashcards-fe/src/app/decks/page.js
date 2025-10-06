'use client'

import { useRouter } from 'next/navigation';
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import DeckView from "../screens/deckview/DeckView";
import "../screens/layout/BaseLayout.scss";

export default function DecksPage() {
  return (
    <div className="fc-baselayout-wrapper">
      <Navbar />
      <main className="fc-screen-container">
        <DeckView />
      </main>
      <Footer />
    </div>
  );
}
