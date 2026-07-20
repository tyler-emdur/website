'use client'
import { useRef, useEffect, useState, useCallback } from 'react'

// ── 40 LINE SPRINT ───────────────────────────────────────────────────────────
// Clear forty lines as fast as you can. That is the whole game.
//
// Built to be genuinely quick to play, not a toy: 7-bag randomiser, SRS
// rotation with wall kicks, hold, ghost piece, lock delay that resets on
// movement, and DAS/ARR tuned the way sprint players expect (a beat of delay,
// then the piece slides at frame rate). Rendered on a canvas so a fast soft
// drop never costs a re-render.

const COLS = 10
const ROWS = 20
const HIDDEN = 2          // spawn rows above the visible field
const CELL = 22

// timings, in ms — these are the feel of the game
const DAS = 110           // hold a direction this long before it repeats
const ARR = 0             // then repeat every frame
const SOFT_DROP = 14      // ms per row while holding down
const LOCK_DELAY = 480
const MAX_LOCK_RESETS = 15

type Piece = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z'

const COLORS: Record<Piece, string> = {
  I: '#4aa3dd',
  J: '#2b44b5',
  L: '#e0631f',
  O: '#e8b33a',
  S: '#6aab35',
  T: '#a83a8f',
  Z: '#8a3d2a',
}

// spawn states, in a 4x4 (I) or 3x3 box
const SHAPES: Record<Piece, number[][]> = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
}

// SRS kick tables. offsets tried in order when a rotation is blocked.
const KICKS_JLSTZ: Record<string, [number, number][]> = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
}
const KICKS_I: Record<string, [number, number][]> = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
}

function rotate(m: number[][], dir: 1 | -1): number[][] {
  const n = m.length
  const out = Array.from({ length: n }, () => Array(n).fill(0))
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (dir === 1) out[x][n - 1 - y] = m[y][x]
    else out[n - 1 - x][y] = m[y][x]
  }
  return out
}

interface Active { p: Piece; m: number[][]; x: number; y: number; r: number }

