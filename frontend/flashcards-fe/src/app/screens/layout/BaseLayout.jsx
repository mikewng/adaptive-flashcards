import Navbar from "@/app/components/Navbar";
import { useNavigationContext } from "../../context/useNavigationContext"
import { navMapping } from "../../utils/navUtils";
import "./BaseLayout.scss";
import Footer from "@/app/components/Footer";

const BaseLayout = ({ }) => {
    const { navState } = useNavigationContext();

    return (
        <div className="fc-baselayout-wrapper">
            <Navbar />
            <main className="fc-screen-container">
                {navMapping[navState]}
            </main>
            <Footer />
        </div>
    )
}

export default BaseLayout