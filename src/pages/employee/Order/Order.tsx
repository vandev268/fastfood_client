import React, { useState, useRef, useCallback, useEffect, useMemo, lazy, Suspense } from 'react'
import {
  Plus,
  X,
  Eye,
  MapPin,
  Phone,
  User,
  GripVertical,
  CreditCard,
  Trash2,
  Edit,
  Grid2x2Check,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { useProvinceDetailQuery, useDistrictDetailQuery, useAllProvincesQuery } from '@/queries/useLocation'

const TableList = lazy(() => import('./TableList'))
const ProductList = lazy(() => import('./ProductList'))
const LazyOrderTab = lazy(() => import('./OrderTab'))
// const LazyReceipt = lazy(() => import('@/components/Receipt'))

import LoadingSpinner from '@/components/LoadingSpinner'
import useDebounce from '@/hooks/useDebounce'

import { useAllTablesQuery } from '@/queries/useTable'
import { useAllProductsQuery } from '@/queries/useProduct'
import {
  useAllOrdersQuery,
  useCreateDeliveryOrderMutation,
  useCreateDineInOrderMutation,
  useCreateTakeAwayOrderMutation
} from '@/queries/useOrder'
import { useAllReservationsQuery } from '@/queries/useReservation'
import {
  useAllDraftItemsQuery,
  useAddDraftItemToOrderMutation,
  useUpdateDraftItemMutation,
  useDeleteDraftItemMutation
} from '@/queries/useDraftItem'
import draftItemApis from '@/apis/draft-item'
import paymentApis from '@/apis/payment'

import type { ProductDetailType, VariantType } from '@/schemaValidations/product.schema'
import type { DraftItemDetailType } from '@/schemaValidations/draft-item.schema'

import { TableLocationValues, TableStatus, TableStatusValues } from '@/constants/table'
import { OrderFee, OrderStatus, OrderType, type OrderTypeType } from '@/constants/order'
import { ReservationStatus } from '@/constants/reservation'
import { ProductStatus } from '@/constants/product'
import { PaymentMethod, PaymentMethodValues, type PaymentMethodType } from '@/constants/payment'
import { useAllCouponsQuery } from '@/queries/useCoupon'
import { toast } from 'sonner'
import { generateNameId, getIdByNameId, handleError } from '@/lib/utils'
import type { CouponType } from '@/schemaValidations/coupon.schema'
import { CouponDiscountType } from '@/constants/coupon'
import {
  formatCurrency,
  formatOrderStatusColor,
  formatOrderStatusText,
  formatTableLocationText,
  formatTableStatusText
} from '@/lib/format'
import type { OrderItemType, OrderTabType } from './types'
import { useNavigate } from 'react-router'
import { useQuery } from '@/hooks/useQuery'
import { useAllCategoriesQuery } from '@/queries/useCategory'
import type { CategoryType } from '@/schemaValidations/category.schema'
import { useAutoTrackBehaviorMutation } from '@/queries/useRecommendation'
import { addHours } from 'date-fns'
import { useForm } from 'react-hook-form'
import { CreateAddressBodySchema, type CreateAddressBodyType } from '@/schemaValidations/address.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { reservationSocket, tableSocket } from '@/lib/sockets'
import { useAppContext } from '@/components/AppProvider'

export default function Order() {
  const navigate = useNavigate()
  const query = useQuery()
  const statusFilter = query.get('status') || ''
  const locationFilter = query.get('location') || ''
  const categoryFilter = query.get('category') || ''

  const addressForm = useForm<CreateAddressBodyType>({
    resolver: zodResolver(CreateAddressBodySchema),
    defaultValues: {
      recipientName: '',
      recipientPhone: '',
      provinceId: 0,
      districtId: 0,
      wardId: 0,
      detailAddress: '',
      deliveryNote: '',
      isDefault: false
    }
  })

  const provincesQuery = useAllProvincesQuery()
  const provinces = provincesQuery.data?.data.data || []

  const selectedProvinceId = addressForm.watch('provinceId')
  const selectedDistrictId = addressForm.watch('districtId')
  const provinceDetailQuery = useProvinceDetailQuery(selectedProvinceId || undefined)
  const districts = provinceDetailQuery.data?.data.districts || []
  const districtDetailQuery = useDistrictDetailQuery(selectedDistrictId || undefined)
  const wards = districtDetailQuery.data?.data.wards || []

  // Theo dõi sự thay đổi của tỉnh/thành phố
  useEffect(() => {
    if (selectedProvinceId === 0) {
      // Khi chọn giá trị mặc định (0) hoặc reset, đảm bảo các trường phụ thuộc cũng bị reset
      addressForm.setValue('districtId', 0)
      addressForm.setValue('wardId', 0)
    } else if (selectedProvinceId) {
      // Khi chọn một tỉnh/thành phố mới, reset các trường phụ thuộc
      addressForm.setValue('districtId', 0)
      addressForm.setValue('wardId', 0)
    }
  }, [selectedProvinceId, addressForm])

  // Theo dõi sự thay đổi của quận/huyện
  useEffect(() => {
    if (selectedDistrictId === 0 || selectedDistrictId) {
      // Khi quận/huyện thay đổi (bao gồm cả reset), reset phường/xã
      addressForm.setValue('wardId', 0)
    }
  }, [selectedDistrictId, addressForm])

  const [searchInput, setSearchInput] = useState('')
  const allCategoriesQuery = useAllCategoriesQuery()
  const parentCategories = useMemo(() => {
    if (allCategoriesQuery.isPending || !allCategoriesQuery.data) return []
    return allCategoriesQuery.data.data.data.filter((category) => !category.parentCategoryId)
  }, [allCategoriesQuery.isPending, allCategoriesQuery.data])

  const debouncedStatusFilter = useDebounce(statusFilter, 300)
  const debouncedLocationFilter = useDebounce(locationFilter, 300)

  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [currentView, setCurrentView] = useState<'tables' | 'menu'>('tables')
  const [orderTabs, setOrderTabs] = useState<OrderTabType[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [isTabLoading, setIsTabLoading] = useState<boolean>(false)
  const [takeawayCounter, setTakeawayCounter] = useState(1)
  const [deliveryCounter, setDeliveryCounter] = useState(1)

  const [tabSelectedTables, setTabSelectedTables] = useState<Record<string, number[]>>({})

  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false)
  const [showOrderConfirmDialog, setShowOrderConfirmDialog] = useState(false)
  const [orderCreating, setOrderCreating] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>(PaymentMethod.COD)
  const [couponCode, setCouponCode] = useState('')
  const [selectedCoupon, setSelectedCoupon] = useState<CouponType | null>(null)

  const [editingDeliveryOrders, setEditingDeliveryOrders] = useState<Record<string, boolean>>({})

  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showTakeawayPaymentDialog, setShowTakeawayPaymentDialog] = useState(false)
  const [showDeliveryPaymentDialog, setShowDeliveryPaymentDialog] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<{
    orderNumber: number
    items: Array<{ name: string; quantity: number; price: number; total: number }>
    payments: Array<{ method: string; amount: number; paymentId?: string }>
    subtotal: number
    total: number
    tableNumber?: number
    orderDate: Date
  } | null>(null)
  const [payments, setPayments] = useState<Array<{ method: PaymentMethodType; amount: number; paymentUrl?: string }>>(
    []
  )
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<PaymentMethodType>(PaymentMethod.Cash)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const [leftPanelWidth, setLeftPanelWidth] = useState(55)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollStartX, setScrollStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const tabsContainerRef = useRef<HTMLDivElement>(null)

  const { data: tablesData, refetch: refetchTables } = useAllTablesQuery()
  const tables = useMemo(() => tablesData?.data.data || [], [tablesData?.data.data])

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchesStatus = !debouncedStatusFilter || table.status === debouncedStatusFilter
      const matchesLocation = !debouncedLocationFilter || table.location === debouncedLocationFilter
      return matchesStatus && matchesLocation
    })
  }, [tables, debouncedStatusFilter, debouncedLocationFilter])

  const { data: productsData } = useAllProductsQuery()
  const products = useMemo(() => productsData?.data.data || [], [productsData?.data.data])
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        !categoryFilter || product.categories.some((category) => `${category.id}` === getIdByNameId(categoryFilter))
      const matchesSearch = product.name.toLowerCase().includes(searchInput.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [products, categoryFilter, searchInput])

  const { data: ordersData } = useAllOrdersQuery()
  const orders = useMemo(() => ordersData?.data.data || [], [ordersData?.data.data])

  const addDraftItemMutation = useAddDraftItemToOrderMutation()
  const updateDraftItemMutation = useUpdateDraftItemMutation()
  const deleteDraftItemMutation = useDeleteDraftItemMutation()
  const createDineInOrderMutation = useCreateDineInOrderMutation()

  const generateDraftCode = useCallback(
    (tableId: number | string, orderType: OrderTypeType, isEditing: boolean = false) => {
      if (orderType === OrderType.DineIn && typeof tableId === 'number') {
        const table = tables.find((t) => t.id === tableId)
        return table ? `draft-${table.code}` : `draft-${tableId}`
      } else if (orderType === OrderType.Takeaway) {
        return typeof tableId === 'string' ? tableId : `draft-takeaway-${tableId}`
      } else if (orderType === OrderType.Delivery) {
        if (isEditing && typeof tableId === 'string' && tableId.match(/^\d+$/)) {
          return `draft-delivery-edit-${tableId}`
        }
        return typeof tableId === 'string' ? tableId : `draft-delivery-${tableId}`
      }
      return null
    },
    [tables]
  )

  const convertDraftItemToOrderItem = useCallback(
    (draftItem: DraftItemDetailType): OrderItemType => ({
      id: draftItem.id,
      productId: draftItem.variant.product.id,
      variantId: draftItem.variantId,
      name: draftItem.variant.product.name,
      variantValue: draftItem.variant.value,
      price: draftItem.variant.price,
      quantity: draftItem.quantity,
      thumbnail: draftItem.variant.thumbnail || draftItem.variant.product.images?.[0] || null,
      draftItem
    }),
    []
  )

  const convertOrderItemToDraftItem = async (orderItem: any, draftCode: string) => {
    try {
      await addDraftItemMutation.mutateAsync({
        draftCode,
        variantId: orderItem.variantId,
        quantity: orderItem.quantity,
        tableIds: []
      })
    } catch (error) {
      handleError(error)
    }
  }

  const availableProducts = useMemo(() => {
    return filteredProducts.filter(
      (product) => product.status === ProductStatus.Available && product.variants.some((variant) => variant.stock > 0)
    )
  }, [filteredProducts])

  const deliveryOrders = useMemo(() => {
    return orders.filter(
      (order) =>
        order.orderType === OrderType.Delivery &&
        (order.status === OrderStatus.Pending || order.status === OrderStatus.Preparing)
    )
  }, [orders])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

      const constrainedWidth = Math.min(Math.max(newWidth, 20), 80)
      setLeftPanelWidth(constrainedWidth)
    },
    [isResizing]
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  const handleTabMouseDown = useCallback((e: React.MouseEvent) => {
    if (!tabsContainerRef.current) return
    setIsScrolling(true)
    setScrollStartX(e.pageX - tabsContainerRef.current.offsetLeft)
    setScrollLeft(tabsContainerRef.current.scrollLeft)
  }, [])

  const handleTabMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isScrolling || !tabsContainerRef.current) return
      e.preventDefault()
      const x = e.pageX - tabsContainerRef.current.offsetLeft
      const walk = (x - scrollStartX) * 2
      tabsContainerRef.current.scrollLeft = scrollLeft - walk
    },
    [isScrolling, scrollStartX, scrollLeft]
  )

  const handleTabMouseUp = useCallback(() => {
    setIsScrolling(false)
  }, [])

  const handleTabMouseLeave = useCallback(() => {
    setIsScrolling(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  useEffect(() => {
    if (isScrolling) {
      document.addEventListener('mousemove', handleTabMouseMove)
      document.addEventListener('mouseup', handleTabMouseUp)
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleTabMouseMove)
      document.removeEventListener('mouseup', handleTabMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleTabMouseMove)
      document.removeEventListener('mouseup', handleTabMouseUp)
      document.body.style.userSelect = ''
    }
  }, [isScrolling, handleTabMouseMove, handleTabMouseUp])

  const handleTableSelect = (
    tableId: number | string,
    orderType: OrderTypeType = OrderType.DineIn,
    reservationId?: number
  ) => {
    let tableName = ''

    if (orderType === OrderType.Takeaway) {
      tableName = `Mang đi #${takeawayCounter}`
      setTakeawayCounter((prev) => prev + 1)
    } else if (orderType === OrderType.Delivery) {
      setShowDeliveryDialog(true)
      return
    } else {
      const table = tables.find((t) => t.id === tableId)
      if (!table) return
      tableName = table.code

      const existingTab = orderTabs.find((tab) => tab.tableId === tableId && tab.orderType === OrderType.DineIn)
      if (existingTab) {
        setActiveTabId(existingTab.id)
        setCurrentView('menu')
        setSelectedTable(tableId as number)
        return
      }
    }

    const newTabId = `tab-${Date.now()}`
    const newTab: OrderTabType = {
      id: newTabId,
      tableId: tableId,
      tableName: tableName,
      items: orderType === OrderType.DineIn ? [] : [],
      isActive: true,
      orderType: orderType,
      reservationId: reservationId
    }

    setIsTabLoading(true)

    setOrderTabs((prev) => [...prev.map((tab) => ({ ...tab, isActive: false })), newTab])
    setActiveTabId(newTabId)
    if (orderType === OrderType.DineIn) {
      setSelectedTable(tableId as number)
    }
    setCurrentView('menu')

    setTimeout(() => {
      setIsTabLoading(false)
    }, 200)
  }

  const onCreateTakeawayOrder = (draftCode: string) => {
    const existingTab = orderTabs.find((tab) => tab.orderType === OrderType.Takeaway && tab.tableId === draftCode)

    if (existingTab) {
      setOrderTabs((prev) =>
        prev.map((tab) => ({
          ...tab,
          isActive: tab.id === existingTab.id
        }))
      )
      setActiveTabId(existingTab.id)
      setCurrentView('menu')
      return
    }

    const displayCode = draftCode.replace('draft-takeaway-', '')
    const tableName = `MD - ${displayCode}`
    const newTabId = `tab-${Date.now()}`
    const newTab: OrderTabType = {
      id: newTabId,
      tableId: draftCode,
      tableName: tableName,
      items: [],
      isActive: true,
      orderType: OrderType.Takeaway
    }

    setIsTabLoading(true)

    setOrderTabs((prev) => [...prev.map((tab) => ({ ...tab, isActive: false })), newTab])
    setActiveTabId(newTabId)
    setCurrentView('menu')
    setTakeawayCounter((prev) => prev + 1)

    setTimeout(() => {
      setIsTabLoading(false)
    }, 200)
  }

  const handleLoadDraftItems = async (draftCode: string) => {
    try {
      const existingTab = orderTabs.find((tab) => tab.orderType === OrderType.Takeaway && tab.tableId === draftCode)

      if (existingTab) {
        setOrderTabs((prev) =>
          prev.map((tab) => ({
            ...tab,
            isActive: tab.id === existingTab.id
          }))
        )
        setActiveTabId(existingTab.id)
        setCurrentView('menu')
        return
      }

      const response = await draftItemApis.findAll({
        draftCode
      })

      if (response?.data.data && response.data.data.length > 0) {
        const orderItems: OrderItemType[] = response.data.data.map(convertDraftItemToOrderItem)

        const displayCode = draftCode.replace('draft-takeaway-', '')
        const tableName = `MD - ${displayCode}`
        const newTabId = `tab-${Date.now()}`
        const newTab: OrderTabType = {
          id: newTabId,
          tableId: draftCode,
          tableName: tableName,
          items: orderItems,
          isActive: true,
          orderType: OrderType.Takeaway
        }

        setIsTabLoading(true)

        setOrderTabs((prev) => [...prev.map((tab) => ({ ...tab, isActive: false })), newTab])
        setActiveTabId(newTabId)
        setCurrentView('menu')

        setTimeout(() => {
          setIsTabLoading(false)
        }, 200)

        showNotification('Thành công', `Đã tải ${orderItems.length} sản phẩm từ mã ${displayCode}`, 'success')
      } else {
        const displayCode = draftCode.replace('draft-takeaway-', '')
        showNotification('Thông báo', `Không tìm thấy sản phẩm nào với mã ${displayCode}`, 'info')
      }
    } catch (error) {
      handleError(error)
    }
  }

  const onCreateDeliveryOrder = (draftCode: string) => {
    const existingTab = orderTabs.find((tab) => tab.orderType === OrderType.Delivery && tab.tableId === draftCode)

    if (existingTab) {
      setOrderTabs((prev) =>
        prev.map((tab) => ({
          ...tab,
          isActive: tab.id === existingTab.id
        }))
      )
      setActiveTabId(existingTab.id)
      setCurrentView('menu')
      return
    }

    const displayCode = draftCode.replace('draft-delivery-', '')
    const tableName = `GH - ${displayCode}`
    const newTabId = `tab-${Date.now()}`
    const newTab: OrderTabType = {
      id: newTabId,
      tableId: draftCode,
      tableName: tableName,
      items: [],
      isActive: true,
      orderType: OrderType.Delivery
    }

    setIsTabLoading(true)

    setOrderTabs((prev) => [...prev.map((tab) => ({ ...tab, isActive: false })), newTab])
    setActiveTabId(newTabId)
    setCurrentView('menu')
    setDeliveryCounter((prev) => prev + 1)

    setTimeout(() => {
      setIsTabLoading(false)
    }, 200)
  }

  const handleLoadDeliveryDraftItems = async (draftCode: string) => {
    try {
      const existingTab = orderTabs.find((tab) => tab.orderType === OrderType.Delivery && tab.tableId === draftCode)

      if (existingTab) {
        setOrderTabs((prev) =>
          prev.map((tab) => ({
            ...tab,
            isActive: tab.id === existingTab.id
          }))
        )
        setActiveTabId(existingTab.id)
        setCurrentView('menu')
        return
      }

      const response = await draftItemApis.findAll({
        draftCode
      })

      if (response?.data.data && response.data.data.length > 0) {
        const orderItems: OrderItemType[] = response.data.data.map(convertDraftItemToOrderItem)

        const displayCode = draftCode.replace('draft-delivery-', '')
        const tableName = `GH - ${displayCode}`
        const newTabId = `tab-${Date.now()}`
        const newTab: OrderTabType = {
          id: newTabId,
          tableId: draftCode,
          tableName: tableName,
          items: orderItems,
          isActive: true,
          orderType: OrderType.Delivery
        }

        setIsTabLoading(true)

        setOrderTabs((prev) => [...prev.map((tab) => ({ ...tab, isActive: false })), newTab])
        setActiveTabId(newTabId)
        setCurrentView('menu')

        setTimeout(() => {
          setIsTabLoading(false)
        }, 200)

        showNotification('Thành công', `Đã tải ${orderItems.length} sản phẩm từ mã ${displayCode}`, 'success')
      } else {
        const displayCode = draftCode.replace('draft-delivery-', '')
        showNotification('Thông báo', `Không tìm thấy sản phẩm nào với mã ${displayCode}`, 'info')
      }
    } catch (error) {
      handleError(error)
    }
  }

  const handleDeleteDraftItems = (draftCode: string) => {
    const tabsToClose = orderTabs.filter(
      (tab) =>
        (tab.orderType === OrderType.Takeaway || tab.orderType === OrderType.Delivery) && tab.tableId === draftCode
    )

    tabsToClose.forEach((tab) => {
      closeTab(tab.id)
    })

    showNotification(
      'Thành công',
      `Đã xóa đơn hàng ${draftCode.replace('draft-takeaway-', '').replace('draft-delivery-', '')}`,
      'success'
    )
  }

  const createDeliveryOrder = async (orderId?: string, isEditing: boolean = false) => {
    let tableName = ''
    let items: OrderItemType[] = []

    if (orderId) {
      const order = deliveryOrders.find((o) => o.id.toString() === orderId)
      if (order) {
        tableName = isEditing ? `Sửa GH - ${order.customerName}` : `GH - ${order.customerName}`

        if (isEditing) {
          const draftCode = generateDraftCode(orderId, OrderType.Delivery, true)
          if (draftCode) {
            try {
              const existingDraftResponse = await draftItemApis.findAll({
                draftCode
              })

              if (existingDraftResponse?.data.data) {
                await Promise.all(
                  existingDraftResponse.data.data.map((item) => deleteDraftItemMutation.mutateAsync(item.id))
                )
              }

              for (const orderItem of order.orderItems) {
                await convertOrderItemToDraftItem(orderItem, draftCode)
              }

              setEditingDeliveryOrders((prev) => ({
                ...prev,
                [orderId]: true
              }))

              showNotification('Thông báo', 'Đã chuyển đơn hàng sang chế độ chỉnh sửa', 'info')
            } catch (error) {
              handleError(error)
              return
            }
          }
        } else {
          items = order.orderItems.map((item) => ({
            id: item.id,
            productId: item.productId || 0,
            variantId: item.variantId || 0,
            name: item.productName,
            variantValue: item.variantValue,
            price: item.price,
            quantity: item.quantity,
            thumbnail: item.thumbnail,
            draftItem: {} as DraftItemDetailType
          }))
        }
      }
    } else {
      tableName = `Giao hàng #${deliveryCounter}`
      setDeliveryCounter((prev) => prev + 1)
    }

    const newTabId = `tab-${Date.now()}`
    const newTab: OrderTabType = {
      id: newTabId,
      tableId: orderId || `delivery-${deliveryCounter}`,
      tableName: tableName,
      items: items,
      isActive: true,
      orderType: OrderType.Delivery
    }

    setIsTabLoading(true)

    setOrderTabs((prev) => [...prev.map((tab) => ({ ...tab, isActive: false })), newTab])
    setActiveTabId(newTabId)
    setCurrentView('menu')
    setShowDeliveryDialog(false)

    setTimeout(() => {
      setIsTabLoading(false)
    }, 200)
  }

  const closeTab = async (tabId: string) => {
    const tabToClose = orderTabs.find((tab) => tab.id === tabId)
    if (!tabToClose) return

    if (tabToClose.orderType === OrderType.Delivery) {
      const isEditingMode = editingDeliveryOrders[tabToClose.tableId as string]
      if (isEditingMode) {
        setEditingDeliveryOrders((prev) => {
          const newState = { ...prev }
          delete newState[tabToClose.tableId as string]
          return newState
        })
      }
    }

    const updatedTabs = orderTabs.filter((tab) => tab.id !== tabId)
    setOrderTabs(updatedTabs)

    setTabSelectedTables((prev) => {
      const newState = { ...prev }
      delete newState[tabId]
      return newState
    })

    if (activeTabId === tabId) {
      const updatedTabs = orderTabs.filter((tab) => tab.id !== tabId)
      if (updatedTabs.length > 0) {
        const newActiveTab = updatedTabs[updatedTabs.length - 1]
        setActiveTabId(newActiveTab.id)
        setSelectedTable(newActiveTab.tableId as number)
      } else {
        setActiveTabId(null)
        setSelectedTable(null)
        setCurrentView('tables')
      }
    }
  }

  const handleCloseTab = (tabId: string) => {
    closeTab(tabId)
  }

  const switchTab = (tabId: string) => {
    const tab = orderTabs.find((t) => t.id === tabId)
    if (!tab) return

    setIsTabLoading(true)

    setOrderTabs((prev) => prev.map((t) => ({ ...t, isActive: t.id === tabId })))
    setActiveTabId(tabId)

    if (tab.orderType === OrderType.DineIn) {
      setSelectedTable(tab.tableId as number)
    }
    setCurrentView('menu')

    setTimeout(() => {
      setIsTabLoading(false)
    }, 200)
  }

  const getActiveTab = () => {
    return orderTabs.find((tab) => tab.id === activeTabId)
  }

  const activeTab = getActiveTab()
  const activeDraftCode =
    activeTab && activeTab.orderType === OrderType.DineIn
      ? generateDraftCode(activeTab.tableId, activeTab.orderType)
      : activeTab && activeTab.orderType === OrderType.Takeaway
        ? generateDraftCode(activeTab.tableId, activeTab.orderType)
        : activeTab && activeTab.orderType === OrderType.Delivery
          ? generateDraftCode(
              activeTab.tableId,
              activeTab.orderType,
              editingDeliveryOrders[activeTab.tableId as string]
            )
          : null

  const { data: draftItemsData } = useAllDraftItemsQuery({
    tableId:
      activeTab && activeTab.orderType === OrderType.DineIn
        ? typeof activeTab.tableId === 'number'
          ? activeTab.tableId
          : undefined
        : undefined,
    draftCode:
      activeTab && (activeTab.orderType === OrderType.Takeaway || activeTab.orderType === OrderType.Delivery)
        ? activeDraftCode || undefined
        : undefined
  })

  const activeDraftItems = useMemo(() => draftItemsData?.data.data || [], [draftItemsData?.data.data])
  const activeTabItems = useMemo(
    () => activeDraftItems.map(convertDraftItemToOrderItem),
    [activeDraftItems, convertDraftItemToOrderItem]
  )

  const isActiveTabInEditingMode =
    activeTab && activeTab.orderType === OrderType.Delivery && editingDeliveryOrders[activeTab.tableId as string]

  const addToOrder = async (product: ProductDetailType, variant: VariantType, quantity: number = 1) => {
    const activeTab = getActiveTab()
    if (!activeTab) return

    const draftCode = generateDraftCode(activeTab.tableId, activeTab.orderType, isActiveTabInEditingMode)
    if (!draftCode) return

    try {
      let allTableIds: number[] = []
      if (activeTab.orderType === OrderType.DineIn && typeof activeTab.tableId === 'number') {
        const selectedTableIds = getSelectedTableIds()
        allTableIds = [activeTab.tableId as number, ...selectedTableIds.filter((id) => id !== activeTab.tableId)]
      }

      const existingDraftItem = activeDraftItems.find((item) => item.variantId === variant.id)

      if (existingDraftItem) {
        const originalDraftCode = existingDraftItem.draftCode
        const existingTableIds = existingDraftItem.tables.map((table) => table.id)
        const combinedTableIds = [...new Set([...allTableIds, ...existingTableIds])]

        await updateDraftItemMutation.mutateAsync({
          draftItemId: existingDraftItem.id,
          body: {
            draftCode: originalDraftCode,
            variantId: variant.id,
            quantity: existingDraftItem.quantity + quantity,
            tableIds: combinedTableIds
          }
        })
      } else {
        let targetDraftCode = draftCode
        let targetTableIds = allTableIds

        if (activeDraftItems.length > 0) {
          const firstDraftItem = activeDraftItems[0]
          targetDraftCode = firstDraftItem.draftCode

          if (activeTab.orderType === OrderType.DineIn) {
            const existingTableIds = firstDraftItem.tables.map((table) => table.id)
            targetTableIds = [...new Set([...allTableIds, ...existingTableIds])]
          }
        }

        await addDraftItemMutation.mutateAsync({
          draftCode: targetDraftCode,
          variantId: variant.id,
          quantity: quantity,
          tableIds: targetTableIds
        })
      }
    } catch (error) {
      handleError(error)
    }
  }

  const updateQuantity = async (productId: number, variantId: number, change: number) => {
    const activeTab = getActiveTab()
    if (!activeTab) return

    try {
      const existingDraftItem = activeDraftItems.find((item) => item.variantId === variantId)
      if (!existingDraftItem) return
      const newQuantity = existingDraftItem.quantity + change
      const originalDraftCode = existingDraftItem.draftCode

      let allTableIds: number[] = []
      if (activeTab.orderType === OrderType.DineIn && typeof activeTab.tableId === 'number') {
        const selectedTableIds = getSelectedTableIds()
        allTableIds = [activeTab.tableId as number, ...selectedTableIds.filter((id) => id !== activeTab.tableId)]

        const existingTableIds = existingDraftItem.tables.map((table) => table.id)
        allTableIds = [...new Set([...allTableIds, ...existingTableIds])]
      }

      if (newQuantity <= 0) {
        await deleteDraftItemMutation.mutateAsync(existingDraftItem.id)
      } else {
        await updateDraftItemMutation.mutateAsync({
          draftItemId: existingDraftItem.id,
          body: {
            draftCode: originalDraftCode,
            variantId: variantId,
            quantity: newQuantity,
            tableIds: allTableIds
          }
        })
      }
    } catch (error) {
      handleError(error)
    }
  }

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (type === 'error') {
      toast.error(`${title}: ${message}`)
    } else if (type === 'success') {
      toast.success(`${title}: ${message}`)
    } else {
      toast.info(`${title}: ${message}`)
    }
  }

  const handleConfirmOrder = () => {
    if (!activeTab) {
      showNotification('Lỗi', 'Không có đơn hàng nào được chọn', 'error')
      return
    }

    const currentItems = getTabItems(activeTab)

    if (currentItems.length === 0) {
      showNotification('Lỗi', 'Vui lòng thêm món vào đơn hàng', 'error')
      return
    }

    if (activeTab.orderType === OrderType.DineIn) {
      setShowOrderConfirmDialog(true)
    } else if (activeTab.orderType === OrderType.Delivery && isActiveTabInEditingMode) {
      handleUpdateDeliveryOrder()
    } else if (activeTab.orderType === OrderType.Takeaway) {
      setShowTakeawayPaymentDialog(true)
    } else if (activeTab.orderType === OrderType.Delivery) {
      setShowDeliveryPaymentDialog(true)
    } else {
      showNotification('Thông báo', 'Loại đơn hàng không được hỗ trợ', 'info')
    }
  }

  const couponsQuery = useAllCouponsQuery()
  const coupons = useMemo(() => couponsQuery.data?.data.data || [], [couponsQuery.data?.data.data])

  const handleSelectedCoupon = () => {
    if (couponCode === null || couponCode.trim() === '') {
      setSelectedCoupon(null)
      toast.error('Vui lòng nhập mã giảm giá!')
      return
    }
    const coupon = coupons.find((coupon) => coupon.code === couponCode)
    if (coupon) {
      if (!coupon.isActive) {
        toast.error('Mã giảm giá đã bị vô hiệu hóa!')
        return
      }

      if (coupon.expiresAt) {
        const now = new Date()
        const expiryDate = new Date(coupon.expiresAt)

        if (now > expiryDate) {
          toast.error(`Mã giảm giá đã hết hạn! Hết hiệu lực từ ${expiryDate.toLocaleDateString('vi-VN')}`)
          return
        }
      }

      if (coupon.minOrderAmount && getTotalAmount() < coupon.minOrderAmount) {
        toast.error(`Đơn hàng phải có giá trị tối thiểu ${formatCurrency(coupon.minOrderAmount)} để sử dụng mã này!`)
        return
      }

      if (coupon.usageLimit === 0) {
        toast.error('Mã giảm giá đã hết lượt sử dụng!')
        return
      }

      setSelectedCoupon(coupon)
      toast.success(`Mã giảm giá ${coupon.code} đã được áp dụng!`)
    } else {
      setSelectedCoupon(null)
      toast.error('Mã giảm giá không hợp lệ!')
    }
  }

  const resetCouponState = () => {
    setCouponCode('')
    setSelectedCoupon(null)
  }

  const handleClosePaymentDialog = () => {
    setShowPaymentDialog(false)
    resetCouponState()
  }

  const handleCloseTakeawayPaymentDialog = () => {
    setShowTakeawayPaymentDialog(false)
    resetCouponState()
  }

  const handleCloseDeliveryPaymentDialog = () => {
    setShowDeliveryPaymentDialog(false)
    resetCouponState()
  }

  const handleCloseOrderConfirmDialog = () => {
    setShowOrderConfirmDialog(false)
    resetCouponState()
  }

  const couponSelected = useMemo(() => {
    if (couponCode && coupons && coupons.length > 0) {
      const coupon = coupons.find((c) => c.code === couponCode)
      return coupon ? coupon : null
    }
    return null
  }, [couponCode, coupons])

  const { trackOrderBehavior } = useAutoTrackBehaviorMutation()

  const { isAuth } = useAppContext()
  const { data, refetch } = useAllReservationsQuery()
  const allReservations = useMemo(() => data?.data.data || [], [data])

  useEffect(() => {
    if (isAuth) {
      tableSocket.connect()
      reservationSocket.connect()
    } else {
      tableSocket.disconnect()
      reservationSocket.disconnect()
      return
    }
    tableSocket.on('sended-table', () => {
      refetchTables()
    })

    reservationSocket.on('received-reservation', () => {
      setTimeout(() => {
        refetch()
        refetchTables()
      }, 10)
    })

    reservationSocket.on('updated-reservation', () => {
      setTimeout(() => {
        refetch()
        refetchTables()
      }, 10)
    })

    reservationSocket.on('changed-reservation-status', () => {
      setTimeout(() => {
        refetch()
        refetchTables()
      }, 10)
    })

    return () => {
      tableSocket.off('sended-table')
      reservationSocket.off('received-reservation')
      reservationSocket.off('updated-reservation')
      reservationSocket.off('changed-reservation-status')
      tableSocket.disconnect()
      reservationSocket.disconnect()
    }
  }, [isAuth, refetch, refetchTables])

  const handleCreateDineInOrder = async () => {
    if (!activeTab) {
      showNotification('Lỗi', 'Không có đơn hàng nào được chọn', 'error')
      return
    }

    setOrderCreating(true)

    try {
      const draftCode = generateDraftCode(activeTab.tableId, activeTab.orderType)
      if (!draftCode) {
        throw new Error('Không thể tạo mã draft cho bàn này')
      }
      const reservation = allReservations.find((r) => r.tableId === activeTab.tableId)
      const selectedTables = tabSelectedTables[activeTab.id] || []
      const tableIds = [activeTab.tableId as number, ...selectedTables]
      const response = await createDineInOrderMutation.mutateAsync({
        draftCode,
        draftItems: activeDraftItems,
        orderType: activeTab.orderType,
        note: orderNote.trim() || '',
        couponId: couponSelected ? couponSelected.id : null,
        tableIds,
        reservationId: reservation ? reservation.id : null,
        paymentMethod: selectedPaymentMethod
      })
      const productIdsSet = new Set(activeDraftItems.map((item) => item.variant.productId))
      for (const productId of productIdsSet) {
        const { totalAmount, totalQuantity } = activeDraftItems
          .filter((item) => item.variant.productId === productId)
          .reduce(
            (acc, item) => {
              acc.totalAmount += item.variant.price * item.quantity
              acc.totalQuantity += item.quantity
              return acc
            },
            { totalAmount: 0, totalQuantity: 0 }
          )
        trackOrderBehavior({
          productId,
          quantity: totalQuantity,
          amount: totalAmount
        })
      }
      toast.success('Đã tạo đơn hàng thành công!')
      if (response.data.paymentUrl) {
        window.open(response.data.paymentUrl, '_blank')
      }

      handleCloseTab(activeTab.id)
      handleCloseOrderConfirmDialog()
      setOrderNote('')
      setCouponCode('')
      setSelectedPaymentMethod(PaymentMethod.Cash)
    } catch (error) {
      handleError(error)
    } finally {
      setOrderCreating(false)
    }
  }

  const createTakeawayOrderMutation = useCreateTakeAwayOrderMutation()
  const handleCreateTakeawayOrder = async () => {
    if (createTakeawayOrderMutation.isPending) return
    if (!activeTab) {
      showNotification('Lỗi', 'Không có đơn hàng nào được chọn', 'error')
      return
    }
    setOrderCreating(true)
    try {
      const draftCode = generateDraftCode(activeTab.tableId, activeTab.orderType)
      if (!draftCode) {
        throw new Error('Không thể tạo mã draft cho đơn hàng mang đi')
      }

      const response = await createTakeawayOrderMutation.mutateAsync({
        draftCode,
        draftItems: activeDraftItems,
        note: orderNote.trim() || '',
        couponId: couponSelected ? couponSelected.id : null,
        paymentMethod: selectedPaymentMethod
      })
      const productIdsSet = new Set(activeDraftItems.map((item) => item.variant.productId))
      for (const productId of productIdsSet) {
        const { totalAmount, totalQuantity } = activeDraftItems
          .filter((item) => item.variant.productId === productId)
          .reduce(
            (acc, item) => {
              acc.totalAmount += item.variant.price * item.quantity
              acc.totalQuantity += item.quantity
              return acc
            },
            { totalAmount: 0, totalQuantity: 0 }
          )
        trackOrderBehavior({
          productId,
          quantity: totalQuantity,
          amount: totalAmount
        })
      }

      if (response.data.paymentUrl) {
        window.open(response.data.paymentUrl, '_blank')
      }

      toast.success('Đã tạo đơn hàng mang đi thành công!')
      handleCloseTab(activeTab.id)
      setShowTakeawayPaymentDialog(false)
      setOrderNote('')
      setCouponCode('')
      setSelectedPaymentMethod(PaymentMethod.Cash)
    } catch (error) {
      handleError(error)
    } finally {
      setOrderCreating(false)
    }
  }

  const createDeliveryOrderMutation = useCreateDeliveryOrderMutation()
  const handleCreateDeliveryOrder = async (deliveryAddress: CreateAddressBodyType) => {
    if (createDeliveryOrderMutation.isPending) return
    if (!activeTab) {
      showNotification('Lỗi', 'Không có đơn hàng nào được chọn', 'error')
      return
    }
    setOrderCreating(true)
    try {
      const draftCode = generateDraftCode(activeTab.tableId, activeTab.orderType)
      if (!draftCode) {
        throw new Error('Không thể tạo mã draft cho đơn hàng mang đi')
      }

      const response = await createDeliveryOrderMutation.mutateAsync({
        draftCode,
        draftItems: activeDraftItems,
        note: orderNote.trim() || '',
        couponId: couponSelected ? couponSelected.id : null,
        paymentMethod: selectedPaymentMethod,
        deliveryAddress
      })
      const productIdsSet = new Set(activeDraftItems.map((item) => item.variant.productId))
      for (const productId of productIdsSet) {
        const { totalAmount, totalQuantity } = activeDraftItems
          .filter((item) => item.variant.productId === productId)
          .reduce(
            (acc, item) => {
              acc.totalAmount += item.variant.price * item.quantity
              acc.totalQuantity += item.quantity
              return acc
            },
            { totalAmount: 0, totalQuantity: 0 }
          )
        trackOrderBehavior({
          productId,
          quantity: totalQuantity,
          amount: totalAmount
        })
      }

      if (response.data.paymentUrl) {
        window.open(response.data.paymentUrl, '_blank')
      }

      toast.success('Đã tạo đơn giao hàng thành công!')
      handleCloseTab(activeTab.id)
      setShowDeliveryPaymentDialog(false)
      setOrderNote('')
      setCouponCode('')
      setSelectedPaymentMethod(PaymentMethod.COD)
    } catch (error) {
      handleError(error)
    } finally {
      setOrderCreating(false)
    }
  }

  const handleUpdateDeliveryOrder = async () => {
    if (!activeTab || !isActiveTabInEditingMode) return

    try {
      const orderId = activeTab.tableId as string
      showNotification('Thông báo', 'Đang cập nhật đơn hàng...', 'info')
      const draftCode = generateDraftCode(activeTab.tableId, activeTab.orderType, true)
      if (draftCode) {
        const response = await draftItemApis.findAll({
          draftCode
        })

        if (response?.data.data) {
          await Promise.all(response.data.data.map((item) => deleteDraftItemMutation.mutateAsync(item.id)))
        }

        setEditingDeliveryOrders((prev) => {
          const newState = { ...prev }
          delete newState[orderId]
          return newState
        })
        showNotification('Thành công', 'Đã cập nhật đơn hàng giao hàng!', 'success')
        handleCloseTab(activeTab.id)
      }
    } catch (error) {
      handleError(error)
    }
  }

  const handlePayment = () => {
    setPayments([])
    setPaymentAmount('')
    setCurrentPaymentMethod(PaymentMethod.Cash)
    setIsProcessingPayment(false)
    setShowPaymentDialog(true)
  }

  const getTotalAmount = () => {
    if (!activeTab) return 0
    const currentItems = getTabItems(activeTab)
    return currentItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getPaidAmount = () => {
    return payments.reduce((total, payment) => total + payment.amount, 0)
  }

  const getRemainingAmount = () => {
    return getTotalAmount() - getPaidAmount()
  }

  const addPayment = async () => {
    const amount = parseFloat(paymentAmount)
    if (amount <= 0 || amount > getRemainingAmount()) return

    setIsProcessingPayment(true)

    try {
      if (currentPaymentMethod === PaymentMethod.Cash) {
        setPayments((prev) => [...prev, { method: currentPaymentMethod, amount }])
        setPaymentAmount('')
      } else {
        if (!activeTab) return

        const draftCode = generateDraftCode(activeTab.tableId, activeTab.orderType)
        if (!draftCode) return

        const serverPaymentMethod =
          currentPaymentMethod === PaymentMethod.COD
            ? 'CASH'
            : currentPaymentMethod === PaymentMethod.MOMO
              ? 'MOMO'
              : currentPaymentMethod === PaymentMethod.VNPay
                ? 'VNPAY'
                : 'CASH'

        const response = await paymentApis.createDineInPayment({
          draftOrderId: draftCode,
          paymentMethod: serverPaymentMethod as 'CASH' | 'MOMO' | 'VNPAY',
          amount,
          customerPaid: currentPaymentMethod === PaymentMethod.COD ? amount : undefined
        })

        if (currentPaymentMethod === PaymentMethod.COD) {
          setPayments((prev) => [
            ...prev,
            {
              method: currentPaymentMethod,
              amount,
              paymentId: response.data?.data?.paymentId
            }
          ])
          setPaymentAmount('')

          const remainingAmount = response.data?.data?.remainingAmount || 0
          if (remainingAmount > 0) {
            showNotification(
              'Thành công',
              `Đã thanh toán ${amount.toLocaleString()}đ. Còn lại ${remainingAmount.toLocaleString()}đ`,
              'success'
            )
          } else {
            showNotification('Thành công', 'Đã thanh toán đủ!', 'success')
          }
        } else {
          showNotification('Đang xử lý', 'Đang tạo link thanh toán online...', 'info')
        }
      }
    } catch (error) {
      handleError(error)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const removePayment = (index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index))
  }

  const vietnameseCurrencyValues = [10000, 20000, 50000, 100000, 200000, 500000, 1000000]

  const handlePaymentComplete = async () => {
    if (getRemainingAmount() > 0) return
    if (!activeTab) return

    setIsProcessingPayment(true)

    try {
      const draftCode = generateDraftCode(activeTab.tableId, activeTab.orderType)
      if (!draftCode) {
        throw new Error('Không thể tạo mã draft cho bàn này')
      }

      const response = await paymentApis.completeDineInOrder({
        draftOrderId: draftCode,
        tableNumber: activeTab.tableId as number
      })
      const currentItems = getTabItems(activeTab)
      const receiptItems = currentItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      }))
      const receiptPayments = payments.map((payment) => ({
        method: payment.method,
        amount: payment.amount,
        paymentId: (payment as any).paymentId
      }))
      const subtotal = receiptItems.reduce((sum, item) => sum + item.total, 0)

      setReceiptData({
        orderNumber: response.data?.data?.orderId || Math.floor(Math.random() * 10000),
        items: receiptItems,
        payments: receiptPayments,
        subtotal,
        total: subtotal,
        tableNumber: activeTab.tableId as number,
        orderDate: new Date()
      })

      showNotification('Thành công', 'Thanh toán thành công và đã tạo đơn hàng!', 'success')
      setShowPaymentDialog(false)
      setPayments([])
      setPaymentAmount('')
      setOrderNote('')
      setShowReceipt(true)
      handleCloseTab(activeTab.id)
    } catch (error) {
      handleError(error)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleSaveTemporary = () => {
    console.log('Save temporary order')
  }

  const getAvailableTablesForCombining = () => {
    const mainTableId = activeTab?.orderType === OrderType.DineIn ? activeTab.tableId : null
    return tables.filter((table) => {
      const isAvailable = table.status === TableStatus.Available
      const notMainTable = table.id !== mainTableId
      const isReserved =
        table.status === TableStatus.Reserved &&
        table.reservations.some(
          (res) => res.status === ReservationStatus.Arrived || addHours(new Date(), -2) < new Date(res.reservationTime)
        )

      return isAvailable && notMainTable && !isReserved
    })
  }

  const getSelectedTableIds = () => {
    if (!activeTabId || !activeTab || activeTab.orderType !== OrderType.DineIn) {
      return []
    }
    return tabSelectedTables[activeTabId] || []
  }

  const handleTableSelection = async (tableIds: number[]) => {
    if (!activeTabId || !activeTab || activeTab.orderType !== OrderType.DineIn) return

    try {
      setTabSelectedTables((prev) => ({
        ...prev,
        [activeTabId]: tableIds
      }))

      const allTableIds = [activeTab.tableId as number, ...tableIds.filter((id) => id !== activeTab.tableId)]

      for (const draftItem of activeDraftItems) {
        const originalDraftCode = draftItem.draftCode

        await updateDraftItemMutation.mutateAsync({
          draftItemId: draftItem.id,
          body: {
            draftCode: originalDraftCode,
            variantId: draftItem.variantId,
            quantity: draftItem.quantity,
            tableIds: allTableIds
          }
        })
      }
    } catch (error) {
      handleError(error)
    }
  }

  const getTabItemsCount = (tab: OrderTabType) => {
    const tabItems = getTabItems(tab)
    return tabItems.reduce((sum, item) => sum + item.quantity, 0)
  }
  const getTabItems = (tab: OrderTabType | undefined) => {
    if (!tab) return []

    if (isTabLoading && tab.id === activeTabId) return []

    if (tab.orderType === OrderType.DineIn) {
      if (
        tab.id === activeTabId ||
        (activeTab &&
          activeTab.orderType === OrderType.DineIn &&
          activeDraftItems.length > 0 &&
          activeDraftItems.some((draftItem) => draftItem.tables.some((table) => table.id === tab.tableId)))
      ) {
        return activeTabItems
      }
      return []
    } else if (tab.orderType === OrderType.Takeaway || tab.orderType === OrderType.Delivery) {
      return tab.id === activeTabId ? activeTabItems : []
    }
    return []
  }

  const selectedTableInfo = tables.find((table) => table.id === selectedTable)
  const handleBackToTables = () => {
    setCurrentView('tables')
    setSelectedTable(null)
    setActiveTabId(null)
  }

  return (
    <div className='flex h-screen bg-gray-50 overflow-hidden' ref={containerRef}>
      <div className='p-6 bg-white' style={{ width: `${leftPanelWidth}%` }}>
        <div>
          <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between gap-4'>
              <h1 className='text-2xl font-bold text-gray-900'>
                {currentView === 'tables' ? 'Danh Sách Bàn' : 'Thực đơn'}
                {selectedTableInfo && <span className='text-gray-500 ml-2'>#{selectedTableInfo.code}</span>}
              </h1>
              {currentView === 'menu' && (
                <Button variant='outline' onClick={handleBackToTables}>
                  ← Quay lại danh sách bàn
                </Button>
              )}
            </div>

            {currentView === 'tables' ? (
              <div className='flex items-center gap-4 mb-4'>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    const params = new URLSearchParams(window.location.search)
                    if (value && value !== 'All') {
                      params.set('status', value)
                    } else {
                      params.delete('status')
                    }
                    params.delete('page')
                    navigate(`/employee/orders?${params.toString()}`)
                  }}
                >
                  <SelectTrigger className='w-36'>
                    <Grid2x2Check className='w-4 h-4 mr-2' />
                    <span>{formatTableStatusText(statusFilter) || 'Trạng thái'}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='All'>Tất cả</SelectItem>
                    {TableStatusValues.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatTableStatusText(status)}
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
                    navigate(`/employee/orders?${params.toString()}`)
                  }}
                >
                  <SelectTrigger className='w-36'>
                    <MapPin className='w-4 h-4 mr-2' />
                    <span>{formatTableLocationText(locationFilter) || 'Vị trí'}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='All'>Tất cả</SelectItem>
                    {TableLocationValues.map((location) => (
                      <SelectItem key={location} value={location}>
                        {formatTableLocationText(location)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className='flex gap-3 mb-4 px-1'>
                  <div className='flex-1 relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                    <Input
                      placeholder='Tìm kiếm sản phẩm...'
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                  <Select
                    value={categoryFilter}
                    onValueChange={(value) => {
                      const params = new URLSearchParams(window.location.search)
                      if (value && value !== 'All') {
                        params.set('category', value)
                      } else {
                        params.delete('category')
                      }
                      params.delete('page')
                      navigate(`/employee/orders?${params.toString()}`)
                    }}
                  >
                    <SelectTrigger className='w-48'>
                      <SelectValue placeholder='Chọn loại sản phẩm' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='All'>Tất cả</SelectItem>
                      {parentCategories.map((category: CategoryType) => (
                        <SelectItem key={category.id} value={generateNameId({ id: category.id, name: category.name })}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>

        <ScrollArea className='h-[calc(100vh-120px)]'>
          {currentView === 'tables' ? (
            <Suspense fallback={<LoadingSpinner text='Đang tải danh sách bàn...' />}>
              <TableList
                tables={filteredTables}
                orderTabs={orderTabs}
                leftPanelWidth={leftPanelWidth}
                onTableSelect={handleTableSelect}
                onCreateTakeawayOrder={onCreateTakeawayOrder}
                onLoadDraftItems={handleLoadDraftItems}
                onCreateDeliveryOrder={onCreateDeliveryOrder}
                onLoadDeliveryDraftItems={handleLoadDeliveryDraftItems}
                onDeleteDraftItems={handleDeleteDraftItems}
              />
            </Suspense>
          ) : (
            <Suspense fallback={<LoadingSpinner text='Đang tải thực đơn...' />}>
              <ProductList
                availableProducts={availableProducts}
                leftPanelWidth={leftPanelWidth}
                onAddToOrder={addToOrder}
              />
            </Suspense>
          )}
        </ScrollArea>
      </div>

      <div
        className='w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize flex items-center justify-center group transition-colors'
        onMouseDown={handleMouseDown}
      >
        <div className='opacity-0 group-hover:opacity-100 transition-opacity'>
          <GripVertical className='w-4 h-4 text-gray-600' />
        </div>
      </div>

      <div className='bg-white border-l border-gray-200 flex flex-col' style={{ width: `${100 - leftPanelWidth}%` }}>
        <div className='bg-gray-100 border-b border-gray-200'>
          <div
            ref={tabsContainerRef}
            className={`flex items-end overflow-x-auto scrollbar-hide ${isScrolling ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
            onMouseDown={handleTabMouseDown}
            onMouseLeave={handleTabMouseLeave}
          >
            {orderTabs.map((tab) => (
              <div
                key={tab.id}
                className={`border-l relative flex items-center px-3 py-2 cursor-pointer transition-all gap-1 flex-shrink-0 min-w-0 ${
                  tab.id === activeTabId
                    ? 'bg-white -mb-px z-10'
                    : 'bg-gray-50 hover:bg-gray-100 border-b border-gray-200'
                }`}
                onClick={() => {
                  if (!isScrolling) switchTab(tab.id)
                }}
              >
                <span className='text-sm font-medium mr-2 max-w-24 truncate'>{tab.tableName}</span>
                {(() => {
                  const itemsCount = getTabItemsCount(tab)
                  return itemsCount > 0 ? (
                    <Badge variant='secondary' className='text-xs px-2 py-0 flex-shrink-0'>
                      {itemsCount}
                    </Badge>
                  ) : null
                })()}
                <Button
                  size='sm'
                  variant='ghost'
                  className='h-4 w-4 p-0 hover:bg-red-100 flex-shrink-0'
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(tab.id)
                  }}
                >
                  <X className='w-3 h-3' />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Suspense fallback={<LoadingSpinner text='Đang tải đơn hàng...' />}>
          <LazyOrderTab
            activeTab={getActiveTab()}
            selectedTableInfo={selectedTableInfo}
            tabItems={getTabItems(getActiveTab())}
            availableTables={getAvailableTablesForCombining()}
            selectedTableIds={getSelectedTableIds()}
            isLoading={isTabLoading}
            onUpdateQuantity={updateQuantity}
            onTableSelect={handleTableSelection}
            onConfirmOrder={handleConfirmOrder}
            onSaveTemporary={handleSaveTemporary}
            onPayment={handlePayment}
          />
        </Suspense>
      </div>
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent className='max-w-4xl max-h-[80vh]'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>Đơn Hàng Giao Hàng</DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='border-b pb-4'>
              <Button
                onClick={() => createDeliveryOrder()}
                className='w-full bg-green-600 hover:bg-green-700'
                size='lg'
              >
                <Plus className='w-4 h-4 mr-2' />
                Tạo Đơn Giao Hàng Mới
              </Button>
            </div>

            <div>
              <h3 className='font-semibold mb-3 text-gray-700'>Đơn hàng trực tuyến</h3>
              <ScrollArea className='h-[400px]'>
                <div className='space-y-3'>
                  {deliveryOrders.map((order) => (
                    <Card key={order.id} className='cursor-pointer hover:shadow-md transition-all'>
                      <CardContent className='p-4'>
                        <div className='flex justify-between items-start mb-3'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-1'>
                              <span className='font-semibold text-lg'>#{order.id}</span>
                              <Badge className={formatOrderStatusColor({ status: order.status })}>
                                {formatOrderStatusText(order.status)}
                              </Badge>
                            </div>
                            <div className='text-sm text-gray-600 mb-2'>
                              Đặt lúc: {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='font-bold text-lg text-orange-600'>
                              {order.finalAmount.toLocaleString('vi-VN')}đ
                            </div>
                          </div>
                        </div>

                        <div className='space-y-2 mb-3'>
                          <div className='flex items-center text-sm'>
                            <User className='w-4 h-4 mr-2 text-gray-500' />
                            <span className='font-medium'>{order.customerName}</span>
                          </div>
                          {order.user && (
                            <div className='flex items-center text-sm'>
                              <Phone className='w-4 h-4 mr-2 text-gray-500' />
                              <span>{order.user.phoneNumber}</span>
                            </div>
                          )}
                          {order.deliveryAddress && (
                            <div className='flex items-start text-sm'>
                              <MapPin className='w-4 h-4 mr-2 text-gray-500 mt-0.5' />
                              <span className='flex-1'>{order.deliveryAddress.detailAddress}</span>
                            </div>
                          )}
                        </div>

                        <div className='border-t pt-3'>
                          <div className='text-sm text-gray-600 mb-2'>Món đã đặt:</div>
                          <div className='space-y-1'>
                            {order.orderItems.map((item) => (
                              <div key={item.id} className='flex justify-between text-sm'>
                                <span>
                                  {item.productName} ({item.variantValue}) x{item.quantity}
                                </span>
                                <span className='font-medium'>
                                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className='flex gap-2 mt-4'>
                          <Button onClick={() => createDeliveryOrder(order.id.toString())} className='flex-1' size='sm'>
                            <Eye className='w-4 h-4 mr-2' />
                            Xem đơn hàng
                          </Button>
                          {order.status === OrderStatus.Pending && (
                            <Button
                              onClick={() => createDeliveryOrder(order.id.toString(), true)}
                              variant='outline'
                              className='flex-1'
                              size='sm'
                            >
                              <Edit className='w-4 h-4 mr-2' />
                              Sửa đơn hàng
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {deliveryOrders.length === 0 && (
                    <div className='text-center text-gray-500 py-8'>
                      <p>Không có đơn hàng giao hàng nào</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOrderConfirmDialog} onOpenChange={handleCloseOrderConfirmDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>Thanh toán đơn ăn tại chỗ</DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            {activeTab && (
              <div className='bg-gray-50 p-3 rounded-lg'>
                <div className='text-sm font-medium mb-2'>Thông tin đơn hàng:</div>
                <div className='space-y-1 text-sm'>
                  <div className='flex justify-between'>
                    <span>Bàn:</span>
                    <span>{activeTab.tableName}</span>
                  </div>
                  {tabSelectedTables[activeTab.id]?.length > 0 && (
                    <div className='flex justify-between'>
                      <span>Bàn ghép:</span>
                      <span>
                        {tabSelectedTables[activeTab.id]
                          .map((tableId) => {
                            const table = tables.find((t) => t.id === tableId)
                            return table?.code
                          })
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  <div className='flex justify-between'>
                    <span>Tổng số món:</span>
                    <span>{getTabItems(activeTab).reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  {(() => {
                    const currentItems = getTabItems(activeTab)
                    const totalAmount = currentItems.reduce((total, item) => total + item.price * item.quantity, 0)
                    const discountAmount = selectedCoupon
                      ? selectedCoupon.discountType === CouponDiscountType.Percent
                        ? totalAmount * (selectedCoupon.discountValue / 100)
                        : selectedCoupon.discountValue
                      : 0
                    const feeAmount = selectedCoupon
                      ? selectedCoupon.discountType === CouponDiscountType.Percent
                        ? 0 + OrderFee.TaxRate * discountAmount
                        : 0 + OrderFee.TaxRate * totalAmount
                      : 0 + OrderFee.TaxRate * totalAmount
                    const finalAmount = totalAmount + feeAmount - discountAmount

                    return (
                      <>
                        <div className='flex justify-between font-medium'>
                          <span>Tổng tiền:</span>
                          <span className='text-orange-600'>{formatCurrency(totalAmount)}</span>
                        </div>
                        <div className='flex justify-between font-medium'>
                          <span>Thuế VAT:</span>
                          <span className='text-orange-600'>10%</span>
                        </div>
                        {selectedCoupon && (
                          <div className='flex justify-between font-medium'>
                            <span>Giảm giá:</span>
                            <span className='text-orange-600'>
                              {selectedCoupon.code} (-{' '}
                              {selectedCoupon.discountType === CouponDiscountType.Percent
                                ? `${selectedCoupon.discountValue}%`
                                : formatCurrency(selectedCoupon.discountValue)}
                              )
                            </span>
                          </div>
                        )}
                        <div className='flex justify-between font-medium'>
                          <span>Thanh toán:</span>
                          <span className='text-orange-600'>{formatCurrency(finalAmount < 0 ? 0 : finalAmount)}</span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor='couponCode'>Mã giảm giá</Label>
              <div className='flex mt-2'>
                <Input
                  className='flex-1'
                  placeholder='Mã giảm giá...'
                  onChange={(e) => {
                    const value = e.target.value
                    setCouponCode(value)
                  }}
                />
                <Button variant='outline' onClick={handleSelectedCoupon}>
                  Áp dụng
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor='paymentMethod'>Phương thức thanh toán</Label>
              <Select
                onValueChange={(value) => setSelectedPaymentMethod(value as PaymentMethodType)}
                defaultValue={PaymentMethod.Cash}
              >
                <SelectTrigger className='mt-1 w-[50%]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentMethod.Cash}>Tiền mặt</SelectItem>
                  <SelectItem value={PaymentMethod.VNPay}>VNPay</SelectItem>
                  <SelectItem value={PaymentMethod.MOMO}>MOMO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='orderNote'>Ghi chú</Label>
              <Textarea
                id='orderNote'
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder='Ghi chú thêm cho đơn hàng (tùy chọn)'
                rows={3}
                className='mt-1'
              />
            </div>

            <div className='flex gap-3'>
              <Button
                onClick={() => setShowOrderConfirmDialog(false)}
                variant='outline'
                className='flex-1'
                disabled={orderCreating}
              >
                Hủy
              </Button>
              <Button onClick={handleCreateDineInOrder} className='flex-1' disabled={orderCreating}>
                {orderCreating ? 'Đang tạo...' : 'Xác nhận thanh toán'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={handleClosePaymentDialog}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Thanh toán đơn hàng</DialogTitle>
          </DialogHeader>
          <div className='space-y-6'>
            <div className='bg-gray-50 p-4 rounded-lg'>
              <h3 className='font-medium mb-2'>Thông tin đơn hàng</h3>
              <div className='flex justify-between text-sm'>
                <span>Tổng tiền:</span>
                <span className='font-bold text-lg'>{getTotalAmount().toLocaleString('vi-VN')}₫</span>
              </div>
              <div className='flex justify-between text-sm text-green-600'>
                <span>Đã thanh toán:</span>
                <span>{getPaidAmount().toLocaleString('vi-VN')}₫</span>
              </div>
              <div className='flex justify-between text-sm text-red-600 font-medium'>
                <span>Còn lại:</span>
                <span>{getRemainingAmount().toLocaleString('vi-VN')}₫</span>
              </div>
            </div>

            {payments.length > 0 && (
              <div className='space-y-2'>
                <h3 className='font-medium'>Lịch sử thanh toán</h3>
                {payments.map((payment, index) => (
                  <div key={index} className='flex items-center justify-between p-2 bg-gray-50 rounded'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        <CreditCard className='w-4 h-4' />
                        <span className='text-sm'>{payment.method}</span>
                        <span className='text-sm font-medium'>{payment.amount.toLocaleString('vi-VN')}₫</span>
                      </div>
                      {payment.paymentUrl && (
                        <div className='text-xs text-blue-600 mt-1'>
                          <a
                            href={payment.paymentUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='hover:underline'
                          >
                            🔗 Xem link thanh toán
                          </a>
                        </div>
                      )}
                    </div>
                    <Button size='sm' variant='outline' onClick={() => removePayment(index)} className='h-6 w-6 p-0'>
                      <Trash2 className='w-3 h-3' />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {getRemainingAmount() > 0 && (
              <div className='space-y-4'>
                <h3 className='font-medium'>Thêm thanh toán</h3>
                <div className='flex gap-4'>
                  <Select
                    value={currentPaymentMethod}
                    onValueChange={(value) => setCurrentPaymentMethod(value as PaymentMethodType)}
                  >
                    <SelectTrigger className='w-40'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PaymentMethodValues.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className='flex-1'>
                    <Input
                      type='number'
                      placeholder='Nhập số tiền'
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      max={getRemainingAmount()}
                    />
                  </div>
                  <Button
                    onClick={addPayment}
                    disabled={
                      !paymentAmount ||
                      parseFloat(paymentAmount) <= 0 ||
                      parseFloat(paymentAmount) > getRemainingAmount() ||
                      isProcessingPayment
                    }
                  >
                    {isProcessingPayment ? 'Đang xử lý...' : 'Thêm'}
                  </Button>
                </div>

                <div className='space-y-2'>
                  <Label className='text-sm text-gray-600'>Mệnh giá tiền Việt:</Label>
                  <div className='flex flex-wrap gap-2'>
                    {vietnameseCurrencyValues.map((value) => (
                      <Button
                        key={value}
                        size='sm'
                        variant='outline'
                        onClick={() => {
                          const currentAmount = parseFloat(paymentAmount) || 0
                          const newAmount = Math.min(currentAmount + value, getRemainingAmount())
                          setPaymentAmount(newAmount.toString())
                        }}
                        disabled={value > getRemainingAmount()}
                      >
                        {value.toLocaleString('vi-VN')}₫
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className='flex gap-2'>
              <Button onClick={handleClosePaymentDialog} variant='outline' className='flex-1'>
                Hủy
              </Button>
              {getRemainingAmount() <= 0 ? (
                <Button
                  onClick={handlePaymentComplete}
                  className='flex-1 bg-green-600 hover:bg-green-700'
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? 'Đang xử lý...' : 'Hoàn tất thanh toán'}
                </Button>
              ) : (
                <Button onClick={() => setShowPaymentDialog(false)} className='flex-1' disabled>
                  Chưa đủ tiền ({getRemainingAmount().toLocaleString('vi-VN')}₫)
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Hóa đơn thanh toán</DialogTitle>
          </DialogHeader>
          {receiptData && (
            <Suspense fallback={<LoadingSpinner text='Đang tải hóa đơn...' />}>
              {/* <LazyReceipt
                order={receiptData.orderNumber}
                items={receiptData.items}
                payments={receiptData.payments}
                subtotal={receiptData.subtotal}
                total={receiptData.total}
                tableNumber={receiptData.tableNumber}
                orderDate={receiptData.orderDate}
                onPrint={() => {
                  setShowReceipt(false)
                  setReceiptData(null)
                }}
              /> */}
            </Suspense>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showTakeawayPaymentDialog} onOpenChange={handleCloseTakeawayPaymentDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>Thanh toán đơn mang đi</DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            {activeTab && (
              <div className='bg-gray-50 p-3 rounded-lg'>
                <div className='text-sm font-medium mb-2'>Thông tin đơn hàng:</div>
                <div className='space-y-1 text-sm'>
                  <div className='flex justify-between'>
                    <span>Mã:</span>
                    <span>{activeTab.tableName}</span>
                  </div>
                  {tabSelectedTables[activeTab.id]?.length > 0 && (
                    <div className='flex justify-between'>
                      <span>Bàn ghép:</span>
                      <span>
                        {tabSelectedTables[activeTab.id]
                          .map((tableId) => {
                            const table = tables.find((t) => t.id === tableId)
                            return table?.code
                          })
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  <div className='flex justify-between'>
                    <span>Tổng số món:</span>
                    <span>{getTabItems(activeTab).reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  {(() => {
                    const currentItems = getTabItems(activeTab)
                    const totalAmount = currentItems.reduce((total, item) => total + item.price * item.quantity, 0)
                    const discountAmount = selectedCoupon
                      ? selectedCoupon.discountType === CouponDiscountType.Percent
                        ? totalAmount * (selectedCoupon.discountValue / 100)
                        : selectedCoupon.discountValue
                      : 0
                    const feeAmount = selectedCoupon
                      ? selectedCoupon.discountType === CouponDiscountType.Percent
                        ? 0 + OrderFee.TaxRate * discountAmount
                        : 0 + OrderFee.TaxRate * totalAmount
                      : 0 + OrderFee.TaxRate * totalAmount
                    const finalAmount = totalAmount + feeAmount - discountAmount

                    return (
                      <>
                        <div className='flex justify-between font-medium'>
                          <span>Tổng tiền:</span>
                          <span className='text-orange-600'>{formatCurrency(totalAmount)}</span>
                        </div>
                        <div className='flex justify-between font-medium'>
                          <span>Thuế VAT:</span>
                          <span className='text-orange-600'>10%</span>
                        </div>
                        {selectedCoupon && (
                          <div className='flex justify-between font-medium'>
                            <span>Giảm giá:</span>
                            <span className='text-orange-600'>
                              {selectedCoupon.code} (-{' '}
                              {selectedCoupon.discountType === CouponDiscountType.Percent
                                ? `${selectedCoupon.discountValue}%`
                                : formatCurrency(selectedCoupon.discountValue)}
                              )
                            </span>
                          </div>
                        )}
                        <div className='flex justify-between font-medium'>
                          <span>Thanh toán:</span>
                          <span className='text-orange-600'>{formatCurrency(finalAmount < 0 ? 0 : finalAmount)}</span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor='couponCode'>Mã giảm giá</Label>
              <div className='flex mt-2'>
                <Input
                  className='flex-1'
                  placeholder='Mã giảm giá...'
                  onChange={(e) => {
                    const value = e.target.value
                    setCouponCode(value)
                  }}
                />
                <Button variant='outline' onClick={handleSelectedCoupon}>
                  Áp dụng
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor='paymentMethod'>Phương thức thanh toán</Label>
              <Select
                defaultValue={PaymentMethod.Cash}
                onValueChange={(value) => setSelectedPaymentMethod(value as PaymentMethodType)}
              >
                <SelectTrigger className='mt-1 w-[50%]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentMethod.Cash}>Tiền mặt</SelectItem>
                  <SelectItem value={PaymentMethod.VNPay}>VNPay</SelectItem>
                  <SelectItem value={PaymentMethod.MOMO}>MOMO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='orderNote'>Ghi chú</Label>
              <Textarea
                id='orderNote'
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder='Ghi chú thêm cho đơn hàng (tùy chọn)'
                rows={3}
                className='mt-1'
              />
            </div>

            <div className='flex gap-3'>
              <Button
                onClick={() => setShowOrderConfirmDialog(false)}
                variant='outline'
                className='flex-1'
                disabled={orderCreating}
              >
                Hủy
              </Button>
              <Button onClick={handleCreateTakeawayOrder} className='flex-1' disabled={orderCreating}>
                {orderCreating ? 'Đang tạo...' : 'Xác nhận thanh toán'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeliveryPaymentDialog} onOpenChange={handleCloseDeliveryPaymentDialog}>
        <DialogContent className='min-w-250 max-w-6xl max-h-[95vh]'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>Thanh toán đơn giao hàng</DialogTitle>
          </DialogHeader>

          <div className='flex flex-col lg:flex-row gap-6 max-h-[95vh] w-full'>
            <div className='flex flex-col min-h-0 lg:flex-1'>
              <ScrollArea className='flex-1 max-h-[60vh] lg:max-h-[80vh]'>
                <div className='space-y-4 overflow-y-auto pr-2'>
                  <Form {...addressForm}>
                    <form
                      noValidate
                      className='grid auto-rows-max items-start gap-4 md:gap-8 z-50'
                      id='add-delivery-order-form'
                      onSubmit={addressForm.handleSubmit(handleCreateDeliveryOrder, (error) => {
                        console.log(error)
                      })}
                    >
                      <div className='grid gap-4 py-4'>
                        <FormField
                          control={addressForm.control}
                          name='recipientName'
                          render={({ field }) => (
                            <FormItem>
                              <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                                <Label htmlFor='recipientName'>Tên người nhận</Label>
                                <div className='col-span-3 w-full space-y-2'>
                                  <Input id='recipientName' className='w-full' {...field} />
                                  <FormMessage />
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addressForm.control}
                          name='recipientPhone'
                          render={({ field }) => (
                            <FormItem>
                              <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                                <Label htmlFor='recipientPhone'>Số điện thoại</Label>
                                <div className='col-span-3 w-full space-y-2'>
                                  <Input id='recipientPhone' className='w-full' {...field} />
                                  <FormMessage />
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addressForm.control}
                          name='provinceId'
                          render={({ field }) => (
                            <FormItem>
                              <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                                <Label htmlFor='provinceId'>Tỉnh/Thành phố</Label>
                                <div className='col-span-3 w-full space-y-2'>
                                  <Select
                                    onValueChange={(value) => {
                                      field.onChange(Number(value))
                                    }}
                                    value={field.value ? field.value.toString() : undefined}
                                  >
                                    <FormControl id='provinceId'>
                                      <SelectTrigger className='w-full'>
                                        <SelectValue placeholder='Chọn tỉnh/thành phố' />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {provinces.map((province) => (
                                        <SelectItem key={province.id} value={province.id.toString()}>
                                          {province.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addressForm.control}
                          name='districtId'
                          render={({ field }) => (
                            <FormItem>
                              <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                                <Label htmlFor='districtId'>Quận/Huyện</Label>
                                <div className='col-span-3 w-full space-y-2'>
                                  <Select
                                    onValueChange={(value) => {
                                      field.onChange(Number(value))
                                    }}
                                    value={field.value ? field.value.toString() : undefined}
                                    disabled={!selectedProvinceId || provinceDetailQuery.isPending}
                                  >
                                    <FormControl id='districtId'>
                                      <SelectTrigger className='w-full'>
                                        <SelectValue
                                          placeholder={
                                            !selectedProvinceId
                                              ? 'Vui lòng chọn tỉnh/thành phố trước'
                                              : provinceDetailQuery.isPending
                                                ? 'Đang tải dữ liệu...'
                                                : 'Chọn quận/huyện'
                                          }
                                        />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {districts.map((district) => (
                                        <SelectItem key={district.id} value={district.id.toString()}>
                                          {district.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addressForm.control}
                          name='wardId'
                          render={({ field }) => (
                            <FormItem>
                              <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                                <Label htmlFor='wardId'>Phường/Xã</Label>
                                <div className='col-span-3 w-full space-y-2'>
                                  <Select
                                    onValueChange={(value) => {
                                      field.onChange(Number(value))
                                    }}
                                    value={field.value ? field.value.toString() : undefined}
                                    disabled={!selectedDistrictId || districtDetailQuery.isPending}
                                  >
                                    <FormControl id='wardId'>
                                      <SelectTrigger className='w-full'>
                                        <SelectValue
                                          placeholder={
                                            !selectedDistrictId
                                              ? 'Vui lòng chọn quận/huyện trước'
                                              : districtDetailQuery.isPending
                                                ? 'Đang tải dữ liệu...'
                                                : 'Chọn phường/xã'
                                          }
                                        />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {wards.map((ward) => (
                                        <SelectItem key={ward.id} value={ward.id.toString()}>
                                          {ward.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addressForm.control}
                          name='detailAddress'
                          render={({ field }) => (
                            <FormItem>
                              <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                                <Label htmlFor='detailAddress'>Chi tiết địa chỉ</Label>
                                <div className='col-span-3 w-full space-y-2'>
                                  <Input id='detailAddress' className='w-full' {...field} />
                                  <FormMessage />
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addressForm.control}
                          name='deliveryNote'
                          render={({ field }) => (
                            <FormItem>
                              <div className='grid grid-cols-4 items-center justify-items-start gap-4'>
                                <Label htmlFor='deliveryNote'>Ghi chú</Label>
                                <div className='col-span-3 w-full space-y-2'>
                                  <Textarea id='deliveryNote' className='w-full' {...field} />
                                  <FormMessage />
                                </div>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </form>
                  </Form>
                </div>
              </ScrollArea>
            </div>

            <div className='flex flex-col space-y-4 min-h-0 lg:flex-1 max-h-[60vh] lg:max-h-[80vh] overflow-y-auto pr-2'>
              <div className='space-y-4'>
                {activeTab && (
                  <div className='bg-gray-50 p-3 rounded-lg'>
                    <div className='text-sm font-medium mb-2'>Thông tin đơn hàng:</div>
                    <div className='space-y-1 text-sm'>
                      <div className='flex justify-between'>
                        <span>Bàn:</span>
                        <span>{activeTab.tableName}</span>
                      </div>
                      {tabSelectedTables[activeTab.id]?.length > 0 && (
                        <div className='flex justify-between'>
                          <span>Bàn ghép:</span>
                          <span>
                            {tabSelectedTables[activeTab.id]
                              .map((tableId) => {
                                const table = tables.find((t) => t.id === tableId)
                                return table?.code
                              })
                              .join(', ')}
                          </span>
                        </div>
                      )}
                      <div className='flex justify-between'>
                        <span>Tổng số món:</span>
                        <span>{getTabItems(activeTab).reduce((sum, item) => sum + item.quantity, 0)}</span>
                      </div>
                      {(() => {
                        const currentItems = getTabItems(activeTab)
                        const totalAmount = currentItems.reduce((total, item) => total + item.price * item.quantity, 0)
                        const discountAmount = selectedCoupon
                          ? selectedCoupon.discountType === CouponDiscountType.Percent
                            ? totalAmount * (selectedCoupon.discountValue / 100)
                            : selectedCoupon.discountValue
                          : 0
                        const feeAmount = selectedCoupon
                          ? selectedCoupon.discountType === CouponDiscountType.Percent
                            ? 0 + OrderFee.TaxRate * discountAmount
                            : 0 + OrderFee.TaxRate * totalAmount
                          : 0 + OrderFee.TaxRate * totalAmount
                        const finalAmount = totalAmount + feeAmount - discountAmount

                        return (
                          <>
                            <div className='flex justify-between font-medium'>
                              <span>Tổng tiền:</span>
                              <span className='text-orange-600'>{formatCurrency(totalAmount)}</span>
                            </div>
                            <div className='flex justify-between font-medium'>
                              <span>Thuế VAT:</span>
                              <span className='text-orange-600'>10%</span>
                            </div>
                            {selectedCoupon && (
                              <div className='flex justify-between font-medium'>
                                <span>Giảm giá:</span>
                                <span className='text-orange-600'>
                                  {selectedCoupon.code} (-{' '}
                                  {selectedCoupon.discountType === CouponDiscountType.Percent
                                    ? `${selectedCoupon.discountValue}%`
                                    : formatCurrency(selectedCoupon.discountValue)}
                                  )
                                </span>
                              </div>
                            )}
                            <div className='flex justify-between font-medium'>
                              <span>Thanh toán:</span>
                              <span className='text-orange-600'>
                                {formatCurrency(finalAmount < 0 ? 0 : finalAmount)}
                              </span>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor='couponCode'>Mã giảm giá</Label>
                  <div className='flex mt-2'>
                    <Input
                      className='flex-1'
                      placeholder='Mã giảm giá...'
                      onChange={(e) => {
                        const value = e.target.value
                        setCouponCode(value)
                      }}
                    />
                    <Button variant='outline' onClick={handleSelectedCoupon}>
                      Áp dụng
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor='paymentMethod'>Phương thức thanh toán</Label>
                  <Select
                    defaultValue={PaymentMethod.COD}
                    onValueChange={(value) => setSelectedPaymentMethod(value as PaymentMethodType)}
                  >
                    <SelectTrigger className='mt-1 w-[50%]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PaymentMethod.COD}>Khi nhận hàng</SelectItem>
                      <SelectItem value={PaymentMethod.VNPay}>VNPay</SelectItem>
                      <SelectItem value={PaymentMethod.MOMO}>MOMO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor='orderNote'>Ghi chú</Label>
                  <Textarea
                    id='orderNote'
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder='Ghi chú thêm cho đơn hàng (tùy chọn)'
                    rows={3}
                    className='mt-1'
                  />
                </div>

                <div className='flex gap-3'>
                  <Button
                    onClick={() => setShowOrderConfirmDialog(false)}
                    variant='outline'
                    className='flex-1'
                    disabled={orderCreating}
                  >
                    Hủy
                  </Button>
                  <Button form='add-delivery-order-form' className='flex-1' disabled={orderCreating}>
                    {orderCreating ? 'Đang tạo...' : 'Xác nhận thanh toán'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
