'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

// ─── STORE DATA ───────────────────────────────────────────────────────────────

const VEND_ITEMS = [
  { label: 'CERTAINTY', price: '$4.99', responses: ['OUT OF STOCK SINCE 2019', 'CHECKING INVENTORY…\nNOPE', 'FOUND SOME.\nIT EXPIRED.', 'SOLD TO SOMEONE ELSE'] },
  { label: 'SLEEP', price: '$2.11', responses: ['DISPENSING…\n[MECHANISM JAMS]', 'TRY THE STAIRS', '6–8 HOURS\n(ESTIMATED)', 'ALREADY DISPENSED\nCHECK UNDER THE BENCH'] },
  { label: 'PURPOSE', price: '$∞', responses: ['MACHINE VIBRATES\nTHEN GOES QUIET', 'SELECT COLUMN B\nCOLUMN B DOES NOT EXIST', 'PROCESSING…\nSTILL PROCESSING', 'RECEIPT:\n"GOOD QUESTION"'] },
  { label: 'REASONS', price: 'FREE', responses: ['TAKING TOO MANY', 'DISPENSING 3\nYOU ONLY ASKED FOR 1', 'NONE LEFT\nTRY CERTAINTY', 'MACHINE FLICKERS\nRETURNS YOUR COIN'] },
  { label: 'STATIC', price: '$0.01', responses: ['ALWAYS IN STOCK', '░░▒▓█\n█▓▒░░', 'FRESH BATCH', 'THIS ONE HAS TEETH'] },
  { label: 'THE ORIGINAL\nIDEA', price: '$???', responses: ['ALREADY YOURS\nSOMEONE ELSE BOUGHT THE COPY', 'SOLD 1,200 TIMES\nSTILL ONE LEFT', 'MACHINE HUMS\nTHEN GOES DARK', 'RECEIPT: "NICE TRY"'] },
]

const FOOD_ITEMS = [
  { name: 'TIME SOUP', desc: 'approx. 12 minutes', price: '$3.50', responses: ['SERVING IN ~12 MINUTES\n(MINUTES ARE APPROXIMATE)', 'HOT. EXTREMELY HOT.\nCOOLING TIME: UNKNOWN', 'BROTH SOURCE: UNCONFIRMED\nFLAVOR: FAMILIAR', 'ORDER PLACED\nETA: WHENEVER'] },
  { name: 'YESTERDAY', desc: 'out of stock', price: '$0.00', responses: ['OUT OF STOCK\nWAS IN STOCK YESTERDAY', 'SORRY. TRY TOMORROW.\n(TOMORROW IS ALSO YESTERDAY)', 'WE CHECKED THE BACK\nIT IS NOT THERE ANYMORE', 'NONE LEFT\nNEVER LEFT'] },
  { name: 'STATIC LG', desc: 'complimentary', price: 'always', responses: ['░░▒▓█ DISPENSING █▓▒░░', 'ALWAYS IN STOCK\nALWAYS', 'COMPLIMENTARY\nNO RECEIPT REQUIRED', '░▒▓ ENJOY ▓▒░\nCHARGES MAY APPLY'] },
  { name: 'DECISION', desc: 'takes ~3 business days', price: '$CONTACT', responses: ['ORDER PLACED\nESTIMATED DELIVERY: 3 BUSINESS DAYS\n(BUSINESS DAYS NOT GUARANTEED)', 'PROCESSING...\nSTILL PROCESSING', 'WE WILL REACH OUT\nWE WILL NOT REACH OUT', 'RECEIPT ISSUED\nDECISION STILL PENDING'] },
  { name: 'THE ORIGINAL\nFEELING', desc: 'limited qty', price: 'ask cashier', responses: ['CASHIER UNAVAILABLE\nYOU ALREADY KNOW THE PRICE', 'LIMITED QTY: 1\nALREADY YOURS', 'CANNOT BE PURCHASED\nONLY REMEMBERED', 'ASK CASHIER\n(CASHIER DOES NOT KNOW EITHER)'] },
  { name: 'CERTAINTY FRIES', desc: 'see vending machine', price: 'N/A', responses: ['SEE VENDING MACHINE\nVENDING MACHINE IS OUT', 'CRISPY. PROBABLY.\nFRYER STATUS: UNCERTAIN', 'N/A\n(NOT APPLICABLE / NOT AVAILABLE / NOT ANYMORE)', 'FOUND SOME IN BACK\nTHEY EXPIRED IN 2019'] },
]

