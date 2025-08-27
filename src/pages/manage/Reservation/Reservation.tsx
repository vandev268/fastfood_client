import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Suspense } from 'react'
import ReservationTable from './ReservationTable'

export default function Reservation() {
  return (
    <main className='grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
      <div className='space-y-2'>
        <Card x-chunk='dashboard-06-chunk-0'>
          <CardHeader>
            <CardTitle>Lịch sử đặt bàn</CardTitle>
            <CardDescription>Quản lý lịch sử đặt bàn</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <ReservationTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
