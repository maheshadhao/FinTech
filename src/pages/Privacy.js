import React, { useState } from 'react';

const Privacy = () => {
    const [activeSection, setActiveSection] = useState(null);

    const toggleSection = (index) => {
        setActiveSection(activeSection === index ? null : index);
    };

    const sections = [
        {
            title: "1. Data Collection & Usage",
            icon: "📊",
            content: "We collect personal and financial data necessary to provide our banking and trading services. This includes government-issued identification (e.g., Aadhaar, PAN), account numbers, transaction history, and trading activity. Your information is used to execute trades, process transactions, and comply with KYC/AML regulations."
        },
        {
            title: "2. Security Measures",
            icon: "🔒",
            content: "We employ defense-in-depth security including 256-bit AES encryption, multi-factor authentication (MFA), and real-time fraud monitoring. All sensitive financial data is stored in secure, access-controlled environments compliant with global banking standards."
        },
        {
            title: "3. Trading & Market Data",
            icon: "📈",
            content: "Your trading patterns, portfolio holdings, and order history are securely stored to facilitate trade execution and provide performance analytics. We do not sell your personal trading strategies or portfolio data to third-party hedge funds or advertisers."
        },
        {
            title: "4. Third-Party Sharing",
            icon: "🤝",
            content: "We only share data with essential partners: regulatory bodies (SEBI, RBI) for legal compliance, clearing corporations for trade settlement, and payment gateways. We adhere to strict data-sharing protocols and never sell your personal information."
        },
        {
            title: "5. AI Assistant Privacy",
            icon: "🤖",
            content: "Our AI Assistant (powered by Gemini) processes your queries to provide real-time financial insights. It is designed with privacy-first principles: it does not retain personal banking data for model training and all interactions are anonymized."
        },
        {
            title: "6. Your Rights & Control",
            icon: "🛡️",
            content: "You retain full control over your data. You can request a copy of your transaction history, correct personal details, or request account deactivation. To exercise these rights, navigate to Settings > Privacy Controls."
        }
    ];

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Privacy Policy</h1>
                <p style={styles.subtitle}>Commitment to your financial security and data privacy.</p>
                <div style={styles.badge}>Last updated: February 2026</div>
            </header>

            <div style={styles.grid}>
                {sections.map((section, index) => (
                    <div
                        key={index}
                        style={{
                            ...styles.card,
                            ...(activeSection === index ? styles.activeCard : {})
                        }}
                        onClick={() => toggleSection(index)}
                    >
                        <div style={styles.cardHeader}>
                            <span style={styles.icon}>{section.icon}</span>
                            <h3 style={styles.cardTitle}>{section.title}</h3>
                            <span style={styles.arrow}>{activeSection === index ? '−' : '+'}</span>
                        </div>
                        {activeSection === index && (
                            <div style={styles.cardContent}>
                                <p style={styles.text}>{section.content}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <footer style={styles.footer}>
                <p>Questions about our policy? <a href="/support" style={styles.link}>Contact our Data Protection Officer</a></p>
            </footer>
        </div>
    );
};

const styles = {
    container: {
        padding: '3rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '100vh',
        color: 'var(--text-primary)',
        animation: 'fadeIn 0.5s ease-out',
    },
    header: {
        textAlign: 'center',
        marginBottom: '4rem',
    },
    title: {
        fontSize: '3rem',
        fontWeight: '800',
        marginBottom: '1rem',
        background: 'linear-gradient(to right, #60a5fa, #c084fc)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        color: 'var(--text-secondary)',
        fontSize: '1.2rem',
        marginBottom: '1.5rem',
    },
    badge: {
        display: 'inline-block',
        padding: '0.4rem 1rem',
        background: 'rgba(99, 102, 241, 0.1)',
        color: '#818cf8',
        borderRadius: '20px',
        fontSize: '0.9rem',
        fontWeight: '600',
        border: '1px solid rgba(99, 102, 241, 0.2)',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2rem',
        marginBottom: '4rem',
    },
    card: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid var(--glass-border)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    activeCard: {
        borderColor: '#818cf8',
        boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.2), 0 4px 6px -2px rgba(99, 102, 241, 0.1)',
        transform: 'translateY(-2px)',
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
    },
    icon: {
        fontSize: '1.5rem',
        padding: '0.75rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
    },
    cardTitle: {
        fontSize: '1.25rem',
        fontWeight: '700',
        color: 'var(--text-primary)',
        flex: 1,
    },
    arrow: {
        fontSize: '1.5rem',
        color: 'var(--text-muted)',
        fontWeight: '300',
    },
    cardContent: {
        marginTop: '1.25rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid var(--glass-border)',
        animation: 'slideDown 0.3s ease-out',
    },
    text: {
        lineHeight: '1.7',
        color: 'var(--text-secondary)',
        fontSize: '0.95rem',
    },
    footer: {
        textAlign: 'center',
        color: 'var(--text-muted)',
        paddingTop: '2rem',
        borderTop: '1px solid var(--glass-border)',
    },
    link: {
        color: '#818cf8',
        textDecoration: 'none',
        fontWeight: '600',
    },
};

export default Privacy;
