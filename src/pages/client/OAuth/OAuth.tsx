import { useAppContext } from '@/components/AppProvider'
import { setAccessTokenToLocalStorage, setProfileToLocalStorage, setRefreshTokenToLocalStorage } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router'

export default function OAuth() {
  const { setProfile } = useAppContext()

  const location = useLocation()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')
    const profile = searchParams.get('profile')
    if (accessToken && refreshToken && profile) {
      setAccessTokenToLocalStorage(accessToken)
      setRefreshTokenToLocalStorage(refreshToken)

      const profileObj = JSON.parse(decodeURIComponent(profile))
      setProfile(profileObj)
      setProfileToLocalStorage(profileObj)

      window.location.href = '/'
    } else {
      const errorMessage = searchParams.get('errorMessage')
      setError(errorMessage ?? 'Something went wrong with Google authentication')
    }
  }, [location, setProfile])

  return <div>{error && <div className='error'>{error}</div>}</div>
}
