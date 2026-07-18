import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatMoney } from '../lib/calc'

// Generic manager for tables shaped like: { id, name, <amountField?> }
// amountField: optional second numeric column (e.g. price, default_amount, cost_price/sale_price)
export default function SimpleListManager({ table, title, amountFields = [] }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [amounts, setAmounts] = useState({})

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setRows(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [table])

  async function addRow(e) {
    e.preventDefault()
    if (!name.trim()) return
    const payload = { name: name.trim() }
    amountFields.forEach(f => { payload[f.key] = Number(amounts[f.key] || 0) })
    const { error } = await supabase.from(table).insert(payload)
    if (error) { setError(error.message); return }
    setName('')
    setAmounts({})
    load()
  }

  async function removeRow(id) {
    if (!confirm('למחוק את הרשומה?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) { setError(error.message); return }
    load()
  }

  return (
    <div className="main">
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          <div className="meta">{rows.length} רשומות</div>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="card">
        <form onSubmit={addRow} className="row-line">
          <input placeholder="שם" value={name} onChange={e => setName(e.target.value)} />
          {amountFields.map(f => (
            <input
              key={f.key}
              type="number"
              step="0.01"
              placeholder={f.label}
              value={amounts[f.key] || ''}
              onChange={e => setAmounts(a => ({ ...a, [f.key]: e.target.value }))}
            />
          ))}
          <button className="btn" type="submit">הוסף</button>
        </form>
      </div>

      {loading ? (
        <div className="loading">טוען…</div>
      ) : rows.length === 0 ? (
        <div className="empty">אין רשומות עדיין</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>שם</th>
              {amountFields.map(f => <th key={f.key}>{f.label}</th>)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.name}</td>
                {amountFields.map(f => <td key={f.key}>{formatMoney(r[f.key])}</td>)}
                <td><button className="btn secondary" onClick={() => removeRow(r.id)}>מחק</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
