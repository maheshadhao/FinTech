import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import '../index.css';

const Sidebar = () => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [accountNumber, setAccountNumber] = useState(localStorage.getItem('accountNumber') || '');
    const [role, setRole] = useState(localStorage.getItem('role') || 'USER');

    React.useEffect(() => {
        // Fetch real logged-in user from backend to sync sidebar
        const syncAccount = async () => {
            try {
                const response = await api.get('/loggedin_user');
                const data = response.data;
                if (data.status === 'success' && data.data) {
                    const accNum = data.data.accountNumber;
                    const userRole = data.data.role;
                    console.log("DEBUG >>> Sidebar sync successful:", { accNum, userRole });
                    setAccountNumber(accNum);
                    setRole(userRole);
                    localStorage.setItem('accountNumber', accNum);
                    localStorage.setItem('role', userRole);
                }
            } catch (err) {
                console.error('Sidebar sync failed:', err);
            }
        };

        syncAccount();

        const handleStorageChange = () => {
            setAccountNumber(localStorage.getItem('accountNumber') || '');
            setRole(localStorage.getItem('role') || 'USER');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const handleAccountChange = (e) => {
        const newAccount = e.target.value;
        setAccountNumber(newAccount);
        localStorage.setItem('accountNumber', newAccount);
        window.dispatchEvent(new Event('storage'));
    };

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
        { path: '/portfolio', label: 'Portfolio', icon: '📈' },
        { path: '/balance', label: 'Cards', icon: '💳' },
        { path: '/transactions', label: 'Transactions', icon: '💸' },
        { path: '/statements', label: 'Statements', icon: '📄' },
        { path: '/transfer', label: 'Transfer', icon: '📤' },
    ];

    // Check if user is admin (case-insensitive)
    if (role && role.toUpperCase() === 'ADMIN') {
        menuItems.push({ path: '/audit-logs', label: 'Audit Logs', icon: '📋' });
    }

    const footerItems = [
        { path: '/privacy', label: 'Privacy', icon: '🛡️' },
        { path: '/settings', label: 'Settings', icon: '⚙️' },
        { path: '/login', label: 'Log out', icon: '🚪' },
    ];

    return (
        <aside style={styles.sidebar} className="no-scrollbar no-print">
            <div style={styles.brand}>
                <div style={styles.logoCircle}>
                    <div style={styles.logoInner} />
                </div>
                <h2 style={styles.brandText}>FINTECH</h2>
            </div>

            <nav style={styles.nav}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                ...styles.navLink,
                                ...(isActive ? styles.navLinkActive : {})
                            }}
                        >
                            <span style={{ ...styles.icon, ...(isActive ? styles.iconActive : {}) }}>{item.icon}</span>
                            <span style={{ ...styles.label, ...(isActive ? styles.labelActive : {}) }}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div style={styles.footer}>
                {footerItems.map((item) => (
                    <React.Fragment key={item.label}>
                        <Link to={item.path}
                            onClick={() => {
                                if (item.label === "Log out") {
                                    localStorage.removeItem('token');
                                }
                            }}
                            style={styles.footerLink}>
                            <span style={styles.footerIcon}>{item.icon}</span>
                            <span style={styles.footerLabel}>{item.label}</span>
                        </Link>
                    </React.Fragment>
                ))}
            </div>

            <div style={styles.themeToggle}>
                <button onClick={toggleTheme} style={styles.toggleBtn}>
                    {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
            </div>

            <div style={styles.accountSection}>
                <label style={styles.accountLabel}>Active Account</label>
                <input
                    type="text"
                    value={accountNumber}
                    onChange={handleAccountChange}
                    placeholder="Enter Account ID"
                    style={styles.accountInput}
                />
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '5px' }}>
                    Role: {role}
                </div>
            </div>
        </aside>
    );
};

const styles = {
    sidebar: {
        width: '240px',
        height: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        padding: '2rem 1rem',
        borderRight: '1px solid var(--glass-border)',
        transition: 'var(--transition)',
        overflowY: 'auto',
    },
    brand: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '3rem',
        paddingLeft: '0.5rem',
    },
    logoCircle: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'var(--accent-gradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoInner: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: 'var(--bg-primary)',
    },
    brandText: {
        fontSize: '1.25rem',
        fontWeight: '900',
        color: 'var(--text-primary)',
        margin: 0,
        letterSpacing: '0.1em',
    },
    nav: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        flexGrow: 1,
    },
    navLink: {
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        borderRadius: '12px',
        color: 'var(--text-muted)',
        textDecoration: 'none',
        transition: 'var(--transition)',
        fontSize: '0.9rem',
        fontWeight: '600',
    },
    navLinkActive: {
        backgroundColor: 'var(--sidebar-active)',
        color: 'var(--text-primary)',
    },
    icon: {
        marginRight: '1rem',
        fontSize: '1.1rem',
        opacity: 0.6,
    },
    iconActive: {
        opacity: 1,
    },
    label: {},
    labelActive: {
        color: 'var(--text-primary)',
    },
    themeToggle: {
        padding: '1rem',
        marginBottom: '1rem',
    },
    toggleBtn: {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '12px',
        border: '1px solid var(--glass-border)',
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        fontSize: '0.85rem',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'var(--transition)',
    },
    footer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        padding: '1rem 0',
        borderTop: '1px solid var(--glass-border)',
        marginTop: '1rem',
    },
    footerLink: {
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        borderRadius: '12px',
        color: 'var(--text-muted)',
        textDecoration: 'none',
        transition: 'var(--transition)',
        fontSize: '0.9rem',
        fontWeight: '600',
    },
    footerIcon: {
        marginRight: '1rem',
        fontSize: '1.1rem',
        opacity: 0.6,
    },
    footerLabel: {},
    accountSection: {
        padding: '1rem',
        borderTop: '1px solid var(--glass-border)',
        marginTop: '0.5rem',
    },
    accountLabel: {
        display: 'block',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        marginBottom: '0.4rem',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    accountInput: {
        width: '100%',
        backgroundColor: 'transparent',
        border: 'none',
        color: 'var(--text-primary)',
        fontSize: '0.85rem',
        fontWeight: '700',
        outline: 'none',
        fontFamily: 'monospace',
    },
};

export default Sidebar;
