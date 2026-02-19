import React, { useState, useCallback, useEffect } from 'react';

import '../index.css';
import { getTransactions } from '../services/api';

const TransactionHistory = () => {

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState('');
    const accountNumber = localStorage.getItem('accountNumber') || '';

    const fetchTransactions = useCallback(() => {
        setLoading(true);
        getTransactions(accountNumber)
            .then(data => {
                setLoading(false);
                if (Array.isArray(data)) {
                    setTransactions(data);
                } else if (data.status === "success" || data.data) {
                    setTransactions(data.data || data);
                } else {
                    setError(data.message || "Failed to fetch transactions");
                }
            })
            .catch(err => {
                setLoading(false);
                console.error('History fetch failed:', err);
                setError('Failed to load transactions.');
            });
    }, [accountNumber]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Since accountNumber is already loaded from localStorage, we can just fetch
                fetchTransactions();
            } catch (err) {
                console.error("Failed to fetch user data", err);
            }
        };
        fetchUserData();
    }, [fetchTransactions]);


    return (
        <div style={styles.container}>
            <div className="premium-card">
                <h1 className="premium-title">Transaction History</h1>
                <p style={styles.subHeader}>Track your financial activity with precision.</p>

                {error && <p style={styles.error}>{error}</p>}

                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading transactions...</p>
                ) : (
                    <div style={styles.tableContainer} className="glass-panel">
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Date</th>
                                    <th style={styles.th}>Type</th>
                                    <th style={styles.th}>ID</th>
                                    <th style={styles.th}>Account</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.thRight}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((txn) => {
                                    const isReceiver = String(txn.receiverAccount).trim() === String(accountNumber).trim();
                                    const amount = Math.abs(txn.amount);
                                    let isCredit = isReceiver;

                                    if (txn.type === 'DEPOSIT' || txn.type === 'INITIAL_DEPOSIT') isCredit = true;
                                    if (txn.type === 'WITHDRAW') isCredit = false;

                                    let otherAccount = isReceiver ? txn.senderAccount : txn.receiverAccount;
                                    if (txn.type === 'DEPOSIT') otherAccount = 'Bank Deposit';
                                    if (txn.type === 'INITIAL_DEPOSIT') otherAccount = 'Initial Deposit';
                                    if (txn.type === 'WITHDRAW') otherAccount = 'Bank Withdrawal';

                                    const displayType = isCredit ? 'Credited' : 'Debited';

                                    return (
                                        <tr key={txn.id} style={styles.tr}>
                                            <td style={styles.td}>{new Date(txn.timestamp || txn.date).toLocaleString()}</td>
                                            <td style={styles.td}>{txn.type}</td>
                                            <td style={styles.tdCode}>{txn.id}</td>
                                            <td style={styles.tdCode}>{otherAccount}</td>
                                            <td style={styles.td}>
                                                <span style={{ color: isCredit ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: '600' }}>
                                                    {displayType}
                                                </span>
                                            </td>
                                            <td style={{ ...styles.tdRight, color: isCredit ? 'var(--success-color)' : 'var(--danger-color)' }}>
                                                {isCredit ? '+' : '-'}{amount.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};




const styles = {
    container: {
        maxWidth: '1000px',
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
    form: {
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-end',
        backgroundColor: 'var(--bg-tertiary)',
        padding: '1.5rem',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)',
    },
    inputGroup: {
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        gap: '0.5rem',
    },
    label: {
        fontSize: '0.75rem',
        fontWeight: '700',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    button: {
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.5rem',
        fontSize: '0.9rem',
        fontWeight: '800',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'var(--transition)',
        height: '44px',
    },
    tableContainer: {
        marginTop: '2rem',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--glass-border)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        textAlign: 'left',
        padding: '1rem 1.5rem',
        color: 'var(--text-muted)',
        backgroundColor: 'var(--bg-tertiary)',
        borderBottom: '2px solid var(--glass-border)',
        fontWeight: 'bold',
        fontSize: '0.9rem',
    },
    thRight: {
        textAlign: 'right',
        padding: '1rem 1.5rem',
        color: 'var(--text-muted)',
        backgroundColor: 'var(--bg-tertiary)',
        borderBottom: '2px solid var(--glass-border)',
        fontWeight: 'bold',
        fontSize: '0.9rem',
    },
    tr: {
        borderBottom: '1px solid var(--glass-border)',
    },
    td: {
        padding: '1rem 1.5rem',
        fontSize: '0.9rem',
        color: 'var(--text-primary)',
    },
    tdRight: {
        padding: '1rem 1.5rem',
        fontSize: '0.9rem',
        textAlign: 'right',
        color: 'var(--text-primary)',
    },
    tdCode: {
        padding: '1rem',
        fontSize: '0.85rem',
        fontFamily: 'monospace',
        color: 'var(--text-secondary)',
    },
    error: {
        color: 'var(--danger-color)',
        textAlign: 'center',
        padding: '1rem',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        borderRadius: '12px',
        margin: '1.5rem 0',
        border: '1px solid var(--danger-color)',
    }
};

export default TransactionHistory;
