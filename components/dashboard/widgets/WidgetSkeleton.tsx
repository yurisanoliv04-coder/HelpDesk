export default function WidgetSkeleton() {
  return (
    <div style={{
      width: '100%', height: '100%', minHeight: 120,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      display: 'flex', flexDirection: 'column', gap: 10,
      padding: 20,
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div style={{ height: 10, width: '40%', background: 'var(--border)', borderRadius: 4 }} />
      <div style={{ height: 8, width: '70%', background: 'var(--border)', borderRadius: 4 }} />
      <div style={{ height: 8, width: '55%', background: 'var(--border)', borderRadius: 4 }} />
      <div style={{ flex: 1, background: 'var(--border)', borderRadius: 6, marginTop: 8 }} />
    </div>
  )
}
