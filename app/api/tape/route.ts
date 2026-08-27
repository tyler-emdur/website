import { NextResponse } from 'next/server'
import { promises as fs, constants as fsConstants } from 'fs'
import path from 'path'

// Visitor messages left on the answering machine (world 9).
// Stored as a flat JSON file — fine for a personal site. On serverless hosts
// the write may not persist between instances; the client keeps a local copy
// and the UI is honest about it.

// The tape is state, not a build artifact — never prerender this.
export const dynamic = 'force-dynamic'

const TAPE_PATH = path.join(process.cwd(), '.tape', 'messages.json')
const MAX_MESSAGES = 200
const MAX_LENGTH = 280

interface TapeMessage {
  id: string
  name: string
  text: string
  at: string
}

async function readTape(): Promise<TapeMessage[]> {
  try {
    const raw = await fs.readFile(TAPE_PATH, 'utf8')
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/**
 * Can this instance actually keep a message? On a read-only serverless
 * filesystem it can't, and the machine's phone line is drawn unplugged because
 * of it. Checked by asking the directory, not by writing a probe file.
 */
async function tapeWritable(): Promise<boolean> {
  const dir = path.dirname(TAPE_PATH)
  try {
    await fs.mkdir(dir, { recursive: true })
    await fs.access(dir, fsConstants.W_OK)
    return true
  } catch {
    return false
  }
}

export async function GET() {
  const [messages, live] = await Promise.all([readTape(), tapeWritable()])
  return NextResponse.json({ messages: messages.slice(-40), live })
}

export async function POST(req: Request) {
  let body: { name?: string; text?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }

  const text = (body.text ?? '').trim().slice(0, MAX_LENGTH)
  const name = (body.name ?? '').trim().slice(0, 40) || 'unknown caller'
  if (!text) return NextResponse.json({ error: 'empty message' }, { status: 400 })

  const message: TapeMessage = {
    id: Math.random().toString(36).slice(2, 10),
    name,
    text,
    at: new Date().toISOString(),
  }

  try {
    const messages = await readTape()
    messages.push(message)
    await fs.mkdir(path.dirname(TAPE_PATH), { recursive: true })
    await fs.writeFile(TAPE_PATH, JSON.stringify(messages.slice(-MAX_MESSAGES), null, 2))
    return NextResponse.json({ ok: true, persisted: true, message })
  } catch {
    return NextResponse.json({ ok: true, persisted: false, message })
  }
}
