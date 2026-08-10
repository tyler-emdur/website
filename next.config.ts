import type { NextConfig } from 'next'
import { execSync } from 'child_process'
import { ALIAS_REDIRECTS } from './lib/worlds'

let lastCommitDate = ''
try {
  lastCommitDate = execSync('git log -1 --format=%cd --date=iso-strict').toString().trim()
} catch {}

const config: NextConfig = {
  // StrictMode's dev-only double-mount kills the WebGL context in worlds that
  // use drei <Text> (troika) — dev then loses the canvas while prod is fine.
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_LAST_COMMIT_DATE: lastCommitDate,
  },
  // Every world answers to its in-fiction designation as well as its slug —
  // /kwnd, /emdur-486, /sector-02b. They redirect rather than render so there
  // is still exactly one canonical URL per world to share.
  async redirects() {
    return ALIAS_REDIRECTS.map(({ from, to }) => ({
      source: `/${from}`,
      destination: to,
      permanent: false,
    }))
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.strava.com' },
    ],
  },
}

export default config
