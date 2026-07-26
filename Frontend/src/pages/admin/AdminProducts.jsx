import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import { useToast } from '../../context/ToastContext'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { resolveImage, formatPrice, extractErrorMessage } from '../../utils/helpers'

const emptyForm = {
  name: '', description: '', brand: '', category: '', price: '', stock: '',
  sku: '', is_featured: false, is_active: true, image: null,
}

const STEPS = [
  { id: 1, label: 'Basics & media' },
  { id: 2, label: 'Pricing & inventory' },
  { id: 3, label: 'Visibility & summary' },
]

export default function AdminProducts() {
  const { notify } = useToast()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')

  const [editing, setEditing] = useState(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null)

  useEffect(() => {
    if (!form.image) {
      setImagePreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(form.image)
    setImagePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [form.image])

  function load() {
    setLoading(true)
    return Promise.all([api.get('/products/'), api.get('/brands/'), api.get('/categories/')])
      .then(([p, b, c]) => {
        setProducts(p.data.products)
        setBrands(b.data.brands)
        setCategories(c.data.categories)
      })
      .catch(() => notify('Could not load products.', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const brandMap = useMemo(() => Object.fromEntries(brands.map((b) => [b.id, b.name])), [brands])
  const categoryMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
  }, [products, search])

  function openCreate() {
    setForm({ ...emptyForm, brand: brands[0]?.id || '', category: categories[0]?.id || '' })
    setError(null)
    setStep(1)
    setEditing('new')
  }

  function openEdit(product) {
    setForm({
      name: product.name || '',
      description: product.description || '',
      brand: product.brand || '',
      category: product.category || '',
      price: product.price ?? '',
      stock: product.stock ?? '',
      sku: product.sku || '',
      is_featured: Boolean(product.is_featured),
      is_active: Boolean(product.is_active),
      image: null,
    })
    setError(null)
    setStep(1)
    setEditing(product)
  }

  const step1Valid = form.name.trim().length > 0 && form.brand && form.category && form.description.trim().length > 0
  const step2Valid = form.price !== '' && Number(form.price) > 0 && form.stock !== '' && Number(form.stock) >= 0 && form.sku.trim().length > 0

  function goNext() {
    setStep((s) => Math.min(3, s + 1))
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const payload = new FormData()
    payload.append('name', form.name)
    payload.append('description', form.description)
    payload.append('brand', form.brand)
    payload.append('category', form.category)
    payload.append('price', form.price)
    payload.append('stock', form.stock)
    payload.append('sku', form.sku)
    payload.append('is_featured', form.is_featured)
    payload.append('is_active', form.is_active)
    if (form.image) {
      payload.append('image', form.image, form.image.name)
    }

    try {
      if (editing === 'new') {
        await api.post('/products/create/', payload)
        notify('Product created.', 'success')
      } else {
        await api.patch(`/products/${editing.id}/update/`, payload)
        notify('Product updated.', 'success')
      }
      setEditing(null)
      await load()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function toggleFeatured(product) {
    try {
      await api.patch(`/products/${product.id}/update/`, { is_featured: !product.is_featured })
      notify(`${product.name} ${!product.is_featured ? 'is now featured' : 'removed from featured'}.`, 'success')
      load()
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  async function toggleActive(product) {
    try {
      await api.patch(`/products/${product.id}/update/`, { is_active: !product.is_active })
      notify(
        !product.is_active
          ? `${product.name} is active again.`
          : `${product.name} deactivated — it will disappear from this list too (the API only lists active products).`,
        'success'
      )
      load()
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  async function confirmDelete() {
    setBusy(true)
    try {
      await api.delete(`/products/${deleteTarget.id}/delete/`)
      notify('Product deleted.', 'success')
      setDeleteTarget(null)
      await load()
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="page-head page-head--row">
        <div>
          <h1>Products</h1>
          <p>{products.length} active</p>
        </div>
        <button className="btn" onClick={openCreate} disabled={brands.length === 0 || categories.length === 0}>
          + New product
        </button>
      </div>

      {(brands.length === 0 || categories.length === 0) && (
        <div className="alert alert--info">Create at least one brand and one category before adding products.</div>
      )}

      <input
        className="table-search"
        type="search"
        placeholder="Search by name or SKU…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <Loader label="Loading products" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No products found" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Brand / Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Featured</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.image ? (
                    <img className="table-thumb" src={resolveImage(p.image)} alt="" />
                  ) : (
                    <div className="table-thumb table-thumb--empty" />
                  )}
                </td>
                <td>
                  <div className="data-table__strong">{p.name}</div>
                  <div className="data-table__muted" style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
                    SKU: {p.sku || 'N/A'}
                  </div>
                </td>
                <td className="data-table__muted">{brandMap[p.brand] || '—'} · {categoryMap[p.category] || '—'}</td>
                <td className="data-table__strong">{formatPrice(p.price)}</td>
                <td className={p.stock <= 0 ? 'data-table__warn' : ''}>{p.stock}</td>
                <td>
                  <button
                    className={`badge-btn ${p.is_featured ? 'badge-btn--ok' : 'badge-btn--off'}`}
                    onClick={() => toggleFeatured(p)}
                  >
                    {p.is_featured ? 'Featured' : 'Standard'}
                  </button>
                </td>
                <td>
                  <button
                    className={`badge-btn ${p.is_active ? 'badge-btn--ok' : 'badge-btn--off'}`}
                    onClick={() => toggleActive(p)}
                  >
                    {p.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="data-table__actions">
                  <button className="link-btn" onClick={() => openEdit(p)}>Edit</button>
                  <button className="link-btn link-btn--danger" onClick={() => setDeleteTarget(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'New product' : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          {/* Main Container Fix: minWidth hata diya aur overflowX hidden kar diya */}
          <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
            <form className="panel-form wizard-form" onSubmit={handleSubmit} autoComplete="off" style={{ width: '100%', overflowX: 'hidden' }}>
              {error && <div className="alert alert--error">{error}</div>}

              {/* Wizard steps horizontal overflow fix */}
              <ol className="wizard-steps" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', width: '100%', padding: 0, overflowX: 'hidden' }}>
                {STEPS.map((s) => (
                  <li
                    key={s.id}
                    className={
                      'wizard-step' +
                      (step === s.id ? ' wizard-step--active' : '') +
                      (step > s.id ? ' wizard-step--done' : '')
                    }
                    style={{ flex: '1 1 auto', minWidth: '120px' }}
                  >
                    <span className="wizard-step__number">{step > s.id ? '✓' : s.id}</span>
                    <span className="wizard-step__label">{s.label}</span>
                  </li>
                ))}
              </ol>

              {step === 1 && (
                <div className="form-section">
                  <label htmlFor="product-name-input">
                    Product name
                    <input
                      type="text"
                      id="product-name-input"
                      name="product_item_name"
                      autoComplete="new-password"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </label>

                  {/* Clean vertical image layout to prevent right side overflow */}
                  <div style={{ marginTop: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="product-image-input">
                      Product image
                      <input
                        id="product-image-input"
                        type="file"
                        accept="image/*"
                        style={{ width: '100%', boxSizing: 'border-box' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setForm({ ...form, image: file })
                        }}
                      />
                    </label>

                    <div className="form-preview" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {imagePreviewUrl ? (
                        <>
                          <img src={imagePreviewUrl} alt="Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                          <button
                            type="button"
                            className="link-btn link-btn--danger"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => setForm({ ...form, image: null })}
                          >
                            Remove
                          </button>
                        </>
                      ) : editing !== 'new' && editing?.image ? (
                        <img src={resolveImage(editing.image)} alt="Current" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                      ) : (
                        <span className="form-preview__empty" style={{ fontSize: '0.8rem', color: '#888' }}>No image</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    <label htmlFor="product-brand-select" style={{ flex: '1 1 200px' }}>
                      Brand
                      <select
                        id="product-brand-select"
                        name="product_item_brand"
                        required
                        value={form.brand}
                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      >
                        {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </label>
                    <label htmlFor="product-category-select" style={{ flex: '1 1 200px' }}>
                      Category
                      <select
                        id="product-category-select"
                        name="product_item_category"
                        required
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      >
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </label>
                  </div>

                  <label htmlFor="product-description-input" style={{ marginTop: '1rem', display: 'block' }}>
                    Description
                    <textarea
                      id="product-description-input"
                      rows={3}
                      required
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="form-section">
                  <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    <label htmlFor="product-price-input" style={{ flex: '1 1 200px' }}>
                      Price
                      <input
                        id="product-price-input"
                        type="number" step="0.01" min="0.01" required
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label htmlFor="product-stock-input" style={{ flex: '1 1 200px' }}>
                      Stock
                      <input
                        id="product-stock-input"
                        type="number" min="0" required
                        value={form.stock}
                        onChange={(e) => setForm({ ...form, stock: e.target.value })}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </label>
                  </div>

                  <label htmlFor="product-sku-input" style={{ marginTop: '1rem', display: 'block' }}>
                    SKU
                    <input
                      type="text"
                      id="product-sku-input"
                      name="product_item_sku"
                      autoComplete="new-password"
                      required
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </label>

                  {form.price !== '' && form.stock !== '' && (
                    <div className="wizard-hint">
                      {form.stock > 0
                        ? `${form.stock} units at ${formatPrice(form.price || 0)} each.`
                        : 'Stock is 0 — this product will show as out of stock until you restock it.'}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="form-section">
                  <div className="form-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={form.is_featured}
                        onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                      />
                      Featured on the storefront
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      />
                      Active
                    </label>
                  </div>

                  <div className="wizard-summary">
                    <span className="wizard-summary__title">Ready to save</span>
                    <div className="wizard-summary__row"><span>Name</span><span>{form.name || '—'}</span></div>
                    <div className="wizard-summary__row"><span>Brand / Category</span><span>{brandMap[form.brand] || '—'} · {categoryMap[form.category] || '—'}</span></div>
                    <div className="wizard-summary__row"><span>Price</span><span>{form.price ? formatPrice(form.price) : '—'}</span></div>
                    <div className="wizard-summary__row"><span>SKU</span><span>{form.sku || '—'}</span></div>
                    <div className="wizard-summary__row">
                      <span>Image</span>
                      <span>
                        {form.image ? form.image.name : editing !== 'new' && editing?.image ? 'Existing image attached' : 'No image'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions form-actions--wizard">
                {step > 1 ? (
                  <button type="button" className="btn btn--ghost" onClick={goBack}>← Back</button>
                ) : (
                  <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={goNext}
                    disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                  >
                    Next →
                  </button>
                ) : (
                  <button type="submit" className="btn" disabled={busy}>
                    {busy ? 'Saving…' : editing === 'new' ? 'Create product' : 'Save changes'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete product"
          message={`Delete "${deleteTarget.name}"? This can't be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          busy={busy}
        />
      )}
    </div>
  )
}