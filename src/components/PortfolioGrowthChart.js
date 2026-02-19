import React, { useEffect, useState } from "react";
import { getPortfolioHistory } from "../services/api";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer
} from "recharts";

const PortfolioGrowthChart = ({ timeFilter = '12m' }) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        // Map frontend filter logic to backend range
        let range = '12m';
        if (timeFilter === '7D') range = '7d';
        if (timeFilter === '30D') range = '30d';

        getPortfolioHistory(range)
            .then(data => setData(data))
            .catch(err => console.error("Failed to fetch chart data", err));
    }, [timeFilter]);

    const chartContainerStyle = {
        background: 'var(--bg-secondary)',
        backdropFilter: 'blur(12px)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.5rem',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-lg)',
        height: '350px',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '1.5rem'
    };

    const titleStyle = {
        marginBottom: '1rem',
        fontSize: '1rem',
        fontWeight: '600',
        color: 'var(--text-secondary)'
    };

    return (
        <div style={chartContainerStyle}>
            <h3 style={titleStyle}>Portfolio Growth</h3>

            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#4CAF50"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#4CAF50' }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PortfolioGrowthChart;
