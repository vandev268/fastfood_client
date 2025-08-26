import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import DropdownAvatar from './DropdownAvatar'
import { Outlet } from 'react-router'
import { ModeToggle } from '@/components/ModeToggle'

export default function ManageLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className='sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-background border-b'>
          <div className='flex items-center gap-2 px-4 ml-5'>
            <SidebarTrigger className='-ml-1' />
          </div>
          <div className='flex items-center gap-4 mr-10'>
            <ModeToggle />
            <DropdownAvatar />
          </div>
        </header>
        <div className='flex flex-1 flex-col gap-4 p-4'>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
