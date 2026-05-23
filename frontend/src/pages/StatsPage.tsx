import { useEffect, useState } from 'react'
import { getMyStats } from '../api/stats'
import type { StatsOut } from '../types'

function StatCard({
  title,
  value,
  description,
}: {
  title: string
  value: string | number
  description: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-sm text-gray-500 mt-2">{description}</p>
    </div>
  )
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
        <p className="text-gray-500">Loading stats…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-6">
        {error}
      </div>
    )
  }

  if (!stats) return null

  const avgMessages =
    stats.avg_messages_per_match === null
      ? '0'
      : stats.avg_messages_per_match.toFixed(1)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your stats</h1>
        <p className="text-gray-500 mt-2">
          Activity summary for the rolling last 30 days.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Swipes made"
          value={stats.total_swipes_made}
          description="Profiles you have swiped on."
        />

        <StatCard
          title="Smashes received"
          value={stats.smashes_received}
          description="Incoming smash swipes from other users."
        />

        <StatCard
          title="Total matches"
          value={stats.total_matches}
          description="Matches created during this period."
        />

        <StatCard
          title="Avg. messages per match"
          value={avgMessages}
          description="Average message count among matched chats."
        />
      </div>
    </div>
  )
}