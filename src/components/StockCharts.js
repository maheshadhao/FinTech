import React from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const StockCharts = ({ stocks, history, latencyData }) => {
    // Prepare data for Pie Chart (Portfolio Allocation)
    const pieData = stocks.map(stock => ({
        name: stock.symbol,
        value: stock.quantity * stock.currentPrice
    }));

    // Prepare data for Bar Chart (Investment vs Current Value)
    const barData = stocks.map(stock => ({
        name: stock.symbol,
        Investment: stock.quantity * stock.buyPrice,
        Value: stock.quantity * stock.currentPrice,
        daysHeld: stock.daysHeld || 0
    }));

    // Style for chart containers
    const chartContainerStyle = {
        background: 'var(--bg-secondary)',
        backdropFilter: 'blur(12px)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.5rem',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-lg)',
        height: '350px',
        display: 'flex',
        flexDirection: 'column'
    };

    const titleStyle = {
        marginBottom: '1rem',
        fontSize: '1rem',
        fontWeight: '600',
        color: 'var(--text-secondary)'
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

            {/* Line Chart - Portfolio Trend (Mock History) */}
            <div style={chartContainerStyle}>
                <h3 style={titleStyle}>Portfolio Value Trend</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                        <XAxis dataKey="time" stroke="var(--text-muted)" />
                        <YAxis stroke="var(--text-muted)" />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                        />
                        <Line type="monotone" dataKey="value" stroke="var(--primary-color)" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Bar Chart - Investment vs Current */}
            <div style={chartContainerStyle}>
                <h3 style={titleStyle}>Investment Performance</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                        <XAxis dataKey="name" stroke="var(--text-muted)" />
                        <YAxis stroke="var(--text-muted)" />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                        />
                        <Legend />
                        <Bar dataKey="Investment" fill="var(--text-muted)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Value" radius={[4, 4, 0, 0]}>
                            {barData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.daysHeld > 365 ? '#10b981' : '#3b82f6'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Pie Chart - Allocation */}
            <div style={chartContainerStyle}>
                <h3 style={titleStyle}>Portfolio Allocation</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                            formatter={(value) => `$${value.toFixed(2)}`}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Latency Chart - API Performance */}
            <div style={chartContainerStyle}>
                <h3 style={titleStyle}>API Latency (ms)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={latencyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                        <XAxis dataKey="time" stroke="var(--text-muted)" />
                        <YAxis stroke="var(--text-muted)" />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                        />
                        <Area type="monotone" dataKey="latency" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
};

export default StockCharts;
