'use client'

import "./ModalComponent.scss"

const ModalComponent = ({ title, children, onClose, isOpen = true }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && onClose) {
            onClose();
        }
    };

    return (
        <div className="fc-modal-backdrop" onClick={handleBackdropClick}>
            <div className="fc-modal-cpnt-wrapper">
                <div className="fc-modal-header-container">
                    <h2 className="fc-modal-title">{title}</h2>
                    <button className="fc-modal-close-btn" onClick={onClose} aria-label="Close modal">
                        <svg fill="none" stroke="black" viewBox="0 0 24 24" width="24" height="24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="fc-modal-content">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default ModalComponent