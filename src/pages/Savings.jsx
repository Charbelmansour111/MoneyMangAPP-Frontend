/* eslint-disable */
import { useState, useEffect } from 'react';
import { getSavings, createSavings, deleteSavings, contributeSavings, getAccounts, markSavingsComplete, markContributionPaid, getSavingsContributions, returnAndDeleteSavings } from '../services/api';
import Layout from '../components/Layout';
import { inputStyle, labelStyle } from '../utils/constants';
import { formatNumberInput, parseNumberInput } from '../utils/constants';
import { getRates, convert, getCurrencySymbol as getSymbol } from '../utils/exchangeRates';

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'LBP'];

function Savings() {
  const [savings, setSavings]                         = useState([]);
  const [accounts, setAccounts]                       = useState([]);
  const [loading, setLoading]                         = useState(true);
  const [error, setError]                             = useState('');
  const [showAddModal, setShowAddModal]               = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedSaving, setSelectedSaving]           = useState(null);
  const [deleteConfirm, setDeleteConfirm]             = useState(null);
  const [submitting, setSubmitting]                   = useState(false);
  const [showCompleted, setShowCompleted]             = useState(false);
  const [contributions, setContributions]             = useState({});
  const [expandedID, setExpandedID]                   = useState(null);
  const [returnAccountID, setReturnAccountID]         = useState('');
  const [displayCurrency, setDisplayCurrency]         = useState('USD');
  const [rates, setRates]                             = useState({});
  const [contributeCurrency, setContributeCurrency]   = useState('USD');
  const [contributeConverted, setContributeConverted] = useState(null);
  const [formData, setFormData]                       = useState({
    name: '', goalType: 'goal', amountToSave: '', deadline: '', currenciesCode: 'USD',
  });
  const [contributeData, setContributeData]           = useState({
    accountID: '', amountContributed: '', description: '',
  });

  useEffect(() => {
    getRates().then(setRates).catch(() => {});
  }, []);

  // fetch conversion preview when contribute currency changes
  useEffect(() => {
    if (!selectedSaving || !contributeData.amountContributed) { setContributeConverted(null); return; }
    const goalCurrency = selectedSaving.currenciesCode || 'USD';
    if (contributeCurrency === goalCurrency) { setContributeConverted(null); return; }
    const amt = parseFloat(contributeData.amountContributed);
    if (!amt || amt <= 0) { setContributeConverted(null); return; }
    const converted = convert(amt, contributeCurrency, goalCurrency, rates);
    setContributeConverted(converted.toFixed(2));
  }, [contributeCurrency, contributeData.amountContributed, selectedSaving, rates]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [savingsData, accountsData] = await Promise.all([getSavings(), getAccounts()]);
      setSavings(savingsData);
      setAccounts(accountsData);
    } catch (err) {
      setError(err.message || 'Failed to load savings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const cvt = (amount, from = 'USD') => convert(amount, from, displayCurrency, rates);

  const fetchContributions = async (savingId) => {
    try {
      const data = await getSavingsContributions(savingId);
      setContributions(prev => ({ ...prev, [savingId]: data }));
    } catch (err) { console.error('Failed to load contributions', err); }
  };

  const handleExpand = (savingId) => {
    if (expandedID === savingId) { setExpandedID(null); }
    else { setExpandedID(savingId); fetchContributions(savingId); }
  };

  const getProgress = (s) => {
    if (s.amountToSave <= 0) return 0;
    return Math.min(100, (s.paidAmountMonthly / s.amountToSave) * 100);
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.amountToSave) { alert('Please fill in name and amount.'); return; }
    if (!isNaN(formData.name) && formData.name.trim() !== '') { alert('Goal name cannot be only numbers.'); return; }
    setSubmitting(true);
    try {
      await createSavings({
        name: formData.name,
        goalType: formData.goalType,
        amountToSave: parseFloat(formData.amountToSave),
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        currenciesCode: formData.currenciesCode,
      });
      setShowAddModal(false);
      setFormData({ name: '', goalType: 'goal', amountToSave: '', deadline: '', currenciesCode: 'USD' });
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to create savings goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContribute = async () => {
  if (!contributeData.accountID || !contributeData.amountContributed) {
    alert('Please fill in account and amount.');
    return;
  }

  const fromAcc = accounts.find(a => String(a.accountID) === String(contributeData.accountID));
  
  // validate contribution currency matches selected account currency
  if (fromAcc && contributeCurrency !== fromAcc.currenciesCode) {
    alert(`⚠️ Currency mismatch! Your selected account "${fromAcc.name}" is in ${fromAcc.currenciesCode}. Please change your contribution currency to ${fromAcc.currenciesCode} or select a different account.`);
    return;
  }

  setSubmitting(true);
  try {
    const goalCurrency = selectedSaving.currenciesCode || 'USD';
    const fromCurrency = contributeCurrency;

    let exchangeRate = null;
    if (fromCurrency !== goalCurrency) {
      exchangeRate = convert(1, fromCurrency, goalCurrency, rates);
    }

    await contributeSavings({
      savingID: selectedSaving.savingID,
      accountID: parseInt(contributeData.accountID),
      amountContributed: parseFloat(contributeData.amountContributed),
      description: contributeData.description,
      exchangeRate: exchangeRate,
    });
    setShowContributeModal(false);
    setSelectedSaving(null);
    setContributeData({ accountID: '', amountContributed: '', description: '' });
    setContributeCurrency('USD');
    setContributeConverted(null);
    fetchAll();
    if (expandedID) fetchContributions(expandedID);
  } catch (err) {
    alert(err.message || 'Failed to contribute');
  } finally {
    setSubmitting(false);
  }
};

  const handleDelete = async (id) => {
    const savingToDelete = savings.find(s => s.savingID === id);
    const isDebt = savingToDelete?.goalType === 'debt';
    const goalContributions = contributions[id] || [];

    if (isDebt) {
      const unpaidTotal = goalContributions.filter(c => !c.isPaid).reduce((sum, c) => sum + c.amountContributed, 0);
      if (unpaidTotal > 0) { setDeleteConfirm(id); return; }
      try { await deleteSavings(id); setDeleteConfirm(null); fetchAll(); }
      catch (err) { alert(err.message || 'Failed to delete'); }
      return;
    }
    if (savingToDelete && savingToDelete.paidAmountMonthly > 0) { setDeleteConfirm(id); return; }
    try { await deleteSavings(id); setDeleteConfirm(null); fetchAll(); }
    catch (err) { alert(err.message || 'Failed to delete'); }
  };

  const handleReturnAndDelete = async (id) => {
    if (!returnAccountID) { alert('Please select an account to return money to.'); return; }
    try {
      const returnAcc  = accounts.find(a => String(a.accountID) === String(returnAccountID));
      const savingsAcc = accounts.find(a => a.accountType === 'savings');
      let exchangeRate = null;
      if (savingsAcc && returnAcc && savingsAcc.currenciesCode !== returnAcc.currenciesCode) {
        exchangeRate = convert(1, savingsAcc.currenciesCode, returnAcc.currenciesCode, rates);
      }
      await returnAndDeleteSavings(id, parseInt(returnAccountID), exchangeRate);
      setDeleteConfirm(null);
      setReturnAccountID('');
      fetchAll();
    } catch (err) {
      alert(err.message || 'Failed to return and delete');
    }
  };

  const handleMarkComplete = async (savingId) => {
    try { await markSavingsComplete(savingId); fetchAll(); }
    catch (err) { alert(err.message || 'Failed to mark complete'); }
  };

  const handleMarkContributionPaid = async (savingId, contributionId) => {
    try { await markContributionPaid(savingId, contributionId); fetchAll(); fetchContributions(savingId); }
    catch (err) { alert(err.message || 'Failed to mark contribution as paid'); }
  };

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          Loading savings...
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

  const activeSavings    = savings.filter(s => s.status !== 'completed');
  const completedSavings = savings.filter(s => s.status === 'completed');
  const displayedSavings = showCompleted ? completedSavings : activeSavings;
  const totalGoal        = activeSavings.reduce((s, g) => s + cvt(g.amountToSave, g.currenciesCode || 'USD'), 0);
  const totalSaved       = activeSavings.reduce((s, g) => s + cvt(g.paidAmountMonthly, g.currenciesCode || 'USD'), 0);

  return (
    <Layout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1e1b4b' }}>Savings</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
              {activeSavings.length} active goal{activeSavings.length !== 1 ? 's' : ''}
              {completedSavings.length > 0 && ` · ${completedSavings.length} completed`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {completedSavings.length > 0 && (
              <button onClick={() => setShowCompleted(!showCompleted)} style={{ background: showCompleted ? '#1e1b4b' : '#f3f4f6', color: showCompleted ? 'white' : '#6b7280', border: 'none', borderRadius: 10, padding: '0.6rem 1rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                {showCompleted ? '✓ Completed' : '○ Completed'}
              </button>
            )}
            <button onClick={() => setShowAddModal(true)} style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', color: 'white', border: 'none', borderRadius: 12, padding: '0.7rem 1.25rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
              + Add Goal
            </button>
          </div>
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
        {!showCompleted && (
          <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)', borderRadius: 20, padding: '1.75rem', marginBottom: '1.5rem', color: 'white' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 2, marginBottom: '0.4rem' }}>Total Saved</div>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-1px' }}>{getSymbol(displayCurrency)}{totalSaved.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.25rem' }}>
                of {getSymbol(displayCurrency)}{totalGoal.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total goal · {getSymbol(displayCurrency)}{Math.max(0, totalGoal - totalSaved).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 999, height: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 999, width: `${totalGoal > 0 ? Math.min(100, (totalSaved / totalGoal) * 100) : 0}%`, background: '#86efac', transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>
              <span>0%</span>
              <span>{totalGoal > 0 ? Math.min(100, Math.round((totalSaved / totalGoal) * 100)) : 0}% saved</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* SAVINGS LIST */}
        {displayedSavings.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{showCompleted ? '🏆' : '🐷'}</div>
            <div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>{showCompleted ? 'No completed goals yet' : 'No savings goals yet'}</div>
            <div style={{ fontSize: '0.85rem' }}>{showCompleted ? 'Complete a goal to see it here' : 'Add a goal to start saving'}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {displayedSavings.map(s => {
              const pct               = getProgress(s);
              const done              = s.paidAmountMonthly >= s.amountToSave;
              const isDebt            = s.goalType === 'debt';
              const isExpanded        = expandedID === s.savingID;
              const goalContributions = contributions[s.savingID] || [];
              const goalCurrency      = s.currenciesCode || 'USD';

              return (
                <div key={s.savingID} style={{ background: 'white', borderRadius: 16, border: `1.5px solid ${s.status === 'completed' ? '#bbf7d0' : done ? '#bbf7d0' : '#e5e7eb'}`, padding: '1.25rem 1.5rem', opacity: s.status === 'completed' ? 0.85 : 1 }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.3rem' }}>{isDebt ? '💳' : '🎯'}</span>
                        <div style={{ fontWeight: 700, color: '#1e1b4b', fontSize: '1rem' }}>{s.name}</div>
                        {s.status === 'completed' && <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 6 }}>✓ Completed</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ background: isDebt ? '#fef2f2' : '#f0fdf4', color: isDebt ? '#ef4444' : '#16a34a', padding: '0.15rem 0.6rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600 }}>
                          {isDebt ? '💳 Debt' : '🎯 Goal'}
                        </span>
                        <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '0.15rem 0.6rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600 }}>
                          {goalCurrency}
                        </span>
                      </div>
                      {s.deadline && <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.3rem' }}>📅 {new Date(s.deadline).toLocaleDateString()}</div>}
                    </div>

                    {s.status !== 'completed' && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setSelectedSaving(s); setContributeCurrency(s.currenciesCode || 'USD'); setShowContributeModal(true); }} style={{ background: '#f0fdf4', border: 'none', borderRadius: 8, padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#16a34a' }}>+ Contribute</button>
                        {done && <button onClick={() => handleMarkComplete(s.savingID)} style={{ background: '#dcfce7', border: 'none', borderRadius: 8, padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#166534' }}>✓ Mark as Paid</button>}
                        <button onClick={async () => { await fetchContributions(s.savingID); setDeleteConfirm(s.savingID); }} style={{ background: '#fef2f2', border: 'none', borderRadius: 8, padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#ef4444' }}>Delete</button>
                      </div>
                    )}
                  </div>

                  {/* PROGRESS BAR */}
                  <div style={{ background: '#f3f4f6', borderRadius: 999, height: 10, overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: s.status === 'completed' ? '#22c55e' : done ? '#22c55e' : pct > 60 ? '#84cc16' : pct > 30 ? '#f59e0b' : '#7c3aed', transition: 'width 0.5s ease' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: isDebt ? '0.75rem' : 0 }}>
                    <span style={{ color: '#6b7280', fontWeight: 600 }}>
                      {getSymbol(displayCurrency)}{cvt(s.paidAmountMonthly, goalCurrency).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} saved
                      {displayCurrency !== goalCurrency && <span style={{ opacity: 0.6, marginLeft: '0.3rem', fontSize: '0.7rem' }}>({getSymbol(goalCurrency)}{s.paidAmountMonthly.toFixed(2)})</span>}
                    </span>
                    <span style={{ color: '#1e1b4b', fontWeight: 700 }}>
                      {getSymbol(displayCurrency)}{cvt(s.amountToSave, goalCurrency).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} goal · {Math.round(pct)}%
                    </span>
                  </div>

                  {/* DEBT CONTRIBUTIONS */}
                  {isDebt && (
                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
                      <button onClick={() => handleExpand(s.savingID)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontWeight: 600, fontSize: '0.82rem', padding: 0 }}>
                        {isExpanded ? '▲ Hide payments' : '▼ View payments'}
                      </button>

                      {isExpanded && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {goalContributions.length === 0 ? (
                            <div style={{ color: '#9ca3af', fontSize: '0.82rem' }}>No payments yet</div>
                          ) : (
                            <>
                              {goalContributions.some(c => !c.isPaid) && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                                  <button onClick={async () => { const unpaid = goalContributions.filter(c => !c.isPaid); for (const c of unpaid) { await handleMarkContributionPaid(s.savingID, c.contributionID); } }} style={{ background: '#dcfce7', border: 'none', borderRadius: 8, padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: '#166534' }}>✓ Mark All Paid</button>
                                </div>
                              )}
                              {goalContributions.map(c => (
                                <div key={c.contributionID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: c.isPaid ? '#f0fdf4' : '#fafafa', borderRadius: 10, padding: '0.6rem 0.75rem', border: `1px solid ${c.isPaid ? '#bbf7d0' : '#e5e7eb'}` }}>
                                  <div>
                                    <div style={{ fontWeight: 600, color: '#1e1b4b', fontSize: '0.85rem' }}>
                                      {getSymbol(displayCurrency)}{cvt(c.amountContributed, goalCurrency).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      {displayCurrency !== goalCurrency && <span style={{ opacity: 0.6, marginLeft: '0.3rem', fontSize: '0.72rem' }}>({getSymbol(goalCurrency)}{c.amountContributed.toFixed(2)})</span>}
                                      {c.isPaid && <span style={{ color: '#16a34a', marginLeft: '0.5rem', fontSize: '0.75rem' }}>✓ Paid</span>}
                                    </div>
                                    <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                                      {new Date(c.date).toLocaleDateString()}{c.description && ` · ${c.description}`}
                                    </div>
                                  </div>
                                  {!c.isPaid && s.status !== 'completed' && (
                                    <button onClick={() => handleMarkContributionPaid(s.savingID, c.contributionID)} style={{ background: '#dcfce7', border: 'none', borderRadius: 8, padding: '0.35rem 0.65rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: '#166534' }}>Mark Paid</button>
                                  )}
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
            <h3 style={{ margin: '0 0 1.5rem', color: '#1e1b4b', fontWeight: 800 }}>New Savings Goal</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Type</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[{ value: 'goal', label: '🎯 Goal', color: '#16a34a', bg: '#f0fdf4' }, { value: 'debt', label: '💳 Debt', color: '#ef4444', bg: '#fef2f2' }].map(t => (
                  <button key={t.value} onClick={() => setFormData(p => ({ ...p, goalType: t.value }))} style={{ flex: 1, padding: '0.65rem', borderRadius: 10, border: `2px solid ${formData.goalType === t.value ? t.color : '#e5e7eb'}`, background: formData.goalType === t.value ? t.bg : 'white', color: formData.goalType === t.value ? t.color : '#6b7280', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>{formData.goalType === 'debt' ? 'Debt Name' : 'Goal Name'}</label>
              <input type="text" placeholder={formData.goalType === 'debt' ? 'e.g. Credit Card' : 'e.g. Vacation, Car, Phone'} value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Goal Currency</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {SUPPORTED_CURRENCIES.map(c => (
                  <button key={c} onClick={() => setFormData(p => ({ ...p, currenciesCode: c }))} style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', background: formData.currenciesCode === c ? '#1e1b4b' : '#f3f4f6', color: formData.currenciesCode === c ? 'white' : '#6b7280' }}>
                    {getSymbol(c)} {c}
                  </button>
                ))}
              </div>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: '#1e40af', marginTop: '0.5rem' }}>
                💡 Your goal amount will be tracked in <strong>{formData.currenciesCode}</strong>. You can contribute in any currency and it will be converted automatically.
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>{formData.goalType === 'debt' ? 'Amount Owed' : 'Amount to Save'} ({formData.currenciesCode})</label>
              <input type="text" placeholder="0.00" value={formatNumberInput(formData.amountToSave)} onChange={e => { const raw = parseNumberInput(e.target.value); if (raw === '' || /^\d*\.?\d*$/.test(raw)) setFormData(p => ({ ...p, amountToSave: raw })); }} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Deadline (optional)</label>
              <input type="date" value={formData.deadline} onChange={e => setFormData(p => ({ ...p, deadline: e.target.value }))} style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdd} disabled={submitting} style={{ flex: 2, padding: '0.8rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', color: 'white', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Adding...' : `Add ${formData.goalType === 'debt' ? 'Debt' : 'Goal'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTRIBUTE MODAL */}
      {showContributeModal && selectedSaving && (
        <div onClick={() => setShowContributeModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#1e1b4b', fontWeight: 800 }}>
              {selectedSaving.goalType === 'debt' ? '💳 Pay Debt' : '🎯 Contribute to Goal'}
            </h3>
            <p style={{ margin: '0 0 0.75rem', color: '#6b7280', fontSize: '0.85rem' }}>
              {selectedSaving.name} · {getSymbol(selectedSaving.currenciesCode || 'USD')}{selectedSaving.paidAmountMonthly.toFixed(2)} of {getSymbol(selectedSaving.currenciesCode || 'USD')}{selectedSaving.amountToSave.toFixed(2)}
            </p>

            {/* Clarifying note */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: '#1e40af', marginBottom: '1rem' }}>
              💡 This goal is tracked in <strong>{selectedSaving.currenciesCode || 'USD'}</strong>. You can contribute in any currency below and it will be converted automatically.
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>From Account</label>
              <select value={contributeData.accountID} onChange={e => { setContributeData(p => ({ ...p, accountID: e.target.value })); const acc = accounts.find(a => String(a.accountID) === e.target.value); if (acc) setContributeCurrency(acc.currenciesCode || 'USD'); }} style={inputStyle}>
                <option value="">Select account...</option>
                {accounts.filter(a => a.accountType !== 'savings').map(a => (
                  <option key={a.accountID} value={a.accountID}>{a.name} ({a.currenciesCode}) — {getSymbol(a.currenciesCode)}{a.balance.toFixed(2)}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Contribution Currency</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {SUPPORTED_CURRENCIES.map(c => (
                  <button key={c} onClick={() => setContributeCurrency(c)} style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', background: contributeCurrency === c ? '#1e1b4b' : '#f3f4f6', color: contributeCurrency === c ? 'white' : '#6b7280' }}>
                    {getSymbol(c)} {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Amount ({contributeCurrency})</label>
              <input type="text" placeholder="0.00" value={formatNumberInput(contributeData.amountContributed)} onChange={e => { const raw = parseNumberInput(e.target.value); if (raw === '' || /^\d*\.?\d*$/.test(raw)) setContributeData(p => ({ ...p, amountContributed: raw })); }} style={inputStyle} />

              {/* Conversion preview */}
              {contributeConverted && contributeCurrency !== (selectedSaving.currenciesCode || 'USD') && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.82rem', color: '#1e40af', marginTop: '0.5rem' }}>
                  {contributeData.amountContributed} {contributeCurrency} ≈ <strong>{contributeConverted}</strong> {selectedSaving.currenciesCode || 'USD'}
                  <span style={{ opacity: 0.6, marginLeft: '0.5rem', fontSize: '0.75rem' }}>(live rate)</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Description (optional)</label>
              <input type="text" placeholder="e.g. Monthly contribution" value={contributeData.description} onChange={e => setContributeData(p => ({ ...p, description: e.target.value }))} style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { setShowContributeModal(false); setContributeConverted(null); }} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleContribute} disabled={submitting} style={{ flex: 2, padding: '0.8rem', borderRadius: 12, border: 'none', background: selectedSaving.goalType === 'debt' ? 'linear-gradient(135deg, #991b1b, #ef4444)' : 'linear-gradient(135deg, #064e3b, #047857)', color: 'white', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Processing...' : selectedSaving.goalType === 'debt' ? 'Pay' : 'Contribute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && (
        <div onClick={() => { setDeleteConfirm(null); setReturnAccountID(''); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 420, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#1e1b4b' }}>Delete Savings Goal?</h3>

            {(() => {
              const savingToDelete    = savings.find(s => s.savingID === deleteConfirm);
              const isDebt            = savingToDelete?.goalType === 'debt';
              const goalContributions = contributions[deleteConfirm] || [];
              const unpaidTotal       = isDebt
                ? goalContributions.filter(c => !c.isPaid).reduce((sum, c) => sum + c.amountContributed, 0)
                : savingToDelete?.paidAmountMonthly || 0;
              const hasMoneyToReturn  = unpaidTotal > 0;
              const goalCurrency      = savingToDelete?.currenciesCode || 'USD';
              const displayAmt        = cvt(unpaidTotal, goalCurrency);

              return hasMoneyToReturn ? (
                <>
                  <div style={{ background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem', textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '0.4rem' }}>
                      ⚠️ {getSymbol(displayCurrency)}{displayAmt.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {isDebt ? 'in unpaid contributions' : 'saved'} will be returned
                    </div>
                    <div style={{ color: '#92400e', fontSize: '0.85rem' }}>Select an account to return the money to before deleting.</div>
                  </div>

                  <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
                    <label style={labelStyle}>Return money to:</label>
                    <select value={returnAccountID} onChange={e => setReturnAccountID(e.target.value)} style={inputStyle}>
                      <option value="">Select account...</option>
                      {accounts.filter(a => a.accountType !== 'savings').map(a => (
                        <option key={a.accountID} value={a.accountID}>
                          {a.name} ({a.currenciesCode}) — {getSymbol(a.currenciesCode)}{a.balance.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => { setDeleteConfirm(null); setReturnAccountID(''); }} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => handleReturnAndDelete(deleteConfirm)} style={{ flex: 2, padding: '0.8rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Return & Delete</button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 1rem' }}>This savings goal will be permanently deleted. No money will be moved since there is nothing saved yet.</p>
                 <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '0.6rem 0.75rem', fontSize: '0.82rem', color: '#92400e', marginBottom: '1.25rem' }}>
                   ⚠️ This cannot be undone.
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: 'none', background: '#ef4444', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Savings;