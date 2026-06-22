import { useState } from 'react';
import { createCategory, getCategories } from '../services/api';

const TYPE_EMOJIS = {
  'Food & Dining': '🍽',
  'Transport': '🚗',
  'Shopping': '🛍',
  'Subscriptions': '📱',
  'Health': '💊',
  'Bills & Utilities': '💡',
  'Education': '📚',
  'Entertainment': '🎬',
  'Salary': '💼',
  'Freelance': '💻',
  'Investment': '📈',
  'Gift': '🎁',
  'Rental Income': '🏠',
  'Business': '🏢',
  'Other Income': '💰',
};

const getEmoji = (name) => TYPE_EMOJIS[name] || '📁';

// Get depth of a category (0 = root, 1 = child, 2 = grandchild, 3 = great-grandchild)
function getDepth(cat, allCats) {
  let depth = 0;
  let current = cat;
  while (current.parentID !== null) {
    const parent = allCats.find(c => c.categoryID === current.parentID);
    if (!parent) break;
    depth++;
    current = parent;
  }
  return depth;
}

// Get all ancestors path for breadcrumb
function getPath(cat, allCats) {
  const path = [];
  let current = cat;
  while (current) {
    path.unshift(current);
    if (current.parentID === null) break;
    current = allCats.find(c => c.categoryID === current.parentID);
  }
  return path;
}

