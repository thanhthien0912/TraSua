const vndFormatter = new Intl.NumberFormat('vi-VN')

/**
 * Format a VND price integer into a human-readable string.
 * Example: 45000 → '45,000đ'
 */
export function formatVND(price: number): string {
  return `${vndFormatter.format(price)}đ`
}
