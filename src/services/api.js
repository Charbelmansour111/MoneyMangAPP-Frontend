const API_URL = 'http://localhost:5189/api';

// Core fetch wrapper — handles JWT token, JSON parsing, and errors
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Try to parse JSON response (even for errors, since our backend sends { message: "..." })
  let data = null;
  const text = await response.text();
  if (text) {
    data = JSON.parse(text);
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ===== USER =====
export const register = (data) =>
  apiFetch('/User/register', { method: 'POST', body: JSON.stringify(data) });

export const login = (data) =>
  apiFetch('/User/login', { method: 'POST', body: JSON.stringify(data) });

export const getProfile = () =>
  apiFetch('/User/profile', { method: 'GET' });



// ===== ACCOUNT =====
export const getAccounts = () =>
  apiFetch('/Account', { method: 'GET' });

export const createAccount = (data) =>
  apiFetch('/Account', { method: 'POST', body: JSON.stringify(data) });

export const updateAccount = (id, data) =>
  apiFetch(`/Account/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteAccount = (id) =>
  apiFetch(`/Account/${id}`, { method: 'DELETE' });


// ===== CATEGORY =====
export const getCategories = () =>
  apiFetch('/Category', { method: 'GET' });

export const createCategory = (data) =>
  apiFetch('/Category', { method: 'POST', body: JSON.stringify(data) });

export const updateCategory = (id, data) =>
  apiFetch(`/Category/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteCategory = (id) =>
  apiFetch(`/Category/${id}`, { method: 'DELETE' });



// ===== TRANSACTION =====
export const getTransactions = () =>
  apiFetch('/Transaction', { method: 'GET' });

export const createTransaction = (data) =>
  apiFetch('/Transaction', { method: 'POST', body: JSON.stringify(data) });

export const updateTransaction = (id, data) =>
  apiFetch(`/Transaction/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteTransaction = (id) =>
  apiFetch(`/Transaction/${id}`, { method: 'DELETE' });

export const getDashboardSummary = (months = 6, month = 0, year = 0) =>
  apiFetch(`/Dashboard/summary?months=${months}&month=${month + 1}&year=${year}`, { method: 'GET' });


// ===== SUBCATEGORY =====
export const getSubCategories = (categoryId) =>
  apiFetch(`/SubCategory/byCategory/${categoryId}`, { method: 'GET' });

export const createSubCategory = (data) =>
  apiFetch('/SubCategory', { method: 'POST', body: JSON.stringify(data) });

export const deleteSubCategory = (id) =>
  apiFetch(`/SubCategory/${id}`, { method: 'DELETE' });


// ===== BUDGET =====
export const getBudgets = () =>
  apiFetch('/Budget', { method: 'GET' });

export const createBudget = (data) =>
  apiFetch('/Budget', { method: 'POST', body: JSON.stringify(data) });

export const updateBudget = (id, data) =>
  apiFetch(`/Budget/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteBudget = (id) =>
  apiFetch(`/Budget/${id}`, { method: 'DELETE' });



// ===== SAVINGS =====
export const getSavings = () =>
  apiFetch('/Savings', { method: 'GET' });

export const createSavings = (data) =>
  apiFetch('/Savings', { method: 'POST', body: JSON.stringify(data) });

export const updateSavings = (id, data) =>
  apiFetch(`/Savings/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteSavings = (id) =>
  apiFetch(`/Savings/${id}`, { method: 'DELETE' });

export const contributeSavings = (data) =>
  apiFetch('/Savings/contribute', { method: 'POST', body: JSON.stringify(data) });

export const getSavingsContributions = (id) =>
  apiFetch(`/Savings/${id}/contributions`, { method: 'GET' });

export const markSavingsComplete = (id) =>
  apiFetch(`/Savings/${id}/complete`, { method: 'POST' });

export const markContributionPaid = (savingId, contributionId) =>
  apiFetch(`/Savings/${savingId}/contributions/${contributionId}/pay`, { method: 'POST' });

export const returnAndDeleteSavings = (id, returnAccountId, exchangeRate = null) =>
  apiFetch(`/Savings/${id}/return?returnAccountId=${returnAccountId}${exchangeRate ? `&exchangeRate=${exchangeRate}` : ''}`, { method: 'DELETE' });
