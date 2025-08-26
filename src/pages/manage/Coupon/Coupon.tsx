import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Suspense } from 'react'
import CouponTable from './CouponTable'

export default function Coupon() {
  return (
    <main className='grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
      <div className='space-y-2'>
        <Card x-chunk='dashboard-06-chunk-0'>
          <CardHeader>
            <CardTitle>Mã giảm giá</CardTitle>
            <CardDescription>Quản lý mã giảm giá</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <CouponTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
