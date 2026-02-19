import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { transferFunds, searchUsers } from '../services/api';
import '../index.css';

const Transfer = () => {
    const storedAccount = localStorage.getItem('accountNumber') || 'N/A';
    const [formData, setFormData] = useState({
        targetAccountId: '',
        amount: '',
    });
    const [upiPin, setUpiPin] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const searchAccounts = async (query) => {
        if (query.length < 3) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        try {
            const results = await searchUsers(query);
            setSearchResults(results);
            setShowDropdown(results.length > 0);
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        }
    };

    const handleTransferStart = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setShowModal(true);
    };

    const handleConfirmTransfer = async () => {
        if (upiPin.length !== 6) {
            setError('Please enter a valid 6-digit UPI PIN');
            return;
        }

        const sourceAccountId = storedAccount;
        if (!sourceAccountId || sourceAccountId === 'N/A') {
            setError('User not logged in or invalid account.');
            return;
        }

        if (!formData.targetAccountId) {
            setError('Please enter a recipient account number.');
            return;
        }

        setShowModal(false);
        setLoading(true);

        try {
            await transferFunds({ ...formData, sourceAccountId, upiPin });
            setSuccess(`Successfully transferred ₹${formData.amount} to Account ${formData.targetAccountId}`);
            setFormData({ ...formData, targetAccountId: '', amount: '' });
            setSearchQuery('');
            setUpiPin('');
        } catch (err) {
            console.error('Transfer Failed:', err);
            setError(err.response?.data?.error || err.response?.data?.message || 'Transfer failed. Please check details and balance.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Top Bar (Simplified version of Dashboard Top Bar) */}
            <header style={styles.topBar}>
                <div style={styles.headerTitle}>
                    <h1 className="premium-title">Send Money</h1>
                    <p style={styles.subtitle}>Secure, instant transfers across the globe.</p>
                </div>
                <div style={styles.userActions}>
                    <Link to="/notifications" style={styles.notifIcon}>🔔</Link>
                    <Link to="/settings" style={styles.settingsIcon}>⚙️</Link>
                    <Link to="/profile" style={styles.profilePic}>
                        <div style={styles.pPicInner} />
                    </Link>
                </div>
            </header>

            <div style={styles.contentGrid}>
                {/* Transfer Form Card */}
                <div style={styles.card} className="premium-card">
                    <div style={styles.cardGlow} />
                    <form onSubmit={handleTransferStart} style={styles.form}>
                        <div style={styles.inputSection}>
                            <label style={styles.label}>Recipient Account</label>
                            <div style={{ ...styles.inputWrapper, position: 'relative' }}>
                                <span style={styles.inputIcon}>🆔</span>
                                <input
                                    type="text"
                                    name="targetAccountId"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setFormData(prev => ({ ...prev, targetAccountId: e.target.value }));
                                        searchAccounts(e.target.value);
                                    }}
                                    onFocus={() => searchQuery.length >= 3 && setShowDropdown(true)}
                                    placeholder="Search by account or phone"
                                    style={styles.input}
                                    required
                                    autoComplete="off"
                                />
                                {showDropdown && (
                                    <div style={styles.dropdown}>
                                        {searchResults.map((user) => (
                                            <div
                                                key={user.accountNumber}
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, targetAccountId: user.accountNumber }));
                                                    setSearchQuery(user.accountNumber);
                                                    setShowDropdown(false);
                                                }}
                                                style={styles.dropdownItem}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <div style={styles.dropdownAcc}>{user.accountNumber}</div>
                                                <div style={styles.dropdownPhone}>{user.phoneNumber}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={styles.inputSection}>
                            <label style={styles.label}>Amount ($)</label>
                            <div style={styles.inputWrapper}>
                                <span style={styles.inputIcon}>💰</span>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    min="0.01"
                                    step="0.01"
                                    style={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        {error && <div style={styles.errorBox}>{error}</div>}
                        {success && <div style={styles.successBox}>{success}</div>}

                        <button
                            type="submit"
                            style={{
                                ...styles.submitBtn,
                                opacity: loading ? 0.7 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Confirm Transfer 🚀'}
                        </button>
                    </form>
                </div>

                {/* Info Card */}
                <div style={styles.infoCard} className="premium-card">
                    <h3 style={styles.infoTitle}>Transfer Information</h3>
                    <div style={styles.infoItem}>
                        <p style={styles.infoLabel}>From Account</p>
                        <p style={styles.infoValue}>{storedAccount}</p>
                    </div>
                    <div style={styles.infoItem}>
                        <p style={styles.infoLabel}>Fees</p>
                        <p style={styles.infoValue}>$0.00 (Free)</p>
                    </div>
                    <div style={styles.infoItem}>
                        <p style={styles.infoLabel}>Estimated Arrival</p>
                        <p style={styles.infoValue}>Instant</p>
                    </div>
                    <div style={styles.securityTip}>
                        <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                        <p style={styles.tipText}>
                            Always double-check the recipient's Account ID before confirming the transaction.
                        </p>
                    </div>
                </div>
            </div>

            {/* UPI PIN Modal */}
            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalTitle}>Enter UPI PIN</h2>
                        <p style={styles.modalSubtitle}>Please enter your 6-digit security PIN to authorize today's transfer of ${formData.amount}.</p>

                        <div style={styles.inputSection}>
                            <input
                                type="password"
                                value={upiPin}
                                onChange={(e) => setUpiPin(e.target.value)}
                                placeholder="••••••"
                                maxLength="6"
                                style={{ ...styles.input, textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.5rem' }}
                                autoFocus
                            />
                        </div>

                        <div style={styles.modalActions}>
                            <button onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
                            <button onClick={handleConfirmTransfer} style={styles.confirmBtn}>Confirm & Pay</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        paddingBottom: '2rem',
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh',
        transition: 'var(--transition)',
    },
    topBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2.5rem',
    },
    headerTitle: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
    },
    title: {
        fontSize: '2rem',
        fontWeight: '900',
        margin: 0,
        color: 'var(--text-primary)',
    },
    subtitle: {
        color: 'var(--text-muted)',
        margin: 0,
        fontSize: '1rem',
    },
    userActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
    },
    notifIcon: { fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' },
    settingsIcon: { fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' },
    profilePic: {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        backgroundColor: 'var(--bg-tertiary)',
        padding: '2px',
        border: '1px solid var(--glass-border)',
    },
    pPicInner: {
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #4f46e5 0%, #c026d3 100%)',
    },
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: '2.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    card: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '24px',
        padding: '2.5rem',
        border: '1px solid var(--glass-border)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
    },
    cardGlow: {
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)',
        zIndex: 0,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        position: 'relative',
        zIndex: 1,
    },
    inputSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },
    label: {
        fontSize: '0.85rem',
        fontWeight: '700',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginLeft: '4px',
    },
    inputWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    inputIcon: {
        position: 'absolute',
        left: '1.25rem',
        fontSize: '1.1rem',
        opacity: 0.7,
    },
    input: {
        paddingLeft: '3.5rem',
        height: '60px',
        fontSize: '1.1rem',
        fontWeight: '500',
    },
    submitBtn: {
        marginTop: '1rem',
        height: '60px',
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        border: 'none',
        borderRadius: '16px',
        fontSize: '1.1rem',
        fontWeight: '800',
        transition: 'var(--transition)',
        boxShadow: '0 8px 16px -4px rgba(79, 70, 229, 0.4)',
    },
    errorBox: {
        padding: '1rem',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        border: '1px solid rgba(244, 63, 94, 0.2)',
        borderRadius: '12px',
        color: 'var(--danger-color)',
        fontSize: '0.9rem',
        textAlign: 'center',
    },
    successBox: {
        padding: '1rem',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '12px',
        color: 'var(--success-color)',
        fontSize: '0.9rem',
        textAlign: 'center',
    },
    infoCard: {
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: '24px',
        padding: '2rem',
        border: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    infoTitle: {
        fontSize: '1.2rem',
        fontWeight: '800',
        margin: '0 0 0.5rem 0',
        color: 'var(--text-primary)',
    },
    infoItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--glass-border)',
    },
    infoLabel: {
        fontSize: '0.9rem',
        color: 'var(--text-muted)',
        margin: 0,
    },
    infoValue: {
        fontSize: '1rem',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: 0,
    },
    securityTip: {
        marginTop: 'auto',
        padding: '1.25rem',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '16px',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        border: '1px solid var(--glass-border)',
    },
    tipText: {
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        margin: 0,
        lineHeight: '1.5',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '24px',
        padding: '3rem',
        width: '100%',
        maxWidth: '450px',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        textAlign: 'center',
    },
    modalTitle: {
        fontSize: '1.5rem',
        fontWeight: '900',
        color: 'var(--text-primary)',
        margin: 0,
    },
    modalSubtitle: {
        fontSize: '0.9rem',
        color: 'var(--text-muted)',
        lineHeight: '1.6',
        margin: 0,
    },
    modalActions: {
        display: 'flex',
        gap: '1rem',
        marginTop: '1rem',
    },
    cancelBtn: {
        flex: 1,
        height: '50px',
        borderRadius: '12px',
        border: '1px solid var(--glass-border)',
        backgroundColor: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'var(--transition)',
    },
    confirmBtn: {
        flex: 2,
        height: '50px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        fontWeight: '800',
        cursor: 'pointer',
        transition: 'var(--transition)',
        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
    },
    dropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        marginTop: '8px',
        maxHeight: '200px',
        overflowY: 'auto',
        zIndex: 1000,
        boxShadow: 'var(--shadow-lg)',
        backdropFilter: 'blur(10px)',
    },
    dropdownItem: {
        padding: '12px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--glass-border)',
        transition: 'var(--transition)',
        textAlign: 'left',
    },
    dropdownAcc: {
        fontWeight: '700',
        color: 'var(--text-primary)',
        fontSize: '0.95rem',
    },
    dropdownPhone: {
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
    },
};

export default Transfer;
