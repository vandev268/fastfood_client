import {
  Home,
  Salad,
  ShoppingCart,
  Table,
  Users2,
  Tag,
  ChartBarStacked,
  ShieldQuestionMark,
  TicketPercent,
  AlarmClockPlus
} from 'lucide-react'
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { Link, useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import { RoleName } from '@/constants/role'
import { useAppContext } from '@/components/AppProvider'

const manageItems = [
  {
    title: 'Dashboard',
    Icon: Home,
    href: '/manage/dashboard',
    roles: [RoleName.Admin, RoleName.Manager] as string[]
  },
  {
    title: 'Đơn hàng',
    Icon: ShoppingCart,
    href: '/manage/orders',
    roles: [RoleName.Admin, RoleName.Manager] as string[]
  },
  {
    title: 'Đặt bàn',
    Icon: AlarmClockPlus,
    href: '/manage/reservations',
    roles: [RoleName.Admin, RoleName.Manager] as string[]
  },
  {
    title: 'Bàn ăn',
    Icon: Table,
    href: '/manage/tables',
    roles: [RoleName.Admin, RoleName.Manager] as string[]
  },
  {
    title: 'Sản phẩm',
    Icon: Salad,
    href: '/manage/products',
    roles: [RoleName.Admin, RoleName.Manager] as string[]
  },
  {
    title: 'Danh mục',
    Icon: ChartBarStacked,
    href: '/manage/categories',
    roles: [RoleName.Admin, RoleName.Manager] as string[]
  },
  {
    title: 'Thẻ',
    Icon: Tag,
    href: '/manage/tags',
    roles: [RoleName.Admin, RoleName.Manager] as string[]
  },
  {
    title: 'Mã giảm giá',
    Icon: TicketPercent,
    href: '/manage/coupons',
    roles: [RoleName.Admin, RoleName.Manager] as string[]
  },
  {
    title: 'Tài khoản',
    Icon: Users2,
    href: '/manage/users',
    roles: [RoleName.Admin] as string[]
  },
  {
    title: 'Vai trò',
    Icon: ShieldQuestionMark,
    href: '/manage/roles',
    roles: [RoleName.Admin] as string[]
  }
]

export function NavMain() {
  const pathname = useLocation().pathname
  const { profile } = useAppContext()

  if (!profile) return null
  return (
    <SidebarGroup>
      <SidebarMenu>
        {manageItems
          .filter((item) => item.roles.includes(profile.role.name))
          .map((item) => {
            const isActive = pathname.startsWith(item.href)

            return (
              <SidebarMenuItem key={item.title} className='mb-1'>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link to={item.href} className={cn(isActive && 'font-bold bg-sidebar-primary/20')}>
                    <item.Icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
