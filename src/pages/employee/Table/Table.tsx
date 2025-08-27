import { useState, useMemo } from 'react'
import { handleError } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { TableLocationValues, TableStatusValues, type TableStatusType } from '@/constants/table'
import { useAllTablesQuery, useChangeTableStatusMutation } from '@/queries/useTable'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { useNavigate } from 'react-router'
import { useQuery } from '@/hooks/useQuery'
import type { TableType } from '@/schemaValidations/table.schema'
import { TableDetail } from './TableDetail'
import Config from '@/constants/config'
import { toast } from 'sonner'
import { formatTableLocationText, formatTableStatusColor, formatTableStatusText } from '@/lib/format'
import EmployeeAvatarDropdown from '@/components/EmployeeAvatarDropdown'

export default function Table() {
  const navigate = useNavigate()

  const query = useQuery()
  const selectedStatus = query.get('status') || ''
  const locationFilter = query.get('location') || ''

  const [viewTableId, setViewTableId] = useState<number | undefined>(undefined)

  const { data, refetch } = useAllTablesQuery()

  const tables = useMemo(() => data?.data.data || [], [data?.data.data])
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchesStatus = !selectedStatus || table.status === selectedStatus
      const matchesLocation = !locationFilter || table.location === locationFilter
      return matchesStatus && matchesLocation
    })
  }, [selectedStatus, tables, locationFilter])

  const tableCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    const statusOptions = ['All', ...TableStatusValues]

    statusOptions.forEach((status) => {
      if (status === 'All') {
        counts[status] = tables.length
      } else {
        counts[status] = tables.filter((table) => table.status === status).length
      }
    })

    return counts
  }, [tables])

  const handleTableClick = (table: TableType) => {
    setViewTableId(table.id)
  }

  const changeTableStatusMutation = useChangeTableStatusMutation()
  const handleStatusChange = async (tableId: number, newStatus: string) => {
    if (changeTableStatusMutation.isPending) return
    try {
      await changeTableStatusMutation.mutateAsync({
        tableId,
        body: { status: newStatus as TableStatusType }
      })
      toast.success('Updated table status successfully!')
      refetch()
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <div className='flex flex-col min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8'>
      <TableDetail tableId={viewTableId} setTableId={setViewTableId} />

      <div className='fixed top-0 left-0 right-0 z-40 py-4 px-12 bg-white border-b border-gray-200'>
        <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold text-gray-900'>Tables</h1>
          </div>
          <div className='flex items-center gap-4'>
            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                const params = new URLSearchParams(window.location.search)
                if (value && value !== 'All') {
                  params.set('status', value)
                } else {
                  params.delete('status')
                }
                params.delete('page')
                navigate(`/employee/tables?${params.toString()}`)
              }}
            >
              <SelectTrigger className='max-w-sm w-50 bg-white'>
                <span>{selectedStatus ? formatTableStatusText(selectedStatus) : 'Tất cả'}</span>
              </SelectTrigger>
              <SelectContent>
                {['All', ...TableStatusValues].map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === 'All' ? 'Tất cả' : formatTableStatusText(status)} ({tableCounts[status] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={locationFilter}
              onValueChange={(value) => {
                const params = new URLSearchParams(window.location.search)
                if (value && value !== 'All') {
                  params.set('location', value)
                } else {
                  params.delete('location')
                }
                params.delete('page')
                navigate(`/employee/tables?${params.toString()}`)
              }}
            >
              <SelectTrigger className='max-w-sm w-50 bg-white'>
                <span>{locationFilter ? formatTableLocationText(locationFilter) : 'Tất cả'}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem key='All' value='All'>
                  Tất cả
                </SelectItem>
                {TableLocationValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatTableLocationText(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <EmployeeAvatarDropdown />
          </div>
        </div>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 mt-12'>
        {filteredTables.length > 0 ? (
          filteredTables.map((table) => (
            <Card
              key={table.id}
              className='shadow-sm rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200 w-full mx-auto p-0'
              onClick={() => handleTableClick(table)}
            >
              <CardContent className='p-0'>
                <div>
                  <img
                    src={Config.BaseTableUrl}
                    alt={`Bàn ${table.code}`}
                    className='w-full h-30 object-contain rounded-t-lg'
                  />
                </div>
                <div className='text-center w-full'>
                  <h3 className='font-medium text-md'>Bàn {table.code}</h3>

                  <div className='flex justify-center items-center mt-2'>
                    <Select value={table.status} onValueChange={(value) => handleStatusChange(table.id, value)}>
                      <SelectTrigger
                        className='w-auto h-auto p-0 border-0 border-none bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 focus:outline-none shadow-none focus:shadow-none hover:shadow-none'
                        onClick={(e) => e.stopPropagation()}
                        hasIcon={false}
                      >
                        <span className={formatTableStatusColor({ status: table.status })}>
                          {formatTableStatusText(table.status)}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {TableStatusValues.map((status) => (
                          <SelectItem key={status} value={status}>
                            {formatTableStatusText(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className='col-span-full text-center py-10 text-gray-500'>
            Không tìm thấy bàn nào cho bộ lọc đã chọn.
          </div>
        )}
      </div>
    </div>
  )
}
