import React, { useState } from 'react';

const Profile = () => {
    // const accountNumber = localStorage.getItem('accountNumber') || 'N/A';
    const accountNumber =  'N/A';

    // Initialize user data from localStorage or defaults
    const [userData, setUserData] = useState(() => {
        const savedData = localStorage.getItem('profileData');
        return savedData ? JSON.parse(savedData) : {
            name: 'Active User',
            email: 'user@fintech.com',
            phone: '+1 (555) 012-3456',
            memberSince: 'August 2024'
        };
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(userData);

    const handleEdit = () => {
        setEditData(userData);
        setIsEditing(true);
    };

    const handleSave = () => {
        setUserData(editData);
        localStorage.setItem('profileData', JSON.stringify(editData));
        setIsEditing(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleDownload = () => {
        const dataToDownload = {
            profile: { ...userData, accountNumber },
            exportedAt: new Date().toISOString(),
            app: 'Fintech Banking'
        };
        const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fintech_profile_${accountNumber}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>User Profile</h1>
                <p style={styles.subtitle}>Your Fintech identity and account details</p>
            </header>

            <div style={styles.content}>
                <div style={styles.profileHeader}>
                    <div style={styles.avatarLarge}>
                        <div style={styles.avatarInner} />
                    </div>
                    <div style={styles.profileInfo}>
                        {isEditing ? (
                            <input
                                name="name"
                                value={editData.name}
                                onChange={handleChange}
                                style={styles.inputInline}
                                placeholder="Full Name"
                            />
                        ) : (
                            <h2 style={styles.userName}>{userData.name}</h2>
                        )}
                        <p style={styles.userRole}>Premium Member</p>
                    </div>
                </div>

                <div style={styles.detailsGrid}>
                    <div style={styles.infoCard}>
                        <label style={styles.infoLabel}>Account Number</label>
                        <p style={styles.infoValue}>{accountNumber}</p>
                    </div>
                    <div style={styles.infoCard}>
                        <label style={styles.infoLabel}>Email</label>
                        {isEditing ? (
                            <input
                                name="email"
                                value={editData.email}
                                onChange={handleChange}
                                style={styles.inputField}
                                placeholder="Email"
                            />
                        ) : (
                            <p style={styles.infoValue}>{userData.email}</p>
                        )}
                    </div>
                    <div style={styles.infoCard}>
                        <label style={styles.infoLabel}>Phone</label>
                        {isEditing ? (
                            <input
                                name="phone"
                                value={editData.phone}
                                onChange={handleChange}
                                style={styles.inputField}
                                placeholder="Phone"
                            />
                        ) : (
                            <p style={styles.infoValue}>{userData.phone}</p>
                        )}
                    </div>
                    <div style={styles.infoCard}>
                        <label style={styles.infoLabel}>Member Since</label>
                        <p style={styles.infoValue}>{userData.memberSince}</p>
                    </div>
                </div>

                <div style={styles.actions}>
                    {isEditing ? (
                        <>
                            <button onClick={handleSave} style={styles.editBtn}>Save Changes</button>
                            <button onClick={() => setIsEditing(false)} style={styles.secondaryBtn}>Cancel</button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleEdit} style={styles.editBtn}>Edit Profile</button>
                            <button onClick={handleDownload} style={styles.secondaryBtn}>Download Data</button>
                        </>
                    )}
                </div>
            </div>
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
        background: 'linear-gradient(135deg, #4f46e5 0%, #c126d3 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: { color: 'var(--text-muted)', fontSize: '1rem' },
    content: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '24px',
        padding: '3rem',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-lg)',
        maxWidth: '900px',
    },
    profileHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        marginBottom: '3rem',
        paddingBottom: '2rem',
        borderBottom: '1px solid var(--glass-border)',
    },
    avatarLarge: {
        width: '100px',
        height: '100px',
        borderRadius: '24px',
        backgroundColor: 'var(--bg-tertiary)',
        padding: '4px',
        border: '1px solid var(--glass-border)',
    },
    avatarInner: {
        width: '100%',
        height: '100%',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #4f46e5 0%, #c026d3 100%)',
    },
    userName: { fontSize: '1.75rem', fontWeight: '800', margin: '0 0 0.25rem 0' },
    userRole: { color: 'var(--primary-color)', fontWeight: '700', margin: 0, fontSize: '0.9rem' },
    detailsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem',
    },
    infoCard: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    infoLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' },
    infoValue: { fontSize: '1.1rem', fontWeight: '600', margin: 0 },
    actions: {
        display: 'flex',
        gap: '1rem',
    },
    editBtn: {
        padding: '0.75rem 2rem',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: 'var(--primary-color)',
        color: '#ffffff',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'var(--transition)',
    },
    secondaryBtn: {
        padding: '0.75rem 2rem',
        borderRadius: '12px',
        border: '1px solid var(--glass-border)',
        backgroundColor: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'var(--transition)',
    },
    inputInline: {
        fontSize: '1.75rem',
        fontWeight: '800',
        backgroundColor: 'transparent',
        border: 'none',
        borderBottom: '2px solid var(--primary-color)',
        color: 'var(--text-primary)',
        outline: 'none',
        width: '100%',
        marginBottom: '0.25rem',
    },
    inputField: {
        fontSize: '1.1rem',
        fontWeight: '600',
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        padding: '0.5rem',
        color: 'var(--text-primary)',
        outline: 'none',
        width: '100%',
    },
};

export default Profile;
