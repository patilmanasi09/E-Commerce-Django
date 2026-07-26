import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import { useToast } from '../../context/ToastContext'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { resolveImage, extractErrorMessage } from '../../utils/helpers'

const emptyForm = { name: '', description: '', is_active: true, image: null }

export default function Categories() {
  const { notify } = useToast()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')

  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null)

  // Object URL cleanup effect to manage local image preview memory safely
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
    return api.get('/categories/')
      .then(({ data }) => setCategories(data.categories))
      .catch(() => notify('Could not load categories.', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return categories
    return categories.filter((c) => c.name?.toLowerCase().includes(q))
  }, [categories, search])

  function openCreate() {
    setForm(emptyForm)
    setError(null)
    setEditing('new')
  }

  function openEdit(category) {
    setForm({ 
      name: category.name || '', 
      description: category.description || '', 
      is_active: Boolean(category.is_active), 
      image: null 
    })
    setError(null)
    setEditing(category)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const payload = new FormData()
    payload.append('name', form.name)
    payload.append('description', form.description)
    payload.append('is_active', form.is_active)
    if (form.image) payload.append('image', form.image)

    try {
      if (editing === 'new') {
        await api.post('/categories/create/', payload)
        notify('Category created.', 'success')
      } else {
        await api.patch(`/categories/${editing.id}/update/`, payload)
        notify('Category updated.', 'success')
      }
      setEditing(null)
      await load()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(category) {
    const payload = new FormData()
    payload.append('is_active', !category.is_active)
    try {
      await api.patch(`/categories/${category.id}/update/`, payload)
      notify(`${category.name} is now ${!category.is_active ? 'active' : 'inactive'}.`, 'success')
      load()
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  async function confirmDelete() {
    setBusy(true)
    try {
      await api.delete(`/categories/${deleteTarget.id}/delete/`)
      notify('Category deleted.', 'success')
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
          <h1>Categories</h1>
          <p>{categories.length} total</p>
        </div>
        <button className="btn" onClick={openCreate}>+ New category</button>
      </div>

      <input
        className="table-search"
        type="search"
        placeholder="Search categories…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <Loader label="Loading categories" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No categories found" hint="Create one — products need a category to be listed." />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.image ? (
                    <img className="table-thumb" src={resolveImage(c.image)} alt="" />
                  ) : (
                    <div className="table-thumb table-thumb--empty" />
                  )}
                </td>
                <td className="data-table__strong">{c.name}</td>
                <td className="data-table__muted">{c.description || '—'}</td>
                <td>
                  <button
                    className={`badge-btn ${c.is_active ? 'badge-btn--ok' : 'badge-btn--off'}`}
                    onClick={() => toggleActive(c)}
                  >
                    {c.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="data-table__muted">{new Date(c.updated_at).toLocaleDateString()}</td>
                <td className="data-table__actions">
                  <button className="link-btn" onClick={() => openEdit(c)}>Edit</button>
                  <button className="link-btn link-btn--danger" onClick={() => setDeleteTarget(c)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'New category' : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <form className="panel-form" onSubmit={handleSubmit} autoComplete="off">
            {error && <div className="alert alert--error">{error}</div>}

            <div className="form-section">
              <span className="form-section__title">Details</span>

              <label htmlFor="category-name-input">
                Name
                <input
                  id="category-name-input"
                  type="text"
                  name="category_item_name"
                  autoComplete="new-password"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>

              <label htmlFor="category-description-input">
                Description
                <textarea
                  id="category-description-input"
                  name="category_item_description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
            </div>

            <div className="form-section">
              <span className="form-section__title">Media &amp; status</span>

              <div className="form-row form-row--uneven">
                <label htmlFor="category-image-input">
                  Image
                  <input
                    id="category-image-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setForm({ ...form, image: e.target.files[0] || null })}
                  />
                </label>

                <div className="form-preview">
                  {imagePreviewUrl ? (
                    <img src={imagePreviewUrl} alt="New image preview" />
                  ) : editing !== 'new' && editing.image ? (
                    <img src={resolveImage(editing.image)} alt="Current image" />
                  ) : (
                    <span className="form-preview__empty">No image</span>
                  )}
                </div>
              </div>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Active — visible on the storefront
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn" disabled={busy}>
                {busy ? 'Saving…' : editing === 'new' ? 'Create category' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete category"
          message={`Delete "${deleteTarget.name}"? Products linked to it will also be removed (CASCADE).`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          busy={busy}
        />
      )}
    </div>
  )
}