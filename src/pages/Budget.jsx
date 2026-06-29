/* eslint-disable */
import { useState, useEffect } from 'react';
import { getCategories, getTransactions, getBudgets, createBudget, updateBudget, deleteBudget } from '../services/api';
import Layout from '../components/Layout';
import { inputStyle, labelStyle } from '../utils/constants';
import { formatNumberInput, parseNumberInput } from '../utils/constants';
import { getRates, convert, getCurrencySymbol as getSymbol } from '../utils/exchangeRates';

const PERIOD_COLORS = {
  monthly: { color: '#7c3aed', bg: '#f5f3ff', label: 'Monthly' },
  weekly:  { color: '#059669', bg: '#ecfdf5', label: 'Weekly' },
  yearly:  { color: '#1d4ed8', bg: '#eff6ff', label: 'Yearly' },
};

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'LBP'];

function Budget() {
  const [budgets, setBudgets]           = useState([]);
  const [categories, setCategories]     = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const [rates, setRates]               = useState({});
  const [formData, setFormData]         = useState({
    categoryID: '', amount: '', period: 'monthly', description: '', currenciesCode: 'USD',
  });
  const [editData, setEditData]         = useState({
    amount: '', period: 'monthly', description: '', currenciesCode: 'USD',
  });

  useEffect(() => {
    getRates().then(setRates).catch(() => {});
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [budgetData, catData, txData] = await Promise.all([
        getBudgets(), getCategories(), getTransactions(),
      ]);
      setBudgets(budgetData);
      setCategories(catData);
      setTransactions(txData);
    } catch (err) {
      setError(err.message || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const cvt = (amount, from = 'USD') => convert(amount, from, displayCurrency, rates);

  const getSpent = (budget) => {
    const now = new Date();
    let start;
    if (budget.period === 'weekly') {
      start = new Date(now); start.setHours(0,0,0,0); start.setDate(start.getDate() - start.getDay());
    } else if (budget.period === 'yearly') {
      start = new Date(now.getFullYear(), 0, 1);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return transactions
      .filter(t => t.categoryID != null && String(t.categoryID) === String(budget.categoryID) && new Date(t.date) >= start && t.status === 'expense')
      .reduce((sum, t) => sum + cvt(Math.abs(t.amount), t.currenciesCode || 'USD'), 0);
  };

  const getCategoryName = (categoryID) => {
    const cat = categories.find(c => c.categoryID === categoryID);
    return cat ? cat.name : 'Unknown';
  };

  const handleAdd = async () => {
    if (!formData.categoryID || !formData.amount) { alert('Please fill in category and amount.'); return; }
    setSubmitting(true);
    try {
      await createBudget({
        categoryID: parseInt(formData.categoryID),
        amount: parseFloat(formData.amount),
        period: formData.period,
        description: formData.description,
        currenciesCode: formData.currenciesCode,
      });
      setShowAddModal(false);
      resetForm();
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to create budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    setSubmitting(true);
    try {
      await updateBudget(editingBudget.budgetID, {
        amount: parseFloat(editData.amount),
        period: editData.period,
        description: editData.description,
        currenciesCode: editData.currenciesCode,
      });
      setShowEditModal(false);
      setEditingBudget(null);
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to update budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBudget(id);
      setDeleteConfirm(null);
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to delete budget');
    }
  };

  const openEdit = (b) => {
    setEditingBudget(b);
    setEditData({ amount: b.amount.toString(), period: b.period, description: b.description || '', currenciesCode: b.currenciesCode || 'USD' });
    setShowEditModal(true);
  };

  const resetForm = () => setFormData({ categoryID: '', amount: '', period: 'monthly', description: '', currenciesCode: 'USD' });

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          Loading budget alerts...
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

  const totalBudget = budgets.reduce((s, b) => s + cvt(b.amount, b.currenciesCode || 'USD'), 0);
  const totalSpent  = budgets.reduce((s, b) => s + getSpent(b), 0);

  return (
    <Layout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1e1b4b' }}>Budget Alerts</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
              {budgets.length} active budget{budgets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', color: 'white', border: 'none', borderRadius: 12, padding: '0.7rem 1.25rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            + Add Budget
          </button>
        </div>

        {/* CURRENCY SELECTOR */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
          {SUPPORTED_CURRENCIES.map(c => (
            <button key={c} onClick={() => setDisplayCurrency(c)} style={{ padding: '0.3rem 0.8rem', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', background: displayCurrency === c ? '#1e1b4b' : '#f3f4f6', color: displayCurrency === c ? 'white' : '#6b7280' }}>
              {c}
            </button>
          ))}
        </div>

        {/* OVERVIEW CARD */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)', borderRadius: 20, padding: '1.75rem', marginBottom: '1.5rem', color: 'white' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 2, marginBottom: '0.4rem' }}>Total Budget</div>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-1px' }}>{getSymbol(displayCurrency)}{totalBudget.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.25rem' }}>
              {getSymbol(displayCurrency)}{totalSpent.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent · {getSymbol(displayCurrency)}{Math.max(0, totalBudget - totalSpent).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, height: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 999, width: `${Math.min(100, totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0)}%`, background: totalSpent > totalBudget ? '#ef4444' : '#86efac', transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>
            <span>0%</span>
            <span>{totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0}% used</span>
            <span>100%</span>
          </div>
        </div>

        {/* BUDGET LIST */}
        {budgets.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💰</div>
            <div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>No budgets yet</div>
            <div style={{ fontSize: '0.85rem' }}>Add a budget alert to start tracking your spending</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {budgets.map(b => {
              const spent      = getSpent(b);
              const budgetAmt  = cvt(b.amount, b.currenciesCode || 'USD');
              const pct        = budgetAmt > 0 ? Math.min(100, (spent / budgetAmt) * 100) : 0;
              const over       = spent > budgetAmt;
              const periodInfo = PERIOD_COLORS[b.period] || PERIOD_COLORS.monthly;

              return (
                <div key={b.budgetID} style={{ background: 'white', borderRadius: 16, border: `1.5px solid ${over ? '#fecaca' : '#e5e7eb'}`, padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '1rem' }}>{getCategoryName(b.categoryID)}</div>
                      {b.description && <div style={{ color: '#9ca3af', fontSize: '0.78rem', marginTop: 2 }}>{b.description}</div>}
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ background: periodInfo.bg, color: periodInfo.color, padding: '0.15rem 0.6rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600 }}>{periodInfo.label}</span>
                        <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '0.15rem 0.6rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600 }}>{b.currenciesCode || 'USD'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEdit(b)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Edit</button>
                      <button onClick={() => setDeleteConfirm(b.budgetID)} style={{ background: '#fef2f2', border: 'none', borderRadius: 8, padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#ef4444' }}>Delete</button>
                    </div>
                  </div>

                  <div style={{ background: '#f3f4f6', borderRadius: 999, height: 10, overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: over ? '#ef4444' : pct > 80 ? '#f97316' : pct > 60 ? '#f59e0b' : pct > 40 ? '#84cc16' : '#22c55e', transition: 'width 0.5s ease' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: over ? '#ef4444' : '#6b7280', fontWeight: 600 }}>
                      {over ? `⚠️ Over by ${getSymbol(displayCurrency)}${(spent - budgetAmt).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${getSymbol(displayCurrency)}${spent.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent`}
                    </span>
                    <span style={{ color: '#1e1b4b', fontWeight: 700 }}>
                      {getSymbol(displayCurrency)}{budgetAmt.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} budget · {Math.round(pct)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1.5rem', color: '#1e1b4b', fontWeight: 800 }}>New Budget Alert</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Category</label>
              <select value={formData.categoryID} onChange={e => setFormData({ ...formData, categoryID: e.target.value })} style={inputStyle}>
                <option value="">Select category...</option>
                {categories.filter(c => c.categoryType === 'expense').map(c => (
                  <option key={c.categoryID} value={c.categoryID}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Budget Currency</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {SUPPORTED_CURRENCIES.map(c => (
                  <button key={c} onClick={() => setFormData({ ...formData, currenciesCode: c })} style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', background: formData.currenciesCode === c ? '#1e1b4b' : '#f3f4f6', color: formData.currenciesCode === c ? 'white' : '#6b7280' }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Amount ({formData.currenciesCode})</label>
              <input type="text" placeholder="0.00" value={formatNumberInput(formData.amount)} onChange={e => { const raw = parseNumberInput(e.target.value); if (raw === '' || /^\d*\.?\d*$/.test(raw)) setFormData(p => ({ ...p, amount: raw })); }} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Period</label>
              <select value={formData.period} onChange={e => setFormData({ ...formData, period: e.target.value })} style={inputStyle}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Description (optional)</label>
              <input type="text" placeholder="e.g. Grocery budget" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdd} disabled={submitting} style={{ flex: 2, padding: '0.8rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', color: 'white', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Adding...' : 'Add Budget'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingBudget && (
        <div onClick={() => setShowEditModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1.5rem', color: '#1e1b4b', fontWeight: 800 }}>Edit Budget</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Budget Currency</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {SUPPORTED_CURRENCIES.map(c => (
                  <button key={c} onClick={() => setEditData({ ...editData, currenciesCode: c })} style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', background: editData.currenciesCode === c ? '#1e1b4b' : '#f3f4f6', color: editData.currenciesCode === c ? 'white' : '#6b7280' }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Amount ({editData.currenciesCode})</label>
              <input type="text" placeholder="0.00" value={formatNumberInput(editData.amount)} onChange={e => { const raw = parseNumberInput(e.target.value); if (raw === '' || /^\d*\.?\d*$/.test(raw)) setEditData(p => ({ ...p, amount: raw })); }} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Period</label>
              <select value={editData.period} onChange={e => setEditData({ ...editData, period: e.target.value })} style={inputStyle}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Description</label>
              <input type="text" value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} style={inputStyle} />
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
            <h3 style={{ margin: '0 0 0.5rem', color: '#1e1b4b' }}>Delete Budget?</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 1rem' }}>This budget alert will be removed. Your past transactions won't be affected but you'll no longer be tracked against this limit.</p>
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

export default Budget;