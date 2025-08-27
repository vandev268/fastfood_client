import { Plus, Minus, DollarSign, Users, Settings, Trash2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { OrderType } from '@/constants/order'
import type { OrderItemType, OrderTabType, TableInfoType } from './types'
import { useState, useEffect, useMemo } from 'react'
import {
  formatDraftItemStatusColor,
  formatDraftItemStatusText,
  formatTableLocationText,
  formatTableStatusText,
  formatTableStatusColor
} from '@/lib/format'
import {
  useAllDraftItemsQuery,
  useChangeDraftItemStatusMutation,
  useChangeDraftItemTablesMutation,
  useDeleteDraftItemMutation
} from '@/queries/useDraftItem'
import { handleError } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAllTablesQuery, useTableDetailQuery, useChangeTableStatusMutation } from '@/queries/useTable'
import { ReservationStatus } from '@/constants/reservation'
import { TableStatus } from '@/constants/table'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { DraftItemStatusValues, type DraftItemStatusType } from '@/constants/draft-item'
import Receipt from '@/components/Receipt'
import type { OrderDetailType } from '@/schemaValidations/order.schema'

interface OrderTabProps {
  activeTab: OrderTabType | undefined
  selectedTableInfo: { code: string; capacity: number } | undefined
  tabItems: OrderItemType[]
  availableTables?: TableInfoType[]
  selectedTableIds?: number[]
  isLoading?: boolean
  currentOrder?: OrderDetailType
  onUpdateQuantity: (productId: number, variantId: number, change: number) => void
  onTableSelect?: (tableIds: number[]) => void
  onConfirmOrder: () => void
  onSaveTemporary: () => void
  onPayment?: () => void
}

