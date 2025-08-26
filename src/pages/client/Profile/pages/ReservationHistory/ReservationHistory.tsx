import { Button } from '@/components/ui/button'
import { OrderStatus } from '@/constants/order'
import { useQuery } from '@/hooks/useQuery'
import { handleError } from '@/lib/utils'
import { Eye, MoreVertical, X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useProfileOrdersQuery } from '@/queries/useProfile'
import { Link } from 'react-router'
import {
  formatDateTimeToLocaleString,
  formatReservationStatusColor,
  formatReservationStatusText,
  formatTableLocationText
} from '@/lib/format'
import { ReservationStatus } from '@/constants/reservation'
import ReservationDetail from './ReservationDetail'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useChangeReservationStatusMutation } from '@/queries/useReservation'
import type { ReservationDetailType } from '@/schemaValidations/reservation.schema'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { useAppContext } from '@/components/AppProvider'
import { reservationSocket } from '@/lib/sockets'

export default function ReservationHistory() {
  const { isAuth } = useAppContext()

  const query = useQuery()
  const status = query.get('status') || 'All'

  const { data, refetch } = useProfileOrdersQuery()
  const reservations = useMemo(() => data?.data.reservations || [], [data?.data.reservations])

  useEffect(() => {
    if (isAuth) {
      reservationSocket.connect()
    } else {
      reservationSocket.disconnect()
      return
    }

    reservationSocket.on('received-reservation', () => {
      setTimeout(() => {
        refetch()
      }, 10)
    })

    reservationSocket.on('updated-reservation', () => {
      setTimeout(() => {
        refetch()
      }, 10)
    })

    reservationSocket.on('changed-reservation-status', () => {
      setTimeout(() => {
        refetch()
      }, 10)
    })

    return () => {
      reservationSocket.off('received-reservation')
      reservationSocket.off('updated-reservation')
      reservationSocket.off('changed-reservation-status')
      reservationSocket.disconnect()
    }
  }, [isAuth, refetch])

  const filteredReservations = useMemo(() => {
    if (status === 'All') {
      return reservations
    }
    return reservations.filter((res) => res.status === status)
  }, [reservations, status])

  const changeReservationStatusMutation = useChangeReservationStatusMutation()
  const handleCancel = async (reservation: ReservationDetailType) => {
    if (reservation.status !== ReservationStatus.Pending || changeReservationStatusMutation.isPending) return
    try {
      await changeReservationStatusMutation.mutateAsync({
        reservationId: reservation.id,
        body: {
          status: ReservationStatus.Cancelled
        }
      })
      toast.success('Đã hủy đặt bàn thành công')
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <div className='overflow-x-auto'>
      <div className='min-w-[700px]'>
        <div>
          {filteredReservations && filteredReservations.length > 0 ? (
            <>
              {filteredReservations.map((res) => (
                <div
                  key={res.id}
                  className='mt-4 rounded-sm border border-gray-200 bg-white p-6 text-gray-800 shadow-sm'
                >
                  <div className='flex items-start justify-between mb-4'>
                    <div className='flex-1'>
                      <h2 className='text-lg font-semibold mb-1'>Đơn đặt bàn #{res.id}</h2>
                      <div className='flex items-center gap-4'>
                        <span className={formatReservationStatusColor({ status: res.status })}>
                          {formatReservationStatusText(res.status)}
                        </span>
                        <span className='text-sm text-gray-500'>
                          Đặt lúc: {formatDateTimeToLocaleString(res.createdAt)}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                          <MoreVertical className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <ReservationDetail reservation={res}>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Eye className='mr-2 h-4 w-4' />
                            Xem chi tiết
                          </DropdownMenuItem>
                        </ReservationDetail>
                        {(res.status === OrderStatus.Pending || res.status === OrderStatus.Confirmed) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className='text-destructive focus:text-destructive'
                              >
                                <X className='mr-2 h-4 w-4' />
                                Hủy đơn đặt bàn
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xác nhận hủy đơn đặt bàn?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc chắn muốn hủy đơn đặt bàn RES#
                                  <span className='font-bold text-primary rounded'>{res.id}</span>? Hành động này không
                                  thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Không</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancel(res)}
                                  disabled={changeReservationStatusMutation.isPending}
                                  className=''
                                >
                                  {changeReservationStatusMutation.isPending ? 'Đang hủy...' : 'Hủy đơn hàng'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    <div className='space-y-3'>
                      <div className='p-3 border border-dashed rounded-lg'>
                        <h4 className='font-medium text-purple-900 mb-2 flex items-center'>
                          <span className='w-2 h-2 bg-purple-500 rounded-full mr-2'></span>
                          Thông tin khách hàng
                        </h4>
                        <div className='text-sm space-y-1'>
                          <p>
                            <span className='font-medium'>Tên khách:</span> {res.guestName}
                          </p>
                          <p>
                            <span className='font-medium'>Điện thoại:</span> {res.guestPhone}
                          </p>
                          <p>
                            <span className='font-medium'>Số lượng khách:</span> {res.numberOfGuest} người
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <div className='border border-dashed p-3 rounded-lg'>
                        <h4 className='font-medium text-orange-900 mb-2 flex items-center'>
                          <span className='w-2 h-2 bg-orange-500 rounded-full mr-2'></span>
                          Thông tin bàn & thời gian
                        </h4>
                        <div className='text-sm space-y-1'>
                          <p>
                            <span className='font-medium'>Bàn số:</span> {res.table.code}
                          </p>
                          <p>
                            <span className='font-medium'>Vị trí:</span> {formatTableLocationText(res.table.location)}
                          </p>
                          <p>
                            <span className='font-medium'>Thời gian đến:</span>{' '}
                            {formatDateTimeToLocaleString(res.reservationTime)}
                          </p>
                          <p>
                            <span className='font-medium'>Sức chứa:</span> {res.table.capacity} người
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className='text-center text-gray-500 py-10'>
              Lịch sử đặt chỗ của bạn trống. Bạn có thể đặt chỗ mới.
              <Button>
                <Link to='/reservation'>Đặt chỗ mới</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
