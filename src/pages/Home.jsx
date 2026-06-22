import { useState, useEffect } from 'react';
import { getDashboardSummary, getCategories, getAccounts, createTransaction } from '../services/api';
import Layout from '../components/Layout';
import CategoryPicker from '../components/CategoryPicker';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';

const PIE_COLORS = ['#7c3aed', '#a78bfa', '#4c1d95', '#ddd6fe', '#6d28d9', '#c4b5fd'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const TYPE_COLORS = {
  income: { color: '#059669', bg: '#ecfdf5' },
  expense: { color: '#ef4444', bg: '#fef2f2' },
  transfer: { color: '#7c3aed', bg: '#f5f3ff' },
};

const ACTION_BUTTONS = [
  {
    type: 'income',
    label: 'Income',
    color: '#065f46',
    bg: 'white',
    border: '#d1fae5',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
      </svg>
    )
  },
  {
    type: 'expense',
    label: 'Expense',
    color: '#991b1b',
    bg: 'white',
    border: '#fecaca',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
      </svg>
    )
  },
  {
    type: 'transfer',
    label: 'Transfer',
    color: '#4c1d95',
    bg: 'white',
    border: '#ddd6fe',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    )
  },
];

function Home() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [trendMonths, setTrendMonths] = useState(6);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [transType, setTransType] = useState('income');
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currenciesCode: 'USD',
    description: '',
    date: new Date().toISOString().split('T')[0],
    accountID: '',
    categoryID: '',
    toAccountID: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [data, cats, accs] = await Promise.all([
          getDashboardSummary(trendMonths),
          getCategories(),
          getAccounts(),
        ]);
        setSummary(data);
        setCategories(cats);
        setAccounts(accs);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, selectedYear, trendMonths]);

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    const isCurrent = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    if (isCurrent) return;
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const resetForm = () => {
    setFormData({
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

  const handleSubmit = async () => {
    if (accounts.length === 0) {
      alert('You need to create an account first before adding transactions!');
      setShowModal(false);
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
        transType,
        amount: parseFloat(formData.amount),
        accountID: parseInt(formData.accountID),
        categoryID: formData.categoryID ? parseInt(formData.categoryID) : null,
        toAccountID: formData.toAccountID ? parseInt(formData.toAccountID) : null,
        date: new Date(formData.date).toISOString(),
      });
      setShowModal(false);
      resetForm();
      const data = await getDashboardSummary(trendMonths);
      setSummary(data);
    } catch (err) {
      alert(err.message || 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
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

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          Loading your dashboard...
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
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ===== MONTH NAVIGATOR ===== */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}>
          <button onClick={goToPrevMonth} style={{
            background: 'white',
            border: '1.5px solid #e5e7eb',
            borderRadius: 10,
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: 600,
            color: '#1e1b4b',
          }}>
            ← Prev
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1e1b4b' }}>
              {MONTHS[selectedMonth]} {selectedYear}
            </div>
            {isCurrentMonth && (
              <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>
                Current Month
              </div>
            )}
          </div>

          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            style={{
              background: isCurrentMonth ? '#f3f4f6' : 'white',
              border: '1.5px solid #e5e7eb',
              borderRadius: 10,
              padding: '0.5rem 1rem',
              cursor: isCurrentMonth ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              color: isCurrentMonth ? '#9ca3af' : '#1e1b4b',
            }}
          >
            Next →
          </button>
        </div>

        {/* ===== OVERVIEW CARD ===== */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)',
          borderRadius: 20,
          padding: '1.75rem',
          marginBottom: '1.5rem',
          color: 'white',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 2, marginBottom: '0.4rem' }}>
              Total Balance
            </div>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-1px' }}>
              ${summary.totalBalance.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.25rem' }}>
              Across all accounts
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', marginBottom: '1.25rem' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>
                ⬆ Income
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#86efac' }}>
                +${summary.monthIncome.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.2rem' }}>This month</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>
                ⬇ Expenses
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fca5a5' }}>
                -${summary.monthExpenses.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.2rem' }}>This month</div>
            </div>
          </div>
        </div>

        {/* ===== 3 ACTION BUTTONS ===== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}>
          {ACTION_BUTTONS.map((btn) => (
            <button
              key={btn.type}
              onClick={() => {
                setTransType(btn.type);
                resetForm();
                setShowModal(true);
              }}
              style={{
                background: btn.bg,
                border: `1.5px solid ${btn.border}`,
                borderRadius: 14,
                padding: '1.25rem 0.5rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: btn.border + '40',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {btn.icon}
              </div>
              <span style={{ fontWeight: 600, color: btn.color, fontSize: '0.82rem' }}>
                {btn.label}
              </span>
            </button>
          ))}
        </div>

        {/* ===== RECENT TRANSACTIONS ===== */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '1rem', fontWeight: 700 }}>
              Recent Transactions
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600, cursor: 'pointer' }}>
              View all →
            </span>
          </div>

          {summary.recentTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💸</div>
              No transactions yet
            </div>
          ) : (
            summary.recentTransactions.map((t, i) => (
              <div key={t.transactionID} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 0',
                borderBottom: i < summary.recentTransactions.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: TYPE_COLORS[t.transType]?.bg || '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {t.transType === 'income' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                      </svg>
                    ) : t.transType === 'expense' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                        <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '0.9rem' }}>
                      {t.description || t.transType}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                      {t.accountName} • {new Date(t.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: TYPE_COLORS[t.transType]?.color || '#374151',
                }}>
                  {t.transType === 'income' ? '+' : t.transType === 'expense' ? '-' : ''}
                  ${Math.abs(t.amount).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ===== EXPENSES BY CATEGORY ===== */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ margin: '0 0 1rem', color: '#1e1b4b', fontSize: '1rem', fontWeight: 700 }}>
            Expenses by Category
          </h3>
          {summary.expensesByCategory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              No expenses this month
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={summary.expensesByCategory}
                    dataKey="amount"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {summary.expensesByCategory.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ minWidth: 160 }}>
                {summary.expensesByCategory.map((cat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0,
                    }} />
                    <div style={{ fontSize: '0.82rem', color: '#374151' }}>
                      <span style={{ fontWeight: 600 }}>{cat.categoryName}</span>
                      <span style={{ color: '#9ca3af' }}> {cat.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ===== INCOME LIST ===== */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ margin: '0 0 1rem', color: '#1e1b4b', fontSize: '1rem', fontWeight: 700 }}>
            Income This Month
          </h3>
          {summary.monthIncomeList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
              No income recorded this month
            </div>
          ) : (
            <>
              {summary.monthIncomeList.map((item, i) => (
                <div key={item.transactionID} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0',
                  borderBottom: i < summary.monthIncomeList.length - 1 ? '1px solid #f3f4f6' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: '#ecfdf5', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '0.9rem' }}>
                        {item.description || 'Income'}
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                        {item.categoryName || 'Uncategorized'} • {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.95rem' }}>
                    +${item.amount.toFixed(2)}
                  </div>
                </div>
              ))}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '0.75rem 0 0', marginTop: '0.5rem',
                borderTop: '2px solid #f3f4f6',
              }}>
                <span style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '0.9rem' }}>Total</span>
                <span style={{ fontWeight: 800, color: '#059669', fontSize: '1rem' }}>
                  +${summary.monthIncome.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* ===== TREND CHART ===== */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '1rem', fontWeight: 700 }}>
              Trend Overview
            </h3>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[1, 3, 6, 12].map(m => (
                <button
                  key={m}
                  onClick={() => setTrendMonths(m)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    background: trendMonths === m ? '#1e1b4b' : '#f3f4f6',
                    color: trendMonths === m ? 'white' : '#6b7280',
                  }}
                >
                  {m}M
                </button>
              ))}
            </div>
          </div>
          <p style={{ margin: '0.25rem 0 1rem', color: '#9ca3af', fontSize: '0.8rem' }}>
            Income, expenses and balance over the last {trendMonths} month{trendMonths > 1 ? 's' : ''}
          </p>
          {summary.monthlyTrend.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
              Not enough data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={summary.monthlyTrend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: '0.85rem' }}
                  formatter={(value) => `$${Number(value).toFixed(2)}`}
                />
                <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
                <Line type="monotone" dataKey="income" stroke="#059669" strokeWidth={2.5} dot={{ fill: '#059669', r: 4 }} name="Income" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 4 }} name="Expenses" />
                <Line type="monotone" dataKey="balance" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 4 }} name="Balance" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* ===== TRANSACTION MODAL ===== */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
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
              maxWidth: 460,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ margin: '0 0 1.5rem', color: '#1e1b4b', fontWeight: 800, textTransform: 'capitalize' }}>
              New {transType}
            </h3>

            {/* Amount */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Amount</label>
              <input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* Account */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>
                {transType === 'transfer' ? 'From Account' : 'Account'}
              </label>
              <select
                value={formData.accountID}
                onChange={e => setFormData({ ...formData, accountID: e.target.value })}
                style={inputStyle}
              >
                <option value="">Select account...</option>
                {accounts
                  .filter(a => transType === 'transfer' ? a.accountType !== 'savings' : true)
                  .map(a => (
                    <option key={a.accountID} value={a.accountID}>
                      {a.name} — ${a.balance.toFixed(2)}
                    </option>
                  ))}
              </select>
            </div>

            {/* To Account — transfer only */}
            {transType === 'transfer' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>To Account</label>
                <select
                  value={formData.toAccountID}
                  onChange={e => setFormData({ ...formData, toAccountID: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Select destination...</option>
                  {accounts
                    .filter(a => a.accountID !== parseInt(formData.accountID) && a.accountType !== 'savings')
                    .map(a => (
                      <option key={a.accountID} value={a.accountID}>
                        {a.name} — ${a.balance.toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Category Picker — income/expense only */}
            {transType !== 'transfer' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>
                  Category
                  {selectedCategoryName && (
                    <span style={{ color: '#7c3aed', marginLeft: '0.5rem', fontWeight: 400, fontSize: '0.8rem' }}>
                      ✓ {selectedCategoryName}
                    </span>
                  )}
                </label>
                <CategoryPicker
                  categories={categories}
                  transType={transType}
                  selectedID={formData.categoryID ? parseInt(formData.categoryID) : null}
                  onSelect={(cat) => {
                    setFormData({ ...formData, categoryID: cat.categoryID.toString() });
                    setSelectedCategoryName(cat.name);
                    getCategories().then(setCategories).catch(() => {});
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
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* Date */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                style={inputStyle}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                style={{
                  flex: 1, padding: '0.8rem', borderRadius: 12,
                  border: '1.5px solid #e5e7eb', background: 'white',
                  color: '#374151', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 2, padding: '0.8rem', borderRadius: 12,
                  border: 'none',
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
      )}

    </Layout>
  );
}

export default Home;