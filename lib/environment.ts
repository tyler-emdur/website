// One sky over eleven worlds.
//
// The worlds don't share objects or state — nothing you pick up in the
// warehouse turns up on the answering machine, and it shouldn't. What they
// share is a *world*: it is the same hour in Boulder in all of them, and the
// same weather outside. That's the connective tissue. It costs the visitor
// nothing to notice and nothing to miss, and it means the site is one place
// observed from eleven angles rather than eleven demos behind one menu.
//
// Each world reads this in its own dialect. The retro surface prints a clock
// and a temperature; the hub renders it as survey telemetry; the garage lets it
// decide whether light is coming under the door. Same facts, eleven voices —
// which is the same rule lib/identity.ts enforces for who runs the place.
//
// Everything here is real. Nothing in this file may invent a value: a fabricated
// temperature would be exactly the "decorative telemetry" the project bans.

'use client'
import { useEffect, useState } from 'react'

/** Downtown Boulder — the origin every world's geography hangs off. */
export const BOULDER = { lat: 40.015, lon: -105.2705, tz: 'America/Denver' } as const

export type DayPhase = 'night' | 'dawn' | 'day' | 'dusk'

export interface Environment {
  /** Real wall-clock time in Boulder, whatever timezone the visitor is in. */
  hour: number
  minute: number
  /** "12:47" */
  clock: string
  /** "AM" | "PM" */
  meridiem: 'AM' | 'PM'
  /** Sun elevation in degrees. Negative is below the horizon. */
  sunAltitude: number
  phase: DayPhase
  /** True when the sun is down — the one thing most worlds actually want. */
  isDark: boolean
  /** 0 at solar midnight, 1 at solar noon. For lighting that shouldn't snap. */
  daylight: number
  weather: { tempF: number; label: string } | null
}

const WEATHER_LABELS: Record<number, string> = {
  0: 'clear', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'foggy', 48: 'rime fog', 51: 'light drizzle', 53: 'drizzle',
  55: 'heavy drizzle', 61: 'light rain', 63: 'rain', 65: 'heavy rain',
  71: 'light snow', 73: 'snow', 75: 'heavy snow', 80: 'showers',
  81: 'rain showers', 82: 'heavy showers', 85: 'snow showers', 95: 'thunderstorm',
}

/** "03:12:47" in Boulder, 24-hour, for readouts that want seconds. */
export function boulderClockWithSeconds(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: BOULDER.tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(d)
}

/** Boulder's wall clock, regardless of where the visitor is. */
function boulderParts(d: Date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: BOULDER.tz, hour: 'numeric', minute: '2-digit', hour12: false,
  })
  const parts = fmt.formatToParts(d)
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10) % 24
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10)
  return { hour, minute }
}

// Standard low-precision solar position (NOAA's approximation). Good to well
// under a degree, which is far more than "is it dark out" needs, and avoids a
// dependency for something this small.
function sunAltitudeDeg(date: Date, lat: number, lon: number): number {
  const rad = Math.PI / 180
  const dayMs = 86400000
  const daysSinceEpoch = date.getTime() / dayMs - 10957.5 // days from J2000.0
  const meanAnomaly = (357.5291 + 0.98560028 * daysSinceEpoch) * rad
  const center =
    1.9148 * Math.sin(meanAnomaly) +
    0.02 * Math.sin(2 * meanAnomaly) +
    0.0003 * Math.sin(3 * meanAnomaly)
  const eclipticLon = (((357.5291 + 0.98560028 * daysSinceEpoch) + 102.9372 + center + 180) % 360) * rad
  const declination = Math.asin(Math.sin(eclipticLon) * Math.sin(23.4397 * rad))
  const solarTransit = daysSinceEpoch - lon / 360
  const hourAngle = ((solarTransit % 1) * 360 - 180) * rad
  const altitude = Math.asin(
    Math.sin(lat * rad) * Math.sin(declination) +
    Math.cos(lat * rad) * Math.cos(declination) * Math.cos(hourAngle)
  )
  return altitude / rad
}

function phaseFor(alt: number): DayPhase {
  if (alt > 6) return 'day'
  if (alt > -0.833) return alt > 3 ? 'day' : 'dusk' // sun on the horizon
  if (alt > -12) return 'dusk'
  return 'night'
}

export function readEnvironment(now: Date, weather: Environment['weather']): Environment {
  const { hour, minute } = boulderParts(now)
  const alt = sunAltitudeDeg(now, BOULDER.lat, BOULDER.lon)
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return {
    hour,
    minute,
    clock: `${h12}:${String(minute).padStart(2, '0')}`,
    meridiem: hour < 12 ? 'AM' : 'PM',
    sunAltitude: alt,
    phase: phaseFor(alt),
    isDark: alt <= -0.833,
    // Clamped so a world can lerp lighting instead of switching it.
    daylight: Math.max(0, Math.min(1, (alt + 6) / 46)),
    weather,
  }
}

let cachedWeather: Environment['weather'] = null
let weatherAt = 0
let inFlight: Promise<void> | null = null

/**
 * Real Boulder time and weather, shared by every world.
 *
 * The clock reruns each minute; the weather is fetched once and then cached
 * across worlds for fifteen minutes, so walking the whole site costs one
 * request rather than one per world. Weather is null until it lands — callers
 * must render the absence rather than substitute a number.
 */
export function useEnvironment(): Environment {
  const [env, setEnv] = useState<Environment>(() => readEnvironment(new Date(), cachedWeather))

  useEffect(() => {
    let alive = true
    const sync = () => { if (alive) setEnv(readEnvironment(new Date(), cachedWeather)) }

    if (!cachedWeather || Date.now() - weatherAt > 15 * 60_000) {
      inFlight ??= fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${BOULDER.lat}&longitude=${BOULDER.lon}` +
        `&current=temperature_2m,weather_code&temperature_unit=fahrenheit`
      )
        .then(r => r.json())
        .then(d => {
          const code = d?.current?.weather_code
          const temp = d?.current?.temperature_2m
          if (typeof temp === 'number') {
            cachedWeather = { tempF: Math.round(temp), label: WEATHER_LABELS[code] ?? 'unknown' }
            weatherAt = Date.now()
          }
        })
        .catch(() => {})
        .finally(() => { inFlight = null; sync() })
      inFlight.catch(() => {})
    }

    sync()
    const id = setInterval(sync, 20_000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return env
}
