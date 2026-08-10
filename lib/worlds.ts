import type { WorldId } from './world-store'

// Every world has a URL. Before this file the whole site was one route and the
// world lived in a zustand store, which meant no deep links, no back button,
// and a `te-return-world` localStorage hack standing in for an address bar.
//
// Two names per world. The **slug** is canonical — plain, guessable, and
// legible to someone who has never been here, because these are what people
// paste to each other. The **aliases** are the in-fiction names the worlds call
// themselves; they redirect to the slug, so they cost nothing and reward
// anyone who notices a designation somewhere and tries it in the address bar.

export interface WorldRoute {
  id: WorldId
  slug: string
  aliases: string[]
  /** Browser tab title. Mirrors WORLD_TITLES in world-store.ts. */
  title: string
}

export const WORLD_ROUTES: WorldRoute[] = [
  { id: 0,  slug: 'surface',    aliases: ['index', 'home'],                title: 'Surface' },
  { id: 1,  slug: 'universe',   aliases: ['hub', 'survey'],                title: 'Universe' },
  { id: 2,  slug: 'map',        aliases: ['sector-02b', 'explorer'],       title: 'Map' },
  { id: 3,  slug: 'broadcast',  aliases: ['kwnd', 'tv'],                   title: 'Broadcast' },
  { id: 5,  slug: 'machine',    aliases: ['emdur-486', 'dos'],             title: 'The Machine' },
  { id: 6,  slug: 'garage',     aliases: ['radio', 'midnight-garage'],     title: 'Garage' },
  { id: 7,  slug: 'contact',    aliases: ['te-0', 'endpoint'],             title: 'Contact' },
  { id: 8,  slug: 'departures', aliases: ['readers', 'plates'],            title: 'Departures' },
  { id: 9,  slug: 'messages',   aliases: ['tape', 'answering-machine'],    title: 'Messages' },
  { id: 10, slug: 'directory',  aliases: ['unshipped', 'built'],           title: 'The Directory' },
  { id: 14, slug: 'warehouse',  aliases: ['warehouse-14', 'aisle', 'w14'], title: 'Warehouse 14' },
]

const BY_SLUG = new Map<string, WorldRoute>(WORLD_ROUTES.map(w => [w.slug, w]))
const BY_ID = new Map<WorldId, WorldRoute>(WORLD_ROUTES.map(w => [w.id, w]))
const BY_ALIAS = new Map<string, WorldRoute>(
  WORLD_ROUTES.flatMap(w => w.aliases.map(a => [a, w] as const))
)

/** Canonical path for a world, e.g. `/map`. */
export function pathForWorld(id: WorldId): string {
  return `/${BY_ID.get(id)?.slug ?? 'surface'}`
}

/** Resolve a canonical slug only. Aliases redirect before reaching a page. */
export function worldForSlug(slug: string): WorldRoute | undefined {
  return BY_SLUG.get(slug)
}

/** Resolve an alias to the world it points at, for building redirects. */
export function worldForAlias(alias: string): WorldRoute | undefined {
  return BY_ALIAS.get(alias)
}

export const ALL_SLUGS = WORLD_ROUTES.map(w => w.slug)

/** `[{ from: 'kwnd', to: '/broadcast' }, ...]` — consumed by next.config.ts. */
export const ALIAS_REDIRECTS = WORLD_ROUTES.flatMap(w =>
  w.aliases.map(alias => ({ from: alias, to: `/${w.slug}` }))
)
