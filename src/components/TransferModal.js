import React, { useState, useEffect } from 'react';
import { transferFunds, searchUsers } from '../services/api';
import '../index.css';

const TransferModal = ({ isOpen, onClose, initialData }) => {
    const [formData, setFormData] = useState({
        sourceAccountId: localStorage.getItem('accountNumber') || 'N/A',
        targetAccountId: '',
        amount: '',
    });
    const [upiPin, setUpiPin] = useState('');
    const [step, setStep] = useState(1); // 1: Details, 2: UPI PIN
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                targetAccountId: initialData.recipient || initialData.targetAccountId || '',
                amount: initialData.amount || '',
            }));
            setSearchQuery(initialData.recipient || initialData.targetAccountId || '');
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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
        }
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (!formData.targetAccountId || !formData.amount) {
            setError('Please fill in all fields');
            return;
        }
        setStep(2);
        setError('');
    };

    const handleConfirmTransfer = async () => {
        if (upiPin.length !== 6) {
            setError('Please enter a valid 6-digit UPI PIN');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await transferFunds({ ...formData, upiPin });
            setSuccess(`Successfully transferred $${formData.amount}`);
            setTimeout(() => {
                onClose();
                resetForm();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Transfer failed. Check balance.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setFormData({
            sourceAccountId: localStorage.getItem('accountNumber') || 'N/A',
            targetAccountId: '',
            amount: '',
        });
        setSearchQuery('');
        setUpiPin('');
        setSuccess('');
        setError('');
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button onClick={onClose} style={styles.closeBtn}>×</button>
                <h2 style={styles.title}>{step === 1 ? 'Quick Transfer' : 'Verify Security'}</h2>
                <p style={styles.subtitle}>
                    {step === 1 ? 'Fill in recipient and amount' : `Confirm $${formData.amount} to Acct ${formData.targetAccountId}`}
                </p>

                {error && <div style={styles.error}>{error}</div>}
                {success && <div style={styles.success}>{success}</div>}

                {step === 1 ? (
                    <form onSubmit={handleNext} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Recipient Account</label>
                            <div style={styles.relative}>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setFormData(p => ({ ...p, targetAccountId: e.target.value }));
                                        searchAccounts(e.target.value);
                                    }}
                                    placeholder="Account or Phone"
                                    style={styles.input}
                                    required
                                />
                                {showDropdown && (
                                    <div style={styles.dropdown}>
                                        {searchResults.map(u => (
                                            <div key={u.accountNumber} onClick={() => {
                                                setFormData(p => ({ ...p, targetAccountId: u.accountNumber }));
                                                setSearchQuery(u.accountNumber);
                                                setShowDropdown(false);
                                            }} style={styles.dropdownItem}>
                                                {u.accountNumber} ({u.phoneNumber})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Amount ($)</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="0.00"
                                style={styles.input}
                                required
                            />
                        </div>

                        <button type="submit" style={styles.primaryBtn}>Continue</button>
                    </form>
                ) : (
                    <div style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Enter 6-Digit UPI PIN</label>
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
                        <div style={styles.row}>
                            <button onClick={() => setStep(1)} style={styles.secondaryBtn}>Back</button>
                            <button onClick={handleConfirmTransfer} disabled={loading} style={styles.primaryBtn}>
                                {loading ? 'Processing...' : 'Send Money'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
    },
    modal: {
        width: '100%', maxWidth: '450px', backgroundColor: 'var(--bg-secondary)',
        padding: '2.5rem', borderRadius: '24px', position: 'relative',
        border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-lg)'
    },
    closeBtn: {
        position: 'absolute', top: '1.5rem', right: '1.5rem',
        background: 'none', border: 'none', color: 'var(--text-muted)',
        fontSize: '2rem', cursor: 'pointer',
    },
    title: { color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: '900' },
    subtitle: { color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' },
    form: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    label: { color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '700' },
    input: { padding: '1rem', borderRadius: '12px' },
    primaryBtn: {
        padding: '1rem', backgroundColor: 'var(--primary-color)', color: 'white',
        border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer'
    },
    secondaryBtn: {
        padding: '1rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)',
        border: '1px solid var(--glass-border)', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', flex: 1
    },
    row: { display: 'flex', gap: '1rem' },
    relative: { position: 'relative' },
    dropdown: {
        position: 'absolute', top: '100%', left: 0, right: 0,
        backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
        borderRadius: '12px', zIndex: 10, maxHeight: '150px', overflowY: 'auto'
    },
    dropdownItem: { padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)' },
    error: { color: 'var(--danger-color)', padding: '0.5rem', backgroundColor: 'rgba(244, 63, 94, 0.1)', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem' },
    success: { color: 'var(--success-color)', padding: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem' },
};

export default TransferModal;
