import { clearLocalStorage, getProfileFromLocalStorage } from '@/lib/utils'
import type { ExtendedCartItemType } from '@/schemaValidations/cart.schema'
import type { ProfileType } from '@/schemaValidations/profile.schema'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 0
    }
  }
})

const AppContext = createContext<{
  isAuth: boolean
  profile: ProfileType | null
  setProfile: (profile: ProfileType | null) => void
  extendedCartItems: ExtendedCartItemType[]
  setExtendedCartItems: React.Dispatch<React.SetStateAction<ExtendedCartItemType[]>>
  reset: () => void
}>({
  isAuth: false,
  profile: null,
  setProfile: () => {},
  reset: () => {},
  extendedCartItems: [],
  setExtendedCartItems: () => null
})

export const useAppContext = () => {
  return useContext(AppContext)
}

export default function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<ProfileType | null>(null)
  const [extendedCartItems, setExtendedCartItems] = useState<ExtendedCartItemType[]>([])

  const count = useRef(0)
  useEffect(() => {
    if (count.current === 0) {
      const profile = getProfileFromLocalStorage()
      if (profile) {
        setProfileState(profile)
        count.current += 1
      }
    }
  }, [])

  const setProfile = useCallback((profile: ProfileType | null) => {
    if (profile) {
      setProfileState(profile)
    } else {
      setProfileState(null)
      clearLocalStorage()
    }
  }, [])

  const reset = () => {
    setProfileState(null)
  }

  const isAuth = Boolean(profile)
  return (
    <AppContext.Provider value={{ isAuth, profile, setProfile, extendedCartItems, setExtendedCartItems, reset }}>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </QueryClientProvider>
    </AppContext.Provider>
  )
}
