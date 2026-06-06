import type { Adventure } from '@/lib/types'

// ✏️ Replace with real locations
export const adventures: Adventure[] = [
  { id: 'a1', location: 'Pikes Peak', state: 'CO', elevation_ft: 14115, date: '2024-08', lat: 38.8405, lng: -105.0442, description: 'America\'s Mountain.', color: '#22C55E' },
  { id: 'a2', location: 'Rocky Mountain NP', state: 'CO', elevation_ft: 12183, date: '2024-07', lat: 40.3428, lng: -105.6836, description: 'Trail Ridge Road at sunset.', color: '#4ADE80' },
  { id: 'a3', location: 'Maroon Bells', state: 'CO', elevation_ft: 14163, date: '2023-09', lat: 39.0708, lng: -106.9890, description: 'Most photographed peaks in CO.', color: '#16A34A' },
  { id: 'a4', location: 'Black Canyon', state: 'CO', elevation_ft: 8404, date: '2023-06', lat: 38.5754, lng: -107.7416, description: 'Depth you can\'t understand from photos.', color: '#15803D' },
  { id: 'a5', location: 'Great Sand Dunes', state: 'CO', elevation_ft: 8175, date: '2024-05', lat: 37.7916, lng: -105.5943, description: 'Tallest dunes in North America.', color: '#86EFAC' },
  { id: 'a6', location: 'Zion', state: 'UT', elevation_ft: 8726, date: '2023-03', lat: 37.2982, lng: -113.0263, description: 'Angels Landing in the rain.', color: '#4ADE80' },
]
