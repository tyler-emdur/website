import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ALL_SLUGS, worldForSlug } from '@/lib/worlds'
import { IDENTITY } from '@/lib/identity'
import WorldSync from './WorldSync'

// One static page per world. The world itself renders from the root layout —
// this page only tells the store which one to show, so arriving at /map
// directly and walking to it through a portal end up in the same state.

export function generateStaticParams() {
  return ALL_SLUGS.map(world => ({ world }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ world: string }> }): Promise<Metadata> {
  const { world } = await params
  const route = worldForSlug(world)
  if (!route) return {}
  const title = `${route.title} — ${IDENTITY.name}`
  return { title, openGraph: { title, type: 'website' } }
}

export default async function WorldPage({ params }: { params: Promise<{ world: string }> }) {
  const { world } = await params
  const route = worldForSlug(world)
  if (!route) notFound()
  return <WorldSync worldId={route.id} />
}
