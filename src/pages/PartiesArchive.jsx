import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function PartiesArchive() {
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('parties').select('*').eq('archived', true).order('event_date', { ascending: false })
    if (error) setError(error.message)
    else setParties(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function restore(id) {
    const { error } = await supabase.from('parties').update({ archived: false }).eq('id', id)
    if (error) { setError(error.message); return }
    load()
  }

  return (
    <div className="main">
      <div className="page-header">
        <h2>ארכיון מסיבות</h2>
        <Link to="/parties" className="btn secondary">חזרה לרשימה</Link>
      </div>
      {error && <div className="error-box">{error}</div>}
      {loading ? <div className="loading">טוען…</div> : parties.length === 0 ? (
        <div className="empty">הארכיון ריק</div>
      ) : (
        <table>
          <thead><tr><th>תאריך</th><th>אירוע</th><th>אישור</th><th></th></tr></thead>
          <tbody>
            {parties.map(p => (
              <tr key={p.id}>
                <td>{p.event_date}</td>
                <td>{p.name || 'ללא שם'}</td>
                <td>{p.po_number}</td>
                <td>
                  <Link to={`/parties/${p.id}`}>דוח</Link>{' · '}
                  <button className="btn secondary" onClick={() => restore(p.id)}>שחזר</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
