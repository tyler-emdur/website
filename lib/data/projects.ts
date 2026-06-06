import type { Project } from '@/lib/types'

// ✏️ Replace with your real projects
export const projects: Project[] = [
  {
    id: 'p1',
    title: 'This Site',
    year: 2026,
    description: 'A digital world. Built weird on purpose.',
    tech: ['Next.js', 'TypeScript', 'Canvas 2D', 'Framer Motion', 'GSAP'],
    status: 'wip',
    links: { github: 'https://github.com/tyler-emdur/website' },
    x: 10, y: 8, rotation: -2,
  },
  {
    id: 'p2',
    title: 'Digger',
    year: 2025,
    description: 'Spotify music discovery. Find what you actually want to hear.',
    tech: ['React', 'Spotify API', 'Node.js'],
    status: 'shipped',
    links: { github: 'https://github.com/tyler-emdur/digger' },
    x: 55, y: 12, rotation: 1.5,
  },
  {
    id: 'p3',
    title: 'Experiment 003',
    year: 2025,
    description: 'Something that didn\'t ship. Still interesting.',
    tech: ['Python', 'FastAPI'],
    status: 'archived',
    links: {},
    x: 30, y: 55, rotation: -1,
  },
  {
    id: 'p4',
    title: 'TBD',
    year: 2026,
    description: 'Working on it.',
    tech: [],
    status: 'wip',
    links: {},
    x: 68, y: 50, rotation: 2,
  },
]
