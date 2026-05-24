import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMatchProfile } from '../api/matches'
import UserStatsPlaceholder from '../components/UserStatsPlaceholder'

function calcAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function formatGender(g: string): string {
  return g.charAt(0).toUpperCase() + g.slice(1)
}

export default function MatchProfilePage() {
  const { id } = useParams()
  const matchId = Number(id)

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['match-profile', matchId],
    queryFn: () => getMatchProfile(matchId),
    enabled: Number.isFinite(matchId) && matchId > 0,
  })

  if (!Number.isFinite(matchId) || matchId <= 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        Invalid match.{' '}
        <Link to="/matches" className="text-rose-500 hover:underline">
          Back to matches
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto py-16 text-center text-gray-400">
        Loading profile…
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <p className="text-red-400 mb-4">Could not load profile.</p>
        <Link
          to={`/matches/${matchId}`}
          className="text-rose-500 hover:underline text-sm font-medium"
        >
          ← Back to chat
        </Link>
      </div>
    )
  }

  const age = profile.birth_date ? calcAge(profile.birth_date) : null
  const location = [profile.city, profile.country].filter(Boolean).join(', ')

  return (
    <div className="max-w-md mx-auto pb-8">
      <Link
        to={`/matches/${matchId}`}
        className="inline-block text-sm font-medium text-gray-500 hover:text-gray-800 mb-4"
      >
        ← Back to chat
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {profile.photo_url ? (
          <div className="w-full bg-gray-100 flex items-center justify-center">
            <img
              src={profile.photo_url}
              alt={profile.display_name}
              className="w-full max-h-[28rem] object-contain object-top"
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center text-6xl font-bold text-rose-400">
            {profile.display_name[0]?.toUpperCase() ?? '?'}
          </div>
        )}

        <div className="p-6 flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {[age !== null ? `${age} years old` : null, formatGender(profile.gender)]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-3 text-sm">
            {location && (
              <div>
                <dt className="text-gray-400 font-medium">Location</dt>
                <dd className="text-gray-800">{location}</dd>
              </div>
            )}
            {profile.height_cm != null && (
              <div>
                <dt className="text-gray-400 font-medium">Height</dt>
                <dd className="text-gray-800">{profile.height_cm} cm</dd>
              </div>
            )}
          </dl>

          {profile.bio && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-1">About</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          )}

          {profile.hobbies.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Hobbies</h2>
              <div className="flex flex-wrap gap-2">
                {profile.hobbies.map(h => (
                  <span
                    key={h}
                    className="text-xs bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-medium capitalize"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          <UserStatsPlaceholder />
        </div>
      </div>
    </div>
  )
}
