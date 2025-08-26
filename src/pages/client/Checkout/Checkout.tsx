import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { MapPinCheck, Trash2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useLocation, useNavigate } from 'react-router'
import type { CartItemDetailType } from '@/schemaValidations/cart.schema'
import Config from '@/constants/config'
import { handleError, parseVariantInfo } from '@/lib/utils'
import QuantityController from '@/components/QuantityController'
import { Separator } from '@/components/ui/separator'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CreateAddressBodySchema,
  type AddressType,
  type CreateAddressBodyType
} from '@/schemaValidations/address.schema'
import {
  useAllAddressesQuery,
  useChangeAddressDefaultMutation,
  useCreateAddressMutation,
  useDeleteAddressMutation,
  useUpdateAddressMutation
} from '@/queries/useAddress'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { useProvinceDetailQuery, useDistrictDetailQuery, useAllProvincesQuery } from '@/queries/useLocation'
import { toast } from 'sonner'
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
import { PaymentMethod, type PaymentMethodType } from '@/constants/payment'
import { useAllCouponsQuery } from '@/queries/useCoupon'
import type { CouponType } from '@/schemaValidations/coupon.schema'
import { OrderFee } from '@/constants/order'
import { CouponDiscountType } from '@/constants/coupon'
import { useCreateOnlineOrderMutation } from '@/queries/useOrder'
import type { CreateOnlineOrderBodyType } from '@/schemaValidations/order.schema'
import { TypeProduct } from '@/constants/product'
import { formatCurrency } from '@/lib/format'

