export const TYPE_COLORS = {
  income:   { color: '#059669', bg: '#ecfdf5', border: '#d1fae5', label: 'Income' },
  expense:  { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Expense' },
  transfer: { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', label: 'Transfer' },
};

export const inputStyle = {
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

export const labelStyle = {
  display: 'block',
  fontWeight: 600,
  color: '#374151',
  fontSize: '0.85rem',
  marginBottom: '0.4rem',
};

export const formatNumberInput = (value) => {
  if (!value) return '';
  const num = value.toString().replace(/,/g, '');
  if (isNaN(num)) return value;
  const parts = num.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

export const parseNumberInput = (value) => {
  return value.toString().replace(/,/g, '');
};