const MANNEQUIN_LINES = [
  'what are you\nlooking at',
  "i don't actually\nhave eyes",
  'this outfit is from\nlast season\n(of something)',
  "i've been standing\nhere since 1994",
  'the collar was\nnot my idea',
  'please stop',
]

const PA_LINES = [
  'Attention shoppers: nothing has happened yet.',
  'Could the person standing still please continue standing still. Thank you.',
  'The food court is open. The food court has never been open.',
  'Attention: the exit has relocated. New coordinates pending.',
  'A mannequin in section C has filed a complaint. The complaint is you.',
  'The escalator is currently traveling sideways. This is normal.',
  'Lost and found contains: one left shoe, a frequency, and your previous excuse.',
  'Store closing in 30 minutes. Store closing has been ongoing for 4 years.',
  'Frequency 88.7 is currently unavailable in this location.',
]


// ─── STORES ALONG THE CORRIDOR ─────────────────────────────────────────────
// Each store: worldX position (0=center), worldZ depth, side, color, name
interface StoreDef {
  id: string
  z: number       // depth into corridor (1=near, 20=far)
  side: 'L' | 'R'
  color: string
  accentColor: string
  name: string
  sign: string
  interiorKey: 'vending' | 'food' | 'mannequins' | 'escalator'
}

const STORES: StoreDef[] = [
  { id: 'vending', z: 3, side: 'L', color: '#d01060', accentColor: '#ff85af', name: 'MACHINES', sign: 'CERTAINTY · SLEEP · PURPOSE', interiorKey: 'vending' },
  { id: 'food', z: 5.5, side: 'R', color: '#d06000', accentColor: '#ffc066', name: 'FOOD COURT', sign: 'TIME SOUP · YESTERDAY · STATIC', interiorKey: 'food' },
  { id: 'mannequins', z: 9, side: 'L', color: '#0080a0', accentColor: '#80d8f0', name: 'GALLERY', sign: 'UNIT A · UNIT B · UNIT C · UNIT D', interiorKey: 'mannequins' },
  { id: 'escalator', z: 13, side: 'R', color: '#5020a0', accentColor: '#c090ff', name: 'ESCALATOR', sign: 'DESTINATION UNCONFIRMED', interiorKey: 'escalator' },
]

// ─── PERSPECTIVE MATH ──────────────────────────────────────────────────────
const FL = 380 // focal length
function project(wx: number, wy: number, wz: number, camZ: number, W: number, H: number) {
  const relZ = wz - camZ
  if (relZ <= 0.01) return null
  const sx = W / 2 + (wx / relZ) * FL
  const sy = H * 0.46 + (wy / relZ) * FL
  return { x: sx, y: sy, scale: FL / relZ }
}

