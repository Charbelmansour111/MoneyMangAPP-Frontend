/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccounts, createAccount, updateAccount, deleteAccount, getTransactions } from '../services/api';
import Layout from '../components/Layout';
import { ACCOUNT_TYPES } from '../utils/accountConstants.jsx';
import { getRates, convert, getCurrencySymbol as getSymbol } from '../utils/exchangeRates';

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'LBP'];
const CURRENCY_NAMES = { USD: 'US Dollar', EUR: 'Euro', LBP: 'Lebanese Pound' };

const TYPE_COLORS = {
  income:   { color: '#059669', bg: '#ecfdf5' },
  expense:  { color: '#ef4444', bg: '#fef2f2' },
  transfer: { color: '#7c3aed', bg: '#f5f3ff' },
};

function Accounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts]                         = useState([]);
  const [loading, setLoading]                           = useState(true);
  const [error, setError]                               = useState('');
  const [showAddModal, setShowAddModal]                 = useState(false);
  const [showEditModal, setShowEditModal]               = useState(false);
  const [showDetailModal, setShowDetailModal]           = useState(false);
  const [selectedAccount, setSelectedAccount]           = useState(null);
  const [accountTransactions, setAccountTransactions]   = useState([]);
  const [loadingTxns, setLoadingTxns]                   = useState(false);
  const [editingAccount, setEditingAccount]             = useState(null);
  const [deleteConfirm, setDeleteConfirm]               = useState(null);
  const [submitting, setSubmitting]                     = useState(false);
  const [editExchangeRate, setEditExchangeRate]         = useState(null);
  const [editConvertedBalance, setEditConvertedBalance] = useState(null);
  const [fetchingEditRate, setFetchingEditRate]         = useState(false);
  const [activeTypeFilter, setActiveTypeFilter]         = useState('');
  const [overviewCurrencyIndex, setOverviewCurrencyIndex] = useState(0);
  const [formData, setFormData]                         = useState({
    name: '', accountType: 'bank', currenciesCode: 'USD',
  });
  const [editData, setEditData]                         = useState({
    name: '', currenciesCode: '',
  });

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const accs = await getAccounts();
      setAccounts(accs);
    } catch (err) {
      setError(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const openAccountDetail = async (account) => {
    setSelectedAccount(account);
    setShowDetailModal(true);
    setLoadingTxns(true);
    try {
      const txns = await getTransactions();
      const filtered = txns.filter(t => t.accountID === account.accountID || t.toAccountID === account.accountID);
      setAccountTransactions(filtered);
    } catch {
      setAccountTransactions([]);
    } finally {
      setLoadingTxns(false);
    }
  };

  const fetchEditRate = async (from, to, balance) => {
    if (from === to) { setEditExchangeRate(null); setEditConvertedBalance(null); return; }
    setFetchingEditRate(true);
    try {
      const rates = await getRates();
      const rate = convert(1, from, to, rates);
      setEditExchangeRate(rate);
      setEditConvertedBalance((balance * rate).toFixed(2));
    } catch {
      setEditExchangeRate(null);
      setEditConvertedBalance(null);
    } finally {
      setFetchingEditRate(false);
    }
  };

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
    if (editData.currenciesCode !== editingAccount.currenciesCode && !editExchangeRate) {
      alert('Exchange rate is still loading. Please wait a moment and try again.');
      return;
    }
    setSubmitting(true);
    try {
      await updateAccount(editingAccount.accountID, {
        name: editData.name,
        currenciesCode: editData.currenciesCode,
        exchangeRate: editExchangeRate,
      });
      setShowEditModal(false);
      setEditingAccount(null);
      setEditExchangeRate(null);
      setEditConvertedBalance(null);
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

  const openEdit = (account, e) => {
    e.stopPropagation();
    setEditingAccount(account);
    setEditData({ name: account.name, currenciesCode: account.currenciesCode });
    setEditExchangeRate(null);
    setEditConvertedBalance(null);
    setShowEditModal(true);
  };

  const currencyOverviews = SUPPORTED_CURRENCIES.map(currency => {
    const currencyAccounts = accounts.filter(a => a.currenciesCode === currency);
    const total = currencyAccounts.reduce((s, a) => s + a.balance, 0);
    const count = currencyAccounts.length;
    return { currency, total, count };
  }).filter(c => c.count > 0);

  const activeCurrencyData = currencyOverviews[overviewCurrencyIndex] || null;

  const filteredAccounts = activeTypeFilter === ''
    ? accounts
    : accounts.filter(a => a.accountType === activeTypeFilter);

  const inputStyle = {
    width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10,
    padding: '0.7rem 1rem', fontSize: '0.9rem', background: 'white',
    color: '#1e1b4b', outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block', fontWeight: 600, color: '#374151',
    fontSize: '0.85rem', marginBottom: '0.4rem',
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

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1e1b4b' }}>Accounts</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} · Click any account to view transactions
            </p>
          </div>
          <button
            onClick={() => { setFormData({ name: '', accountType: 'bank', currenciesCode: 'USD' }); setShowAddModal(true); }}
            style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', color: 'white', border: 'none', borderRadius: 12, padding: '0.7rem 1.25rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            + Add Account
          </button>
        </div>

        {/* CURRENCY OVERVIEW CAROUSEL */}
        {currencyOverviews.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)', borderRadius: 20, padding: '1.75rem 3.5rem', color: 'white', textAlign: 'center', minHeight: 160, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>

              {currencyOverviews.length > 1 && (
                <button onClick={() => setOverviewCurrencyIndex(i => (i - 1 + currencyOverviews.length) % currencyOverviews.length)} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: 'white', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              )}

              {activeCurrencyData ? (
                <>
                  <div style={{ fontSize: '0.78rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 2, marginBottom: '0.3rem' }}>
                    {CURRENCY_NAMES[activeCurrencyData.currency] || activeCurrencyData.currency}
                  </div>
                  <div style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-1px', color: activeCurrencyData.total < 0 ? '#fca5a5' : 'white' }}>
                    {activeCurrencyData.total < 0 ? '-' : ''}{getSymbol(activeCurrencyData.currency)}{Math.abs(activeCurrencyData.total).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: '0.3rem' }}>
                    {activeCurrencyData.count} account{activeCurrencyData.count !== 1 ? 's' : ''} in {activeCurrencyData.currency}
                  </div>
                  {currencyOverviews.length > 1 && (
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1rem' }}>
                      {currencyOverviews.map((_, i) => (
                        <div key={i} onClick={() => setOverviewCurrencyIndex(i)} style={{ width: i === overviewCurrencyIndex ? 20 : 8, height: 8, borderRadius: 4, background: i === overviewCurrencyIndex ? 'white' : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.2s' }} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ opacity: 0.6 }}>No accounts yet</div>
              )}

              {currencyOverviews.length > 1 && (
                <button onClick={() => setOverviewCurrencyIndex(i => (i + 1) % currencyOverviews.length)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: 'white', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</button>
              )}
            </div>
          </div>
        )}

        {/* TYPE FILTER TABS */}
        {accounts.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {ACCOUNT_TYPES.map(t => {
              const isActive = activeTypeFilter === t.type;
              const count = accounts.filter(a => a.accountType === t.type).length;
              if (count === 0) return null;
              return (
                <button
                  key={t.type}
                  onClick={() => setActiveTypeFilter(prev => prev === t.type ? '' : t.type)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', background: isActive ? '#1e1b4b' : '#f3f4f6', color: isActive ? 'white' : '#6b7280', transition: 'all 0.15s' }}
                >
                  <span style={{ color: isActive ? 'white' : t.color }}>{t.icon}</span>
                  {t.label}
                  <span style={{ background: isActive ? 'rgba(255,255,255,0.2)' : '#e5e7eb', color: isActive ? 'white' : '#6b7280', borderRadius: 20, padding: '0.05rem 0.4rem', fontSize: '0.72rem', fontWeight: 700 }}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* NO ACCOUNTS STATE */}
        {accounts.length === 0 && (
          <div style={{ background: 'white', borderRadius: 16, border: '1.5px dashed #d1d5db', padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#374151', marginBottom: '0.5rem' }}>No accounts yet</div>
            <div style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Create your first account to start tracking your finances</div>
            <button onClick={() => setShowAddModal(true)} style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', color: 'white', border: 'none', borderRadius: 12, padding: '0.75rem 1.5rem', fontWeight: 700, cursor: 'pointer' }}>
              + Create First Account
            </button>
          </div>
        )}

        {/* ACCOUNTS GROUPED BY TYPE */}
        {activeTypeFilter === '' ? (
          ACCOUNT_TYPES.map(typeInfo => {
            const typeAccounts = accounts.filter(a => a.accountType === typeInfo.type);
            if (typeAccounts.length === 0) return null;
            return <AccountTypeSection key={typeInfo.type} typeInfo={typeInfo} typeAccounts={typeAccounts} openAccountDetail={openAccountDetail} openEdit={openEdit} setDeleteConfirm={setDeleteConfirm} navigate={navigate} />;
          })
        ) : (
          (() => {
            const typeInfo = ACCOUNT_TYPES.find(t => t.type === activeTypeFilter);
            if (!typeInfo) return null;
            return <AccountTypeSection typeInfo={typeInfo} typeAccounts={filteredAccounts} openAccountDetail={openAccountDetail} openEdit={openEdit} setDeleteConfirm={setDeleteConfirm} navigate={navigate} />;
          })()
        )}

      </div>

      {/* ACCOUNT DETAIL MODAL */}
      {showDetailModal && selectedAccount && (
        <div onClick={() => setShowDetailModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1e1b4b', fontWeight: 800 }}>{selectedAccount.name}</h3>
                <p style={{ margin: '0.2rem 0 0', color: '#9ca3af', fontSize: '0.82rem' }}>{selectedAccount.accountType} · {selectedAccount.currenciesCode}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1.4rem', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.25rem', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 2, marginBottom: '0.3rem' }}>Current Balance</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: selectedAccount.balance < 0 ? '#fca5a5' : 'white' }}>
                {selectedAccount.balance < 0 ? '-' : ''}{getSymbol(selectedAccount.currenciesCode)}{Math.abs(selectedAccount.balance).toFixed(2)}
              </div>
            </div>

            <h4 style={{ margin: '0 0 0.75rem', color: '#1e1b4b', fontSize: '0.9rem', fontWeight: 700 }}>
              Transactions ({accountTransactions.length})
            </h4>

            {loadingTxns ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>⏳ Loading...</div>
            ) : accountTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💸</div>
                No transactions for this account yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[...accountTransactions].sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => {
                  const tc = TYPE_COLORS[t.status] || TYPE_COLORS.income;
                  const isIncoming = t.status === 'income' || (t.status === 'transfer' && t.toAccountID === selectedAccount.accountID);
                  const catName = t.subCategoryName ? `${t.categoryName} › ${t.subCategoryName}` : t.categoryName;
                  return (
                    <div key={t.transactionID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#fafafa', borderRadius: 10, border: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {t.status === 'income' ? '⬆️' : t.status === 'expense' ? '⬇️' : '🔄'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '0.85rem' }}>{catName || t.description || t.status}</div>
                          <div style={{ color: '#9ca3af', fontSize: '0.72rem' }}>
                            <span style={{ background: tc.bg, color: tc.color, padding: '0.1rem 0.4rem', borderRadius: 4, fontSize: '0.68rem', fontWeight: 600, marginRight: '0.35rem' }}>{t.status}</span>
                            {new Date(t.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: isIncoming ? '#059669' : '#ef4444', fontSize: '0.9rem' }}>
                        {isIncoming ? '+' : '-'}{getSymbol(selectedAccount.currenciesCode)}{Math.abs(t.amount).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button onClick={() => setShowDetailModal(false)} style={{ width: '100%', marginTop: '1.25rem', padding: '0.8rem', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#1e1b4b', fontWeight: 800 }}>New Account</h3>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1.4rem' }}>✕</button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Account Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {ACCOUNT_TYPES.filter(t => t.type !== 'savings').map(t => (
                  <button key={t.type} onClick={() => setFormData({ ...formData, accountType: t.type })} style={{ padding: '0.75rem 0.5rem', borderRadius: 12, border: `2px solid ${formData.accountType === t.type ? t.color : '#e5e7eb'}`, background: formData.accountType === t.type ? t.bg : 'white', color: formData.accountType === t.type ? t.color : '#6b7280', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ color: formData.accountType === t.type ? t.color : '#9ca3af' }}>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Account Name</label>
              <input type="text" placeholder={formData.accountType === 'bank' ? 'e.g. BLOM Bank' : formData.accountType === 'cash' ? 'e.g. Wallet' : 'e.g. Whish Money'} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Currency</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {SUPPORTED_CURRENCIES.map(c => (
                  <button key={c} onClick={() => setFormData({ ...formData, currenciesCode: c })} style={{ padding: '0.75rem 0.5rem', borderRadius: 12, border: `2px solid ${formData.currenciesCode === c ? '#1e1b4b' : '#e5e7eb'}`, background: formData.currenciesCode === c ? '#f5f3ff' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: formData.currenciesCode === c ? '#1e1b4b' : '#374151' }}>{getSymbol(c)}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: formData.currenciesCode === c ? '#7c3aed' : '#9ca3af' }}>{c}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdd} disabled={submitting} style={{ flex: 2, padding: '0.8rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', color: 'white', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingAccount && (
        <div onClick={() => setShowEditModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 420 }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#1e1b4b', fontWeight: 800 }}>Edit Account</h3>
            <p style={{ margin: '0 0 1.5rem', color: '#6b7280', fontSize: '0.85rem' }}>Changing currency will convert your balance at the current exchange rate.</p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Account Name</label>
              <input type="text" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Currency</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {SUPPORTED_CURRENCIES.map(c => (
                  <button key={c} onClick={() => { setEditData({ ...editData, currenciesCode: c }); fetchEditRate(editingAccount.currenciesCode, c, editingAccount.balance); }} style={{ padding: '0.75rem 0.5rem', borderRadius: 12, border: `2px solid ${editData.currenciesCode === c ? '#1e1b4b' : '#e5e7eb'}`, background: editData.currenciesCode === c ? '#f5f3ff' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: editData.currenciesCode === c ? '#1e1b4b' : '#374151' }}>{getSymbol(c)}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: editData.currenciesCode === c ? '#7c3aed' : '#9ca3af' }}>{c}</span>
                  </button>
                ))}
              </div>

              {editData.currenciesCode !== editingAccount.currenciesCode && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.82rem', color: '#1e40af' }}>
                  {fetchingEditRate ? '⏳ Fetching rate...' : editConvertedBalance ? (
                    <>
                      {getSymbol(editingAccount.currenciesCode)}{editingAccount.balance.toFixed(2)} → <strong>{getSymbol(editData.currenciesCode)}{editConvertedBalance}</strong>
                      <span style={{ opacity: 0.6, marginLeft: '0.5rem' }}>(rate: {editExchangeRate?.toFixed(4)})</span>
                    </>
                  ) : '⏳ Loading...'}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { setShowEditModal(false); setEditExchangeRate(null); setEditConvertedBalance(null); }} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleEdit} disabled={submitting} style={{ flex: 2, padding: '0.8rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', color: 'white', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#1e1b4b' }}>Delete Account?</h3>
           <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 1rem' }}>This account and all its data will be permanently removed. Your transactions linked to this account will no longer be tracked.</p>
           <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '0.6rem 0.75rem', fontSize: '0.82rem', color: '#92400e', marginBottom: '1.25rem' }}>
             ⚠️ Make sure to transfer your balance before deleting.
             </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: 'none', background: '#ef4444', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}

function AccountTypeSection({ typeInfo, typeAccounts, openAccountDetail, openEdit, setDeleteConfirm, navigate }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: typeInfo.bg, border: `1px solid ${typeInfo.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: typeInfo.color }}>
          {typeInfo.icon}
        </div>
        <span style={{ fontWeight: 700, color: '#374151', fontSize: '0.95rem' }}>{typeInfo.label}</span>
        <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>({typeAccounts.length})</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
        {typeAccounts.map(account => (
          <div key={account.accountID} onClick={() => openAccountDetail(account)} style={{ background: 'white', borderRadius: 16, border: `1.5px solid ${typeInfo.border}`, padding: '1.25rem', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s' }} onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: typeInfo.color, borderRadius: '16px 16px 0 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: typeInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: typeInfo.color, flexShrink: 0 }}>
                  {typeInfo.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '0.95rem' }}>{account.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{account.status}</div>
                </div>
              </div>
              <span style={{ background: typeInfo.bg, color: typeInfo.color, borderRadius: 6, padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: 700, border: `1px solid ${typeInfo.border}` }}>
                {account.currenciesCode}
              </span>
            </div>

            <div style={{ background: typeInfo.bg, borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: typeInfo.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.2rem' }}>Balance</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: account.balance < 0 ? '#ef4444' : typeInfo.color }}>
                {account.balance < 0 ? '-' : ''}{getSymbol(account.currenciesCode)}{Math.abs(account.balance).toFixed(2)}
              </div>
            </div>

            {account.accountType === 'savings' && (
              <div onClick={e => { e.stopPropagation(); navigate('/savings'); }} style={{ marginBottom: '0.75rem', cursor: 'pointer', color: '#7c3aed', fontSize: '0.8rem', fontWeight: 600 }}>
                View Savings Goals →
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={e => openEdit(account, e)} style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>✏️ Edit</button>
              {account.accountType !== 'savings' && (
                <button onClick={e => { e.stopPropagation(); setDeleteConfirm(account.accountID); }} style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: '1.5px solid #fecaca', background: '#fef2f2', color: '#ef4444', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>🗑️ Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Accounts;