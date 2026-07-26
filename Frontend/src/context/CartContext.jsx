import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null)
      return
    }
    setLoading(true)
    try {
      const { data } = await api.get('/cart/')
      setCart(data.cart)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Load the cart as soon as we know someone's logged in, and clear it
  // the moment they log out so the badge doesn't show stale numbers.
  useEffect(() => {
    if (isAuthenticated) refreshCart()
    else setCart(null)
  }, [isAuthenticated, refreshCart])

  async function addItem(productId, quantity = 1) {
    const { data } = await api.post('/cart/add/', { product_id: productId, quantity })
    setCart(data.cart)
    return data
  }

  async function updateItem(itemId, quantity) {
    const { data } = await api.patch(`/cart/items/${itemId}/update/`, { quantity })
    setCart(data.cart)
    return data
  }

  async function removeItem(itemId) {
    const { data } = await api.delete(`/cart/items/${itemId}/remove/`)
    setCart(data.cart)
    return data
  }

  async function clearCart() {
    const { data } = await api.delete('/cart/clear/')
    setCart(data.cart)
    return data
  }

  const value = {
    cart,
    loading,
    itemCount: cart?.total_items || 0,
    refreshCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
