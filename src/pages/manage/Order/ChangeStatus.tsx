import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { OrderStatusValues, type OrderStatusType } from '@/constants/order'
import { formatOrderStatusColor, formatOrderStatusText } from '@/lib/format'
import { handleError } from '@/lib/utils'
import { useChangeOrderStatusMutation } from '@/queries/useOrder'
import type { OrderDetailType } from '@/schemaValidations/order.schema'
import { toast } from 'sonner'

export default function ChangeStatus({ order }: { order: OrderDetailType }) {
  const changeOrderStatusMutation = useChangeOrderStatusMutation()

  const handleChangeStatus = async (value: OrderStatusType) => {
    if (changeOrderStatusMutation.isPending) return

    try {
      const payload = {
        orderId: order.id,
        body: {
          status: value
        }
      }
      await changeOrderStatusMutation.mutateAsync(payload)
      toast.success('Cập nhật trạng thái đơn hàng thành công')
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <Select onValueChange={handleChangeStatus} defaultValue={order.status}>
      <SelectTrigger className='p-0 border-none shadow-none hover:shadow-none focus:shadow-none' hasIcon={false}>
        <span className={formatOrderStatusColor({ status: order.status })}>{formatOrderStatusText(order.status)}</span>
      </SelectTrigger>

      <SelectContent>
        {OrderStatusValues.map((status) => (
          <SelectItem key={status} value={status}>
            {formatOrderStatusText(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
