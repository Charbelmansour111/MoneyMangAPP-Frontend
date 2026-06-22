import { useState, useEffect } from 'react';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../services/api';
import Layout from '../components/Layout';

const ACCOUNT_TYPES = [
  {
    type: 'bank',
    label: 'Bank',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="22" x2="21" y2="22"/>
        <line x1="6" y1="18" x2="6" y2="11"/>
        <line x1="10" y1="18" x2="10" y2="11"/>
        <line x1="14" y1="18" x2="14" y2="11"/>
        <line x1="18" y1="18" x2="18" y2="11"/>
        <polygon points="12 2 20 7 4 7"/>
      </svg>
    ),
    color: '#1e40af',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    type: 'cash',
    label: 'Cash',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <circle cx="12" cy="12" r="2"/>
        <path d="M6 12h.01M18 12h.01"/>
      </svg>
    ),
    color: '#065f46',
    bg: '#ecfdf5',
    border: '#bbf7d0',
  },
  {
    type: 'mobile',
    label: 'Mobile',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    ),
    color: '#6d28d9',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
  {
    type: 'savings',
    label: 'Savings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      </svg>
    ),
    color: '#9a3412',
    bg: '#fff7ed',
    border: '#fed7aa',
  },
];

const CURRENCIES = ['USD', 'EUR', 'LBP', 'GBP'];

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    accountType: 'bank',
    currenciesCode: 'USD',
  });
  const [editData, setEditData] = useState({
    name: '',
    currenciesCode: '',
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (err) {
      setError(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => { await fetchAccounts(); };
    load();
  }, []);

  const handleAdd = async () => {
    if (!formData.name.trim()) return alert('Please enter an account name');
    setSubmitting(true);
    try {
      await createAccount(formData);
      setShowAddModal(false);
      setFormData({ name: '', accountType: 'bank', currenciesCode: 'USD' });
      fetchAccounts();
    } catch (err) {
      alert(err.message || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editData.name.trim()) return alert('Please enter an account name');
    setSubmitting(true);
    try {
      await updateAccount(editingAccount.accountID, editData);
      setShowEditModal(false);
      setEditingAccount(null);
      fetchAccounts();
    } catch (err) {
      alert(err.message || 'Failed to update account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAccount(id);
      setDeleteConfirm(null);
      fetchAccounts();
    } catch (err) {
      alert(err.message || 'Failed to delete account');
    }
  };

  const openEdit = (account) => {
    setEditingAccount(account);
    setEditData({ name: account.name, currenciesCode: account.currenciesCode });
    setShowEditModal(true);
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

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

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          Loading accounts...
        </div>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div style={{ color: '#ef4444', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
        {error}
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* ===== HEADER ===== */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1e1b4b' }}>Accounts</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
              {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => { setFormData({ name: '', accountType: 'bank', currenciesCode: 'USD' }); setShowAddModal(true); }}
            style={{
              background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '0.7rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            + Add Account
          </button>
        </div>

        {/* ===== TOTAL BALANCE CARD ===== */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)',
          borderRadius: 20,
          padding: '1.75rem',
          marginBottom: '1.5rem',
          color: 'white',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 2, marginBottom: '0.4rem' }}>
            Total Balance
          </div>
          <div style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-1px' }}>
            ${totalBalance.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.25rem' }}>
            Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* ===== NO ACCOUNTS STATE ===== */}
        {accounts.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1.5px dashed #d1d5db',
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#374151', marginBottom: '0.5rem' }}>
              No accounts yet
            </div>
            <div style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Create your first account to start tracking your finances
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '0.75rem 1.5rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Create First Account
            </button>
          </div>
        )}

        {/* ===== ACCOUNTS GROUPED BY TYPE ===== */}
        {ACCOUNT_TYPES.map(typeInfo => {
          const typeAccounts = accounts.filter(a => a.accountType === typeInfo.type);
          if (typeAccounts.length === 0) return null;

          return (
            <div key={typeInfo.type} style={{ marginBottom: '1.5rem' }}>
              {/* Type header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: typeInfo.bg,
                  border: `1px solid ${typeInfo.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: typeInfo.color,
                }}>
                  {typeInfo.icon}
                </div>
                <span style={{ fontWeight: 700, color: '#374151', fontSize: '0.95rem' }}>
                  {typeInfo.label}
                </span>
                <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                  ({typeAccounts.length})
                </span>
              </div>

              {/* Cards grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '1rem',
              }}>
                {typeAccounts.map(account => (
                  <div key={account.accountID} style={{
                    background: 'white',
                    borderRadius: 16,
                    border: `1.5px solid ${typeInfo.border}`,
                    padding: '1.25rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {/* Type accent bar */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: typeInfo.color,
                      borderRadius: '16px 16px 0 0',
                    }} />

                    {/* Icon + Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', marginTop: '0.5rem' }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: typeInfo.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: typeInfo.color,
                        flexShrink: 0,
                      }}>
                        {typeInfo.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '0.95rem' }}>
                          {account.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {account.currenciesCode} • {account.status}
                        </div>
                      </div>
                    </div>

                    {/* Balance */}
                    <div style={{
                      background: typeInfo.bg,
                      borderRadius: 10,
                      padding: '0.75rem 1rem',
                      marginBottom: '1rem',
                    }}>
                      <div style={{ fontSize: '0.7rem', color: typeInfo.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.2rem' }}>
                        Balance
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: typeInfo.color }}>
                        ${account.balance.toFixed(2)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => openEdit(account)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: 8,
                          border: '1.5px solid #e5e7eb',
                          background: 'white',
                          color: '#374151',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(account.accountID)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          borderRadius: 8,
                          border: '1.5px solid #fecaca',
                          background: '#fef2f2',
                          color: '#ef4444',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

      </div>

      {/* ===== ADD MODAL ===== */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 20,
              padding: '2rem',
              width: '100%',
              maxWidth: 420,
            }}
          >
            <h3 style={{ margin: '0 0 1.5rem', color: '#1e1b4b', fontWeight: 800 }}>
              New Account
            </h3>

            {/* Account Type */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Account Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {ACCOUNT_TYPES.map(t => (
                  <button
                    key={t.type}
                    onClick={() => setFormData({ ...formData, accountType: t.type })}
                    style={{
                      padding: '0.65rem',
                      borderRadius: 10,
                      border: `2px solid ${formData.accountType === t.type ? t.color : '#e5e7eb'}`,
                      background: formData.accountType === t.type ? t.bg : 'white',
                      color: formData.accountType === t.type ? t.color : '#6b7280',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ color: formData.accountType === t.type ? t.color : '#9ca3af' }}>
                      {t.icon}
                    </span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Account Name</label>
              <input
                type="text"
                placeholder={
                  formData.accountType === 'bank' ? 'e.g. BLOM Bank' :
                  formData.accountType === 'cash' ? 'e.g. Wallet' :
                  formData.accountType === 'mobile' ? 'e.g. Whish Money' :
                  'e.g. Emergency Fund'
                }
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* Currency */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Currency</label>
              <select
                value={formData.currenciesCode}
                onChange={e => setFormData({ ...formData, currenciesCode: e.target.value })}
                style={inputStyle}
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  borderRadius: 12,
                  border: '1.5px solid #e5e7eb',
                  background: 'white',
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting}
                style={{
                  flex: 2,
                  padding: '0.8rem',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)',
                  color: 'white',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && editingAccount && (
        <div
          onClick={() => setShowEditModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 20,
              padding: '2rem',
              width: '100%',
              maxWidth: 420,
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem', color: '#1e1b4b', fontWeight: 800 }}>
              Edit Account
            </h3>
            <p style={{ margin: '0 0 1.5rem', color: '#6b7280', fontSize: '0.85rem' }}>
              Note: Balance can only be changed through transactions
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Account Name</label>
              <input
                type="text"
                value={editData.name}
                onChange={e => setEditData({ ...editData, name: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Currency</label>
              <select
                value={editData.currenciesCode}
                onChange={e => setEditData({ ...editData, currenciesCode: e.target.value })}
                style={inputStyle}
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  borderRadius: 12,
                  border: '1.5px solid #e5e7eb',
                  background: 'white',
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={submitting}
                style={{
                  flex: 2,
                  padding: '0.8rem',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)',
                  color: 'white',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRM ===== */}
      {deleteConfirm && (
        <div
          onClick={() => setDeleteConfirm(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 20,
              padding: '2rem',
              width: '100%',
              maxWidth: 380,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#1e1b4b' }}>Delete Account?</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
              This will permanently delete this account. All transactions linked to this account will remain but the account will no longer be accessible.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  borderRadius: 12,
                  border: '1.5px solid #e5e7eb',
                  background: 'white',
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  borderRadius: 12,
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}

export default Accounts;