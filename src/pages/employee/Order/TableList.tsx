import { useState } from 'react'
import { Package, Truck, Users, MapPin, Calendar, User, Phone, Clock, Search, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'
import type { TableDetailType } from '@/schemaValidations/table.schema'
import { ReservationStatus, type ReservationStatusType } from '@/constants/reservation'
import { TableStatus, TableStatusValues, type TableStatusType } from '@/constants/table'
import { OrderType, type OrderTypeType } from '@/constants/order'
import { formatTableLocationText, formatTableStatusColor, formatTableStatusText } from '@/lib/format'
import type { OrderTabType } from './types'
import classNames from 'classnames'
import { useChangeTableStatusMutation } from '@/queries/useTable'
import { useAllDraftItemsQuery, useDeleteDraftItemsMutation } from '@/queries/useDraftItem'
import { handleError } from '@/lib/utils'
import { useChangeReservationStatusMutation } from '@/queries/useReservation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface TableListProps {
  tables: TableDetailType[]
  orderTabs: OrderTabType[]
  leftPanelWidth: number
  onTableSelect: (tableId: number | string, orderType?: OrderTypeType, reservationId?: number) => void
  onCreateTakeawayOrder?: (draftCode: string) => void
  onLoadDraftItems?: (draftCode: string) => void
  onCreateDeliveryOrder?: (draftCode: string) => void
  onLoadDeliveryDraftItems?: (draftCode: string) => void
  onDeleteDraftItems?: (draftCode: string) => void
}

