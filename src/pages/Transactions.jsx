import { useState, useEffect } from 'react';
import { getTransactions, getAccounts, getCategories, createTransaction, deleteTransaction, updateTransaction } from '../services/api';
import Layout from '../components/Layout';
import CategoryPicker from '../components/CategoryPicker';

const TYPE_COLORS = {
  income: { color: '#059669', bg: '#ecfdf5', label: 'Income' },
  expense: { color: '#ef4444', bg: '#fef2f2', label: 'Expense' },
  transfer: { color: '#7c3aed', bg: '#f5f3ff', label: 'Transfer' },
};

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [formData, setFormData] = useState({
    status: 'income',
    amount: '',
    currenciesCode: 'USD',
    description: '',
    date: new Date().toISOString().split('T')[0],
    accountID: '',
    categoryID: '',
    toAccountID: '',
  });
  const [editData, setEditData] = useState({
    categoryID: '',
    amount: '',
    description: '',
    date: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [txns, accs, cats] = await Promise.all([
        getTransactions(),
        getAccounts(),
        getCategories(),
      ]);
      setTransactions(txns);
      setAccounts(accs);
      setCategories(cats);
    } catch (err) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => { await fetchAll(); };
    load();
  }, []);

  const handleAdd = async () => {
    if (accounts.length === 0) {
      alert('You need to create an account first before adding transactions!');
      setShowAddModal(false);
      return;
    }
    if (!formData.amount || !formData.accountID) {
      alert('Please fill in the amount and select an account.');
      return;
    }
    setSubmitting(true);
    try {
      await createTransaction({
        ...formData,
        amount: parseFloat(formData.amount),
        accountID: parseInt(formData.accountID),
        categoryID: formData.categoryID ? parseInt(formData.categoryID) : null,
        toAccountID: formData.toAccountID ? parseInt(formData.toAccountID) : null,
        date: new Date(formData.date).toISOString(),
      });
      setShowAddModal(false);
      resetForm();
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

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
    setShowEditModal(true);
  };

  const openDetail = (t) => {
    setSelectedTransaction(t);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      status: 'income',
      amount: '',
      currenciesCode: 'USD',
      description: '',
      date: new Date().toISOString().split('T')[0],
      accountID: '',
      categoryID: '',
      toAccountID: '',
    });
    setSelectedCategoryName('');
  };

  const getCategoryPath = (categoryID) => {
    if (!categoryID) return null;
    const cat = categories.find(c => c.categoryID === categoryID);
    if (!cat) return null;
    if (!cat.parentID) return cat.name;
    const parent = categories.find(c => c.categoryID === cat.parentID);
    if (!parent) return cat.name;
    if (!parent.parentID) return `${parent.name} › ${cat.name}`;
    const grandparent = categories.find(c => c.categoryID === parent.parentID);
    if (!grandparent) return `${parent.name} › ${cat.name}`;
    return `${grandparent.name} › ${parent.name} › ${cat.name}`;
  };

  const filtered = transactions
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => !search || (t.description || '').toLowerCase().includes(search.toLowerCase()));

  const totalIncome = transactions.filter(t => t.status === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.status === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const balance = totalIncome - totalExpenses;

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
          <button onClick={() => { resetForm(); setShowAddModal(true); }} style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', color: 'white', border: 'none', borderRadius: 12, padding: '0.7rem 1.25rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>+ Add Transaction</button>
        </div>

        {/* OVERVIEW */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)', borderRadius: 20, padding: '1.75rem', marginBottom: '1.5rem', color: 'white' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 2, marginBottom: '0.4rem' }}>Net Balance</div>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-1px' }}>${balance.toFixed(2)}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.25rem' }}>{transactions.length} transactions total</div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', marginBottom: '1.25rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>Income</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#86efac' }}>+${totalIncome.toFixed(2)}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.2rem' }}>{transactions.filter(t => t.status === 'income').length} entries</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>Expenses</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fca5a5' }}>-${totalExpenses.toFixed(2)}</div>
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

        {/* LIST */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💸</div>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>No transactions found</div>
              <div style={{ fontSize: '0.85rem' }}>Try changing your filter or add a new transaction</div>
            </div>
          ) : (
            filtered.map((t, i) => {
              const typeInfo = TYPE_COLORS[t.status] || TYPE_COLORS.income;
              const isTransfer = t.status === 'transfer';
              const categoryPath = getCategoryPath(t.categoryID);
              return (
                <div key={t.transactionID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                  onClick={() => openDetail(t)} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: typeInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {t.status === 'income' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                      ) : t.status === 'expense' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '0.9rem' }}>{categoryPath || t.description || typeInfo.label}</div>
                      <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ background: typeInfo.bg, color: typeInfo.color, padding: '0.1rem 0.5rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 600 }}>{typeInfo.label}</span>
                        {t.description && categoryPath && <span>{t.description} •</span>}
                        <span>{new Date(t.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: typeInfo.color, minWidth: 90, textAlign: 'right' }}>
                    {t.status === 'income' ? '+' : t.status === 'expense' ? '-' : ''}${Math.abs(t.amount).toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }} onClick={e => e.stopPropagation()}>
                    {!isTransfer && <button onClick={() => openEdit(t)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '0.45rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Edit</button>}
                    {!isTransfer && <button onClick={() => setDeleteConfirm(t.transactionID)} style={{ background: '#fef2f2', border: 'none', borderRadius: 8, padding: '0.45rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#ef4444' }}>Delete</button>}
                    {isTransfer && <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>transfer</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {showDetailModal && selectedTransaction && (
        <div onClick={() => setShowDetailModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 440, overflow: 'hidden' }}>
            <div style={{ background: TYPE_COLORS[selectedTransaction.status]?.bg || '#f3f4f6', padding: '2rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'white', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                {selectedTransaction.status === 'income' ? (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                ) : selectedTransaction.status === 'expense' ? (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                ) : (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                )}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: TYPE_COLORS[selectedTransaction.status]?.color }}>
                {selectedTransaction.status === 'income' ? '+' : selectedTransaction.status === 'expense' ? '-' : ''}${Math.abs(selectedTransaction.amount).toFixed(2)}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem', textTransform: 'capitalize' }}>{selectedTransaction.status}</div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {[
                { label: 'Category', value: getCategoryPath(selectedTransaction.categoryID) || 'Uncategorized' },
                { label: 'Description', value: selectedTransaction.description || '—' },
                { label: 'Date', value: new Date(selectedTransaction.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                { label: 'Time', value: new Date(selectedTransaction.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
                { label: 'Currency', value: selectedTransaction.currenciesCode || 'USD' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: i < 4 ? '1px solid #f3f4f6' : 'none' }}>
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontSize: '0.85rem', color: '#1e1b4b', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '0 1.5rem 1.5rem' }}>
              <button onClick={() => setShowDetailModal(false)} style={{ width: '100%', padding: '0.8rem', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1.5rem', color: '#1e1b4b', fontWeight: 800 }}>New Transaction</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Type</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['income', 'expense', 'transfer'].map(type => (
                  <button key={type} onClick={() => setFormData({ ...formData, status: type, categoryID: '' })}
                    style={{ flex: 1, padding: '0.6rem', borderRadius: 10, border: `2px solid ${formData.status === type ? TYPE_COLORS[type].color : '#e5e7eb'}`, background: formData.status === type ? TYPE_COLORS[type].bg : 'white', color: formData.status === type ? TYPE_COLORS[type].color : '#6b7280', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Amount</label>
              <input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>{formData.status === 'transfer' ? 'From Account' : 'Account'}</label>
              {accounts.length === 0 ? (
                <div style={{ background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#92400e', fontWeight: 500 }}>
                  ⚠️ No accounts found.{' '}
                  <span onClick={() => { setShowAddModal(false); window.location.href = '/accounts'; }} style={{ fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Create an account first →</span>
                </div>
              ) : (
                <select value={formData.accountID} onChange={e => setFormData({ ...formData, accountID: e.target.value })} style={inputStyle}>
                  <option value="">Select account...</option>
                  {accounts.filter(a => formData.status === 'transfer' ? a.accountType !== 'savings' : true).map(a => (
                    <option key={a.accountID} value={a.accountID}>{a.name} — ${a.balance.toFixed(2)}</option>
                  ))}
                </select>
              )}
            </div>

            {formData.status === 'transfer' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>To Account</label>
                <select value={formData.toAccountID} onChange={e => setFormData({ ...formData, toAccountID: e.target.value })} style={inputStyle}>
                  <option value="">Select destination...</option>
                  {accounts.filter(a => a.accountID !== parseInt(formData.accountID) && a.accountType !== 'savings').map(a => (
                    <option key={a.accountID} value={a.accountID}>{a.name} — ${a.balance.toFixed(2)}</option>
                  ))}
                </select>
              </div>
            )}

            {formData.status !== 'transfer' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>
                  Category
                  {selectedCategoryName && <span style={{ color: '#7c3aed', marginLeft: '0.5rem', fontWeight: 400, fontSize: '0.8rem' }}>✓ {selectedCategoryName}</span>}
                </label>
                <CategoryPicker
                  categories={categories}
                  transType={formData.status}
                  selectedID={formData.categoryID ? parseInt(formData.categoryID) : null}
                  onSelect={(cat) => {
                    setFormData({ ...formData, categoryID: cat.categoryID.toString() });
                    setSelectedCategoryName(cat.name);
                    getCategories().then(setCategories).catch(() => {});
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Description (optional)</label>
              <input type="text" placeholder="e.g. Salary payment, Grocery run..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Date</label>
              <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdd} disabled={submitting || !formData.amount || !formData.accountID} style={{ flex: 2, padding: '0.8rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', color: 'white', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Adding...' : 'Add Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingTransaction && (
        <div onClick={() => setShowEditModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1.5rem', color: '#1e1b4b', fontWeight: 800 }}>Edit Transaction</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Amount</label>
              <input type="number" value={editData.amount} onChange={e => setEditData({ ...editData, amount: e.target.value })} style={inputStyle} />
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

      {/* DELETE CONFIRM */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#1e1b4b' }}>Delete Transaction?</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>This will reverse the balance change on your account. This cannot be undone.</p>
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