export default function OrderTab({
  activeTab,
  selectedTableInfo,
  tabItems,
  availableTables = [],
  isLoading = false,
  currentOrder,
  onUpdateQuantity,
  onTableSelect,
  onConfirmOrder,
  onPayment
}: OrderTabProps) {
  const [isTableSelectionOpen, setIsTableSelectionOpen] = useState(false)
  const [tempQuantities, setTempQuantities] = useState<Record<string, string>>({})
  const [selectedTableIds, setSelectedTableIds] = useState<number[]>([])
  const [showReceipt, setShowReceipt] = useState(false)

  const allTablesQuery = useAllTablesQuery()
  const tables = useMemo(() => {
    if (allTablesQuery.isPending || !allTablesQuery.data) return []
    return allTablesQuery.data.data.data.filter((table) => table.code !== selectedTableInfo?.code)
  }, [allTablesQuery.isPending, allTablesQuery.data, selectedTableInfo])

  const allDraftItemsQuery = useAllDraftItemsQuery({
    tableId: activeTab ? (typeof activeTab.tableId === 'string' ? undefined : activeTab.tableId) : undefined
  })
  const draftItems = useMemo(() => {
    if (allDraftItemsQuery.isPending || !allDraftItemsQuery.data) return []
    return allDraftItemsQuery.data.data.data
  }, [allDraftItemsQuery.isPending, allDraftItemsQuery.data])

  useEffect(() => {
    if (draftItems && draftItems.length > 0) {
      const firstDraftItem = draftItems[0]
      setSelectedTableIds(
        firstDraftItem.tables.filter((table) => table.code !== selectedTableInfo?.code).map((table) => table.id)
      )
    } else {
      setSelectedTableIds([])
    }
  }, [draftItems, selectedTableInfo, activeTab?.tableId])

  useEffect(() => {
    setTempQuantities({})
  }, [tabItems])

  const tableDetailQuery = useTableDetailQuery(
    activeTab && activeTab.orderType === OrderType.DineIn && typeof activeTab.tableId === 'number'
      ? activeTab.tableId
      : undefined
  )
  const tableInfo = useMemo(
    function () {
      if (activeTab && (activeTab.orderType === OrderType.Takeaway || activeTab.orderType === OrderType.Delivery)) {
        return null
      }

      if (tableDetailQuery.isPending || !tableDetailQuery.data) return undefined
      return tableDetailQuery.data.data
    },
    [activeTab, tableDetailQuery.isPending, tableDetailQuery.data]
  )

  const getTotalAmount = () => {
    if (!tabItems) return 0
    return tabItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalCapacity = () => {
    if (!selectedTableInfo) return 0
    let totalCapacity = selectedTableInfo.capacity

    selectedTableIds.forEach((tableId) => {
      const table = availableTables.find((t) => t.id === tableId)
      if (table) {
        totalCapacity += table.capacity
      }
    })

    return totalCapacity
  }

  const changeDraftItemStatus = useChangeDraftItemStatusMutation()
  const handleChangeStatus = async (draftItemId: number, status: DraftItemStatusType) => {
    if (changeDraftItemStatus.isPending) return
    try {
      await changeDraftItemStatus.mutateAsync({ draftItemId, body: { status } })
    } catch (error) {
      handleError(error)
    }
  }

  const changeDraftItemTablesMutation = useChangeDraftItemTablesMutation()
  const changeTableStatusMutation = useChangeTableStatusMutation()

  const handleChangeTables = async (draftCode: string, tableIds: number[]) => {
    if (changeDraftItemTablesMutation.isPending || !tableInfo || activeTab?.orderType !== OrderType.DineIn) return
    try {
      await changeDraftItemTablesMutation.mutateAsync({
        draftCode,
        tableIds: [...tableIds, tableInfo.id]
      })

      setIsTableSelectionOpen(false)
      if (onTableSelect) {
        onTableSelect(tableIds)
      }
    } catch (error) {
      handleError(error)
    }
  }

  const handleClearTableSelection = async () => {
    if (changeTableStatusMutation.isPending || selectedTableIds.length === 0) return
    try {
      for (const tableId of selectedTableIds) {
        await changeTableStatusMutation.mutateAsync({ tableId, body: { status: TableStatus.Available } })
      }
      setSelectedTableIds([])
    } catch (error) {
      handleError(error)
    }
  }

  const deleteDraftItemMutation = useDeleteDraftItemMutation()
  const handleDeleteItem = async (draftItemId: number) => {
    if (deleteDraftItemMutation.isPending) return
    try {
      await deleteDraftItemMutation.mutateAsync(draftItemId)
    } catch (error) {
      handleError(error)
    }
  }

  const handlePrintReceipt = () => {
    if (activeTab?.orderType === OrderType.Delivery || tabItems.length === 0) {
      return
    }
    setShowReceipt(true)
  }

  const getOrderForPrint = (): OrderDetailType => {
    if (currentOrder) return currentOrder

    const tempOrder: OrderDetailType = {
      id: 0,
      orderType: activeTab?.orderType as any,
      customerName: 'Khách lẻ',
      userId: null,
      deliveryAddressId: null,
      tableId: null,
      bookingId: null,
      couponId: null,
      totalAmount: getTotalAmount(),
      feeAmount: 0,
      discountAmount: 0,
      finalAmount: getTotalAmount(),
      payment: {
        paymentMethod: 'Cash' as any,
        paymentStatus: 'Succeeded' as any,
        paidAt: new Date(),
        transactionId: ''
      },
      note: '',
      status: 'Pending' as any,
      handlerId: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      orderItems: tabItems.map((item) => ({
        id: item.productId,
        createdAt: new Date(),
        updatedAt: new Date(),
        productName: item.name,
        thumbnail: item.thumbnail || null,
        variantValue: item.variantValue !== 'default' ? item.variantValue : '',
        quantity: item.quantity,
        price: item.price,
        orderId: 0,
        productId: item.productId,
        variantId: item.variantId,
        variant: null
      })),
      tables:
        activeTab?.orderType === OrderType.DineIn && selectedTableInfo
          ? [
              {
                id: 0,
                code: selectedTableInfo.code,
                capacity: selectedTableInfo.capacity,
                location: 'Floor1' as any,
                status: 'Occupied' as any,
                deletedAt: null,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              ...selectedTableIds
                .map((tableId) => {
                  const table = availableTables.find((t) => t.id === tableId)
                  return table
                    ? {
                        id: table.id,
                        code: table.code,
                        capacity: table.capacity,
                        location: (table.location || 'Floor1') as any,
                        status: 'Occupied' as any,
                        deletedAt: null,
                        createdAt: new Date(),
                        updatedAt: new Date()
                      }
                    : null
                })
                .filter((table): table is NonNullable<typeof table> => table !== null)
            ]
          : [],
      reviews: [],
      user: null,
      deliveryAddress: null,
      reservation: null,
      coupon: null,
      handler: null
    }

    return tempOrder
  }

  if (!activeTab) {
    return (
      <div className='flex-1 flex items-center justify-center text-gray-500'>
        <div className='text-center'>
          <p className='text-lg mb-2'>Chưa có đơn hàng nào</p>
          <p className='text-sm'>Chọn bàn để bắt đầu thanh toán</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='flex-1 flex items-center justify-center text-gray-500'>
        <div className='text-center'>
          <div className='animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2'></div>
          <div>Đang tải đơn hàng...</div>
        </div>
      </div>
    )
  }

  if (activeTab?.orderType === OrderType.DineIn && !tableInfo) {
    return <div className='flex-1 flex items-center justify-center text-gray-500'>Loading...</div>
  }
  return (
    <>
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          {(() => {
            if (activeTab?.orderType === OrderType.DineIn && tableInfo) {
              const arrivedReservation = tableInfo.reservations.find((res) => res.status === ReservationStatus.Arrived)
              return (
                <h2>
                  <span className='font-semibold text-lg'>
                    {arrivedReservation ? 'Đơn hàng đặt trước' : 'Đơn hàng'}
                  </span>
                  <span className='text-gray-500 ml-2'>
                    {arrivedReservation
                      ? `(${arrivedReservation.guestName} | ${arrivedReservation.guestPhone} | ${arrivedReservation.numberOfGuest})`
                      : ''}
                  </span>
                </h2>
              )
            } else {
              return (
                <h2>
                  <span className='font-semibold text-lg'>Đơn hàng</span>
                  <span className='text-gray-500 ml-2'>{activeTab?.tableName}</span>
                </h2>
              )
            }
          })()}
          {activeTab.orderType === OrderType.DineIn && selectedTableIds.length > 0 && (
            <Badge variant='outline' className='flex items-center gap-1'>
              <Users className='w-3 h-3' />
              {selectedTableIds.length + 1} bàn
            </Badge>
          )}
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex-1'>
            {activeTab.orderType === OrderType.DineIn && selectedTableInfo && (
              <div className='space-y-1'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm text-gray-600'>
                    Bàn: #{selectedTableInfo.code} • Tổng chỗ: {getTotalCapacity()} người
                    {selectedTableIds.length > 0 && (
                      <>
                        <span className='text-blue-600 ml-1'>({selectedTableIds.length} bàn ghép)</span>{' '}
                        <span className='text-red-600 cursor-pointer underline' onClick={handleClearTableSelection}>
                          clear
                        </span>
                      </>
                    )}
                  </p>

                  {availableTables.length > 0 && (
                    <Dialog open={isTableSelectionOpen} onOpenChange={setIsTableSelectionOpen}>
                      <div title='Vui lòng order món trước khi ghép bàn'>
                        <DialogTrigger asChild>
                          <Button
                            variant='outline'
                            size='sm'
                            className='flex items-center gap-1'
                            disabled={tabItems.length === 0}
                          >
                            <Settings className='w-3 h-3' />
                            Ghép bàn ({selectedTableIds.length})
                          </Button>
                        </DialogTrigger>
                      </div>
                      <DialogContent className='max-w-3xl w-full' style={{ width: '50vw', maxWidth: '1200px' }}>
                        <DialogHeader className='flex items-center justify-between'>
                          <div>
                            <DialogTitle>Chọn bàn để ghép</DialogTitle>
                            <div className='text-sm text-gray-600'>
                              Bàn: #<strong>{selectedTableInfo.code}</strong> ({selectedTableInfo.capacity} người)
                            </div>
                          </div>
                          <div>
                            <Button
                              className='cursor-pointer'
                              onClick={() => handleChangeTables(tabItems[0].draftItem.draftCode, selectedTableIds)}
                            >
                              Ghép
                            </Button>
                          </div>
                        </DialogHeader>
                        <ScrollArea className='max-h-[calc(100vh-150px)]'>
                          <div className='space-y-4'>
                            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 px-3 my-1'>
                              {tables.map((table) => {
                                const isSelected = selectedTableIds.includes(table.id)
                                const isOccupied = table.status === TableStatus.Occupied

                                let isReservedAndTooClose = false
                                if (table.status === TableStatus.Reserved && table.reservations) {
                                  const activeReservation = table.reservations.find(
                                    (res) =>
                                      res.status === ReservationStatus.Pending ||
                                      res.status === ReservationStatus.Confirmed
                                  )
                                  if (activeReservation) {
                                    const now = new Date()
                                    const reservationTime = new Date(activeReservation.reservationTime)
                                    const timeDifference = reservationTime.getTime() - now.getTime()
                                    const hoursUntilReservation = timeDifference / (1000 * 60 * 60)
                                    isReservedAndTooClose = hoursUntilReservation <= 2.5
                                  }
                                }

                                const isDisabled = (isOccupied && !isSelected) || isReservedAndTooClose

                                return (
                                  <Button
                                    key={table.id}
                                    variant={isSelected ? 'default' : 'outline'}
                                    size='sm'
                                    className='justify-center h-auto p-3'
                                    disabled={isDisabled}
                                    onClick={async () => {
                                      if (isDisabled) return

                                      try {
                                        if (isSelected) {
                                          const newSelectedIds = selectedTableIds.filter((id) => id !== table.id)
                                          setSelectedTableIds(newSelectedIds)
                                          await changeTableStatusMutation.mutateAsync({
                                            tableId: table.id,
                                            body: { status: TableStatus.Available }
                                          })
                                        } else {
                                          const newSelectedIds = [...selectedTableIds, table.id]
                                          setSelectedTableIds(newSelectedIds)
                                          await changeTableStatusMutation.mutateAsync({
                                            tableId: table.id,
                                            body: { status: TableStatus.Occupied }
                                          })
                                        }
                                      } catch (error) {
                                        handleError(error)
                                      }
                                    }}
                                  >
                                    <div className={`text-center w-full ${isDisabled ? 'opacity-90' : ''}`}>
                                      <div className='font-medium text-sm'>{table.code}</div>
                                      <div className='text-xs text-gray-500'>{table.capacity} người</div>
                                      <div className='text-xs text-gray-500'>
                                        {formatTableLocationText(table.location)}
                                      </div>
                                      <div className='mt-1'>
                                        <span
                                          className={formatTableStatusColor({
                                            className: 'text-xs px-1.5 py-0.5 rounded-full font-medium',
                                            status: table.status
                                          })}
                                        >
                                          {formatTableStatusText(table.status)}
                                        </span>
                                      </div>
                                      {isReservedAndTooClose && (
                                        <div className='text-xs text-red-500 mt-1'>Gần giờ đặt bàn</div>
                                      )}
                                    </div>
                                  </Button>
                                )
                              })}
                            </div>
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                {selectedTableIds.length > 0 && (
                  <div className='flex flex-wrap gap-1'>
                    <span className='text-xs text-gray-500'>Bàn ghép:</span>
                    {selectedTableIds.slice(0, 3).map((tableId) => {
                      const table = tables.find((t) => t.id === tableId)
                      return table ? (
                        <Badge key={tableId} variant='secondary' className='text-xs'>
                          {table.code}
                        </Badge>
                      ) : null
                    })}
                    {selectedTableIds.length > 3 && (
                      <Badge variant='secondary' className='text-xs'>
                        +{selectedTableIds.length - 3} bàn khác
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
            {activeTab.orderType === OrderType.Takeaway && <p className='text-sm text-gray-600'>Đơn hàng mang đi</p>}
            {activeTab.orderType === OrderType.Delivery && <p className='text-sm text-gray-600'>Đơn hàng giao hàng</p>}
          </div>
        </div>
      </div>

      <ScrollArea className='flex-1 py-2 px-2 max-h-[calc(100vh-280px)] bg-gray-50'>
        {tabItems.length === 0 ? (
          <div className='text-center text-gray-500 mt-8'>
            <p>Chưa có món nào được chọn</p>
            <p className='text-sm mt-2'>Chọn món từ thực đơn để thêm vào đơn hàng</p>
          </div>
        ) : (
          <div className='space-y-2 pr-2'>
            {tabItems.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className='flex items-center justify-between p-2 bg-white rounded-lg shadow-sm'
              >
                <div className='flex items-center space-x-3 flex-1 min-w-0'>
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className='w-12 h-12 object-cover rounded flex-shrink-0'
                    />
                  )}
                  <div className='min-w-0'>
                    <h4 className='font-medium text-sm truncate'>{item.name}</h4>
                    {item.variantValue !== 'default' && (
                      <p className='text-xs text-gray-500 max-w-[300px] truncate'>{item.variantValue}</p>
                    )}
                    <p className='text-orange-600 font-semibold text-sm'>{item.price.toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>
                {activeTab?.orderType !== OrderType.Delivery && (
                  <div className='ml-4'>
                    <Select
                      onValueChange={(value) => handleChangeStatus(item.draftItem.id, value as DraftItemStatusType)}
                      defaultValue={item.draftItem.status}
                      value={item.draftItem.status}
                    >
                      <SelectTrigger
                        className='p-0 border-none shadow-none hover:shadow-none focus:shadow-none cursor-pointer'
                        hasIcon={false}
                      >
                        <span className={formatDraftItemStatusColor({ status: item.draftItem.status })}>
                          {formatDraftItemStatusText(item.draftItem.status)}
                        </span>
                      </SelectTrigger>

                      <SelectContent>
                        {DraftItemStatusValues.map((value) => (
                          <SelectItem key={value} value={value}>
                            {formatDraftItemStatusText(value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className='flex items-center flex-shrink-0 gap-3'>
                  <div className='flex items-center'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => onUpdateQuantity(item.productId, item.variantId, -1)}
                      className='h-8 w-8 p-0'
                    >
                      <Minus className='w-3 h-3' />
                    </Button>
                    <Input
                      type='text'
                      value={tempQuantities[`${item.productId}-${item.variantId}`] ?? item.quantity.toString()}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        const itemKey = `${item.productId}-${item.variantId}`

                        setTempQuantities((prev) => ({
                          ...prev,
                          [itemKey]: value
                        }))
                      }}
                      onKeyDown={(e) => {
                        if (
                          !/[0-9]/.test(e.key) &&
                          !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)
                        ) {
                          e.preventDefault()
                        }

                        if (e.key === 'Enter') {
                          e.currentTarget.blur()
                        }
                      }}
                      onBlur={(e) => {
                        const itemKey = `${item.productId}-${item.variantId}`
                        const value = e.target.value
                        let newQuantity = parseInt(value) || 1

                        const maxStock = item.draftItem.variant.stock
                        if (newQuantity < 1) {
                          newQuantity = 1
                        } else if (newQuantity > maxStock) {
                          newQuantity = maxStock
                        }

                        setTempQuantities((prev) => ({
                          ...prev,
                          [itemKey]: newQuantity.toString()
                        }))

                        const change = newQuantity - item.quantity
                        if (change !== 0) {
                          onUpdateQuantity(item.productId, item.variantId, change)
                        }
                      }}
                      onFocus={(e) => {
                        e.target.select()
                      }}
                      className='w-16 h-8 text-center font-medium'
                    />
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => onUpdateQuantity(item.productId, item.variantId, 1)}
                      className='h-8 w-8 p-0'
                    >
                      <Plus className='w-3 h-3' />
                    </Button>
                  </div>
                  <div>
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
                            <Button onClick={() => handleDeleteItem(item.draftItem.id)}>Yes</Button>
                          </DropdownMenuItem>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {tabItems && tabItems.length > 0 && (
        <div className='p-2 border-t border-gray-200 space-y-2'>
          <div className='space-y-2'>
            <div className='flex justify-between'>
              <span className='font-medium'>
                Tổng tiền ({tabItems.reduce((sum, item) => sum + item.quantity, 0)} món):
              </span>
              <span className='text-orange-600 font-bold text-lg'>{getTotalAmount().toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          <div className=''>
            <Button className='w-full mr-1' size='lg' onClick={onConfirmOrder || onPayment}>
              <DollarSign className='w-4 h-4' />
              Thanh toán
            </Button>
            {activeTab?.orderType !== OrderType.Delivery && tabItems.length > 0 && (
              <Button className='w-full' size='lg' variant='outline' onClick={handlePrintReceipt}>
                <Printer className='w-4 h-4 mr-2' />
                In hóa đơn
              </Button>
            )}
          </div>
        </div>
      )}

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className='min-w-4xl'>
          <DialogHeader>
            <DialogTitle>
              {activeTab?.orderType === OrderType.Takeaway ? 'Phiếu mang đi' : 'Hóa đơn thanh toán'}
            </DialogTitle>
          </DialogHeader>
          {tabItems.length > 0 && (
            <Receipt
              order={getOrderForPrint()}
              orderType={activeTab?.orderType}
              onPrint={() => setShowReceipt(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
