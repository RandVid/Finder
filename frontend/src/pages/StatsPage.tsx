import { useEffect, useState } from 'react'
import { getMyStats } from '../api/stats'
import type { StatsOut } from '../types'

function StatCard({
  title,
  value,
  description,
  icon,
  accent,
}: {
  title: string
  value: string | number
  description: string
  icon: string
  accent: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-rose-50 opacity-70 blur-xl" />
      <div className="relative z-10">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br ${accent} text-white shadow-xl shadow-rose-200/40`}>
          <span className="text-xl">{icon}</span>
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-rose-500">{title}</p>
        <p className="text-4xl font-semibold text-slate-900 mt-4">{value}</p>
        <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  )
}

function formatPercent(value: number | null): string {
  return value === null ? 'N/A' : `${value.toFixed(1)}%`
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        setError(null)
        const data = await getMyStats()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading stats…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50 px-6 py-5 text-rose-700 shadow-sm">
        {error}
      </div>
    )
  }

  if (!stats) return null

  const avgMessages =
    stats.avg_messages_per_match === null
      ? '0'
      : stats.avg_messages_per_match.toFixed(1)

  const smashPassRatio = `${stats.smashes_made} / ${stats.passes_made}`
  const smashSuccessRate = formatPercent(stats.smash_success_rate)
  const incomingInterestRate = formatPercent(stats.incoming_interest_rate)
  const hardToGetRate = formatPercent(stats.hard_to_get_rate)

  const heroHighlights = [
    {
      label: 'Momentum',
      value: `${stats.total_matches} matches`,
      description: 'Your connection streak this month.',
    },
    {
      label: 'Smash energy',
      value: smashSuccessRate,
      description: 'Match rate when you go all in.',
    },
    {
      label: 'Inbox vibe',
      value: `${avgMessages} msgs/match`,
      description: 'Average conversation depth per match.',
    },
  ]

  const statCards = [
    {
      title: 'Swipes made',
      value: stats.total_swipes_made,
      description: 'Profiles you have swiped on.',
      icon: '👆',
      accent: 'from-rose-500 via-fuchsia-500 to-pink-500',
    },
    {
      title: 'Smashes received',
      value: stats.smashes_received,
      description: 'Incoming smash swipes from other users.',
      icon: '🔥',
      accent: 'from-fuchsia-500 to-rose-500',
    },
    {
      title: 'Total matches',
      value: stats.total_matches,
      description: 'Matches created during this period.',
      icon: '💫',
      accent: 'from-pink-500 to-rose-600',
    },
    {
      title: 'Avg. messages',
      value: avgMessages,
      description: 'Average message count among matched chats.',
      icon: '✉️',
      accent: 'from-rose-500 to-fuchsia-500',
    },
    {
      title: 'Smash / pass',
      value: smashPassRatio,
      description: 'How many profiles you smashed vs passed on.',
      icon: '⚡',
      accent: 'from-fuchsia-500 to-pink-500',
    },
    {
      title: 'Smash success',
      value: smashSuccessRate,
      description: 'When you smash someone, how often it becomes a match.',
      icon: '🎯',
      accent: 'from-rose-500 to-pink-500',
    },
    {
      title: 'Incoming interest',
      value: incomingInterestRate,
      description: 'Of all people who swiped on you, how many tried to smash.',
      icon: '💌',
      accent: 'from-pink-500 to-fuchsia-500',
    },
    {
      title: 'Hard-to-get',
      value: hardToGetRate,
      description: 'How selective you are based on how often you pass.',
      icon: '🛡️',
      accent: 'from-rose-500 to-fuchsia-500',
    },
  ]

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_40px_-12px_rgba(15,23,42,0.08)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-rose-50 to-transparent" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <span className="inline-flex rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold tracking-[0.18em] text-rose-600">
              FINDER VIBES
            </span>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Your stats, now in Finder pink.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                A clean, white dashboard with pink highlights that match Finder’s brand and keep your activity easy to scan.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {heroHighlights.map((item) => (
              <div key={item.label} className="rounded-3xl border border-rose-100 bg-rose-50 p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.18em] text-rose-600">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  )
}
