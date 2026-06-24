import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function TrendChart({ data, trendMonths, onTrendMonthsChange, loading }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e5e7eb', padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: '1rem', fontWeight: 700 }}>Trend Overview</h3>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[1, 3, 6, 12].map(m => (
            <button
              key={m}
              onClick={() => onTrendMonthsChange(m)}
              style={{
                padding: '0.3rem 0.65rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.78rem', transition: 'all 0.15s',
                background: trendMonths === m ? '#1e1b4b' : '#f3f4f6',
                color: trendMonths === m ? 'white' : '#6b7280',
              }}
            >
              {m}M
            </button>
          ))}
        </div>
      </div>
      <p style={{ margin: '0.25rem 0 1rem', color: '#9ca3af', fontSize: '0.8rem' }}>
        Income vs expenses per month, with balance trend
      </p>

      <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#86efac' }} />
          <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 600 }}>Income</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#fca5a5' }} />
          <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 600 }}>Expenses</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 20, height: 3, borderRadius: 2, background: '#7c3aed' }} />
          <span style={{ fontSize: '0.78rem', color: '#374151', fontWeight: 600 }}>Balance</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          <div style={{
            width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#7c3aed',
            borderRadius: '50%', margin: '0 auto 0.75rem', animation: 'spin 0.7s linear infinite',
          }} />
          Updating chart...
        </div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
          Not enough data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]}
            />
            <Bar dataKey="income" name="Income" fill="#86efac" radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Bar dataKey="expenses" name="Expenses" fill="#fca5a5" radius={[4, 4, 0, 0]} maxBarSize={36} />
            <Line type="monotone" dataKey="balance" name="Balance" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default TrendChart;
