export type AreaId = 'run' | 'build' | 'archive' | 'explore' | 'lab'

export interface Run {
  id: string
  name: string
  date: string
  distance_mi: number
  time_s: number
  elevation_ft: number
  pace_min_mi: number
  location: string
  notes: string
  route_points: Array<[number, number]>
  splits: number[]
}

export interface Project {
  id: string
  title: string
  year: number
  description: string
  tech: string[]
  status: 'shipped' | 'wip' | 'archived'
  links: { live?: string; github?: string; case?: string }
  x: number
  y: number
  rotation: number
}

export interface Memory {
  id: string
  year: number
  type: 'photo' | 'note' | 'object'
  title: string
  content: string
  x: number
  y: number
  rotation: number
  width: number
}

export interface Adventure {
  id: string
  location: string
  state: string
  elevation_ft: number
  date: string
  lat: number
  lng: number
  description: string
  color: string
}

export interface Experiment {
  id: string
  title: string
  description: string
  tag: string
}
