import Navbar from "@/app/components/Navbar";
import { Routes, Route } from "react-router-dom";
import "./BaseLayout.scss";
import Footer from "@/app/components/Footer";
import Landing from "../landing/Landing";
import DeckView from "../deckview/DeckView";
import Login from "../login/Login";

const BaseLayout = ({ }) => {
    return (
        <div className="fc-baselayout-wrapper">
            <Navbar />
            <main className="fc-screen-container">
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/decks" element={<DeckView />} />
                    <Route path="/login" element={<Login />} />
                </Routes>
            </main>
            <Footer />
        </div>
    )
}

export default BaseLayout