export const ReservationStatus = {
  Pending: 'Pending',
  Confirmed: 'Confirmed',
  Arrived: 'Arrived',
  Completed: 'Completed',
  Cancelled: 'Cancelled'
} as const

export const ReservationStatusValues = Object.values(ReservationStatus)
export type ReservationStatusType = (typeof ReservationStatus)[keyof typeof ReservationStatus]
