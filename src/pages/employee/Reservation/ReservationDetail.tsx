import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Users, Clock, MapPin, Phone, User } from 'lucide-react'
import type { ReservationDetailType } from '@/schemaValidations/reservation.schema'
import { ReservationStatus } from '@/constants/reservation'
import { handleError } from '@/lib/utils'
import { useChangeReservationStatusMutation } from '@/queries/useReservation'
import { toast } from 'sonner'
import { formatDateTimeToLocaleString, formatReservationStatusColor, formatReservationStatusText } from '@/lib/format'

export function ReservationDetail({
  reservation,
  setReservation
}: {
  reservation: ReservationDetailType | null
  setReservation: (reservation: ReservationDetailType | null) => void
}) {
  const changeReservationStatusMutation = useChangeReservationStatusMutation()

  const handleChangeStatus = async (newStatus: string) => {
    if (changeReservationStatusMutation.isPending || !reservation) return
    try {
      await changeReservationStatusMutation.mutateAsync({
        reservationId: reservation.id,
        body: { status: newStatus as any }
      })
      toast.success('Cập nhật trạng thái đặt bàn thành công')
      setReservation(null)
    } catch (error) {
      handleError(error)
    }
  }

  if (!reservation) return null
  return (
    <Dialog
      open={Boolean(reservation)}
      onOpenChange={() => {
        setReservation(null)
      }}
    >
      <DialogContent className='sm:max-w-[900px] max-h-screen p-6 gap-0 overflow-x-auto' aria-describedby={undefined}>
        <DialogHeader className='pb-4'>
          <DialogTitle className='text-xl font-semibold'>Chi tiết đặt bàn #{reservation.id}</DialogTitle>
        </DialogHeader>

        <div className='flex flex-wrap gap-4'>
          <div className='flex flex-[50] flex-col gap-4'>
            <div className='p-4 border rounded-lg border-gray-200'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-medium'>Thông tin đặt bàn</h3>
                <span className={formatReservationStatusColor({ status: reservation.status })}>
                  {formatReservationStatusText(reservation.status)}
                </span>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-sm flex items-center gap-2'>
                    <User className='h-4 w-4' />
                    Tên khách:
                  </span>
                  <span className='font-medium'>{reservation.guestName}</span>
                </div>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-sm flex items-center gap-2'>
                    <Phone className='h-4 w-4' />
                    Số điện thoại:
                  </span>
                  <span className='font-medium'>{reservation.guestPhone}</span>
                </div>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-sm flex items-center gap-2'>
                    <Users className='h-4 w-4' />
                    Số khách:
                  </span>
                  <span className='font-medium'>{reservation.numberOfGuest} người</span>
                </div>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-sm flex items-center gap-2'>
                    <Clock className='h-4 w-4' />
                    Thời gian đặt:
                  </span>
                  <span className='font-medium'>{formatDateTimeToLocaleString(reservation.reservationTime)}</span>
                </div>
                {reservation.table && (
                  <div className='flex items-center justify-between gap-2'>
                    <span className='font-sm flex items-center gap-2'>
                      <MapPin className='h-4 w-4' />
                      Bàn:
                    </span>
                    <span className='font-medium'>
                      {reservation.table.code} ({reservation.table.capacity} chỗ)
                      {reservation.table.location && ` - ${reservation.table.location}`}
                    </span>
                  </div>
                )}
                {reservation.note && (
                  <div className='flex flex-col gap-2'>
                    <span className='font-sm'>Ghi chú:</span>
                    <div className='p-3 bg-gray-50 rounded text-sm'>{reservation.note}</div>
                  </div>
                )}
              </div>
            </div>

            {reservation.user && (
              <div className='p-4 border rounded-lg border-gray-200'>
                <h3 className='text-lg font-medium mb-4'>Thông tin tài khoản</h3>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between gap-2'>
                    <span className='font-sm'>Tên:</span>
                    <span className='font-medium'>{reservation.user.name}</span>
                  </div>
                  <div className='flex items-center justify-between gap-2'>
                    <span className='font-sm'>Email:</span>
                    <span className='font-medium'>{reservation.user.email}</span>
                  </div>
                  {reservation.user.phoneNumber && (
                    <div className='flex items-center justify-between gap-2'>
                      <span className='font-sm'>SĐT tài khoản:</span>
                      <span className='font-medium'>{reservation.user.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className='flex flex-[50] flex-col gap-4'>
            {(reservation.status === ReservationStatus.Pending ||
              reservation.status === ReservationStatus.Confirmed ||
              reservation.status === ReservationStatus.Arrived) && (
              <div className='p-4 border rounded-lg border-gray-200'>
                <h3 className='text-lg font-medium mb-4'>Hành động</h3>
                <div className='space-y-2'>
                  {reservation.status === ReservationStatus.Pending && (
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        className='flex-1 cursor-pointer'
                        onClick={() => handleChangeStatus(ReservationStatus.Cancelled)}
                        disabled={changeReservationStatusMutation.isPending}
                      >
                        Hủy đặt bàn
                      </Button>
                      <Button
                        className='flex-1 bg-blue-700 text-white hover:bg-blue-800 cursor-pointer'
                        onClick={() => handleChangeStatus(ReservationStatus.Confirmed)}
                        disabled={changeReservationStatusMutation.isPending}
                      >
                        Xác nhận đặt bàn
                      </Button>
                    </div>
                  )}
                  {reservation.status === ReservationStatus.Confirmed && (
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        className='flex-1 cursor-pointer'
                        onClick={() => handleChangeStatus(ReservationStatus.Cancelled)}
                        disabled={changeReservationStatusMutation.isPending}
                      >
                        Hủy đặt bàn
                      </Button>
                      <Button
                        className='flex-1 bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                        onClick={() => handleChangeStatus(ReservationStatus.Arrived)}
                        disabled={changeReservationStatusMutation.isPending}
                      >
                        Khách đã đến
                      </Button>
                    </div>
                  )}
                  {reservation.status === ReservationStatus.Arrived && (
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        className='flex-1 cursor-pointer'
                        onClick={() => handleChangeStatus(ReservationStatus.Cancelled)}
                        disabled={changeReservationStatusMutation.isPending}
                      >
                        Hủy đặt bàn
                      </Button>
                      <Button
                        className='flex-1 hover:bg-primary/80 cursor-pointer'
                        onClick={() => handleChangeStatus(ReservationStatus.Completed)}
                        disabled={changeReservationStatusMutation.isPending}
                      >
                        Hoàn thành
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className='p-4 border rounded-lg border-gray-200'>
              <h3 className='text-lg font-medium mb-4'>Thông tin thời gian</h3>
              <div className='space-y-2'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-sm'>Tạo lúc:</span>
                  <span className='font-medium'>{formatDateTimeToLocaleString(reservation.createdAt)}</span>
                </div>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-sm'>Cập nhật lúc:</span>
                  <span className='font-medium'>{formatDateTimeToLocaleString(reservation.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
