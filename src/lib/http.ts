import Config from '@/constants/config'
import axios, { isAxiosError, type AxiosInstance } from 'axios'
import {
  clearLocalStorage,
  formatUrl,
  getAccessTokenFromLocalStorage,
  getRefreshTokenFromLocalStorage,
  setAccessTokenToLocalStorage,
  setProfileToLocalStorage,
  setRefreshTokenToLocalStorage
} from './utils'
import type { LoginResType, RefreshTokenResType } from '@/schemaValidations/auth.schema'
import { HttpStatus } from '@/constants/http'
import { toast } from 'sonner'

class Http {
  instance: AxiosInstance
  private accessToken: string
  private refreshToken: string
  private refreshTokenRequest: Promise<string> | null

  constructor() {
    this.accessToken = getAccessTokenFromLocalStorage()
    this.refreshToken = getRefreshTokenFromLocalStorage()
    this.refreshTokenRequest = null

    this.instance = axios.create({
      baseURL: Config.BaseUrl,
      // timeout: Config.Timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.instance.interceptors.request.use(
      (config) => {
        if (this.accessToken && this.refreshToken && config.headers) {
          config.headers.authorization = `Bearer ${this.accessToken}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    this.instance.interceptors.response.use(
      (response) => {
        const { url } = response.config
        if (
          formatUrl(url as string) === formatUrl('/auth/login') ||
          formatUrl(url as string) === formatUrl('/auth/register')
        ) {
          const { tokens, user } = response.data as LoginResType
          this.accessToken = tokens.accessToken
          this.refreshToken = tokens.refreshToken
          setAccessTokenToLocalStorage(tokens.accessToken)
          setRefreshTokenToLocalStorage(tokens.refreshToken)
          setProfileToLocalStorage(user)
        } else if (formatUrl(url as string) === formatUrl('/auth/logout')) {
          this.accessToken = ''
          this.refreshToken = ''
          clearLocalStorage()
        }
        return response
      },
      (error) => {
        // Toast các lỗi không phải 401 và 422
        if (
          isAxiosError(error) &&
          !([HttpStatus.Entity, HttpStatus.Unauthorized] as number[]).includes(error.response?.status as number)
        ) {
          const message = error.response?.data.message || 'Đã có lỗi xảy ra, vui lòng thử lại sau!'
          toast.error(message, {
            duration: 3000,
            position: 'top-right'
          })
        }

        // Các trường hợp lỗi 401 (Unauthorized)
        if (isAxiosError(error) && error.response?.status === HttpStatus.Unauthorized) {
          const config = error.response.config
          const url = config.url

          // Người dùng gọi API bị hết hạn access token và gọi refresh token
          if (
            error.response?.data?.name === 'EXPIRED_ACCESS_TOKEN' &&
            formatUrl(url as string) !== formatUrl('/auth/refresh-token')
          ) {
            // Hạn chế gọi nhiều lần refresh token cùng lúc
            this.refreshTokenRequest = this.refreshTokenRequest
              ? this.refreshTokenRequest
              : this.handleRefreshToken().finally(() => {
                  setTimeout(() => {
                    this.refreshTokenRequest = null
                  }, 2000)
                })

            return this.refreshTokenRequest.then((accessToken) => {
              if (config.headers) {
                // Gọi lại API ban đầu với access token mới
                return this.instance({
                  ...config,
                  headers: { ...config.headers, authorization: `Bearer ${accessToken}` }
                })
              }
            })
          }

          // Token không đúng, không truyền token
          // Token hết hạn nhưng gọi refresh token không thành công
          // clearLocalStorage()
          // this.accessToken = ''
          // this.refreshToken = ''
          // toast.error(error.response.data.message || 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!', {
          //   duration: 3000
          // })
        }
        return Promise.reject(error)
      }
    )
  }

  private handleRefreshToken() {
    return this.instance
      .post<RefreshTokenResType>('/auth/refresh-token', {
        refreshToken: this.refreshToken
      })
      .then((res) => {
        const { accessToken, refreshToken } = res.data
        this.accessToken = accessToken
        this.refreshToken = refreshToken
        setAccessTokenToLocalStorage(accessToken)
        setRefreshTokenToLocalStorage(refreshToken)
        return accessToken
      })
      .catch((err) => {
        // Lỗi khi refresh token không thành công. Tức là refresh token đã hết hạn
        clearLocalStorage()
        this.accessToken = ''
        this.refreshToken = ''

        throw err
      })
  }
}

const http = new Http().instance
export default http
