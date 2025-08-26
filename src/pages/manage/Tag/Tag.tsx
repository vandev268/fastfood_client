import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Suspense } from 'react'
import TagTable from './TagTable'

export default function Tag() {
  return (
    <main className='grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
      <div className='space-y-2'>
        <Card x-chunk='dashboard-06-chunk-0'>
          <CardHeader>
            <CardTitle>Thẻ</CardTitle>
            <CardDescription>Quản lý thẻ</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <TagTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
