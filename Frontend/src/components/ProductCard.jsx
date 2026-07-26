import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { resolveImage, formatPrice, extractErrorMessage } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'

export default function ProductCard({ product, brandName, categoryName }) {
  const outOfStock = product.stock <= 0
  const { isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)

  async function handleAddToCart(e) {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      notify('Sign in to add items to your cart.', 'info')
      navigate('/login')
      return
    }

    setAdding(true)
    try {
      await addItem(product.id, 1)
      notify(`Added ${product.name} to your cart.`, 'success')
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    } finally {
      setAdding(false)
    }
  }

  return (
    <Link to={`/products/${product.id}`} className="card">
      <div className="card__image">
        {product.image ? (
          <img src={resolveImage(product.image)} alt={product.name} loading="lazy" />
        ) : (
          <div className="card__image-placeholder">No image</div>
        )}
        {product.is_featured && <span className="badge badge--featured">Featured</span>}
        {outOfStock && <span className="badge badge--out">Out of stock</span>}
      </div>

      <div className="card__body">
        <span className="card__eyebrow">{brandName || '—'} · {categoryName || '—'}</span>
        <h3 className="card__title">{product.name}</h3>
        <span className="card__sku">SKU {product.sku}</span>
      </div>

      <div className="price-tag">
        <span className="price-tag__amount">{formatPrice(product.price)}</span>
        <span className="price-tag__stock">{product.stock} in stock</span>
      </div>

      <button
        className="card__add-btn"
        onClick={handleAddToCart}
        disabled={outOfStock || adding}
      >
        {outOfStock ? 'Out of stock' : adding ? 'Adding…' : '+ Add to cart'}
      </button>
    </Link>
  )
}
