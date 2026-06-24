import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PIE_COLORS = ['#7c3aed', '#a78bfa', '#4c1d95', '#ddd6fe', '#6d28d9', '#c4b5fd'];

function ExpensePieChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
        No expenses this month
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="categoryName"
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={100}
            paddingAngle={3}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ minWidth: 160 }}>
        {data.map((cat, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
            <div style={{ fontSize: '0.82rem', color: '#374151' }}>
              <span style={{ fontWeight: 600 }}>{cat.categoryName}</span>
              <span style={{ color: '#9ca3af' }}> {cat.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExpensePieChart;
