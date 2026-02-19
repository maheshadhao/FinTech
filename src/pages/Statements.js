import React, { useState, useEffect } from 'react';
import { downloadStatement, getTransactions, getStatementFile } from '../services/api';

const Statements = () => {
    const [loading, setLoading] = useState(false);
    const [batchLoading, setBatchLoading] = useState(false);
    const [statements, setStatements] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [error, setError] = useState('');
    // New Filter States
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
    const [filterMonth, setFilterMonth] = useState('All');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);
    const [sharingStatement, setSharingStatement] = useState(null);

    useEffect(() => {
        const fetchDataAndGenerateStatements = async () => {
            setLoading(true);
            try {
                const accountNumber = localStorage.getItem('accountNumber');
                const data = await getTransactions(accountNumber);
                const allTxns = Array.isArray(data) ? data : (data.data || []);

                const months = [];
                const now = new Date();
                const displayYear = parseInt(filterYear);

                // Start from the latest month available
                let startMonth = displayYear === now.getFullYear() ? now.getMonth() : 11;

                for (let i = startMonth; i >= 0; i--) {
                    const date = new Date(displayYear, i, 1);
                    const monthName = date.toLocaleString('default', { month: 'long' });

                    const formatDate = (d) => {
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    };

                    const startDate = formatDate(new Date(displayYear, i, 1));
                    const endDate = formatDate(new Date(displayYear, i + 1, 0));

                    // Calculate Summary for this month
                    const monthTxns = allTxns.filter(tx => {
                        const tDate = (tx.timestamp || tx.date).split('T')[0];
                        return tDate >= startDate && tDate <= endDate;
                    });

                    let credits = 0;
                    let debits = 0;
                    monthTxns.forEach(tx => {
                        const isReceiver = String(tx.receiverAccount || '').trim() === String(accountNumber || '').trim();
                        const isCredit = isReceiver || tx.type === 'DEPOSIT' || tx.type === 'INITIAL_DEPOSIT';
                        if (isCredit) credits += Math.abs(tx.amount);
                        else debits += Math.abs(tx.amount);
                    });

                    months.push({
                        name: `${monthName} ${displayYear}`,
                        startDate,
                        endDate,
                        month: monthName,
                        year: displayYear,
                        credits,
                        debits,
                        balance: credits - debits,
                        status: Math.random() > 0.1 ? 'Generated' : 'Processing', // Simulated status
                        txnCount: monthTxns.length
                    });
                }

                if (customStart && customEnd) {
                    const customTxns = allTxns.filter(tx => {
                        const tDate = (tx.timestamp || tx.date).split('T')[0];
                        return tDate >= customStart && tDate <= customEnd;
                    });

                    let credits = 0, debits = 0;
                    customTxns.forEach(tx => {
                        const isReceiver = String(tx.receiverAccount || '').trim() === String(accountNumber || '').trim();
                        if (isReceiver || tx.type === 'DEPOSIT' || tx.type === 'INITIAL_DEPOSIT') credits += Math.abs(tx.amount);
                        else debits += Math.abs(tx.amount);
                    });

                    months.unshift({
                        name: "Custom Period",
                        startDate: customStart,
                        endDate: customEnd,
                        month: "Custom",
                        year: "Custom",
                        credits,
                        debits,
                        balance: credits - debits,
                        status: 'Generated',
                        txnCount: customTxns.length
                    });
                }

                // Apply month filter if not "All"
                let filteredMonths = filterMonth === 'All'
                    ? months
                    : months.filter(m => m.month === filterMonth);

                setStatements(filteredMonths);
            } catch (err) {
                console.error("Failed to load statements context:", err);
                setError("Failed to load account data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDataAndGenerateStatements();
    }, [filterYear, filterMonth, customStart, customEnd]);

    const handleDownload = async (e, startDate, endDate) => {
        if (e) e.stopPropagation(); // Prevent card click
        setLoading(true);
        try {
            await downloadStatement(startDate, endDate);
        } catch (err) {
            alert('Failed to download statement.');
        } finally {
            setLoading(false);
        }
    };

    const handleBatchDownload = async () => {
        const visibleStatements = statements.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
        if (visibleStatements.length === 0) return;

        setBatchLoading(true);
        try {
            for (const stmt of visibleStatements) {
                await downloadStatement(stmt.startDate, stmt.endDate);
                // Small delay to prevent browser from blocking multiple triggers
                await new Promise(resolve => setTimeout(resolve, 800));
            }
        } catch (err) {
            console.error("Batch download failed:", err);
            alert("Some downloads might have failed. Please check your browser's download manager.");
        } finally {
            setBatchLoading(false);
        }
    };

    const handleShare = (e, stmt) => {
        if (e) e.stopPropagation();
        setSharingStatement(stmt);
        setShowShareModal(true);
    };

    const copyShareLink = () => {
        const text = `Banking Statement: ${sharingStatement.name} (${sharingStatement.startDate} to ${sharingStatement.endDate})`;
        navigator.clipboard.writeText(text).then(() => {
            alert('Statement details copied to clipboard!');
        });
    };

    const shareViaEmail = () => {
        const subject = encodeURIComponent(`Monthly Statement: ${sharingStatement.name}`);
        const body = encodeURIComponent(`Hi,\n\nPlease find the transaction summary for ${sharingStatement.startDate} to ${sharingStatement.endDate}.\n\nTotal Credits: ₹${sharingStatement.credits}\nTotal Debits: ₹${sharingStatement.debits}\nClosing Balance: ₹${sharingStatement.balance}\n\nGenerated via Fintech Banking.`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const shareNative = async () => {
        if (!navigator.share) {
            alert('Native share is not supported in this browser.');
            return;
        }
        setLoading(true);
        try {
            const file = await getStatementFile(sharingStatement.startDate, sharingStatement.endDate);
            await navigator.share({
                files: [file],
                title: 'Monthly Statement'
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Native share failed:', err);
                alert('Native sharing failed. Please use alternative methods like Email or Download.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleViewMonth = async (stmt) => {
        setLoading(true);
        setSelectedMonth(stmt);
        setError('');
        try {
            const accountNumber = localStorage.getItem('accountNumber');
            const data = await getTransactions(accountNumber);
            const allTxns = Array.isArray(data) ? data : (data.data || []);

            // Filter transactions by the selected month's range
            const filtered = allTxns.filter(tx => {
                const txDate = (tx.timestamp || tx.date).split('T')[0];
                return txDate >= stmt.startDate && txDate <= stmt.endDate;
            });

            setFilteredTransactions(filtered);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
            setError('Failed to load transactions for this month.');
        } finally {
            setLoading(false);
        }
    };

    if (selectedMonth) {
        return (
            <div style={styles.container}>
                <header style={{ ...styles.header, flexDirection: 'column', alignItems: 'flex-start' }}>
                    <button onClick={() => setSelectedMonth(null)} style={styles.backBtn} className="no-print">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        Back to Statements
                    </button>
                    <h1 style={styles.title}>{selectedMonth.name}</h1>
                    <p style={styles.subtitle}>Detailed transactions from {selectedMonth.startDate} to {selectedMonth.endDate}</p>
                </header>

                {/* Summary for detailed view */}
                <div style={{ ...styles.summaryGrid, marginBottom: '2rem', maxWidth: '800px' }}>
                    <div style={styles.sumItem}>
                        <span style={styles.sumLabel}>Total Credits</span>
                        <span style={{ ...styles.sumValue, color: 'var(--success-color)', fontSize: '1.25rem' }}>
                            +₹{selectedMonth.credits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div style={styles.sumItem}>
                        <span style={styles.sumLabel}>Total Debits</span>
                        <span style={{ ...styles.sumValue, color: 'var(--danger-color)', fontSize: '1.25rem' }}>
                            -₹{selectedMonth.debits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div style={styles.sumItem}>
                        <span style={styles.sumLabel}>Closing Balance</span>
                        <span style={{ ...styles.sumValue, fontSize: '1.25rem' }}>
                            ₹{selectedMonth.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                <div style={styles.tableCard}>
                    {loading ? (
                        <div style={styles.infoText}>
                            <div className="spinner" style={{ marginBottom: '1rem' }}></div>
                            <p>Fetching transactions...</p>
                        </div>
                    ) : error ? (
                        <p style={styles.errorText}>{error}</p>
                    ) : filteredTransactions.length > 0 ? (
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Date</th>
                                        <th style={styles.th}>Type</th>
                                        <th style={styles.th}>Reference / Description</th>
                                        <th style={styles.thRight}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map((tx, i) => {
                                        const accountNumber = localStorage.getItem('accountNumber');
                                        const isReceiver = String(tx.receiverAccount || '').trim() === String(accountNumber || '').trim();
                                        const isCredit = isReceiver || tx.type === 'DEPOSIT' || tx.type === 'INITIAL_DEPOSIT';

                                        let otherAccount = isReceiver ? tx.senderAccount : tx.receiverAccount;
                                        if (tx.type === 'DEPOSIT') otherAccount = 'Bank Deposit';
                                        if (tx.type === 'INITIAL_DEPOSIT') otherAccount = 'Initial Deposit';
                                        if (tx.type === 'WITHDRAW') otherAccount = 'Bank Withdrawal';

                                        return (
                                            <tr key={i} style={styles.tr}>
                                                <td style={styles.td}>
                                                    <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{new Date(tx.timestamp || tx.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{new Date(tx.timestamp || tx.date).getFullYear()}</div>
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '700',
                                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                        border: '1px solid var(--glass-border)'
                                                    }}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td style={styles.td}>
                                                    <div style={{ fontWeight: '600' }}>{tx.description || 'Electronic Transfer'}</div>
                                                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{otherAccount || '-'}</div>
                                                </td>
                                                <td style={{ ...styles.tdRight, color: isCredit ? '#10b981' : '#f43f5e' }}>
                                                    {isCredit ? '+' : '-'}{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={styles.infoText}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: '1rem' }}>
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="9" y1="9" x2="15" y2="9"></line>
                                <line x1="9" y1="13" x2="15" y2="13"></line>
                                <line x1="9" y1="17" x2="11" y2="17"></line>
                            </svg>
                            <p>No records found for this period.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>Monthly Statements</h1>
                    <p style={styles.subtitle}>Manage and download your transaction history</p>
                </div>
                <button
                    style={{ ...styles.downloadAllBtn, opacity: batchLoading ? 0.7 : 1, cursor: batchLoading ? 'not-allowed' : 'pointer' }}
                    onClick={handleBatchDownload}
                    disabled={batchLoading}
                    className="no-print"
                >
                    {batchLoading ? (
                        <>
                            <div className="spinner-small" style={{ marginRight: '8px' }}></div>
                            Downloading...
                        </>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Download All
                        </>
                    )}
                </button>
            </header>

            <div style={styles.filterBar} className="no-print">
                <div style={styles.filterGroup}>
                    <label style={styles.label}>Select Year</label>
                    <select
                        style={styles.select}
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                    >
                        <option>2026</option>
                        <option>2025</option>
                        <option>2024</option>
                    </select>
                </div>
                <div style={styles.filterGroup}>
                    <label style={styles.label}>Month</label>
                    <select
                        style={styles.select}
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                    >
                        <option>All</option>
                        <option>January</option>
                        <option>February</option>
                        <option>March</option>
                        <option>April</option>
                        <option>May</option>
                        <option>June</option>
                        <option>July</option>
                        <option>August</option>
                        <option>September</option>
                        <option>October</option>
                        <option>November</option>
                        <option>December</option>
                    </select>
                </div>
                <div style={styles.filterGroup}>
                    <label style={styles.label}>Start Date</label>
                    <input
                        type="date"
                        style={styles.input}
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                    />
                </div>
                <div style={styles.filterGroup}>
                    <label style={styles.label}>End Date</label>
                    <input
                        type="date"
                        style={styles.input}
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                    />
                </div>
                <div style={styles.searchGroup}>
                    <label style={styles.label}>Search statements</label>
                    <input
                        type="text"
                        placeholder="Search by month or year..."
                        style={styles.input}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div style={styles.grid}>
                {statements
                    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((stmt, index) => (
                        <div key={index} style={styles.card}>
                            <div style={styles.cardTop}>
                                <div style={styles.cardInfo}>
                                    <div style={styles.iconBox}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                            <line x1="16" y1="13" x2="8" y2="13"></line>
                                            <line x1="16" y1="17" x2="8" y2="17"></line>
                                            <polyline points="10 9 9 9 8 9"></polyline>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 style={styles.monthTitle}>{stmt.name}</h3>
                                        <p style={styles.dateRange}>{stmt.startDate} to {stmt.endDate}</p>
                                    </div>
                                </div>
                                <span style={styles.statusBadge(stmt.status)}>{stmt.status}</span>
                            </div>

                            <div style={styles.summaryGrid}>
                                <div style={styles.sumItem}>
                                    <span style={styles.sumLabel}>Credits</span>
                                    <span style={{ ...styles.sumValue, color: 'var(--success-color)' }}>
                                        +₹{stmt.credits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div style={styles.sumItem}>
                                    <span style={styles.sumLabel}>Debits</span>
                                    <span style={{ ...styles.sumValue, color: 'var(--danger-color)' }}>
                                        -₹{stmt.debits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div style={styles.sumItem}>
                                    <span style={styles.sumLabel}>Closing</span>
                                    <span style={styles.sumValue}>
                                        ₹{stmt.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            <div style={styles.cardActions} className="no-print">
                                <div style={styles.actionGroup}>
                                    <button style={styles.iconBtn} title="Download" onClick={(e) => handleDownload(e, stmt.startDate, stmt.endDate)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path>
                                            <polyline points="7 10 12 15 17 10"></polyline>
                                            <line x1="12" y1="15" x2="12" y2="3"></line>
                                        </svg>
                                    </button>
                                    <button style={styles.iconBtn} title="Share" onClick={(e) => handleShare(e, stmt)}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="18" cy="5" r="3"></circle>
                                            <circle cx="6" cy="12" r="3"></circle>
                                            <circle cx="18" cy="19" r="3"></circle>
                                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                        </svg>
                                    </button>
                                    <button style={styles.iconBtn} title="Print" onClick={(e) => { e.stopPropagation(); window.print(); }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                            <rect x="6" y="14" width="12" height="8"></rect>
                                        </svg>
                                    </button>
                                </div>
                                <button
                                    style={styles.mainActionBtn}
                                    onClick={() => handleViewMonth(stmt)}
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
            </div>

            {!loading && statements.length === 0 && (
                <div style={styles.infoText}>
                    <p>No statements found for the selected criteria.</p>
                </div>
            )}

            {/* Share Modal */}
            {showShareModal && sharingStatement && (
                <div style={styles.modalOverlay} onClick={() => setShowShareModal(false)} className="no-print">
                    <div style={styles.shareModal} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>Share Statement</h3>
                            <button style={styles.closeBtn} onClick={() => setShowShareModal(false)}>×</button>
                        </div>
                        <p style={styles.modalSub}>Select how you'd like to share <strong>{sharingStatement.name}</strong></p>

                        <div style={styles.shareGrid}>
                            <button style={styles.shareOption} onClick={shareViaEmail}>
                                <div style={{ ...styles.shareIcon, background: 'rgba(234, 67, 53, 0.15)' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                </div>
                                <span style={styles.shareText}>Email</span>
                            </button>

                            <button style={styles.shareOption} onClick={(e) => {
                                handleDownload(null, sharingStatement.startDate, sharingStatement.endDate);
                                setShowShareModal(false);
                            }}>
                                <div style={{ ...styles.shareIcon, background: 'rgba(52, 168, 83, 0.15)' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34a853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                </div>
                                <span style={styles.shareText}>Download</span>
                            </button>

                            <button style={styles.shareOption} onClick={copyShareLink}>
                                <div style={{ ...styles.shareIcon, background: 'rgba(66, 133, 244, 0.15)' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                </div>
                                <span style={styles.shareText}>Copy</span>
                            </button>

                            <button style={styles.shareOption} onClick={shareNative}>
                                <div style={{ ...styles.shareIcon, background: 'rgba(168, 85, 247, 0.15)' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                </div>
                                <span style={styles.shareText}>Native</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        padding: '2rem',
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
    },
    title: {
        fontSize: '2rem',
        fontWeight: '900',
        margin: '0 0 0.5rem 0',
        background: 'var(--accent-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        color: 'var(--text-muted)',
        fontSize: '1rem',
        margin: 0,
    },
    downloadAllBtn: {
        padding: '0.8rem 1.5rem',
        borderRadius: '12px',
        backgroundColor: 'var(--primary-color)',
        color: '#fff',
        border: 'none',
        fontWeight: '700',
        fontSize: '0.9rem',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    filterBar: {
        display: 'flex',
        gap: '1.25rem',
        padding: '1.5rem',
        backgroundColor: 'var(--glass-bg)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        marginBottom: '2.5rem',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
    },
    filterGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        flex: '1 1 150px',
    },
    label: {
        fontSize: '0.75rem',
        fontWeight: '700',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    select: {
        padding: '0.7rem 1rem',
        borderRadius: '12px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer',
        outline: 'none',
    },
    input: {
        padding: '0.7rem 1rem',
        borderRadius: '12px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        outline: 'none',
    },
    searchGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        flex: '2 1 300px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '2rem',
    },
    card: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '24px',
        padding: '1.75rem',
        border: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden',
    },
    cardTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
    },
    iconBox: {
        width: '52px',
        height: '52px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        color: 'var(--primary-color)',
    },
    monthTitle: {
        fontSize: '1.25rem',
        fontWeight: '800',
        color: 'var(--text-primary)',
        margin: 0,
    },
    statusBadge: (status) => ({
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.7rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        backgroundColor: status === 'Generated' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        color: status === 'Generated' ? '#10b981' : '#f59e0b',
        border: `1px solid ${status === 'Generated' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
    }),
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        padding: '1.25rem',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)',
    },
    sumItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
    },
    sumLabel: {
        fontSize: '0.65rem',
        fontWeight: '700',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
    },
    sumValue: {
        fontSize: '0.95rem',
        fontWeight: '800',
        color: 'var(--text-primary)',
    },
    cardActions: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '0.5rem',
    },
    actionGroup: {
        display: 'flex',
        gap: '0.75rem',
    },
    iconBtn: {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        border: '1px solid var(--glass-border)',
        backgroundColor: 'var(--bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        color: 'var(--text-secondary)',
    },
    mainActionBtn: {
        padding: '0.6rem 1.25rem',
        borderRadius: '12px',
        backgroundColor: 'var(--primary-color)',
        color: '#fff',
        border: 'none',
        fontWeight: '700',
        fontSize: '0.85rem',
        cursor: 'pointer',
        transition: 'transform 0.2s',
    },
    tableCard: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '24px',
        padding: '2rem',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-lg)',
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        textAlign: 'left',
        padding: '1rem',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        borderBottom: '1px solid var(--glass-border)',
    },
    thRight: {
        textAlign: 'right',
        padding: '1rem',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        borderBottom: '1px solid var(--glass-border)',
    },
    tr: {
        borderBottom: '1px solid var(--glass-border)',
        transition: 'background-color 0.2s',
    },
    td: {
        padding: '1.25rem 1rem',
        color: 'var(--text-secondary)',
        fontSize: '0.95rem',
    },
    tdRight: {
        padding: '1.25rem 1rem',
        textAlign: 'right',
        fontSize: '1rem',
        fontWeight: '700',
    },
    infoText: {
        textAlign: 'center',
        padding: '3rem',
        color: 'var(--text-muted)',
    },
    errorText: {
        textAlign: 'center',
        padding: '2rem',
        color: 'var(--danger-color)',
    },
    backBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--primary-color)',
        fontSize: '1rem',
        fontWeight: '700',
        cursor: 'pointer',
        marginBottom: '1rem',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
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
        padding: '1rem',
    },
    shareModal: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '28px',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
    },
    modalTitle: {
        fontSize: '1.5rem',
        fontWeight: '800',
        margin: 0,
        color: 'var(--text-primary)',
    },
    modalSub: {
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        marginBottom: '2rem',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        fontSize: '2rem',
        cursor: 'pointer',
        lineHeight: 1,
        padding: 0,
    },
    shareGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1.25rem',
    },
    shareOption: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1.25rem',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        color: 'var(--text-primary)',
        outline: 'none',
    },
    shareIcon: {
        width: '48px',
        height: '48px',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shareText: {
        fontSize: '0.85rem',
        fontWeight: '700',
    },
};

export default Statements;
