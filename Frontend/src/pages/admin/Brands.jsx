import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import { useToast } from '../../context/ToastContext'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { resolveImage, extractErrorMessage } from '../../utils/helpers'

const emptyForm = { name: '', description: '', is_active: true, logo: null }

export default function Brands() {
  const { notify } = useToast()
  const [loading, setLoading] = useState(true)
  const [brands, setBrands] = useState([])
  const [search, setSearch] = useState('')

  const [editing, setEditing] = useState(null) // brand object or 'new' or null
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  function load() {
    setLoading(true)
    return api.get('/brands/')
      .then(({ data }) => setBrands(data.brands))
      .catch(() => notify('Could not load brands.', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return brands
    return brands.filter((b) => b.name.toLowerCase().includes(q))
  }, [brands, search])

  function openCreate() {
    setForm(emptyForm)
    setError(null)
    setEditing('new')
  }

  function openEdit(brand) {
    setForm({ 
      name: brand.name || '', 
      description: brand.description || '', 
      is_active: Boolean(brand.is_active), 
      logo: null 
    })
    setError(null)
    setEditing(brand)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    const payload = new FormData()
    payload.append('name', form.name)
    payload.append('description', form.description)
    payload.append('is_active', form.is_active)
    if (form.logo) payload.append('logo', form.logo)

    try {
      if (editing === 'new') {
        await api.post('/brands/create/', payload)
        notify('Brand created.', 'success')
      } else {
        await api.patch(`/brands/${editing.id}/update/`, payload)
        notify('Brand updated.', 'success')
      }
      setEditing(null)
      await load()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(brand) {
    const payload = new FormData()
    payload.append('is_active', !brand.is_active)
    try {
      await api.patch(`/brands/${brand.id}/update/`, payload)
      notify(`${brand.name} is now ${!brand.is_active ? 'active' : 'inactive'}.`, 'success')
      load()
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  async function confirmDelete() {
    setBusy(true)
    try {
      await api.delete(`/brands/${deleteTarget.id}/delete/`)
      notify('Brand deleted.', 'success')
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
          <h1>Brands</h1>
          <p>{brands.length} total</p>
        </div>
        <button className="btn" onClick={openCreate}>+ New brand</button>
      </div>

      <input
        className="table-search"
        type="search"
        placeholder="Search brands…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <Loader label="Loading brands" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No brands found" hint="Create one to see it appear in the storefront instantly." />
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
            {filtered.map((b) => (
              <tr key={b.id}>
                <td>
                  {b.logo ? (
                    <img className="table-thumb" src={resolveImage(b.logo)} alt="" />
                  ) : (
                    <div className="table-thumb table-thumb--empty" />
                  )}
                </td>
                <td className="data-table__strong">{b.name}</td>
                <td className="data-table__muted">{b.description || '—'}</td>
                <td>
                  <button
                    className={`badge-btn ${b.is_active ? 'badge-btn--ok' : 'badge-btn--off'}`}
                    onClick={() => toggleActive(b)}
                  >
                    {b.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="data-table__muted">{new Date(b.updated_at).toLocaleDateString()}</td>
                <td className="data-table__actions">
                  <button className="link-btn" onClick={() => openEdit(b)}>Edit</button>
                  <button className="link-btn link-btn--danger" onClick={() => setDeleteTarget(b)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'New brand' : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <form className="panel-form" onSubmit={handleSubmit} autoComplete="off">
            {error && <div className="alert alert--error">{error}</div>}

            <div className="form-section">
              <span className="form-section__title">Details</span>

              <label htmlFor="brand-name-input">
                Name
                <input 
                  id="brand-name-input"
                  name="brand_title_field"
                  type="text"
                  autoComplete="new-password"
                  required 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                />
              </label>

              <label htmlFor="brand-desc-input">
                Description
                <textarea
                  id="brand-desc-input"
                  name="brand_details_field"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
            </div>

            <div className="form-section">
              <span className="form-section__title">Media &amp; status</span>

              <div className="form-row form-row--uneven">
                <label htmlFor="brand-logo-input">
                  Logo
                  <input id="brand-logo-input" type="file" accept="image/*" onChange={(e) => setForm({ ...form, logo: e.target.files[0] })} />
                </label>

                <div className="form-preview">
                  {form.logo ? (
                    <img src={URL.createObjectURL(form.logo)} alt="New logo preview" />
                  ) : editing !== 'new' && editing.logo ? (
                    <img src={resolveImage(editing.logo)} alt="Current logo" />
                  ) : (
                    <span className="form-preview__empty">No logo</span>
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
                {busy ? 'Saving…' : editing === 'new' ? 'Create brand' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete brand"
          message={`Delete "${deleteTarget.name}"? Products linked to it will also be removed (CASCADE).`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          busy={busy}
        />
      )}
    </div>
  )
}