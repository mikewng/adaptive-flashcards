import "./Footer.scss"

const Footer = () => {
    return (
        <footer className="fc-footer-cpnt-wrapper">
            <div className="fc-footer-content">
                <div className="fc-footer-section">
                    <h4 className="fc-footer-heading">Contact</h4>
                    <a href="#" className="fc-footer-link">Email</a>
                    <a href="#" className="fc-footer-link">Phone</a>
                </div>
                <div className="fc-footer-section">
                    <h4 className="fc-footer-heading">About</h4>
                    <a href="#" className="fc-footer-link">Team</a>
                </div>
            </div>
            <div className="fc-footer-bottom">
                <p>&copy; 2025 Flashcards. All rights reserved.</p>
            </div>
        </footer>
    )
}

export default Footer;