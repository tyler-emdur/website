'use client'
import { VOID_OBJECTS } from '@/lib/universe-store'
import { renderObject } from '../objects/UniverseObjectRenderer'

export default function VoidObjects() {
  return <group>{VOID_OBJECTS.map(renderObject)}</group>
}
