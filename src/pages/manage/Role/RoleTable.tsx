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
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { getHtmlPlainTextTitle, handleError } from '@/lib/utils'
import EditRole from './EditRole'
import AddRole from './AddRole'
import type { RoleType } from '@/schemaValidations/role.schema'
import classNames from 'classnames'
import { useAllRolesQuery, useChangeRoleStatusMutation, useDeleteRoleMutation } from '@/queries/useRole'
import { formatRoleStatusText } from '@/lib/format'
import { useQuery } from '@/hooks/useQuery'
import AutoPagination from '@/components/AutoPagination'

const RoleContext = createContext<{
  roleIdEdit: number | undefined
  setRoleIdEdit: (id: number | undefined) => void
  roleDelete: RoleType | null
  setRoleDelete: (role: RoleType | null) => void
}>({
  roleIdEdit: undefined,
  setRoleIdEdit: (id: number | undefined) => {},
  roleDelete: null,
  setRoleDelete: (role: RoleType | null) => {}
})

export const columns: ColumnDef<RoleType>[] = [
  {
    accessorKey: 'name',
    header: 'Tên',
    cell: ({ row }) => <div className='ml-4'>{row.getValue('name')}</div>
  },

  {
    accessorKey: 'isActive',
    header: 'Trạng thái',
    cell: function ChangeStatus({ row }) {
      const changeRoleStatusMutation = useChangeRoleStatusMutation()

      const handleChangeStatus = async () => {
        if (changeRoleStatusMutation.isPending) return
        try {
          const status = row.getValue('isActive')
          const newStatus = !status
          const payload = {
            roleId: row.original.id,
            body: {
              isActive: newStatus
            }
          }
          await changeRoleStatusMutation.mutateAsync(payload)
          toast.success(`Đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} vai trò ${row.getValue('name')}`)
        } catch (error) {
          handleError(error)
        }
      }

      const isActive = row.original.isActive
      return (
        <span
          className={classNames('text-xs font-medium me-2 px-2.5 py-0.5 rounded-full capitalize cursor-pointer', {
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': isActive,
            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300': !isActive
          })}
          onClick={handleChangeStatus}
        >
          {formatRoleStatusText(isActive)}
        </span>
      )
    }
  },
  {
    accessorKey: 'description',
    header: 'Mô tả',
    cell: ({ row }) => {
      const description = row.getValue('description') as string
      const plainTextTitle = getHtmlPlainTextTitle(description)
      return (
        <div className='max-w-[300px]'>
          <div
            dangerouslySetInnerHTML={{ __html: description }}
            className='overflow-hidden text-ellipsis whitespace-nowrap [&>*]:inline [&>*]:whitespace-nowrap [&>*]:overflow-hidden [&>*]:text-ellipsis'
            title={plainTextTitle}
          />
        </div>
      )
    }
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: function Actions({ row }) {
      const { setRoleIdEdit, setRoleDelete } = useContext(RoleContext)
      const openRoleEdit = () => {
        setTimeout(() => {
          setRoleIdEdit(row.original.id)
        }, 0)
      }
      const openRoleDelete = () => {
        setTimeout(() => {
          setRoleDelete(row.original)
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
            <DropdownMenuItem onClick={openRoleEdit}>Sửa</DropdownMenuItem>
            <DropdownMenuItem onClick={openRoleDelete}>Xóa</DropdownMenuItem>
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
      const name = (row.original.name ?? '').toLowerCase()
      const description = (row.original.description ?? '').toString()
      const query = value.toLowerCase()
      return name.includes(query) || description.includes(query)
    },
    enableColumnFilter: true
  }
]

function AlertDialogTagDelete({
  roleDelete,
  setRoleDelete
}: {
  roleDelete: RoleType | null
  setRoleDelete: (value: RoleType | null) => void
}) {
  const deleteRoleMutation = useDeleteRoleMutation()

  const handleDelete = async () => {
    if (deleteRoleMutation.isPending) return
    try {
      if (roleDelete?.id) {
        await deleteRoleMutation.mutateAsync(roleDelete.id)
        setRoleDelete(null)
        toast.success('Xóa vai trò thành công')
      }
    } catch (error) {
      handleError(error)
    }
  }
  return (
    <AlertDialog
      open={Boolean(roleDelete)}
      onOpenChange={(value) => {
        if (!value) {
          setRoleDelete(null)
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa vai trò?</AlertDialogTitle>
          <AlertDialogDescription>
            Vai trò <span className='font-bold text-primary rounded'>{roleDelete ? roleDelete.name : ''}</span> sẽ bị
            xóa
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
export default function RoleTable() {
  const navigate = useNavigate()

  const query = useQuery()
  const page = query.get('page') ? Number(query.get('page')) : 1

  const [roleIdEdit, setRoleIdEdit] = useState<number | undefined>()
  const [roleDelete, setRoleDelete] = useState<RoleType | null>(null)

  const rolesQuery = useAllRolesQuery()
  const data = rolesQuery.data?.data.data || []

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
    data,
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
    <RoleContext.Provider value={{ roleIdEdit, setRoleIdEdit, roleDelete, setRoleDelete }}>
      <div className='w-full'>
        <EditRole id={roleIdEdit} setId={setRoleIdEdit} />
        <AlertDialogTagDelete roleDelete={roleDelete} setRoleDelete={setRoleDelete} />
        <div className='flex items-center py-4'>
          <Input
            placeholder='Tìm kiếm theo tên vai trò...'
            value={(table.getColumn('search')?.getFilterValue() as string) ?? ''}
            onChange={(event) => {
              table.getColumn('search')?.setFilterValue(event.target.value)
              table.setPageIndex(0)
              navigate(`/manage/roles`)
            }}
            className='max-w-sm'
          />
          <div className='ml-auto flex items-center gap-2'>
            <AddRole />
          </div>
        </div>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className={header.id === 'name' ? 'pl-6' : ''}>
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
            Hiển thị <strong>{table.getPaginationRowModel().rows.length}</strong> trong <strong>{data.length}</strong>{' '}
            kết quả
          </div>
          <div>
            <AutoPagination
              page={table.getState().pagination.pageIndex + 1}
              pageSize={table.getPageCount()}
              pathname='/manage/roles'
            />
          </div>
        </div>
      </div>
    </RoleContext.Provider>
  )
}
