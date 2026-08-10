'use client'
import { useEffect, useState } from 'react'
import { BUILD_COMMIT_DATE, commitsApi, formatUpdated, formatUpdatedShort } from '@/lib/identity'

export interface SiteCommit {
  /** Raw ISO timestamp from GitHub, for anything that wants its own format. */
  iso: string
  /** "August 7, 2026" */
  label: string
  /** "08.07.26" */
  shortDate: string
  /** "2026-08-07" — the terminal's log format. */
  isoDate: string
  /** First line of the commit message. */
  message: string
}

/**
 * The repo's own commit history, read live from GitHub.
 *
 * Both the retro surface and the machine's terminal were fetching this
 * endpoint separately with slightly different parsing; they now share one
 * shape so a commit reads the same in every world that shows it.
 *
 * `lastUpdated` is null until something real is known — the site would rather
 * say nothing than print a date it can't back up. Callers should hide the
 * stamp while it's null rather than substituting today's date.
 */
export function useSiteCommits(count = 5) {
  const [commits, setCommits] = useState<SiteCommit[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(commitsApi(count))
      .then(r => r.json())
      .then(d => {
        if (cancelled || !Array.isArray(d)) return
        const parsed: SiteCommit[] = d
          .map((c): SiteCommit => {
            const iso = c?.commit?.committer?.date ?? ''
            return {
              iso,
              label: formatUpdated(iso || null),
              shortDate: formatUpdatedShort(iso || null),
              isoDate: iso.slice(0, 10),
              message: ((c?.commit?.message ?? '').split('\n')[0]) as string,
            }
          })
          .filter(c => c.iso)
        if (parsed.length) setCommits(parsed)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [count])

  // Live feed first. The build-time git date is the fallback for the moment
  // before the fetch lands, or for when GitHub is unreachable.
  const source = commits?.[0]?.iso || BUILD_COMMIT_DATE
  const lastUpdated = source ? formatUpdated(source) : null

  return { commits, lastUpdated, lastMessage: commits?.[0]?.message ?? null }
}
