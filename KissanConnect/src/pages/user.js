import React from "react";

function User() {
    return (
        <div style={{
            minHeight: 'calc(100vh - 6rem)',
            background: '#c6e2c6',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem'
        }}>
            <div style={{
                background: '#f0fff0',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center'
            }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#2f4f2f',
                    marginBottom: '1.5rem'
                }}>
                    User Info
                </h1>
                <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '500',
                    color: '#4a704a',
                    margin: '0.75rem 0',
                    background: '#e8f5e8',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    Balance: {localStorage.getItem("balance") || '0'} SOL
                </h2>
                <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '500',
                    color: '#4a704a',
                    margin: '0.75rem 0',
                    background: '#e8f5e8',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    wordBreak: 'break-all'
                }}>
                    Address: {localStorage.getItem("address") || 'N/A'}
                </h2>
            </div>
        </div>
    );
}

export default User;