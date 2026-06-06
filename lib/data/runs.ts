import type { Run } from '@/lib/types'

// ✏️ Replace with real Strava data or import from /api/strava
export const runs: Run[] = [
  {
    id: 'r1',
    name: 'Boulder Marathon',
    date: '2024-10-06',
    distance_mi: 26.2,
    time_s: 13140,
    elevation_ft: 820,
    pace_min_mi: 8.4,
    location: 'Boulder, CO',
    notes: '',
    route_points: [[0,0],[20,-5],[40,10],[60,0],[80,-10],[100,5],[120,0]],
    splits: [8.2,8.3,8.4,8.5,8.6,8.4,8.3,8.5,8.7,8.6,8.5,8.4,8.3,8.2,8.4,8.5,8.6,8.8,9.0,8.9,8.7,8.5,8.4,8.3,8.2,8.1],
  },
  {
    id: 'r2',
    name: 'Pikes Peak Ascent',
    date: '2024-08-17',
    distance_mi: 13.3,
    time_s: 10800,
    elevation_ft: 7815,
    pace_min_mi: 13.5,
    location: 'Manitou Springs, CO',
    notes: '',
    route_points: [[0,0],[10,15],[20,30],[30,50],[40,65],[50,80],[60,95],[70,110],[80,130]],
    splits: [11.2,12.0,13.5,14.2,15.0,15.8,16.2,14.5,12.8],
  },
  {
    id: 'r3',
    name: 'Denver Half',
    date: '2024-05-19',
    distance_mi: 13.1,
    time_s: 6240,
    elevation_ft: 310,
    pace_min_mi: 7.95,
    location: 'Denver, CO',
    notes: '',
    route_points: [[0,0],[15,-3],[30,2],[45,-1],[60,4],[75,-2],[90,0]],
    splits: [7.8,7.9,8.0,7.9,8.0,8.1,8.0,7.9,8.0,8.1,8.0,7.8,7.7],
  },
  {
    id: 'r4',
    name: 'Chatfield Trail 10K',
    date: '2024-03-02',
    distance_mi: 6.2,
    time_s: 2880,
    elevation_ft: 180,
    pace_min_mi: 7.74,
    location: 'Littleton, CO',
    notes: '',
    route_points: [[0,0],[10,5],[20,-2],[30,3],[40,-1],[50,2],[60,0]],
    splits: [7.6,7.7,7.8,7.7,7.8,7.7],
  },
  {
    id: 'r5',
    name: 'Golden Gate Canyon 25K',
    date: '2023-09-09',
    distance_mi: 15.5,
    time_s: 9900,
    elevation_ft: 3200,
    pace_min_mi: 10.65,
    location: 'Golden, CO',
    notes: '',
    route_points: [[0,0],[12,20],[24,35],[36,50],[48,40],[60,30],[72,45],[84,60],[96,50]],
    splits: [9.5,10.2,11.0,12.0,11.5,10.8,10.5,11.2,10.8,10.5,10.2,9.8,9.5,9.2,9.0],
  },
]

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${m}:${String(s).padStart(2,'0')}`
}

export function formatPace(pace: number): string {
  const m = Math.floor(pace)
  const s = Math.round((pace - m) * 60)
  return `${m}:${String(s).padStart(2,'0')}`
}
