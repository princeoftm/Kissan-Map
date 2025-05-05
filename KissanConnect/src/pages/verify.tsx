import React, { useState } from 'react';
import Web3 from 'web3';

const Verify = () => {
  const [formData, setFormData] = useState({
    owner: '',
    address: '',
    propertyType: '',
    floors: '',
    yearBuilt: '',
    squareFootage: '',
    secretKey: '',
    hash: ''
  });
  const [result, setResult] = useState<string | null>(null);
  const [inputFocus, setInputFocus] = useState<{ [key: string]: boolean }>({});
  const [buttonHover, setButtonHover] = useState<{ [key: string]: boolean }>({});

  const web3 = new Web3();

  const validateSecretKey = (key: string): boolean => {
    const regex = /^[a-zA-Z0-9@#$%^&*()_+\-=\[\]{}|;:,.<>?]{8,32}$/;
    return regex.test(key);
  };

  const computeHash = (): string => {
    const { owner, address, propertyType, floors, yearBuilt, squareFootage, secretKey } = formData;
    if (!validateSecretKey(secretKey)) {
      throw new Error("Invalid secret key. Must be 8–32 characters, alphanumeric or common special characters.");
    }
    const dataString = `${owner}|${address}|${propertyType}|${floors}|${yearBuilt}|${squareFootage}|${secretKey}`;
    const hash = web3.utils.sha3(dataString) || '';
    console.log('Computed Input String:', dataString);
    console.log('Computed Hash:', hash);
    return hash;
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const computedHash = computeHash();
      const providedHash = formData.hash.toLowerCase()
      console.log('Provided Hash (normalized):', providedHash);
      if (computedHash === providedHash) {
        setResult("No alterations have been made to the land info");
      } else {
        setResult("Land info has been changed");
      }
    } catch (error: any) {
      setResult(error.message || "Error verifying hash. Please check your input.");
    }
  };

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

  const inputFocusStyle = {
    borderColor: '#6b8e6b',
    boxShadow: '0 0 0 3px rgba(107, 142, 107, 0.3)'
  };

  const buttonBaseStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    background: '#6b8e6b',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '500' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    width: '100%',
    textAlign: 'center' as const
  };

  const buttonHoverStyle = {
    background: '#558855',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
  };

  return (
    <div style={{ padding: '2rem', background: '#c6e2c6', minHeight: 'calc(100vh - 6rem)', color: '#2f4f2f' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem', textAlign: 'center' }}>Verify Land Information</h1>
        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#2f4f2f', marginBottom: '0.25rem' }}>Owner Name</label>
            <input
              type="text"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              onFocus={() => setInputFocus(prev => ({ ...prev, owner: true }))}
              onBlur={() => setInputFocus(prev => ({ ...prev, owner: false }))}
              style={{ ...inputBaseStyle, ...(inputFocus.owner ? inputFocusStyle : {}) }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#2f4f2f', marginBottom: '0.25rem' }}>Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              onFocus={() => setInputFocus(prev => ({ ...prev, address: true }))}
              onBlur={() => setInputFocus(prev => ({ ...prev, address: false }))}
              style={{ ...inputBaseStyle, ...(inputFocus.address ? inputFocusStyle : {}) }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#2f4f2f', marginBottom: '0.25rem' }}>Property Type</label>
            <input
              type="text"
              value={formData.propertyType}
              onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
              onFocus={() => setInputFocus(prev => ({ ...prev, propertyType: true }))}
              onBlur={() => setInputFocus(prev => ({ ...prev, propertyType: false }))}
              style={{ ...inputBaseStyle, ...(inputFocus.propertyType ? inputFocusStyle : {}) }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#2f4f2f', marginBottom: '0.25rem' }}>Number of Floors</label>
            <input
              type="number"
              value={formData.floors}
              onChange={(e) => setFormData({ ...formData, floors: e.target.value })}
              onFocus={() => setInputFocus(prev => ({ ...prev, floors: true }))}
              onBlur={() => setInputFocus(prev => ({ ...prev, floors: false }))}
              style={{ ...inputBaseStyle, ...(inputFocus.floors ? inputFocusStyle : {}) }}
              min="0"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#2f4f2f', marginBottom: '0.25rem' }}>Year Built</label>
            <input
              type="number"
              value={formData.yearBuilt}
              onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
              onFocus={() => setInputFocus(prev => ({ ...prev, yearBuilt: true }))}
              onBlur={() => setInputFocus(prev => ({ ...prev, yearBuilt: false }))}
              style={{ ...inputBaseStyle, ...(inputFocus.yearBuilt ? inputFocusStyle : {}) }}
              min="1800"
              max={new Date().getFullYear()}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#2f4f2f', marginBottom: '0.25rem' }}>Square Footage</label>
            <input
              type="number"
              value={formData.squareFootage}
              onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
              onFocus={() => setInputFocus(prev => ({ ...prev, squareFootage: true }))}
              onBlur={() => setInputFocus(prev => ({ ...prev, squareFootage: false }))}
              style={{ ...inputBaseStyle, ...(inputFocus.squareFootage ? inputFocusStyle : {}) }}
              required
              min="1"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#2f4f2f', marginBottom: '0.25rem' }}>Secret Key</label>
            <input
              type="password"
              value={formData.secretKey}
              onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
              onFocus={() => setInputFocus(prev => ({ ...prev, secretKey: true }))}
              onBlur={() => setInputFocus(prev => ({ ...prev, secretKey: false }))}
              style={{ ...inputBaseStyle, ...(inputFocus.secretKey ? inputFocusStyle : {}) }}
              required
              placeholder="Enter 8–32 characters (letters, numbers, symbols)"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#2f4f2f', marginBottom: '0.25rem' }}>Hash (Memo)</label>
            <input
              type="text"
              value={formData.hash}
              onChange={(e) => setFormData({ ...formData, hash: e.target.value })}
              onFocus={() => setInputFocus(prev => ({ ...prev, hash: true }))}
              onBlur={() => setInputFocus(prev => ({ ...prev, hash: false }))}
              style={{ ...inputBaseStyle, ...(inputFocus.hash ? inputFocusStyle : {}) }}
              required
              placeholder="Enter the hash from the memo"
            />
          </div>
          <button
            type="submit"
            onMouseEnter={() => setButtonHover(prev => ({ ...prev, verify: true }))}
            onMouseLeave={() => setButtonHover(prev => ({ ...prev, verify: false }))}
            style={{
              ...buttonBaseStyle,
              ...(buttonHover.verify ? buttonHoverStyle : {})
            }}
          >
            Verify
          </button>
        </form>
        {result && (
          <div style={{
            padding: '1rem',
            background: result.includes('No') ? '#e8f5e8' : '#ffebee',
            color: result.includes('No') ? '#2f4f2f' : '#c0392b',
            borderRadius: '8px',
            border: '1px solid ' + (result.includes('No') ? '#e8f5e8' : '#ef9a9a'),
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginTop: '1rem'
          }}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
};

export default Verify;