import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { useAllCategoriesQuery } from '@/queries/useCategory'
import Config from '@/constants/config'
import type { CategoryType } from '@/schemaValidations/category.schema'
import { useSearchParams } from 'react-router'
import { generateNameId, getIdByNameId } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import { categorySocket } from '@/lib/sockets'
import type { MessageResType } from '@/schemaValidations/response.schema'
import { useAppContext } from '@/components/AppProvider'

export default function NavCategories() {
  const { isAuth } = useAppContext()
  const query = useQuery()
  const [searchParams, setSearchParams] = useSearchParams()

  const { data, refetch } = useAllCategoriesQuery()
  const categories = data?.data.data || []

  useEffect(() => {
    if (isAuth) {
      categorySocket.connect()
    } else {
      categorySocket.disconnect()
      return
    }

    categorySocket.on('sended-category', (data: MessageResType) => {
      setTimeout(() => {
        refetch()
      }, 10)
    })

    return () => {
      categorySocket.off('sended-category')
      categorySocket.disconnect()
    }
  }, [isAuth, refetch])

  const parentCategories = categories.filter((category) => category.parentCategoryId === null)

  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [visibleItems, setVisibleItems] = useState(4)
  const [totalPages, setTotalPages] = useState(Math.ceil(parentCategories.length))
  const containerRef = useRef<HTMLDivElement>(null)

  const categoryId = query.get('category') ? Number(getIdByNameId(query.get('category') as string)) : undefined

  useEffect(() => {
    if (!categoryId) {
      setSelectedCategory(null)
      return
    }
    const selected = parentCategories.find((category) => category.id === categoryId)
    if (selected) {
      setSelectedCategory(selected)
    }
  }, [categoryId, parentCategories])

  useEffect(() => {
    const updateVisibleItems = () => {
      const isMobile = window.innerWidth < 768
      const items = isMobile ? 4 : 8
      setVisibleItems(items)
      setTotalPages(parentCategories.length > 0 ? Math.ceil(parentCategories.length / items) : 0)
      setCurrentPage(0)
    }

    updateVisibleItems()
    window.addEventListener('resize', updateVisibleItems)
    return () => window.removeEventListener('resize', updateVisibleItems)
  }, [parentCategories.length])

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || isDragging) return

      const scrollLeft = containerRef.current.scrollLeft
      const containerWidth = containerRef.current.clientWidth
      const scrollableWidth = containerRef.current.scrollWidth - containerWidth

      const scrollPercentage = scrollLeft / scrollableWidth
      const newPage = Math.round(scrollPercentage * (totalPages - 1))

      if (newPage !== currentPage && newPage >= 0 && newPage < totalPages) {
        setCurrentPage(newPage)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [currentPage, totalPages, visibleItems, isDragging])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - containerRef.current.offsetLeft)
    setScrollLeft(containerRef.current.scrollLeft)
    containerRef.current.style.cursor = 'grabbing'
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    e.preventDefault()
    const x = e.pageX - containerRef.current.offsetLeft
    const walk = (x - startX) * 2
    containerRef.current.scrollLeft = scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab'
    }
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab'
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return
    setIsDragging(true)
    setStartX(e.touches[0].pageX - containerRef.current.offsetLeft)
    setScrollLeft(containerRef.current.scrollLeft)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return
    const x = e.touches[0].pageX - containerRef.current.offsetLeft
    const walk = (x - startX) * 2
    containerRef.current.scrollLeft = scrollLeft - walk
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleCategoryClick = (category: CategoryType, e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault()
      return
    }

    if (selectedCategory?.id === category.id) {
      setSelectedCategory(null)
      setSearchParams({})
    } else {
      setSelectedCategory(category)
      setSearchParams({ category: generateNameId({ name: category.name, id: category.id }) })
    }
  }

  const handleDotClick = (pageIndex: number) => {
    if (!containerRef.current) return

    const containerWidth = containerRef.current.clientWidth
    const scrollableWidth = containerRef.current.scrollWidth - containerWidth
    const targetScrollLeft = (pageIndex / (totalPages - 1)) * scrollableWidth

    containerRef.current.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    })

    setCurrentPage(pageIndex)
  }

  return (
    <div className='max-w-6xl mx-auto px-4 my-4'>
      <div className='relative'>
        <div className='absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none opacity-50'></div>
        <div className='absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none opacity-50'></div>
        <div
          ref={containerRef}
          className='flex gap-4 overflow-x-auto scrollbar-hide cursor-grab select-none pb-2 px-2'
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollBehavior: 'smooth'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {parentCategories.map((category) => (
            <Card
              key={category.id}
              className='relative border-none cursor-pointer transition-all duration-200 hover:scale-105 flex-shrink-0 shadow-none'
              onClick={(e) => handleCategoryClick(category, e)}
            >
              <div className='flex flex-col items-center text-center space-y-1 w-26 mx-2'>
                <img
                  src={category.thumbnail || Config.ImageBaseUrl}
                  alt={category.name}
                  className='w-32 h-full object-contain pointer-events-none'
                  draggable={false}
                />

                <span
                  className={`mt-1 text-xs font-semibold leading-tight pointer-events-none ${selectedCategory === category ? 'text-primary' : ''}`}
                >
                  {category.name}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {totalPages > 1 && parentCategories.length > 0 && (
        <div className='flex justify-center mt-3 space-x-2'>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 hover:scale-125 ${
                currentPage === index ? 'bg-red-500 w-4' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Chuyển đến trang ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
