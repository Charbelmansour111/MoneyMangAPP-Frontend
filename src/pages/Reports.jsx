import { useState, useEffect, useMemo } from 'react';
import { getTransactions, getAccounts, getBudgets, getCategories } from '../services/api';
import Layout from '../components/Layout';
import ExpensePieChart from '../components/ExpensePieChart';
import TrendChart from '../components/TrendChart';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function Reports() {
  const now = new Date();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts]         = useState([]);
  const [budgets, setBudgets]           = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [startMonth, setStartMonth]     = useState(now.getMonth());
  const [startYear, setStartYear]       = useState(now.getFullYear());
  const [endMonth, setEndMonth]         = useState(now.getMonth());
  const [endYear, setEndYear]           = useState(now.getFullYear());
  const [activeTab, setActiveTab]       = useState('all');
  const [insight, setInsight]           = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [txns, accs, buds, cats] = await Promise.all([
          getTransactions(),
          getAccounts(),
          getBudgets(),
          getCategories(),
        ]);
        setTransactions(txns);
        setAccounts(accs);
        setBudgets(buds);
        setCategories(cats);
      } catch (err) {
        setError(err.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Filter transactions by selected date range
  const filteredTxns = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      const m = d.getUTCMonth();
      const y = d.getUTCFullYear();
      const start = y > startYear || (y === startYear && m >= startMonth);
      const end   = y < endYear   || (y === endYear   && m <= endMonth);
      return start && end;
    });
  }, [transactions, startMonth, startYear, endMonth, endYear]);

  const incomeTxns   = useMemo(() => filteredTxns.filter(t => t.status === 'income'), [filteredTxns]);
  const expenseTxns  = useMemo(() => filteredTxns.filter(t => t.status === 'expense'), [filteredTxns]);
  const transferTxns = useMemo(() => filteredTxns.filter(t => t.status === 'transfer'), [filteredTxns]);

  const totalIncome   = useMemo(() => incomeTxns.reduce((s, t) => s + Math.abs(t.amount), 0), [incomeTxns]);
  const totalExpenses = useMemo(() => expenseTxns.reduce((s, t) => s + Math.abs(t.amount), 0), [expenseTxns]);
  const netBalance    = totalIncome - totalExpenses;
  const savingsRate   = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : 0;

  const expensesByCategory = useMemo(() => {
    const map = {};
    expenseTxns.forEach(t => {
      const key = t.categoryName || 'Uncategorized';
      map[key] = (map[key] || 0) + Math.abs(t.amount);
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([categoryName, amount]) => ({
        categoryName,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenseTxns]);

  // ── Business Logic Analysis ──────────────────────────────────────────────
  const analyzeFinances = () => {
    const insights = [];

    // 1. Savings rate analysis
    if (totalIncome === 0) {
      insights.push({ type: 'warning', icon: '⚠️', title: 'No Income Recorded', message: 'You have no income recorded in this period. Add your income transactions to get a full picture.' });
    } else if (savingsRate < 0) {
      insights.push({ type: 'danger', icon: '🚨', title: 'Spending More Than You Earn', message: `You spent $${Math.abs(netBalance).toFixed(2)} more than you earned. You need to reduce expenses immediately.` });
    } else if (savingsRate < 10) {
      insights.push({ type: 'warning', icon: '⚠️', title: 'Low Savings Rate', message: `You are only saving ${savingsRate}% of your income. Financial experts recommend saving at least 20%. Try cutting your top expense category.` });
    } else if (savingsRate < 20) {
      insights.push({ type: 'info', icon: '📊', title: 'Moderate Savings Rate', message: `You are saving ${savingsRate}% of your income. Good progress — try to reach 20% by reducing discretionary spending.` });
    } else {
      insights.push({ type: 'success', icon: '🎯', title: 'Excellent Savings Rate', message: `You are saving ${savingsRate}% of your income. Great financial discipline! Keep it up.` });
    }

    // 2. Top spending category
    if (expensesByCategory.length > 0) {
      const top = expensesByCategory[0];
      const topPct = totalExpenses > 0 ? ((top.amount / totalExpenses) * 100).toFixed(0) : 0;
      if (topPct > 50) {
        insights.push({ type: 'warning', icon: '💸', title: `High Spending on ${top.categoryName}`, message: `${top.categoryName} takes up ${topPct}% of your total expenses ($${top.amount.toFixed(2)}). Consider if all these expenses are necessary.` });
      } else {
        insights.push({ type: 'info', icon: '📂', title: `Top Category: ${top.categoryName}`, message: `Your highest expense category is ${top.categoryName} at $${top.amount.toFixed(2)} (${topPct}% of expenses). This looks balanced.` });
      }
    }

    // 3. Budget performance
    if (budgets.length > 0) {
      const overBudget = budgets.filter(b => {
        const spent = expenseTxns
          .filter(t => String(t.categoryID) === String(b.categoryID))
          .reduce((s, t) => s + Math.abs(t.amount), 0);
        return spent > b.amount;
      });

      if (overBudget.length === 0) {
        insights.push({ type: 'success', icon: '✅', title: 'All Budgets On Track', message: `You are within budget on all ${budgets.length} budget categories. Excellent financial control!` });
      } else {
        const names = overBudget.map(b => {
          const cat = categories.find(c => c.categoryID === b.categoryID);
          return cat?.name || 'Unknown';
        }).join(', ');
        insights.push({ type: 'danger', icon: '🔴', title: `Over Budget on ${overBudget.length} Category${overBudget.length > 1 ? 'ies' : 'y'}`, message: `You exceeded your budget on: ${names}. Review these categories and adjust your spending or budget limits.` });
      }
    }

    // 4. Transaction frequency
    const avgPerDay = filteredTxns.length / 30;
    if (avgPerDay > 5) {
      insights.push({ type: 'warning', icon: '🔁', title: 'High Transaction Frequency', message: `You average ${avgPerDay.toFixed(1)} transactions per day. High frequency spending can lead to losing track of your money. Consider consolidating purchases.` });
    }

    // 5. Irregular large expenses
    const avgExpense = totalExpenses / (expenseTxns.length || 1);
    const largeExpenses = expenseTxns.filter(t => Math.abs(t.amount) > avgExpense * 3);
    if (largeExpenses.length > 0) {
      insights.push({ type: 'info', icon: '🔍', title: `${largeExpenses.length} Large Unusual Expense${largeExpenses.length > 1 ? 's' : ''} Detected`, message: `You have ${largeExpenses.length} transaction${largeExpenses.length > 1 ? 's' : ''} that ${largeExpenses.length > 1 ? 'are' : 'is'} significantly higher than your average expense of $${avgExpense.toFixed(2)}. Review if these were necessary.` });
    }

    // 6. No expense categories
    const uncategorized = expenseTxns.filter(t => !t.categoryName).length;
    if (uncategorized > 0) {
      insights.push({ type: 'info', icon: '🏷️', title: `${uncategorized} Uncategorized Expense${uncategorized > 1 ? 's' : ''}`, message: `${uncategorized} expense${uncategorized > 1 ? 's are' : ' is'} missing a category. Adding categories helps you understand your spending better.` });
    }

    // 7. Income diversity
    const incomeSources = [...new Set(incomeTxns.map(t => t.categoryName || t.description))].length;
    if (incomeSources === 1) {
      insights.push({ type: 'info', icon: '💼', title: 'Single Income Source', message: 'All your income comes from one source. Consider diversifying your income streams for financial security.' });
    } else if (incomeSources > 2) {
      insights.push({ type: 'success', icon: '💰', title: 'Diversified Income', message: `You have ${incomeSources} different income sources. Excellent financial diversity!` });
    }

    setInsight(insights);
  };

  // ── Export CSV ───────────────────────────────────────────────────────────
  const exportCSV = (data, filename) => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const rows = data.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.status,
      t.categoryName || '',
      t.description || '',
      `${t.status === 'income' ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}`,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayedTxns = activeTab === 'all' ? filteredTxns
    : activeTab === 'income'   ? incomeTxns
    : activeTab === 'expense'  ? expenseTxns
    : transferTxns;

  const inputStyle = {
    border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.75rem',
    fontSize: '0.85rem', background: 'white', color: '#1e1b4b', outline: 'none',
  };

  const insightColors = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' },
    warning: { bg: '#fef3c7', border: '#fcd34d', color: '#92400e' },
    danger:  { bg: '#fef2f2', border: '#fecaca', color: '#991b1b' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af' },
  };

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          Loading reports...
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
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1e1b4b' }}>Reports</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
              {filteredTxns.length} transactions in selected period
            </p>
          </div>
          <button
            onClick={() => exportCSV(filteredTxns, `CozyCoin_Report_${MONTHS[startMonth]}_${startYear}.csv`)}
            style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '0.6rem 1rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            ⬇️ Export CSV
          </button>
        </div>

        {/* DATE RANGE SELECTOR */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: '#374151', fontSize: '0.85rem' }}>From:</span>
          <select value={startMonth} onChange={e => setStartMonth(parseInt(e.target.value))} style={inputStyle}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={startYear} onChange={e => setStartYear(parseInt(e.target.value))} style={inputStyle}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <span style={{ fontWeight: 600, color: '#374151', fontSize: '0.85rem' }}>To:</span>
          <select value={endMonth} onChange={e => setEndMonth(parseInt(e.target.value))} style={inputStyle}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={endYear} onChange={e => setEndYear(parseInt(e.target.value))} style={inputStyle}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* OVERVIEW CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Income',   value: `+$${totalIncome.toFixed(2)}`,   color: '#059669', bg: '#ecfdf5', border: '#d1fae5' },
            { label: 'Total Expenses', value: `-$${totalExpenses.toFixed(2)}`,  color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
            { label: 'Net Balance',    value: `${netBalance >= 0 ? '+' : '-'}$${Math.abs(netBalance).toFixed(2)}`, color: netBalance >= 0 ? '#059669' : '#ef4444', bg: netBalance >= 0 ? '#ecfdf5' : '#fef2f2', border: netBalance >= 0 ? '#d1fae5' : '#fecaca' },
            { label: 'Savings Rate',   value: `${savingsRate}%`,               color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
          ].map(card => (
            <div key={card.label} style={{ background: card.bg, borderRadius: 14, border: `1.5px solid ${card.border}`, padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.5rem' }}>{card.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* ANALYZE BUTTON + INSIGHTS */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: insight ? '1.25rem' : 0 }}>
            <div>
              <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '1rem', fontWeight: 700 }}>📊 Financial Analysis</h3>
              <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.82rem' }}>Get insights about your spending habits</p>
            </div>
            <button
              onClick={analyzeFinances}
              style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', color: 'white', border: 'none', borderRadius: 12, padding: '0.7rem 1.25rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              🔍 Analyze
            </button>
          </div>

          {insight && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {insight.map((ins, i) => {
                const c = insightColors[ins.type];
                return (
                  <div key={i} style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{ins.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: c.color, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{ins.title}</div>
                      <div style={{ color: '#374151', fontSize: '0.85rem', lineHeight: 1.5 }}>{ins.message}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CHARTS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#1e1b4b', fontSize: '1rem', fontWeight: 700 }}>Expenses by Category</h3>
            <ExpensePieChart data={expensesByCategory} />
          </div>

          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#1e1b4b', fontSize: '1rem', fontWeight: 700 }}>Category Breakdown</h3>
            {expensesByCategory.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No expenses in this period</div>
            ) : (
              expensesByCategory.map((cat, i) => (
                <div key={i} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{cat.categoryName}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444' }}>${cat.amount.toFixed(2)} ({cat.percentage}%)</span>
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 999, width: `${cat.percentage}%`, background: '#ef4444', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TRANSACTION TABLE */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '1rem', fontWeight: 700 }}>Transaction History</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['all', 'income', 'expense', 'transfer'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ padding: '0.35rem 0.75rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', background: activeTab === tab ? '#1e1b4b' : '#f3f4f6', color: activeTab === tab ? 'white' : '#6b7280', textTransform: 'capitalize' }}
                >
                  {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {displayedTxns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No transactions found</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                    {['Date', 'Type', 'Category', 'Description', 'Amount'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.75rem', color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...displayedTxns].sort((a, b) => new Date(b.date) - new Date(a.date)).map((t, i) => (
                    <tr key={t.transactionID} style={{ borderBottom: i < displayedTxns.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#6b7280' }}>{new Date(t.date).toLocaleDateString()}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <span style={{
                          background: t.status === 'income' ? '#ecfdf5' : t.status === 'expense' ? '#fef2f2' : '#f5f3ff',
                          color: t.status === 'income' ? '#059669' : t.status === 'expense' ? '#ef4444' : '#7c3aed',
                          padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize'
                        }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#374151' }}>{t.categoryName || '—'}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#6b7280' }}>{t.description || '—'}</td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: t.status === 'income' ? '#059669' : t.status === 'expense' ? '#ef4444' : '#7c3aed' }}>
                        {t.status === 'income' ? '+' : t.status === 'expense' ? '-' : ''}${Math.abs(t.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #f3f4f6' }}>
                    <td colSpan={4} style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#1e1b4b' }}>Total</td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 800, color: netBalance >= 0 ? '#059669' : '#ef4444' }}>
                      {netBalance >= 0 ? '+' : '-'}${Math.abs(netBalance).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* SUMMARY STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Income Transactions',   value: incomeTxns.length,   color: '#059669', bg: '#ecfdf5' },
            { label: 'Expense Transactions',  value: expenseTxns.length,  color: '#ef4444', bg: '#fef2f2' },
            { label: 'Transfer Transactions', value: transferTxns.length, color: '#7c3aed', bg: '#f5f3ff' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.5rem' }}>{s.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}

export default Reports;