import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createAccount } from '../services/api';
import '../index.css';

const CreateAccount = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        phoneNumber: '',
        dob: '',
        email: '',
        address: '',
        aadharNumber: '',
        panNumber: '',
        password: '',
        upiPin: '',
        accountType: 'Savings',
        initialDeposit: '',
    });
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState(null); // { accountNumber: '...' }

    const [showAadhar, setShowAadhar] = useState(false);
    const [showPan, setShowPan] = useState(false);

    const maskValue = (val) => {
        if (!val) return "";
        if (val.length <= 4) return val;
        return "•".repeat(val.length - 4) + val.slice(-4);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if ((name === 'aadharNumber' && !showAadhar) || (name === 'panNumber' && !showPan)) {
            const prevRaw = formData[name];
            const prevMasked = maskValue(prevRaw);

            let nextRaw = value;
            if (value.startsWith(prevMasked)) {
                nextRaw = prevRaw + value.slice(prevMasked.length);
            } else if (prevMasked.startsWith(value)) {
                const deletedCount = prevMasked.length - value.length;
                nextRaw = prevRaw.slice(0, -deletedCount);
            }

            setFormData(prev => ({ ...prev, [name]: nextRaw }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        console.log('Account Creation Data:', formData);

        createAccount(formData)
            .then(response => {
                console.log('Account Created:', response);

                // Assuming backend returns { success: true, accountNumber: "..." }
                // or if it's a redirect, we might have it in the response data or headers if the proxy handled it.
                const accNum = response.accountNumber || (response.data && response.data.accountNumber);

                if (accNum) {
                    setSuccessData({ accountNumber: accNum });
                } else {
                    alert(`Account Creation Request Sent! \nIf successful, you can now login with your password.`);
                    navigate('/login');
                }
            })
            .catch(err => {
                console.error('Creation Failed:', err);
                setError('Failed to create account. Please check your inputs or backend connection.');
            });
    };

    return (
        <div style={styles.container}>
            <div style={styles.glassCard}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Create Account</h1>
                    <p style={styles.subtitle}>Start your financial journey with us</p>
                </div>

                {error && <div style={styles.error}>{error}</div>}

                {successData ? (
                    <div style={styles.successCard}>
                        <div style={styles.successIcon}>✅</div>
                        <h2 style={styles.successTitle}>Account Created!</h2>
                        <p style={styles.successText}>Please note down your account number for logging in:</p>
                        <div style={styles.accountNumberDisplay}>{successData.accountNumber}</div>
                        <button onClick={() => navigate('/login')} style={styles.button}>
                            Go to Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.row}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="johndoe123"
                                    style={styles.input}
                                    required
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Phone Number</label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="+1 234 567 8900"
                                    style={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        <div style={styles.row}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Date of Birth</label>
                                <input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    style={styles.input}
                                    required
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Account Type</label>
                                <select
                                    name="accountType"
                                    value={formData.accountType}
                                    onChange={handleChange}
                                    style={styles.input}
                                >
                                    <option value="Savings">Savings Account</option>
                                    <option value="Current">Current Account</option>
                                    <option value="Business">Business Account</option>
                                </select>
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="john@example.com"
                                style={styles.input}
                                required
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Address</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="123 FinTech Ave, New York, NY"
                                rows="2"
                                style={styles.input}
                                required
                            />
                        </div>

                        <div style={styles.row}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Aadhar Number</label>
                                <div style={styles.inputWrapper}>
                                    <input
                                        type="text"
                                        name="aadharNumber"
                                        value={showAadhar ? formData.aadharNumber : maskValue(formData.aadharNumber)}
                                        onChange={handleChange}
                                        placeholder="1234 5678 9012"
                                        style={styles.inputWithIcon}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowAadhar(!showAadhar)}
                                        style={styles.eyeBtn}
                                    >
                                        {showAadhar ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>PAN Number</label>
                                <div style={styles.inputWrapper}>
                                    <input
                                        type="text"
                                        name="panNumber"
                                        value={showPan ? formData.panNumber : maskValue(formData.panNumber)}
                                        onChange={handleChange}
                                        placeholder="ABCDE1234F"
                                        style={styles.inputWithIcon}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPan(!showPan)}
                                        style={styles.eyeBtn}
                                    >
                                        {showPan ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={styles.row}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    style={styles.input}
                                    required
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Initial Deposit ($)</label>
                                <input
                                    type="number"
                                    name="initialDeposit"
                                    value={formData.initialDeposit}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    min="0"
                                    style={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Create UPI PIN (6 digits)</label>
                            <input
                                type="password"
                                name="upiPin"
                                value={formData.upiPin}
                                onChange={handleChange}
                                placeholder="e.g. 123456"
                                maxLength="6"
                                pattern="\d{4,6}"
                                title="Enter a 4-6 digit numeric PIN"
                                style={styles.input}
                                required
                            />
                        </div>

                        <button type="submit" style={styles.button}>
                            Create Account
                        </button>

                        <div style={styles.footer}>
                            <p style={styles.footerText}>Already have an account?</p>
                            <Link to="/login" style={styles.link}>Sign In</Link>
                        </div>
                    </form>
                )}
            </div>
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        padding: '2rem 1rem',
    },
    glassCard: {
        width: '100%',
        maxWidth: '700px',
        padding: '3rem',
        borderRadius: '24px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(11, 1, 73, 0.5)',
        animation: 'fadeInUp 0.6s ease-out',
    },
    header: {
        textAlign: 'center',
        marginBottom: '2rem',
    },
    title: {
        fontSize: '2rem',
        fontWeight: '900',
        color: '#ffffff',
        marginBottom: '0.5rem',
        letterSpacing: '-0.02em',
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: '0.95rem',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
    },
    row: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    label: {
        color: '#e2e8f0',
        fontSize: '0.85rem',
        fontWeight: '600',
        marginLeft: '0.25rem',
    },
    input: {
        background: 'rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '0.9rem 1rem',
        color: '#ffffff',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'all 0.2s',
        width: '100%',
    },
    inputWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
    },
    inputWithIcon: {
        background: 'rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '0.9rem 3rem 0.9rem 1rem',
        color: '#ffffff',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'all 0.2s',
        width: '100%',
    },
    eyeBtn: {
        position: 'absolute',
        right: '12px',
        background: 'transparent',
        border: 'none',
        padding: '8px',
        cursor: 'pointer',
        color: '#a855f7', // Matches the purple accent in screenshot
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.8,
        '&:hover': {
            opacity: 1,
            transform: 'scale(1.1)',
        }
    },
    button: {
        marginTop: '1rem',
        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        color: '#ffffff',
        border: 'none',
        padding: '1rem',
        borderRadius: '12px',
        fontSize: '1rem',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.3s',
        boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
    },
    error: {
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        color: '#f87171',
        padding: '0.75rem',
        borderRadius: '8px',
        fontSize: '0.85rem',
        textAlign: 'center',
        marginBottom: '1.5rem',
    },
    footer: {
        marginTop: '1.5rem',
        textAlign: 'center',
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem',
        fontSize: '0.9rem',
    },
    footerText: {
        color: '#94a3b8',
    },
    link: {
        color: '#818cf8',
        textDecoration: 'none',
        fontWeight: '600',
    },
    successCard: {
        textAlign: 'center',
        padding: '2rem',
        animation: 'fadeInUp 0.6s ease-out',
    },
    successIcon: {
        fontSize: '4rem',
        marginBottom: '1rem',
    },
    successTitle: {
        fontSize: '2rem',
        color: '#ffffff',
        marginBottom: '1rem',
    },
    successText: {
        color: '#94a3b8',
        marginBottom: '1.5rem',
        fontSize: '1.1rem',
    },
    accountNumberDisplay: {
        background: 'rgba(99, 102, 241, 0.1)',
        border: '2px dashed #6366f1',
        borderRadius: '12px',
        padding: '1.5rem',
        fontSize: '2.5rem',
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: '0.2em',
        marginBottom: '2rem',
        fontFamily: 'monospace',
    }
};

export default CreateAccount;
