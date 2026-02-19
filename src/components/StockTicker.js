import React from 'react';

const StockTicker = ({ stocks }) => {
    // Duplicate stocks to ensure seamless loop if list is short
    const displayStocks = stocks.length > 0 ? [...stocks, ...stocks] : [];

    return (
        <div className="stock-ticker-container">
            <div className="stock-ticker-wrapper">
                {displayStocks.map((stock, index) => {
                    const change = stock.currentPrice - stock.buyPrice; // Simplified change calculation
                    const isUp = change >= 0;

                    return (
                        <div key={`${stock.symbol}-${index}`} className="ticker-item">
                            <span className="ticker-symbol">{stock.symbol}</span>
                            <span className="ticker-price">${stock.currentPrice.toFixed(2)}</span>
                            <span className={`ticker-change ${isUp ? 'up' : 'down'}`}>
                                {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StockTicker;