export default function Tetris({ onWin }: { onWin?: (ms: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [lines, setLines] = useState(40)
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState<null | number>(null)
  const [dead, setDead] = useState(false)

  // all mutable game state lives in a ref — the render loop reads it directly
  // rather than round-tripping through React on every frame
  const g = useRef({
    grid: [] as (Piece | null)[][],
    cur: null as Active | null,
    hold: null as Piece | null,
    canHold: true,
    bag: [] as Piece[],
    next: [] as Piece[],
    cleared: 0,
    started: 0,
    over: false,
    won: false,
    gravity: 0,
    lockAt: 0,
    lockResets: 0,
    keys: {} as Record<string, { down: number; last: number }>,
  })

  const reset = useCallback(() => {
    const s = g.current
    s.grid = Array.from({ length: ROWS + HIDDEN }, () => Array(COLS).fill(null))
    s.bag = []; s.next = []
    s.hold = null; s.canHold = true
    s.cleared = 0; s.over = false; s.won = false
    s.started = performance.now()
    s.gravity = 0; s.lockAt = 0; s.lockResets = 0
    s.keys = {}
    s.cur = null
    setLines(40); setElapsed(0); setDone(null); setDead(false)
  }, [])

  useEffect(() => { reset() }, [reset])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const cx = cv.getContext('2d')
    if (!cx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const W = COLS * CELL + 1
    const H = ROWS * CELL + 1
    const PANEL = 118
    cv.width = (W + PANEL) * dpr
    cv.height = H * dpr
    cv.style.width = `${W + PANEL}px`
    cv.style.height = `${H}px`
    cx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const s = g.current

    const refillBag = () => {
      const bag: Piece[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z']
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[bag[i], bag[j]] = [bag[j], bag[i]]
      }
      s.bag.push(...bag)
    }
    const pull = (): Piece => {
      while (s.bag.length < 8) refillBag()
      return s.bag.shift()!
    }
    const collides = (m: number[][], px: number, py: number) => {
      for (let y = 0; y < m.length; y++) for (let x = 0; x < m[y].length; x++) {
        if (!m[y][x]) continue
        const gx = px + x, gy = py + y
        if (gx < 0 || gx >= COLS || gy >= ROWS + HIDDEN) return true
        if (gy >= 0 && s.grid[gy][gx]) return true
      }
      return false
    }
    const spawn = (p?: Piece) => {
      while (s.next.length < 5) s.next.push(pull())
      const piece = p ?? s.next.shift()!
      while (s.next.length < 5) s.next.push(pull())
      const m = SHAPES[piece].map(r => [...r])
      const x = piece === 'O' ? 4 : 3
      const cur: Active = { p: piece, m, x, y: 0, r: 0 }
      if (collides(m, cur.x, cur.y)) { s.over = true; setDead(true) }
      s.cur = cur
      s.lockAt = 0; s.lockResets = 0
    }

    const lockPiece = () => {
      const c = s.cur!
      for (let y = 0; y < c.m.length; y++) for (let x = 0; x < c.m[y].length; x++) {
        if (!c.m[y][x]) continue
        const gy = c.y + y, gx = c.x + x
        if (gy >= 0) s.grid[gy][gx] = c.p
      }
      // clear full rows
      let n = 0
      for (let y = s.grid.length - 1; y >= 0; y--) {
        if (s.grid[y].every(v => v)) {
          s.grid.splice(y, 1)
          s.grid.unshift(Array(COLS).fill(null))
          n++; y++
        }
      }
      if (n) {
        s.cleared += n
        setLines(Math.max(0, 40 - s.cleared))
        if (s.cleared >= 40) {
          s.won = true
          const ms = performance.now() - s.started
          setDone(ms)
          onWin?.(ms)
        }
      }
      s.canHold = true
      if (!s.won && !s.over) spawn()
    }

    const tryMove = (dx: number, dy: number) => {
      const c = s.cur
      if (!c) return false
      if (collides(c.m, c.x + dx, c.y + dy)) return false
      c.x += dx; c.y += dy
      if (s.lockAt && s.lockResets < MAX_LOCK_RESETS) { s.lockAt = 0; s.lockResets++ }
      return true
    }
    const tryRotate = (dir: 1 | -1) => {
      const c = s.cur
      if (!c || c.p === 'O') return
      const nr = (c.r + (dir === 1 ? 1 : 3)) % 4
      const m = rotate(c.m, dir)
      const table = c.p === 'I' ? KICKS_I : KICKS_JLSTZ
      const kicks = table[`${c.r}>${nr}`] ?? [[0, 0]]
      for (const [kx, ky] of kicks) {
        if (!collides(m, c.x + kx, c.y - ky)) {
          c.m = m; c.x += kx; c.y -= ky; c.r = nr
          if (s.lockAt && s.lockResets < MAX_LOCK_RESETS) { s.lockAt = 0; s.lockResets++ }
          return
        }
      }
    }
    const hardDrop = () => {
      const c = s.cur
      if (!c) return
      while (!collides(c.m, c.x, c.y + 1)) c.y++
      lockPiece()
    }
    const doHold = () => {
      const c = s.cur
      if (!c || !s.canHold) return
      const prev = s.hold
      s.hold = c.p
      s.canHold = false
      if (prev) spawn(prev)
      else spawn()
    }

    const ghostY = () => {
      const c = s.cur
      if (!c) return 0
      let y = c.y
      while (!collides(c.m, c.x, y + 1)) y++
      return y
    }

    // ── input ────────────────────────────────────────────────────────────
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      const handled = ['arrowleft', 'arrowright', 'arrowdown', 'arrowup', ' ', 'c', 'z', 'x', 'f4'].includes(k)
      if (handled) e.preventDefault()
      if (k === 'f4') { reset(); return }
      if (s.over || s.won) return
      if (!s.keys[k]) s.keys[k] = { down: performance.now(), last: 0 }
      switch (k) {
        case 'arrowleft': tryMove(-1, 0); break
        case 'arrowright': tryMove(1, 0); break
        case 'arrowdown': tryMove(0, 1); break
        case 'arrowup': case 'x': tryRotate(1); break
        case 'z': tryRotate(-1); break
        case ' ': hardDrop(); break
        case 'c': doHold(); break
      }
    }
    const onKeyUp = (e: KeyboardEvent) => { delete s.keys[e.key.toLowerCase()] }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)

    // ── draw ─────────────────────────────────────────────────────────────
    const cell = (x: number, y: number, color: string, alpha = 1) => {
      cx.globalAlpha = alpha
      cx.fillStyle = color
      cx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 1, CELL - 1)
      cx.globalAlpha = 1
    }
    // the landing preview. it has to read clearly against black without
    // competing with the live piece, so: filled at low alpha plus a solid
    // outline, rather than one very dark fill.
    const ghostCell = (x: number, y: number, color: string) => {
      cx.globalAlpha = 0.3
      cx.fillStyle = color
      cx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 1, CELL - 1)
      cx.globalAlpha = 0.85
      cx.strokeStyle = color
      cx.lineWidth = 2
      cx.strokeRect(x * CELL + 2, y * CELL + 2, CELL - 3, CELL - 3)
      cx.globalAlpha = 1
    }

    const drawMini = (p: Piece, ox: number, oy: number, size: number) => {
      const m = SHAPES[p]
      // trim empty rows/cols so the piece sits centred, like the reference
      let minX = 9, maxX = -1, minY = 9, maxY = -1
      for (let y = 0; y < m.length; y++) for (let x = 0; x < m[y].length; x++) {
        if (m[y][x]) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y) }
      }
      const w = (maxX - minX + 1) * size
      cx.fillStyle = COLORS[p]
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        if (!m[y][x]) continue
        cx.fillRect(ox - w / 2 + (x - minX) * size, oy + (y - minY) * size, size - 1, size - 1)
      }
    }

    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = now - last
      last = now
      if (!s.cur && !s.over && !s.won) spawn()

      if (!s.over && !s.won && s.cur) {
        // DAS / ARR horizontal repeat
        for (const [k, dir] of [['arrowleft', -1], ['arrowright', 1]] as const) {
          const st = s.keys[k]
          if (!st) continue
          const held = now - st.down
          if (held >= DAS && now - st.last >= ARR) { tryMove(dir, 0); st.last = now }
        }
        // soft drop
        const sd = s.keys['arrowdown']
        if (sd && now - sd.last >= SOFT_DROP) { tryMove(0, 1); sd.last = now }

        // gravity — sprint speed, but the player usually outruns it
        s.gravity += dt
        if (s.gravity > 700) { s.gravity = 0; tryMove(0, 1) }

        // lock delay
        if (collides(s.cur.m, s.cur.x, s.cur.y + 1)) {
          if (!s.lockAt) s.lockAt = now
          else if (now - s.lockAt >= LOCK_DELAY) lockPiece()
        } else s.lockAt = 0

        setElapsed(now - s.started)
      }

      // ── paint ──
      cx.clearRect(0, 0, cv.width, cv.height)
      cx.fillStyle = '#000'
      cx.fillRect(0, 0, W + PANEL, H)

      // grid lines
      cx.strokeStyle = 'rgba(255,255,255,0.13)'
      cx.lineWidth = 1
      cx.beginPath()
      for (let x = 0; x <= COLS; x++) { cx.moveTo(x * CELL + 0.5, 0); cx.lineTo(x * CELL + 0.5, H) }
      for (let y = 0; y <= ROWS; y++) { cx.moveTo(0, y * CELL + 0.5); cx.lineTo(W, y * CELL + 0.5) }
      cx.stroke()
      // field border
      cx.strokeStyle = 'rgba(255,255,255,0.5)'
      cx.strokeRect(0.5, 0.5, W - 1, H - 1)

      // settled blocks
      for (let y = HIDDEN; y < s.grid.length; y++) for (let x = 0; x < COLS; x++) {
        const v = s.grid[y][x]
        if (v) cell(x, y - HIDDEN, COLORS[v])
      }

      // ghost + active
      if (s.cur && !s.over) {
        const c = s.cur
        const gy = ghostY()
        for (let y = 0; y < c.m.length; y++) for (let x = 0; x < c.m[y].length; x++) {
          if (!c.m[y][x]) continue
          const vy = gy + y - HIDDEN
          if (vy >= 0) ghostCell(c.x + x, vy, COLORS[c.p])
        }
        for (let y = 0; y < c.m.length; y++) for (let x = 0; x < c.m[y].length; x++) {
          if (!c.m[y][x]) continue
          const vy = c.y + y - HIDDEN
          if (vy >= 0) cell(c.x + x, vy, COLORS[c.p])
        }
      }

      // ── side panel ──
      const px = W + 26
      if (s.hold) {
        cx.fillStyle = 'rgba(255,255,255,0.3)'
        cx.font = '9px ui-monospace, monospace'
        cx.textAlign = 'left'
        cx.fillText('HOLD', px - 4, 14)
        drawMini(s.hold, px + 34, 24, 13)
      }
      // the queue has to clear the counter at the bottom of the panel, so the
      // spacing is derived from the room actually available rather than guessed
      const qTop = s.hold ? 72 : 24
      const qBottom = H - 92
      const step = Math.min(58, (qBottom - qTop) / 5)
      for (let i = 0; i < 5; i++) {
        const p = s.next[i]
        if (!p) break
        drawMini(p, px + 34, qTop + i * step, 14)
      }

      // counter
      cx.textAlign = 'center'
      cx.fillStyle = '#c8c8c8'
      cx.font = '38px ui-sans-serif, system-ui, sans-serif'
      cx.fillText(String(Math.max(0, 40 - s.cleared)), px + 34, H - 74)
      cx.fillStyle = 'rgba(255,255,255,0.42)'
      cx.font = '11px ui-sans-serif, system-ui, sans-serif'
      cx.fillText('lines remaining', px + 34, H - 52)
      cx.fillText('F4 to restart', px + 34, H - 36)

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [reset, onWin])

  const secs = (ms: number) => `${(ms / 1000).toFixed(2)}s`

  return (
    <div style={{ background: '#000', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 8 }}>
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>
      <div style={{
        fontFamily: 'ui-monospace, monospace', fontSize: 10, color: 'rgba(255,255,255,0.4)',
        textAlign: 'center', padding: '0 0 8px',
      }}>
        {done !== null
          ? <span style={{ color: '#6aab35' }}>40 LINES — {secs(done)}</span>
          : dead
            ? <span style={{ color: '#c0392b' }}>TOPPED OUT — F4</span>
            : <>{secs(elapsed)} · {lines} left · ←→ move · ↑/X rot · Z ccw · SPACE drop · C hold</>}
      </div>
    </div>
  )
}
