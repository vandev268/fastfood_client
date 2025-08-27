import { createContext, useContext, useEffect, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState
} from '@tanstack/react-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { useQuery } from '@/hooks/useQuery'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import AutoPagination from '@/components/AutoPagination'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { handleError } from '@/lib/utils'
import classNames from 'classnames'
import { reservationSocket, tableSocket } from '@/lib/sockets'
import { useAppContext } from '@/components/AppProvider'
import type { ReservationDetailType } from '@/schemaValidations/reservation.schema'
import { useAllReservationsQuery, useChangeReservationStatusMutation } from '@/queries/useReservation'
import { ReservationStatusValues, type ReservationStatusType } from '@/constants/reservation'
import {
  formatDateTimeToLocaleString,
  formatReservationStatusColor,
  formatReservationStatusText,
  formatTableLocationText
} from '@/lib/format'
import ReservationDetail from './ReservationDetail'

const ReservationContext = createContext<{
  reservationId: number | undefined
  setReservationId: (id: number | undefined) => void
}>({
  reservationId: undefined,
  setReservationId: () => {}
})

export const columns: ColumnDef<ReservationDetailType>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <div className='uppercase ml-4'>#{row.getValue('id')}</div>
  },
  {
    header: 'Thông tin khách hàng',
    cell: ({ row }) => {
      const reservation = row.original
      return (
        <div>
          <p className='text-gray-700 dark:text-white text-sm'>
            Khách hàng: <span className='font-medium'>{reservation.guestName}</span>
          </p>
          <p className='text-gray-700 dark:text-white text-sm'>
            Điện thoại: <span className='font-medium'>{reservation.guestPhone}</span>
          </p>
          <p className='text-gray-700 dark:text-white text-sm'>
            Số lượng khách: <span className='font-medium'>{reservation.numberOfGuest}</span>
          </p>
        </div>
      )
    }
  },
  {
    header: 'Thông tin đặt bàn',
    cell: ({ row }) => {
      const reservation = row.original
      return (
        <div>
          <p className='text-gray-700 dark:text-white text-sm'>
            Bàn: #<span className='font-medium'>{reservation.table.code}</span> /{' '}
            <span className='font-medium'>{formatTableLocationText(reservation.table.location)}</span>
          </p>
          <p className='text-gray-700 dark:text-white text-sm'>
            Ngày đặt: <span className='font-medium'>{formatDateTimeToLocaleString(reservation.createdAt)}</span>
          </p>
          <p className='text-gray-700 dark:text-white text-sm'>
            Thời gian: <span className='font-medium'>{formatDateTimeToLocaleString(reservation.reservationTime)}</span>
          </p>
        </div>
      )
    }
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: function ChangeStatus({ row }) {
      const reservation = row.original
      const changeReservationStatusMutation = useChangeReservationStatusMutation()

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

      return (
        <div>
          <Select onValueChange={handleChangeStatus} defaultValue={reservation.status} value={row.getValue('status')}>
            <SelectTrigger
              className='w-0 p-0 h-0 border-none shadow-none hover:shadow-none focus:shadow-none'
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
      )
    }
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: function Actions({ row }) {
      const { setReservationId } = useContext(ReservationContext)
      const openOrderDetail = () => {
        setTimeout(() => {
          setReservationId(row.original.id)
        }, 0)
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <DotsHorizontalIcon className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={openOrderDetail}>Xem chi tiết</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  },
  {
    id: 'search',
    cell: () => null,
    enableHiding: true,
    filterFn: (row, columnId, value) => {
      const reservationId = row.original.id.toString()
      const query = value.toLowerCase()
      return reservationId.includes(query)
    },
    enableColumnFilter: true
  }
]

const PAGE_SIZE = 10
export default function ReservationTable() {
  const { isAuth } = useAppContext()
  const navigate = useNavigate()

  const query = useQuery()
  const page = query.get('page') ? Number(query.get('page')) : 1
  const statusFilter = query.get('status') || ''

  const [reservationId, setReservationId] = useState<number | undefined>()

  const { data: reservations, refetch } = useAllReservationsQuery()
  const data = reservations?.data.data || []

  const filteredData = data.filter((reservation) => {
    const matchesStatus = !statusFilter || reservation.status === statusFilter
    return matchesStatus
  })

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const pageIndex = page - 1
  const [pagination, setPagination] = useState({
    pageIndex,
    pageSize: PAGE_SIZE
  })

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination
    }
  })

  useEffect(() => {
    table.setPagination({
      pageIndex,
      pageSize: PAGE_SIZE
    })
  }, [table, pageIndex])

  useEffect(() => {
    if (isAuth) {
      reservationSocket.connect()
      tableSocket.connect()
    } else {
      reservationSocket.disconnect()
      tableSocket.disconnect()
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
      tableSocket.disconnect()
      reservationSocket.disconnect()
    }
  }, [isAuth, refetch])

  return (
    <ReservationContext.Provider value={{ reservationId, setReservationId }}>
      <div className='w-full'>
        <ReservationDetail reservationId={reservationId} setReservationId={setReservationId} />
        <div className='flex items-center py-4 gap-4'>
          <Input
            placeholder='Tìm kiếm theo mã đơn đặt bàn...'
            value={(table.getColumn('search')?.getFilterValue() as string) ?? ''}
            onChange={(event) => {
              table.getColumn('search')?.setFilterValue(event.target.value)
              table.setPageIndex(0)
            }}
            className='max-w-sm'
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              const params = new URLSearchParams(window.location.search)
              if (value && value !== 'all') {
                params.set('status', value)
              } else {
                params.delete('status')
              }
              params.delete('page')
              navigate(`/manage/reservations?${params.toString()}`)
            }}
          >
            <SelectTrigger className='max-w-sm'>
              <span>{formatReservationStatusText(statusFilter) || 'Tất cả trạng thái'}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả trạng thái</SelectItem>
              {ReservationStatusValues.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatReservationStatusText(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className={classNames('', {
                          'pl-6': header.id === 'id',
                          'pl-18': header.id === 'payment'
                        })}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className='h-24 text-center'>
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className='flex items-center justify-end space-x-2 py-4'>
          <div className='text-xs text-muted-foreground py-4 flex-1 '>
            Hiển thị <strong>{table.getPaginationRowModel().rows.length}</strong> trong{' '}
            <strong>{filteredData.length}</strong> kết quả
          </div>
          <div>
            <AutoPagination
              page={table.getState().pagination.pageIndex + 1}
              pageSize={table.getPageCount()}
              pathname='/manage/reservations'
            />
          </div>
        </div>
      </div>
    </ReservationContext.Provider>
  )
}