function CategoryPicker({ categories: initialCategories, transType, onSelect, selectedID }) {
  const [categories, setCategories] = useState(initialCategories);
  const [selectedParent, setSelectedParent] = useState(null); // current drill-down level
  const [view, setView] = useState('list'); // 'list' | 'create'
  const [newCatName, setNewCatName] = useState('');
  const [creating, setCreating] = useState(false);

  // Sync categories when parent passes new ones
  // (not using useEffect to avoid complexity — parent refreshes on select)

  const inputStyle = {
    width: '100%',
    border: '1.5px solid #e5e7eb',
    borderRadius: 10,
    padding: '0.6rem 1rem',
    fontSize: '0.88rem',
    outline: 'none',
    boxSizing: 'border-box',
    background: 'white',
  };

  // Get items to show at current level
  const currentParentID = selectedParent ? selectedParent.categoryID : null;
  const currentItems = categories.filter(
    c => c.categoryType === transType && c.parentID === currentParentID
  );

  // Check depth of current level (can we go deeper?)
  const currentDepth = selectedParent ? getDepth(selectedParent, categories) + 1 : 0;
  const canGoDeeper = currentDepth < 3; // max 3 levels deep

  const handleSelect = (cat) => {
    const children = categories.filter(c => c.parentID === cat.categoryID);
    if (children.length > 0) {
      // Has children — drill into it
      setSelectedParent(cat);
    } else {
      // No children — select it directly
      onSelect(cat);
    }
  };


  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCreating(true);
    try {
      const result = await createCategory({
        name: newCatName.trim(),
        categoryType: transType,
        parentID: selectedParent ? selectedParent.categoryID : null,
        description: null,
      });
      // Refresh categories
      const fresh = await getCategories();
      setCategories(fresh);
      setNewCatName('');
      setView('list');
      // Auto-select the newly created category
      onSelect({ categoryID: result.categoryId, name: newCatName.trim() });
    } catch (err) {
      alert(err.message || 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  // Breadcrumb path
  const breadcrumb = selectedParent ? getPath(selectedParent, categories) : [];

  return (
    <div>
      {/* Breadcrumb navigation */}
      {breadcrumb.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          marginBottom: '0.5rem',
          fontSize: '0.8rem',
          color: '#6b7280',
          flexWrap: 'wrap',
        }}>
          <span
            onClick={() => { setSelectedParent(null); setView('list'); }}
            style={{ cursor: 'pointer', color: '#7c3aed', fontWeight: 600 }}
          >
            All
          </span>
          {breadcrumb.map((b, i) => (
            <span key={b.categoryID} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ color: '#d1d5db' }}>›</span>
              <span
                onClick={() => { setSelectedParent(b); setView('list'); }}
                style={{
                  cursor: 'pointer',
                  color: i === breadcrumb.length - 1 ? '#1e1b4b' : '#7c3aed',
                  fontWeight: i === breadcrumb.length - 1 ? 700 : 600,
                }}
              >
                {b.name}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div>
          {currentItems.length === 0 && !selectedParent ? (
            <div style={{
              padding: '1rem',
              border: '1.5px solid #e5e7eb',
              borderRadius: 10,
              color: '#9ca3af',
              fontSize: '0.85rem',
              textAlign: 'center',
              marginBottom: '0.5rem',
            }}>
              No categories yet
            </div>
          ) : (
            <div style={{
              maxHeight: 200,
              overflowY: 'auto',
              border: '1.5px solid #e5e7eb',
              borderRadius: 10,
              marginBottom: '0.5rem',
            }}>
              {/* Option to use parent category directly (when drilled in) */}
              {selectedParent && (
                <div
                  onClick={() => onSelect(selectedParent)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 1rem',
                    cursor: 'pointer',
                    borderBottom: currentItems.length > 0 ? '1px solid #f3f4f6' : 'none',
                    background: selectedID === selectedParent.categoryID ? '#f5f3ff' : '#fafafa',
                    fontSize: '0.82rem',
                    color: '#6b7280',
                    fontStyle: 'italic',
                  }}
                >
                  Use "{selectedParent.name}" (general)
                  {selectedID === selectedParent.categoryID && (
                    <span style={{ color: '#7c3aed' }}>✓</span>
                  )}
                </div>
              )}

              {/* Category items */}
              {currentItems.map((cat, i) => {
                const hasChildren = categories.some(c => c.parentID === cat.categoryID);
                const isSelected = selectedID === cat.categoryID;
                
              
                return (
                  <div
                    key={cat.categoryID}
                    onClick={() => handleSelect(cat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 1rem',
                      cursor: 'pointer',
                      borderBottom: i < currentItems.length - 1 ? '1px solid #f3f4f6' : 'none',
                      background: isSelected ? '#f5f3ff' : 'white',
                    }}
                  >
                    <span style={{
                      fontSize: '0.9rem',
                      color: isSelected ? '#7c3aed' : '#1e1b4b',
                      fontWeight: isSelected ? 600 : 400,
                    }}>
                      {currentParentID === null && getEmoji(cat.name)} {cat.name}
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                      {hasChildren ? '›' : isSelected ? '✓' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create button — only if under max depth */}
          {canGoDeeper && (
            <button
              onClick={() => setView('create')}
              style={{
                width: '100%',
                padding: '0.6rem',
                border: '1.5px dashed #d1d5db',
                borderRadius: 10,
                background: 'white',
                color: '#6b7280',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              + {selectedParent ? `Add subcategory under "${selectedParent.name}"` : `Create new ${transType} category`}
            </button>
          )}

          {/* Max depth message */}
          {!canGoDeeper && (
            <div style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              textAlign: 'center',
              padding: '0.4rem',
            }}>
              Maximum subcategory depth reached (3 levels)
            </div>
          )}
        </div>
      )}

      {/* CREATE VIEW */}
      {view === 'create' && (
        <div>
          <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            {selectedParent
              ? `New subcategory under "${selectedParent.name}"`
              : `New ${transType} category`}
          </div>
          <input
            type="text"
            placeholder="Category name..."
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
            style={inputStyle}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              onClick={() => { setView('list'); setNewCatName(''); }}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: 10,
                border: '1.5px solid #e5e7eb',
                background: 'white',
                color: '#374151',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCategory}
              disabled={creating || !newCatName.trim()}
              style={{
                flex: 2,
                padding: '0.6rem',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: creating ? 'not-allowed' : 'pointer',
                opacity: creating ? 0.7 : 1,
              }}
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryPicker;