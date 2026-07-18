import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Calendar() {
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('parties').select('*').order('event_date', { ascending: true }).then(({ data }) => {
      setParties(data || [])
      setLoading(false)
    })
  }, [])

  const grouped = {}
  for (const p of parties) {
    const m = (p.event_date || '').slice(0, 7)
    grouped[m] = grouped[m] || []
    grouped[m].push(p)
  }

  return (
    <div className="main">
      <div className="page-header"><h2>יומן אירועים</h2></div>
      {loading ? <div className="loading">טוען…</div> : Object.keys(grouped).length === 0 ? (
        <div className="empty">אין אירועים</div>
      ) : (
        Object.entries(grouped).map(([m, items]) => (
          <div className="card" key={m}>
            <div className="card-header"><div className="title">{m}</div></div>
            {items.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span>{p.event_date} — {p.name || 'ללא שם'}</span>
                <Link to={`/parties/${p.id}`}>דוח →</Link>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
