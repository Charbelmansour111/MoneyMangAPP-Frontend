export const CATEGORY_ICONS = {
  'Food & Dining': '🍽️',
  'Transport': '🚗',
  'Shopping': '🛍️',
  'Bills & Utilities': '💡',
  'Health & Fitness': '💊',
  'Health': '💊',
  'Entertainment': '🎬',
  'Education': '📚',
  'Subscriptions': '📱',
  'Salary': '💼',
  'Freelance': '💻',
  'Investment': '📈',
  'Business': '🏢',
  'Rental Income': '🏠',
  'Gift': '🎁',
  'Other Income': '💰',
  'Other': '📁',
};

// Returns the emoji for a transaction's category (resolves to root category icon).
export function getCategoryIcon(categories, categoryID) {
  if (!categoryID && categoryID !== 0) return null;
  const idStr = String(categoryID);
  const cat = categories.find(c => String(c.categoryID) === idStr);
  if (!cat) return null;

  let root = cat;
  const visited = new Set();
  while (root.parentID != null) {
    if (visited.has(root.categoryID)) break;
    visited.add(root.categoryID);
    const parent = categories.find(c => String(c.categoryID) === String(root.parentID));
    if (!parent) break;
    root = parent;
  }
  return CATEGORY_ICONS[root.name] || '📁';
}
