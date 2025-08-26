import { CouponDiscountType } from '@/constants/coupon'
import { ProductStatus, TypeProduct } from '@/constants/product'
import { TableLocation, TableStatus } from '@/constants/table'
import { TagType } from '@/constants/tag'
import { UserStatus } from '@/constants/user'
import { format } from 'date-fns'

const LANGUAGE = 'vi'

export const formatCurrency = (number: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(number)
}

export const formatDateTimeToLocaleString = (date: string | Date) => {
  console.log('formatDateTimeToLocaleString', date)
  return format(date instanceof Date ? date : new Date(date), 'HH:mm, dd/MM/yyyy')
}

export const formatTimeToLocaleString = (date: string | Date) => {
  return format(date instanceof Date ? date : new Date(date), 'HH:mm')
}

export const formatDateToLocaleString = (date: string | Date) => {
  return format(date instanceof Date ? date : new Date(date), 'dd/MM/yyyy')
}

export const formatRoleStatusText = (isActive: boolean) => {
  switch (isActive) {
    case true:
      return LANGUAGE === 'vi' ? 'Hoạt động' : 'Active'
    case false:
      return LANGUAGE === 'vi' ? 'Dừng hoạt động' : 'Inactive'
  }
}

export const formatUserStatusText = (status: string) => {
  switch (status) {
    case UserStatus.Active:
      return LANGUAGE === 'vi' ? 'Hoạt động' : 'Active'
    case UserStatus.Inactive:
      return LANGUAGE === 'vi' ? 'Dừng hoạt động' : 'Inactive'
    case UserStatus.Blocked:
      return LANGUAGE === 'vi' ? 'Bị chặn' : 'Blocked'
    default:
      return LANGUAGE === 'vi' ? 'Không xác định' : 'Unknown'
  }
}

export const formatUserStatusColor = ({
  className = 'text-xs font-medium me-2 px-2.5 py-0.5 rounded-full',
  status
}: {
  className?: string
  status: string
}) => {
  switch (status) {
    case UserStatus.Active:
      return `${className} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`
    case UserStatus.Inactive:
      return `${className} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`
    case UserStatus.Blocked:
      return `${className} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`
    default:
      return `${className} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`
  }
}

export const formatTagTypeText = (type: string) => {
  switch (type) {
    case TagType.Custom:
      return LANGUAGE === 'vi' ? 'Tùy chỉnh' : 'Custom'
    case TagType.Marketing:
      return LANGUAGE === 'vi' ? 'Tiếp thị' : 'Marketing'
    case TagType.Seasonal:
      return LANGUAGE === 'vi' ? 'Theo mùa' : 'Seasonal'
    case TagType.Spice:
      return LANGUAGE === 'vi' ? 'Gia vị' : 'Spice'
    default:
      return LANGUAGE === 'vi' ? 'Không xác định' : 'Unknown'
  }
}

export const formatTypeProductText = (type: string) => {
  switch (type) {
    case TypeProduct.Single:
      return LANGUAGE === 'vi' ? 'Món đơn' : 'Single'
    case TypeProduct.FixedCombo:
      return LANGUAGE === 'vi' ? 'Combo cố định' : 'Fixed Combo'
    case TypeProduct.CustomCombo:
      return LANGUAGE === 'vi' ? 'Combo tùy chỉnh' : 'Custom Combo'
    default:
      return LANGUAGE === 'vi' ? 'Không xác định' : 'Unknown'
  }
}

export const formatProductStatusText = (status: string) => {
  switch (status) {
    case ProductStatus.Available:
      return LANGUAGE === 'vi' ? 'Có sẵn' : 'Available'
    case ProductStatus.OutOfStock:
      return LANGUAGE === 'vi' ? 'Hết hàng' : 'Out of Stock'
    case ProductStatus.Pending:
      return LANGUAGE === 'vi' ? 'Chờ duyệt' : 'Pending'
    case ProductStatus.Hidden:
      return LANGUAGE === 'vi' ? 'Đã ẩn' : 'Hidden'
    default:
      return LANGUAGE === 'vi' ? 'Không xác định' : 'Unknown'
  }
}

