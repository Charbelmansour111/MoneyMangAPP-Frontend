import { useState, useEffect, useMemo } from 'react';
import { getTransactions, getAccounts, getCategories } from '../services/api';
import Layout from '../components/Layout';
import TrendChart from '../components/TrendChart';
import ExpensePieChart from '../components/ExpensePieChart';
import TransactionModal from '../components/TransactionModal';
import { getCategoryIcon } from '../utils/categoryIcons';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const TYPE_COLORS = {
  income:   { color: '#059669', bg: '#ecfdf5' },
  expense:  { color: '#ef4444', bg: '#fef2f2' },
  transfer: { color: '#7c3aed', bg: '#f5f3ff' },
};

const ACTION_BUTTONS = [
  {
    type: 'income', label: 'Income', color: '#065f46', border: '#d1fae5',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  },
  {
    type: 'expense', label: 'Expense', color: '#991b1b', border: '#fecaca',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  },
  {
    type: 'transfer', label: 'Transfer', color: '#4c1d95', border: '#ddd6fe',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  },
];

// Icon shown next to a transaction: category emoji or type arrow
function TxIcon({ t, categories, size = 42 }) {
  const tc    = TYPE_COLORS[t.status] || TYPE_COLORS.income;
  const catID = t.categoryID ?? t.categoryId;
  const emoji = catID ? getCategoryIcon(categories, catID) : null;
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: emoji ? '1.2rem' : undefined }}>
      {emoji
        ? emoji
        : t.status === 'income'
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
          : t.status === 'expense'
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
      }
    </div>
  );
}

// Correct dollar formatting: -$50.00 not $-50.00
function fmtAmt(amount, sign = false) {
  const abs    = Math.abs(amount).toFixed(2);
  const prefix = sign ? (amount < 0 ? '-' : '+') : (amount < 0 ? '-' : '');
  return `${prefix}$${abs}`;
}

