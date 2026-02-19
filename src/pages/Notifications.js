import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationRead } from '../services/api';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getNotifications();
            setNotifications(data);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);

            // Check for authentication error (401 Unauthorized)
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                console.log('Session expired, redirecting to login...');
                window.location.href = '/login';
                return;
            }

            setError('Failed to load notifications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await markNotificationRead(notificationId);
            // Update local state to reflect the change
            setNotifications(notifications.map(notif =>
                notif.id === notificationId ? { ...notif, isRead: true } : notif
            ));
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                window.location.href = '/login';
            }
        }
    };

    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const notifDate = new Date(timestamp);
        const diffMs = now - notifDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return notifDate.toLocaleDateString();
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <header style={styles.header}>
                    <h1 style={styles.title}>Notifications</h1>
                    <p style={styles.subtitle}>Stay updated with your latest account activities</p>
                </header>
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p style={styles.loadingText}>Loading notifications...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <header style={styles.header}>
                    <h1 style={styles.title}>Notifications</h1>
                    <p style={styles.subtitle}>Stay updated with your latest account activities</p>
                </header>
                <div style={styles.errorContainer}>
                    <p style={styles.errorText}>⚠️ {error}</p>
                    <button style={styles.retryButton} onClick={fetchNotifications}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Notifications</h1>
                <p style={styles.subtitle}>Stay updated with your latest account activities</p>
            </header>

            {notifications.length === 0 ? (
                <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>🔔</div>
                    <h3 style={styles.emptyTitle}>No notifications yet</h3>
                    <p style={styles.emptyMessage}>You'll see notifications here when you have new activity</p>
                </div>
            ) : (
                <div style={styles.list}>
                    {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            style={{
                                ...styles.notifCard,
                                opacity: notif.isRead ? 0.7 : 1
                            }}
                            onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                        >
                            <div style={styles.notifIcon}>{notif.icon || '📬'}</div>
                            <div style={styles.notifText}>
                                <h3 style={styles.notifTitle}>{notif.title}</h3>
                                <p style={styles.notifMessage}>{notif.message}</p>
                                <span style={styles.notifTime}>{formatTimestamp(notif.timestamp)}</span>
                            </div>
                            {!notif.isRead && <div style={styles.notifBadge} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        padding: '2.5rem',
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
        transition: 'var(--transition)',
    },
    header: { marginBottom: '3rem' },
    title: {
        fontSize: '2.5rem',
        fontWeight: '900',
        margin: '0 0 0.5rem 0',
        background: 'linear-gradient(135deg, #4f46e5 0%, #10b981 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: { color: 'var(--text-muted)', fontSize: '1rem' },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '800px',
    },
    notifCard: {
        display: 'flex',
        alignItems: 'center',
        padding: '1.5rem',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-lg)',
        transition: 'var(--transition)',
        position: 'relative',
        cursor: 'pointer',
    },
    notifIcon: {
        fontSize: '1.5rem',
        marginRight: '1.5rem',
        backgroundColor: 'var(--bg-tertiary)',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
    },
    notifText: { flex: 1 },
    notifTitle: { fontSize: '1.1rem', fontWeight: '700', margin: '0 0 0.25rem 0' },
    notifMessage: { fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', lineHeight: '1.4' },
    notifTime: { fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' },
    notifBadge: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: 'var(--primary-color)',
        position: 'absolute',
        top: '1.5rem',
        right: '1.5rem',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem',
    },
    spinner: {
        width: '50px',
        height: '50px',
        border: '4px solid var(--glass-border)',
        borderTop: '4px solid var(--primary-color)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    loadingText: {
        marginTop: '1rem',
        color: 'var(--text-muted)',
        fontSize: '1rem',
    },
    errorContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem',
    },
    errorText: {
        color: 'var(--error-color, #ef4444)',
        fontSize: '1rem',
        marginBottom: '1rem',
    },
    retryButton: {
        padding: '0.75rem 2rem',
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'var(--transition)',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem',
        textAlign: 'center',
    },
    emptyIcon: {
        fontSize: '4rem',
        marginBottom: '1rem',
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: '1.5rem',
        fontWeight: '700',
        margin: '0 0 0.5rem 0',
        color: 'var(--text-primary)',
    },
    emptyMessage: {
        fontSize: '1rem',
        color: 'var(--text-muted)',
    },
};

export default Notifications;
