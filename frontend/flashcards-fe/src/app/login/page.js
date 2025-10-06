'use client'

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Login from "../screens/login/Login";
import "../screens/layout/BaseLayout.scss";

export default function LoginPage() {
  return (
    <div className="fc-baselayout-wrapper">
      <Navbar />
      <main className="fc-screen-container">
        <Login />
      </main>
      <Footer />
    </div>
  );
}
