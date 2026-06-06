import { NextResponse } from 'next/server'
import type { Run } from '@/lib/types'

// ✏️ Activate: add these to Vercel env vars
// STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN

async function getStravaToken(): Promise<string | null> {
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN } = process.env
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) return null

  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: STRAVA_REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  return data.access_token ?? null
}

export async function GET() {
  try {
    const token = await getStravaToken()
    if (!token) {
      return NextResponse.json({ error: 'Strava not configured', configured: false }, { status: 200 })
    }

    const res = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=50&type=Run', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const activities = await res.json()

    const runs: Run[] = activities
      .filter((a: Record<string,unknown>) => a.type === 'Run')
      .map((a: Record<string,unknown>, i: number) => ({
        id:           String(a.id),
        name:         String(a.name),
        date:         String(a.start_date).split('T')[0],
        distance_mi:  Number(a.distance) / 1609.34,
        time_s:       Number(a.moving_time),
        elevation_ft: Number(a.total_elevation_gain) * 3.28084,
        pace_min_mi:  (Number(a.moving_time) / 60) / (Number(a.distance) / 1609.34),
        location:     String(a.location_city || a.timezone || ''),
        notes:        '',
        route_points: [],
        splits:       [],
      }))

    return NextResponse.json({ runs, configured: true })
  } catch (e) {
    return NextResponse.json({ error: String(e), configured: false }, { status: 500 })
  }
}
