import type { LoginResType } from '@/schemaValidations/auth.schema'
import type { ProfileType } from '@/schemaValidations/profile.schema'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { jwtDecode } from 'jwt-decode'
import type { AccessTokenPayloadType, RefreshTokenPayloadType } from '@/types/token.type'
import { EntityError } from '@/constants/error'
import { type UseFormSetError } from 'react-hook-form'
import { AxiosError } from 'axios'
import { HttpStatus } from '@/constants/http'
import { toast } from 'sonner'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatUrl = (url: string) => {
  return url.startsWith('/') ? url.slice(1) : url
}

export const getAccessTokenFromLocalStorage = () => {
  return localStorage.getItem('accessToken') || ''
}

export const setAccessTokenToLocalStorage = (token: string) => {
  localStorage.setItem('accessToken', token)
}

export const getRefreshTokenFromLocalStorage = () => {
  return localStorage.getItem('refreshToken') || ''
}

export const setRefreshTokenToLocalStorage = (token: string) => {
  localStorage.setItem('refreshToken', token)
}

export const setProfileToLocalStorage = (profile: ProfileType) => {
  localStorage.setItem('profile', JSON.stringify(profile))
}

export const getProfileFromLocalStorage = (): LoginResType['user'] | null => {
  const profile = localStorage.getItem('profile')
  return profile ? JSON.parse(profile) : null
}

export const LocalStorageEventTarget = new EventTarget()

export const clearLocalStorage = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('profile')
  const clearEvent = new Event('clearLocalStorage')
  LocalStorageEventTarget.dispatchEvent(clearEvent)
}

export const decodedAccessToken = (token: string) => {
  return jwtDecode<AccessTokenPayloadType>(token)
}

export const decodedRefreshToken = (token: string) => {
  return jwtDecode<RefreshTokenPayloadType>(token)
}

export function handleError(error: any, setError?: UseFormSetError<any>, duration?: number) {
  if (error instanceof EntityError && setError) {
    error.payload.errors.forEach((item) => {
      setError(item.field, {
        message: item.message,
        type: 'server'
      })
    })
  } else if (error instanceof AxiosError) {
    if (error.status === HttpStatus.Entity && setError) {
      if (typeof error.response?.data.message === 'string') {
        setError(error.response.data.path, {
          message: error.response.data.message,
          type: 'server'
        })
        return
      }
      error.response?.data.message.forEach((item: { path: string; message: string }) => {
        setError(item.path, {
          message: item.message,
          type: 'server'
        })
      })
    } else {
      const errorName = error.response?.data.error || 'Unknown Error'
      const errorMessage = error.response?.data.message || 'An unexpected error occurred'
      toast.error(errorName, {
        description: errorMessage,
        duration: duration ?? 3000
      })
    }
  }
  // else {
  //   toast('Error', {
  //     description: error.response.data.message ?? 'Error not exist',
  //     duration: duration ?? 3000
  //   })
  // }
}