function drawCorridor(ctx: CanvasRenderingContext2D, W: number, H: number, camZ: number) {
  ctx.clearRect(0, 0, W, H)

  const vpy = H * 0.46
  const vpx = W / 2

  // ── Ceiling ──
  ctx.fillStyle = '#f0ece4'
  ctx.fillRect(0, 0, W, vpy)

  // ── Floor ──
  ctx.fillStyle = '#ddd8cc'
  ctx.fillRect(0, vpy, W, H - vpy)

  // ── Floor tile grid ──
  ctx.strokeStyle = 'rgba(180,170,155,0.4)'
  ctx.lineWidth = 0.5
  for (let gz = 1; gz <= 30; gz++) {
    for (let gx = -8; gx <= 8; gx++) {
      const p1 = project(gx, 1, gz, camZ, W, H)
      const p2 = project(gx + 1, 1, gz, camZ, W, H)
      const p3 = project(gx + 1, 1, gz + 1, camZ, W, H)
      const p4 = project(gx, 1, gz + 1, camZ, W, H)
      if (!p1 || !p2 || !p3 || !p4) continue
      if (p1.x < -W || p3.x > W * 2) continue
      const isLight = (gx + gz) % 2 === 0
      ctx.fillStyle = isLight ? 'rgba(240,236,230,0.6)' : 'rgba(215,210,200,0.6)'
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.lineTo(p3.x, p3.y)
      ctx.lineTo(p4.x, p4.y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }

  // ── Ceiling light strips ──
  for (let lz = 2; lz <= 28; lz += 4) {
    const top1 = project(-0.6, -1.2, lz, camZ, W, H)
    const top2 = project(0.6, -1.2, lz, camZ, W, H)
    const top3 = project(0.6, -1.2, lz + 1.5, camZ, W, H)
    const top4 = project(-0.6, -1.2, lz + 1.5, camZ, W, H)
    if (!top1 || !top2 || !top3 || !top4) continue
    ctx.fillStyle = 'rgba(255,255,240,0.9)'
    ctx.beginPath()
    ctx.moveTo(top1.x, top1.y)
    ctx.lineTo(top2.x, top2.y)
    ctx.lineTo(top3.x, top3.y)
    ctx.lineTo(top4.x, top4.y)
    ctx.closePath()
    ctx.fill()
    // glow
    const gx = (top1.x + top3.x) / 2
    const gy = (top1.y + top3.y) / 2
    const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, top1.scale * 3)
    gr.addColorStop(0, 'rgba(255,255,220,0.12)')
    gr.addColorStop(1, 'rgba(255,255,220,0)')
    ctx.fillStyle = gr
    ctx.fillRect(0, 0, W, vpy)
  }

  // ── Wall horizon lines ──
  // Left wall edge
  const lwall1 = project(-1, -1.2, 1, camZ, W, H)
  const lwall2 = project(-1, 1, 1, camZ, W, H)
  const lwallFar1 = project(-1, -1.2, 30, camZ, W, H)
  const lwallFar2 = project(-1, 1, 30, camZ, W, H)
  if (lwall1 && lwall2 && lwallFar1 && lwallFar2) {
    ctx.fillStyle = '#e0dbd0'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(lwall1.x, lwall1.y)
    ctx.lineTo(lwallFar1.x, lwallFar1.y)
    ctx.lineTo(vpx, vpy)
    ctx.lineTo(lwallFar2.x, lwallFar2.y)
    ctx.lineTo(lwall2.x, lwall2.y)
    ctx.lineTo(0, H)
    ctx.closePath()
    ctx.fill()
  }

  // Right wall edge
  const rwall1 = project(1, -1.2, 1, camZ, W, H)
  const rwall2 = project(1, 1, 1, camZ, W, H)
  const rwallFar1 = project(1, -1.2, 30, camZ, W, H)
  const rwallFar2 = project(1, 1, 30, camZ, W, H)
  if (rwall1 && rwall2 && rwallFar1 && rwallFar2) {
    ctx.fillStyle = '#e0dbd0'
    ctx.beginPath()
    ctx.moveTo(W, 0)
    ctx.lineTo(rwall1.x, rwall1.y)
    ctx.lineTo(rwallFar1.x, rwallFar1.y)
    ctx.lineTo(vpx, vpy)
    ctx.lineTo(rwallFar2.x, rwallFar2.y)
    ctx.lineTo(rwall2.x, rwall2.y)
    ctx.lineTo(W, H)
    ctx.closePath()
    ctx.fill()
  }
}

function drawStore(
  ctx: CanvasRenderingContext2D, store: StoreDef,
  W: number, H: number, camZ: number,
  hovered: boolean
) {
  const wallX = store.side === 'L' ? -1 : 1
  const storeZ = store.z
  const storeW = 2.2 // width in world units

  // Top left, top right, bottom right, bottom left — floor to head-height
  const pts = [
    project(wallX, -1, storeZ, camZ, W, H),              // top near
    project(wallX, -1, storeZ + storeW, camZ, W, H),     // top far
    project(wallX, 1, storeZ + storeW, camZ, W, H),      // bottom far
    project(wallX, 1, storeZ, camZ, W, H),               // bottom near
  ]

  if (pts.some(p => p === null)) return
  const [tln, tlf, blf, bln] = pts as NonNullable<typeof pts[0]>[]

  // Store face
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(tln.x, tln.y)
  ctx.lineTo(tlf.x, tlf.y)
  ctx.lineTo(blf.x, blf.y)
  ctx.lineTo(bln.x, bln.y)
  ctx.closePath()

  // Store face fill
  const faceGrad = ctx.createLinearGradient(tln.x, tln.y, bln.x, bln.y)
  faceGrad.addColorStop(0, hovered ? store.color : store.color + 'cc')
  faceGrad.addColorStop(1, hovered ? store.color + 'dd' : store.color + '88')
  ctx.fillStyle = faceGrad
  ctx.fill()

  // Hover brightness
  if (hovered) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fill()
  }

  // Store sign band at top
  const signH = (bln.y - tln.y) * 0.28
  ctx.beginPath()
  ctx.moveTo(tln.x, tln.y)
  ctx.lineTo(tlf.x, tlf.y)
  ctx.lineTo(tlf.x, tlf.y + signH)
  ctx.lineTo(tln.x, tln.y + signH)
  ctx.closePath()
  ctx.fillStyle = store.accentColor
  ctx.fill()

  // Store name on sign
  const signCx = (tln.x + tlf.x) / 2
  const signCy = tln.y + signH / 2
  const fontSize = Math.max(8, tln.scale * 14)
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${fontSize}px Arial Black, Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(store.name, signCx, signCy)

  // Window area in lower 2/3
  const winT = tln.y + signH + (bln.y - tln.y - signH) * 0.1
  const winB = bln.y - (bln.y - tln.y) * 0.08
  const winL = tln.x + (tlf.x - tln.x) * 0.1
  const winR = tlf.x - (tlf.x - tln.x) * 0.1
  ctx.beginPath()
  ctx.moveTo(winL, winT)
  ctx.lineTo(winR, winT)
  ctx.lineTo(winR, winB)
  ctx.lineTo(winL, winB)
  ctx.closePath()
  ctx.fillStyle = 'rgba(200,240,255,0.15)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 1
  ctx.stroke()

  // Sub-text below sign
  const subFontSize = Math.max(5, tln.scale * 7)
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = `${subFontSize}px Arial`
  ctx.fillText(store.sign, signCx, tln.y + signH + (bln.y - tln.y - signH) * 0.6)

  ctx.restore()
}

