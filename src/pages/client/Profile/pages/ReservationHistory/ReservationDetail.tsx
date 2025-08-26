import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Package, Clock, EyeOff } from 'lucide-react'
import { handleError } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ReservationDetailType } from '@/schemaValidations/reservation.schema'
import {
  formatDateTimeToLocaleString,
  formatReservationStatusColor,
  formatReservationStatusText,
  formatTableLocationText
} from '@/lib/format'
import { useChangeReservationStatusMutation } from '@/queries/useReservation'
import { ReservationStatus } from '@/constants/reservation'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export default function ReservationDetail({
  reservation,
  children
}: {
  reservation: ReservationDetailType
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  const changeReservationStatusMutation = useChangeReservationStatusMutation()
  const handleCancel = async () => {
    if (changeReservationStatusMutation.isPending || reservation.status !== ReservationStatus.Pending) return
    try {
      await changeReservationStatusMutation.mutateAsync({
        reservationId: reservation.id,
        body: { status: ReservationStatus.Cancelled }
      })
      setOpen(false)
      toast.success('Hủy đặt bàn thành công!')
    } catch (error) {
      handleError(error)
    }
  }

  if (!reservation.user || !reservation.table) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <EyeOff className='w-4 h-4 mx-3' />
        </TooltipTrigger>
        <TooltipContent>
          <p className='text-sm text-'>Đặt bàn không có thông tin người dùng </p>
          <p className='text-sm'>hoặc thông tin bàn được đặt</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='min-w-[55vw] min-h-[10vh] max-h-[100vh] overflow-y-auto' aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold'>Chi Tiết Đặt Bàn #{reservation.id}</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <Clock className='w-5 h-5 text-muted-foreground' />
                <h3 className='font-semibold'>Thông Tin Khách Hàng</h3>
              </div>
              <div className='flex flex-col items-start gap-4 p-4 border rounded-lg'>
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
                  <span className={formatReservationStatusColor({ status: reservation.status })}>
                    {formatReservationStatusText(reservation.status)}
                  </span>
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
          <div className='flex items-center justify-end gap-2'>
            <Button variant='outline' className='cursor-pointer' onClick={() => setOpen(false)}>
              Hủy
            </Button>
            {reservation.status === ReservationStatus.Pending && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>Hủy đặt bàn</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuLabel>Bạn có muốn hủy đặt bàn #{reservation.table.code} không?</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className='flex justify-end'>
                    <DropdownMenuItem>
                      <Button variant='outline'>No</Button>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Button onClick={handleCancel}>Yes</Button>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
