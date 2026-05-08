'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ──────────────────────────────────────────────────────────

export interface MenuItemData {
  id?: number
  name: string
  price: number
  category: 'DRINK' | 'FOOD'
  description: string | null
  sortOrder: number
}

interface MenuItemFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editItem?: MenuItemData | null
}

// ─── MenuItemForm ───────────────────────────────────────────────────

export default function MenuItemForm({
  isOpen,
  onClose,
  onSuccess,
  editItem,
}: MenuItemFormProps) {
  const isEdit = !!editItem?.id

  // ─── Form state ───────────────────────────────────────────────
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState<'DRINK' | 'FOOD'>('DRINK')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState('0')

  // ─── Validation errors ────────────────────────────────────────
  const [nameError, setNameError] = useState<string | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)

  // ─── Submit state ──────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ─── Animation state ─────────────────────────────────────────
  const [visible, setVisible] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  // ─── Populate form when editing ───────────────────────────────
  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setName(editItem.name)
        setPrice(String(editItem.price))
        setCategory(editItem.category)
        setDescription(editItem.description ?? '')
        setSortOrder(String(editItem.sortOrder))
      } else {
        setName('')
        setPrice('')
        setCategory('DRINK')
        setDescription('')
        setSortOrder('0')
      }
      setNameError(null)
      setPriceError(null)
      setSubmitError(null)
      requestAnimationFrame(() => {
        setVisible(true)
        setTimeout(() => nameRef.current?.focus(), 300)
      })
    }
  }, [isOpen, editItem])

  // ─── Close with exit animation ────────────────────────────────
  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(() => onClose(), 200)
  }, [onClose])

  // ─── Click outside → dismiss ──────────────────────────────────
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) handleClose()
    },
    [handleClose],
  )

  // ─── Validate ─────────────────────────────────────────────────
  const validate = useCallback((): boolean => {
    let valid = true
    if (!name.trim()) {
      setNameError('Tên món không được để trống')
      valid = false
    } else {
      setNameError(null)
    }
    const priceNum = parseInt(price, 10)
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      setPriceError('Giá phải lớn hơn 0')
      valid = false
    } else {
      setPriceError(null)
    }
    return valid
  }, [name, price])

  // ─── Submit ───────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validate()) return

    setSubmitting(true)
    setSubmitError(null)

    const payload = {
      name: name.trim(),
      price: parseInt(price, 10),
      category,
      description: description.trim() || null,
      sortOrder: parseInt(sortOrder, 10) || 0,
    }

    try {
      const url = isEdit
        ? `/api/admin/menu/${editItem!.id}`
        : '/api/admin/menu'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.error ?? `Lỗi ${isEdit ? 'cập nhật' : 'tạo'} món (${res.status})`)
        return
      }

      const data = await res.json()
      console.log(
        `[MenuItemForm] ${isEdit ? 'Updated' : 'Created'} menu item: ${data.item?.name}`,
      )
      onSuccess()
      handleClose()
    } catch (err) {
      console.error('[MenuItemForm] Submit error:', err)
      setSubmitError('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }, [validate, name, price, category, description, sortOrder, isEdit, editItem, onSuccess, handleClose])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-colors duration-200
        ${visible ? 'bg-black/40' : 'bg-black/0'}
      `}
      style={{ transitionProperty: 'background-color' }}
    >
      {/* ─── Modal ───────────────────────────────────────────── */}
      <div
        className={`
          w-full max-w-lg bg-white rounded-3xl
          overflow-hidden flex flex-col
          ${visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
        style={{
          maxHeight: '90vh',
          transitionProperty: 'transform, opacity',
          transitionTimingFunction: visible
            ? 'cubic-bezier(0.16, 1, 0.3, 1)'
            : 'cubic-bezier(0.4, 0, 1, 1)',
          transitionDuration: visible ? '300ms' : '200ms',
        }}
      >
        {/* ─── Drag handle + Header ──────────────────────────── */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
          <div className="flex items-center justify-between px-5 pb-3">
            <h2 className="text-xl font-bold text-gray-900" style={{ textWrap: 'balance' }}>
              {isEdit ? 'Sửa món' : 'Thêm món mới'}
            </h2>
            <button
              onClick={handleClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors active:scale-[0.96]"
              aria-label="Đóng"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ─── Scrollable form body ──────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 bg-gray-50">
          {/* Name */}
          <div className="mb-4">
            <label htmlFor="menu-name" className="block text-sm font-bold text-gray-700 mb-2">
              Tên món <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              id="menu-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (nameError) setNameError(null) }}
              placeholder="VD: Trà sữa trân châu"
              className={`
                w-full rounded-xl border-2 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400
                focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200
                ${nameError ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'}
              `}
              style={{ minHeight: 48 }}
            />
            {nameError && <p className="mt-2 text-sm text-red-600 font-medium">{nameError}</p>}
          </div>

          {/* Price */}
          <div className="mb-4">
            <label htmlFor="menu-price" className="block text-sm font-bold text-gray-700 mb-2">
              Giá (VNĐ) <span className="text-red-500">*</span>
            </label>
            <input
              id="menu-price"
              type="number"
              inputMode="numeric"
              value={price}
              onChange={(e) => { setPrice(e.target.value); if (priceError) setPriceError(null) }}
              placeholder="VD: 35000"
              className={`
                w-full rounded-xl border-2 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400
                focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200
                ${priceError ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'}
              `}
              style={{ minHeight: 48, fontVariantNumeric: 'tabular-nums' }}
            />
            {priceError && <p className="mt-2 text-sm text-red-600 font-medium">{priceError}</p>}
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Danh mục</label>
            <div className="inline-flex w-full rounded-2xl bg-white shadow-sm border border-gray-200 p-1.5">
              {(['DRINK', 'FOOD'] as const).map((cat) => {
                const isActive = category === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`
                      flex-1 rounded-xl px-5 py-3 text-base font-bold
                      transition-all duration-200 ease-out
                      ${
                        isActive
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                    style={{ minHeight: 48 }}
                  >
                    {cat === 'DRINK' ? 'Đồ uống' : 'Đồ ăn'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label htmlFor="menu-desc" className="block text-sm font-bold text-gray-700 mb-2">
              Mô tả <span className="text-gray-500 font-normal text-sm">(tuỳ chọn)</span>
            </label>
            <textarea
              id="menu-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về món"
              rows={3}
              className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 resize-none"
            />
          </div>

          {/* Sort Order */}
          <div className="mb-2">
            <label htmlFor="menu-sort" className="block text-sm font-bold text-gray-700 mb-2">
              Thứ tự <span className="text-gray-500 font-normal text-sm">(mặc định: 0)</span>
            </label>
            <input
              id="menu-sort"
              type="number"
              inputMode="numeric"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              style={{ minHeight: 48, fontVariantNumeric: 'tabular-nums' }}
            />
          </div>
        </div>

        {/* ─── Footer ───────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-5 py-4">
          {submitError && (
            <p className="text-sm text-red-600 mb-3 bg-red-50 rounded-xl px-4 py-3 border border-red-200">
              {submitError}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 min-h-[52px] rounded-2xl bg-white border-2 border-gray-200 text-gray-700 font-bold text-base hover:bg-gray-50 transition-colors active:scale-[0.96] disabled:opacity-50"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-[2] min-h-[52px] rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-base hover:shadow-xl hover:shadow-emerald-500/40 shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {isEdit ? 'Đang lưu…' : 'Đang tạo…'}
                </span>
              ) : isEdit ? (
                'Lưu thay đổi'
              ) : (
                'Tạo món mới'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