// ─── STORE INTERIOR OVERLAYS ──────────────────────────────────────────────

function VendingInterior() {
  const [vendIdx, setVendIdx] = useState<number | null>(null)
  const [vendResponse, setVendResponse] = useState('')
  const [vendPurchases, setVendPurchases] = useState(0)
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', padding: 4 }}>
      <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,133,175,0.6)', letterSpacing: '0.2em' }}>ROW C · PURCHASES: {vendPurchases}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1 }}>
        {VEND_ITEMS.map((item, i) => (
          <div key={i} style={{ background: '#0d0008', border: `1px solid ${vendIdx === i ? '#ff85af' : 'rgba(255,45,120,0.2)'}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ background: '#080006', padding: '10px 8px', minHeight: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid rgba(255,45,120,0.15)` }}>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: vendIdx === i ? '#ff85af' : 'rgba(255,133,175,0.45)', textAlign: 'center', letterSpacing: '0.06em', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {vendIdx === i ? vendResponse : item.label}
              </div>
            </div>
            <div style={{ padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,133,175,0.4)' }}>{item.price}</span>
              <button onClick={() => { const r = item.responses[Math.floor(Math.random() * item.responses.length)]; setVendIdx(i); setVendResponse(r); setVendPurchases(v => v + 1) }}
                style={{ background: '#ff2d78', border: 'none', color: '#fff', fontFamily: '"Arial Black", sans-serif', fontSize: 8, padding: '3px 10px', cursor: 'pointer' }}>
                SELECT
              </button>
            </div>
          </div>
        ))}
      </div>
      {vendPurchases >= 6 && (
        <div
          style={{ padding: '10px', background: '#0d0008', border: '1px solid rgba(255,45,120,0.3)', textAlign: 'center', fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,133,175,0.6)', lineHeight: 1.8 }}>
          ⚠ MACHINE C-7 MALFUNCTION<br /><span style={{ opacity: 0.5 }}>exit sealed · use ← universe</span>
        </div>
      )}
    </div>
  )
}

