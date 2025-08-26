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
import { handleError, removeVietnameseAccents } from '@/lib/utils'
import EditUser from './EditUser'
import AddUser from './AddUser'
import { useAllUsersQuery, useChangeUserStatusMutation, useDeleteUserMutation } from '@/queries/useUser'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { UserStatusValues, type UserStatusType } from '@/constants/user'
import { RoleNameValues } from '@/constants/role'
import ChangePassword from './ChangePassword'
import type { UserDetailType } from '@/schemaValidations/user.schema'
import { formatUserStatusColor, formatUserStatusText } from '@/lib/format'

const UserContext = createContext<{
  userIdEdit: number | undefined
  setUserIdEdit: (id: number | undefined) => void
  userChangePassword: UserDetailType | null
  setUserChangePassword: (user: UserDetailType | null) => void
  userDelete: UserDetailType | null
  setUserDelete: (user: UserDetailType | null) => void
}>({
  userIdEdit: undefined,
  setUserIdEdit: (id: number | undefined) => {},
  userChangePassword: null,
  setUserChangePassword: (user: UserDetailType | null) => {},
  userDelete: null,
  setUserDelete: (user: UserDetailType | null) => {}
})

export const columns: ColumnDef<UserDetailType>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <div className='ml-4'>{row.getValue('email')}</div>
  },
  {
    accessorKey: 'name',
    header: 'Họ và tên',
    cell: ({ row }) => <div>{row.getValue('name')}</div>
  },
  {
    accessorKey: 'phoneNumber',
    header: 'Số điện thoại',
    cell: ({ row }) => <div>{row.getValue('phoneNumber')}</div>
  },
  {
    accessorKey: 'roleId',
    header: 'Vai trò',
    cell: function Convert({ row }) {
      const roleName = row.original.role.name
      return <div>{roleName}</div>
    }
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: function ChangeStatus({ row }) {
      const changeUserStatusMutation = useChangeUserStatusMutation()

      const handleChangeStatus = async (value: UserStatusType) => {
        if (changeUserStatusMutation.isPending) return

        try {
          const payload = {
            userId: row.original.id,
            body: {
              status: value
            }
          }
          await changeUserStatusMutation.mutateAsync(payload)
          toast.success('Cập nhật trạng thái người dùng thành công')
        } catch (error) {
          handleError(error)
        }
      }

      const status = row.original.status
      return (
        <div className='w-20'>
          <Select onValueChange={handleChangeStatus} defaultValue={status}>
            <SelectTrigger
              className='w-0 p-0 h-0 border-none shadow-none hover:shadow-none focus:shadow-none'
              hasIcon={false}
            >
              <span className={formatUserStatusColor({ status })}>{formatUserStatusText(status)}</span>
            </SelectTrigger>

            <SelectContent>
              {UserStatusValues.map((val) => (
                <SelectItem key={val} value={val}>
                  {formatUserStatusText(val)}
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
      const { setUserIdEdit, setUserChangePassword, setUserDelete } = useContext(UserContext)
      const openUserEdit = () => {
        setTimeout(() => {
          setUserIdEdit(row.original.id)
        }, 0)
      }
      const openChangePassword = () => {
        setTimeout(() => {
          setUserChangePassword(row.original)
        }, 0)
      }
      const openUserDelete = () => {
        setTimeout(() => {
          setUserDelete(row.original)
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
            <DropdownMenuItem onClick={openUserEdit}>Sửa</DropdownMenuItem>
            <DropdownMenuItem onClick={openChangePassword}>Đổi mật khẩu</DropdownMenuItem>
            <DropdownMenuItem onClick={openUserDelete}>Xóa</DropdownMenuItem>
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
      const email = (row.original.email ?? '').toLowerCase()
      const name = removeVietnameseAccents((row.original.name ?? '').toLowerCase())
      const query = removeVietnameseAccents(value.toLowerCase())
      return email.includes(query) || name.includes(query)
    },
    enableColumnFilter: true
  }
]

function AlertDialogUserDelete({
  userDelete,
  setUserDelete
}: {
  userDelete: UserDetailType | null
  setUserDelete: (user: UserDetailType | null) => void
}) {
  const deleteUserMutation = useDeleteUserMutation()

  const handleDelete = async () => {
    if (deleteUserMutation.isPending) return
    try {
      if (userDelete?.id) {
        await deleteUserMutation.mutateAsync(userDelete.id)
        setUserDelete(null)
        toast.success('Xóa người dùng thành công')
      }
    } catch (error) {
      handleError(error)
    }
  }
  return (
    <AlertDialog
      open={Boolean(userDelete)}
      onOpenChange={(value) => {
        if (!value) {
          setUserDelete(null)
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa tài khoản người dùng?</AlertDialogTitle>
          <AlertDialogDescription>
            Tài khoản người dùng <span className='font-bold text-primary rounded'>{userDelete?.email}</span> sẽ bị xóa
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
export default function UserTable() {
  const navigate = useNavigate()

  const query = useQuery()
  const page = query.get('page') ? Number(query.get('page')) : 1
  const statusFilter = query.get('status') || ''
  const roleFilter = query.get('role') || ''

  const [userIdEdit, setUserIdEdit] = useState<number | undefined>()
  const [userChangePassword, setUserChangePassword] = useState<UserDetailType | null>(null)
  const [userDelete, setUserDelete] = useState<UserDetailType | null>(null)

  const usersQuery = useAllUsersQuery()
  const data = usersQuery.data?.data.data || []

  // Filter data based on query parameters
  const filteredData = data.filter((user) => {
    const matchesStatus = !statusFilter || user.status === statusFilter
    const matchesRole = !roleFilter || user.role.name === roleFilter
    return matchesStatus && matchesRole
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
    <UserContext.Provider
      value={{ userIdEdit, setUserIdEdit, userChangePassword, setUserChangePassword, userDelete, setUserDelete }}
    >
      <div className='w-full'>
        <EditUser id={userIdEdit} setId={setUserIdEdit} />
        <ChangePassword userChangePassword={userChangePassword} setUserChangePassword={setUserChangePassword} />
        <AlertDialogUserDelete userDelete={userDelete} setUserDelete={setUserDelete} />
        <div className='flex items-center py-4 gap-4'>
          <Input
            placeholder='Tìm kiếm theo tên người dùng hoặc email...'
            value={(table.getColumn('search')?.getFilterValue() as string) ?? ''}
            onChange={(event) => {
              table.getColumn('search')?.setFilterValue(event.target.value)
              table.setPageIndex(0)
              navigate(`/manage/users`)
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
              navigate(`/manage/users?${params.toString()}`)
            }}
          >
            <SelectTrigger className='max-w-sm'>
              <span>{statusFilter ? formatUserStatusText(statusFilter as UserStatusType) : 'Tất cả trạng thái'}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả trạng thái</SelectItem>
              {UserStatusValues.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatUserStatusText(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={roleFilter}
            onValueChange={(value) => {
              const params = new URLSearchParams(window.location.search)
              if (value && value !== 'all') {
                params.set('role', value)
              } else {
                params.delete('role')
              }
              params.delete('page') // Reset to first page
              navigate(`/manage/users?${params.toString()}`)
            }}
          >
            <SelectTrigger className='max-w-sm'>
              <span>{roleFilter ? roleFilter : 'Tất cả vai trò'}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả vai trò</SelectItem>
              {RoleNameValues.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className='ml-auto flex items-center gap-2'>
            <AddUser />
          </div>
        </div>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className={header.id === 'email' ? 'pl-6' : ''}>
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
              pathname='/manage/users'
            />
          </div>
        </div>
      </div>
    </UserContext.Provider>
  )
}
