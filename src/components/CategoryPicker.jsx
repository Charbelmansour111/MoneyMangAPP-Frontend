import { useState } from 'react';
import { getSubCategories, createSubCategory, createCategory } from '../services/api';

const CATEGORY_ICONS = {
  'Food & Dining': '🍽️',
  'Transport': '🚗',
  'Shopping': '🛍️',
  'Bills & Utilities': '💡',
  'Health': '❤️',
  'Entertainment': '🎬',
  'Education': '📚',
  'Subscriptions': '📱',
  'Salary': '💼',
  'Freelance': '💻',
  'Investment': '📈',
  'Gift': '🎁',
  'Other Income': '💰',
  'Other Expense': '📦',
};

function CategoryPicker({ categories: initialCategories, transType, onSelect, selectedID, onCategoriesUpdate }) {
  const [categories, setCategories] = useState(initialCategories);
  const [activeRoot, setActiveRoot] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const rootCats = categories.filter(c =>
    (c.categoryType === transType || c.categoryType === transType) &&
    c.name !== 'Other Income' && c.name !== 'Other Expense'
  );

const getIcon = (cat) => CATEGORY_ICONS[cat.name] || (cat.categoryType === 'income' ? '💰' : '🏷️');

  const handleRootClick = async (cat) => {
    if (activeRoot?.categoryID === cat.categoryID) {
      setActiveRoot(null);
      setSubCategories([]);
      setShowCustomInput(false);
      return;
    }

    onSelect({ categoryID: cat.categoryID, name: cat.name });
    setActiveRoot(cat);
    setShowCustomInput(false);
    setLoadingSubs(true);
    try {
      const subs = await getSubCategories(cat.categoryID);
      setSubCategories(subs);
    } catch (err) {
      console.error('Failed to load subcategories', err);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleSubClick = (sub) => {
    onSelect({
      categoryID: activeRoot.categoryID,
      subCategoryID: sub.subCategoryID,
      name: sub.name
    });
    setActiveRoot(null);
    setSubCategories([]);
  };

  const handleCustomCreate = async () => {
    if (!customName.trim() || !activeRoot) return;
    setCreating(true);
    try {
      const result = await createSubCategory({
        categoryID: activeRoot.categoryID,
        name: customName.trim()
      });
      const newSub = { subCategoryID: result.subCategoryId, name: customName.trim() };
      setSubCategories(prev => [...prev, newSub]);
      onSelect({
        categoryID: activeRoot.categoryID,
        subCategoryID: result.subCategoryId,
        name: customName.trim()
      });
      setCustomName('');
      setShowCustomInput(false);
      setActiveRoot(null);
      setSubCategories([]);
    } catch (err) {
      alert(err.message || 'Failed to create subcategory');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      await createCategory({
        name: newCategoryName.trim(),
        categoryType: transType,
      });
      // refresh categories
      const { getCategories } = await import('../services/api');
      const fresh = await getCategories();
      setCategories(fresh);
      if (onCategoriesUpdate) onCategoriesUpdate(fresh);
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    } catch (err) {
      alert(err.message || 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const selectedCat = selectedID ? categories.find(c => c.categoryID === selectedID) : null;

  return (
    <div>
      {/* Root categories grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.45rem',
        marginBottom: '0.6rem',
      }}>
        {rootCats.map(cat => {
          const isActive = activeRoot?.categoryID === cat.categoryID;
          const isSelected = selectedCat?.categoryID === cat.categoryID;
          return (
            <button
              key={cat.categoryID}
              onClick={() => handleRootClick(cat)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.6rem 0.25rem',
                borderRadius: 12,
                border: isActive
                  ? '2px solid #7c3aed'
                  : isSelected
                    ? '2px solid #a78bfa'
                    : '1.5px solid #e5e7eb',
                background: isActive ? '#f5f3ff' : isSelected ? '#faf5ff' : 'white',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>
                {getIcon(cat)}
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                color: isActive ? '#7c3aed' : '#374151',
                textAlign: 'center',
                lineHeight: 1.2,
              }}>
                {cat.name}
              </span>
              {isSelected && !isActive && (
                <span style={{ fontSize: '0.6rem', color: '#7c3aed', fontWeight: 700 }}>✓</span>
              )}
            </button>
          );
        })}

        {/* + Add Category button */}
        {!showNewCategoryInput && (
          <button
            onClick={() => setShowNewCategoryInput(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.6rem 0.25rem',
              borderRadius: 12,
              border: '1.5px dashed #d1d5db',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>➕</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#9ca3af', textAlign: 'center' }}>
              New
            </span>
          </button>
        )}

        {rootCats.length === 0 && !showNewCategoryInput && (
          <div style={{
            gridColumn: '1/-1',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '0.85rem',
            padding: '1rem',
          }}>
            No categories yet.
          </div>
        )}
      </div>

      {/* New Category Input */}
      {showNewCategoryInput && (
        <div style={{
          background: '#f5f3ff',
          border: '1.5px solid #ddd6fe',
          borderRadius: 12,
          padding: '0.75rem',
          marginBottom: '0.6rem',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', marginBottom: '0.5rem' }}>
            New {transType} category
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <input
              type="text"
              placeholder="e.g. Rent, Gym, Travel..."
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateCategory();
                if (e.key === 'Escape') { setShowNewCategoryInput(false); setNewCategoryName(''); }
              }}
              autoFocus
              style={{
                flex: 1,
                border: '1.5px solid #ddd6fe',
                borderRadius: 8,
                padding: '0.4rem 0.75rem',
                fontSize: '0.82rem',
                outline: 'none',
                background: 'white',
              }}
            />
            <button
              onClick={handleCreateCategory}
              disabled={creatingCategory || !newCategoryName.trim()}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: 8,
                border: 'none',
                background: '#7c3aed',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: creatingCategory || !newCategoryName.trim() ? 'not-allowed' : 'pointer',
                opacity: creatingCategory || !newCategoryName.trim() ? 0.5 : 1,
              }}
            >
              {creatingCategory ? '...' : 'Add'}
            </button>
            <button
              onClick={() => { setShowNewCategoryInput(false); setNewCategoryName(''); }}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: 8,
                border: '1.5px solid #e5e7eb',
                background: 'white',
                color: '#6b7280',
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Subcategory panel */}
      {activeRoot && (
        <div style={{
          background: '#faf5ff',
          border: '1.5px solid #ddd6fe',
          borderRadius: 12,
          padding: '0.75rem',
          marginBottom: '0.25rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.6rem',
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed' }}>
              {getIcon(activeRoot)} {activeRoot.name} ✓
            </span>
            <button
              onClick={() => { setActiveRoot(null); setSubCategories([]); setShowCustomInput(false); }}
              style={{ border: 'none', background: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              ✕
            </button>
          </div>

          {loadingSubs && (
            <div style={{ fontSize: '0.8rem', color: '#a78bfa', marginBottom: '0.5rem' }}>Loading...</div>
          )}

          {!loadingSubs && subCategories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
              {subCategories.map(sub => {
                const isSel = selectedID === sub.subCategoryID;
                return (
                  <button
                    key={sub.subCategoryID}
                    onClick={() => handleSubClick(sub)}
                    style={{
                      padding: '0.35rem 0.8rem',
                      borderRadius: 20,
                      border: isSel ? '2px solid #7c3aed' : '1.5px solid #c4b5fd',
                      background: isSel ? '#7c3aed' : 'white',
                      color: isSel ? 'white' : '#4c1d95',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isSel && '✓ '}{sub.name}
                  </button>
                );
              })}
            </div>
          )}

          {!loadingSubs && subCategories.length === 0 && (
            <div style={{ fontSize: '0.78rem', color: '#a78bfa', marginBottom: '0.5rem' }}>
              No subcategories yet — add one below
            </div>
          )}

          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              style={{
                width: '100%',
                padding: '0.38rem',
                border: '1.5px dashed #d1d5db',
                borderRadius: 8,
                background: 'transparent',
                color: '#9ca3af',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Add subcategory
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
              <input
                type="text"
                placeholder="e.g. Gym Membership"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCustomCreate();
                  if (e.key === 'Escape') { setShowCustomInput(false); setCustomName(''); }
                }}
                autoFocus
                style={{
                  flex: 1,
                  border: '1.5px solid #ddd6fe',
                  borderRadius: 8,
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.82rem',
                  outline: 'none',
                  background: 'white',
                }}
              />
              <button
                onClick={handleCustomCreate}
                disabled={creating || !customName.trim()}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: 8,
                  border: 'none',
                  background: '#7c3aed',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: creating || !customName.trim() ? 'not-allowed' : 'pointer',
                  opacity: creating || !customName.trim() ? 0.5 : 1,
                }}
              >
                {creating ? '...' : 'Add'}
              </button>
              <button
                onClick={() => { setShowCustomInput(false); setCustomName(''); }}
                style={{
                  padding: '0.4rem 0.6rem',
                  borderRadius: 8,
                  border: '1.5px solid #e5e7eb',
                  background: 'white',
                  color: '#6b7280',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CategoryPicker;