function FoodInterior() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [response, setResponse] = useState('')
  const [orders, setOrders] = useState(0)
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', padding: 4 }}>
      <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,204,102,0.6)', letterSpacing: '0.2em' }}>TODAY'S MENU · ORDERS: {orders}</div>
      <div style={{ background: '#110800', border: '1px solid rgba(255,149,0,0.2)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FOOD_ITEMS.map((item, i) => (
          <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,149,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 10, color: '#ffc066', lineHeight: 1.2, whiteSpace: 'pre-wrap' }}>{item.name}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,204,102,0.4)', fontStyle: 'italic' }}>{item.desc}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#ffc066' }}>{item.price}</span>
                <button onClick={() => { const r = item.responses[Math.floor(Math.random() * item.responses.length)]; setActiveIdx(i); setResponse(r); setOrders(o => o + 1) }}
                  style={{ background: '#d06000', border: 'none', color: '#fff', fontFamily: '"Arial Black", sans-serif', fontSize: 8, padding: '3px 10px', cursor: 'pointer' }}>
                  ORDER
                </button>
              </div>
            </div>
            {activeIdx === i && (
              <div style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 8, color: '#ffc066', background: '#080400', padding: '6px 8px', border: '1px solid rgba(255,149,0,0.2)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {response}
              </div>
            )}
          </div>
        ))}
      </div>
      {orders >= 5 && (
        <div style={{ padding: '10px', background: '#0d0800', border: '1px solid rgba(255,149,0,0.3)', textAlign: 'center', fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,204,102,0.6)', lineHeight: 1.8 }}>
          ⚠ SYSTEM NOTE: YOU HAVE ORDERED EVERYTHING<br /><span style={{ opacity: 0.5 }}>the cashier is watching · use ← universe</span>
        </div>
      )}
    </div>
  )
}

