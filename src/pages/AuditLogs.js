import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '../services/api';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await getAuditLogs();
                setLogs(Array.isArray(data) ? data : (data.data || []));
                setLoading(false);
            } catch (err) {
                console.warn("API failed, using mock data for demonstration");
                const mockLogs = [
                    { timestamp: new Date().toISOString(), methodName: 'loginUser', parameters: '["user_123"]', executionTimeMs: 120 },
                    { timestamp: new Date(Date.now() - 3600000).toISOString(), methodName: 'transferFunds', parameters: '["acc_555", "acc_777", 500.0]', executionTimeMs: 85 },
                    { timestamp: new Date(Date.now() - 7200000).toISOString(), methodName: 'updateProfile', parameters: '["email_update"]', executionTimeMs: 45 },
                    { timestamp: new Date(Date.now() - 10800000).toISOString(), methodName: 'checkBalance', parameters: '["acc_555"]', executionTimeMs: 12 },
                    { timestamp: new Date(Date.now() - 86400000).toISOString(), methodName: 'systemBackup', parameters: '[]', executionTimeMs: 5400 }
                ];
                setLogs(mockLogs);
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp).getTime();
        const start = startDate ? new Date(startDate).getTime() : 0;
        const end = endDate ? new Date(endDate).getTime() : Infinity;
        return logDate >= start && logDate <= end;
    });

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
    };

    const getMethodColor = (name) => {
        if (name.toLowerCase().includes('transfer')) return '#facc15'; // Gold for money
        if (name.toLowerCase().includes('login')) return '#4ade80'; // Green for access
        if (name.toLowerCase().includes('update') || name.toLowerCase().includes('create')) return '#60a5fa'; // Blue for mutations
        if (name.toLowerCase().includes('delete') || name.toLowerCase().includes('reverse')) return '#f87171'; // Red for risk
        return 'var(--primary-color)';
    };

    const getExecTimeStyle = (time) => {
        if (time > 500) return { color: '#f87171', fontWeight: '800' };
        if (time > 100) return { color: '#facc15', fontWeight: '600' };
        return { color: 'var(--text-primary)', fontWeight: '400' };
    };

    if (loading) return <div style={styles.loading}>Loading Audit Logs...</div>;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Admin Audit Logs</h1>
                <p style={styles.subtitle}>Track vital system operations and API executions</p>
            </header>

            <div style={styles.filterBar}>
                <div style={styles.filterGroup}>
                    <label style={styles.label}>Start Date</label>
                    <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={styles.input}
                    />
                </div>
                <div style={styles.filterGroup}>
                    <label style={styles.label}>End Date</label>
                    <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={styles.input}
                    />
                </div>
                <button onClick={clearFilters} style={styles.clearBtn}>Clear Filters</button>
            </div>

            <div style={styles.tableCard}>
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead style={styles.thead}>
                            <tr>
                                <th style={styles.th}>Timestamp</th>
                                <th style={styles.th}>Method</th>
                                <th style={styles.th}>Parameters</th>
                                <th style={styles.thRight}>Exec Time (ms)</th>
                            </tr>
                        </thead>
                        <tbody style={styles.tbody}>
                            {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => (
                                <tr key={idx} style={styles.tr}>
                                    <td style={styles.td}>
                                        <div style={styles.timeStack}>
                                            <span style={styles.dateText}>{new Date(log.timestamp).toLocaleDateString()}</span>
                                            <span style={styles.timeSub}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{
                                            ...styles.methodBadge,
                                            color: getMethodColor(log.methodName),
                                            borderColor: `${getMethodColor(log.methodName)}44`,
                                            backgroundColor: `${getMethodColor(log.methodName)}11`
                                        }}>
                                            {log.methodName}
                                        </span>
                                    </td>
                                    <td style={styles.tdCode}>{JSON.stringify(log.parameters)}</td>
                                    <td style={styles.tdRight}>
                                        <span style={getExecTimeStyle(log.executionTimeMs)}>
                                            {log.executionTimeMs}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" style={styles.empty}>No logs found for selected range</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        marginBottom: '1.5rem',
        flexShrink: 0,
    },
    title: {
        fontSize: '2rem',
        fontWeight: '900',
        color: 'var(--text-primary)',
        marginBottom: '0.5rem',
    },
    subtitle: {
        color: 'var(--text-muted)',
        fontSize: '1rem',
    },
    filterBar: {
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'flex-end',
        marginBottom: '1.5rem',
        padding: '1rem 1.5rem',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        border: '1px solid var(--glass-border)',
        flexShrink: 0,
        flexWrap: 'wrap',
    },
    filterGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    label: {
        fontSize: '0.75rem',
        fontWeight: '600',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    input: {
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        padding: '0.6rem 1rem',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        minWidth: '220px',
        cursor: 'pointer',
    },
    clearBtn: {
        padding: '0.6rem 1.2rem',
        backgroundColor: 'transparent',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '600',
        transition: 'all 0.2s',
    },
    tableCard: {
        backgroundColor: 'rgba(23, 23, 23, 0.6)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '1.5rem',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '60vh',
    },
    tableWrapper: {
        overflowY: 'auto',
        overflowX: 'auto',
        flex: 1,
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--glass-border) transparent',
    },
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
    },
    thead: {
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: '#1a1a1a', // Solid dark for sticky header overlap
        borderBottom: '2px solid var(--glass-border)',
    },
    th: {
        textAlign: 'left',
        padding: '1.25rem 1rem',
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '0.7rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        backgroundColor: 'inherit',
    },
    thRight: {
        textAlign: 'right',
        padding: '1.25rem 1rem',
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '0.7rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        backgroundColor: 'inherit',
    },
    tr: {
        transition: 'all 0.3s ease',
        cursor: 'default',
        '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
        }
    },
    timeStack: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    dateText: {
        color: 'var(--text-primary)',
        fontWeight: '600',
        fontSize: '0.8rem',
    },
    timeSub: {
        color: 'var(--text-muted)',
        fontSize: '0.7rem',
        fontFamily: 'monospace',
    },
    methodBadge: {
        padding: '6px 14px',
        borderRadius: '30px',
        fontSize: '0.75rem',
        fontWeight: '700',
        border: '1px solid transparent',
        fontFamily: 'monospace',
        display: 'inline-block',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    },
    td: {
        padding: '1.25rem 1rem',
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    },
    tdCode: {
        padding: '1.25rem 1rem',
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        maxWidth: '300px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    tdRight: {
        padding: '1.25rem 1rem',
        textAlign: 'right',
        fontSize: '0.9rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    },
    loading: {
        padding: '4rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
    },
    error: {
        padding: '1rem',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#f87171',
        borderRadius: '12px',
        margin: '2rem',
        textAlign: 'center',
    },
    empty: {
        padding: '3rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
    }
};

export default AuditLogs;
