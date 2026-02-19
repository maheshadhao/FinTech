import React, { useState } from 'react';
import { depositFunds } from '../services/api';
import '../index.css';

const Deposit = () => {
    const storedAccount = localStorage.getItem('accountNumber') || '';

    const [formData, setFormData] = useState({
        accountId: storedAccount,
        amount: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        console.log('Deposit Data:', formData);

        depositFunds(formData)
            .then(response => {
                console.log('Deposit Success:', response);
                setSuccess(`Successfully deposited $${formData.amount} to Account ${formData.accountId}`);
                setFormData({ accountId: '', amount: '' }); // Reset form
            })
            .catch(err => {
                console.error('Deposit Failed:', err);
                setError('Deposit failed. Please check Account ID and try again.');
            });
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.header}>Deposit Funds</h1>
                <p style={styles.subHeader}>Add money to your account securely.</p>

                {error && <p style={styles.error}>{error}</p>}
                {success && <p style={styles.success}>{success}</p>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Amount ($)</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            min="0.01"
                            step="0.01"
                            required
                        />
                    </div>

                    <button type="submit" style={styles.button}>
                        Deposit
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '800px',
        margin: '2rem auto',
    },
    card: {
        backgroundColor: 'var(--bg-secondary)',
        padding: '2.5rem',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-lg)',
        transition: 'var(--transition)',
    },
    header: {
        fontSize: '2rem',
        fontWeight: '900',
        marginBottom: '0.75rem',
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
    },
    subHeader: {
        color: 'var(--text-muted)',
        marginBottom: '2.5rem',
        fontSize: '1rem',
    },
    error: {
        color: 'var(--danger-color)',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        padding: '1.25rem',
        borderRadius: '16px',
        textAlign: 'center',
        marginBottom: '2rem',
        border: '1px solid var(--danger-color)',
    },
    success: {
        color: 'var(--success-color)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        padding: '1.25rem',
        borderRadius: '16px',
        textAlign: 'center',
        marginBottom: '2rem',
        border: '1px solid var(--success-color)',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },
    label: {
        fontSize: '0.85rem',
        fontWeight: '700',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
    },
    button: {
        backgroundColor: 'var(--success-color)',
        color: 'white',
        border: 'none',
        padding: '1rem',
        fontSize: '1rem',
        fontWeight: '800',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'var(--transition)',
    },
};

export default Deposit;
