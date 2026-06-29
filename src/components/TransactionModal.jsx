import { useState, useEffect } from 'react';
import { createTransaction, getAccounts } from '../services/api';
import CategoryPicker from './CategoryPicker';
import { formatNumberInput, parseNumberInput } from '../utils/constants';
import { TYPE_COLORS, inputStyle, labelStyle } from '../utils/constants';
import { getRates, convert, getCurrencySymbol as getSymbol } from '../utils/exchangeRates';


const CURRENCIES = ['USD', 'EUR', 'LBP', 'GBP'];

function emptyForm() {
  return {
    amount: '', currenciesCode: 'USD', description: '',
    date: new Date().toISOString().split('T')[0],
    accountID: '', categoryID: '', subCategoryID: null, toAccountID: '',
  };
}

function TransactionModal({ isOpen, onClose, onSuccess, accounts: propAccounts, categories: propCategories, initialType = 'expense' }) {
  const [transType, setTransType]             = useState(initialType);
  const [accounts, setAccounts]               = useState(propAccounts || []);
  const [categories, setCategories]           = useState(propCategories || []);
  const [formData, setFormData]               = useState(emptyForm());
  const [formErrors, setFormErrors]           = useState({});
  const [selectedCategoryName, setSelCatName] = useState('');
  const [submitting, setSubmitting]           = useState(false);
  const [transactionCurrency, setTransactionCurrency] = useState('USD');
  const [convertedAmount, setConvertedAmount]         = useState(null);
  const [exchangeRate, setExchangeRate]       = useState(null);
  const [fetchingRate, setFetchingRate]               = useState(false);
  const [exchangeRates, setExchangeRates] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    const init = async () => {
      setTransType(initialType);
      setFormData(emptyForm());
      setSelCatName('');
      setFormErrors({});
      setTransactionCurrency('USD');
      setConvertedAmount(null);
      setExchangeRate(null);
      try {
        const accs = await getAccounts();
        setAccounts(accs);
      } catch {}
    };
    init();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (propAccounts) setAccounts(propAccounts); }, [propAccounts]);
  useEffect(() => { if (propCategories) setCategories(propCategories); }, [propCategories]);

const [transferRate, setTransferRate] = useState(null);
const [transferConvertedAmount, setTransferConvertedAmount] = useState(null);

useEffect(() => {
  if (transType !== 'transfer' || !formData.accountID || !formData.toAccountID) {
    setTransferRate(null);
    setTransferConvertedAmount(null);
    return;
  }
  const fromAcc = accounts.find(a => String(a.accountID) === String(formData.accountID));
  const toAcc   = accounts.find(a => String(a.accountID) === String(formData.toAccountID));
  if (!fromAcc || !toAcc || fromAcc.currenciesCode === toAcc.currenciesCode) {
    setTransferRate(null);
    setTransferConvertedAmount(null);
    return;
  }
  const fetchTransferRate = async () => {
    const rates = await getRates();
    const rate = convert(1, fromAcc.currenciesCode, toAcc.currenciesCode, rates);
    setTransferRate(rate);
    const a = parseFloat(formData.amount);
    if (a > 0) setTransferConvertedAmount((a * rate).toFixed(2));
  };
  fetchTransferRate();
}, [formData.accountID, formData.toAccountID, formData.amount, transType, accounts]);

useEffect(() => {
  getRates().then(r => setExchangeRates(r)).catch(() => {});
}, []);

