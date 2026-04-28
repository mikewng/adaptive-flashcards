'use client'

import "./Navbar.scss"
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/userAuthContext";
import { useState } from "react";
import DeckUpdateModal from "../screens/deckview/components/DeckUpdateModal";

const LibraryIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 3.5h2v9h-2zM5.5 3.5h2v9h-2zM10.7 3.7l1.9.5-2.1 7.7-1.9-.5z" />
    </svg>
);
const CompassIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM10.5 5.5l-1 4-4 1 1-4z" />
    </svg>
);
const SettingsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM8 1.5v1.5M8 13v1.5M3 8H1.5M14.5 8H13M4.4 4.4L3.4 3.4M12.6 12.6l-1-1M4.4 11.6l-1 1M12.6 3.4l-1 1" />
    </svg>
);
const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v10M3 8h10" />
    </svg>
);

const Navbar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuth();
    const [createDeck, setCreateDeck] = useState(false);

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const handleModalClose = () => {
        setCreateDeck(false);
    };

    const isActive = (href) => pathname === href || pathname?.startsWith(href + '/');

    const userInitial = user?.first_name
        ? user.first_name[0].toUpperCase()
        : user?.email
            ? user.email[0].toUpperCase()
            : '?';

    const displayName = user?.first_name || user?.last_name
        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
        : user?.email || 'Guest';

    return (
        <aside className="fc-sidebar">
            {createDeck && <DeckUpdateModal onClose={handleModalClose} />}

            <div className="fc-sidebar-brand">
                <div className="fc-brand-mark" />
                <span>Cardex</span>
            </div>

            <nav className="fc-sidebar-nav">
                {isAuthenticated && (
                    <Link
                        href="/pages/decks"
                        className={`fc-nav-item ${isActive('/pages/decks') ? 'active' : ''}`}
                    >
                        <LibraryIcon />
                        Library
                    </Link>
                )}

                <Link
                    href="/pages/public-decks"
                    className={`fc-nav-item ${isActive('/pages/public-decks') ? 'active' : ''}`}
                >
                    <CompassIcon />
                    Discover
                </Link>

                {isAuthenticated && (
                    <>
                        <div className="fc-nav-section-title">Actions</div>
                        <button
                            className="fc-nav-item fc-nav-btn"
                            onClick={() => setCreateDeck(true)}
                        >
                            <PlusIcon />
                            New Deck
                        </button>
                        <Link
                            href="/pages/profile"
                            className={`fc-nav-item ${isActive('/pages/profile') ? 'active' : ''}`}
                        >
                            <SettingsIcon />
                            Profile
                        </Link>
                    </>
                )}

                {!isAuthenticated && (
                    <>
                        <div className="fc-nav-section-title">Account</div>
                        <Link
                            href="/"
                            className={`fc-nav-item ${pathname === '/' ? 'active' : ''}`}
                        >
                            Home
                        </Link>
                    </>
                )}
            </nav>

            <div className="fc-sidebar-foot">
                {isAuthenticated ? (
                    <>
                        <div className="fc-avatar">{userInitial}</div>
                        <div className="fc-avatar-meta">
                            <b>{displayName}</b>
                        </div>
                        <button className="fc-logout-btn" onClick={handleLogout}>
                            Sign out
                        </button>
                    </>
                ) : (
                    <button
                        className="fc-signin-btn"
                        onClick={() => router.push('/pages/login')}
                    >
                        Sign In
                    </button>
                )}
            </div>
        </aside>
    );
};

export default Navbar;
