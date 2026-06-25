import { useState, useEffect } from 'react';
import { createTransaction, getAccounts } from '../services/api';
import CategoryPicker from './CategoryPicker';

const TYPE_COLORS = {
  income:   { color: '#059669', bg: '#ecfdf5', border: '#d1fae5' },
  expense:  { color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  transfer: { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
};

const inputStyle = {
  width: '100%',
  border: '1.5px solid #e5e7eb',
  borderRadius: 10,
  padding: '0.7rem 1rem',
  fontSize: '0.9rem',
  background: 'white',
  color: '#1e1b4b',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontWeight: 600,
  color: '#374151',
  fontSize: '0.85rem',
  marginBottom: '0.4rem',
};

function emptyForm() {
  return {
    amount: '', currenciesCode: 'USD', description: '',
    date: new Date().toISOString().split('T')[0],
    accountID: '', categoryID: '', subCategoryID: null, toAccountID: '',
  };
}

function TransactionModal({ isOpen, onClose, onSuccess, accounts: propAccounts, categories: propCategories, initialType = 'expense' }) {
  const [transType, setTransType]             = useState(initialType);
  const [accounts, setAccounts]               = useState(propAccounts || []);
  const [categories, setCategories]           = useState(propCategories || []);
  const [formData, setFormData]               = useState(emptyForm());
  const [formErrors, setFormErrors]           = useState({});
  const [selectedCategoryName, setSelCatName] = useState('');
  const [submitting, setSubmitting]           = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTransType(initialType);
    setFormData(emptyForm());
    setSelCatName('');
    setFormErrors({});
    getAccounts().then(setAccounts).catch(() => {});
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (propAccounts) setAccounts(propAccounts); }, [propAccounts]);
  useEffect(() => { if (propCategories) setCategories(propCategories); }, [propCategories]);

  const clearErr = (field) =>
    setFormErrors(prev => { const n = { ...prev }; delete n[field]; return n; });

  const handleTypeChange = (type) => {
    setTransType(type);
    setFormData(prev => ({ ...prev, categoryID: '', subCategoryID: null, toAccountID: '' }));
    setSelCatName('');
  };

  const handleSubmit = async () => {
    if (accounts.length === 0) {
      alert('You need to create an account first before adding transactions!');
      onClose();
      return;
    }

    const errors = {};
    const amt = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amt) || amt <= 0)
      errors.amount = 'Enter a valid amount greater than 0';
    if (!formData.accountID)
      errors.accountID = 'Please select an account';
    if (transType === 'transfer' && !formData.toAccountID)
      errors.toAccountID = 'Please select a destination account';

    if (!errors.accountID && transType !== 'income') {
      const from = accounts.find(a => String(a.accountID) === String(formData.accountID));
      if (from && amt > from.balance)
        errors.accountID = `Insufficient funds — ${from.name} only has $${from.balance.toFixed(2)}`;
    }

    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setSubmitting(true);

    console.log('formData before submit:', formData);

    try {
      await createTransaction({
        ...formData,
        status: transType,
        amount: amt,
        accountID: parseInt(formData.accountID),
        categoryID: formData.categoryID ? parseInt(formData.categoryID) : null,
        subCategoryID: formData.subCategoryID ? parseInt(formData.subCategoryID) : null,
        toAccountID: formData.toAccountID ? parseInt(formData.toAccountID) : null,
        date: new Date(formData.date).toISOString(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.message || '';
      const isBalance = msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('balance');
      if (isBalance) setFormErrors({ accountID: msg });
      else alert(msg || 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const amt = parseFloat(formData.amount) || 0;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: '#1e1b4b', fontWeight: 800 }}>New Transaction</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1.4rem', lineHeight: 1, padding: 0 }}>✕</button>
        </div>

        {/* Type selector */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Type</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['income', 'expense', 'transfer'].map(type => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                style={{
                  flex: 1, padding: '0.65rem 0.25rem', borderRadius: 10,
                  border: `2px solid ${transType === type ? TYPE_COLORS[type].color : '#e5e7eb'}`,
                  background: transType === type ? TYPE_COLORS[type].bg : 'white',
                  color: transType === type ? TYPE_COLORS[type].color : '#6b7280',
                  fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'capitalize',
                  transition: 'all 0.15s',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Amount</label>
          <input
            type="number"
            placeholder="0.00"
            value={formData.amount}
            onChange={e => { setFormData(p => ({ ...p, amount: e.target.value })); clearErr('amount'); }}
            style={{ ...inputStyle, borderColor: formErrors.amount ? '#ef4444' : '#e5e7eb' }}
          />
          {formErrors.amount && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.3rem' }}>{formErrors.amount}</div>}
        </div>

        {/* Account */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>{transType === 'transfer' ? 'From Account' : 'Account'}</label>
          {accounts.length === 0 ? (
            <div style={{ background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#92400e', fontWeight: 500 }}>
              ⚠️ No accounts found.{' '}
              <span onClick={() => { onClose(); window.location.href = '/accounts'; }} style={{ fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                Create an account first →
              </span>
            </div>
          ) : (
            <select
              value={formData.accountID}
              onChange={e => { setFormData(p => ({ ...p, accountID: e.target.value })); clearErr('accountID'); }}
              style={{ ...inputStyle, borderColor: formErrors.accountID ? '#ef4444' : '#e5e7eb' }}
            >
              <option value="">Select account...</option>
              {accounts
                .filter(a => transType === 'transfer' ? a.accountType !== 'savings' : true)
                .map(a => {
                  const insufficient = transType !== 'income' && amt > 0 && a.balance < amt;
                  return (
                    <option key={a.accountID} value={a.accountID} disabled={insufficient}>
                      {a.name} — ${a.balance.toFixed(2)}{insufficient ? ' (insufficient funds)' : ''}
                    </option>
                  );
                })
              }
            </select>
          )}
          {formErrors.accountID && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.3rem' }}>{formErrors.accountID}</div>}
        </div>

        {/* To Account (transfer only) */}
        {transType === 'transfer' && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>To Account</label>
            <select
              value={formData.toAccountID}
              onChange={e => { setFormData(p => ({ ...p, toAccountID: e.target.value })); clearErr('toAccountID'); }}
              style={{ ...inputStyle, borderColor: formErrors.toAccountID ? '#ef4444' : '#e5e7eb' }}
            >
              <option value="">Select destination...</option>
              {accounts
                .filter(a => a.accountID !== parseInt(formData.accountID) && a.accountType !== 'savings')
                .map(a => (
                  <option key={a.accountID} value={a.accountID}>{a.name} — ${a.balance.toFixed(2)}</option>
                ))
              }
            </select>
            {formErrors.toAccountID && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.3rem' }}>{formErrors.toAccountID}</div>}
          </div>
        )}

        {/* Category */}
        {transType !== 'transfer' && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>
              Category
              {selectedCategoryName && (
                <span style={{ color: '#7c3aed', marginLeft: '0.5rem', fontWeight: 400, fontSize: '0.8rem' }}>✓ {selectedCategoryName}</span>
              )}
            </label>
            <CategoryPicker
              categories={categories}
              transType={transType}
              selectedID={formData.categoryID ? parseInt(formData.categoryID) : null}
              onSelect={(cat) => {
                setFormData(p => ({
                  ...p,
                  categoryID: cat.categoryID.toString(),
                  subCategoryID: cat.subCategoryID || null
                }));
                setSelCatName(cat.name);
              }}
            />
          </div>
        )}

        {/* Description */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Description (optional)</label>
          <input
            type="text"
            placeholder="e.g. Salary payment, Grocery run..."
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            style={inputStyle}
          />
        </div>

        {/* Date */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
            style={inputStyle}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 2, padding: '0.8rem', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)',
              color: 'white', fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Adding...' : `Add ${transType.charAt(0).toUpperCase() + transType.slice(1)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransactionModal;