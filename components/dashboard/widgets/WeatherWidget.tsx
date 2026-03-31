import { getWeather } from '@/lib/dashboard/fetchers/weather'

export default async function WeatherWidget() {
  const w = await getWeather()

  const outer: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', height: '100%',
  }
  const card: React.CSSProperties = {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 8, flex: 1, display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  }

  if (!w) {
    return (
      <div style={outer}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p className="section-label">── CLIMA</p>
        </div>
        <div style={{ ...card, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontSize: 32 }}>🌐</span>
          <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', textAlign: 'center' }}>
            Clima indisponível.<br />Verifique a conexão.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={outer}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p className="section-label">── CLIMA · {w.city.toUpperCase()}</p>
        <p style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', opacity: 0.5 }}>
          atualizado a cada 30 min
        </p>
      </div>

      <div style={card}>
        {/* Main temp block */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 6, padding: '20px 16px',
        }}>
          <span style={{ fontSize: 52, lineHeight: 1 }}>{w.emoji}</span>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: 52, fontWeight: 700, lineHeight: 1,
              color: 'var(--text-primary)',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '-2px',
            }}>
              {w.temperature}°
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {w.description}
            </p>
          </div>

          {/* High / Low */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 2 }}>
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#f87171' }}>
              ▲ {w.tempMax}°
            </span>
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#38bdf8' }}>
              ▼ {w.tempMin}°
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', borderTop: '1px solid var(--border)',
          background: 'var(--bg-input)',
        }}>
          {[
            { label: 'Sensação', value: `${w.feelsLike}°C` },
            { label: 'Umidade',  value: `${w.humidity}%` },
            { label: 'Vento',    value: `${w.windSpeed} km/h` },
          ].map((stat, i, arr) => (
            <div
              key={stat.label}
              style={{
                flex: 1, padding: '10px 8px', textAlign: 'center',
                borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <p style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.label}
              </p>
              <p style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', fontWeight: 600 }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
