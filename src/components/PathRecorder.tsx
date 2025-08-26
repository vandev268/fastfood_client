import { useEffect } from 'react'
import { useLocation } from 'react-router'

export default function PathRecorder() {
  const location = useLocation()

  useEffect(() => {
    if (!['/login', '/register', '/manage/login'].includes(location.pathname)) {
      sessionStorage.setItem('last-path', location.pathname + location.search)
    }
  }, [location])

  return null
}