export const formatProductStatusColor = ({
  className = 'text-xs font-medium me-2 px-2.5 py-0.5 rounded-full',
  status
}: {
  className?: string
  status: string
}) => {
  switch (status) {
    case ProductStatus.Available:
      return `${className} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`
    case ProductStatus.OutOfStock:
      return `${className} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`
    case ProductStatus.Pending:
      return `${className} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`
    case ProductStatus.Hidden:
      return `${className} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`
    default:
      return `${className} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`
  }
}

export const formatTableLocationText = (location: string) => {
  switch (location) {
    case TableLocation.Floor1:
      return LANGUAGE === 'vi' ? 'Tầng 1' : 'Floor 1'
    case TableLocation.Floor2:
      return LANGUAGE === 'vi' ? 'Tầng 2' : 'Floor 2'
    case TableLocation.Floor3:
      return LANGUAGE === 'vi' ? 'Tầng 3' : 'Floor 3'
    case TableLocation.Outdoor:
      return LANGUAGE === 'vi' ? 'Ngoài trời' : 'Outdoor'
    case TableLocation.Balcony:
      return LANGUAGE === 'vi' ? 'Ban công' : 'Balcony'
    case TableLocation.PrivateRoom:
      return LANGUAGE === 'vi' ? 'Phòng riêng' : 'Private Room'
    default:
      return LANGUAGE === 'vi' ? 'Tất cả' : 'All'
  }
}
export const formatTableStatusText = (status: string) => {
  switch (status) {
    case TableStatus.Available:
      return LANGUAGE === 'vi' ? 'Trống' : 'Available'
    case TableStatus.Occupied:
      return LANGUAGE === 'vi' ? 'Có khách' : 'Occupied'
    case TableStatus.Reserved:
      return LANGUAGE === 'vi' ? 'Đã đặt' : 'Reserved'
    case TableStatus.Cleaning:
      return LANGUAGE === 'vi' ? 'Đang dọn' : 'Cleaning'
    case TableStatus.Disabled:
      return LANGUAGE === 'vi' ? 'Tạm khóa' : 'Disabled'
    default:
      return LANGUAGE === 'vi' ? 'Tất cả' : 'All'
  }
}
export const formatTableStatusColor = ({
  className = 'text-xs font-medium me-2 px-2.5 py-0.5 rounded-full',
  status
}: {
  className?: string
  status: string
}) => {
  switch (status) {
    case TableStatus.Available:
      return `${className} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`
    case TableStatus.Occupied:
      return `${className} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`
    case TableStatus.Reserved:
      return `${className} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`
    case TableStatus.Cleaning:
      return `${className} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300`
    case TableStatus.Disabled:
      return `${className} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`
    default:
      return `${className} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`
  }
}

export const formatCouponTypeText = (type: string) => {
  switch (type) {
    case CouponDiscountType.Percent:
      return LANGUAGE === 'vi' ? 'Phần trăm' : 'Percentage'
    case CouponDiscountType.Amount:
      return LANGUAGE === 'vi' ? 'Số tiền' : 'Amount'
    default:
      return LANGUAGE === 'vi' ? 'Không xác định' : 'Unknown'
  }
}

export const formatCouponStatusText = (isActive: boolean) => {
  switch (isActive) {
    case true:
      return LANGUAGE === 'vi' ? 'Hoạt động' : 'Active'
    case false:
      return LANGUAGE === 'vi' ? 'Dừng hoạt động' : 'Inactive'
  }
}

export const formatCouponStatusColor = ({
  className = 'text-xs font-medium me-2 px-2.5 py-0.5 rounded-full',
  isActive
}: {
  className?: string
  isActive: boolean
}) => {
  switch (isActive) {
    case true:
      return `${className} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`
    case false:
      return `${className} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`
  }
}
