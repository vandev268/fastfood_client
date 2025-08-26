import { useAppContext } from '@/components/AppProvider'
import QuantityController from '@/components/QuantityController'
import { Button } from '@/components/ui/button'
import { generateNameId, handleError, parseVariantInfo } from '@/lib/utils'
import { useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { produce } from 'immer'
import keyBy from 'lodash/keyBy'
import type { CartItemDetailType } from '@/schemaValidations/cart.schema'
import Config from '@/constants/config'
import { useAllCartItemsQuery, useDeleteCartItemsMutation, useUpdateCartItemMutation } from '@/queries/useCart'
import { formatCurrency } from '@/lib/format'

export default function Cart() {
  const navigate = useNavigate()
  const location = useLocation()
  const cartItemId = location.state?.cartItemId as number | undefined
  const { extendedCartItems, setExtendedCartItems } = useAppContext()

  const cartItemsQuery = useAllCartItemsQuery({ enabled: true })
  const cartItems = cartItemsQuery.data?.data.data || []

  useEffect(() => {
    if (cartItemsQuery.data) {
      const cartItems = cartItemsQuery.data.data.data
      setExtendedCartItems((prev) => {
        const extendedCartItemsObj = keyBy(prev, 'id') // keyBy tạo ra một object với key là value của object truyền vào. keyBy(prev, 'id') sẽ tạo ra một object với key là id. id: {...item}

        return cartItems.map((item) => {
          const isCartItemBuyNow = cartItemId === item.id
          return {
            ...item,
            checked: isCartItemBuyNow || Boolean(extendedCartItemsObj[item.id]?.checked),
            disabled: false
          }
        })
      })
    }
  }, [cartItemsQuery.data, setExtendedCartItems, cartItemId])

  useEffect(() => {
    return () => {
      history.replaceState(null, '')
    }
  }, [])

  const isAllChecked = useMemo(() => extendedCartItems.every((item) => item.checked), [extendedCartItems])
  const cartItemsChecked = useMemo(() => extendedCartItems.filter((item) => item.checked), [extendedCartItems])
  const handleChecked = (cartItemIndex: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setExtendedCartItems(
      produce((draft) => {
        draft[cartItemIndex].checked = event.target.checked
      }) // produce đơn giản hóa việc cập nhật state trong React
    )
  }
  const handleAllChecked = () => {
    setExtendedCartItems(
      produce((draft) => {
        draft.forEach((item) => {
          item.checked = !isAllChecked
        })
      })
    )
  }

  const handleTypeQuantity = (cartItemIndex: number) => (value: number) => {
    setExtendedCartItems(
      produce((draft) => {
        draft[cartItemIndex].quantity = value
      })
    )
  }

  const updateCartItemMutation = useUpdateCartItemMutation()
  const handleQuantityChange = async (cartItemIndex: number, quantity: number, enable: boolean) => {
    if (updateCartItemMutation.isPending) return
    if (enable) {
      const cartItem = extendedCartItems[cartItemIndex]
      setExtendedCartItems(
        produce((draft) => {
          draft[cartItemIndex].disabled = true
        })
      )
      try {
        const payload = {
          cartItemId: cartItem.id,
          body: {
            variantId: cartItem.variant.id,
            quantity: quantity
          }
        }
        await updateCartItemMutation.mutateAsync(payload)
      } catch (error) {
        console.error('Error updating cart item:', error)
        handleError(error)
      }
    }
  }

  const deleteCartItemMutation = useDeleteCartItemsMutation()
  const handleDeleteCartItem = async (cartItemId: number) => {
    if (deleteCartItemMutation.isPending) return
    try {
      await deleteCartItemMutation.mutateAsync({
        cartItemIds: [cartItemId]
      })
      return
    } catch (error) {
      handleError(error)
    }
  }
  const handleDeleteCartItems = async () => {
    if (deleteCartItemMutation.isPending) return
    try {
      await deleteCartItemMutation.mutateAsync({
        cartItemIds: cartItemsChecked.map((item) => item.id)
      })
    } catch (error) {
      handleError(error)
    }
  }

  const handleCheckout = () => {
    if (cartItemsChecked.length > 0) {
      navigate('/checkout', {
        state: {
          cartItems: cartItemsChecked
        }
      })
    }
  }

  return (
    <div className='bg-neutral-50 py-4'>
      <div className='max-w-6xl mx-auto px-4'>
        {extendedCartItems.length > 0 ? (
          <>
            <div className='overflow-auto'>
              <div className='min-w-[1000px]'>
                <div className='grid grid-cols-12 rounded-sm bg-white py-5 px-9 text-sm capitalize text-gray-500 shadow'>
                  <div className='col-span-6'>
                    <div className='flex items-center'>
                      <div className='flex flex-shrink-0 items-center justify-center pr-3'>
                        <input
                          type='checkbox'
                          className='h-5 w-5 accent-primary'
                          checked={isAllChecked}
                          onChange={handleAllChecked}
                        />
                      </div>
                      <div className='flex-grow text-black'>Sản phẩm</div>
                    </div>
                  </div>
                  <div className='col-span-6'>
                    <div className='grid grid-cols-5 text-center'>
                      <div className='col-span-2'>Đơn giá</div>
                      <div className='col-span-1'>Số lượng</div>
                      <div className='col-span-1'>Số tiền</div>
                      <div className='col-span-1'>Thao tác</div>
                    </div>
                  </div>
                </div>
                <div className='my-3 rounded-sm bg-white p-5 shadow'>
                  {extendedCartItems?.map((item, index) => (
                    <div
                      key={item.id}
                      className='mb-5 grid grid-cols-12 rounded-sm border border-gray-200 bg-white py-5 px-4 text-center text-sm text-gray-500 first:mt-0 items-center'
                    >
                      <div className='col-span-6'>
                        <div className='flex'>
                          <div className='flex flex-shrink-0 items-center justify-center pr-3'>
                            <input
                              type='checkbox'
                              className='h-5 w-5 accent-primary'
                              checked={item.checked}
                              onChange={handleChecked(index)}
                            />
                          </div>
                          <div className='flex-grow'>
                            <div className='flex items-center gap-3'>
                              <Link
                                className='h-20 w-20 flex-shrink-0'
                                to={`/products/${generateNameId({
                                  name: item.variant.product.name,
                                  id: item.variant.product.id
                                })}`}
                              >
                                <img
                                  alt={item.variant.product.name}
                                  src={item.variant.thumbnail || item.variant.product.images[0] || Config.ImageBaseUrl}
                                />
                              </Link>
                              <div className='px-2 pt-1 pb-2 flex flex-col items-start'>
                                <Link
                                  to={`/products/${generateNameId({
                                    name: item.variant.product.name,
                                    id: item.variant.product.id
                                  })}`}
                                  className='line-clamp-2 text-lg font-semibold text-gray-900'
                                >
                                  {item.variant.product.name}
                                </Link>
                                <div className='mt-1 flex flex-col items-start'>
                                  {(() => {
                                    const variantInfo = parseVariantInfo(
                                      item.variant.value,
                                      item.variant.product.variantsConfig
                                    )
                                    if (!variantInfo || variantInfo.length === 0) {
                                      return (
                                        <span className='text-[0.8rem] text-gray-600'>Type: {item.variant.value}</span>
                                      )
                                    }
                                    return variantInfo.map((info) => (
                                      <span key={info.type} className='text-[0.8rem] text-gray-600'>
                                        {info.type}: {info.value}
                                      </span>
                                    ))
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className='col-span-6'>
                        <div className='grid grid-cols-5 items-center'>
                          <div className='col-span-2'>
                            <div className=''>
                              <span className='ml-3'>{formatCurrency(item.variant.price)}</span>
                            </div>
                          </div>
                          <div className='col-span-1'>
                            <QuantityController
                              max={item.variant.stock}
                              value={item.quantity}
                              onIncrease={(value) => handleQuantityChange(index, value, value <= item.variant.stock)}
                              onDecrease={(value) => handleQuantityChange(index, value, value >= 1)}
                              onType={handleTypeQuantity(index)}
                              onFocusOut={(value) =>
                                handleQuantityChange(
                                  index,
                                  value,
                                  value >= 1 &&
                                    value <= item.variant.stock &&
                                    value !== (cartItems as CartItemDetailType[])[index].quantity
                                )
                              }
                              disabled={item.disabled}
                              classNameWrapper='flex items-center'
                            />
                          </div>
                          <div className='col-span-1'>
                            <span className='text-primary'>{formatCurrency(item.variant.price * item.quantity)}</span>
                          </div>
                          <div className='col-span-1'>
                            <button
                              className='bg-none text-black transition-colors hover:text-primary'
                              onClick={() => handleDeleteCartItem(item.id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className='sticky bottom-0 z-10 mt-8 flex flex-col rounded-sm border border-gray-100 bg-white p-5 shadow sm:flex-row sm:items-center'>
              <div className='flex items-center'>
                <div className='flex flex-shrink-0 items-center justify-center pr-3'>
                  <input
                    type='checkbox'
                    className='h-5 w-5 accent-primary'
                    checked={isAllChecked}
                    onChange={handleAllChecked}
                  />
                </div>
                <button className='mx-3 border-none bg-none' onClick={handleAllChecked}>
                  Chọn tất cả ({extendedCartItems.length} sản phẩm)
                </button>
                <button className='mx-3 border-none bg-none cursor-pointer' onClick={handleDeleteCartItems}>
                  Xóa
                </button>
              </div>

              <div className='mt-5 flex flex-col sm:ml-auto sm:mt-0 sm:flex-row sm:items-center'>
                <div>
                  <div className='flex items-center sm:justify-end'>
                    <div>Tổng thanh toán ({cartItemsChecked.length} sản phẩm):</div>
                    <div className='ml-2 text-2xl text-primary'>
                      {formatCurrency(
                        cartItemsChecked.reduce((total, cur) => {
                          return total + cur.variant.price * cur.quantity
                        }, 0)
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  className='mt-5 flex h-10 w-52 items-center justify-center text-sm uppercase sm:ml-4 sm:mt-0'
                  onClick={handleCheckout}
                >
                  Mua hàng
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className='text-center'>
            <img src={Config.NoProductImage} alt='no purchase' className='mx-auto h-24 w-24' />
            <div className='mt-5 font-semibold text-gray-600'>Giỏ hàng của bạn còn trống</div>
            <div className='mt-8 text-center'>
              <Link
                to='/'
                className='font-semibold rounded-sm bg-primary text-white px-10 py-2 uppercase transition-all hover:bg-primary/80'
              >
                Mua ngay
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
