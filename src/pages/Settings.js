import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
    const { theme, toggleTheme } = useTheme();
    const [is2FAEnabled, setIs2FAEnabled] = useState(localStorage.getItem('2faEnabled') === 'true');
    const [showModal, setShowModal] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' | 'error'

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const toggle2FA = () => {
        const newState = !is2FAEnabled;
        setIs2FAEnabled(newState);
        localStorage.setItem('2faEnabled', newState);
        showMessage(`Two-Factor Authentication ${newState ? 'Enabled' : 'Disabled'}`);
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            showMessage('New passwords do not match', 'error');
            return;
        }
        if (passwords.new.length < 6) {
            showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        // Simulate API call
        setTimeout(() => {
            setShowModal(false);
            showMessage('Password changed successfully');
            setPasswords({ current: '', new: '', confirm: '' });
        }, 500);
    };

    const [profile, setProfile] = useState({
        name: localStorage.getItem('profileName') || 'Active User',
        email: localStorage.getItem('profileEmail') || 'user@fintech.com'
    });

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
        if (name === 'name') localStorage.setItem('profileName', value);
        if (name === 'email') localStorage.setItem('profileEmail', value);
    };

    const [showPinModal, setShowPinModal] = useState(false);
    const [pinData, setPinData] = useState({ current: '', new: '', confirm: '' });

    const handlePinChange = async (e) => {
        e.preventDefault();
        if (pinData.new !== pinData.confirm) {
            showMessage('New PINs do not match', 'error');
            return;
        }
        if (pinData.new.length < 4 || pinData.new.length > 6) {
            showMessage('PIN must be 4-6 digits', 'error');
            return;
        }

        try {
            const axios = require('axios').default;
            await axios.post('/api/update-pin', {
                oldPin: pinData.current,
                newPin: pinData.new
            }, { withCredentials: true });

            setShowPinModal(false);
            showMessage('UPI PIN updated successfully');
            setPinData({ current: '', new: '', confirm: '' });
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to update PIN';
            showMessage(errorMsg, 'error');
        }
    };

    return (
        <div style={styles.container}>
            {message.text && (
                <div style={{ ...styles.toast, backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)' }}>
                    {message.text}
                </div>
            )}

            <header style={styles.header}>
                <h1 style={styles.title}>Settings</h1>
                <p style={styles.subtitle}>Manage your account and app preferences</p>
            </header>

            <div style={styles.grid}>
                {/* Profile Section */}
                <section style={styles.glassCard}>
                    <div style={styles.cardGlow} />
                    <h3 style={styles.sectionTitle}>👤 Profile Settings</h3>
                    <div style={styles.field}>
                        <label style={styles.label}>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={profile.name}
                            onChange={handleProfileChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.field}>
                        <label style={styles.label}>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={profile.email}
                            onChange={handleProfileChange}
                            style={styles.input}
                        />
                    </div>
                </section>

                {/* Appearance Section */}
                <section style={styles.glassCard}>
                    <div style={styles.cardGlow} />
                    <h3 style={styles.sectionTitle}>🎨 Appearance</h3>
                    <div style={styles.toggleRow}>
                        <div>
                            <p style={styles.toggleLabel}>Theme Mode</p>
                            <p style={styles.toggleSub}>Switch between light and dark themes</p>
                        </div>
                        <button onClick={toggleTheme} style={styles.themeBtn}>
                            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                        </button>
                    </div>
                </section>

                {/* Security Section */}
                <section style={styles.glassCard}>
                    <div style={styles.cardGlow} />
                    <h3 style={styles.sectionTitle}>🔒 Security</h3>
                    <button onClick={() => setShowModal(true)} style={styles.actionBtn}>Change Password</button>
                    <button
                        onClick={() => setShowPinModal(true)}
                        style={{ ...styles.actionBtn, marginTop: '0.5rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    >
                        Change UPI PIN
                    </button>
                    <button
                        onClick={toggle2FA}
                        style={{
                            ...styles.actionBtn,
                            marginTop: '0.5rem',
                            backgroundColor: is2FAEnabled ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.05)',
                            color: is2FAEnabled ? '#ffffff' : 'var(--text-primary)',
                            borderColor: is2FAEnabled ? 'transparent' : 'var(--glass-border)'
                        }}
                    >
                        {is2FAEnabled ? 'Disable Two-Factor' : 'Enable Two-Factor'}
                    </button>
                </section>
            </div>

            {/* Password Modal */}
            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>Change Password</h3>
                        <form onSubmit={handlePasswordChange}>
                            <div style={styles.field}>
                                <label style={styles.label}>Current Password</label>
                                <input
                                    type="password"
                                    style={styles.input}
                                    value={passwords.current}
                                    onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>New Password</label>
                                <input
                                    type="password"
                                    style={styles.input}
                                    value={passwords.new}
                                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Confirm Password</label>
                                <input
                                    type="password"
                                    style={styles.input}
                                    value={passwords.confirm}
                                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
                                <button type="submit" style={styles.saveBtn}>Update Password</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* UPI PIN Modal */}
            {showPinModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>Change UPI PIN</h3>
                        <form onSubmit={handlePinChange}>
                            <div style={styles.field}>
                                <label style={styles.label}>Current PIN</label>
                                <input
                                    type="password"
                                    style={styles.input}
                                    value={pinData.current}
                                    onChange={e => setPinData({ ...pinData, current: e.target.value })}
                                    maxLength="6"
                                    required
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>New PIN</label>
                                <input
                                    type="password"
                                    style={styles.input}
                                    value={pinData.new}
                                    onChange={e => setPinData({ ...pinData, new: e.target.value })}
                                    maxLength="6"
                                    required
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Confirm PIN</label>
                                <input
                                    type="password"
                                    style={styles.input}
                                    value={pinData.confirm}
                                    onChange={e => setPinData({ ...pinData, confirm: e.target.value })}
                                    maxLength="6"
                                    required
                                />
                            </div>
                            <div style={styles.modalActions}>
                                <button type="button" onClick={() => setShowPinModal(false)} style={styles.cancelBtn}>Cancel</button>
                                <button type="submit" style={styles.saveBtn}>Update PIN</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        padding: '2.5rem',
        background: 'var(--bg-primary)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
        transition: 'var(--transition)',
        position: 'relative',
    },
    header: { marginBottom: '3rem' },
    title: {
        fontSize: '3rem',
        fontWeight: '900',
        margin: '0 0 0.5rem 0',
        background: 'var(--accent-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-1px',
        textShadow: '0 10px 30px rgba(79, 70, 229, 0.2)',
    },
    subtitle: { color: 'var(--text-muted)', fontSize: '1.1rem' },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2rem',
        maxWidth: '1200px',
    },
    glassCard: {
        position: 'relative',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        borderRadius: '24px',
        padding: '2rem',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        transition: 'transform 0.3s ease',
    },
    cardGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100px',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)',
        pointerEvents: 'none',
    },
    sectionTitle: {
        fontSize: '1.25rem',
        fontWeight: '700',
        marginBottom: '1.5rem',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    field: { marginBottom: '1.5rem' },
    label: {
        display: 'block',
        fontSize: '0.85rem',
        fontWeight: '600',
        color: 'var(--text-muted)',
        marginBottom: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    input: {
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '1rem',
        color: 'var(--text-primary)',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.2s ease',
    },
    toggleRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.02)',
        borderRadius: '16px',
    },
    toggleLabel: { fontWeight: '600', margin: 0 },
    toggleSub: { fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' },
    themeBtn: {
        padding: '0.6rem 1.25rem',
        borderRadius: '10px',
        border: '1px solid var(--glass-border)',
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: 'var(--shadow-sm)',
    },
    actionBtn: {
        width: '100%',
        padding: '1rem',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)',
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '1rem',
        backdropFilter: 'blur(4px)',
        boxShadow: 'var(--shadow-sm)',
    },
    toast: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 2rem',
        borderRadius: '12px',
        color: 'white',
        fontWeight: '600',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 2000,
        animation: 'slideIn 0.3s ease-out',
        backdropFilter: 'blur(10px)',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        background: 'var(--bg-secondary)',
        padding: '2.5rem',
        borderRadius: '24px',
        width: '90%',
        maxWidth: '400px',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-lg)',
    },
    modalTitle: {
        marginTop: 0,
        color: 'var(--text-primary)',
        marginBottom: '1.5rem',
        fontSize: '1.5rem',
        fontWeight: '800',
    },
    modalActions: {
        display: 'flex',
        gap: '1rem',
        marginTop: '2rem',
    },
    cancelBtn: {
        flex: 1,
        padding: '1rem',
        borderRadius: '12px',
        border: '1px solid var(--glass-border)',
        backgroundColor: 'transparent',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        fontWeight: '600',
    },
    saveBtn: {
        flex: 1,
        padding: '1rem',
        borderRadius: '12px',
        border: 'none',
        background: 'var(--accent-gradient)',
        color: 'white',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)',
    },
};

export default Settings;
