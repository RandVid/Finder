import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getMyProfile,
  getMyPreferences,
  updateMyProfile,
  updateMyPreferences,
  uploadPhoto,
} from '../api/profiles'
import { ALL_HOBBIES, ALL_GENDERS, type Hobby, type ProfileGender } from '../types'

function PillToggle<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: readonly T[]
  selected: T[]
  onChange: (val: T[]) => void
}) {
  function toggle(opt: T) {
    onChange(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors capitalize ${
            selected.includes(opt)
              ? 'bg-rose-500 border-rose-500 text-white'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

const GENDER_OPTIONS: { value: ProfileGender; label: string }[] = [
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'nonbinary', label: 'Nonbinary' },
]

const MAX_BIRTH_DATE = (() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toISOString().split('T')[0]
})()

export default function ProfilePage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Photo
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile fields
  const [displayName, setDisplayName] = useState('')
  const [gender, setGender] = useState<ProfileGender>('man')
  const [birthDate, setBirthDate] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [height, setHeight] = useState('')
  const [hobbies, setHobbies] = useState<Hobby[]>([])

  // Preference fields
  const [ageMin, setAgeMin] = useState('')
  const [ageMax, setAgeMax] = useState('')
  const [preferSameCity, setPreferSameCity] = useState(false)
  const [partnerGenders, setPartnerGenders] = useState<ProfileGender[]>([])
  const [partnerHobbies, setPartnerHobbies] = useState<Hobby[]>([])

  useEffect(() => {
    Promise.all([getMyProfile(), getMyPreferences()])
      .then(([profile, prefs]) => {
        setPhotoUrl(profile.photo_url)
        setDisplayName(profile.display_name)
        setGender(profile.gender)
        setBirthDate(profile.birth_date ?? '')
        setBio(profile.bio ?? '')
        setCity(profile.city ?? '')
        setCountry(profile.country ?? '')
        setHeight(profile.height_cm != null ? String(profile.height_cm) : '')
        setHobbies(profile.hobbies)

        setAgeMin(prefs.partner_age_min != null ? String(prefs.partner_age_min) : '')
        setAgeMax(prefs.partner_age_max != null ? String(prefs.partner_age_max) : '')
        setPreferSameCity(prefs.prefer_same_city)
        setPartnerGenders(prefs.partner_genders)
        setPartnerHobbies(prefs.partner_hobbies)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    setError(null)
    setSaving(true)
    setSaved(false)
    try {
      if (photoFile) {
        const url = await uploadPhoto(photoFile)
        setPhotoUrl(url)
        setPhotoFile(null)
      }
      await updateMyProfile({
        display_name: displayName || undefined,
        bio: bio || undefined,
        birth_date: birthDate || undefined,
        city: city || undefined,
        country: country || undefined,
        gender,
        height_cm: height ? Number(height) : undefined,
        hobbies: hobbies.length ? hobbies : undefined,
      })
      await updateMyPreferences({
        partner_age_min: ageMin ? Number(ageMin) : undefined,
        partner_age_max: ageMax ? Number(ageMax) : undefined,
        prefer_same_city: preferSameCity,
        partner_genders: partnerGenders.length ? partnerGenders : undefined,
        partner_hobbies: partnerHobbies.length ? partnerHobbies : undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 pb-24">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your profile</h1>
          <p className="text-gray-500 text-sm mt-1">Changes are saved immediately</p>
        </div>

        {/* Photo */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-700">Photo</h2>
          <div className="flex flex-col items-center gap-3">
            {(photoPreview ?? photoUrl) ? (
              <img
                src={photoPreview ?? photoUrl!}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-2 border-rose-300"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                No photo
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-rose-500 hover:text-rose-600 font-medium"
            >
              {photoPreview ?? photoUrl ? 'Change photo' : 'Upload photo'}
            </button>
          </div>
        </section>

        {/* About you */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-700">About you</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <div className="flex gap-2">
              {GENDER_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGender(value)}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    gender === value
                      ? 'border-rose-500 bg-rose-50 text-rose-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
            <input
              type="date"
              max={MAX_BIRTH_DATE}
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell people a bit about yourself…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
            <input
              type="number"
              min={120}
              max={230}
              value={height}
              onChange={e => setHeight(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your hobbies</label>
            <PillToggle options={ALL_HOBBIES} selected={hobbies} onChange={setHobbies} />
          </div>
        </section>

        {/* Preferences */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-700">Who you're looking for</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Partner gender</label>
            <PillToggle options={ALL_GENDERS} selected={partnerGenders} onChange={setPartnerGenders} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={18}
                max={99}
                placeholder="Min"
                value={ageMin}
                onChange={e => setAgeMin(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <span className="text-gray-400 text-sm">–</span>
              <input
                type="number"
                min={18}
                max={99}
                placeholder="Max"
                value={ageMax}
                onChange={e => setAgeMax(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Same city only</span>
            <button
              type="button"
              onClick={() => setPreferSameCity(v => !v)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                preferSameCity ? 'bg-rose-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                  preferSameCity ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Partner hobbies</label>
            <PillToggle options={ALL_HOBBIES} selected={partnerHobbies} onChange={setPartnerHobbies} />
          </div>
        </section>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {saved && <p className="text-sm text-green-600">Saved!</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-colors"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>

        <button
          onClick={handleLogout}
          className="w-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 font-medium rounded-xl py-3 text-sm transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
