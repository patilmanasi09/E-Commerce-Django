import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])

  const search = searchParams.get('q') || ''
  const brandFilter = searchParams.get('brand') || ''
  const categoryFilter = searchParams.get('category') || ''
  const featuredOnly = searchParams.get('featured') === 'true'
  const sort = searchParams.get('sort') || 'newest'

  useEffect(() => {
    let cancelled = false

    Promise.all([api.get('/products/'), api.get('/brands/'), api.get('/categories/')])
      .then(([productsRes, brandsRes, categoriesRes]) => {
        if (cancelled) return
        setProducts(productsRes.data.products)
        setBrands(brandsRes.data.brands)
        setCategories(categoriesRes.data.categories)
      })
      .catch(() => !cancelled && setError('Could not load the catalog. Is the backend running?'))
      .finally(() => !cancelled && setLoading(false))

    return () => { cancelled = true }
  }, [])

  const brandMap = useMemo(() => Object.fromEntries(brands.map((b) => [b.id, b.name])), [brands])
  const categoryMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories])

  const filtered = useMemo(() => {
    let list = [...products]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      )
    }
    if (brandFilter) list = list.filter((p) => String(p.brand) === brandFilter)
    if (categoryFilter) list = list.filter((p) => String(p.category) === categoryFilter)
    if (featuredOnly) list = list.filter((p) => p.is_featured)

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => Number(a.price) - Number(b.price))
        break
      case 'price-desc':
        list.sort((a, b) => Number(b.price) - Number(a.price))
        break
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    return list
  }, [products, search, brandFilter, categoryFilter, featuredOnly, sort])

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  if (loading) return <Loader label="Fetching the catalog" />

  if (error) {
    return (
      <div className="container">
        <EmptyState title={error} />
      </div>
    )
  }

  return (
    <div className="container">
      <div className="page-head">
        <h1>Catalog</h1>
        <p>{filtered.length} of {products.length} products</p>
      </div>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search by name or SKU…"
          value={search}
          onChange={(e) => updateParam('q', e.target.value)}
        />

        <select value={categoryFilter} onChange={(e) => updateParam('category', e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select value={brandFilter} onChange={(e) => updateParam('brand', e.target.value)}>
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name">Name A–Z</option>
        </select>

        <label className="filter-bar__toggle">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={(e) => updateParam('featured', e.target.checked ? 'true' : '')}
          />
          Featured only
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No products match those filters"
          hint="Try clearing a filter, or add matching stock from the admin panel."
        />
      ) : (
        <div className="grid">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              brandName={brandMap[p.brand]}
              categoryName={categoryMap[p.category]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
