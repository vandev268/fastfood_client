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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import AutoPagination from '@/components/AutoPagination'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { handleError } from '@/lib/utils'
import AddCoupon from './AddCoupon'
import type { CouponType } from '@/schemaValidations/coupon.schema'
import { useAllCouponsQuery, useChangeCouponStatusMutation, useDeleteCouponMutation } from '@/queries/useCoupon'
import EditCoupon from './EditCoupon'
import { CouponDiscountType, CouponDiscountTypeValues } from '@/constants/coupon'
import classNames from 'classnames'
import {
  formatCouponStatusColor,
  formatCouponStatusText,
  formatCurrency,
  formatDateTimeToLocaleString
} from '@/lib/format'

const CouponContext = createContext<{
  couponIdEdit: number | undefined
  setCouponIdEdit: (id: number | undefined) => void
  couponDelete: CouponType | null
  setCouponDelete: (coupon: CouponType | null) => void
}>({
  couponIdEdit: undefined,
  setCouponIdEdit: (id: number | undefined) => {},
  couponDelete: null,
  setCouponDelete: (coupon: CouponType | null) => {}
})

export const columns: ColumnDef<CouponType>[] = [
  {
    accessorKey: 'code',
    header: 'Mã',
    cell: ({ row }) => <div className='ml-4'>{row.getValue('code')}</div>
  },
  {
    accessorKey: 'discountValue',
    header: '%/Tiền',
    cell: ({ row }) => (
      <div className='capitalize'>
        {row.original.discountType === CouponDiscountType.Amount
          ? formatCurrency(row.getValue('discountValue'))
          : `${row.getValue('discountValue')}%`}
      </div>
    )
  },
  {
    accessorKey: 'minOrderAmount',
    header: 'Giá áp dụng tối thiểu',
    cell: ({ row }) => <div className='capitalize'>{formatCurrency(row.getValue('minOrderAmount'))}</div>
  },
  {
    accessorKey: 'usageLimit',
    header: 'Số lượng',
    cell: ({ row }) => <div className='capitalize'>{row.getValue('usageLimit')}</div>
  },
  {
    accessorKey: 'isActive',
    header: 'Trạng thái',
    cell: function ChangeStatus({ row }) {
      const changeCouponStatusMutation = useChangeCouponStatusMutation()

      const handleChangeStatus = async () => {
        if (changeCouponStatusMutation.isPending) return
        try {
          const status = row.getValue('isActive')
          const newStatus = !status
          await changeCouponStatusMutation.mutateAsync({
            couponId: row.original.id,
            body: {
              isActive: newStatus
            }
          })
          toast.success(`Đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} mã giảm giá ${row.getValue('code')}`)
        } catch (error) {
          handleError(error)
        }
      }

      const isActive = row.original.isActive
      return (
        <span className={formatCouponStatusColor({ isActive })} onClick={handleChangeStatus}>
          {formatCouponStatusText(isActive)}
        </span>
      )
    }
  },

  {
    accessorKey: 'expiresAt',
    header: 'Ngày hết hạn',
    cell: ({ row }) => {
      const expiresAt = row.original.expiresAt
      if (!expiresAt) {
        return <div>Không giới hạn</div>
      }
      const formattedDateTime = formatDateTimeToLocaleString(expiresAt)
      return <div className='capitalize'>{formattedDateTime}</div>
    }
  },

  {
    id: 'actions',
    enableHiding: false,
    cell: function Actions({ row }) {
      const { setCouponIdEdit, setCouponDelete } = useContext(CouponContext)
      const openCouponEdit = () => {
        setTimeout(() => {
          setCouponIdEdit(row.original.id)
        }, 0)
      }
      const openCouponDelete = () => {
        setTimeout(() => {
          setCouponDelete(row.original)
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
            <DropdownMenuItem onClick={openCouponEdit}>Sửa</DropdownMenuItem>
            <DropdownMenuItem onClick={openCouponDelete}>Xóa</DropdownMenuItem>
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
      const code = (row.original.code ?? '').toLowerCase()
      const discountValue = (row.original.discountValue ?? '').toString()
      const query = value.toLowerCase()
      return code.includes(query) || discountValue.includes(query)
    },
    enableColumnFilter: true
  }
]

function AlertDialogTagDelete({
  couponDelete,
  setCouponDelete
}: {
  couponDelete: CouponType | null
  setCouponDelete: (value: CouponType | null) => void
}) {
  const deleteCouponMutation = useDeleteCouponMutation()

  const handleDelete = async () => {
    if (deleteCouponMutation.isPending) return
    try {
      if (couponDelete?.id) {
        await deleteCouponMutation.mutateAsync(couponDelete.id)
        setCouponDelete(null)
        toast.success('Xóa mã giảm giá thành công')
      }
    } catch (error) {
      handleError(error)
    }
  }
  return (
    <AlertDialog
      open={Boolean(couponDelete)}
      onOpenChange={(value) => {
        if (!value) {
          setCouponDelete(null)
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa mã giảm giá?</AlertDialogTitle>
          <AlertDialogDescription>
            Mã giảm giá{' '}
            <span className='bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-sm dark:bg-red-900 dark:text-red-300'>
              {couponDelete?.code}
            </span>{' '}
            sẽ bị xóa vĩnh viễn
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const PAGE_SIZE = 10
export default function CouponTable() {
  const navigate = useNavigate()

  const query = useQuery()
  const page = query.get('page') ? Number(query.get('page')) : 1
  const statusFilter = query.get('status') || ''
  const discountTypeFilter = query.get('discountType') || ''

  const [couponIdEdit, setCouponIdEdit] = useState<number | undefined>()
  const [couponDelete, setCouponDelete] = useState<CouponType | null>(null)

  const couponsQuery = useAllCouponsQuery()
  const data = couponsQuery.data?.data.data || []

  // Filter data based on query parameters
  const filteredData = data.filter((coupon) => {
    const matchesStatus = !statusFilter || (statusFilter === 'active' ? coupon.isActive : !coupon.isActive)
    const matchesDiscountType = !discountTypeFilter || coupon.discountType === discountTypeFilter
    return matchesStatus && matchesDiscountType
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

  return (
    <CouponContext.Provider value={{ couponIdEdit, setCouponIdEdit, couponDelete, setCouponDelete }}>
      <div className='w-full'>
        <EditCoupon id={couponIdEdit} setId={setCouponIdEdit} />
        <AlertDialogTagDelete couponDelete={couponDelete} setCouponDelete={setCouponDelete} />
        <div className='flex items-center py-4 gap-4'>
          <Input
            placeholder='Tìm kiếm theo mã giảm giá...'
            value={(table.getColumn('search')?.getFilterValue() as string) ?? ''}
            onChange={(event) => {
              table.getColumn('search')?.setFilterValue(event.target.value)
              table.setPageIndex(0)
              navigate(`/manage/coupons`)
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
              params.delete('page') // Reset to first page
              navigate(`/manage/coupons?${params.toString()}`)
            }}
          >
            <SelectTrigger className='max-w-sm'>
              <span>
                {statusFilter === 'active'
                  ? 'Đang hoạt động'
                  : statusFilter === 'inactive'
                    ? 'Không hoạt động'
                    : 'Tất cả trạng thái'}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả trạng thái</SelectItem>
              <SelectItem value='active'>Đang hoạt động</SelectItem>
              <SelectItem value='inactive'>Không hoạt động</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={discountTypeFilter}
            onValueChange={(value) => {
              const params = new URLSearchParams(window.location.search)
              if (value && value !== 'all') {
                params.set('discountType', value)
              } else {
                params.delete('discountType')
              }
              params.delete('page') // Reset to first page
              navigate(`/manage/coupons?${params.toString()}`)
            }}
          >
            <SelectTrigger className='max-w-sm'>
              <span>
                {discountTypeFilter === CouponDiscountType.Percent
                  ? 'Phần trăm'
                  : discountTypeFilter === CouponDiscountType.Amount
                    ? 'Số tiền'
                    : 'Tất cả loại giảm giá'}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả loại giảm giá</SelectItem>
              {CouponDiscountTypeValues.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === CouponDiscountType.Percent ? 'Phần trăm' : 'Số tiền'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className='ml-auto flex items-center gap-2'>
            <AddCoupon />
          </div>
        </div>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className={header.id === 'code' ? 'pl-6' : ''}>
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
              pathname='/manage/coupons'
            />
          </div>
        </div>
      </div>
    </CouponContext.Provider>
  )
}
