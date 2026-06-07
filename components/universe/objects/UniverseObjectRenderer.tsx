import Planet from './Planet'
import Station from './Station'
import Anomaly from './Anomaly'
import Signal from './Signal'
import Wormhole from './Wormhole'
import Fragment from './Fragment'
import type { UniverseObject } from '@/lib/universe-store'

export function renderObject(obj: UniverseObject) {
  switch (obj.type) {
    case 'planet':   return <Planet   key={obj.id} obj={obj} />
    case 'station':  return <Station  key={obj.id} obj={obj} />
    case 'anomaly':  return <Anomaly  key={obj.id} obj={obj} />
    case 'signal':   return <Signal   key={obj.id} obj={obj} />
    case 'wormhole': return <Wormhole key={obj.id} obj={obj} />
    case 'fragment': return <Fragment key={obj.id} obj={obj} />
    default:         return null
  }
}
