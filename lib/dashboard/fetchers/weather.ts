export interface WeatherData {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  weatherCode: number
  description: string
  emoji: string
  tempMax: number
  tempMin: number
  city: string
}

// WMO Weather Interpretation Codes
const WMO: Record<number, { emoji: string; desc: string }> = {
  0:  { emoji: '☀️',  desc: 'Céu limpo' },
  1:  { emoji: '🌤️', desc: 'Predomin. limpo' },
  2:  { emoji: '⛅',  desc: 'Parcialmente nublado' },
  3:  { emoji: '☁️',  desc: 'Nublado' },
  45: { emoji: '🌫️', desc: 'Neblina' },
  48: { emoji: '🌫️', desc: 'Geada com neblina' },
  51: { emoji: '🌦️', desc: 'Garoa leve' },
  53: { emoji: '🌦️', desc: 'Garoa moderada' },
  55: { emoji: '🌧️', desc: 'Garoa intensa' },
  61: { emoji: '🌧️', desc: 'Chuva leve' },
  63: { emoji: '🌧️', desc: 'Chuva moderada' },
  65: { emoji: '🌧️', desc: 'Chuva forte' },
  71: { emoji: '❄️',  desc: 'Neve leve' },
  73: { emoji: '❄️',  desc: 'Neve moderada' },
  75: { emoji: '❄️',  desc: 'Neve forte' },
  80: { emoji: '🌦️', desc: 'Pancadas leves' },
  81: { emoji: '🌦️', desc: 'Pancadas moderadas' },
  82: { emoji: '🌧️', desc: 'Pancadas fortes' },
  95: { emoji: '⛈️', desc: 'Trovoada' },
  96: { emoji: '⛈️', desc: 'Trovoada c/ granizo' },
  99: { emoji: '⛈️', desc: 'Trovoada c/ granizo' },
}

function resolveCode(code: number) {
  return WMO[code] ?? { emoji: '🌡️', desc: 'Condição desconhecida' }
}

// Default: São Paulo, BR
const LATITUDE  = -23.5505
const LONGITUDE = -46.6333
const CITY      = 'São Paulo'
const TIMEZONE  = 'America/Sao_Paulo'

export async function getWeather(): Promise<WeatherData | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${LATITUDE}&longitude=${LONGITUDE}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min` +
      `&timezone=${encodeURIComponent(TIMEZONE)}` +
      `&forecast_days=1`

    const res = await fetch(url, { next: { revalidate: 1800 } }) // cache 30 min
    if (!res.ok) return null

    const json = await res.json()
    const cur  = json.current
    const day  = json.daily

    if (!cur || !day) return null

    const code = cur.weather_code as number
    const { emoji, desc } = resolveCode(code)

    return {
      temperature: Math.round(cur.temperature_2m),
      feelsLike:   Math.round(cur.apparent_temperature),
      humidity:    cur.relative_humidity_2m,
      windSpeed:   Math.round(cur.wind_speed_10m),
      weatherCode: code,
      description: desc,
      emoji,
      tempMax: Math.round(day.temperature_2m_max[0]),
      tempMin: Math.round(day.temperature_2m_min[0]),
      city: CITY,
    }
  } catch {
    return null
  }
}
