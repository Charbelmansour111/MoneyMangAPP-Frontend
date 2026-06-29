/* eslint-disable */
import { useState, useEffect, useMemo } from 'react';
import { getTransactions, getAccounts, getBudgets, getCategories } from '../services/api';
import Layout from '../components/Layout';
import ExpensePieChart from '../components/ExpensePieChart';
import { getRates, convert, getCurrencySymbol as getSymbol } from '../utils/exchangeRates';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const PIE_COLORS = [
  '#7c3aed','#ef4444','#059669','#f59e0b','#3b82f6',
  '#ec4899','#14b8a6','#f97316','#84cc16','#06b6d4',
];

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'LBP'];

function Reports() {
  const now = new Date();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts]         = useState([]);
  const [budgets, setBudgets]           = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [rates, setRates]               = useState({});
  const [displayCurrency, setDisplayCurrency] = useState('USD');

  const [startMonth, setStartMonth]     = useState(now.getMonth());
  const [startYear, setStartYear]       = useState(now.getFullYear());
  const [endMonth, setEndMonth]         = useState(now.getMonth());
  const [endYear, setEndYear]           = useState(now.getFullYear());
  const [appliedStart, setAppliedStart] = useState({ month: now.getMonth(), year: now.getFullYear() });
  const [appliedEnd, setAppliedEnd]     = useState({ month: now.getMonth(), year: now.getFullYear() });

  const [activeTab, setActiveTab]               = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [calendarMonth, setCalendarMonth]       = useState(now.getMonth());
  const [calendarYear, setCalendarYear]         = useState(now.getFullYear());
  const [selectedDay, setSelectedDay]           = useState(null);
  const [expandedAccount, setExpandedAccount]   = useState(null);
  const [calendarDayTxns, setCalendarDayTxns]   = useState([]);

  useEffect(() => {
    getRates().then(setRates).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [txns, accs, buds, cats] = await Promise.all([
          getTransactions(), getAccounts(), getBudgets(), getCategories(),
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

  const cvt = (amount, from = 'USD') => convert(amount, from, displayCurrency, rates);

  const applyFilter = () => {
    setAppliedStart({ month: startMonth, year: startYear });
    setAppliedEnd({ month: endMonth, year: endYear });
    setSelectedDay(null);
    setCalendarDayTxns([]);
  };

  // All transactions ever (for total balance)
  const allIncome   = useMemo(() => transactions.filter(t => t.status === 'income').reduce((s, t) => s + cvt(Math.abs(t.amount), t.currenciesCode || 'USD'), 0), [transactions, displayCurrency, rates]);
  const allExpenses = useMemo(() => transactions.filter(t => t.status === 'expense').reduce((s, t) => s + cvt(Math.abs(t.amount), t.currenciesCode || 'USD'), 0), [transactions, displayCurrency, rates]);
  const totalBalance = allIncome - allExpenses;

  // Account balances converted
  const totalAccountBalance = useMemo(() =>
    accounts.reduce((s, a) => s + cvt(a.balance, a.currenciesCode || 'USD'), 0),
  [accounts, displayCurrency, rates]);

  const filteredTxns = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date);
    const m = d.getUTCMonth(), y = d.getUTCFullYear();
    const start = y > appliedStart.year || (y === appliedStart.year && m >= appliedStart.month);
    const end   = y < appliedEnd.year   || (y === appliedEnd.year   && m <= appliedEnd.month);
    return start && end;
  }), [transactions, appliedStart, appliedEnd]);

  const incomeTxns   = useMemo(() => filteredTxns.filter(t => t.status === 'income'), [filteredTxns]);
  const expenseTxns  = useMemo(() => filteredTxns.filter(t => t.status === 'expense'), [filteredTxns]);
  const transferTxns = useMemo(() => filteredTxns.filter(t => t.status === 'transfer'), [filteredTxns]);

  const totalIncome   = useMemo(() => incomeTxns.reduce((s, t) => s + cvt(Math.abs(t.amount), t.currenciesCode || 'USD'), 0), [incomeTxns, displayCurrency, rates]);
  const totalExpenses = useMemo(() => expenseTxns.reduce((s, t) => s + cvt(Math.abs(t.amount), t.currenciesCode || 'USD'), 0), [expenseTxns, displayCurrency, rates]);
  const periodBalance = totalIncome - totalExpenses;

  const expensesByCategory = useMemo(() => {
    const map = {};
    expenseTxns.forEach(t => {
      const key = t.categoryName || 'Uncategorized';
      map[key] = (map[key] || 0) + cvt(Math.abs(t.amount), t.currenciesCode || 'USD');
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([categoryName, amount]) => ({ categoryName, amount, percentage: total > 0 ? Math.round((amount / total) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenseTxns, displayCurrency, rates]);

  const displayedTxns = useMemo(() => {
    let base = activeTab === 'all' ? filteredTxns : activeTab === 'income' ? incomeTxns : activeTab === 'expense' ? expenseTxns : transferTxns;
    if (selectedDay) {
      base = base.filter(t => {
        const d = new Date(t.date);
        return d.getDate() === selectedDay && d.getMonth() === calendarMonth && d.getFullYear() === calendarYear;
      });
    }
    return [...base].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredTxns, incomeTxns, expenseTxns, transferTxns, activeTab, selectedDay, calendarMonth, calendarYear]);

  const daysWithTxns = useMemo(() => {
    const set = new Set();
    filteredTxns.forEach(t => {
      const d = new Date(t.date);
      if (d.getMonth() === calendarMonth && d.getFullYear() === calendarYear) set.add(d.getDate());
    });
    return set;
  }, [filteredTxns, calendarMonth, calendarYear]);

  const handleDayClick = (day) => {
    if (selectedDay === day) {
      setSelectedDay(null);
      setCalendarDayTxns([]);
      return;
    }
    setSelectedDay(day);
    const dayT = filteredTxns.filter(t => {
      const d = new Date(t.date);
      return d.getDate() === day && d.getMonth() === calendarMonth && d.getFullYear() === calendarYear;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
    setCalendarDayTxns(dayT);
  };

  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m, y) => new Date(y, m, 1).getDay();

  const fmtAmt = (amount, currency = 'USD') =>
    `${getSymbol(currency)}${Math.abs(amount).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fmtCvt = (amount, from = 'USD') =>
    `${getSymbol(displayCurrency)}${Math.abs(cvt(amount, from)).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const exportCSV = () => {
    let csv = `CozyCoin Financial Report\nGenerated: ${new Date().toLocaleDateString()}\nPeriod: ${MONTHS[appliedStart.month]} ${appliedStart.year} - ${MONTHS[appliedEnd.month]} ${appliedEnd.year}\nDisplay Currency: ${displayCurrency}\n\n`;
    csv += `SUMMARY\n`;
    csv += `"Metric","Original","In ${displayCurrency}"\n`;
    csv += `"Total Income","—","${getSymbol(displayCurrency)}${totalIncome.toFixed(2)}"\n`;
    csv += `"Total Expenses","—","${getSymbol(displayCurrency)}${totalExpenses.toFixed(2)}"\n`;
    csv += `"This Period Balance","—","${getSymbol(displayCurrency)}${periodBalance.toFixed(2)}"\n`;
    csv += `"Total Account Balance","—","${getSymbol(displayCurrency)}${totalAccountBalance.toFixed(2)}"\n\n`;

    csv += `ACCOUNTS\n`;
    csv += `"Account","Type","Currency","Current Balance","Balance in ${displayCurrency}"\n`;
    accounts.forEach(a => {
      csv += `"${a.name}","${a.accountType}","${a.currenciesCode}","${getSymbol(a.currenciesCode)}${a.balance.toFixed(2)}","${fmtCvt(a.balance, a.currenciesCode)}"\n`;
    });
    csv += '\n';

    [{ label: 'INCOME', data: incomeTxns }, { label: 'EXPENSES', data: expenseTxns }, { label: 'TRANSFERS', data: transferTxns }].forEach(sec => {
      csv += `${sec.label}\n`;
      csv += `"Date","Category","Sub-Category","Description","Original Currency","Original Amount","Amount in ${displayCurrency}"\n`;
      sec.data.forEach(t => {
        const orig = `${t.status==='income'?'+':t.status==='expense'?'-':''}${getSymbol(t.currenciesCode||'USD')}${Math.abs(t.amount).toFixed(2)}`;
        const converted = `${t.status==='income'?'+':t.status==='expense'?'-':''}${fmtCvt(t.amount, t.currenciesCode||'USD')}`;
        csv += [new Date(t.date).toLocaleDateString(), t.categoryName||'', t.subCategoryName||'', t.description||'', t.currenciesCode||'USD', orig, converted].map(v => `"${v}"`).join(',') + '\n';
      });
      csv += '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `CozyCoin_${MONTHS[appliedStart.month]}_${appliedStart.year}.csv` });
    a.click();
  };

  const exportPDF = () => {
    const accountsHTML = accounts.map(acc => {
      const accTxns = filteredTxns.filter(t => t.accountID === acc.accountID || t.toAccountID === acc.accountID).sort((a,b) => new Date(b.date)-new Date(a.date));
      const accIncome = accTxns.filter(t => t.status==='income').reduce((s,t) => s+cvt(Math.abs(t.amount), t.currenciesCode||'USD'), 0);
      const accExpense = accTxns.filter(t => t.status==='expense').reduce((s,t) => s+cvt(Math.abs(t.amount), t.currenciesCode||'USD'), 0);
      return `
        <div style="margin-top:1.5rem;border:1.5px solid #ddd6fe;border-radius:10px;overflow:hidden">
          <div style="background:#f5f3ff;padding:0.75rem 1rem;border-bottom:1px solid #ddd6fe">
            <strong style="color:#4c1d95">${acc.name}</strong>
            <span style="color:#9ca3af;font-size:0.8rem;margin-left:0.5rem">${acc.currenciesCode} · ${acc.accountType}</span>
            <span style="float:right;font-weight:700;color:#4c1d95">${getSymbol(acc.currenciesCode)}${acc.balance.toLocaleString('en',{minimumFractionDigits:2})}</span>
          </div>
          <div style="padding:0.75rem 1rem;display:flex;gap:2rem;font-size:0.85rem">
            <span style="color:#059669;font-weight:600">↑ Income: ${getSymbol(displayCurrency)}${accIncome.toFixed(2)}</span>
            <span style="color:#ef4444;font-weight:600">↓ Expenses: ${getSymbol(displayCurrency)}${accExpense.toFixed(2)}</span>
            <span style="color:${(accIncome-accExpense)>=0?'#059669':'#ef4444'};font-weight:700">Period: ${(accIncome-accExpense)>=0?'+':'-'}${getSymbol(displayCurrency)}${Math.abs(accIncome-accExpense).toFixed(2)}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:0.8rem">
            <tr style="background:#f5f3ff"><th style="padding:0.4rem 0.6rem;text-align:left;color:#7c3aed">Date</th><th style="color:#7c3aed">Type</th><th style="color:#7c3aed">Category</th><th style="color:#7c3aed">Description</th><th style="color:#7c3aed">Original</th><th style="color:#7c3aed">In ${displayCurrency}</th></tr>
            ${accTxns.map(t => `
              <tr style="border-bottom:1px solid #f3f4f6">
                <td style="padding:0.4rem 0.6rem">${new Date(t.date).toLocaleDateString()}</td>
                <td><span style="color:${t.status==='income'?'#059669':t.status==='expense'?'#ef4444':'#7c3aed'};font-weight:600">${t.status}</span></td>
                <td>${t.categoryName||'—'}</td>
                <td style="color:#6b7280">${t.description||'—'}</td>
                <td style="font-weight:600">${t.status==='income'?'+':t.status==='expense'?'-':''}${getSymbol(t.currenciesCode||'USD')}${Math.abs(t.amount).toFixed(2)} ${t.currenciesCode||'USD'}</td>
                <td style="font-weight:700;color:${t.status==='income'?'#059669':t.status==='expense'?'#ef4444':'#7c3aed'}">${t.status==='income'?'+':t.status==='expense'?'-':''}${fmtCvt(t.amount, t.currenciesCode||'USD')}</td>
              </tr>`).join('')}
            <tr style="background:#f5f3ff;font-weight:700">
              <td colspan="5" style="padding:0.4rem 0.6rem;color:#4c1d95">Account Period Total</td>
              <td style="color:${(accIncome-accExpense)>=0?'#059669':'#ef4444'}">${(accIncome-accExpense)>=0?'+':'-'}${getSymbol(displayCurrency)}${Math.abs(accIncome-accExpense).toFixed(2)}</td>
            </tr>
          </table>
        </div>`;
    }).join('');

    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>CozyCoin Report</title>
      <style>
        body{font-family:Arial,sans-serif;padding:2rem;color:#1e1b4b;max-width:950px;margin:0 auto}
        h1{color:#4c1d95;border-bottom:3px solid #7c3aed;padding-bottom:0.75rem;margin-bottom:1rem}
        h2{color:#4c1d95;margin-top:2rem;margin-bottom:0.75rem;font-size:1.1rem}
        table{width:100%;border-collapse:collapse;font-size:0.85rem;margin-top:0.5rem}
        th{background:#7c3aed;color:white;padding:0.6rem 0.75rem;text-align:left;font-size:0.8rem}
        td{padding:0.5rem 0.75rem;border-bottom:1px solid #f3f4f6}
        .summary-card{display:inline-block;background:#f5f3ff;border:1.5px solid #ddd6fe;border-radius:8px;padding:0.75rem 1.25rem;margin:0.4rem;text-align:center}
        .summary-card .label{font-size:0.7rem;color:#9ca3af;text-transform:uppercase;letter-spacing:1px}
        .summary-card .value{font-size:1.1rem;font-weight:800;margin-top:0.2rem}
        .footer{margin-top:2rem;text-align:center;color:#9ca3af;font-size:0.8rem;border-top:1px solid #f3f4f6;padding-top:1rem}
      </style></head><body>
      <h1>💰 CozyCoin Financial Report</h1>
      <p style="color:#6b7280;margin-bottom:0.25rem">Period: <strong style="color:#4c1d95">${MONTHS[appliedStart.month]} ${appliedStart.year} — ${MONTHS[appliedEnd.month]} ${appliedEnd.year}</strong></p>
      <p style="color:#6b7280;margin-top:0">All amounts shown in <strong style="color:#7c3aed">${displayCurrency}</strong> · Generated: ${new Date().toLocaleDateString()}</p>

      <h2>Summary</h2>
      <div>
        <div class="summary-card"><div class="label">Total Income</div><div class="value" style="color:#059669">+${getSymbol(displayCurrency)}${totalIncome.toFixed(2)}</div></div>
        <div class="summary-card"><div class="label">Total Expenses</div><div class="value" style="color:#ef4444">-${getSymbol(displayCurrency)}${totalExpenses.toFixed(2)}</div></div>
        <div class="summary-card"><div class="label">This Period Balance</div><div class="value" style="color:${periodBalance>=0?'#059669':'#ef4444'}">${periodBalance>=0?'+':'-'}${getSymbol(displayCurrency)}${Math.abs(periodBalance).toFixed(2)}</div></div>
        <div class="summary-card"><div class="label">Total Account Balance</div><div class="value" style="color:#7c3aed">${getSymbol(displayCurrency)}${totalAccountBalance.toFixed(2)}</div></div>
      </div>

      <h2>Expense Breakdown by Category</h2>
      <table>
        <tr><th>Category</th><th>Amount in ${displayCurrency}</th><th>% of Expenses</th><th>Transactions</th></tr>
        ${expensesByCategory.map(c => {
          const catTxns = expenseTxns.filter(t => (t.categoryName||'Uncategorized') === c.categoryName);
          return `<tr><td>${c.categoryName}</td><td style="color:#ef4444;font-weight:700">${getSymbol(displayCurrency)}${c.amount.toFixed(2)}</td><td>${c.percentage}%</td><td>${catTxns.length}</td></tr>`;
        }).join('')}
      </table>

      <h2>Accounts</h2>
      <table>
        <tr><th>Account</th><th>Type</th><th>Currency</th><th>Balance</th><th>Balance in ${displayCurrency}</th></tr>
        ${accounts.map(a => `<tr><td><strong>${a.name}</strong></td><td>${a.accountType}</td><td>${a.currenciesCode}</td><td>${getSymbol(a.currenciesCode)}${a.balance.toFixed(2)}</td><td style="color:#7c3aed;font-weight:700">${fmtCvt(a.balance, a.currenciesCode)}</td></tr>`).join('')}
      </table>

      <h2>Transactions by Account</h2>
      ${accountsHTML}

      <div class="footer">Generated by CozyCoin · ${new Date().toLocaleString()} · All amounts in ${displayCurrency}</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const inputStyle = { border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem', background: 'white', color: '#1e1b4b', outline: 'none' };

  if (loading) return <Layout><div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'60vh' }}><div style={{ textAlign:'center',color:'#6b7280' }}><div style={{ fontSize:'2rem',marginBottom:'0.5rem' }}>⏳</div>Loading reports...</div></div></Layout>;
  if (error) return <Layout><div style={{ color:'#ef4444',padding:'2rem',textAlign:'center' }}><div style={{ fontSize:'2rem',marginBottom:'0.5rem' }}>⚠️</div>{error}</div></Layout>;

  return (
    <Layout>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1e1b4b' }}>Reports</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
              {filteredTxns.length} transactions · {MONTHS[appliedStart.month]} {appliedStart.year} — {MONTHS[appliedEnd.month]} {appliedEnd.year}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Currency selector */}
            <div style={{ display: 'flex', gap: '0.3rem', background: '#f5f3ff', borderRadius: 10, padding: '0.3rem' }}>
              {SUPPORTED_CURRENCIES.map(c => (
                <button key={c} onClick={() => setDisplayCurrency(c)} style={{ padding: '0.3rem 0.7rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', background: displayCurrency===c ? '#7c3aed' : 'transparent', color: displayCurrency===c ? 'white' : '#7c3aed' }}>
                  {c}
                </button>
              ))}
            </div>
            <button onClick={exportCSV} style={{ background: 'white', border: '1.5px solid #ddd6fe', borderRadius: 10, padding: '0.6rem 1rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', color: '#7c3aed' }}>
              📊 CSV
            </button>
            <button onClick={exportPDF} style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)', border: 'none', borderRadius: 10, padding: '0.6rem 1rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', color: 'white' }}>
              📄 PDF
            </button>
          </div>
        </div>

        {/* DATE FILTER */}
        <div style={{ background: '#faf5ff', borderRadius: 16, border: '1.5px solid #ddd6fe', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 700, color: '#4c1d95', fontSize: '0.9rem', marginBottom: '0.75rem' }}>📅 Filter Period</div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: '#6b7280', fontSize: '0.82rem' }}>From</span>
              <select value={startMonth} onChange={e => setStartMonth(parseInt(e.target.value))} style={inputStyle}>{MONTHS.map((m,i) => <option key={i} value={i}>{m}</option>)}</select>
              <select value={startYear} onChange={e => setStartYear(parseInt(e.target.value))} style={inputStyle}>{[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: '#6b7280', fontSize: '0.82rem' }}>To</span>
              <select value={endMonth} onChange={e => setEndMonth(parseInt(e.target.value))} style={inputStyle}>{MONTHS.map((m,i) => <option key={i} value={i}>{m}</option>)}</select>
              <select value={endYear} onChange={e => setEndYear(parseInt(e.target.value))} style={inputStyle}>{[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
            </div>
            <button onClick={applyFilter} style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)', color: 'white', border: 'none', borderRadius: 10, padding: '0.6rem 1.25rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              Apply Filter
            </button>
          </div>
        </div>

        {/* OVERVIEW — RED THEME */}
        <div style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #dc2626 100%)', borderRadius: 20, padding: '1.75rem', marginBottom: '1.5rem', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.78rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 2, marginBottom: '0.3rem' }}>Your Financial Overview</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>All amounts shown in <strong>{displayCurrency}</strong></div>
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>{MONTHS[appliedStart.month]} {appliedStart.year} — {MONTHS[appliedEnd.month]} {appliedEnd.year}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            {/* Total Account Balance */}
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: '1.25rem', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.3rem' }}>💰 Total Money Across All Accounts</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-1px', color: totalAccountBalance < 0 ? '#fca5a5' : 'white' }}>
                {totalAccountBalance < 0 ? '-' : ''}{getSymbol(displayCurrency)}{Math.abs(totalAccountBalance).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.2rem' }}>The total money you currently have in all your accounts</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>⬆ Money In</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#86efac' }}>+{getSymbol(displayCurrency)}{totalIncome.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style={{ fontSize: '0.68rem', opacity: 0.6, marginTop: '0.2rem' }}>Income this period</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>⬇ Money Out</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fca5a5' }}>-{getSymbol(displayCurrency)}{totalExpenses.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style={{ fontSize: '0.68rem', opacity: 0.6, marginTop: '0.2rem' }}>Expenses this period</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.4rem' }}>📊 This Period Balance</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: periodBalance >= 0 ? '#86efac' : '#fca5a5' }}>
                {periodBalance >= 0 ? '+' : '-'}{getSymbol(displayCurrency)}{Math.abs(periodBalance).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.68rem', opacity: 0.6, marginTop: '0.2rem' }}>{periodBalance >= 0 ? 'You saved money this period 🎉' : 'You spent more than you earned'}</div>
            </div>
          </div>
        </div>

        {/* PIE + BREAKDOWN */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #ddd6fe', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.25rem', color: '#4c1d95', fontSize: '1rem', fontWeight: 700 }}>Where Did Your Money Go?</h3>
            <p style={{ margin: '0 0 0.75rem', color: '#9ca3af', fontSize: '0.75rem' }}>Click a slice or category to see details</p>
            <ExpensePieChart data={expensesByCategory} selectedCategory={selectedCategory} onSelectCategory={(name) => setSelectedCategory(prev => prev === name ? null : name)} />
          </div>

          <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #ddd6fe', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#4c1d95', fontSize: '1rem', fontWeight: 700 }}>Category Details</h3>
              {selectedCategory && <button onClick={() => setSelectedCategory(null)} style={{ background: '#f5f3ff', border: 'none', borderRadius: 8, padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>✕ Clear</button>}
            </div>
            {expensesByCategory.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No expenses in this period</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 340, overflowY: 'auto' }}>
                {expensesByCategory.map((cat, i) => {
                  const isSelected = selectedCategory === cat.categoryName;
                  const isOther = selectedCategory && !isSelected;
                  const color = PIE_COLORS[i % PIE_COLORS.length];
                  const catTxns = expenseTxns.filter(t => (t.categoryName || 'Uncategorized') === cat.categoryName);
                  return (
                    <div key={i} onClick={() => setSelectedCategory(prev => prev === cat.categoryName ? null : cat.categoryName)} style={{ borderRadius: 10, padding: '0.75rem', cursor: 'pointer', border: `2px solid ${isSelected ? color : '#f3f4f6'}`, background: isSelected ? `${color}15` : '#fafafa', opacity: isOther ? 0.4 : 1, transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 600, color: isSelected ? color : '#374151' }}>{cat.categoryName}</span>
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444' }}>{getSymbol(displayCurrency)}{cat.amount.toFixed(2)} · {cat.percentage}%</span>
                      </div>
                      <div style={{ background: '#f3f4f6', borderRadius: 999, height: 5, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 999, width: `${cat.percentage}%`, background: color }} />
                      </div>
                      {isSelected && (
                        <div style={{ marginTop: '0.6rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                          {[
                            { label: 'Times', value: catTxns.length },
                            { label: 'Avg Spend', value: `${getSymbol(displayCurrency)}${catTxns.length > 0 ? (cat.amount / catTxns.length).toFixed(0) : 0}` },
                            { label: 'Last', value: catTxns.length > 0 ? new Date(catTxns.sort((a,b) => new Date(b.date)-new Date(a.date))[0].date).toLocaleDateString('en',{month:'short',day:'numeric'}) : '—' },
                          ].map(s => (
                            <div key={s.label} style={{ background: 'white', borderRadius: 8, padding: '0.4rem', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.62rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                              <div style={{ fontWeight: 700, color, fontSize: '0.9rem', marginTop: '0.1rem' }}>{s.value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CALENDAR */}
        <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #ddd6fe', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, color: '#4c1d95', fontSize: '1rem', fontWeight: 700 }}>Daily Transactions</h3>
              <p style={{ margin: '0.2rem 0 0', color: '#9ca3af', fontSize: '0.75rem' }}>Click any highlighted day to see what happened</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button onClick={() => { calendarMonth === 0 ? (setCalendarMonth(11), setCalendarYear(y => y-1)) : setCalendarMonth(m => m-1); setSelectedDay(null); setCalendarDayTxns([]); }} style={{ background: '#f5f3ff', border: 'none', borderRadius: 8, padding: '0.4rem 0.75rem', cursor: 'pointer', fontWeight: 700, color: '#7c3aed' }}>←</button>
              <span style={{ fontWeight: 700, color: '#4c1d95', fontSize: '0.9rem', minWidth: 110, textAlign: 'center' }}>{MONTHS[calendarMonth]} {calendarYear}</span>
              <button onClick={() => { calendarMonth === 11 ? (setCalendarMonth(0), setCalendarYear(y => y+1)) : setCalendarMonth(m => m+1); setSelectedDay(null); setCalendarDayTxns([]); }} style={{ background: '#f5f3ff', border: 'none', borderRadius: 8, padding: '0.4rem 0.75rem', cursor: 'pointer', fontWeight: 700, color: '#7c3aed' }}>→</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.3rem', marginBottom: '1rem' }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d,i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, color: '#9ca3af', padding: '0.3rem 0' }}>{d}</div>
            ))}
            {Array.from({ length: getFirstDay(calendarMonth, calendarYear) }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: getDaysInMonth(calendarMonth, calendarYear) }).map((_, i) => {
              const day = i + 1;
              const dayDate = new Date(calendarYear, calendarMonth, day);
              const isPast = dayDate <= now;
              const hasTxn = daysWithTxns.has(day);
              const isSelected = selectedDay === day;
              const dayTxns = filteredTxns.filter(t => { const d = new Date(t.date); return d.getDate()===day && d.getMonth()===calendarMonth && d.getFullYear()===calendarYear; });
              const hasIncome = dayTxns.some(t => t.status === 'income');
              const hasExpense = dayTxns.some(t => t.status === 'expense');
              const dayTotal = dayTxns.reduce((s, t) => s + (t.status==='income' ? cvt(Math.abs(t.amount), t.currenciesCode||'USD') : t.status==='expense' ? -cvt(Math.abs(t.amount), t.currenciesCode||'USD') : 0), 0);

              return (
                <div key={day} onClick={() => isPast && hasTxn && handleDayClick(day)} style={{ textAlign: 'center', borderRadius: 8, padding: '0.4rem 0.2rem', cursor: isPast && hasTxn ? 'pointer' : 'default', background: isSelected ? '#7c3aed' : hasTxn && isPast ? '#f5f3ff' : 'transparent', border: `1.5px solid ${isSelected ? '#7c3aed' : hasTxn && isPast ? '#ddd6fe' : 'transparent'}`, opacity: !isPast ? 0.25 : 1, transition: 'all 0.1s' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : hasTxn ? 600 : 400, color: isSelected ? 'white' : hasTxn && isPast ? '#4c1d95' : '#374151' }}>{day}</div>
                  {hasTxn && isPast && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.15rem', marginTop: '0.15rem' }}>
                        {hasIncome && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#86efac' : '#059669' }} />}
                        {hasExpense && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#fca5a5' : '#ef4444' }} />}
                      </div>
                      {isSelected && (
                        <div style={{ fontSize: '0.55rem', color: dayTotal>=0 ? '#86efac' : '#fca5a5', marginTop: '0.1rem', fontWeight: 700 }}>
                          {dayTotal>=0?'+':''}{getSymbol(displayCurrency)}{Math.abs(dayTotal).toFixed(0)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Day transactions panel */}
          {selectedDay && calendarDayTxns.length > 0 && (
            <div style={{ borderTop: '1.5px solid #ddd6fe', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, color: '#4c1d95', fontSize: '0.9rem', fontWeight: 700 }}>
                  {selectedDay} {MONTHS[calendarMonth]} {calendarYear} — {calendarDayTxns.length} transaction{calendarDayTxns.length !== 1 ? 's' : ''}
                </h4>
                <button onClick={() => { setSelectedDay(null); setCalendarDayTxns([]); }} style={{ background: '#f5f3ff', border: 'none', borderRadius: 8, padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>✕ Close</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {calendarDayTxns.map(t => (
                  <div key={t.transactionID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: '#faf5ff', borderRadius: 8, border: '1px solid #ddd6fe' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1rem' }}>{t.status==='income'?'⬆️':t.status==='expense'?'⬇️':'🔄'}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '0.85rem' }}>{t.categoryName || t.description || t.status}</div>
                        {t.description && t.categoryName && <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{t.description}</div>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: t.status==='income'?'#059669':t.status==='expense'?'#ef4444':'#7c3aed', fontSize: '0.9rem' }}>
                        {t.status==='income'?'+':t.status==='expense'?'-':''}{fmtAmt(t.amount, t.currenciesCode||'USD')}
                      </div>
                      {t.currenciesCode !== displayCurrency && (
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>≈ {fmtCvt(t.amount, t.currenciesCode||'USD')} {displayCurrency}</div>
                      )}
                    </div>
                  </div>
                ))}
                {/* Day total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: '#7c3aed', borderRadius: 8, marginTop: '0.25rem' }}>
                  <span style={{ fontWeight: 700, color: 'white', fontSize: '0.85rem' }}>Day Total</span>
                  <span style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>
                    {(() => {
                      const tot = calendarDayTxns.reduce((s,t) => s + (t.status==='income' ? cvt(Math.abs(t.amount),t.currenciesCode||'USD') : t.status==='expense' ? -cvt(Math.abs(t.amount),t.currenciesCode||'USD') : 0), 0);
                      return `${tot>=0?'+':'-'}${getSymbol(displayCurrency)}${Math.abs(tot).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.72rem', color: '#6b7280', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669' }} /> Income day</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} /> Expense day</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{ width: 10, height: 10, borderRadius: 3, background: '#f5f3ff', border: '1.5px solid #ddd6fe' }} /> Click to view</div>
          </div>
        </div>

        {/* TRANSACTION TABLE */}
        <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #ddd6fe', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, color: '#4c1d95', fontSize: '1rem', fontWeight: 700 }}>
              All Transactions
              {selectedCategory && <span style={{ marginLeft: '0.5rem', fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600 }}>· {selectedCategory}</span>}
            </h3>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {['all','income','expense','transfer'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.35rem 0.75rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', background: activeTab===tab ? '#7c3aed' : '#f5f3ff', color: activeTab===tab ? 'white' : '#7c3aed' }}>
                  {tab==='all'?`All (${filteredTxns.length})`:`${tab.charAt(0).toUpperCase()+tab.slice(1)} (${tab==='income'?incomeTxns.length:tab==='expense'?expenseTxns.length:transferTxns.length})`}
                </button>
              ))}
            </div>
          </div>

          {displayedTxns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}><div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💸</div>No transactions found</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#faf5ff', borderBottom: '2px solid #ddd6fe' }}>
                    {['Date','Type','Category','What For','Original Amount',`In ${displayCurrency}`].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.65rem 0.75rem', color: '#7c3aed', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedTxns.map((t, i) => {
                    const isCatSelected = selectedCategory && (t.categoryName||'Uncategorized') === selectedCategory;
                    const origCurrency = t.currenciesCode || 'USD';
                    const convertedAmt = cvt(Math.abs(t.amount), origCurrency);
                    return (
                      <tr key={t.transactionID} style={{ borderBottom: i < displayedTxns.length-1 ? '1px solid #f3f4f6' : 'none', background: isCatSelected ? '#faf5ff' : 'transparent' }}>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#6b7280' }}>{new Date(t.date).toLocaleDateString()}</td>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <span style={{ background: t.status==='income'?'#ecfdf5':t.status==='expense'?'#fef2f2':'#f5f3ff', color: t.status==='income'?'#059669':t.status==='expense'?'#ef4444':'#7c3aed', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600 }}>{t.status==='income'?'Income':t.status==='expense'?'Expense':'Transfer'}</span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#374151', fontWeight: isCatSelected ? 700 : 400 }}>{t.categoryName||'—'}{t.subCategoryName ? ` › ${t.subCategoryName}` : ''}</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#6b7280' }}>{t.description||'—'}</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#374151', fontWeight: 600 }}>
                          {t.status==='income'?'+':t.status==='expense'?'-':''}{getSymbol(origCurrency)}{Math.abs(t.amount).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})} <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{origCurrency}</span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: t.status==='income'?'#059669':t.status==='expense'?'#ef4444':'#7c3aed' }}>
                          {t.status==='income'?'+':t.status==='expense'?'-':''}{getSymbol(displayCurrency)}{convertedAmt.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #ddd6fe', background: '#faf5ff' }}>
                    <td colSpan={4} style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#4c1d95' }}>Period Total</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: '#6b7280', fontSize: '0.78rem' }}>Multiple currencies</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 800, color: periodBalance>=0?'#059669':'#ef4444' }}>
                      {periodBalance>=0?'+':'-'}{getSymbol(displayCurrency)}{Math.abs(periodBalance).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* ACCOUNTS BREAKDOWN */}
        <div style={{ background: 'white', borderRadius: 16, border: '1.5px solid #ddd6fe', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#4c1d95', fontSize: '1rem', fontWeight: 700 }}>Your Accounts — Click to See Transactions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {accounts.filter(a => a.accountType !== 'savings').map(acc => {
              const accTxns = filteredTxns.filter(t => t.accountID === acc.accountID || t.toAccountID === acc.accountID).sort((a,b) => new Date(b.date)-new Date(a.date));
              const accIncome  = accTxns.filter(t => t.status==='income').reduce((s,t) => s + cvt(Math.abs(t.amount), t.currenciesCode||'USD'), 0);
              const accExpense = accTxns.filter(t => t.status==='expense').reduce((s,t) => s + cvt(Math.abs(t.amount), t.currenciesCode||'USD'), 0);
              const accNet = accIncome - accExpense;
              const isExpanded = expandedAccount === acc.accountID;

              return (
                <div key={acc.accountID} style={{ border: '1.5px solid #ddd6fe', borderRadius: 12, overflow: 'hidden' }}>
                  <div onClick={() => setExpandedAccount(isExpanded ? null : acc.accountID)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', cursor: 'pointer', background: isExpanded ? '#faf5ff' : 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                        {acc.accountType==='bank'?'🏦':acc.accountType==='cash'?'💵':'📱'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '0.9rem' }}>{acc.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{acc.accountType} · {accTxns.length} transactions this period</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#4c1d95', fontSize: '1rem' }}>
                          {getSymbol(acc.currenciesCode)}{acc.balance.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})} <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{acc.currenciesCode}</span>
                        </div>
                        {acc.currenciesCode !== displayCurrency && (
                          <div style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 600 }}>≈ {fmtCvt(acc.balance, acc.currenciesCode)} {displayCurrency}</div>
                        )}
                        <div style={{ fontSize: '0.7rem', color: accNet>=0?'#059669':'#ef4444', fontWeight: 600 }}>
                          {accNet>=0?'+':'-'}{getSymbol(displayCurrency)}{Math.abs(accNet).toFixed(2)} this period
                        </div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #ddd6fe', padding: '0.75rem 1.25rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {[
                          { label: 'Money In', value: `+${getSymbol(displayCurrency)}${accIncome.toFixed(2)}`, color: '#059669', bg: '#ecfdf5' },
                          { label: 'Money Out', value: `-${getSymbol(displayCurrency)}${accExpense.toFixed(2)}`, color: '#ef4444', bg: '#fef2f2' },
                          { label: 'Current Balance', value: `${getSymbol(acc.currenciesCode)}${acc.balance.toLocaleString('en',{minimumFractionDigits:2})}`, color: '#7c3aed', bg: '#f5f3ff' },
                        ].map(s => (
                          <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: '0.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                            <div style={{ fontWeight: 700, color: s.color, fontSize: '0.85rem', marginTop: '0.1rem' }}>{s.value}</div>
                          </div>
                        ))}
                      </div>

                      {accTxns.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem', fontSize: '0.85rem' }}>No transactions in this period</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 280, overflowY: 'auto' }}>
                          {accTxns.map(t => (
                            <div key={t.transactionID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#fafafa', borderRadius: 8, border: '1px solid #f3f4f6' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span>{t.status==='income'?'⬆️':t.status==='expense'?'⬇️':'🔄'}</span>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '0.82rem' }}>{t.categoryName || t.description || t.status}</div>
                                  <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{new Date(t.date).toLocaleDateString()}</div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 700, color: t.status==='income'?'#059669':t.status==='expense'?'#ef4444':'#7c3aed', fontSize: '0.85rem' }}>
                                  {t.status==='income'?'+':t.status==='expense'?'-':''}{fmtAmt(t.amount, t.currenciesCode||'USD')}
                                </div>
                                {(t.currenciesCode || 'USD') !== displayCurrency && (
                                  <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>≈ {fmtCvt(t.amount, t.currenciesCode||'USD')} {displayCurrency}</div>
                                )}
                              </div>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#faf5ff', borderRadius: 8, border: '1.5px solid #ddd6fe', marginTop: '0.25rem' }}>
                            <span style={{ fontWeight: 700, color: '#4c1d95', fontSize: '0.82rem' }}>Period Total</span>
                            <span style={{ fontWeight: 800, color: accNet>=0?'#059669':'#ef4444', fontSize: '0.85rem' }}>{accNet>=0?'+':'-'}{getSymbol(displayCurrency)}{Math.abs(accNet).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </Layout>
  );
}

export default Reports;