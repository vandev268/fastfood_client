import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Package, Clock } from 'lucide-react'
import { handleError } from '@/lib/utils'
import { useChangeReservationStatusMutation, useReservationDetailQuery } from '@/queries/useReservation'
import {
  formatDateTimeToLocaleString,
  formatReservationStatusColor,
  formatReservationStatusText,
  formatTableLocationText
} from '@/lib/format'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { ReservationStatusValues, type ReservationStatusType } from '@/constants/reservation'
import { toast } from 'sonner'

export default function ReservationDetail({
  reservationId,
  setReservationId
}: {
  reservationId?: number | undefined
  setReservationId: (id: number | undefined) => void
}) {
  const { data } = useReservationDetailQuery(reservationId)
  const reservation = data?.data

  const changeReservationStatusMutation = useChangeReservationStatusMutation()

  if (!reservation) return null

  const handleChangeStatus = async (value: ReservationStatusType) => {
    if (changeReservationStatusMutation.isPending) return
    try {
      await changeReservationStatusMutation.mutateAsync({
        reservationId: reservation.id,
        body: {
          status: value
        }
      })
      toast.success('Cập nhật trạng thái đặt chỗ thành công')
    } catch (error) {
      handleError(error)
    }
  }

  if (!reservation.table) return <div className='text-red-500'>Không tìm thấy thông tin bàn.</div>
  return (
    <Dialog
      open={Boolean(reservationId)}
      onOpenChange={() => {
        setReservationId(undefined)
      }}
    >
      <DialogContent className='min-w-[55vw] min-h-[10vh] max-h-[100vh] overflow-y-auto' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold'>Chi Tiết Đặt Chỗ #{reservation.id}</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <Clock className='w-5 h-5 text-muted-foreground' />
                <h3 className='font-semibold'>Thông Tin Khách Hàng</h3>
              </div>
              <div className='flex flex-col items-start gap-4 p-4 border rounded-lg'>
                {reservation.user ? (
                  <div className='flex items-center gap-3'>
                    <Avatar>
                      <AvatarImage src={reservation.user.avatar || ''} alt={reservation.user.name} />
                      <AvatarFallback>{reservation.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1'>
                      <p className='font-medium'>{reservation.user.name}</p>
                      <p className='text-sm text-muted-foreground'>{reservation.user.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className='flex items-center gap-3'>
                    <Avatar>
                      <AvatarFallback>{reservation.guestName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1'>
                      <p className='font-medium'>{reservation.guestName}</p>
                      <p className='text-sm text-muted-foreground'>Khách hàng không đăng nhập</p>
                    </div>
                  </div>
                )}
                <div className='flex flex-col gap-2 text-sm text-gray-800 w-full'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>Người đặt:</span>
                    <span className='text-sm font-medium'>{reservation.guestName}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>Số điện thoại:</span>
                    <span className='text-sm font-medium'>{reservation.guestPhone}</span>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>Số người:</span>
                    <span className='text-sm font-medium'>{reservation.numberOfGuest}</span>
                  </div>
                  <div className='bg-gray-100 px-1 py-2 rounded-sm'>
                    <span className='text-sm text-muted-foreground'>Ghi chú:</span>{' '}
                    <span className='text-sm font-medium'>{reservation.note ? reservation.note : 'Không có'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <Package className='w-5 h-5 text-muted-foreground' />
                <h3 className='font-semibold'>Trạng Thái Đặt Bàn</h3>
              </div>
              <div className='p-4 border rounded-lg space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Trạng thái:</span>
                  <div>
                    <Select
                      onValueChange={handleChangeStatus}
                      defaultValue={reservation.status}
                      value={reservation.status}
                    >
                      <SelectTrigger
                        className='p-0 border-none shadow-none hover:shadow-none focus:shadow-none cursor-pointer'
                        hasIcon={false}
                      >
                        <span
                          className={formatReservationStatusColor({
                            status: reservation.status
                          })}
                        >
                          {formatReservationStatusText(reservation.status)}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {ReservationStatusValues.map((status) => (
                          <SelectItem key={status} value={status}>
                            {formatReservationStatusText(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Ngày đặt:</span>
                  <span className='text-sm font-medium'>{formatDateTimeToLocaleString(reservation.createdAt)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Ngày đến:</span>
                  <span className='text-sm font-medium'>
                    {formatDateTimeToLocaleString(reservation.reservationTime)}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Bàn:</span>
                  <span className='text-sm font-medium'>#{reservation.table.code}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Vị trí:</span>
                  <span className='text-sm font-medium'>{formatTableLocationText(reservation.table.location)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Số người tố đa:</span>
                  <span className='text-sm font-medium'>{reservation.table.capacity}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
