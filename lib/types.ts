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

export interface Experiment {
  id: string
  title: string
  description: string
  tag: string
}
