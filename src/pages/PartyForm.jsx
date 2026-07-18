import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function PartyForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [status, setStatus] = useState('open')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    supabase.from('parties').select('*').eq('id', id).single().then(({ data, error }) => {
      if (error) { setError(error.message); setLoading(false); return }
      setName(data.name || '')
      setEventDate(data.event_date || '')
      setPoNumber(data.po_number || '')
      setStatus(data.status || 'open')
      setLoading(false)
    })
  }, [id])

  function genPoNumber(date) {
    const d = (date || '').replaceAll('-', '')
    return `PK-${d}-0001`
  }

  async function save(e) {
    e.preventDefault()
    if (!eventDate) { setError('יש לבחור תאריך'); return }
    const payload = {
      name: name.trim() || null,
      event_date: eventDate,
      po_number: poNumber || genPoNumber(eventDate),
      status,
    }
    const query = isEdit
      ? supabase.from('parties').update(payload).eq('id', id)
      : supabase.from('parties').insert(payload)

    const { error } = await query
    if (error) { setError(error.message); return }
    navigate('/parties')
  }

  if (loading) return <div className="main"><div className="loading">טוען…</div></div>

  return (
    <div className="main">
      <div className="page-header">
        <h2>{isEdit ? 'עריכת מסיבה' : 'מסיבה חדשה'}</h2>
      </div>

      {error && <div className="error-box">{error}</div>}

      <form className="card" onSubmit={save} style={{ maxWidth: 500 }}>
        <label>שם האירוע</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="לדוגמה: פסח, מונדיאל..." />

        <label>תאריך *</label>
        <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />

        <label>מספר אישור (PO)</label>
        <input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="נוצר אוטומטית אם ריק" />

        <label>סטטוס</label>
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="open">פתוח</option>
          <option value="closed">סגור</option>
        </select>

        <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
          <button className="btn" type="submit">שמור</button>
          <button className="btn secondary" type="button" onClick={() => navigate('/parties')}>ביטול</button>
        </div>
      </form>
    </div>
  )
}
