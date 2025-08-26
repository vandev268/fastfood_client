import Config from '@/constants/config'
import { io } from 'socket.io-client'
import { getAccessTokenFromLocalStorage } from './utils'

export const productSocket = io(`${Config.SocketUrl}/product`, {
  autoConnect: false,
  auth: {
    Authorization: `Bearer ${getAccessTokenFromLocalStorage()}`
  }
})

export const categorySocket = io(`${Config.SocketUrl}/category`, {
  autoConnect: false,
  auth: {
    Authorization: `Bearer ${getAccessTokenFromLocalStorage()}`
  }
})

export const tagSocket = io(`${Config.SocketUrl}/tag`, {
  autoConnect: false,
  auth: {
    Authorization: `Bearer ${getAccessTokenFromLocalStorage()}`
  }
})

export const tableSocket = io(`${Config.SocketUrl}/table`, {
  autoConnect: false,
  auth: {
    Authorization: `Bearer ${getAccessTokenFromLocalStorage()}`
  }
})

export const orderSocket = io(`${Config.SocketUrl}/order`, {
  autoConnect: false,
  auth: {
    Authorization: `Bearer ${getAccessTokenFromLocalStorage()}`
  }
})

export const reviewSocket = io(`${Config.SocketUrl}/review`, {
  autoConnect: false,
  auth: {
    Authorization: `Bearer ${getAccessTokenFromLocalStorage()}`
  }
})

export const reservationSocket = io(`${Config.SocketUrl}/reservation`, {
  autoConnect: false,
  auth: {
    Authorization: `Bearer ${getAccessTokenFromLocalStorage()}`
  }
})
