import { SERVER_ORIGIN } from '../api/axios'

// The API returns absolute image URLs when it can, but if a relative
// path ever slips through, this makes sure it still resolves.
export function resolveImage(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${SERVER_ORIGIN}${path}`
}

export function formatPrice(value) {
  const num = Number(value)
  if (Number.isNaN(num)) return value
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

// DRF error payloads are inconsistent (errors / error / detail / field-level
// arrays), this flattens whatever shape comes back into one readable string.
export function extractErrorMessage(err) {
  const data = err?.response?.data
  if (!data) return err?.message || 'Something went wrong. Please try again.'
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  if (data.message && !data.errors && !data.error) return data.message

  const fieldErrors = data.errors || data.error
  if (fieldErrors) {
    if (typeof fieldErrors === 'string') return fieldErrors
    const parts = Object.entries(fieldErrors).map(([field, msgs]) => {
      const text = Array.isArray(msgs) ? msgs.join(' ') : msgs
      return field === 'non_field_errors' ? text : `${field}: ${text}`
    })
    return parts.join(' | ')
  }

  return data.message || 'Something went wrong. Please try again.'
}
