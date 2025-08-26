import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Config from '@/constants/config'
import { formatCurrency } from '@/lib/format'
import { generateNameId, removeVietnameseAccents } from '@/lib/utils'
import { useAllProductsQuery } from '@/queries/useProduct'
import type { ProductType } from '@/schemaValidations/product.schema'
import { Search } from 'lucide-react'
import { useEffect, useState, useRef, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router'

export default function SearchInput() {
  const productsQuery = useAllProductsQuery()
  const products = productsQuery.data?.data.data || []
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)

  const filteredProducts = products.filter((product) => {
    const normalizedSearchTerm = removeVietnameseAccents(searchTerm.toLowerCase())
    const normalizedProductName = removeVietnameseAccents(product.name.toLowerCase())

    return normalizedProductName.includes(normalizedSearchTerm)
  })

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Hiển thị dropdown khi có searchTerm
  useEffect(() => {
    const isFocused = document.activeElement === inputRef.current
    if (searchTerm.trim() && isFocused) {
      setShowDropdown(true)
      setSelectedIndex(-1)
    } else {
      setShowDropdown(false)
    }
  }, [searchTerm])

  const closeDropdown = (product: ProductType) => {
    setSearchTerm('') // Xóa nội dung tìm kiếm
    // setSearchTerm(product.name) // Giữ lại searchTerm
    setShowDropdown(false)
    setSelectedIndex(-1)
    inputRef.current?.blur() // bỏ focus để useEffect không bật lại dropdown
  }

  const navigateToProduct = (product: ProductType) => {
    const url = `/products/${generateNameId({ name: product.name, id: product.id })}`
    navigate(url)
    closeDropdown(product)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!filteredProducts.length) return

    // Xử lý phím mũi tên xuống
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : 0))
    }

    // Xử lý phím mũi tên lên
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredProducts.length - 1))
    }

    // Xử lý phím Enter
    else if (e.key === 'Enter') {
      e.preventDefault()

      // Nếu chỉ có một sản phẩm, chuyển trực tiếp đến sản phẩm đó
      if (filteredProducts.length === 1) {
        navigateToProduct(filteredProducts[0])
      }
      // Nếu có nhiều sản phẩm và đã chọn một sản phẩm
      else if (selectedIndex >= 0) {
        navigateToProduct(filteredProducts[selectedIndex])
      }
    }

    // Xử lý phím Escape
    else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  return (
    <div className='relative flex-1 max-w-md mx-4'>
      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
        <Search className='h-5 w-5 text-gray-600' />
      </div>
      <Input
        ref={inputRef}
        type='text'
        placeholder='Tìm kiếm sản phẩm...'
        className='block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 leading-5 bg-white dark:bg-white transition-all duration-200'
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => searchTerm.trim() && setShowDropdown(true)}
      />

      {showDropdown && filteredProducts.length > 0 && (
        <Card ref={dropdownRef} className='absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border p-1'>
          <div className='max-h-96 overflow-y-auto'>
            {filteredProducts.map((product, index) => (
              <Link
                to={`/products/${generateNameId({ name: product.name, id: product.id })}`}
                key={product.id}
                className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors ${
                  selectedIndex === index ? 'bg-gray-100' : ''
                }`}
                onClick={() => {
                  closeDropdown(product)
                }}
              >
                <img
                  src={product.images[0] || Config.ImageBaseUrl}
                  alt={product.name}
                  className='w-12 h-12 object-cover rounded-md flex-shrink-0'
                />
                <div className='flex-1 min-w-0'>
                  <h3 className='font-medium text-sm text-gray-900 truncate'>{product.name}</h3>
                  <p className='text-sm font-semibold text-red-600 mt-1'>{formatCurrency(product.basePrice)}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {showDropdown && filteredProducts.length === 0 && (
        <Card className='absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border'>
          <div className='p-4 text-center text-gray-500'>
            <Search className='h-8 w-8 mx-auto mb-2 text-gray-300' />
            <p className='text-sm'>Không tìm thấy sản phẩm nào</p>
            <p className='text-xs text-gray-400 mt-1'>Thử tìm kiếm với từ khóa khác</p>
          </div>
        </Card>
      )}
    </div>
  )
}
