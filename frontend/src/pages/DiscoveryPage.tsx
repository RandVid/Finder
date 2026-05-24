import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getDiscoveryBatch } from '../api/discovery'
import { postSwipe } from '../api/swipes'
import ProfileCard from '../components/ProfileCard'
import type { SwipeDirection } from '../types'

interface MatchModal {
  matchId: number
  displayName: string
}

export default function DiscoveryPage() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [matchModal, setMatchModal] = useState<MatchModal | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['discovery'],
    queryFn: getDiscoveryBatch,
  })

  const { mutate: swipe, isPending: swiping } = useMutation({
    mutationFn: ({ targetId, direction }: { targetId: number; direction: SwipeDirection }) =>
      postSwipe(targetId, direction),
    onSuccess: (result, { direction }) => {
      if (direction === 'smash' && result.match_created && result.match_id !== null) {
        setMatchModal({
          matchId: result.match_id,
          displayName: data!.profiles[index].display_name,
        })
      }
      setIndex((i) => i + 1)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading profiles…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-400">Failed to load profiles. Please try again.</p>
      </div>
    )
  }

  const profiles = data?.profiles ?? []
  const profile = profiles[index]

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {profile ? (
        <ProfileCard
          key={profile.user_id}
          profile={profile}
          swiping={swiping}
          onSmash={() => swipe({ targetId: profile.user_id, direction: 'smash' })}
          onPass={() => swipe({ targetId: profile.user_id, direction: 'pass' })}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 text-center mt-16">
          <span className="text-5xl">🎉</span>
          <h3 className="text-xl font-semibold text-gray-700">You've seen everyone</h3>
          <p className="text-gray-400 text-sm">Check back later for new profiles.</p>
        </div>
      )}

      {matchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4 flex flex-col items-center gap-5">
            <span className="text-5xl">🎊</span>
            <h2 className="text-2xl font-bold text-rose-500">It's a match!</h2>
            <p className="text-gray-600 text-center">
              You and <span className="font-semibold">{matchModal.displayName}</span> liked each other.
            </p>
            <button
              onClick={() => navigate(`/matches/${matchModal.matchId}`)}
              className="w-full py-3 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors"
            >
              Send a message
            </button>
            <button
              onClick={() => setMatchModal(null)}
              className="w-full py-3 rounded-xl border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-colors"
            >
              Keep swiping
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
