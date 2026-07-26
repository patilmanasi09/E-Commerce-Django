import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'
import { resolveImage } from '../utils/helpers'

export default function Home() {
  const [state, setState] = useState({ loading: true, error: null })
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [productsRes, brandsRes, categoriesRes] = await Promise.all([
          api.get('/products/'),
          api.get('/brands/'),
          api.get('/categories/'),
        ])

        if (cancelled) return
        setProducts(productsRes.data.products)
        setBrands(brandsRes.data.brands)
        setCategories(categoriesRes.data.categories)
        setState({ loading: false, error: null })
      } catch (err) {
        if (cancelled) return
        setState({ loading: false, error: 'Could not reach the backend. Is Django running?' })
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  if (state.loading) return <Loader label="Pulling stock from the backend" />

  if (state.error) {
    return (
      <div className="container">
        <EmptyState title={state.error} hint="Start the API with `python manage.py runserver` and refresh." />
      </div>
    )
  }

  const featured = products.filter((p) => p.is_featured)
  const brandMap = Object.fromEntries(brands.map((b) => [b.id, b.name]))
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  return (
    <div>
      <section className="hero">
        <div className="hero__inner">
          
          <h1>
            Every tag on this shelf<br />came off your database.
          </h1>
          <p>
            {products.length} products across {categories.length} categories and {brands.length} brands —
            fetched, not faked. Sign in as an admin to restock the shelves yourself.
          </p>
          <div className="hero__actions">
            <Link to="/products" className="btn">Browse the catalog</Link>
          
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2>Categories</h2>
            <span className="section__count">{categories.length}</span>
          </div>
          <div className="chip-row">
            {categories.map((c) => (
              <Link key={c.id} to={`/products?category=${c.id}`} className="chip">
                {c.image && <img src={resolveImage(c.image)} alt="" />}
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {brands.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2>Brands</h2>
            <span className="section__count">{brands.length}</span>
          </div>
          <div className="chip-row">
            {brands.map((b) => (
              <Link key={b.id} to={`/products?brand=${b.id}`} className="chip">
                {b.logo && <img src={resolveImage(b.logo)} alt="" />}
                {b.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section__head">
          <h2>{featured.length > 0 ? 'Featured products' : 'Latest products'}</h2>
          <Link to="/products" className="section__link">View all →</Link>
        </div>

        {products.length === 0 ? (
          <EmptyState
            title="No products yet"
            hint="Sign in as an admin and add your first product to see it appear here instantly."
          />
        ) : (
          <div className="grid">
            {(featured.length > 0 ? featured : products).slice(0, 8).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                brandName={brandMap[p.brand]}
                categoryName={categoryMap[p.category]}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
