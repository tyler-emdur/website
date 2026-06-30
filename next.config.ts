import type { NextConfig } from 'next'
import { execSync } from 'child_process'

let lastCommitDate = ''
try {
  lastCommitDate = execSync('git log -1 --format=%cd --date=iso-strict').toString().trim()
} catch {}

const config: NextConfig = {
  env: {
    NEXT_PUBLIC_LAST_COMMIT_DATE: lastCommitDate,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.strava.com' },
    ],
  },
}

export default config
