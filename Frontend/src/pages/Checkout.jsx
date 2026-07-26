import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import { formatPrice } from '../utils/helpers'

export default function Checkout() {
  const { cart, loading } = useCart()

  if (loading && !cart) return <Loader label="Loading checkout" />

  const items = cart?.items || []

  if (items.length === 0) {
    return (
      <div className="container">
        <EmptyState title="Nothing to check out" hint="Add something to your cart first." />
        <Link to="/products" className="btn btn--ghost">Browse the catalog</Link>
      </div>
    )
  }

  return (
    <div className="container narrow">
      <div className="page-head">
        <h1>Checkout</h1>
        <p>Reviewing {cart.total_items} {cart.total_items === 1 ? 'item' : 'items'}</p>
      </div>

      <div className="panel-form">
        {items.map((item) => (
          <div key={item.id} className="order-summary__row">
            <span>{item.product.name} × {item.quantity}</span>
            <span>{formatPrice(item.subtotal)}</span>
          </div>
        ))}
        <div className="order-summary__row order-summary__row--total">
          <span>Total</span>
          <span>{formatPrice(cart.total_price)}</span>
        </div>
      </div>
        <br/>
      <Link to="/cart" className="btn btn--ghost">← Back to cart</Link>
    </div>
  )
}
