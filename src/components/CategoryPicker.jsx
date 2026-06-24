import { useState, useEffect } from 'react';
import { createCategory, getCategories } from '../services/api';
import { CATEGORY_ICONS } from '../utils/categoryIcons';

function CategoryPicker({ categories: initialCategories, transType, onSelect, selectedID }) {
  const [categories, setCategories] = useState(initialCategories);
  const [activeRoot, setActiveRoot] = useState(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const sync = () => setCategories(initialCategories);
    sync();
  }, [initialCategories]);

  const rootCats = categories.filter(c => c.categoryType === transType && c.parentID == null);

  const handleRootClick = (cat) => {
    if (activeRoot?.categoryID === cat.categoryID) {
      setActiveRoot(null);
      setShowCustomInput(false);
      return;
    }
    const children = categories.filter(c => c.parentID === cat.categoryID);
    if (children.length === 0) {
      onSelect(cat);
    } else {
      setActiveRoot(cat);
      setShowCustomInput(false);
    }
  };

  const handleSubClick = (cat) => {
    onSelect(cat);
    setActiveRoot(null);
  };

  const handleQuickAdd = async (name) => {
    if (!activeRoot || creating) return;
    setCreating(true);
    try {
      const result = await createCategory({
        name,
        categoryType: transType,
        parentID: activeRoot.categoryID,
        description: null,
      });
      const fresh = await getCategories();
      setCategories(fresh);
      const newID = result.categoryId ?? result.categoryID;
      const created = fresh.find(c => String(c.categoryID) === String(newID))
        || { categoryID: newID, name, parentID: activeRoot.categoryID };
      onSelect(created);
      setActiveRoot(null);
    } catch (err) {
      alert(err.message || 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const handleCustomCreate = async () => {
    if (!customName.trim() || !activeRoot) return;
    await handleQuickAdd(customName.trim());
    setCustomName('');
    setShowCustomInput(false);
  };

  const selectedCat = selectedID != null
    ? categories.find(c => String(c.categoryID) === String(selectedID))
    : null;

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
          const isSelected = selectedCat && (
            String(selectedCat.categoryID) === String(cat.categoryID) ||
            String(selectedCat.parentID) === String(cat.categoryID)
          );
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
                {CATEGORY_ICONS[cat.name] || '📁'}
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

        {rootCats.length === 0 && (
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

      {/* Subcategory panel */}
      {activeRoot && (() => {
        const existingSubs = categories.filter(c => c.parentID === activeRoot.categoryID);

        return (
          <div style={{
            background: '#faf5ff',
            border: '1.5px solid #ddd6fe',
            borderRadius: 12,
            padding: '0.75rem',
            marginBottom: '0.25rem',
          }}>
            {/* Panel header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.6rem',
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed' }}>
                {CATEGORY_ICONS[activeRoot.name] || '📁'} {activeRoot.name}
              </span>
              <button
                onClick={() => { setActiveRoot(null); setShowCustomInput(false); }}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#a78bfa',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  lineHeight: 1,
                  padding: '0 2px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Existing subcategories */}
            {existingSubs.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
                {existingSubs.map(sub => {
                  const isSel = String(selectedID) === String(sub.categoryID);
                  return (
                    <button
                      key={sub.categoryID}
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
                        transition: 'all 0.12s',
                      }}
                    >
                      {isSel && '✓ '}{sub.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* No subcategories message */}
            {existingSubs.length === 0 && (
              <div style={{
                fontSize: '0.78rem',
                color: '#a78bfa',
                marginBottom: '0.5rem',
              }}>
                No subcategories yet — add one below
              </div>
            )}

            {/* Custom create */}
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
        );
      })()}
    </div>
  );
}

export default CategoryPicker;
