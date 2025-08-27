import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, MapPin, Calendar, Clock } from 'lucide-react'
import { useTableDetailQuery } from '@/queries/useTable'
import {
  formatDateToLocaleString,
  formatTableStatusColor,
  formatTableStatusText,
  formatTimeToLocaleString
} from '@/lib/format'

export function TableDetail({
  tableId,
  setTableId
}: {
  tableId: number | undefined
  setTableId: (table: number | undefined) => void
}) {
  const tableDetailQuery = useTableDetailQuery(tableId)
  const table = tableDetailQuery.data?.data

  if (!table) return null
  return (
    <Dialog open={Boolean(table)} onOpenChange={() => setTableId(undefined)}>
      <DialogContent className='sm:max-w-[900px] max-h-screen p-6 gap-0 overflow-auto' aria-describedby={undefined}>
        <DialogHeader className='pb-4'>
          <DialogTitle className='text-xl font-semibold'>Table Details #{table.id}</DialogTitle>
        </DialogHeader>

        <div className='flex flex-wrap gap-4'>
          <div className='flex flex-[50] flex-col gap-4'>
            <div className='p-4 border-2 rounded-lg border-gray-200'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-medium'>Table Information</h3>
                <span className={formatTableStatusColor({ status: table.status })}>
                  {formatTableStatusText(table.status)}
                </span>
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-sm flex items-center gap-2'>
                    <Users className='h-5 w-5 text-gray-500' />
                    Capacity:
                  </span>
                  <span className='font-medium'>{table.capacity} </span>
                </div>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-sm flex items-center gap-2'>
                    <MapPin className='h-5 w-5 text-gray-500' />
                    Location:
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: table.location ?? '...' }} className='font-medium'></span>
                </div>
              </div>
            </div>
          </div>
          <div className='flex flex-[50] flex-col gap-4'>
            <div className='p-4 border-2 rounded-lg border-gray-200'>
              <h3 className='text-lg font-medium mb-2'>Table Reservations</h3>
              {table.reservations && table.reservations.length > 0 ? (
                <div className='space-y-3'>
                  {table.reservations
                    .filter((reservation) => reservation.status !== 'Completed' && reservation.status !== 'Cancelled')
                    .map((reservation) => (
                      <div key={reservation.id} className='p-3 border rounded-lg'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='font-medium'>#{reservation.id}</span>
                          <Badge variant='outline'>{reservation.status}</Badge>
                        </div>
                        <div className='space-y-1 text-sm text-gray-600'>
                          <div className='flex items-center gap-2'>
                            <Users className='h-4 w-4' />
                            <span>{reservation.numberOfGuest} khách</span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Calendar className='h-4 w-4' />
                            <span>{formatDateToLocaleString(reservation.reservationTime)}</span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Clock className='h-4 w-4' />
                            <span>{formatTimeToLocaleString(reservation.reservationTime)}</span>
                          </div>
                        </div>
                        {reservation.note && (
                          <div className='mt-2 p-2 bg-gray-50 rounded text-sm'>
                            <span className='font-medium'>Ghi chú:</span> {reservation.note}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className='text-gray-500 text-center py-4'>Không có đặt bàn nào</p>
              )}
            </div>
          </div>
        </div>

        <div className='flex justify-end gap-3 pt-4'>
          <Button variant='outline' onClick={() => setTableId(undefined)}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