export default function Checkout() {
  const location = useLocation()
  const navigate = useNavigate()
  const cartItems = location.state?.cartItems || []
  const [orderItems, setOrderItems] = useState<CartItemDetailType[]>(cartItems)

  const [couponCode, setCouponCode] = useState<string>('')
  const [selectedCoupon, setSelectedCoupon] = useState<CouponType | null>(null)
  const [isCheckingCoupon, setIsCheckingCoupon] = useState<boolean>(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(PaymentMethod.COD)
  const [orderNote, setOrderNote] = useState<string>('')

  const [selectedAddressId, setSelectedAddressId] = useState<number>()
  const [showAddressForm, setShowAddressForm] = useState<boolean>(false)
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState<boolean>(false)
  const [addressDelete, setAddressDelete] = useState<AddressType | null>(null)

  const addressesQuery = useAllAddressesQuery()
  const addresses = addressesQuery.data?.data.data || []
  const [filteredAddresses, setFilteredAddresses] = useState(addresses)

  useEffect(() => {
    if (addressesQuery.data) {
      const defaultAddress = addressesQuery.data.data.data.find((address) => address.isDefault)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
      }
    }
  }, [addressesQuery.data])

  const form = useForm<CreateAddressBodyType>({
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

  const selectedProvinceId = form.watch('provinceId')
  const selectedDistrictId = form.watch('districtId')
  const provinceDetailQuery = useProvinceDetailQuery(selectedProvinceId || undefined)
  const districts = provinceDetailQuery.data?.data.districts || []
  const districtDetailQuery = useDistrictDetailQuery(selectedDistrictId || undefined)
  const wards = districtDetailQuery.data?.data.wards || []

  // Theo dõi sự thay đổi của tỉnh/thành phố
  useEffect(() => {
    if (selectedProvinceId === 0) {
      // Khi chọn giá trị mặc định (0) hoặc reset, đảm bảo các trường phụ thuộc cũng bị reset
      form.setValue('districtId', 0)
      form.setValue('wardId', 0)
    } else if (selectedProvinceId) {
      // Khi chọn một tỉnh/thành phố mới, reset các trường phụ thuộc
      form.setValue('districtId', 0)
      form.setValue('wardId', 0)
    }
  }, [selectedProvinceId, form])

  // Theo dõi sự thay đổi của quận/huyện
  useEffect(() => {
    if (selectedDistrictId === 0 || selectedDistrictId) {
      // Khi quận/huyện thay đổi (bao gồm cả reset), reset phường/xã
      form.setValue('wardId', 0)
    }
  }, [selectedDistrictId, form])

  const createAddressMutation = useCreateAddressMutation()
  const updateAddressMutation = useUpdateAddressMutation()
  const resetChange = (addressId: number) => {
    setShowAddressForm(false)
    setSelectedAddressId(addressId)
  }
  const onSubmit = async (data: CreateAddressBodyType) => {
    if (selectedAddressId === 0) {
      if (createAddressMutation.isPending) return
      const address = await createAddressMutation.mutateAsync(data)
      resetChange(address.data.id)
      toast.success('Địa chỉ đã được thêm thành công!')
    } else {
      if (updateAddressMutation.isPending) return
      const payload = {
        addressId: selectedAddressId as number,
        body: data
      }
      const address = await updateAddressMutation.mutateAsync(payload)
      resetChange(address.data.id)
      toast.success('Địa chỉ đã được cập nhật thành công!')
    }
  }

  const allCouponsQuery = useAllCouponsQuery()
  const coupons = allCouponsQuery.data?.data.data || []
  const removeCoupon = () => {
    setSelectedCoupon(null)
    toast.info('Đã hủy mã giảm giá')
  }

  const handleSelectedCoupon = async () => {
    setSelectedCoupon(null)
    setIsCheckingCoupon(true)

    try {
      // Check 1: Kiểm tra input rỗng
      if (!couponCode || couponCode.trim() === '') {
        toast.error('Vui lòng nhập mã giảm giá!')
        return
      }

      const trimmedCode = couponCode.trim()

      // Check 2: Tìm coupon theo code
      const coupon = coupons.find((coupon) => coupon.code.toLowerCase() === trimmedCode.toLowerCase())

      if (!coupon) {
        toast.error('Mã giảm giá không tồn tại!')
        return
      }

      // Check 3: Kiểm tra trạng thái active
      if (!coupon.isActive) {
        toast.error('Mã giảm giá đã bị vô hiệu hóa!')
        return
      }

      // Check 4: Kiểm tra thời gian hiệu lực (sử dụng expiresAt)
      if (coupon.expiresAt) {
        const now = new Date()
        const expiryDate = new Date(coupon.expiresAt)

        if (now > expiryDate) {
          toast.error(`Mã giảm giá đã hết hạn! Hết hiệu lực từ ${expiryDate.toLocaleDateString('vi-VN')}`)
          return
        }
      }

      // Check 5: Kiểm tra giá trị đơn hàng tối thiểu (sử dụng minOrderAmount)
      if (coupon.minOrderAmount && totalAmount < coupon.minOrderAmount) {
        toast.error(`Đơn hàng phải có giá trị tối thiểu ${formatCurrency(coupon.minOrderAmount)} để sử dụng mã này!`)
        return
      }

      // Check 6: Kiểm tra còn lượt sử dụng
      if (coupon.usageLimit === 0) {
        toast.error('Mã giảm giá đã hết lượt sử dụng!')
        return
      }

      // Tất cả validation đã pass, áp dụng mã giảm giá
      setSelectedCoupon(coupon)

      const discountText =
        coupon.discountType === CouponDiscountType.Percent
          ? `${coupon.discountValue}%`
          : formatCurrency(coupon.discountValue)

      // Clear input khi thành công
      setCouponCode('')
      toast.success(`Mã giảm giá ${coupon.code} (${discountText}) đã được áp dụng thành công!`)
    } catch (error) {
      console.error('Error checking coupon:', error)
      toast.error('Có lỗi xảy ra khi kiểm tra mã giảm giá!')
    } finally {
      setIsCheckingCoupon(false)
    }
  }

  const deleteAddressMutation = useDeleteAddressMutation()
  const handleDeleteAddress = async (addressId: number) => {
    if (deleteAddressMutation.isPending) return
    try {
      await deleteAddressMutation.mutateAsync(addressId)
      setAddressDelete(null)
      if (selectedAddressId === addressId) {
        setSelectedAddressId(undefined)
      }
      setFilteredAddresses((prev) => prev.filter((address) => address.id !== addressId))
      toast.success('Địa chỉ đã được xóa thành công!')
    } catch (error) {
      handleError(error)
    }
  }

  const changeAddressDefaultMutation = useChangeAddressDefaultMutation()
  const handleChangeAddressDefault = async (address: AddressType) => {
    if (changeAddressDefaultMutation.isPending) return
    try {
      const payload = {
        addressId: address.id,
        body: {
          isDefault: address.isDefault
        }
      }
      if (address.isDefault) {
        await changeAddressDefaultMutation.mutateAsync(payload)
        setSelectedAddressId(undefined)
        setFilteredAddresses((prev) =>
          prev.map((addr) => ({
            ...addr,
            isDefault: false
          }))
        )
        toast.success(`Địa chỉ ${address.recipientName}/${address.recipientPhone} đã hủy làm mặc định!`)
        return
      }
      await changeAddressDefaultMutation.mutateAsync(payload)
      setSelectedAddressId(address.id)
      setFilteredAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr.id === address.id ? true : false
        }))
      )
      toast.success(`Địa chỉ ${address.recipientName}/${address.recipientPhone} đã được đặt làm mặc định!`)
    } catch (error) {
      handleError(error)
    }
  }

  const handleQuantityChange = (id: number, value: number) => {
    console.log('handleQuantityChange', id, value)
    setOrderItems((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          return { ...item, quantity: value }
        }
        return item
      })
    })
  }

  const removeItem = (id: number) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id))
  }

  const totalAmount = orderItems.reduce((total, cur) => total + cur.variant.price * cur.quantity, 0)
  const discountAmount = selectedCoupon
    ? selectedCoupon.discountType === CouponDiscountType.Percent
      ? totalAmount * (selectedCoupon.discountValue / 100)
      : selectedCoupon.discountValue
    : 0
  const feeAmount = selectedCoupon
    ? selectedCoupon.discountType === CouponDiscountType.Percent
      ? OrderFee.Delivery + OrderFee.TaxRate * discountAmount
      : OrderFee.Delivery + OrderFee.TaxRate * totalAmount
    : OrderFee.Delivery + OrderFee.TaxRate * totalAmount
  const finalAmount = totalAmount + feeAmount - discountAmount

  const handleAddressSelect = (addressId: number) => {
    setSelectedAddressId(addressId)

    if (addressId === 0) {
      // Trường hợp chọn "Thêm địa chỉ mới"
      form.reset({
        recipientName: '',
        recipientPhone: '',
        provinceId: 0,
        districtId: 0,
        wardId: 0,
        detailAddress: '',
        deliveryNote: '',
        isDefault: false
      })
      setShowAddressForm(true)
    } else if (addressId) {
      // Trường hợp chọn địa chỉ có sẵn
      const selectedAddress = addresses.find((address) => address.id === addressId)
      if (selectedAddress) {
        // Đầu tiên reset form
        form.reset()

        const { recipientName, recipientPhone, provinceId, detailAddress, deliveryNote } = selectedAddress
        setTimeout(() => {
          form.setValue('recipientName', recipientName)
          form.setValue('recipientPhone', recipientPhone)
          form.setValue('provinceId', provinceId)
          form.setValue('detailAddress', detailAddress)
          form.setValue('deliveryNote', deliveryNote || '')

          // Cần chờ API lấy districts từ provinceId hoàn tất
          setTimeout(() => {
            form.setValue('districtId', selectedAddress.districtId)

            // Cần chờ API lấy wards từ districtId hoàn tất
            setTimeout(() => {
              form.setValue('wardId', selectedAddress.wardId)
            }, 300)
          }, 300)
        }, 0)

        setShowAddressForm(false)
      }
    } else {
      setShowAddressForm(false)
    }
  }

  const addressScrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (selectedAddressId && selectedAddressId !== 0 && addressScrollRef.current) {
      setTimeout(() => {
        addressScrollRef.current?.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      }, 100)
    }
  }, [selectedAddressId])

  const createOnlineOrderMutation = useCreateOnlineOrderMutation()
  const handleOrder = async () => {
    if (createOnlineOrderMutation.isPending) return
    if (selectedAddressId === undefined || selectedAddressId === 0) {
      toast.error('Vui lòng chọn địa chỉ giao hàng!')
      return
    }
    try {
      const body: CreateOnlineOrderBodyType = {
        paymentMethod,
        couponId: selectedCoupon ? selectedCoupon.id : null,
        deliveryAddressId: selectedAddressId,
        cartItems: orderItems,
        note: orderNote
      }
      const result = await createOnlineOrderMutation.mutateAsync(body)
      if (paymentMethod !== PaymentMethod.COD) {
        window.location.href = result.data.paymentUrl as string
      } else {
        navigate(`/payment-callback?status=${result.data.paymentStatus}&orderId=${result.data.orderId}`)
      }
    } catch (error) {
      handleError(error)
    }
  }

  if (cartItems.length === 0) {
    navigate('/cart', { replace: true })
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='text-xl font-semibold'>Danh sách địa chỉ giao hàng</CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-base font-medium ml-1'>Chọn địa chỉ giao hàng</Label>
                    <Dialog
                      open={isAddressDialogOpen}
                      onOpenChange={() => {
                        setIsAddressDialogOpen(!isAddressDialogOpen)
                        setFilteredAddresses(addresses)
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant='outline' size='sm' className='cursor-pointer mr-3'>
                          Tất cả
                        </Button>
                      </DialogTrigger>
                      <DialogContent className='min-w-2xl max-h-[550px]' aria-describedby={undefined}>
                        <DialogHeader className='grid grid-cols-3 items-center'>
                          <DialogTitle className='col-span-1'>Chọn địa chỉ giao hàng</DialogTitle>
                          <Input
                            className='col-span-2 w-[80%]'
                            placeholder='Tìm kiếm theo tên, số điện thoại...'
                            onChange={(v) => {
                              const searchTerm = v.target.value.toLowerCase()
                              const filtered = addresses.filter(
                                (address) =>
                                  address.recipientName.toLowerCase().includes(searchTerm) ||
                                  address.recipientPhone.toLowerCase().includes(searchTerm)
                              )
                              setFilteredAddresses(filtered)
                            }}
                          />
                        </DialogHeader>
                        <div className='max-h-[450px] overflow-y-auto space-y-3 pr-2'>
                          {filteredAddresses && filteredAddresses.length > 0 && (
                            <>
                              {filteredAddresses.map((address) => (
                                <div
                                  key={address.id}
                                  className={`flex items-center justify-between border rounded-lg p-4 cursor-pointer transition-all ${
                                    selectedAddressId === address.id
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div
                                    className='flex flex-1 items-start justify-between'
                                    onClick={() => {
                                      handleAddressSelect(address.id)
                                      setIsAddressDialogOpen(false)
                                      setFilteredAddresses(addresses)
                                    }}
                                  >
                                    <div className='flex items-center space-x-3'>
                                      <div
                                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                                          selectedAddressId === address.id
                                            ? 'border-blue-500 bg-blue-500'
                                            : 'border-gray-300'
                                        }`}
                                      >
                                        {selectedAddressId === address.id && (
                                          <div className='w-full h-full rounded-full bg-white scale-50'></div>
                                        )}
                                      </div>
                                      <div className='min-w-0 flex-1'>
                                        <div className='flex items-center space-x-2'>
                                          <span className='font-medium text-gray-900'>{address.recipientName}</span>
                                          <p className='font-medium text-gray-900'>{address.recipientPhone}</p>
                                          {selectedAddressId === address.id && (
                                            <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full'>
                                              Đã chọn
                                            </span>
                                          )}
                                        </div>
                                        <p className='text-sm text-gray-600 mt-1'>
                                          {address.detailAddress}, {address.ward.name && `${address.ward.name}, `}
                                          {address.district.name}, {address.province.name}
                                        </p>

                                        {address.deliveryNote && (
                                          <p className='text-xs text-gray-400 italic mt-1'>
                                            Ghi chú: {address.deliveryNote}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className=''>
                                    <Button
                                      variant='ghost'
                                      className='h-8 w-8 p-0'
                                      onClick={() => handleChangeAddressDefault(address)}
                                    >
                                      <MapPinCheck className='h-4 w-4' />
                                    </Button>
                                    <Button
                                      variant='ghost'
                                      className='h-8 w-8 p-0'
                                      onClick={() => setAddressDelete(address)}
                                    >
                                      <Trash2 className='h-4 w-4' />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </>
                          )}

                          <div
                            className={`border rounded-lg p-4 cursor-pointer transition-all border-dashed ${
                              selectedAddressId === 0
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            onClick={() => {
                              handleAddressSelect(0)
                              setIsAddressDialogOpen(false)
                            }}
                          >
                            <div className='flex items-center space-x-3'>
                              <div
                                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                                  selectedAddressId === 0 ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                }`}
                              >
                                {selectedAddressId === 0 && (
                                  <div className='w-full h-full rounded-full bg-white scale-50'></div>
                                )}
                              </div>
                              <div>
                                <span className='font-medium text-gray-900'>+ Thêm địa chỉ mới</span>
                                <p className='text-sm text-gray-500'>Nhập địa chỉ giao hàng mới</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div style={{ maxHeight: addresses.length <= 3 ? 'auto' : '340px' }} className='overflow-hidden'>
                    <ScrollArea className={addresses.length <= 3 ? '' : 'h-85'}>
                      <div className='pr-3 space-y-3' ref={addressScrollRef}>
                        {(() => {
                          const sortedAddresses = [...addresses].sort((a, b) => {
                            if (a.id === selectedAddressId) return -1
                            if (b.id === selectedAddressId) return 1
                            return 0
                          })

                          return sortedAddresses.map((address) => (
                            <div
                              key={address.id}
                              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                selectedAddressId === address.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => handleAddressSelect(address.id)}
                            >
                              <div className='flex items-start justify-between'>
                                <div className='flex items-center space-x-3'>
                                  <div
                                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                                      selectedAddressId === address.id
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-gray-300'
                                    }`}
                                  >
                                    {selectedAddressId === address.id && (
                                      <div className='w-full h-full rounded-full bg-white scale-50'></div>
                                    )}
                                  </div>
                                  <div className='min-w-0 flex-1'>
                                    <div className='flex items-center space-x-2'>
                                      <span className='font-medium text-gray-900 truncate'>
                                        {address.recipientName}
                                      </span>
                                      <p className='font-medium text-gray-900 truncate'>{address.recipientPhone}</p>
                                      {selectedAddressId === address.id && (
                                        <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full'>
                                          Đã chọn
                                        </span>
                                      )}
                                    </div>
                                    <p className='text-sm text-gray-600 mt-1 line-clamp-2'>
                                      {address.detailAddress}, {address.ward.name && `${address.ward.name}, `}
                                      {address.district.name}, {address.province.name}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        })()}
                      </div>
                    </ScrollArea>
                  </div>

                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all border-dashed ${
                      selectedAddressId === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handleAddressSelect(0)}
                  >
                    <div className='flex items-center space-x-3'>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                          selectedAddressId === 0 ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}
                      >
                        {selectedAddressId === 0 && (
                          <div className='w-full h-full rounded-full bg-white scale-50'></div>
                        )}
                      </div>
                      <div>
                        <span className='font-medium text-gray-900'>+ Thêm địa chỉ mới</span>
                        <p className='text-sm text-gray-500'>Nhập địa chỉ giao hàng mới</p>
                      </div>
                    </div>
                  </div>
                </div>

                {showAddressForm && (
                  <Form {...form}>
                    <form
                      noValidate
                      className='grid auto-rows-max items-start gap-4 md:gap-8 z-50'
                      id='add-edit-address-form'
                      onSubmit={form.handleSubmit(onSubmit, (error) => {
                        console.log(error)
                      })}
                    >
                      <div className='grid gap-4 py-4'>
                        <FormField
                          control={form.control}
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
                          control={form.control}
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
                          control={form.control}
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
                          control={form.control}
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
                          control={form.control}
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
                          control={form.control}
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
                          control={form.control}
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
                    <div className='flex justify-end gap-4 -mt-4'>
                      <Button
                        type='button'
                        className='cursor-pointer'
                        variant='outline'
                        onClick={() => {
                          if (selectedAddressId === 0) {
                            setSelectedAddressId(undefined)
                          }
                          setShowAddressForm(false)
                        }}
                      >
                        Hủy
                      </Button>

                      <Button type='submit' form='add-edit-address-form' className='cursor-pointer'>
                        {selectedAddressId === 0 ? 'Thêm' : 'Cập nhật'}
                      </Button>
                    </div>
                  </Form>
                )}
                {selectedAddressId !== 0 && selectedAddressId !== undefined && !showAddressForm && (
                  <div className='bg-gray-50 rounded-lg p-4'>
                    <div className='flex justify-between items-start'>
                      <div>
                        <h4 className='font-medium text-gray-900'>Địa chỉ giao hàng đã chọn:</h4>
                        {(() => {
                          const address = addresses.find((addr) => addr.id === selectedAddressId)
                          return address ? (
                            <div className='mt-2 text-sm text-gray-600'>
                              <p className='font-medium'>
                                {address.recipientName} - {address.recipientPhone}
                              </p>
                              <p>{address.detailAddress}</p>
                              <p>
                                {address.ward.name && `${address.ward.name}, `}
                                {address.district.name}, {address.province.name}
                              </p>
                              {address.deliveryNote && <p className='italic'>Ghi chú: {address.deliveryNote}</p>}
                            </div>
                          ) : null
                        })()}
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setShowAddressForm(true)}
                        className='text-blue-600 hover:text-blue-700'
                      >
                        Chỉnh sửa
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className='text-xl font-semibold'>Tổng quan đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4 pb-2'>
                {orderItems.length > 0 && (
                  <div className={`${orderItems.length > 6 ? 'max-h-170 overflow-hidden' : ''}`}>
                    <ScrollArea className={orderItems.length > 6 ? 'h-170' : ''}>
                      <div className='pr-3 space-y-1'>
                        {orderItems.map((item) => (
                          <div key={item.id} className='flex items-center space-x-4 py-4 border-b last:border-b-0'>
                            <img
                              src={item.variant.thumbnail || item.variant.product.images[0] || Config.ImageBaseUrl}
                              alt={item.variant.value}
                              className='w-16 h-16 object-cover rounded-lg bg-gray-100'
                            />
                            <div className='flex-1'>
                              <h3 className='font-medium text-gray-900'>{item.variant.product.name}</h3>
                              <div className='mt-1 flex flex-col items-start'>
                                {(() => {
                                  const variantInfo = parseVariantInfo(
                                    item.variant.value,
                                    item.variant.product.variantsConfig
                                  )
                                  if (!variantInfo || variantInfo.length === 0) {
                                    return (
                                      <div>
                                        {item.variant.product.type === TypeProduct.FixedCombo ? (
                                          <div
                                            dangerouslySetInnerHTML={{ __html: item.variant.product.shortDescription }}
                                            className='text-sm text-gray-600 ml-4'
                                          />
                                        ) : (
                                          <>
                                            {item.variant.value !== 'default' && (
                                              <span className='text-sm text-gray-600'>Type: {item.variant.value}</span>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    )
                                  }
                                  return (
                                    <>
                                      {variantInfo.map((info) => (
                                        <div className='pl-4'>
                                          <span key={info.type} className='text-sm text-gray-600'>
                                            {info.type}: {info.value}
                                          </span>
                                        </div>
                                      ))}
                                    </>
                                  )
                                })()}
                              </div>
                              <p className='font-semibold text-gray-900'>{formatCurrency(item.variant.price)}</p>
                            </div>
                            <div className=' flex flex-col gap-4'>
                              <QuantityController
                                onIncrease={(value) => handleQuantityChange(item.id, value)}
                                onDecrease={(value) => handleQuantityChange(item.id, value)}
                                onType={(value) => handleQuantityChange(item.id, value)}
                                onFocusOut={(value) => handleQuantityChange(item.id, value)}
                                value={item.quantity}
                                max={item.variant.stock}
                              />
                            </div>

                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-red-500 hover:text-red-700'
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                <div className='space-y-2 pt-4'>
                  <div className='flex justify-between'>
                    <span>Tổng tiền</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Phí vận chuyển</span>
                    <span>{formatCurrency(OrderFee.Delivery)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Thuế VAT</span>
                    <span>{OrderFee.TaxRate * 100}%</span>
                  </div>
                  <div className='flex gap-2'>
                    <Input
                      className='flex-1'
                      placeholder='Mã giảm giá...'
                      value={couponCode}
                      onChange={(e) => {
                        const value = e.target.value
                        setCouponCode(value)
                      }}
                      disabled={isCheckingCoupon}
                    />
                    <Button
                      variant='outline'
                      onClick={handleSelectedCoupon}
                      disabled={isCheckingCoupon || !couponCode.trim()}
                    >
                      {isCheckingCoupon ? 'Kiểm tra...' : 'Áp dụng'}
                    </Button>
                  </div>
                  {selectedCoupon && (
                    <div className='flex justify-between items-center bg-green-50 border border-green-200 rounded-lg p-3'>
                      <div className='flex flex-col'>
                        <span className='font-medium text-green-800'>Mã giảm giá đã áp dụng</span>
                        <span className='text-sm text-green-600'>
                          {selectedCoupon.code} (-
                          {selectedCoupon.discountType === CouponDiscountType.Percent
                            ? `${selectedCoupon.discountValue}%`
                            : formatCurrency(selectedCoupon.discountValue)}
                          )
                        </span>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={removeCoupon}
                        className='text-red-500 hover:text-red-700 hover:bg-red-50'
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  )}
                  {selectedCoupon && discountAmount > 0 && (
                    <div className='flex justify-between text-green-600'>
                      <span>Giảm giá ({selectedCoupon.code})</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className='flex justify-between font-semibold text-lg pt-2 text-primary'>
                    <span>Thanh Toán</span>
                    <span>{formatCurrency(finalAmount)}</span>
                  </div>
                </div>
                <Separator />
                <>
                  <div className='text-xl font-semibold'>Phương thức thanh toán</div>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as PaymentMethodType)}
                    className='space-y-4'
                  >
                    <div className='flex flex-wrap gap-6'>
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value={PaymentMethod.VNPay} id={PaymentMethod.VNPay} />
                        <Label htmlFor={PaymentMethod.VNPay} className='flex items-center space-x-2'>
                          <span>VNPay</span>
                          <div className='flex space-x-1 w-10 h-10'>
                            <img src={Config.VNPayIamgeUrl} alt='VNPay' className='w-full h-full object-cover' />
                          </div>
                        </Label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value={PaymentMethod.MOMO} id={PaymentMethod.MOMO} />
                        <Label htmlFor={PaymentMethod.MOMO} className='flex items-center space-x-2'>
                          <span>MOMO</span>
                          <div className='flex space-x-1 w-10 h-10'>
                            <img src={Config.MomoImageUrl} alt='Momo' className='w-full h-full object-cover' />
                          </div>
                        </Label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value={PaymentMethod.COD} id={PaymentMethod.COD} />
                        <Label htmlFor={PaymentMethod.COD} className='flex items-center space-x-2'>
                          <span>Thanh toán khi nhận hàng</span>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </>
                <div>
                  <Textarea
                    placeholder='Ghi chú thêm cho đơn hàng (nếu có)...'
                    value={orderNote}
                    onChange={(e) => {
                      setOrderNote(e.target.value)
                    }}
                  ></Textarea>
                </div>
                <div className='flex flex-col sm:flex-row gap-4 pt-4'>
                  <Button
                    variant='outline'
                    className='flex-1 bg-transparent cursor-pointer'
                    onClick={() => navigate('/')}
                  >
                    Tiếp tục mua sắm
                  </Button>
                  <Button className='flex-1 cursor-pointer capitalize' onClick={handleOrder}>
                    Thanh Toán
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {addressDelete && (
        <AlertDialog
          open={Boolean(addressDelete)}
          onOpenChange={(open) => {
            if (!open) {
              setAddressDelete(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa địa chỉ?</AlertDialogTitle>
              <AlertDialogDescription>
                Địa chỉ{' '}
                <span className='bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded-sm dark:bg-red-900 dark:text-red-300'>
                  {addressDelete.recipientName} - {addressDelete.recipientPhone}
                </span>{' '}
                sẽ bị xóa vĩnh viễn
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteAddress(addressDelete.id)}>Xóa</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
