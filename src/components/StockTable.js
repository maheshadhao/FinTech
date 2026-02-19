import React from 'react';

const StockTable = ({ stocks }) => {
    return (
        <div style={{
            background: 'var(--bg-secondary)',
            backdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-lg)',
            overflowX: 'auto'
        }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: '600' }}>Holdings</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                        <th style={{ padding: '1rem' }}>Symbol</th>
                        <th style={{ padding: '1rem' }}>Qty</th>
                        <th style={{ padding: '1rem' }}>Purchase Date</th>
                        <th style={{ padding: '1rem' }}>Days Held</th>
                        <th style={{ padding: '1rem' }}>Buy Price</th>
                        <th style={{ padding: '1rem' }}>Current Price</th>
                        <th style={{ padding: '1rem' }}>Value</th>
                        <th style={{ padding: '1rem' }}>P/L</th>
                    </tr>
                </thead>
                <tbody>
                    {stocks.map((stock) => {
                        const currentValue = stock.quantity * stock.currentPrice;
                        const investment = stock.quantity * stock.buyPrice;
                        const profitLoss = currentValue - investment;
                        const isProfit = profitLoss >= 0;
                        const isLongTerm = stock.daysHeld > 365;

                        return (
                            <tr key={stock.symbol} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '1rem', fontWeight: '500' }}>
                                    {stock.symbol}
                                    {isLongTerm && (
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            fontSize: '0.7rem',
                                            padding: '0.2rem 0.4rem',
                                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                            color: '#10b981',
                                            borderRadius: '4px'
                                        }}>
                                            L-Term
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: '1rem' }}>{stock.quantity}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    {stock.purchaseDate ? stock.purchaseDate.toLocaleDateString() : '-'}
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                    {stock.daysHeld || 0}
                                </td>
                                <td style={{ padding: '1rem' }}>${stock.buyPrice.toFixed(2)}</td>
                                <td style={{ padding: '1rem' }}>${stock.currentPrice.toFixed(2)}</td>
                                <td style={{ padding: '1rem' }}>${currentValue.toFixed(2)}</td>
                                <td style={{
                                    padding: '1rem',
                                    color: isProfit ? 'var(--success-color)' : 'var(--danger-color)',
                                    fontWeight: '600'
                                }}>
                                    {isProfit ? '+' : ''}{profitLoss.toFixed(2)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default StockTable;
