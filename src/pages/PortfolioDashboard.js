import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchStocks } from '../services/stockApi';
import { getBalance, getPortfolio } from '../services/api';
import StockTable from '../components/StockTable';
import StockCharts from '../components/StockCharts';
import StockTicker from '../components/StockTicker';
import MarketAlerts from '../components/MarketAlerts';
import TradingPanel from '../components/TradingPanel';
import PortfolioGrowthChart from '../components/PortfolioGrowthChart';

const PortfolioDashboard = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [latency, setLatency] = useState(0);
    const [history, setHistory] = useState([]); // Stores {time, value}
    const [latencyHistory, setLatencyHistory] = useState([]); // Stores {time, latency}
    const [lastUpdated, setLastUpdated] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [timeFilter, setTimeFilter] = useState('1Y'); // 7D, 30D, 1Y
    const [investmentFilter, setInvestmentFilter] = useState('ALL'); // ALL, LONG_TERM, SHORT_TERM
    const [userBalance, setUserBalance] = useState(0);
    const accountNumber = localStorage.getItem('accountNumber');

    const fetchUserBalance = useCallback(async () => {
        if (!accountNumber) return;
        try {
            // UPI PIN is not strictly required for balance display in this context if we had a non-secure endpoint,
            // but the existing getBalance service requires it. Using a dummy or stored pin for now if available.
            // In a real app, we'd have a separate endpoint for this dashboard view.
            const data = await getBalance(accountNumber, '1234');
            setUserBalance(data.balance || 0);
        } catch (err) {
            console.error("Failed to fetch balance:", err);
            // Mock balance for demo if API fails
            setUserBalance(25000);
        }
    }, [accountNumber]);

    // Mock history generator based on filter
    const getFilteredHistory = (fullHistory, filter) => {
        // In a real app, this would filter based on timestamps or fetch different API endpoints
        // Here we simulate by slicing or decimating the array if it were large enough
        // allowing the graph to "zoom" in/out visually
        if (filter === '7D') return fullHistory.slice(-10);
        if (filter === '30D') return fullHistory.slice(-50);
        return fullHistory; // 1Y
    };

    const hasAlertFor = useCallback((symbol, type) => {
        return alerts.some(a => a.title.includes(symbol) && a.type === type);
    }, [alerts]);

    const addAlert = useCallback((newAlert) => {
        setAlerts(prev => {
            // Keep recent 3 alerts max to avoid clutter
            const updated = [...prev, newAlert];
            return updated.length > 3 ? updated.slice(1) : updated;
        });
    }, []);

    const checkForAlerts = useCallback((currentStocks) => {
        // Simple logic: random alert simulation or check if a stock moved > 2% from buy price (mock logic)
        // In real world, we'd compare against previous fetch
        currentStocks.forEach(stock => {
            const changePercent = ((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100;
            if (changePercent > 10 && !hasAlertFor(stock.symbol, 'positive')) {
                addAlert({
                    id: Date.now() + Math.random(),
                    type: 'positive',
                    title: `${stock.symbol} Soaring! 🚀`,
                    message: `${stock.symbol} is up by ${changePercent.toFixed(1)}%`
                });
            } else if (changePercent < -10 && !hasAlertFor(stock.symbol, 'negative')) {
                addAlert({
                    id: Date.now() + Math.random(),
                    type: 'negative',
                    title: `${stock.symbol} Dropping 📉`,
                    message: `${stock.symbol} is down by ${Math.abs(changePercent).toFixed(1)}%`
                });
            }
        });
    }, [hasAlertFor, addAlert]);

    const removeAlert = useCallback((id) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    }, []);

    // Helper to mock purchase date based on symbol (deterministic for demo)
    const getMockPurchaseDate = (symbol) => {
        const now = new Date();
        const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        // Random days between 10 and 800 days ago
        const daysAgo = (hash * 13) % 800 + 10;
        const purchaseDate = new Date(now);
        purchaseDate.setDate(now.getDate() - daysAgo);
        return purchaseDate;
    };

    const calculateDaysHeld = (purchaseDate) => {
        const now = new Date();
        const diffTime = Math.abs(now - purchaseDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const loadData = useCallback(async () => {
        const start = performance.now();
        try {
            // Parallel fetch: Market Data + User Portfolio + User Balance
            const [stocksData, portfolioData] = await Promise.all([
                fetchStocks(),
                getPortfolio().catch(err => ({ holdings: [] })) // Handle portfolio error gracefully
            ]);

            fetchUserBalance(); // Fetch balance separately or include above if needed

            const end = performance.now();
            const requestLatency = Math.round(end - start);

            setLatency(requestLatency);

            // Merge Real Portfolio Holdings into Market Data
            // We want to show ALL stocks, but with correct user quantities
            const realHoldings = portfolioData.holdings || [];

            const mergedStocks = stocksData.map(stock => {
                const holding = realHoldings.find(h => h.stockSymbol === stock.symbol);
                const quantity = holding ? holding.quantity : 0;

                // Mock purchase date and days held for demonstration
                const purchaseDate = getMockPurchaseDate(stock.symbol);
                const daysHeld = calculateDaysHeld(purchaseDate);

                return {
                    ...stock,
                    // Use backend quantity if found, else 0. 
                    // This resolves "Holding not found" mock data mismatch.
                    quantity: quantity,
                    purchaseDate: purchaseDate,
                    daysHeld: daysHeld
                };
            });

            setStocks(mergedStocks);
            setLastUpdated(new Date());

            const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            // Update Latency History
            setLatencyHistory(prev => {
                const newPoint = { time: timeLabel, latency: requestLatency };
                const newHist = [...prev, newPoint];
                return newHist.length > 50 ? newHist.slice(-50) : newHist;
            });

            // Update Portfolio Value History
            const totalValue = mergedStocks.reduce((acc, stock) => acc + (stock.quantity * stock.currentPrice), 0);
            setHistory(prev => {
                const newPoint = { time: timeLabel, value: totalValue };
                const newHist = [...prev, newPoint];
                return newHist.length > 50 ? newHist.slice(-50) : newHist;
            });

            // Check for Alerts
            checkForAlerts(mergedStocks);

        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setLoading(false);
        }
    }, [checkForAlerts, fetchUserBalance]);

    useEffect(() => {
        loadData(); // Initial load
        const intervalId = setInterval(loadData, 5000); // Polling
        return () => clearInterval(intervalId);
    }, [loadData]);

    // Memoize summary calculations
    const summary = useMemo(() => {
        if (!stocks.length) return null;
        const totalValue = stocks.reduce((acc, s) => acc + (s.quantity * s.currentPrice), 0);
        const totalInvestment = stocks.reduce((acc, s) => acc + (s.quantity * s.buyPrice), 0);
        const totalPL = totalValue - totalInvestment;
        const totalPLPercent = (totalPL / totalInvestment) * 100;

        const sortedStocks = [...stocks].sort((a, b) => {
            const plA = (a.currentPrice - a.buyPrice) / a.buyPrice;
            const plB = (b.currentPrice - b.buyPrice) / b.buyPrice;
            return plB - plA;
        });
        const bestStock = sortedStocks[0];
        const worstStock = sortedStocks[sortedStocks.length - 1];

        return { totalValue, totalPL, totalPLPercent, bestStock, worstStock };
    }, [stocks]);

    const filteredHistoryData = getFilteredHistory(history, timeFilter);

    // Filter stocks based on Investment Type
    const displayStocks = useMemo(() => {
        if (investmentFilter === 'ALL') return stocks;
        if (investmentFilter === 'LONG_TERM') return stocks.filter(s => s.daysHeld > 365);
        if (investmentFilter === 'SHORT_TERM') return stocks.filter(s => s.daysHeld <= 365);
        return stocks;
    }, [stocks, investmentFilter]);

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <StockTicker stocks={stocks} />

            <div className="portfolio-dashboard" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 className="premium-title">Portfolio Dashboard</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>Real-time stock performance and allocation</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                            <div className="investment-filter" style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '0.2rem', border: '1px solid var(--glass-border)' }}>
                                {['ALL', 'LONG_TERM', 'SHORT_TERM'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setInvestmentFilter(filter)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: investmentFilter === filter ? 'var(--primary-color)' : 'transparent',
                                            color: investmentFilter === filter ? '#ffffff' : 'var(--text-muted)',
                                            fontWeight: investmentFilter === filter ? 'bold' : 'normal',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        {filter.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>

                            <div className="time-filter">
                                {['7D', '30D', '1Y'].map(filter => (
                                    <button
                                        key={filter}
                                        className={`filter-btn ${timeFilter === filter ? 'active' : ''}`}
                                        onClick={() => setTimeFilter(filter)}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Last Update: {lastUpdated ? lastUpdated.toLocaleTimeString() : '...'}
                        </div>
                    </div>
                </header>

                {summary && (
                    <div className="dashboard-grid">
                        <div className="summary-card premium-card">
                            <span className="summary-label">Total Portfolio Value</span>
                            <span className="summary-value">${summary.totalValue.toFixed(2)}</span>
                            <span className="summary-subtext">
                                <span className={summary.totalPL >= 0 ? 'trend-up' : 'trend-down'}>
                                    {summary.totalPL >= 0 ? '+' : ''}{summary.totalPL.toFixed(2)} ({summary.totalPLPercent.toFixed(2)}%)
                                </span>
                                &nbsp;All Time
                            </span>
                        </div>
                        <div className="summary-card premium-card">
                            <span className="summary-label">Top Performer</span>
                            <span className="summary-value">{summary.bestStock?.symbol}</span>
                            <span className="summary-subtext trend-up">
                                +{(((summary.bestStock.currentPrice - summary.bestStock.buyPrice) / summary.bestStock.buyPrice) * 100).toFixed(2)}%
                            </span>
                        </div>
                        <div className="summary-card premium-card">
                            <span className="summary-label">Worst Performer</span>
                            <span className="summary-value">{summary.worstStock?.symbol}</span>
                            <span className="summary-subtext trend-down">
                                {(((summary.worstStock.currentPrice - summary.worstStock.buyPrice) / summary.worstStock.buyPrice) * 100).toFixed(2)}%
                            </span>
                        </div>
                        <div className="summary-card premium-card">
                            <span className="summary-label">API Latency</span>
                            <span className="summary-value" style={{ color: latency > 300 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                                {latency}ms
                            </span>
                            <span className="summary-subtext">
                                {latency > 300 ? 'Poor Connection' : 'Optimal Connection'}
                            </span>
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem', alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {loading && stocks.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading Portfolio...</div>
                        ) : (
                            <>
                                <PortfolioGrowthChart timeFilter={timeFilter} />
                                <StockCharts stocks={displayStocks} history={filteredHistoryData} latencyData={latencyHistory} />
                                <StockTable stocks={displayStocks} />
                            </>
                        )}
                    </div>

                    <div style={{ position: 'sticky', top: '2rem' }}>
                        <TradingPanel
                            stocks={stocks} // Trading panel always accesses full list
                            userBalance={userBalance}
                            userPortfolio={stocks.map(s => ({ symbol: s.symbol, quantity: s.quantity }))}
                            onTradeSuccess={loadData}
                        />
                    </div>
                </div>

                <MarketAlerts alerts={alerts} onDismiss={removeAlert} />
            </div>
        </div>
    );
};

export default PortfolioDashboard;
