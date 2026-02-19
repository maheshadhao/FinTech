import React, { useState } from 'react';
import { fetchBalance } from '../services/balanceService';
import '../index.css';

const Balance = () => {
    const [accountId] = useState(localStorage.getItem('accountNumber') || '');

    const [upiPin, setUpiPin] = useState('');
    const [balance, setBalance] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCheckBalance = async () => {
        if (!upiPin) {
            setError('Please enter your UPI PIN');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const data = await fetchBalance(accountId, upiPin);

            if (data && data.balance !== undefined) {
                setBalance(data.balance);
                setError('');
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            console.error('Balance check error:', err);

            let status = null;
            let errorMessage = 'Failed to fetch balance.';

            if (err.response) {
                // Axios error with response
                status = err.response.status;
                console.error('Backend error data:', err.response.data); // Helpful for 500 debugging

                if (status === 401) {
                    errorMessage = 'Authentication failed. Invalid UPI PIN.';
                } else if (status === 404) {
                    errorMessage = 'Balance service not found (404).';
                } else if (status === 500) {
                    errorMessage = 'Server error (500). Please check console for details.';
                } else {
                    errorMessage = err.response.data?.message || err.message;
                }
            } else if (err.request) {
                // Request made but no response
                errorMessage = 'No response from server. Check backend connections.';
            } else {
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Account Balance</h1>
                <p style={styles.subtitle}>Secure access to your financial information</p>
            </div>

            {!accountId ? (
                <div style={styles.warningCard}>
                    <div style={styles.warningIcon}>🔒</div>
                    <h3 style={styles.warningTitle}>Authentication Required</h3>
                    <p style={styles.warningText}>Please log in to view your balance</p>
                </div>
            ) : (
                <div style={styles.mainCard}>
                    <div style={styles.accountSection}>
                        <div style={styles.accountBadge}>
                            <span style={styles.accountIcon}>👤</span>
                            <div>
                                <p style={styles.accountLabel}>Account Number</p>
                                <p style={styles.accountValue}>{accountId}</p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div style={styles.errorBox}>
                            <span style={styles.errorIcon}>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* UPI PIN Input Section */}
                    <div style={styles.inputSection}>
                        <label style={styles.inputLabel}>Enter UPI PIN</label>
                        <input
                            type="password"
                            value={upiPin}
                            onChange={(e) => setUpiPin(e.target.value)}
                            placeholder="Enter 6-digit UPI PIN"
                            maxLength="6"
                            style={styles.input}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleCheckBalance();
                                }
                            }}
                        />
                        <button
                            onClick={handleCheckBalance}
                            disabled={loading}
                            style={loading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
                        >
                            {loading ? 'Checking...' : 'Check Balance'}
                        </button>
                    </div>

                    {/* Balance Display Section */}
                    {balance !== null && (
                        <div style={styles.balanceCard}>
                            <div style={styles.balanceGlow}></div>
                            <p style={styles.balanceLabel}>Available Balance</p>
                            <h2 className="gradient-text" style={{ fontSize: '3.5rem', margin: '0 0 1.5rem 0', fontWeight: '900' }}>
                                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                            <div style={styles.balanceFooter}>
                                <span style={styles.balanceStatus}>✓ Updated</span>
                                <span style={styles.balanceTime}>{new Date().toLocaleTimeString()}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '600px',
        margin: '2rem auto',
        padding: '2rem',
    },
    header: {
        textAlign: 'center',
        marginBottom: '2.5rem',
    },
    title: {
        fontSize: '2.5rem',
        fontWeight: '900',
        margin: '0 0 0.5rem 0',
        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.02em',
    },
    subtitle: {
        color: 'var(--text-muted)',
        fontSize: '0.95rem',
        margin: 0,
    },
    warningCard: {
        backgroundColor: 'var(--bg-secondary)',
        padding: '3rem 2rem',
        borderRadius: '24px',
        border: '1px solid var(--glass-border)',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    },
    warningIcon: {
        fontSize: '3rem',
        marginBottom: '1rem',
    },
    warningTitle: {
        color: 'var(--text-primary)',
        fontSize: '1.5rem',
        fontWeight: '700',
        marginBottom: '0.5rem',
    },
    warningText: {
        color: 'var(--text-muted)',
        fontSize: '1rem',
    },
    mainCard: {
        backgroundColor: 'var(--bg-secondary)',
        padding: '2.5rem',
        borderRadius: '24px',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    },
    accountSection: {
        marginBottom: '2rem',
    },
    accountBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1.25rem',
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)',
    },
    accountIcon: {
        fontSize: '2rem',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderRadius: '12px',
    },
    accountLabel: {
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        margin: '0 0 0.25rem 0',
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: '0.05em',
    },
    accountValue: {
        fontSize: '1.25rem',
        color: 'var(--text-primary)',
        fontWeight: '800',
        margin: 0,
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
    },
    errorBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem 1.25rem',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        color: '#f87171',
        marginBottom: '1.5rem',
        fontSize: '0.9rem',
    },
    errorIcon: {
        fontSize: '1.25rem',
    },
    inputSection: {
        marginTop: '1.5rem',
    },
    inputLabel: {
        display: 'block',
        fontSize: '0.9rem',
        fontWeight: '600',
        color: 'var(--text-primary)',
        marginBottom: '0.5rem',
    },
    input: {
        width: '100%',
        padding: '1rem',
        fontSize: '1rem',
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        color: 'var(--text-primary)',
        marginBottom: '1rem',
        outline: 'none',
        transition: 'all 0.3s',
        fontFamily: 'monospace',
        letterSpacing: '0.2em',
        textAlign: 'center',
    },
    button: {
        width: '100%',
        padding: '1rem',
        fontSize: '1rem',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
    },
    buttonDisabled: {
        opacity: 0.6,
        cursor: 'not-allowed',
    },
    balanceCard: {
        marginTop: '1.5rem',
        padding: '2.5rem',
        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        borderRadius: '20px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)',
    },
    balanceGlow: {
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
        borderRadius: '50%',
    },
    balanceLabel: {
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.8)',
        margin: '0 0 0.75rem 0',
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: '0.1em',
    },
    balanceAmount: {
        fontSize: '3.5rem',
        fontWeight: '900',
        color: '#ffffff',
        textShadow: '0 4px 20px rgba(0,0,0,0.2)',
        letterSpacing: '-0.02em',
        marginBottom: '1.5rem',
    },
    balanceFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.2)',
    },
    balanceStatus: {
        fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    balanceTime: {
        fontSize: '0.8rem',
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'monospace',
    },
};

export default Balance;
