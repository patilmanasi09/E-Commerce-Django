import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import { resolveImage, formatPrice, extractErrorMessage } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [brand, setBrand] = useState(null)
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)

  const { isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const { notify } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setQuantity(1)

    api.get(`/products/${id}/`)
      .then(async ({ data }) => {
        if (cancelled) return
        const p = data.product
        setProduct(p)

        const [brandRes, categoryRes] = await Promise.allSettled([
          api.get(`/brands/${p.brand}/`),
          api.get(`/categories/${p.category}/`),
        ])
        if (cancelled) return
        if (brandRes.status === 'fulfilled') setBrand(brandRes.value.data.brand)
        if (categoryRes.status === 'fulfilled') setCategory(categoryRes.value.data.category)
      })
      .catch(() => !cancelled && setNotFound(true))
      .finally(() => !cancelled && setLoading(false))

    return () => { cancelled = true }
  }, [id])

  if (loading) return <Loader label="Fetching product" />

  if (notFound || !product) {
    return (
      <div className="container">
        <EmptyState title="Product not found" hint="It may be inactive or the ID doesn't exist." />
        <Link to="/products" className="btn btn--ghost">← Back to catalog</Link>
      </div>
    )
  }

  const outOfStock = product.stock <= 0

  async function handleAddToCart() {
    if (!isAuthenticated) {
      notify('Sign in to add items to your cart.', 'info')
      navigate('/login')
      return
    }

    setAdding(true)
    try {
      await addItem(product.id, quantity)
      notify(`Added ${quantity} × ${product.name} to your cart.`, 'success')
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="container product-detail">
      <Link to="/products" className="back-link">← Back to catalog</Link>

      <div className="product-detail__grid">
        <div className="product-detail__image">
          {product.image ? (
            <img src={resolveImage(product.image)} alt={product.name} />
          ) : (
            <div className="card__image-placeholder">No image</div>
          )}
        </div>

        <div className="product-detail__info">
          <span className="card__eyebrow">{brand?.name || '—'} · {category?.name || '—'}</span>
          <h1>{product.name}</h1>
          <span className="card__sku">SKU {product.sku} · slug: {product.slug}</span>

          <div className="price-tag price-tag--lg">
            <span className="price-tag__amount">{formatPrice(product.price)}</span>
            <span className="price-tag__stock">
              {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
            </span>
          </div>

          {product.is_featured && <span className="badge badge--featured">Featured product</span>}

          <p className="product-detail__description">{product.description}</p>

          <div className="add-to-cart-row">
            <div className="qty-stepper">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={outOfStock}
              >−</button>
              <input
                type="number"
                min={1}
                max={product.stock}
                value={quantity}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (v >= 1 && v <= product.stock) setQuantity(v)
                }}
                disabled={outOfStock}
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={outOfStock}
              >+</button>
            </div>

            <button className="btn" onClick={handleAddToCart} disabled={outOfStock || adding}>
              {outOfStock ? 'Out of stock' : adding ? 'Adding…' : 'Add to cart'}
            </button>
          </div>

          <dl className="meta-list">
            <div><dt>Listed</dt><dd>{new Date(product.created_at).toLocaleDateString()}</dd></div>
            <div><dt>Last updated</dt><dd>{new Date(product.updated_at).toLocaleDateString()}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  )
}
