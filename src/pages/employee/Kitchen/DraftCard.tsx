/* eslint-disable react-hooks/rules-of-hooks */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { handleError, parseVariantInfo } from '@/lib/utils'
import { TypeProduct } from '@/constants/product'
import type { DraftItemDetailType } from '@/schemaValidations/draft-item.schema'
import { useAllDraftItemsQuery, useChangeDraftItemStatusMutation } from '@/queries/useDraftItem'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { DraftItemStatusValues, type DraftItemStatusType } from '@/constants/draft-item'
import { formatDraftItemStatusColor, formatDraftItemStatusText, formatOrderTypeText } from '@/lib/format'
import { OrderType } from '@/constants/order'

export function DraftCard({ drafts }: { drafts: DraftItemDetailType[] }) {
  if (!drafts || drafts.length === 0) return null
  const firstDraft = drafts[0]
  const { data: allDraftItems } = useAllDraftItemsQuery({ draftCode: firstDraft.draftCode + '-term' })
  const tempDraftMap = new Map()
  if (allDraftItems?.data?.data) {
    allDraftItems.data.data.forEach((tempDraft: DraftItemDetailType) => {
      tempDraftMap.set(tempDraft.variantId, tempDraft)
    })
  }

  const changeDraftItemStatus = useChangeDraftItemStatusMutation()
  const handleChangeStatus = async (draftItemId: number, status: DraftItemStatusType) => {
    if (changeDraftItemStatus.isPending) return
    try {
      await changeDraftItemStatus.mutateAsync({ draftItemId, body: { status } })
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <Card className='w-full max-w-md shadow-sm mb-4'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base font-semibold'>#{firstDraft.draftCode}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className='text-sm text-gray-700'>
        <div className='flex flex-col gap-1 mb-3'>
          <div className='flex items-center justify-between gap-2'>
            <span className='font-sm'>Loại đơn hàng:</span>
            <span className='font-medium'>
              {formatOrderTypeText(firstDraft.draftCode.includes('takeaway') ? OrderType.Takeaway : OrderType.DineIn)}
            </span>
          </div>
          {firstDraft.tables && firstDraft.tables.length > 0 && (
            <div className='flex items-center justify-between gap-2'>
              <span className='font-sm'>Danh sách bàn:</span>
              <span className='font-medium'>[{firstDraft.tables.map((table) => `#${table.code}`).join(', ')}]</span>
            </div>
          )}
        </div>

        <h4 className='font-semibold mb-2'>Sản phẩm ({drafts.length})</h4>
        <div className='space-y-3'>
          {drafts.map((draft, index) => {
            const tempDraft = tempDraftMap.get(draft.variantId)
            const currentStatus = tempDraft ? tempDraft.status : draft.status
            const currentDraftItemId = tempDraft ? tempDraft.id : draft.id
            const nameTerm = draft.variant.product.name

            return (
              <div key={index}>
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex-1'>
                    {(() => {
                      if (!draft.variant) {
                        return (
                          <span className='text-sm text-gray-800 font-semibold'>
                            x{draft.quantity} {nameTerm}
                          </span>
                        )
                      } else {
                        if (!draft.variant.product) {
                          return (
                            <div>
                              <span className='text-sm text-gray-800 font-semibold'>
                                x{draft.quantity} {nameTerm}
                              </span>
                              {draft.variant.value !== 'default' && (
                                <span className='text-sm text-gray-600'>Type: {draft.variant.value}</span>
                              )}
                            </div>
                          )
                        }
                        const variantInfo = parseVariantInfo(draft.variant.value, draft.variant.product.variantsConfig)
                        if (!variantInfo || variantInfo.length === 0) {
                          return (
                            <div>
                              <p className='text-sm text-gray-800 font-semibold'>
                                x{draft.quantity} {nameTerm}
                              </p>
                              {draft.variant.product.type === TypeProduct.FixedCombo ? (
                                <div
                                  dangerouslySetInnerHTML={{ __html: draft.variant.product.shortDescription }}
                                  className='text-sm text-gray-600 ml-4'
                                />
                              ) : (
                                <>
                                  {draft.variant.value !== 'default' && (
                                    <span className='text-sm text-gray-600'>Type: {draft.variant.value}</span>
                                  )}
                                </>
                              )}
                            </div>
                          )
                        }
                        return (
                          <>
                            <p className='text-sm text-gray-800 font-semibold'>
                              x{draft.quantity} {nameTerm}
                            </p>
                            {variantInfo.map((info) => (
                              <div className='pl-4'>
                                <span key={info.type} className='text-sm text-gray-600'>
                                  {info.type}: {info.value}
                                </span>
                              </div>
                            ))}
                          </>
                        )
                      }
                    })()}
                    {tempDraft && tempDraft.quantity > 0 && (
                      <p className='font-medium text-sm text-orange-600 mt-1'>+{tempDraft.quantity} (Gọi thêm)</p>
                    )}
                  </div>
                  <Select
                    onValueChange={(value) => handleChangeStatus(currentDraftItemId, value as DraftItemStatusType)}
                    defaultValue={currentStatus}
                    value={currentStatus}
                  >
                    <SelectTrigger
                      className='p-0 border-none shadow-none hover:shadow-none focus:shadow-none cursor-pointer'
                      hasIcon={false}
                    >
                      <span className={formatDraftItemStatusColor({ status: currentStatus })}>
                        {formatDraftItemStatusText(currentStatus)}
                      </span>
                    </SelectTrigger>

                    <SelectContent>
                      {DraftItemStatusValues.map((value) => (
                        <SelectItem key={value} value={value}>
                          {formatDraftItemStatusText(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