function MannequinInterior() {
  const [mannResponse, setMannResponse] = useState<{ idx: number; text: string } | null>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const mannRefs = useRef<(HTMLDivElement | null)[]>([])
  const [mannAngles, setMannAngles] = useState([0, 0, 0, 0])

  useEffect(() => {
    const move = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  useEffect(() => {
    let raf = 0
    function tick() {
      const angles = mannRefs.current.map(el => {
        if (!el) return 0
        const rect = el.getBoundingClientRect()
        const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2
        const angle = Math.atan2(mouseRef.current.y - cy, mouseRef.current.x - cx) * (180 / Math.PI)
        return Math.max(-45, Math.min(45, angle * 0.3))
      })
      setMannAngles(angles)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(144,224,239,0.6)', letterSpacing: '0.15em' }}>SECTION C · MOVE YOUR CURSOR</div>
      <div style={{ flex: 1, display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'flex-end', background: '#0a1a20', padding: '16px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} onClick={() => { const t = MANNEQUIN_LINES[Math.floor(Math.random() * MANNEQUIN_LINES.length)]; setMannResponse({ idx: i, text: t }); setTimeout(() => setMannResponse(null), 3000) }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
            <div ref={el => { mannRefs.current[i] = el }}
              style={{ width: 28, height: 28, borderRadius: '50%', background: '#d8d0c0', border: '2px solid #00b4d8', marginBottom: 2, transform: `rotate(${mannAngles[i]}deg)`, transition: 'transform 0.05s', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#333' }} />
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#333' }} />
              </div>
              {mannResponse?.idx === i && (
                <div style={{ position: 'absolute', bottom: 34, left: '50%', transform: 'translateX(-50%)', background: '#fff', border: '2px solid #00b4d8', padding: '6px 10px', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 9, color: '#0a1a20', minWidth: 120, textAlign: 'center', zIndex: 10 }}>
                  {mannResponse.text}
                </div>
              )}
            </div>
            <div style={{ width: 3, height: 10, background: '#b0a890' }} />
            <div style={{ width: 36, height: 60, background: i % 2 === 0 ? '#cc1122' : '#0044cc', border: '1px solid rgba(0,180,216,0.3)' }} />
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ width: 10, height: 42, background: '#333' }} />
              <div style={{ width: 10, height: 42, background: '#333' }} />
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 7, color: 'rgba(144,224,239,0.4)', marginTop: 4 }}>UNIT {String.fromCharCode(65 + i)}</div>
          </div>
        ))}
      </div>
      <div
        style={{ padding: '10px', background: '#555', textAlign: 'center', fontFamily: '"Arial Black", sans-serif', fontSize: 10, color: '#ccc' }}>
        FITTING ROOMS CLOSED
      </div>
    </div>
  )
}

function EscalatorInterior() {
  const [escUsed, setEscUsed] = useState(0)
  const [escWarning, setEscWarning] = useState('')
  const handleEscalator = useCallback(() => {
    const n = escUsed + 1
    setEscUsed(n)
    if (n === 1) { setEscWarning('CALIBRATING...'); return }
    if (n === 2) { setEscWarning('WARNING: DESTINATION UNCONFIRMED'); return }
    setEscWarning('ERROR: ALL EXITS SEALED')
  }, [escUsed])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '20px 0' }}>
      <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(199,125,255,0.6)', letterSpacing: '0.2em' }}>
        DESTINATION: {escUsed === 0 ? 'LEVEL 2' : escUsed === 1 ? 'CALCULATING...' : 'UNRESOLVABLE'}
      </div>
      {/* Escalator graphic */}
      <div style={{ width: 160, height: 120, background: '#0a0018', border: '2px solid #7b2d8b', overflow: 'hidden', position: 'relative' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', left: 0, right: 0, height: 14, top: `${i * 14}px`, background: i % 2 === 0 ? 'rgba(123,45,139,0.25)' : 'rgba(199,125,255,0.08)', borderBottom: '1px solid rgba(123,45,139,0.3)', animation: `escMove ${1.2}s linear infinite`, animationDelay: `${i * -0.15}s` }} />
        ))}
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', fontFamily: '"Arial Black", sans-serif', fontSize: 12, color: '#c077ff' }}>↑ ↑ ↑</div>
      </div>
      {escWarning && <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 10, color: '#c077ff', letterSpacing: '0.1em', textAlign: 'center' }}>{escWarning}</div>}
      <button onClick={handleEscalator}
        style={{ background: '#7b2d8b', border: 'none', color: '#fff', fontFamily: '"Arial Black", sans-serif', fontSize: 13, padding: '12px 36px', cursor: 'pointer', letterSpacing: '0.1em' }}>
        {escUsed === 0 ? '↑  RIDE' : escUsed === 1 ? '↑  PROCEED' : '↑  DEPART'}
      </button>
      <div style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(199,125,255,0.3)', textAlign: 'center', lineHeight: 2 }}>
        THIS ESCALATOR TRAVELS SIDEWAYS<br />MANAGEMENT NOT RESPONSIBLE FOR DRIFT
      </div>
      <style>{`@keyframes escMove { 0% { transform:translateY(-14px) } 100% { transform:translateY(0) } }`}</style>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function World7Mall() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const [W, setW] = useState(0)
  const [H, setH] = useState(0)
  const [camZ, setCamZ] = useState(0.5) // camera Z position in world space
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [camStart, setCamStart] = useState(0)
  const [activeStore, setActiveStore] = useState<StoreDef | null>(null)
  const [hoveredStore, setHoveredStore] = useState<string | null>(null)
  const [paLine, setPaLine] = useState('')
  const [paVisible, setPaVisible] = useState(false)
  const paIdx = useRef(0)
  const mousePosRef = useRef({ x: 0, y: 0 })

  // PA system
  useEffect(() => {
    const showPA = () => {
      setPaLine(PA_LINES[paIdx.current % PA_LINES.length])
      paIdx.current++
      setPaVisible(true)
      setTimeout(() => setPaVisible(false), 7000)
    }
    const t1 = setTimeout(showPA, 3000)
    const iv = setInterval(showPA, 24000)
    return () => { clearTimeout(t1); clearInterval(iv) }
  }, [])

  // Canvas sizing
  useEffect(() => {
    const resize = () => { setW(window.innerWidth); setH(window.innerHeight) }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || W === 0 || H === 0) return
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!

    function render() {
      drawCorridor(ctx, W, H, camZ)

      // Draw stores back-to-front
      const sorted = [...STORES].sort((a, b) => b.z - a.z)
      for (const store of sorted) {
        drawStore(ctx, store, W, H, camZ, hoveredStore === store.id)
      }

      rafRef.current = requestAnimationFrame(render)
    }
    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [W, H, camZ, hoveredStore])

  // Hit test: which store is under mouse?
  const getHoveredStore = useCallback((mx: number, my: number): string | null => {
    if (W === 0 || H === 0) return null
    for (const store of STORES) {
      const wallX = store.side === 'L' ? -1 : 1
      const pts = [
        project(wallX, -1, store.z, camZ, W, H),
        project(wallX, -1, store.z + 2.2, camZ, W, H),
        project(wallX, 1, store.z + 2.2, camZ, W, H),
        project(wallX, 1, store.z, camZ, W, H),
      ]
      if (pts.some(p => p === null)) continue
      const [tln, tlf, blf, bln] = pts as NonNullable<typeof pts[0]>[]
      // Simple bounding box test
      const minX = Math.min(tln.x, tlf.x, blf.x, bln.x)
      const maxX = Math.max(tln.x, tlf.x, blf.x, bln.x)
      const minY = Math.min(tln.y, tlf.y, blf.y, bln.y)
      const maxY = Math.max(tln.y, tlf.y, blf.y, bln.y)
      if (mx >= minX && mx <= maxX && my >= minY && my <= maxY) return store.id
    }
    return null
  }, [W, H, camZ])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY }
    if (isDragging) {
      const delta = (e.clientX - dragStart) / W * 15
      setCamZ(Math.max(0, Math.min(16, camStart - delta)))
    } else {
      setHoveredStore(getHoveredStore(e.clientX, e.clientY))
    }
  }, [isDragging, dragStart, camStart, W, getHoveredStore])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart(e.clientX)
    setCamStart(camZ)
  }

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    setIsDragging(false)
    // If barely dragged, treat as click
    if (Math.abs(e.clientX - dragStart) < 6) {
      const store = STORES.find(s => s.id === getHoveredStore(e.clientX, e.clientY))
      if (store) setActiveStore(store)
    }
  }, [dragStart, getHoveredStore])

  const activeColor = activeStore
    ? { bg: activeStore.color, accent: activeStore.accentColor }
    : { bg: '#1a1a2e', accent: '#aaa' }

  return (
    <div
      data-world="7"
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', userSelect: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Perspective mall canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0,
          cursor: isDragging ? 'grabbing' : hoveredStore ? 'pointer' : 'grab',
        }}
      />

      {/* Mall header sign */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        background: 'linear-gradient(180deg, rgba(26,26,46,0.95) 0%, rgba(26,26,46,0) 100%)',
        padding: '14px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'none', zIndex: 10,
      }}>
        <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 18, color: '#fff', letterSpacing: '0.2em', textShadow: '0 0 20px rgba(255,45,120,0.6)' }}>
          SIGNAL RIDGE MALL
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>
          EST. 1993 · ALWAYS OPEN · NEVER CLOSING
        </div>
      </div>

      {/* PA announcement */}
      {paVisible && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(26,26,46,0.92)', border: '1px solid rgba(255,45,120,0.3)',
          padding: '10px 24px', zIndex: 30,
          display: 'flex', alignItems: 'center', gap: 12,
          animation: 'paFade 7s both',
          pointerEvents: 'none',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff2d78', boxShadow: '0 0 8px #ff2d78', animation: 'paBlink 0.5s step-end infinite' }} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#fff', letterSpacing: '0.08em' }}>{paLine}</div>
        </div>
      )}

      {/* Walk hint */}
      <div style={{
        position: 'absolute', bottom: 18, right: 24,
        fontFamily: 'monospace', fontSize: 9,
        color: 'rgba(0,0,0,0.3)', letterSpacing: '0.15em', pointerEvents: 'none',
      }}>
        DRAG TO WALK
      </div>

      {/* Store interior panel */}
      {activeStore && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={e => { if (e.target === e.currentTarget) setActiveStore(null) }}
        >
          <div style={{
            width: 'min(92vw, 540px)',
            maxHeight: '85vh',
            background: '#0a0808',
            border: `3px solid ${activeColor.bg}`,
            display: 'flex', flexDirection: 'column',
            boxShadow: `0 0 60px ${activeColor.bg}40`,
            overflow: 'hidden',
          }}>
            {/* Store header */}
            <div style={{ background: activeColor.bg, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: '"Arial Black", sans-serif', fontSize: 16, color: '#fff', letterSpacing: '0.1em' }}>
                {activeStore.name}
              </div>
              <button onClick={() => setActiveStore(null)}
                style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', fontFamily: '"Arial Black", sans-serif', fontSize: 11, padding: '4px 14px', cursor: 'pointer' }}>
                ← BACK
              </button>
            </div>
            {/* Store content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {activeStore.interiorKey === 'vending' && <VendingInterior />}
              {activeStore.interiorKey === 'food' && <FoodInterior />}
              {activeStore.interiorKey === 'mannequins' && <MannequinInterior />}
              {activeStore.interiorKey === 'escalator' && <EscalatorInterior />}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes paFade { 0% { opacity:0 } 10% { opacity:1 } 80% { opacity:1 } 100% { opacity:0 } }
        @keyframes paBlink { 0%,100% { opacity:1 } 50% { opacity:0 } }
      `}</style>
      <HomeButton />
    </div>
  )
}