export default function TableList({
  tables,
  orderTabs,
  leftPanelWidth,
  onTableSelect,
  onCreateTakeawayOrder,
  onLoadDraftItems,
  onCreateDeliveryOrder,
  onLoadDeliveryDraftItems,
  onDeleteDraftItems
}: TableListProps) {
  const [showReservationDialog, setShowReservationDialog] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<number | undefined>(undefined)
  const [showTakeawayDialog, setShowTakeawayDialog] = useState(false)
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false)

  const queryClient = useQueryClient()
  const changeTableStatusMutation = useChangeTableStatusMutation()
  const allTakeawayDraftsQuery = useAllDraftItemsQuery({})
  const allDeliveryDraftsQuery = useAllDraftItemsQuery({})

  const handleChangeStatus = async (tableId: number, status: TableStatusType) => {
    if (changeTableStatusMutation.isPending) return
    try {
      await changeTableStatusMutation.mutateAsync({ tableId, body: { status } })
    } catch (error) {
      handleError(error)
    }
  }

  const handleTableClick = (tableId: number, orderType?: OrderTypeType) => {
    const table = tables.find((t) => t.id === tableId)
    const activeReservations =
      table?.reservations.filter(
        (r) => r.status === ReservationStatus.Pending || r.status === ReservationStatus.Confirmed
      ) || []

    if (activeReservations.length > 0) {
      setSelectedReservation(tableId)
      setShowReservationDialog(true)
    } else {
      onTableSelect(tableId, orderType)
    }
  }

  const handleTakeawayClick = () => {
    setShowTakeawayDialog(true)
  }

  const handleDeliveryClick = () => {
    setShowDeliveryDialog(true)
  }

  const generateRandomDraftCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `draft-takeaway-${result}`
  }

  const generateRandomDeliveryDraftCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `draft-delivery-${result}`
  }

  const handleCreateTakeawayOrder = () => {
    if (onCreateTakeawayOrder) {
      const newDraftCode = generateRandomDraftCode()
      onCreateTakeawayOrder(newDraftCode)
      setShowTakeawayDialog(false)
    }
  }

  const handleLoadDraftItems = (draftCode: string) => {
    if (onLoadDraftItems) {
      onLoadDraftItems(draftCode)
      setShowTakeawayDialog(false)
    }
  }

  const handleCreateDeliveryOrder = () => {
    if (onCreateDeliveryOrder) {
      const newDraftCode = generateRandomDeliveryDraftCode()
      onCreateDeliveryOrder(newDraftCode)
      setShowDeliveryDialog(false)
    }
  }

  const handleLoadDeliveryDraftItems = (draftCode: string) => {
    if (onLoadDeliveryDraftItems) {
      onLoadDeliveryDraftItems(draftCode)
      setShowDeliveryDialog(false)
    }
  }

  const changeReservationStatusMutation = useChangeReservationStatusMutation()
  const handleChangeReservationStatus = async ({
    tableId,
    reservationId,
    status
  }: {
    tableId: number
    reservationId: number
    status: ReservationStatusType
  }) => {
    if (changeReservationStatusMutation.isPending) return
    try {
      if (status === ReservationStatus.Confirmed) {
        await changeReservationStatusMutation.mutateAsync({
          reservationId: reservationId,
          body: { status }
        })
        await queryClient.invalidateQueries({ queryKey: ['reservations'] })
        await queryClient.invalidateQueries({ queryKey: ['tables'] })
      } else {
        if (changeTableStatusMutation.isPending) return
        if (status === ReservationStatus.Arrived) {
          await Promise.all([
            changeReservationStatusMutation.mutateAsync({
              reservationId: reservationId,
              body: { status }
            }),
            changeTableStatusMutation.mutateAsync({
              tableId,
              body: { status: TableStatus.Occupied }
            })
          ])
          await queryClient.invalidateQueries({ queryKey: ['reservations'] })
          await queryClient.invalidateQueries({ queryKey: ['tables'] })
          setTimeout(() => {
            onTableSelect(tableId, OrderType.DineIn, reservationId)
          }, 100)
        } else if (status === ReservationStatus.Cancelled) {
          await Promise.all([
            changeReservationStatusMutation.mutateAsync({
              reservationId: reservationId,
              body: { status }
            }),
            changeTableStatusMutation.mutateAsync({
              tableId,
              body: { status: TableStatus.Available }
            })
          ])
          await queryClient.invalidateQueries({ queryKey: ['reservations'] })
          await queryClient.invalidateQueries({ queryKey: ['tables'] })
        }
      }
      setShowReservationDialog(false)
      setSelectedReservation(undefined)
    } catch (error) {
      handleError(error)
    }
  }

  const handleCreateOrderTab = () => {
    if (selectedReservation) {
      onTableSelect(selectedReservation, OrderType.DineIn)
      setShowReservationDialog(false)
      setSelectedReservation(undefined)
    }
  }

  const deleteDraftItemsMutation = useDeleteDraftItemsMutation()
  const handleDeleteDraftItems = async (draftCode: string) => {
    if (deleteDraftItemsMutation.isPending) return
    try {
      await deleteDraftItemsMutation.mutateAsync({ draftCode })
      await queryClient.invalidateQueries({ queryKey: ['draft-items'] })

      if (onDeleteDraftItems) {
        onDeleteDraftItems(draftCode)
      }
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <div className='flex flex-col h-[calc(100vh-120px)]'>
      <ScrollArea className='flex-1'>
        <div
          className={`p-2 mb-1 grid gap-4 ${
            leftPanelWidth > 50 ? 'grid-cols-4' : leftPanelWidth > 35 ? 'grid-cols-3' : 'grid-cols-2'
          }`}
        >
          <Card
            className='cursor-pointer transition-all hover:shadow-md bg-blue-50 border-blue-200'
            onClick={handleTakeawayClick}
          >
            <CardContent>
              <div className='text-center'>
                <div className={`${leftPanelWidth > 40 ? 'text-lg' : 'text-base'} font-semibold mb-2 text-blue-700`}>
                  Mang đi
                </div>
                <div
                  className={`${leftPanelWidth > 40 ? 'text-sm' : 'text-xs'} flex items-center justify-center mb-2 text-blue-600`}
                >
                  <Package className='w-4 h-4 mr-1' />
                  Tạo đơn mới
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className='cursor-pointer transition-all hover:shadow-md bg-green-50 border-green-200'
            onClick={handleDeliveryClick}
          >
            <CardContent>
              <div className='text-center'>
                <div className={`${leftPanelWidth > 40 ? 'text-lg' : 'text-base'} font-semibold mb-2 text-green-700`}>
                  Giao hàng
                </div>
                <div
                  className={`${leftPanelWidth > 40 ? 'text-sm' : 'text-xs'} flex items-center justify-center mb-2 text-green-600`}
                >
                  <Truck className='w-4 h-4 mr-1' />
                  Tạo đơn mới
                </div>
              </div>
            </CardContent>
          </Card>

          {tables.map((table) => {
            const hasActiveOrder = orderTabs.some(
              (tab) => tab.tableId === table.id && tab.orderType === OrderType.DineIn
            )

            return (
              <Card
                key={table.id}
                className={classNames('cursor-pointer transition-all hover:shadow-md py-2', {
                  'border border-orange-200 bg-orange-50': hasActiveOrder,
                  'bg-yellow-50': table.status === TableStatus.Reserved
                })}
                onClick={() => table.status !== TableStatus.Available && handleTableClick(table.id, OrderType.DineIn)}
              >
                <CardContent>
                  <div className='text-center'>
                    <div
                      className={classNames({
                        [`${leftPanelWidth > 40 ? 'text-lg' : 'text-base'} font-semibold mb-2`]: true,
                        'opacity-40': table.status === TableStatus.Available
                      })}
                    >
                      {table.code}
                    </div>
                    <div
                      className={classNames({
                        [`${
                          leftPanelWidth > 40 ? 'text-sm' : 'text-xs'
                        } text-gray-600 flex items-center justify-center`]: true,
                        'opacity-40': table.status === TableStatus.Available
                      })}
                    >
                      <Users className='w-4 h-4 mr-1' />
                      {table.capacity} chỗ
                    </div>

                    <div
                      className={classNames('', {
                        'opacity-40': table.status === TableStatus.Available
                      })}
                    >
                      <Badge variant='outline' className='text-xs text-gray-600'>
                        <MapPin className='w-3 h-3 mr-1' />
                        {formatTableLocationText(table.location)}
                      </Badge>
                    </div>

                    <div className='space-y-1 flex items-center justify-center'>
                      <Select
                        onValueChange={(value) => handleChangeStatus(table.id, value as TableStatusType)}
                        defaultValue={table.status}
                        value={table.status}
                      >
                        <SelectTrigger
                          className='p-0 border-none shadow-none hover:shadow-none focus:shadow-none cursor-pointer'
                          hasIcon={false}
                        >
                          <span className={formatTableStatusColor({ status: table.status })}>
                            {formatTableStatusText(table.status)}
                          </span>
                        </SelectTrigger>

                        <SelectContent>
                          {TableStatusValues.map((value) => (
                            <SelectItem key={value} value={value}>
                              {formatTableStatusText(value)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>

      <Dialog open={showTakeawayDialog} onOpenChange={setShowTakeawayDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold flex items-center'>
              <Package className='w-5 h-5 mr-2 text-blue-600' />
              Đơn Mang Đi
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-6'>
            <div className='p-4 rounded-lg border border-blue-200'>
              <div className='flex items-center mb-3'>
                <Search className='w-5 h-5 mr-2 text-blue-600' />
                <span className='font-semibold text-blue-800'>Chọn đơn hàng có sẵn</span>
              </div>

              <div className='space-y-3'>
                {allTakeawayDraftsQuery.isLoading ? (
                  <div className='p-4 text-center text-gray-500'>
                    <div className='animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2'></div>
                    Đang tải danh sách đơn hàng...
                  </div>
                ) : allTakeawayDraftsQuery.data?.data?.data && allTakeawayDraftsQuery.data.data.data.length > 0 ? (
                  <ScrollArea className=''>
                    <div className='max-h-60 space-y-2 px-2'>
                      {Array.from(new Set(allTakeawayDraftsQuery.data.data.data.map((item: any) => item.draftCode)))
                        .filter((draftCode: string) => draftCode.startsWith('draft-takeaway-'))
                        .map((draftCode: string) => (
                          <div className='flex items-center p-3 border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors gap-4'>
                            <div key={draftCode} className='flex-1' onClick={() => handleLoadDraftItems(draftCode)}>
                              <div className='flex items-center justify-between'>
                                <span className='font-medium text-blue-800'>{draftCode}</span>
                                <div className='flex items-center text-sm text-blue-600'>
                                  <Package className='w-4 h-4 mr-1' />
                                  {
                                    allTakeawayDraftsQuery.data.data.data.filter(
                                      (item: any) => item.draftCode === draftCode
                                    ).length
                                  }{' '}
                                  món
                                </div>
                              </div>
                            </div>
                            <span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Trash2 className='w-4 h-4 text-red-600 cursor-pointer mr-2' />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  <DropdownMenuLabel>Bạn chắc chắn xóa?</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <div className='flex justify-end'>
                                    <DropdownMenuItem>
                                      <Button variant='outline'>No</Button>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Button onClick={() => handleDeleteDraftItems(draftCode)}>Yes</Button>
                                    </DropdownMenuItem>
                                  </div>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </span>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className='p-4 text-center text-gray-500 border border-dashed border-gray-200 rounded-lg'>
                    <Package className='w-8 h-8 mx-auto mb-2 text-gray-400' />
                    <p className='text-sm'>Chưa có đơn hàng mang đi nào</p>
                    <p className='text-xs text-gray-400 mt-1'>Tạo đơn mới để bắt đầu</p>
                  </div>
                )}
              </div>
            </div>

            <div className='p-4 rounded-lg border border-dashed border-gray-200'>
              <div className='flex items-center mb-3'>
                <Plus className='w-5 h-5 mr-2 text-gray-600' />
                <span className='font-semibold text-gray-800'>Tạo đơn hàng mới</span>
              </div>

              <div className='space-y-3'>
                <div className='text-center'>
                  <Button onClick={handleCreateTakeawayOrder} className='w-full bg-blue-600 hover:bg-blue-700'>
                    <Plus className='w-4 h-4 mr-2' />
                    Tạo đơn mới
                  </Button>
                  <p className='text-xs text-gray-500 mt-2'>Mã đơn sẽ được tự động tạo: draft-takeaway-XXXXXX</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold flex items-center'>
              <Truck className='w-5 h-5 mr-2 text-green-600' />
              Đơn Giao Hàng
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-6'>
            <div className='p-4 rounded-lg border border-green-200'>
              <div className='flex items-center mb-3'>
                <Search className='w-5 h-5 mr-2 text-green-600' />
                <span className='font-semibold text-green-800'>Chọn đơn hàng có sẵn</span>
              </div>

              <div className='space-y-3'>
                {allDeliveryDraftsQuery.isLoading ? (
                  <div className='p-4 text-center text-gray-500'>
                    <div className='animate-spin w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-2'></div>
                    Đang tải danh sách đơn hàng...
                  </div>
                ) : allDeliveryDraftsQuery.data?.data?.data && allDeliveryDraftsQuery.data.data.data.length > 0 ? (
                  <ScrollArea className=''>
                    <div className='max-h-60 space-y-2 px-2'>
                      {Array.from(new Set(allDeliveryDraftsQuery.data.data.data.map((item: any) => item.draftCode)))
                        .filter((draftCode: string) => draftCode.startsWith('draft-delivery-'))
                        .map((draftCode: string) => (
                          <div className='flex items-center p-3 border border-green-200 rounded-lg hover:bg-green-50 cursor-pointer transition-colors gap-4'>
                            <div
                              key={draftCode}
                              className='flex-1'
                              onClick={() => handleLoadDeliveryDraftItems(draftCode)}
                            >
                              <div className='flex items-center justify-between'>
                                <span className='font-medium text-green-800'>{draftCode}</span>
                                <div className='flex items-center text-sm text-green-600'>
                                  <Truck className='w-4 h-4 mr-1' />
                                  {
                                    allDeliveryDraftsQuery.data.data.data.filter(
                                      (item: any) => item.draftCode === draftCode
                                    ).length
                                  }{' '}
                                  món
                                </div>
                              </div>
                            </div>
                            <span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Trash2 className='w-4 h-4 text-red-600 cursor-pointer mr-2' />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  <DropdownMenuLabel>Bạn chắc chắn xóa?</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <div className='flex justify-end'>
                                    <DropdownMenuItem>
                                      <Button variant='outline'>No</Button>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Button onClick={() => handleDeleteDraftItems(draftCode)}>Yes</Button>
                                    </DropdownMenuItem>
                                  </div>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </span>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className='p-4 text-center text-gray-500 border border-dashed border-gray-200 rounded-lg'>
                    <Truck className='w-8 h-8 mx-auto mb-2 text-gray-400' />
                    <p className='text-sm'>Chưa có đơn hàng giao hàng nào</p>
                    <p className='text-xs text-gray-400 mt-1'>Tạo đơn mới để bắt đầu</p>
                  </div>
                )}
              </div>
            </div>

            <div className='p-4 rounded-lg border border-dashed border-gray-200'>
              <div className='flex items-center mb-3'>
                <Plus className='w-5 h-5 mr-2 text-gray-600' />
                <span className='font-semibold text-gray-800'>Tạo đơn hàng mới</span>
              </div>

              <div className='space-y-3'>
                <div className='text-center'>
                  <Button onClick={handleCreateDeliveryOrder} className='w-full bg-green-600 hover:bg-green-700'>
                    <Plus className='w-4 h-4 mr-2' />
                    Tạo đơn mới
                  </Button>
                  <p className='text-xs text-gray-500 mt-2'>Mã đơn sẽ được tự động tạo: draft-delivery-XXXXXX</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReservationDialog} onOpenChange={setShowReservationDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>Danh sách Đặt Bàn</DialogTitle>
          </DialogHeader>

          {selectedReservation && (
            <div className='space-y-4'>
              {(() => {
                const table = tables.find((t) => t.id === selectedReservation)
                if (!table) return <div className='text-red-500'>Không tìm thấy bàn.</div>
                const activeReservations =
                  table.reservations.filter(
                    (r) => r.status === ReservationStatus.Pending || r.status === ReservationStatus.Confirmed
                  ) || []

                const hasArrivedReservation = table.reservations.some((r) => r.status === ReservationStatus.Arrived)

                return (
                  <>
                    <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h3 className='font-semibold text-blue-800 mb-1'>
                            {table.code} - {hasArrivedReservation ? 'Tiếp tục' : 'Tạo mới'} đơn hàng
                          </h3>
                          <p className='text-sm text-blue-600'>
                            {hasArrivedReservation ? 'Tiếp tục' : 'Tạo mới'} tab đơn hàng cho bàn này
                          </p>
                        </div>
                        <Button onClick={handleCreateOrderTab} className='bg-blue-600 hover:bg-blue-700'>
                          {hasArrivedReservation ? 'Tiếp tục' : 'Tạo mới'}
                        </Button>
                      </div>
                    </div>

                    <div className='bg-yellow-50 p-4 rounded-lg border border-yellow-200'>
                      <div className='flex items-center mb-3'>
                        <Calendar className='w-5 h-5 mr-2 text-yellow-600' />
                        <span className='font-semibold text-yellow-800'>
                          Danh sách đặt bàn ({activeReservations.length})
                        </span>
                      </div>

                      <ScrollArea className='h-[calc(100vh-300px)]'>
                        <div className='space-y-3'>
                          {activeReservations.map((reservation) => (
                            <div
                              key={reservation.id}
                              className={classNames('border p-3 rounded-lg', {
                                'bg-orange-50 border-orange-200': reservation.status === ReservationStatus.Pending,
                                'bg-green-100 border-green-300': reservation.status === ReservationStatus.Confirmed
                              })}
                            >
                              <div className='flex items-center justify-between mb-2'>
                                <span
                                  className={classNames('text-sm font-medium', {
                                    'text-orange-800': reservation.status === ReservationStatus.Pending,
                                    'text-green-800': reservation.status === ReservationStatus.Confirmed
                                  })}
                                >
                                  {reservation.status === ReservationStatus.Pending ? 'Chờ xác nhận' : 'Đã xác nhận'}
                                </span>
                                {reservation.status === ReservationStatus.Pending ? (
                                  <Button
                                    onClick={() =>
                                      handleChangeReservationStatus({
                                        tableId: table.id,
                                        reservationId: reservation.id,
                                        status: ReservationStatus.Confirmed
                                      })
                                    }
                                    className='bg-green-600 hover:bg-green-700 text-white text-xs cursor-pointer'
                                  >
                                    Xác nhận
                                  </Button>
                                ) : (
                                  <div className='flex space-x-2'>
                                    <Button
                                      variant='outline'
                                      onClick={() =>
                                        handleChangeReservationStatus({
                                          tableId: table.id,
                                          reservationId: reservation.id,
                                          status: ReservationStatus.Cancelled
                                        })
                                      }
                                      className='text-xs cursor-pointer'
                                    >
                                      Hủy
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleChangeReservationStatus({
                                          tableId: table.id,
                                          reservationId: reservation.id,
                                          status: ReservationStatus.Arrived
                                        })
                                      }
                                      className='bg-blue-600 hover:bg-blue-700 text-white text-xs cursor-pointer'
                                      disabled={
                                        new Date(reservation.reservationTime).toISOString() <
                                          new Date().toISOString() && hasArrivedReservation
                                      }
                                    >
                                      Khách đến
                                    </Button>
                                  </div>
                                )}
                              </div>

                              <div className='space-y-1 text-sm'>
                                <div className='flex items-center'>
                                  <User className='w-4 h-4 mr-2 text-gray-500' />
                                  <span className='font-medium'>{reservation.guestName}</span>
                                </div>

                                <div className='flex items-center'>
                                  <Phone className='w-4 h-4 mr-2 text-gray-500' />
                                  <span>{reservation.guestPhone}</span>
                                </div>

                                <div className='flex items-center'>
                                  <Clock className='w-4 h-4 mr-2 text-gray-500' />
                                  <span>
                                    {new Date(reservation.reservationTime).toLocaleString('vi-VN')} -{' '}
                                    {reservation.numberOfGuest} người
                                  </span>
                                </div>

                                {reservation.note && (
                                  <div className='mt-2 p-2 bg-orange-100 rounded text-xs'>
                                    <strong>Ghi chú:</strong> {reservation.note}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
