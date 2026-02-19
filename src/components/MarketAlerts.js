import React from 'react';

const MarketAlerts = ({ alerts, onDismiss }) => {
    if (!alerts || alerts.length === 0) return null;

    return (
        <div className="market-alerts-container">
            {alerts.map((alert) => (
                <div key={alert.id} className={`alert-card ${alert.type}`}>
                    <div className="alert-icon">
                        {alert.type === 'positive' ? '🚀' : '⚠️'}
                    </div>
                    <div className="alert-content">
                        <h4>{alert.title}</h4>
                        <p>{alert.message}</p>
                    </div>
                    <button className="alert-close" onClick={() => onDismiss(alert.id)}>×</button>
                </div>
            ))}
        </div>
    );
};

export default MarketAlerts;