useEffect(() => {
  let cancelled = false;
  const fetchRate = async () => {
    const selectedAccount = accounts.find(a => String(a.accountID) === String(formData.accountID));
    const accountCurrency = selectedAccount?.currenciesCode || 'USD';

    if (!formData.accountID || transactionCurrency === accountCurrency) {
      setConvertedAmount(null);
      setExchangeRate(null);
      return;
    }

    const amt = parseFloat(formData.amount);
    if (!amt || amt <= 0) { setConvertedAmount(null); return; }

    setFetchingRate(true);
    try {
      const rates = await getRates();
      const rate = convert(1, transactionCurrency, accountCurrency, rates);
      if (!cancelled) {
        setExchangeRate(rate);
        setConvertedAmount((amt * rate).toFixed(2));
      }
    } catch {
      setConvertedAmount(null);
    } finally {
      if (!cancelled) setFetchingRate(false);
    }
  };
  fetchRate();
  return () => { cancelled = true; };
}, [formData.amount, formData.accountID, transactionCurrency, accounts]);

  const clearErr = (field) =>
    setFormErrors(prev => { const n = { ...prev }; delete n[field]; return n; });

  const handleTypeChange = (type) => {
    setTransType(type);
    setFormData(prev => ({ ...prev, categoryID: '', subCategoryID: null, toAccountID: '' }));
    setSelCatName('');
  };

  const handleSubmit = async () => {
    if (accounts.length === 0) {
      alert('You need to create an account first before adding transactions!');
      onClose();
      return;
    }

    const errors = {};
    const amt = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amt) || amt <= 0)
      errors.amount = 'Enter a valid amount greater than 0';
    if (!formData.accountID)
      errors.accountID = 'Please select an account';
    if (transType === 'transfer' && !formData.toAccountID)
      errors.toAccountID = 'Please select a destination account';

    const selectedAccount = accounts.find(a => String(a.accountID) === String(formData.accountID));
    const accountCurrency = selectedAccount?.currenciesCode || 'USD';
    const finalAmount = transactionCurrency !== accountCurrency && convertedAmount
      ? parseFloat(convertedAmount)
      : amt;

   if (!errors.accountID && transType !== 'income') {
  const from = accounts.find(a => String(a.accountID) === String(formData.accountID));
  if (from) {
    // always compare in account currency
    const amountInAccountCurrency = transactionCurrency !== accountCurrency && convertedAmount
      ? parseFloat(convertedAmount)
      : amt;
    if (amountInAccountCurrency > from.balance) {
      errors.accountID = `Insufficient funds — ${from.name} only has ${getSymbol(accountCurrency)}${from.balance.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }
}

    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setSubmitting(true);

    try {
     await createTransaction({
  ...formData,
  status: transType,
  amount: finalAmount,
  currenciesCode: accountCurrency,
  accountID: parseInt(formData.accountID),
  categoryID: formData.categoryID ? parseInt(formData.categoryID) : null,
  subCategoryID: formData.subCategoryID ? parseInt(formData.subCategoryID) : null,
  toAccountID: formData.toAccountID ? parseInt(formData.toAccountID) : null,
  exchangeRate: transferRate ?? null,
  date: new Date(formData.date).toISOString(),
});
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.message || '';
      const isBalance = msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('balance');
      if (isBalance) setFormErrors({ accountID: msg });
      else alert(msg || 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const amt = parseFloat(formData.amount) || 0;
  const selectedAccount = accounts.find(a => String(a.accountID) === String(formData.accountID));
  const accountCurrency = selectedAccount?.currenciesCode || 'USD';

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: '#1e1b4b', fontWeight: 800 }}>New Transaction</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1.4rem', lineHeight: 1, padding: 0 }}>✕</button>
        </div>

        {/* Type selector */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Type</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['income', 'expense', 'transfer'].map(type => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                style={{
                  flex: 1, padding: '0.65rem 0.25rem', borderRadius: 10,
                  border: `2px solid ${transType === type ? TYPE_COLORS[type].color : '#e5e7eb'}`,
                  background: transType === type ? TYPE_COLORS[type].bg : 'white',
                  color: transType === type ? TYPE_COLORS[type].color : '#6b7280',
                  fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'capitalize',
                  transition: 'all 0.15s',
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Amount</label>
          <input
  type="text"
  placeholder="0.00"
  value={formatNumberInput(formData.amount)}
  onChange={e => {
    const raw = parseNumberInput(e.target.value);
    if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
      setFormData(p => ({ ...p, amount: raw }));
      clearErr('amount');
    }
  }}
  style={{ ...inputStyle, borderColor: formErrors.amount ? '#ef4444' : '#e5e7eb' }}
/>
          {formErrors.amount && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.3rem' }}>{formErrors.amount}</div>}
        </div>

       {/* Account */}
<div style={{ marginBottom: '1rem' }}>
  <label style={labelStyle}>{transType === 'transfer' ? 'From Account' : 'Account'}</label>
  {accounts.filter(a => a.accountType !== 'savings').length === 0 ? (
    <div style={{ background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#92400e', fontWeight: 500 }}>
      ⚠️ No accounts found.{' '}
      <span onClick={() => { onClose(); window.location.href = '/accounts'; }} style={{ fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
        Create an account first →
      </span>
    </div>
  ) : (
    <select
      value={formData.accountID}
      onChange={e => {
        const acc = accounts.find(a => String(a.accountID) === e.target.value);
        setTransactionCurrency(acc?.currenciesCode || 'USD');
        setConvertedAmount(null);
        setExchangeRate(null);
        setFormData(p => ({ ...p, accountID: e.target.value }));
        clearErr('accountID');
      }}
      style={{ ...inputStyle, borderColor: formErrors.accountID ? '#ef4444' : '#e5e7eb' }}
    >
      <option value="">Select account...</option>
      {accounts
        .filter(a => a.accountType !== 'savings')
        .map(a => {
          const accCurrency = a.currenciesCode || 'USD';
          let amtInThisCurrency = amt;
          if (amt > 0 && transactionCurrency !== accCurrency && Object.keys(exchangeRates).length) {
            const toUSD = transactionCurrency === 'USD' ? amt : amt / (exchangeRates[transactionCurrency] || 1);
            amtInThisCurrency = accCurrency === 'USD' ? toUSD : toUSD * (exchangeRates[accCurrency] || 1);
          }
          const insufficient = transType !== 'income' && amt > 0 && a.balance < amtInThisCurrency;
          return (
            <option key={a.accountID} value={a.accountID} disabled={insufficient}>
              {a.name} ({accCurrency}) — {getSymbol(accCurrency)}{a.balance.toFixed(2)}{insufficient ? ' (insufficient funds)' : ''}
            </option>
          );
        })
      }
    </select>
  )}
  {formErrors.accountID && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.3rem' }}>{formErrors.accountID}</div>}
</div>

        {/* Currency selector */}
        {transType !== 'transfer' && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>
              Transaction Currency
              {accountCurrency && (
                <span style={{ color: '#6b7280', marginLeft: '0.5rem', fontWeight: 400, fontSize: '0.78rem' }}>
                  (account is in {accountCurrency})
                </span>
              )}
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {CURRENCIES.map(c => (
                <button
                  key={c}
                  onClick={() => setTransactionCurrency(c)}
                  style={{
                    padding: '0.4rem 0.9rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '0.82rem',
                    background: transactionCurrency === c ? '#1e1b4b' : '#f3f4f6',
                    color: transactionCurrency === c ? 'white' : '#6b7280',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Conversion display */}
            {formData.accountID && transactionCurrency !== accountCurrency && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.82rem', color: '#1e40af', marginTop: '0.5rem' }}>
                {fetchingRate ? '⏳ Fetching rate...' : convertedAmount ? (
                  <>
                    {formData.amount || '0'} {transactionCurrency} ≈ <strong>{convertedAmount}</strong> {accountCurrency}
                    <span style={{ opacity: 0.6, marginLeft: '0.5rem' }}>(rate: {exchangeRate?.toFixed(4)})</span>
                  </>
                ) : (
                  `Enter an amount to see conversion`
                )}
              </div>
            )}
          </div>
        )}
{/* To Account (transfer only) */}
{transType === 'transfer' && (
  <div style={{ marginBottom: '1rem' }}>
    <label style={labelStyle}>To Account</label>
    <select
      value={formData.toAccountID}
      onChange={e => { setFormData(p => ({ ...p, toAccountID: e.target.value })); clearErr('toAccountID'); }}
      style={{ ...inputStyle, borderColor: formErrors.toAccountID ? '#ef4444' : '#e5e7eb' }}
    >
      <option value="">Select destination...</option>
      {accounts
        .filter(a => a.accountID !== parseInt(formData.accountID) && a.accountType !== 'savings')
        .map(a => (
          <option key={a.accountID} value={a.accountID}>{a.name} ({a.currenciesCode}) — {a.currenciesCode} {a.balance.toFixed(2)}</option>
        ))
      }
    </select>
    {formErrors.toAccountID && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.3rem' }}>{formErrors.toAccountID}</div>}

    {/* Transfer conversion preview */}
    {transferRate && transferConvertedAmount && (
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.82rem', color: '#1e40af', marginTop: '0.5rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>💱 Cross-currency transfer</div>
        <div>
          Enter amount in <strong>{accounts.find(a => String(a.accountID) === String(formData.accountID))?.currenciesCode}</strong> — it will be converted to <strong>{accounts.find(a => String(a.accountID) === String(formData.toAccountID))?.currenciesCode}</strong> automatically.
        </div>
        {formData.amount && parseFloat(formData.amount) > 0 && (
          <div style={{ marginTop: '0.4rem', background: 'white', borderRadius: 6, padding: '0.4rem 0.6rem' }}>
            {formData.amount} {accounts.find(a => String(a.accountID) === String(formData.accountID))?.currenciesCode} → <strong>{transferConvertedAmount}</strong> {accounts.find(a => String(a.accountID) === String(formData.toAccountID))?.currenciesCode}
            <span style={{ opacity: 0.6, marginLeft: '0.5rem', fontSize: '0.75rem' }}>(rate: {transferRate?.toFixed(6)})</span>
          </div>
        )}
      </div>
    )}
  </div>
)}
        

        {/* Category */}
        {transType !== 'transfer' && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>
              Category
              {selectedCategoryName && (
                <span style={{ color: '#7c3aed', marginLeft: '0.5rem', fontWeight: 400, fontSize: '0.8rem' }}>✓ {selectedCategoryName}</span>
              )}
            </label>
            <CategoryPicker
              categories={categories}
              transType={transType}
              selectedID={formData.categoryID ? parseInt(formData.categoryID) : null}
              onSelect={(cat) => {
                setFormData(p => ({
                  ...p,
                  categoryID: cat.categoryID.toString(),
                  subCategoryID: cat.subCategoryID || null
                }));
                setSelCatName(cat.name);
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
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            style={inputStyle}
          />
        </div>

        {/* Date */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
            style={inputStyle}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '0.8rem', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 2, padding: '0.8rem', borderRadius: 12, border: 'none',
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
  );
}

export default TransactionModal;