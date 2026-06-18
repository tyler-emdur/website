import { NextResponse } from 'next/server'
import type { Run } from '@/lib/types'

async function getToken(): Promise<string | null> {
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN, STRAVA_ACCESS_TOKEN } = process.env

  // Try refresh flow first (long-lived)
  if (STRAVA_CLIENT_ID && STRAVA_CLIENT_SECRET && STRAVA_REFRESH_TOKEN) {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        refresh_token: STRAVA_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.access_token) return data.access_token
    }
  }

  // Fall back to static access token
  return STRAVA_ACCESS_TOKEN ?? null
}

export async function GET() {
  try {
    const token = await getToken()
    if (!token) return NextResponse.json({ error: 'Strava not configured', configured: false }, { status: 200 })

    const res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=50', {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    })

    if (!res.ok) return NextResponse.json({ error: `Strava error ${res.status}`, configured: true }, { status: 200 })

    const activities = await res.json()
    const runs: Run[] = activities
      .filter((a: Record<string, unknown>) => a.type === 'Run')
      .map((a: Record<string, unknown>) => ({
        id:           String(a.id),
        name:         String(a.name),
        date:         String(a.start_date).split('T')[0],
        distance_mi:  Number(a.distance) / 1609.34,
        time_s:       Number(a.moving_time),
        elevation_ft: Number(a.total_elevation_gain) * 3.28084,
        pace_min_mi:  (Number(a.moving_time) / 60) / (Number(a.distance) / 1609.34),
        location:     String(a.location_city || a.timezone || 'Colorado'),
        notes:        '',
        route_points: [],
        splits:       [],
      }))

    return NextResponse.json({ runs, configured: true })
  } catch (e) {
    return NextResponse.json({ error: String(e), configured: false }, { status: 500 })
  }
}
