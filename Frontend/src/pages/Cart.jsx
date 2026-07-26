import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import { resolveImage, formatPrice, extractErrorMessage } from '../utils/helpers'

export default function Cart() {
  const { cart, loading, updateItem, removeItem, clearCart } = useCart()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [busyItemId, setBusyItemId] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)

  async function handleQuantityChange(item, nextQuantity) {
    if (nextQuantity < 1 || nextQuantity > item.product.stock) return
    setBusyItemId(item.id)
    try {
      await updateItem(item.id, nextQuantity)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    } finally {
      setBusyItemId(null)
    }
  }

  async function handleRemove(item) {
    setBusyItemId(item.id)
    try {
      await removeItem(item.id)
      notify(`Removed ${item.product.name}.`, 'success')
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    } finally {
      setBusyItemId(null)
    }
  }

  async function handleClear() {
    setClearing(true)
    try {
      await clearCart()
      notify('Cart cleared.', 'success')
      setConfirmClear(false)
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    } finally {
      setClearing(false)
    }
  }

  if (loading && !cart) return <Loader label="Fetching your cart" />

  const items = cart?.items || []

  return (
    <div className="container">
      <div className="page-head page-head--row">
        <div>
          <h1>Your cart</h1>
          <p>{items.length} {items.length === 1 ? 'item' : 'items'}</p>
        </div>
        {items.length > 0 && (
          <button className="link-btn link-btn--danger" onClick={() => setConfirmClear(true)}>
            Clear cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          hint="Browse the catalog and add something to it — it'll show up here instantly."
        />
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => {
              const isBusy = busyItemId === item.id
              const outOfStock = item.product.stock <= 0
              return (
                <div key={item.id} className="cart-row">
                  <Link to={`/products/${item.product.id}`} className="cart-row__image">
                    {item.product.image ? (
                      <img src={resolveImage(item.product.image)} alt={item.product.name} />
                    ) : (
                      <div className="card__image-placeholder">No image</div>
                    )}
                  </Link>

                  <div className="cart-row__info">
                    <Link to={`/products/${item.product.id}`} className="cart-row__name">
                      {item.product.name}
                    </Link>
                    <span className="card__sku">SKU {item.product.sku}</span>
                    {outOfStock && <span className="badge badge--out cart-row__badge">Now out of stock</span>}
                    {!outOfStock && item.quantity >= item.product.stock && (
                      <span className="cart-row__hint">Max available quantity reached</span>
                    )}
                  </div>

                  <div className="qty-stepper qty-stepper--sm">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                      disabled={isBusy || item.quantity <= 1}
                    >−</button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                      disabled={isBusy || item.quantity >= item.product.stock}
                    >+</button>
                  </div>

                  <span className="cart-row__subtotal">{formatPrice(item.subtotal)}</span>

                  <button
                    className="link-btn link-btn--danger cart-row__remove"
                    onClick={() => handleRemove(item)}
                    disabled={isBusy}
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>

          <aside className="order-summary">
            <h2>Order summary</h2>
            <div className="order-summary__row">
              <span>Items</span>
              <span>{cart.total_items}</span>
            </div>
            <div className="order-summary__row order-summary__row--total">
              <span>Total</span>
              <span>{formatPrice(cart.total_price)}</span>
            </div>
            <button className="btn btn--block" onClick={() => navigate('/checkout')}>
              Proceed to checkout
            </button>
            <Link to="/products" className="order-summary__continue">← Keep browsing</Link>
          </aside>
        </div>
      )}

      {confirmClear && (
        <ConfirmDialog
          title="Clear cart"
          message="Remove every item from your cart? This can't be undone."
          confirmLabel="Clear cart"
          onConfirm={handleClear}
          onCancel={() => setConfirmClear(false)}
          busy={clearing}
        />
      )}
    </div>
  )
}
