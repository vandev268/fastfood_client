export const UserStatus = {
  Active: 'Active',
  Inactive: 'Inactive',
  Blocked: 'Blocked'
} as const

export const UserStatusValues = Object.values(UserStatus)

export type UserStatusType = (typeof UserStatus)[keyof typeof UserStatus]
