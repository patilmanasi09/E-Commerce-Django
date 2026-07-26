import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import Loader from '../../components/Loader'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      api.get('/users/all/'),
      api.get('/brands/'),
      api.get('/categories/'),
      api.get('/products/'),
    ]).then(([users, brands, categories, products]) => {
      if (cancelled) return
      const productList = products.data.products
      setStats({
        users: users.data.count,
        brands: brands.data.count,
        categories: categories.data.count,
        products: productList.length,
        featured: productList.filter((p) => p.is_featured).length,
        outOfStock: productList.filter((p) => p.stock <= 0).length,
      })
    }).finally(() => !cancelled && setLoading(false))

    return () => { cancelled = true }
  }, [])

  if (loading) return <Loader label="Tallying the shelves" />

  const cards = [
    { label: 'Users', value: stats.users, to: '/admin/users' },
    { label: 'Brands', value: stats.brands, to: '/admin/brands' },
    { label: 'Categories', value: stats.categories, to: '/admin/categories' },
    { label: 'Active products', value: stats.products, to: '/admin/products' },
    { label: 'Featured', value: stats.featured, to: '/admin/products?featured=true' },
    { label: 'Out of stock', value: stats.outOfStock, to: '/admin/products?stock=out' },
  ]

  return (
    <div>
      <div className="page-head">
        <h1>Overview</h1>
        <p>Pulled live from users/, brands/, categories/, and products/ just now.</p>
      </div>

      <div className="stat-grid">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="stat-card">
            <span className="stat-card__value">{c.value}</span>
            <span className="stat-card__label">{c.label}</span>
          </Link>
        ))}
      </div>

      
    </div>
  )
}
