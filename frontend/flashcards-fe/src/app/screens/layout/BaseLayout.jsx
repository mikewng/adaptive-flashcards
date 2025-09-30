import { useNavigationContext } from "../../context/useNavigationContext"
import { navMapping } from "../../utils/navUtils";

const BaseLayout = ({ }) => {
    const { navState } = useNavigationContext();

    return (
        <div className="fc-baselayout-wrapper">
            <div className="fc-screen-container">
                {navMapping[navState]}
            </div>
        </div>
    )
}

export default BaseLayout