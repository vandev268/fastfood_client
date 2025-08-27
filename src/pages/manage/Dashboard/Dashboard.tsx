import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Eye,
  Star,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CalendarIcon,
  Filter
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChartContainer, ChartTooltip, ChartLegendContent, ChartLegend } from '@/components/ui/chart'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts'
import { DateTimeRangePicker } from '@/components/DateTimeRangePicker'
import { useStatisticsQuery } from '@/queries/useStatistics'
import { useOrdersQuery } from '@/queries/useOrder'
import type { StatisticsQueryType } from '@/schemaValidations/statistics.schema'
import { OrderType } from '@/constants/order'
import { Link } from 'react-router'
import { formatCurrency, formatOrderStatusColor, formatOrderStatusText } from '@/lib/format'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300']
export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | '90d'>('7d')
  const [customRange, setCustomRange] = useState(false)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    date.setHours(0, 0, 0, 0)
    return date
  })
  const [endDate, setEndDate] = useState(() => {
    const date = new Date()
    date.setHours(23, 59, 59, 999)
    return date
  })

  const isWithinCurrentMonth = () => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    const startMonth = startDate.getMonth()
    const startYear = startDate.getFullYear()
    const endMonth = endDate.getMonth()
    const endYear = endDate.getFullYear()

    return (
      startMonth === currentMonth && startYear === currentYear && endMonth === currentMonth && endYear === currentYear
    )
  }

  const statisticsQuery: StatisticsQueryType = useMemo(() => {
    if (customRange) {
      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    }
    return { timeRange }
  }, [customRange, startDate, endDate, timeRange])

  const { data: statisticsData, isLoading: isLoadingStats, error } = useStatisticsQuery(statisticsQuery)

  const { data: recentOrdersData, isLoading: isLoadingOrders } = useOrdersQuery({
    page: 1,
    limit: 10
  })

  const isLoading = isLoadingStats || isLoadingOrders

  const getTimeRangeLabel = () => {
    if (customRange) {
      return `${format(startDate, 'dd/MM/yyyy HH:mm', { locale: vi })} - ${format(endDate, 'dd/MM/yyyy HH:mm', { locale: vi })}`
    }
    const labels = {
      '1d': 'hôm nay',
      '7d': '7 ngày qua',
      '30d': '30 ngày qua',
      '90d': '3 tháng qua'
    }
    return labels[timeRange] || '7 ngày qua'
  }

  const handleQuickRangeSelect = (range: string) => {
    if (range === 'custom') {
      setCustomRange(true)
    } else {
      setTimeRange(range as '1d' | '7d' | '30d' | '90d')
      setCustomRange(false)
    }
  }

  const handleCustomRangeApply = () => {
    setCustomRange(true)
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-muted-foreground'>Đang tải dữ liệu thống kê...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-destructive mb-4'>Có lỗi xảy ra khi tải dữ liệu thống kê</p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      </div>
    )
  }

  if (!statisticsData) return null

  const {
    overviewStats,
    revenueData,
    categoryData,
    orderVolumeData,
    popularProducts,
    orderTypeData,
    provinceDeliveryData
  } = statisticsData.data

  console.log(categoryData)

  const chartConfig = {
    revenue: {
      label: 'Doanh thu',
      color: 'hsl(var(--chart-1))'
    },
    orders: {
      label: 'Đơn hàng',
      color: 'hsl(var(--chart-2))'
    },
    breakfast: {
      label: 'Sáng',
      color: 'hsl(var(--chart-1))'
    },
    lunch: {
      label: 'Trưa',
      color: 'hsl(var(--chart-2))'
    },
    dinner: {
      label: 'Tối',
      color: 'hsl(var(--chart-3))'
    }
  }

  return (
    <div className='min-h-screen bg-background overflow-x-hidden'>
      <main className='container mx-auto p-4 md:p-6 lg:p-8 max-w-full'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8'>
          <div className='min-w-0 flex-1'>
            <h1 className='text-3xl font-bold tracking-tight'>Thống kê tổng quan</h1>
            <p className='text-muted-foreground'>Thống kê và phân tích dữ liệu kinh doanh của nhà hàng</p>
          </div>

          <div className='flex items-center gap-2 flex-shrink-0'>
            <Select value={customRange ? 'custom' : timeRange} onValueChange={handleQuickRangeSelect}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Chọn thời gian' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='1d'>Hôm nay</SelectItem>
                <SelectItem value='7d'>7 ngày qua</SelectItem>
                <SelectItem value='30d'>30 ngày qua</SelectItem>
                <SelectItem value='90d'>3 tháng qua</SelectItem>
                <SelectItem value='custom'>Tùy chỉnh</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline' size='icon'>
                  <Filter className='h-4 w-4' />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='end'>
                <div className='p-4'>
                  <h4 className='font-medium mb-4'>Chọn khung thời gian tùy chỉnh</h4>
                  <DateTimeRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                  />
                  <div className='flex gap-2 mt-4'>
                    <Button onClick={handleCustomRangeApply} size='sm'>
                      Áp dụng
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className='flex items-center gap-2 text-sm text-muted-foreground mb-6'>
          <CalendarIcon className='h-4 w-4' />
          <span>Thống kê từ: {getTimeRangeLabel()}</span>
          {customRange && (
            <Badge variant='secondary' className='ml-2'>
              Tùy chỉnh
            </Badge>
          )}
        </div>

        <div className='space-y-6 overflow-hidden'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Tổng doanh thu</CardTitle>
                <DollarSign className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{formatCurrency(overviewStats.revenue)}</div>
                <p className='text-xs text-muted-foreground'>
                  <span
                    className={`flex items-center gap-1 ${overviewStats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {overviewStats.revenueGrowth >= 0 ? (
                      <ArrowUpRight className='h-3 w-3' />
                    ) : (
                      <ArrowDownRight className='h-3 w-3' />
                    )}
                    {overviewStats.revenueGrowth >= 0 ? '+' : ''}
                    {overviewStats.revenueGrowth}%
                  </span>
                  so với kỳ trước
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Tổng đơn hàng</CardTitle>
                <ShoppingCart className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{overviewStats.orders.toLocaleString()}</div>
                <p className='text-xs text-muted-foreground'>
                  <span
                    className={`flex items-center gap-1 ${overviewStats.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {overviewStats.ordersGrowth >= 0 ? (
                      <ArrowUpRight className='h-3 w-3' />
                    ) : (
                      <ArrowDownRight className='h-3 w-3' />
                    )}
                    {overviewStats.ordersGrowth >= 0 ? '+' : ''}
                    {overviewStats.ordersGrowth}%
                  </span>
                  so với kỳ trước
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Khách hàng mới</CardTitle>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{overviewStats.customers.toLocaleString()}</div>
                <p className='text-xs text-muted-foreground'>
                  <span
                    className={`flex items-center gap-1 ${overviewStats.customersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {overviewStats.customersGrowth >= 0 ? (
                      <ArrowUpRight className='h-3 w-3' />
                    ) : (
                      <ArrowDownRight className='h-3 w-3' />
                    )}
                    {overviewStats.customersGrowth >= 0 ? '+' : ''}
                    {overviewStats.customersGrowth}%
                  </span>
                  so với kỳ trước
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Tổng sản phẩm bán </CardTitle>
                <Package className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{overviewStats.products.toLocaleString()}</div>
                <p className='text-xs text-muted-foreground'>
                  <span
                    className={`flex items-center gap-1 ${overviewStats.productsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {overviewStats.productsGrowth >= 0 ? (
                      <ArrowUpRight className='h-3 w-3' />
                    ) : (
                      <ArrowDownRight className='h-3 w-3' />
                    )}
                    {overviewStats.productsGrowth >= 0 ? '+' : ''}
                    {overviewStats.productsGrowth}%
                  </span>
                  so với kỳ trước
                </p>
              </CardContent>
            </Card>
          </div>

          <div className='grid gap-6 lg:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng doanh thu</CardTitle>
                <CardDescription>Biểu đồ doanh thu {getTimeRangeLabel()}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className='h-[300px] w-full overflow-hidden'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart data={revenueData || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis
                        dataKey='time'
                        tickFormatter={(value) => {
                          try {
                            if (!value || value === 'NaN') return ''
                            if (typeof value === 'string' && (value.includes(':') || value.includes('/'))) {
                              return value
                            }
                            const date = new Date(value)
                            if (isNaN(date.getTime())) return value
                            return isWithinCurrentMonth()
                              ? date.getDate().toString()
                              : date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
                          } catch (error) {
                            return value || ''
                          }
                        }}
                        type='category'
                      />
                      <YAxis
                        tickFormatter={(value) => {
                          try {
                            if (!value || isNaN(value)) return '0'
                            return formatCurrency(value)
                          } catch (error) {
                            return '0'
                          }
                        }}
                      />
                      <ChartTooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className='rounded-lg border bg-background p-3 shadow-sm'>
                                <div className='grid gap-2'>
                                  <div className='flex flex-col'>
                                    <span className='text-[0.70rem] capitalize text-muted-foreground'>Thời gian</span>
                                    <span className='font-medium text-foreground'>
                                      {(() => {
                                        try {
                                          if (!label || label === 'NaN') return ''
                                          if (
                                            typeof label === 'string' &&
                                            (label.includes(':') || label.includes('/') || label.includes('Tuần'))
                                          ) {
                                            return label
                                          }
                                          const date = new Date(label)
                                          if (isNaN(date.getTime())) return label
                                          return date.toLocaleDateString('vi-VN', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                          })
                                        } catch (error) {
                                          return label || ''
                                        }
                                      })()}
                                    </span>
                                  </div>
                                  {payload.map((entry, index) => (
                                    <>
                                      <div key={index} className='flex flex-col'>
                                        <span className='text-[0.70rem] capitalize text-muted-foreground'>
                                          {payload.map((entry, index) => (
                                            <div key={`revenue-${index}`} className='flex flex-col'>
                                              <span className='text-[0.70rem] capitalize text-muted-foreground'>
                                                {entry.dataKey === 'revenue' ? 'Doanh thu' : 'Giá trị'}
                                              </span>
                                              <span className='font-bold text-foreground'>
                                                {(() => {
                                                  try {
                                                    const numValue = Number(entry.value)
                                                    if (isNaN(numValue)) return '0₫'
                                                    return formatCurrency(numValue)
                                                  } catch (error) {
                                                    return '0₫'
                                                  }
                                                })()}
                                              </span>
                                            </div>
                                          ))}
                                          {payload.length > 0 && payload[0].payload?.orders ? (
                                            <div className='flex flex-col'>
                                              <span className='text-[0.70rem] capitalize text-muted-foreground'>
                                                Đơn hàng
                                              </span>
                                              <span className='font-bold text-foreground'>
                                                {payload[0].payload.orders.toLocaleString()} đơn
                                              </span>
                                            </div>
                                          ) : (
                                            <div className='flex flex-col'>
                                              <span className='text-[0.70rem] capitalize text-muted-foreground'>
                                                Đơn hàng
                                              </span>
                                              <span className='font-bold text-foreground'>0 đơn</span>
                                            </div>
                                          )}
                                        </span>
                                      </div>
                                    </>
                                  ))}
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Line
                        type='monotone'
                        dataKey='revenue'
                        stroke='var(--chart-6)'
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--chart-8))', strokeWidth: 2, r: 4 }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phân bố theo danh mục</CardTitle>
                <CardDescription>Tỷ lệ doanh thu theo loại sản phẩm {getTimeRangeLabel()}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className='h-[300px] overflow-hidden'>
                  <PieChart>
                    <Pie
                      data={categoryData || []}
                      cx='40%'
                      cy='50%'
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey='revenue'
                    >
                      {(categoryData || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className='rounded-lg border bg-background p-2 shadow-sm'>
                              <div className='grid grid-cols-2 gap-2'>
                                <div className='flex flex-col'>
                                  <span className='text-[0.70rem] capitalize text-muted-foreground'>Danh mục</span>
                                  <span className='font-bold text-muted-foreground'>{data.name}</span>
                                </div>
                                <div className='flex flex-col'>
                                  <span className='text-[0.70rem] capitalize text-muted-foreground'>Doanh thu</span>
                                  <span className='font-bold'>{formatCurrency(data.revenue)}</span>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ChartContainer>
                <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm overflow-hidden'>
                  {(categoryData || []).map((item, index) => (
                    <div key={index} className='flex items-center gap-2 min-w-0'>
                      <div
                        className='h-3 w-3 rounded-full flex-shrink-0'
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className='text-muted-foreground truncate'>{item.name}</span>
                      <span className='ml-auto font-medium text-right flex-shrink-0'>
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Khối lượng đơn hàng theo thời gian</CardTitle>
              <CardDescription>Số lượng đơn hàng theo buổi {getTimeRangeLabel()}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className='h-[300px] w-full overflow-hidden'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={orderVolumeData || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='time' type='category' />
                    <YAxis
                      tickFormatter={(value) => {
                        try {
                          if (!value || isNaN(value)) return '0'
                          return value.toString()
                        } catch (error) {
                          return '0'
                        }
                      }}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className='rounded-lg border bg-background p-3 shadow-sm'>
                              <div className='grid gap-2'>
                                <div className='flex flex-col'>
                                  <span className='text-[0.70rem] uppercase text-muted-foreground'>Thời gian</span>
                                  <span className='font-medium text-foreground'>
                                    {(() => {
                                      try {
                                        if (!label || label === 'NaN') return ''
                                        if (
                                          typeof label === 'string' &&
                                          (label.includes(':') || label.includes('/') || label.includes('Tuần'))
                                        ) {
                                          return label
                                        }
                                        const date = new Date(label)
                                        if (isNaN(date.getTime())) return label
                                        return date.toLocaleDateString('vi-VN', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        })
                                      } catch (error) {
                                        return label || ''
                                      }
                                    })()}
                                  </span>
                                </div>
                                {payload.map((entry, index) => {
                                  const mealName =
                                    entry.dataKey === 'breakfast'
                                      ? 'Sáng'
                                      : entry.dataKey === 'lunch'
                                        ? 'Trưa'
                                        : entry.dataKey === 'dinner'
                                          ? 'Tối'
                                          : 'Khác'
                                  return (
                                    <div key={index} className='flex flex-col'>
                                      <span className='text-[0.70rem] uppercase text-muted-foreground'>{mealName}</span>
                                      <span className='font-bold text-foreground'>
                                        {(() => {
                                          try {
                                            const numValue = Number(entry.value)
                                            if (isNaN(numValue)) return '0'
                                            return numValue.toLocaleString() + ' đơn'
                                          } catch (error) {
                                            return '0 đơn'
                                          }
                                        })()}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey='breakfast' fill='var(--chart-1)' name='Sáng' />
                    <Bar dataKey='lunch' fill='var(--chart-2)' name='Trưa' />
                    <Bar dataKey='dinner' fill='var(--chart-3)' name='Tối' />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className='grid gap-6 lg:grid-cols-2 xl:grid-cols-3'>
            <Card className='xl:col-span-2'>
              <CardHeader className='flex flex-row items-center'>
                <div className='grid gap-2'>
                  <CardTitle>Đơn hàng gần đây</CardTitle>
                  <CardDescription>Bạn có {recentOrdersData?.data.data.length || 0} đơn hàng gần đây.</CardDescription>
                </div>
                <Button asChild size='sm' className='ml-auto gap-1'>
                  <Link to='/manage/orders'>
                    Xem tất cả
                    <Eye className='h-4 w-4' />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='min-w-[100px]'>Đơn hàng</TableHead>
                      <TableHead className='hidden xl:table-column min-w-[120px]'>Khách hàng</TableHead>
                      <TableHead className='hidden xl:table-column min-w-[100px]'>Loại đơn</TableHead>
                      <TableHead className='text-right min-w-[100px]'>Tổng tiền</TableHead>
                      <TableHead className='hidden md:table-cell min-w-[100px]'>Trạng thái</TableHead>
                      <TableHead className='text-right min-w-[100px]'>Thời gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrdersData?.data.data.slice(0, 5).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className='font-medium'>#{order.id}</div>
                          <div className='hidden text-sm text-muted-foreground md:inline'>
                            {order.orderItems.length} sản phẩm
                          </div>
                        </TableCell>
                        <TableCell className='hidden xl:table-column'>
                          {order.user?.name || order.customerName || 'Khách lẻ'}
                        </TableCell>
                        <TableCell className='hidden xl:table-column'>
                          <Badge variant='outline'>
                            {order.orderType === OrderType.DineIn
                              ? 'Tại bàn'
                              : order.orderType === OrderType.Takeaway
                                ? 'Mang đi'
                                : 'Giao hàng'}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>{formatCurrency(order.finalAmount)}</TableCell>
                        <TableCell className='hidden md:table-cell'>
                          <span className={formatOrderStatusColor({ status: order.status })}>
                            {formatOrderStatusText(order.status)}
                          </span>
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex items-center gap-1 justify-end'>
                            <Clock className='h-3 w-3' />
                            <span className='text-sm'>
                              {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sản phẩm bán chạy</CardTitle>
                <CardDescription>Top sản phẩm được yêu thích nhất {getTimeRangeLabel()}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className='h-[300px] pr-4'>
                  <div className='space-y-4'>
                    {(popularProducts || []).slice(0, 10).map((product, index) => (
                      <div
                        key={product.name}
                        className='flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors'
                      >
                        <div className='flex items-center gap-3 flex-1 min-w-0'>
                          <div className='flex-shrink-0 relative'>
                            <img
                              src={product.image || '/placeholder.svg'}
                              alt={product.name}
                              className='h-12 w-12 rounded-lg object-cover border'
                            />
                            <div className='absolute -top-1 -left-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium'>
                              {index + 1}
                            </div>
                          </div>
                          <div className='min-w-0 flex-1'>
                            <p className='text-sm font-medium leading-none truncate'>{product.name}</p>
                            <div className='flex items-center gap-2 mt-1'>
                              <div className='flex items-center gap-1'>
                                <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />
                                <span className='text-xs text-muted-foreground'>{product.rating}</span>
                              </div>
                              <span className='text-xs text-muted-foreground'>{product.orders} đơn</span>
                            </div>
                          </div>
                        </div>
                        <div className='text-right flex-shrink-0'>
                          <p className='text-sm font-medium'>{product.revenue}</p>
                          <p
                            className={`text-xs flex items-center gap-1 justify-end ${product.growth > 0 ? 'text-green-600' : product.growth < 0 ? 'text-red-600' : 'text-muted-foreground'}`}
                          >
                            {product.growth > 0 ? (
                              <ArrowUpRight className='h-3 w-3' />
                            ) : product.growth < 0 ? (
                              <ArrowDownRight className='h-3 w-3' />
                            ) : null}
                            {product.growth !== 0 ? `${Math.abs(product.growth)}%` : '0%'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!popularProducts || popularProducts.length === 0) && (
                      <div className='text-center py-8 text-muted-foreground'>
                        <Package className='h-12 w-12 mx-auto mb-4 opacity-50' />
                        <p>Không có dữ liệu sản phẩm trong khoảng thời gian này</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className='grid gap-6 lg:grid-cols-2 mb-2'>
            <Card>
              <CardHeader>
                <CardTitle>Thống kê theo loại đơn hàng</CardTitle>
                <CardDescription>Doanh thu và số lượng đơn theo loại {getTimeRangeLabel()}</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {(orderTypeData || []).map((item, index) => (
                  <div key={index} className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='h-4 w-4 rounded-full flex-shrink-0' style={{ backgroundColor: item.color }} />
                        <span className='font-medium text-sm'>{item.orderTypeName}</span>
                      </div>
                      <div className='text-right'>
                        <div className='font-bold text-sm'>{formatCurrency(item.revenue)}</div>
                        <div className='text-xs text-muted-foreground'>{item.orderCount} đơn</div>
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <div className='flex justify-between text-xs'>
                        <span className='text-muted-foreground'>Tỷ lệ doanh thu:</span>
                        <span className='font-medium'>
                          {orderTypeData.length > 0 && orderTypeData.reduce((sum, p) => sum + p.revenue, 0) > 0
                            ? Math.round((item.revenue / orderTypeData.reduce((sum, p) => sum + p.revenue, 0)) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          orderTypeData.length > 0 && orderTypeData.reduce((sum, p) => sum + p.revenue, 0) > 0
                            ? (item.revenue / orderTypeData.reduce((sum, p) => sum + p.revenue, 0)) * 100
                            : 0
                        }
                        className='h-2'
                      />
                    </div>
                  </div>
                ))}
                {(!orderTypeData || orderTypeData.length === 0) && (
                  <div className='text-center py-4 text-muted-foreground'>
                    Không có dữ liệu trong khoảng thời gian này
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chi tiết đơn giao hàng theo tỉnh</CardTitle>
                <CardDescription>Doanh thu theo tỉnh {getTimeRangeLabel()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {(provinceDeliveryData || []).map((item, index) => (
                    <div key={index} className='space-y-2'>
                      <div className='flex items-center justify-between text-sm'>
                        <div className='flex items-center gap-2'>
                          <div className='h-3 w-3 rounded-full flex-shrink-0' style={{ backgroundColor: item.color }} />
                          <span className='font-medium'>{item.provinceName}</span>
                        </div>
                        <div className='text-right'>
                          <div className='font-bold'>{formatCurrency(item.revenue)}</div>
                          <div className='text-xs text-muted-foreground'>{item.orderCount} đơn</div>
                        </div>
                      </div>
                      <Progress
                        value={
                          provinceDeliveryData.length > 0
                            ? (item.orderCount / Math.max(...provinceDeliveryData.map((p) => p.orderCount))) * 100
                            : 0
                        }
                        className='h-2'
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