function Home() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth]       = useState(now.getMonth());
  const [selectedYear,  setSelectedYear]        = useState(now.getFullYear());
  const [trendMonths,   setTrendMonths]         = useState(6);
  const [allTransactions, setAllTransactions]   = useState([]);
  const [accounts,      setAccounts]            = useState([]);
  const [categories,    setCategories]          = useState([]);
  const [loading,       setLoading]             = useState(true);
  const [error,         setError]               = useState('');
  const [showModal,     setShowModal]           = useState(false);
  const [modalInitialType, setModalInitialType] = useState('expense');

  // Fetch everything once on mount; month navigation is pure client-side
  const fetchAll = async () => {
    try {
      const [txns, accs, cats] = await Promise.all([
        getTransactions(),
        getAccounts(),
        getCategories(),
      ]);
      setAllTransactions(txns);
      setAccounts(accs);
      setCategories(cats);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleModalSuccess = async () => {
    const [txns, accs] = await Promise.all([getTransactions(), getAccounts()]);
    setAllTransactions(txns);
    setAccounts(accs);
  };

  // ── Computed values (all client-side — no extra API calls on month change) ──

  // Compute balance from transactions so it always matches what's shown as income/expenses.
  // Using account.balance is unreliable because the backend may not update it for income.
  const totalBalance = useMemo(() => {
    const inc = allTransactions.filter(t => t.status === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
    const exp = allTransactions.filter(t => t.status === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    return inc - exp;
  }, [allTransactions]);

  const monthTxns = useMemo(
    () => allTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    }),
    [allTransactions, selectedMonth, selectedYear],
  );

  const monthIncome   = useMemo(() => monthTxns.filter(t => t.status === 'income').reduce((s, t) => s + Math.abs(t.amount), 0), [monthTxns]);
  const monthExpenses = useMemo(() => monthTxns.filter(t => t.status === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0), [monthTxns]);

  const recentTransactions = useMemo(
    () => [...monthTxns].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3),
    [monthTxns],
  );

  const monthIncomeList = useMemo(
    () => [...monthTxns.filter(t => t.status === 'income')].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [monthTxns],
  );

  const expensesByCategory = useMemo(() => {
    const map = {};
    monthTxns.filter(t => t.status === 'expense').forEach(t => {
      const catID = t.categoryID ?? t.categoryId;
      if (!catID) return;
      const cat = categories.find(c => String(c.categoryID) === String(catID));
      if (!cat) return;
      let root = cat;
      const seen = new Set();
      while (root.parentID != null) {
        if (seen.has(root.categoryID)) break;
        seen.add(root.categoryID);
        const p = categories.find(c => String(c.categoryID) === String(root.parentID));
        if (!p) break;
        root = p;
      }
      map[root.name] = (map[root.name] || 0) + Math.abs(t.amount);
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([categoryName, amount]) => ({ categoryName, amount, percentage: total > 0 ? Math.round((amount / total) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthTxns, categories]);

  // Trend is always anchored to "today", independent of the selected month
  const nowYear  = now.getFullYear();
  const nowMonth = now.getMonth();
  const monthlyTrend = useMemo(() => (
    Array.from({ length: trendMonths }, (_, i) => {
      const date  = new Date(nowYear, nowMonth - (trendMonths - 1 - i), 1);
      const m     = date.getMonth();
      const y     = date.getFullYear();
      const txns  = allTransactions.filter(t => { const d = new Date(t.date); return d.getMonth() === m && d.getFullYear() === y; });
      const inc   = txns.filter(t => t.status === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
      const exp   = txns.filter(t => t.status === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
      return { month: date.toLocaleString('default', { month: 'short' }), income: inc, expenses: exp, balance: inc - exp };
    })
  ), [allTransactions, trendMonths, nowYear, nowMonth]);

  const getCatName = (catID) => {
    if (!catID) return null;
    const cat = categories.find(c => String(c.categoryID) === String(catID));
    return cat?.name || null;
  };

  // ── Navigation ──────────────────────────────────────────────────────────────

  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const goToPrevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

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

  const balanceNeg = totalBalance < 0;

  return (
    <Layout>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* MONTH NAVIGATOR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <button onClick={goToPrevMonth} style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, color: '#1e1b4b' }}>← Prev</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1e1b4b' }}>{MONTHS[selectedMonth]} {selectedYear}</div>
            {isCurrentMonth && <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>Current Month</div>}
          </div>
          <button onClick={goToNextMonth} disabled={isCurrentMonth} style={{ background: isCurrentMonth ? '#f3f4f6' : 'white', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '0.5rem 1rem', cursor: isCurrentMonth ? 'not-allowed' : 'pointer', fontWeight: 600, color: isCurrentMonth ? '#9ca3af' : '#1e1b4b' }}>Next →</button>
        </div>

        {/* OVERVIEW CARD */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)', borderRadius: 20, padding: '1.75rem', marginBottom: '1.5rem', color: 'white' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 2, marginBottom: '0.4rem' }}>Current Balance</div>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-1px', color: balanceNeg ? '#fca5a5' : 'white' }}>
              {balanceNeg ? '-' : ''}${Math.abs(totalBalance).toFixed(2)}
            </div>
            {balanceNeg
              ? <div style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: '0.25rem', fontWeight: 600 }}>⚠️ Negative balance — check your accounts</div>
              : <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.25rem' }}>Across all accounts</div>
            }
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', marginBottom: '1.25rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>⬆ Income</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#86efac' }}>+${monthIncome.toFixed(2)}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.2rem' }}>{MONTHS[selectedMonth]}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>⬇ Expenses</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fca5a5' }}>-${monthExpenses.toFixed(2)}</div>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.2rem' }}>{MONTHS[selectedMonth]}</div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {ACTION_BUTTONS.map((btn) => (
            <button
              key={btn.type}
              onClick={() => { setModalInitialType(btn.type); setShowModal(true); }}
              style={{ background: 'white', border: `1.5px solid ${btn.border}`, borderRadius: 14, padding: '1.25rem 0.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              <div style={{ width: 46, height: 46, borderRadius: 12, background: btn.border + '40', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{btn.icon}</div>
              <span style={{ fontWeight: 600, color: btn.color, fontSize: '0.82rem' }}>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* RECENT TRANSACTIONS */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '1rem', fontWeight: 700 }}>Recent Transactions</h3>
            <span onClick={() => window.location.href = '/transactions'} style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 600, cursor: 'pointer' }}>View all →</span>
          </div>
          {recentTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💸</div>
              No transactions in {MONTHS[selectedMonth]}
            </div>
          ) : (
            recentTransactions.map((t, i) => {
              const tc      = TYPE_COLORS[t.status] || TYPE_COLORS.income;
              const catID   = t.categoryID ?? t.categoryId;
              const catName = getCatName(catID);
              const title   = catName || t.description || t.status;
              const sub     = t.description && catName && t.description !== catName ? t.description : null;
              return (
                <div key={t.transactionID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: i < recentTransactions.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <TxIcon t={t} categories={categories} />
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '0.9rem' }}>{title}</div>
                      <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{sub ? `${sub} • ` : ''}{new Date(t.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: tc.color }}>
                    {fmtAmt(t.amount, true)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* EXPENSES BY CATEGORY */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#1e1b4b', fontSize: '1rem', fontWeight: 700 }}>Expenses by Category — {MONTHS[selectedMonth]}</h3>
          <ExpensePieChart data={expensesByCategory} />
        </div>

        {/* INCOME LIST */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#1e1b4b', fontSize: '1rem', fontWeight: 700 }}>Income — {MONTHS[selectedMonth]}</h3>
          {monthIncomeList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
              No income recorded in {MONTHS[selectedMonth]}
            </div>
          ) : (
            <>
              {monthIncomeList.map((item, i) => {
                const catID   = item.categoryID ?? item.categoryId;
                const emoji   = catID ? getCategoryIcon(categories, catID) : null;
                const catName = getCatName(catID);
                const title   = catName || item.description || 'Income';
                const sub     = item.description && catName && item.description !== catName ? item.description : null;
                return (
                  <div key={item.transactionID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: i < monthIncomeList.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: emoji ? '1.2rem' : undefined }}>
                        {emoji ?? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '0.9rem' }}>{title}</div>
                        <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{sub ? `${sub} • ` : ''}{new Date(item.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.95rem' }}>+${Math.abs(item.amount).toFixed(2)}</div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0 0', marginTop: '0.5rem', borderTop: '2px solid #f3f4f6' }}>
                <span style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '0.9rem' }}>Total</span>
                <span style={{ fontWeight: 800, color: '#059669', fontSize: '1rem' }}>+${monthIncome.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {/* TREND CHART */}
        <TrendChart
          data={monthlyTrend}
          trendMonths={trendMonths}
          onTrendMonthsChange={setTrendMonths}
          loading={false}
        />
      </div>

      <TransactionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
        accounts={accounts}
        categories={categories}
        initialType={modalInitialType}
      />
    </Layout>
  );
}

export default Home;
