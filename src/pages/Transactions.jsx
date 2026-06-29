/* eslint-disable */
import { useState, useEffect } from 'react';
import { getTransactions, getAccounts, getCategories, deleteTransaction, updateTransaction } from '../services/api';
import Layout from '../components/Layout';
import CategoryPicker from '../components/CategoryPicker';
import TransactionModal from '../components/TransactionModal';
import { TYPE_COLORS, inputStyle, labelStyle } from '../utils/constants';
import { formatNumberInput, parseNumberInput } from '../utils/constants';
import { getRates, convert, getCurrencySymbol as getSymbol } from '../utils/exchangeRates';

function TxIcon({ t, size = 44 }) {
  const tc = TYPE_COLORS[t.status] || TYPE_COLORS.income;
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {t.status === 'income' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
      ) : t.status === 'expense' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
      )}
    </div>
  );
}

function Transactions() {
  const [transactions, setTransactions]         = useState([]);
  const [accounts, setAccounts]                 = useState([]);
  const [categories, setCategories]             = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState('');
  const [filter, setFilter]                     = useState('all');
  const [search, setSearch]                     = useState('');
  const [expandedID, setExpandedID]             = useState(null);
  const [showAddModal, setShowAddModal]         = useState(false);
  const [showEditModal, setShowEditModal]       = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteConfirm, setDeleteConfirm]       = useState(null);
  const [displayCurrency, setDisplayCurrency]   = useState('USD');
  const [rates, setRates]                       = useState({});
  const [editData, setEditData]                 = useState({ categoryID: '', amount: '', description: '', date: '' });
  const [submitting, setSubmitting]             = useState(false);

  useEffect(() => {
    getRates().then(setRates).catch(() => {});
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [txns, accs, cats] = await Promise.all([getTransactions(), getAccounts(), getCategories()]);
      setTransactions(txns);
      setAccounts(accs);
      setCategories(cats);
    } catch (err) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleEdit = async () => {
    setSubmitting(true);
    try {
      await updateTransaction(editingTransaction.transactionID, {
        categoryID: editData.categoryID ? parseInt(editData.categoryID) : null,
        amount: parseFloat(editData.amount),
        description: editData.description,
        date: new Date(editData.date).toISOString(),
      });
      setShowEditModal(false);
      setEditingTransaction(null);
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to update transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id);
      setDeleteConfirm(null);
      if (expandedID === id) setExpandedID(null);
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to delete transaction');
    }
  };

  const openEdit = (t) => {
    setEditingTransaction(t);
    setEditData({
      categoryID: t.categoryID || '',
      amount: Math.abs(t.amount).toString(),
      description: t.description || '',
      date: new Date(t.date).toISOString().split('T')[0],
    });
    setExpandedID(null);
    setShowEditModal(true);
  };

  const getCategoryPath = (t) => {
    if (t.subCategoryName) return `${t.categoryName} › ${t.subCategoryName}`;
    if (t.categoryName) return t.categoryName;
    return null;
  };

  const cvt = (amount, from = 'USD') => convert(amount, from, displayCurrency, rates);

  const filtered = transactions
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (t.description || '').toLowerCase().includes(q)
        || (getCategoryPath(t) || '').toLowerCase().includes(q);
    });

  const totalIncome   = transactions.filter(t => t.status === 'income').reduce((s, t) => s + cvt(Math.abs(t.amount), t.currenciesCode || 'USD'), 0);
  const totalExpenses = transactions.filter(t => t.status === 'expense').reduce((s, t) => s + cvt(Math.abs(t.amount), t.currenciesCode || 'USD'), 0);
  const balance       = totalIncome - totalExpenses;

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          Loading transactions...
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
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1e1b4b' }}>Transactions</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.85rem' }}>{transactions.length} total transactions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', color: 'white', border: 'none', borderRadius: 12, padding: '0.7rem 1.25rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            + Add Transaction
          </button>
        </div>

        {/* CURRENCY SELECTOR */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
          {['USD', 'EUR', 'LBP'].map(c => (
            <button
              key={c}
              onClick={() => setDisplayCurrency(c)}
              style={{ padding: '0.3rem 0.8rem', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', background: displayCurrency === c ? '#1e1b4b' : '#f3f4f6', color: displayCurrency === c ? 'white' : '#6b7280' }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)', borderRadius: 20, padding: '1.75rem', marginBottom: '1.5rem', color: 'white' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 2, marginBottom: '0.4rem' }}>Net Balance</div>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-1px', color: balance < 0 ? '#fca5a5' : 'white' }}>
              {balance < 0 ? '-' : ''}{getSymbol(displayCurrency)}{Math.abs(balance).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.25rem' }}>{transactions.length} transactions total</div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', marginBottom: '1.25rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>Income</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#86efac' }}>+{getSymbol(displayCurrency)}{totalIncome.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.2rem' }}>{transactions.filter(t => t.status === 'income').length} entries</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>Expenses</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fca5a5' }}>-{getSymbol(displayCurrency)}{totalExpenses.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.2rem' }}>{transactions.filter(t => t.status === 'expense').length} entries</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>Transfers</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#c4b5fd' }}>{transactions.filter(t => t.status === 'transfer').length}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.2rem' }}>total transfers</div>
            </div>
          </div>
        </div>

        {/* FILTER + SEARCH */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['all', 'income', 'expense', 'transfer'].map(type => (
              <button key={type} onClick={() => setFilter(type)} style={{ padding: '0.4rem 0.9rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', background: filter === type ? '#1e1b4b' : '#f3f4f6', color: filter === type ? 'white' : '#6b7280', textTransform: 'capitalize' }}>
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: '2.2rem' }} />
          </div>
        </div>

        {/* TRANSACTION LIST */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💸</div>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>No transactions found</div>
              <div style={{ fontSize: '0.85rem' }}>Try changing your filter or add a new transaction</div>
            </div>
          ) : (
            filtered.map((t, i) => {
              const typeInfo     = TYPE_COLORS[t.status] || TYPE_COLORS.income;
              const isTransfer   = t.status === 'transfer';
              const categoryPath = getCategoryPath(t);
              const isExpanded   = expandedID === t.transactionID;
              const isLast       = i === filtered.length - 1;

              return (
                <div key={t.transactionID} style={{ borderBottom: isLast && !isExpanded ? 'none' : '1px solid #f3f4f6' }}>
                  <div
                    onClick={() => setExpandedID(isExpanded ? null : t.transactionID)}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.25rem', cursor: 'pointer', transition: 'background 0.1s' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      <TxIcon t={t} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {categoryPath || t.description || t.status}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ background: typeInfo.bg, color: typeInfo.color, padding: '0.1rem 0.5rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600 }}>{t.status}</span>
                          {t.description && categoryPath && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{t.description}</span>}
                          <span>{new Date(t.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: typeInfo.color, minWidth: 80, textAlign: 'right' }}>
                        {t.status === 'income' ? '+' : t.status === 'expense' ? '-' : ''}{getSymbol(t.currenciesCode || 'USD')}{Math.abs(t.amount).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ background: '#fafafa', borderTop: '1px solid #f3f4f6', padding: '1rem 1.25rem 1.25rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem 1.5rem', marginBottom: '1rem' }}>
                        {[
                          { label: 'Category',    value: categoryPath || 'Uncategorized' },
                          { label: 'Description', value: t.description || '—' },
                          { label: 'Date',        value: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) },
                          { label: 'Time',        value: new Date(t.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
                          { label: 'Currency',    value: t.currenciesCode || 'USD' },
                          { label: 'Type',        value: t.status },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: '0.15rem' }}>{label}</div>
                            <div style={{ fontSize: '0.85rem', color: '#1e1b4b', fontWeight: 600 }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      {!isTransfer && (
                        <div style={{ display: 'flex', gap: '0.6rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                          <button onClick={e => { e.stopPropagation(); openEdit(t); }} style={{ flex: 1, padding: '0.55rem', borderRadius: 10, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                            ✏️ Edit
                          </button>
                          <button onClick={e => { e.stopPropagation(); setDeleteConfirm(t.transactionID); }} style={{ flex: 1, padding: '0.55rem', borderRadius: 10, border: '1.5px solid #fecaca', background: '#fef2f2', color: '#ef4444', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <TransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchAll}
        accounts={accounts}
        categories={categories}
        initialType="expense"
      />

      {showEditModal && editingTransaction && (
        <div onClick={() => setShowEditModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#1e1b4b', fontWeight: 800 }}>Edit Transaction</h3>
              <button onClick={() => setShowEditModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1.4rem', lineHeight: 1, padding: 0 }}>✕</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Amount</label>
              <input
                type="text"
                placeholder="0.00"
                value={formatNumberInput(editData.amount)}
                onChange={e => {
                  const raw = parseNumberInput(e.target.value);
                  if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                    setEditData({ ...editData, amount: raw });
                  }
                }}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Category</label>
              <CategoryPicker
                categories={categories}
                transType={editingTransaction.status}
                selectedID={editData.categoryID ? parseInt(editData.categoryID) : null}
                onSelect={(cat) => {
                  setEditData({ ...editData, categoryID: cat.categoryID.toString() });
                  getCategories().then(setCategories).catch(() => {});
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Description</label>
              <input type="text" value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Date</label>
              <input type="date" value={editData.date} onChange={e => setEditData({ ...editData, date: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleEdit} disabled={submitting} style={{ flex: 2, padding: '0.8rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', color: 'white', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#1e1b4b' }}>Delete Transaction?</h3><p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 1rem' }}>This transaction will be permanently removed and your account balance will be reversed automatically.</p>
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '0.6rem 0.75rem', fontSize: '0.82rem', color: '#92400e', marginBottom: '1.25rem' }}>
         ⚠️ This cannot be undone.
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

export default Transactions;