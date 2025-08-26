import http from '@/lib/http'
import type {
  ForgotPasswordBodyType,
  GoogleAuthResType,
  LoginBodyType,
  LoginResType,
  LogoutBodyType,
  RegisterBodyType,
  RegisterResType,
  SendOTPBodyType
} from '@/schemaValidations/auth.schema'
import type { MessageResType } from '@/schemaValidations/response.schema'

const BASE_URL = '/auth'

const authApis = {
  sendOTP(body: SendOTPBodyType) {
    return http.post<MessageResType>(`${BASE_URL}/send-otp`, body)
  },

  register(body: RegisterBodyType) {
    return http.post<RegisterResType>(`${BASE_URL}/register`, body)
  },

  login(body: LoginBodyType) {
    return http.post<LoginResType>(`${BASE_URL}/login`, body)
  },

  logout(body: LogoutBodyType) {
    return http.post<MessageResType>(`${BASE_URL}/logout`, body)
  },

  forgotPassword(body: ForgotPasswordBodyType) {
    return http.post<MessageResType>(`${BASE_URL}/forgot-password`, body)
  },

  getGoogleLink() {
    return http.get<GoogleAuthResType>(`${BASE_URL}/google-link`)
  }
}

export default authApis
