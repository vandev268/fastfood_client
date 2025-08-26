import type { ProductType } from '@/schemaValidations/product.schema'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import AutoPagination from '@/components/AutoPagination'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { handleError } from '@/lib/utils'
import {
  ProductStatusValues,
  TypeProductValues,
  type ProductStatusType,
  type TypeProductType
} from '@/constants/product'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { useAllProductsQuery, useChangeProductStatusMutation, useDeleteProductMutation } from '@/queries/useProduct'
import Config from '@/constants/config'
import EditProduct from './EditProduct'
import AddProduct from './AddProduct'
import { productSocket } from '@/lib/sockets'
import type { MessageResType } from '@/schemaValidations/response.schema'
import { useAppContext } from '@/components/AppProvider'
import { formatCurrency, formatProductStatusColor, formatProductStatusText, formatTypeProductText } from '@/lib/format'

const ProductContext = createContext<{
  productIdEdit: number | undefined
  setProductIdEdit: (id: number | undefined) => void
  productDelete: ProductType | null
  setProductDelete: (product: ProductType | null) => void
}>({
  productIdEdit: undefined,
  setProductIdEdit: (id: number | undefined) => {},
  productDelete: null,
  setProductDelete: (product: ProductType | null) => {}
})

export const columns: ColumnDef<ProductType>[] = [
  {
    accessorKey: 'images',
    header: 'Ảnh minh họa',
    cell: ({ row }) => {
      const images = row.getValue('images') as string[]
      if (!images || images.length === 0) {
        return (
          <img
            src={Config.ImageBaseUrl}
            alt={row.getValue('name') as string}
            className='w-16 h-16 object-contain rounded-md ml-4'
          />
        )
      }
      return (
        <img
          src={images[0]}
          alt={row.getValue('name') as string}
          className='w-16 h-16 object-contain rounded-md ml-4'
        />
      )
    }
  },
  {
    accessorKey: 'name',
    header: 'Tên sản phẩm',
    cell: ({ row }) => {
      const name = row.getValue('name') as string
      return (
        <div className='max-w-[250px]'>
          <p
            className='overflow-hidden text-ellipsis whitespace-nowrap [&>*]:inline [&>*]:whitespace-nowrap [&>*]:overflow-hidden [&>*]:text-ellipsis'
            title={name}
          >
            {name}
          </p>
        </div>
      )
    }
  },
  {
    accessorKey: 'type',
    header: 'Loại',
    cell: ({ row }) => <div className='capitalize'>{formatTypeProductText(row.getValue('type'))}</div>
  },
  {
    accessorKey: 'basePrice',
    header: 'Giá',
    cell: ({ row }) => <div>{formatCurrency(row.getValue('basePrice') as number)}</div>
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: function ChangeStatus({ row }) {
      const changeProductStatusMutation = useChangeProductStatusMutation()

      const handleChangeStatus = async (value: ProductStatusType) => {
        if (changeProductStatusMutation.isPending) return

        try {
          const payload = {
            productId: row.original.id,
            body: {
              status: value
            }
          }
          await changeProductStatusMutation.mutateAsync(payload)
          toast.success('Cập nhật trạng thái sản phẩm thành công')
        } catch (error) {
          handleError(error)
        }
      }

      const status = row.original.status
      return (
        <div className='w-[60px]'>
          <Select onValueChange={handleChangeStatus} defaultValue={status} value={row.getValue('status')}>
            <SelectTrigger
              className='w-0 p-0 h-0 border-none shadow-none hover:shadow-none focus:shadow-none'
              hasIcon={false}
            >
              <span className={formatProductStatusColor({ status })}>{formatProductStatusText(status)}</span>
            </SelectTrigger>

            <SelectContent>
              {ProductStatusValues.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatProductStatusText(status)}
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
      const { setProductIdEdit, setProductDelete } = useContext(ProductContext)
      const openProductEdit = () => {
        setTimeout(() => {
          setProductIdEdit(row.original.id)
        }, 0)
      }
      const openProductDelete = () => {
        setTimeout(() => {
          setProductDelete(row.original)
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
            <DropdownMenuItem onClick={openProductEdit}>Sửa</DropdownMenuItem>
            <DropdownMenuItem onClick={openProductDelete}>Xóa</DropdownMenuItem>
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
      const name = (row.original.name || '').toLowerCase()
      const description = (row.original.description || '').toLowerCase()
      const query = value.toLowerCase()
      return name.includes(query) || description.includes(query)
    },
    enableColumnFilter: true
  }
]

function AlertDialogproductDelete({
  productDelete,
  setProductDelete
}: {
  productDelete: ProductType | null
  setProductDelete: (value: ProductType | null) => void
}) {
  const deleteProductMutation = useDeleteProductMutation()

  const handleDelete = async () => {
    if (deleteProductMutation.isPending) return
    try {
      if (productDelete?.id) {
        await deleteProductMutation.mutateAsync(productDelete.id)
        setProductDelete(null)
        toast.success('Xóa sản phẩm thành công')
      }
    } catch (error) {
      handleError(error)
    }
  }
  return (
    <AlertDialog
      open={Boolean(productDelete)}
      onOpenChange={(value) => {
        if (!value) {
          setProductDelete(null)
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa sản phẩm?</AlertDialogTitle>
          <AlertDialogDescription>
            Sản phẩm <span className='font-bold text-primary rounded'>{productDelete?.name}</span> sẽ bị xóa
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
export default function ProductTable() {
  const { isAuth } = useAppContext()
  const navigate = useNavigate()

  const query = useQuery()
  const page = query.get('page') ? Number(query.get('page')) : 1
  const typeFilter = query.get('type') || ''
  const statusFilter = query.get('status') || ''

  const [productIdEdit, setProductIdEdit] = useState<number | undefined>()
  const [productDelete, setProductDelete] = useState<ProductType | null>(null)

  const { data: products, refetch } = useAllProductsQuery()
  const data = products?.data.data || []

  useEffect(() => {
    if (isAuth) {
      productSocket.connect()
    } else {
      productSocket.disconnect()
      return
    }

    productSocket.on('sended-product', (data: MessageResType) => {
      setTimeout(() => {
        refetch()
      }, 10)
    })

    productSocket.on('updated-product', (data: MessageResType) => {
      setTimeout(() => {
        refetch()
      }, 10)
    })

    return () => {
      productSocket.off('sended-product')
      productSocket.off('updated-product')
      productSocket.disconnect()
    }
  }, [isAuth, refetch])

  // Filter data based on query parameters
  const filteredData = data.filter((product) => {
    const matchesType = typeFilter === 'all' || !typeFilter || product.type === typeFilter
    const matchesStatus = statusFilter === 'all' || !statusFilter || product.status === statusFilter
    return matchesType && matchesStatus
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
    <ProductContext.Provider value={{ productIdEdit, setProductIdEdit, productDelete, setProductDelete }}>
      <div className='w-full'>
        <EditProduct id={productIdEdit} setId={setProductIdEdit} />
        <AlertDialogproductDelete productDelete={productDelete} setProductDelete={setProductDelete} />
        <div className='flex items-center py-4 gap-4'>
          <Input
            placeholder='Tìm kiếm theo tên hoặc mô tả...'
            value={(table.getColumn('search')?.getFilterValue() as string) ?? ''}
            onChange={(event) => {
              table.getColumn('search')?.setFilterValue(event.target.value)
              table.setPageIndex(0)
              navigate(`/manage/products`)
            }}
            className='max-w-sm'
          />

          <Select
            value={typeFilter}
            onValueChange={(value) => {
              const params = new URLSearchParams(window.location.search)
              if (value && value !== 'all') {
                params.set('type', value)
              } else {
                params.delete('type')
              }
              params.delete('page') // Reset to first page
              navigate(`/manage/products?${params.toString()}`)
            }}
          >
            <SelectTrigger className='max-w-sm'>
              <span>{typeFilter ? formatTypeProductText(typeFilter as TypeProductType) : 'Tất cả loại'}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả loại</SelectItem>
              {TypeProductValues.map((type) => (
                <SelectItem key={type} value={type}>
                  {formatTypeProductText(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
              navigate(`/manage/products?${params.toString()}`)
            }}
          >
            <SelectTrigger className='max-w-sm'>
              <span>
                {statusFilter ? formatProductStatusText(statusFilter as ProductStatusType) : 'Tất cả trạng thái'}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả trạng thái</SelectItem>
              {ProductStatusValues.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatProductStatusText(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className='ml-auto flex items-center gap-2'>
            <AddProduct />
          </div>
        </div>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className={header.id === 'images' ? 'pl-6 w-[150px]' : ''}>
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
              pathname='/manage/products'
            />
          </div>
        </div>
      </div>
    </ProductContext.Provider>
  )
}
