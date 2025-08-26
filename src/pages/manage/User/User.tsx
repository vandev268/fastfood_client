import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Suspense } from 'react'
import UserTable from './UserTable'

export default function User() {
  return (
    <main className='grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
      <div className='space-y-2'>
        <Card x-chunk='dashboard-06-chunk-0'>
          <CardHeader>
            <CardTitle>Người dùng</CardTitle>
            <CardDescription>Quản lý người dùng</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <UserTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
