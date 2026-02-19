import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api';
import '../index.css';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ accountNumber: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [showAccount, setShowAccount] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const maskValue = (val) => {
        if (!val) return "";
        if (val.length <= 4) return val;
        return "•".repeat(val.length - 4) + val.slice(-4);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'accountNumber' && !showAccount) {
            const prevRaw = formData.accountNumber;
            const prevMasked = maskValue(prevRaw);

            if (value.startsWith(prevMasked)) {
                setFormData({ ...formData, accountNumber: prevRaw + value.slice(prevMasked.length) });
            } else if (prevMasked.startsWith(value)) {
                const deletedCount = prevMasked.length - value.length;
                setFormData({ ...formData, accountNumber: prevRaw.slice(0, -deletedCount) });
            } else {
                setFormData({ ...formData, accountNumber: value });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Attempt Login
            const data = await loginUser(formData);

            if (data.status?.toLowerCase() === 'success' || data.token) {
                if (data.token) localStorage.setItem('token', data.token);
                localStorage.setItem('accountNumber', formData.accountNumber);
                window.dispatchEvent(new Event('storage'));
                navigate('/dashboard');
            } else {
                setError(`Login Rejected: ${data.message || 'Unknown status mismatch'}`);
            }
        } catch (err) {
            console.error('Login Error:', err);
            const status = err.response?.status || 'No Status';
            const errorData = err.response?.data ? JSON.stringify(err.response.data) : 'No Response Body';
            setError(`Error ${status}: ${errorData} (${err.message})`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.glassCard}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Welcome Back</h1>
                    <p style={styles.subtitle}>Securely access your Financo account</p>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Account Number</label>
                        <div style={styles.inputWrapper}>
                            <input
                                type="text"
                                name="accountNumber"
                                value={showAccount ? formData.accountNumber : maskValue(formData.accountNumber)}
                                onChange={handleChange}
                                placeholder="Enter your 6-digit ID"
                                style={styles.inputWithIcon}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowAccount(!showAccount)}
                                style={styles.eyeBtn}
                            >
                                {showAccount ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <div style={styles.inputWrapper}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                style={styles.inputWithIcon}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={styles.eyeBtn}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && <div style={styles.error}>{error}</div>}

                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>

                    <div style={styles.footer}>
                        <p style={styles.footerText}>New to Fintech?</p>
                        <Link to="/create-account" style={styles.link}>Create Account</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: {
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
    },
    glassCard: {
        width: '100%',
        maxWidth: '420px',
        padding: '3rem',
        borderRadius: '24px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        animation: 'fadeInUp 0.6s ease-out',
    },
    header: {
        textAlign: 'center',
        marginBottom: '2.5rem',
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
        gap: '1.5rem',
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
        padding: '1rem',
        color: '#ffffff',
        fontSize: '1rem',
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
        padding: '1rem 3.5rem 1rem 1rem',
        color: '#ffffff',
        fontSize: '1rem',
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
        color: '#a855f7',
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
    }
};

export default Login;
