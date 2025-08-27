import * as React from 'react'
import { CalendarIcon, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface DateTimeRangePickerProps {
  startDate: Date
  endDate: Date
  onStartDateChange: (date: Date) => void
  onEndDateChange: (date: Date) => void
}

export function DateTimeRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}: DateTimeRangePickerProps) {
  const [startCalendarOpen, setStartCalendarOpen] = React.useState(false)
  const [endCalendarOpen, setEndCalendarOpen] = React.useState(false)

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDate = new Date(date)
      newDate.setHours(startDate.getHours(), startDate.getMinutes())
      onStartDateChange(newDate)
      setStartCalendarOpen(false)
    }
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDate = new Date(date)
      newDate.setHours(endDate.getHours(), endDate.getMinutes())
      onEndDateChange(newDate)
      setEndCalendarOpen(false)
    }
  }

  const handleStartTimeChange = (hours: string, minutes: string) => {
    const newDate = new Date(startDate)
    newDate.setHours(Number.parseInt(hours), Number.parseInt(minutes))
    onStartDateChange(newDate)
  }

  const handleEndTimeChange = (hours: string, minutes: string) => {
    const newDate = new Date(endDate)
    newDate.setHours(Number.parseInt(hours), Number.parseInt(minutes))
    onEndDateChange(newDate)
  }

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

  return (
    <div className='grid gap-4 p-4'>
      <div className='grid gap-2'>
        <Label>Từ ngày</Label>
        <div className='flex gap-2'>
          <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className={cn('w-[200px] justify-start text-left font-normal', !startDate && 'text-muted-foreground')}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {startDate ? format(startDate, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar mode='single' selected={startDate} onSelect={handleStartDateSelect} initialFocus />
            </PopoverContent>
          </Popover>

          <div className='flex gap-1 items-center'>
            <Clock className='h-4 w-4 text-muted-foreground' />
            <Select
              value={startDate.getHours().toString().padStart(2, '0')}
              onValueChange={(value) =>
                handleStartTimeChange(value, startDate.getMinutes().toString().padStart(2, '0'))
              }
            >
              <SelectTrigger className='w-[70px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hours.map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className='text-muted-foreground'>:</span>
            <Select
              value={startDate.getMinutes().toString().padStart(2, '0')}
              onValueChange={(value) => handleStartTimeChange(startDate.getHours().toString().padStart(2, '0'), value)}
            >
              <SelectTrigger className='w-[70px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {minutes
                  .filter((_, i) => i % 15 === 0)
                  .map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className='grid gap-2'>
        <Label>Đến ngày</Label>
        <div className='flex gap-2'>
          <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className={cn('w-[200px] justify-start text-left font-normal', !endDate && 'text-muted-foreground')}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {endDate ? format(endDate, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar mode='single' selected={endDate} onSelect={handleEndDateSelect} initialFocus />
            </PopoverContent>
          </Popover>

          <div className='flex gap-1 items-center'>
            <Clock className='h-4 w-4 text-muted-foreground' />
            <Select
              value={endDate.getHours().toString().padStart(2, '0')}
              onValueChange={(value) => handleEndTimeChange(value, endDate.getMinutes().toString().padStart(2, '0'))}
            >
              <SelectTrigger className='w-[70px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hours.map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className='text-muted-foreground'>:</span>
            <Select
              value={endDate.getMinutes().toString().padStart(2, '0')}
              onValueChange={(value) => handleEndTimeChange(endDate.getHours().toString().padStart(2, '0'), value)}
            >
              <SelectTrigger className='w-[70px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {minutes
                  .filter((_, i) => i % 15 === 0)
                  .map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
