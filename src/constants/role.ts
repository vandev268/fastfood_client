export const RoleName = {
  Admin: 'Admin',
  Manager: 'Manager',
  Employee: 'Employee',
  Client: 'Client',
  Guest: 'Guest'
} as const

export const RoleNameValues = Object.values(RoleName)

export type RoleNameType = (typeof RoleName)[keyof typeof RoleName]
