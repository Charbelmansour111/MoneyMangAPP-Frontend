import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const PIE_COLORS = [
  '#7c3aed','#ef4444','#059669','#f59e0b','#3b82f6',
  '#ec4899','#14b8a6','#f97316','#84cc16','#06b6d4',
];

function ExpensePieChart({ data, selectedCategory, onSelectCategory }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
        No expenses this period
      </div>
    );
  }

  const handleClick = (entry) => {
    if (onSelectCategory) {
      onSelectCategory(entry.categoryName);
    }
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="categoryName"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            onClick={(entry) => handleClick(entry)}
            style={{ cursor: 'pointer' }}
          >
            {data.map((entry, index) => {
              const isSelected = selectedCategory === entry.categoryName;
              const isOther = selectedCategory && !isSelected;
              return (
                <Cell
                  key={index}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                  opacity={isOther ? 0.3 : 1}
                  stroke={isSelected ? '#1e1b4b' : 'none'}
                  strokeWidth={isSelected ? 3 : 0}
                />
              );
            })}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]}
            contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: '0.82rem' }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem 0.75rem', justifyContent: 'center', marginTop: '0.5rem' }}>
        {data.map((cat, i) => {
          const isSelected = selectedCategory === cat.categoryName;
          const isOther = selectedCategory && !isSelected;
          return (
            <div
              key={i}
              onClick={() => handleClick(cat)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', opacity: isOther ? 0.4 : 1, transition: 'opacity 0.15s' }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#1e1b4b' : '#6b7280' }}>
                {cat.categoryName} {cat.percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ExpensePieChart;