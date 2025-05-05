import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const inputBaseStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #e8f5e8',
    background: '#f0fff0',
    fontSize: '0.875rem',
    color: '#2f4f2f',
    transition: 'all 0.2s',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  };

  const buttonBaseStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    background: '#6b8e6b',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    width: '100%',
    textAlign: 'center'
  };

  const buttonHoverStyle = {
    background: '#558855',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
  };

  const socialLinks = [
    { name: 'Facebook', url: 'https://facebook.com', icon: '🌐' },
    { name: 'Twitter', url: 'https://twitter.com', icon: '🐦' },
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: '💼' },
    { name: 'Instagram', url: 'https://instagram.com', icon: '📸' }
  ];

  return (
    <div style={{ padding: '2rem', background: '#c6e2c6', minHeight: 'calc(100vh - 6rem)', color: '#2f4f2f' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem', textAlign: 'center' }}>Contact Us</h1>
      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <p style={{ fontSize: '1rem', lineHeight: '1.5', textAlign: 'center' }}>
          We’re here to assist you with any inquiries about Kissan Property Map. Feel free to reach out through our social platforms or use the form below to send us a message directly (we’ll get back to you soon!).
        </p>

        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputBaseStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={inputBaseStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              style={{ ...inputBaseStyle, height: '100px', resize: 'vertical' }}
            />
          </div>
          <button
            type="button"
            style={buttonBaseStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#558855')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#6b8e6b')}
          >
            Send Message
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Connect With Us</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#6b8e6b',
                  fontSize: '1.5rem',
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#558855')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6b8e6b')}
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;