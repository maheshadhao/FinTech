import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage, getLedger, createQuickAccount } from '../services/api';
import { useActions } from '../context/ActionContext';

const ChatBox = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hello! I'm your Financo AI assistant. How can I help you today?", isAi: true }
    ]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef(null);
    // const accountId = localStorage.getItem('accountNumber') || 'anonymous';


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen, isThinking]);

    const { triggerAction } = useActions();

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isThinking) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { text: userMsg, isAi: false }]);
        setInput('');

        // --- INTENT DETECTION ---
        const ledgerKeywords = ["transaction", "history", "ledger", "activity"];
        const hasLedgerIntent = ledgerKeywords.some(keyword => userMsg.toLowerCase().includes(keyword));

        if (hasLedgerIntent) {
            setIsThinking(true);
            try {
                const data = await getLedger();
                const ledgerData = Array.isArray(data) ? data : (data.data || []);
                const sortedData = [...ledgerData].sort((a, b) =>
                    new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)
                );
                setMessages(prev => [...prev, {
                    text: "Here is your full transaction activity:",
                    isAi: true,
                    type: 'ledger',
                    data: sortedData
                }]);
                setIsThinking(false);
                return; // Skip AI fallback
            } catch (err) {
                console.error("Ledger intent failed:", err);
                // Fallback to AI if API fails, or show error
            } finally {
                setIsThinking(false);
            }
        }
        // --- ACCOUNT CREATION INTENT ---
        const accountKeywords = ["create account", "open account", "new account", "signup", "register"];
        const hasAccountIntent = accountKeywords.some(keyword => userMsg.toLowerCase().includes(keyword));

        if (hasAccountIntent) {
            setIsThinking(true);
            try {
                const res = await createQuickAccount();
                if (res.status === 'success' || res.accountNumber) {
                    setMessages(prev => [...prev, {
                        text: "Success! Your new Financo account has been created.",
                        isAi: true,
                        type: 'account_created',
                        data: { accountNumber: res.accountNumber }
                    }]);
                } else {
                    setMessages(prev => [...prev, {
                        text: res.message || "I couldn't create your account at this moment. Please try again later.",
                        isAi: true
                    }]);
                }
                setIsThinking(false);
                return;
            } catch (err) {
                console.error("Account creation intent failed:", err);
                setMessages(prev => [...prev, {
                    text: "Sorry, I encountered an error while trying to create your account.",
                    isAi: true
                }]);
            } finally {
                setIsThinking(false);
            }
        }
        // --------------------------------

        setIsThinking(true);

        try {
            // const response = await sendChatMessage(userMsg, accountId);
            // setMessages(prev => [...prev, { text: response.response, isAi: true }]);
            const response = await sendChatMessage(userMsg);

            // --- ACTION PARSING ---
            // Pattern: [ACTION:TYPE:{json_payload}]
            const actionRegex = /\[ACTION:(\w+):({.*?})\]/;
            const match = response.match(actionRegex);

            let cleanResponse = response;
            if (match) {
                const actionType = match[1];
                try {
                    const payload = JSON.parse(match[2]);
                    triggerAction(actionType, payload);
                    // Remove the action tag from the displayed bubble for a cleaner look
                    cleanResponse = response.replace(actionRegex, '').trim();
                } catch (parseErr) {
                    console.error('Failed to parse AI action payload:', parseErr);
                }
            }
            // ----------------------

            setMessages(prev => [...prev, { text: cleanResponse, isAi: true }]);
        } catch (error) {
            const status = error.response?.status;
            console.log('ChatBox Error:', error.message, status);

            let message = "Sorry, I'm having trouble connecting to the AI service. Please try again later.";
            if (status === 401) {
                message = "You need to be logged in to access banking features. Please log into your Financo account.";
            } else if (status === 404) {
                message = "AI service endpoint not found on server.";
            }

            setMessages(prev => [...prev, { text: message, isAi: true }]);
        } finally {
            setIsThinking(false);
        }
    };

    if (!isOpen) {
        return (
            <div style={styles.bubble} onClick={() => setIsOpen(true)} className="no-print">
                <span style={styles.bubbleIcon}>💬</span>
            </div>
        );
    }

    return (
        <div style={styles.chatWindow} className="no-print">
            <div style={styles.header}>
                <div style={styles.headerInfo}>
                    <div style={styles.aiStatus} />
                    <span style={styles.headerTitle}>Fintech AI Assistant</span>
                </div>
                <button style={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
            </div>

            <div style={styles.messagesArea}>
                {messages.map((m, i) => (
                    <div key={i} style={m.isAi ? styles.aiMsgContainer : styles.userMsgContainer}>
                        <div style={m.isAi ? styles.aiMsg : styles.userMsg}>
                            {m.text}
                            {m.type === 'ledger' && m.data && (
                                <div style={styles.ledgerTableContainer}>
                                    <table style={styles.miniTable}>
                                        <thead>
                                            <tr>
                                                <th style={styles.miniTh}>Date</th>
                                                <th style={styles.miniTh}>Type</th>
                                                <th style={styles.miniThRight}>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {m.data.map((txn, idx) => (
                                                <tr key={idx} style={styles.miniTr}>
                                                    <td style={styles.miniTd}>{new Date(txn.timestamp || txn.date).toLocaleDateString()}</td>
                                                    <td style={styles.miniTd}>{txn.type}</td>
                                                    <td style={{ ...styles.miniTdRight, color: txn.type === 'DEPOSIT' ? '#10b981' : '#f43f5e' }}>
                                                        {txn.amount.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {m.type === 'account_created' && m.data && (
                                <div style={styles.accountSuccessCard}>
                                    <div style={styles.successBadge}>NEW ACCOUNT</div>
                                    <div style={styles.miniAccountNumber}>{m.data.accountNumber}</div>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>
                                        Use this account number to login.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isThinking && (
                    <div style={styles.aiMsgContainer}>
                        <div style={{ ...styles.aiMsg, display: 'flex', gap: '4px' }}>
                            <div className="dot-pulse" style={styles.dot} />
                            <div className="dot-pulse" style={{ ...styles.dot, animationDelay: '0.2s' }} />
                            <div className="dot-pulse" style={{ ...styles.dot, animationDelay: '0.4s' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={styles.inputArea}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    style={styles.input}
                />
                <button type="submit" style={styles.sendBtn} disabled={isThinking}>
                    <span style={{ fontSize: '1.2rem' }}>✈️</span>
                </button>
            </form>

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: translateY(0); opacity: 0.5; }
                    50% { transform: translateY(-3px); opacity: 1; }
                }
                .dot-pulse {
                    width: 6px;
                    height: 6px;
                    background: var(--text-muted);
                    border-radius: 50%;
                    animation: pulse 1s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

const styles = {
    bubble: {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '60px',
        height: '60px',
        backgroundColor: 'var(--primary-color)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 10px 25px rgba(79, 70, 229, 0.4)',
        zIndex: 2000,
        transition: 'var(--transition)',
    },
    bubbleIcon: { fontSize: '1.5rem', userSelect: 'none' },
    chatWindow: {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '380px',
        height: '500px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--glass-border)',
        zIndex: 2001,
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease-out',
        transition: 'var(--transition)',
    },
    header: {
        background: 'linear-gradient(135deg, #4f46e5 0%, #c026d3 100%)',
        padding: '1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#ffffff',
    },
    headerInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
    aiStatus: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' },
    headerTitle: { fontWeight: '700', fontSize: '1rem' },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: '#ffffff',
        fontSize: '1.5rem',
        cursor: 'pointer',
        padding: '0 5px',
        opacity: 0.8,
    },
    messagesArea: {
        flex: 1,
        padding: '1.25rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    aiMsgContainer: { display: 'flex', justifyContent: 'flex-start' },
    userMsgContainer: { display: 'flex', justifyContent: 'flex-end' },
    aiMsg: {
        maxWidth: '80%',
        backgroundColor: 'var(--bg-tertiary)',
        padding: '0.75rem 1rem',
        borderRadius: '16px 16px 16px 4px',
        fontSize: '0.9rem',
        color: 'var(--text-primary)',
        border: '1px solid var(--glass-border)',
        lineHeight: '1.5',
    },
    userMsg: {
        maxWidth: '80%',
        backgroundColor: 'var(--primary-color)',
        padding: '0.75rem 1rem',
        borderRadius: '16px 16px 4px 16px',
        fontSize: '0.9rem',
        color: '#ffffff',
        lineHeight: '1.5',
    },
    dot: { width: '6px', height: '6px' },
    inputArea: {
        padding: '1.25rem',
        display: 'flex',
        gap: '10px',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--glass-border)',
    },
    input: {
        flex: 1,
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '0.6rem 1rem',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        outline: 'none',
    },
    sendBtn: {
        backgroundColor: 'var(--primary-color)',
        border: 'none',
        borderRadius: '12px',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#ffffff',
        transition: 'var(--transition)',
    },
    ledgerTableContainer: {
        marginTop: '10px',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--glass-border)',
        backgroundColor: 'rgba(0,0,0,0.1)',
        maxHeight: '250px',
        overflowY: 'auto',
    },
    miniTable: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.75rem',
    },
    miniTh: {
        textAlign: 'left',
        padding: '6px 8px',
        color: 'var(--text-muted)',
        borderBottom: '1px solid var(--glass-border)',
        fontWeight: '700',
    },
    miniThRight: {
        textAlign: 'right',
        padding: '6px 8px',
        color: 'var(--text-muted)',
        borderBottom: '1px solid var(--glass-border)',
        fontWeight: '700',
    },
    miniTr: {
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    miniTd: {
        padding: '6px 8px',
        color: 'var(--text-secondary)',
    },
    miniTdRight: {
        padding: '6px 8px',
        textAlign: 'right',
        fontWeight: '700',
    },
    accountSuccessCard: {
        marginTop: '12px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1rem',
        textAlign: 'center',
    },
    successBadge: {
        fontSize: '0.65rem',
        fontWeight: '800',
        color: '#10b981',
        letterSpacing: '0.1em',
        marginBottom: '8px',
    },
    miniAccountNumber: {
        fontSize: '1.5rem',
        fontWeight: '900',
        color: '#ffffff',
        fontFamily: 'monospace',
        letterSpacing: '0.1em',
    }
};

export default ChatBox;
