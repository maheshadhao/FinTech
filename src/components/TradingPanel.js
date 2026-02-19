import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { buyStock, sellStock } from '../services/api';

const TradingPanel = ({ stocks, userBalance, userPortfolio, onTradeSuccess }) => {
    const navigate = useNavigate();
    const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
    const [selectedSymbol, setSelectedSymbol] = useState('');
    const [quantity, setQuantity] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [notification, setNotification] = useState(null);

    const selectedStock = useMemo(() =>
        stocks.find(s => s.symbol === selectedSymbol),
        [stocks, selectedSymbol]);

    const estimatedTotal = useMemo(() => {
        if (!selectedStock || !quantity) return 0;
        return selectedStock.currentPrice * parseInt(quantity);
    }, [selectedStock, quantity]);

    const ownedQuantity = useMemo(() => {
        if (!selectedSymbol || !userPortfolio) return 0;
        const holding = userPortfolio.find(p => p.symbol === selectedSymbol);
        return holding ? holding.quantity : 0;
    }, [selectedSymbol, userPortfolio]);

    const isValid = useMemo(() => {
        if (!selectedSymbol || !quantity || parseInt(quantity) <= 0) return false;
        if (tradeType === 'buy') {
            return estimatedTotal <= userBalance;
        } else {
            return parseInt(quantity) <= ownedQuantity;
        }
    }, [selectedSymbol, quantity, tradeType, estimatedTotal, userBalance, ownedQuantity]);

    const handleTrade = async () => {
        setLoading(true);
        setNotification(null);
        try {
            const tradeData = {
                symbol: selectedSymbol,
                quantity: parseInt(quantity),
                price: selectedStock.currentPrice
            };

            tradeType === 'buy' ? await buyStock(tradeData) : await sellStock(tradeData);

            setNotification({ type: 'success', message: `Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${selectedSymbol}` });
            setQuantity('');
            setShowConfirm(false);
            if (onTradeSuccess) onTradeSuccess();
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setNotification({ type: 'error', message: 'Session expired. Redirecting to login...' });
                setTimeout(() => navigate('/login'), 1500);
            } else {
                const errorMsg = err.response?.data?.error || `Failed to execute ${tradeType} trade`;
                if (errorMsg.includes("Holding not found")) {
                    setNotification({ type: 'error', message: 'Sync Error: You do not own this stock. Refreshing...' });
                    setTimeout(() => {
                        if (onTradeSuccess) onTradeSuccess(); // Refresh data
                        setTradeType('buy'); // Reset to buy to avoid stuck state
                        setQuantity('');
                    }, 1500);
                } else {
                    setNotification({ type: 'error', message: errorMsg });
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button
                    style={{ ...styles.toggleBtn, ...(tradeType === 'buy' ? styles.buyActive : {}) }}
                    onClick={() => setTradeType('buy')}
                >
                    BUY
                </button>
                <button
                    style={{ ...styles.toggleBtn, ...(tradeType === 'sell' ? styles.sellActive : {}) }}
                    onClick={() => setTradeType('sell')}
                >
                    SELL
                </button>
            </div>

            <div style={styles.form}>
                <div style={styles.field}>
                    <label style={styles.label}>STOCK SYMBOL</label>
                    <select
                        value={selectedSymbol}
                        onChange={(e) => setSelectedSymbol(e.target.value)}
                        style={styles.select}
                    >
                        <option value="">Select a stock...</option>
                        {stocks.map(stock => (
                            <option key={stock.symbol} value={stock.symbol}>
                                {stock.symbol} - {stock.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={styles.field}>
                    <label style={styles.label}>QUANTITY</label>
                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0"
                        style={styles.input}
                    />
                </div>

                {selectedStock && (
                    <div style={styles.marketIntel}>
                        <div style={styles.intelRow}>
                            <span>Market Price</span>
                            <span style={styles.price}>${selectedStock.currentPrice.toFixed(2)}</span>
                        </div>
                        <div style={styles.intelRow}>
                            <span>{tradeType === 'buy' ? 'Available Balance' : 'Owned Shares'}</span>
                            <span>{tradeType === 'buy' ? `$${userBalance.toLocaleString()}` : `${ownedQuantity} shares`}</span>
                        </div>
                        <div style={{ ...styles.intelRow, borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                            <span style={styles.totalLabel}>Estimated Total</span>
                            <span style={styles.totalValue}>${estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                )}

                <button
                    disabled={!isValid || loading}
                    onClick={() => setShowConfirm(true)}
                    style={{ ...styles.submitBtn, opacity: (!isValid || loading) ? 0.5 : 1 }}
                >
                    {loading ? 'Processing...' : `Execute ${tradeType.toUpperCase()}`}
                </button>

                {notification && (
                    <div style={{ ...styles.notification, ...(notification.type === 'error' ? styles.errorNotif : styles.successNotif) }}>
                        {notification.message}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>Confirm Trade</h3>
                        <p style={styles.modalText}>
                            Are you sure you want to {tradeType} <strong>{quantity}</strong> shares of <strong>{selectedSymbol}</strong> at approx. <strong>${selectedStock.currentPrice.toFixed(2)}</strong>?
                        </p>
                        <div style={styles.modalActions}>
                            <button onClick={() => setShowConfirm(false)} style={styles.cancelBtn}>Cancel</button>
                            <button onClick={handleTrade} style={styles.confirmBtn}>Confirm Trade</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        borderRadius: '24px',
        padding: '1.5rem',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    header: {
        display: 'flex',
        background: 'rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        padding: '0.25rem',
    },
    toggleBtn: {
        flex: 1,
        padding: '0.6rem',
        border: 'none',
        borderRadius: '10px',
        background: 'transparent',
        color: 'var(--text-muted)',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'var(--transition)',
    },
    buyActive: {
        background: 'var(--success-color)',
        color: 'white',
    },
    sellActive: {
        background: 'var(--danger-color)',
        color: 'white',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    label: {
        fontSize: '0.75rem',
        fontWeight: '800',
        color: 'var(--text-muted)',
        letterSpacing: '0.05em',
    },
    select: {
        padding: '0.75rem',
        borderRadius: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        border: '1px solid var(--glass-border)',
        color: 'var(--text-primary)',
        width: '100%',
        outline: 'none',
    },
    input: {
        padding: '0.75rem',
        borderRadius: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        border: '1px solid var(--glass-border)',
        color: 'var(--text-primary)',
        width: '100%',
        outline: 'none',
        fontSize: '1rem',
    },
    marketIntel: {
        background: 'rgba(0, 0, 0, 0.1)',
        borderRadius: '16px',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    intelRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
    },
    price: {
        fontWeight: '700',
        color: 'var(--text-primary)',
    },
    totalLabel: {
        fontWeight: '700',
        color: 'var(--text-primary)',
    },
    totalValue: {
        fontSize: '1.1rem',
        fontWeight: '800',
        color: 'var(--primary-color)',
    },
    submitBtn: {
        padding: '1rem',
        borderRadius: '12px',
        border: 'none',
        background: 'var(--accent-gradient)',
        color: 'white',
        fontWeight: '800',
        cursor: 'pointer',
        boxShadow: '0 8px 16px -4px rgba(79, 70, 229, 0.4)',
        transition: 'var(--transition)',
    },
    notification: {
        padding: '0.75rem',
        borderRadius: '10px',
        fontSize: '0.85rem',
        textAlign: 'center',
    },
    successNotif: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        color: 'var(--success-color)',
        border: '1px solid var(--success-color)',
    },
    errorNotif: {
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        color: 'var(--danger-color)',
        border: '1px solid var(--danger-color)',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    modalContent: {
        background: 'var(--bg-secondary)',
        padding: '2rem',
        borderRadius: '24px',
        width: '90%',
        maxWidth: '400px',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-lg)',
    },
    modalTitle: {
        margin: '0 0 1rem 0',
        color: 'var(--text-primary)',
        fontSize: '1.25rem',
    },
    modalText: {
        color: 'var(--text-secondary)',
        lineHeight: '1.5',
        marginBottom: '1.5rem',
    },
    modalActions: {
        display: 'flex',
        gap: '1rem',
    },
    cancelBtn: {
        flex: 1,
        padding: '1rem',
        borderRadius: '12px',
        border: '1px solid var(--glass-border)',
        backgroundColor: 'transparent',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        fontWeight: '700',
    },
    confirmBtn: {
        flex: 1,
        padding: '1rem',
        borderRadius: '12px',
        border: 'none',
        background: 'var(--accent-gradient)',
        color: 'white',
        fontWeight: '700',
        cursor: 'pointer',
    }
};

export default TradingPanel;
