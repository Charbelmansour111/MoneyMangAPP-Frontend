const CACHE_KEY = 'exchangeRates';
const CACHE_TIME_KEY = 'exchangeRatesTime';
const ONE_HOUR = 60 * 60 * 1000;

export const getRates = async () => {
  const cached = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
  if (cached && cachedTime && Date.now() - parseInt(cachedTime) < ONE_HOUR) {
    return JSON.parse(cached);
  }
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  const data = await res.json();
  localStorage.setItem(CACHE_KEY, JSON.stringify(data.rates));
  localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
  return data.rates;
};

export const convert = (amount, from, to, rates) => {
  if (!rates || from === to) return amount;
  if (from === 'USD') return amount * (rates[to] || 1);
  if (to === 'USD') return amount / (rates[from] || 1);
  // convert via USD as intermediate with full precision
  const inUSD = amount / (rates[from] || 1);
  return inUSD * (rates[to] || 1);
};

export const getCurrencySymbol = (c) => ({ USD: '$', EUR: '€', LBP: 'ل.ل' }[c] || c);