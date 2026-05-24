import type { StatsOut } from '../types'

function formatPercent(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(0)}%`
}

function formatAvgMessages(value: number | null): string {
  return value === null ? '—' : value.toFixed(1)
}

interface Props {
  stats: StatsOut
}

export default function UserStatsCompact({ stats }: Props) {
  const items = [
    { label: 'Matches', value: String(stats.total_matches) },
    { label: 'Smashes received', value: String(stats.smashes_received) },
    { label: 'Avg msgs / match', value: formatAvgMessages(stats.avg_messages_per_match) },
    { label: 'Smash success', value: formatPercent(stats.smash_success_rate) },
    { label: 'Swipes made', value: String(stats.total_swipes_made) },
    { label: 'Incoming interest', value: formatPercent(stats.incoming_interest_rate) },
  ]

  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Activity</h3>
        <span className="text-xs text-gray-400">Last 30 days</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map(item => (
          <div
            key={item.label}
            className="rounded-lg bg-white border border-gray-100 px-3 py-2"
          >
            <p className="text-[11px] text-gray-500 leading-tight">{item.label}</p>
            <p className="text-base font-semibold text-gray-900 mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
