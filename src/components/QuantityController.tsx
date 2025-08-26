import { useEffect, useState } from 'react'
import type { InputNumberProps } from './InputNumber'
import InputNumber from './InputNumber'

interface Props extends InputNumberProps {
  max?: number
  onIncrease?: (value: number) => void
  onDecrease?: (value: number) => void
  onType?: (value: number) => void
  onFocusOut?: (value: number) => void
  classNameWrapper?: string
}

export default function QuantityController({
  max,
  onIncrease,
  onDecrease,
  onType,
  onFocusOut,
  classNameWrapper = 'ml-10',
  value,
  ...rest
}: Props) {
  const [localValue, setLocalValue] = useState<number | string>(Number(value || 0))
  const [isEmpty, setIsEmpty] = useState(false)

  useEffect(() => {
    if (value === 0) {
      setLocalValue(0)
    } else {
      setLocalValue(Number(value || 0))
    }
  }, [value])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value

    // Nếu input trống
    if (inputValue === '' || inputValue === '0') {
      setIsEmpty(true)
      setLocalValue('')
      return
    }

    setIsEmpty(false)
    let _value = Number(inputValue)

    // Chỉ kiểm tra max, không giới hạn min để cho phép nhập các số
    if (max !== undefined && _value > max) {
      _value = max
      // Cập nhật giá trị hiển thị thành max luôn
      setLocalValue(_value)
    } else {
      // Giữ nguyên giá trị người dùng nhập vào
      setLocalValue(inputValue)
    }

    if (onType) {
      // Đảm bảo giá trị truyền ra là số hợp lệ
      onType(_value > 0 ? _value : 1)
    }
  }

  const increase = () => {
    setIsEmpty(false)
    // Nếu input đang rỗng, đặt giá trị thành 1 thay vì tăng
    let _value = isEmpty ? 1 : Number(localValue) + 1

    if (max !== undefined && _value > max) {
      _value = max
    }

    if (onIncrease) {
      onIncrease(_value)
    }
    setLocalValue(_value)
  }

  const decrease = () => {
    setIsEmpty(false)
    let _value = Number(localValue) - 1
    if (_value < 1) {
      _value = 1
    }
    if (value === 0) {
      _value = 0
    }
    if (onDecrease) {
      onDecrease(_value)
    }
    setLocalValue(_value)
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement, Element>) => {
    const inputValue = event.target.value
    let finalValue: number

    // Nếu input trống hoặc giá trị < 1, đặt lại thành 1
    if (inputValue === '' || Number(inputValue) < 1) {
      finalValue = 1
    } else {
      // Chuyển đổi về số
      finalValue = Number(inputValue)

      // Kiểm tra nếu vượt quá max
      if (max !== undefined && finalValue > max) {
        finalValue = max
      }
    }

    // Cập nhật giá trị và trạng thái
    setLocalValue(finalValue)
    // setIsEmpty(false)

    if (onFocusOut) {
      onFocusOut(finalValue)
    }
  }

  return (
    <div className={'flex items-center ' + classNameWrapper}>
      <button
        className='flex h-8 w-8 items-center justify-center rounded-l-sm border border-gray-300 text-gray-600'
        onClick={decrease}
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='currentColor'
          className='h-4 w-4'
        >
          <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 12h-15' />
        </svg>
      </button>
      <InputNumber
        className=''
        classNameError='hidden'
        classNameInput='h-8 w-14 border-t border-b border-gray-300 p-1 text-center outline-none'
        onChange={handleChange}
        onBlur={handleBlur}
        value={localValue}
        {...rest}
      />
      <button
        className='flex h-8 w-8 items-center justify-center rounded-r-sm border border-gray-300 text-gray-600'
        onClick={increase}
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='currentColor'
          className='h-4 w-4'
        >
          <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
        </svg>
      </button>
    </div>
  )
}
