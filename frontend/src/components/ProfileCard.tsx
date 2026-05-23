import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import type { ProfileOut } from '../types'

function calcAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const THRESHOLD = 100

interface Props {
  profile: ProfileOut
  onSmash: () => void
  onPass: () => void
  swiping: boolean
}

export default function ProfileCard({ profile, onSmash, onPass, swiping }: Props) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-18, 18])
  const smashOpacity = useTransform(x, [30, 120], [0, 1])
  const passOpacity = useTransform(x, [-120, -30], [1, 0])

  const age = profile.birth_date ? calcAge(profile.birth_date) : null
  const subtitle = [age !== null ? `${age} years` : null, profile.gender, profile.city, profile.country]
    .filter(Boolean)
    .join(' · ')

  async function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x > THRESHOLD) {
      await animate(x, 600, { duration: 0.25, ease: 'easeOut' })
      onSmash()
    } else if (info.offset.x < -THRESHOLD) {
      await animate(x, -600, { duration: 0.25, ease: 'easeOut' })
      onPass()
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 25 })
    }
  }

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-md p-6 w-full max-w-xs mx-auto flex flex-col gap-3 cursor-grab active:cursor-grabbing select-none relative"
      style={{ x, rotate }}
      drag={swiping ? false : 'x'}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.03 }}
    >
      {/* Direction indicators */}
      <motion.div
        className="absolute top-6 left-6 border-4 border-green-500 text-green-500 font-bold text-xl px-3 py-1 rounded-lg -rotate-12 pointer-events-none"
        style={{ opacity: smashOpacity }}
      >
        SMASH
      </motion.div>
      <motion.div
        className="absolute top-6 right-6 border-4 border-red-500 text-red-500 font-bold text-xl px-3 py-1 rounded-lg rotate-12 pointer-events-none"
        style={{ opacity: passOpacity }}
      >
        PASS
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800">{profile.display_name}</h2>
        {subtitle && <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>}
        {profile.height_cm && (
          <p className="text-gray-400 text-xs">{profile.height_cm} cm</p>
        )}
      </div>

      {profile.bio && (
        <p className="text-gray-600 text-sm leading-relaxed">{profile.bio}</p>
      )}

      {profile.hobbies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {profile.hobbies.map((h) => (
            <span
              key={h}
              className="text-xs bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-medium capitalize"
            >
              {h}
            </span>
          ))}
        </div>
      )}

    </motion.div>
  )
}
