import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { computePartyTotals, formatMoney } from '../lib/calc'

export default function Parties() {
  const [parties, setParties] = useState([])
  const [totalsById, setTotalsById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setError('')
    const { data: partyRows, error: pErr } = await supabase
      .from('parties')
      .select('*')
      .eq('archived', false)
      .order('event_date', { ascending: false })

    if (pErr) { setError(pErr.message); setLoading(false); return }
    setParties(partyRows)

    const ids = partyRows.map(p => p.id)
    if (ids.length === 0) { setLoading(false); return }

    const [{ data: revenues }, { data: entries }, { data: expenses }, { data: stock }] = await Promise.all([
      supabase.from('party_revenues').select('*').in('party_id', ids),
      supabase.from('party_entries').select('*, entry_tiers(price)').in('party_id', ids),
      supabase.from('party_expenses').select('*').in('party_id', ids),
      supabase.from('party_stock').select('*').in('party_id', ids),
    ])

    const map = {}
    for (const id of ids) {
      map[id] = computePartyTotals({
        revenues: (revenues || []).filter(r => r.party_id === id),
        entries: (entries || []).filter(e => e.party_id === id).map(e => ({ count: e.count, tier_price: e.entry_tiers?.price })),
        expenses: (expenses || []).filter(e => e.party_id === id),
        stock: (stock || []).filter(s => s.party_id === id),
      })
    }
    setTotalsById(map)
    setLoading(false)
  }

  async function archiveParty(id) {
    if (!confirm('להעביר את המסיבה לארכיון?')) return
    const { error } = await supabase.from('parties').update({ archived: true }).eq('id', id)
    if (error) { setError(error.message); return }
    load()
  }

  const totalCount = parties.length
  const closedCount = parties.filter(p => p.status === 'closed').length
  const draftCount = totalCount - closedCount

  return (
    <div className="main">
      <div className="page-header">
        <div>
          <h2>מסיבות · רשימה</h2>
          <div className="meta">{totalCount} בסה״כ · {closedCount} סגורות · {draftCount} טיוטות</div>
        </div>
        <div className="card-actions">
          <Link to="/parties/archive" className="btn secondary">📦 ארכיון</Link>
          <Link to="/parties/new" className="btn">➕ מסיבה חדשה</Link>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="loading">טוען…</div>
      ) : parties.length === 0 ? (
        <div className="empty">אין מסיבות עדיין</div>
      ) : (
        parties.map(p => {
          const t = totalsById[p.id] || { income: 0, expenses: 0, stockNet: 0, profit: 0 }
          return (
            <div className="card" key={p.id}>
              <div className="card-header">
                <div className="title">{p.name || 'ללא שם'}</div>
                <span className={'status-badge ' + p.status}>{p.status === 'closed' ? 'סגור' : 'פתוח'}</span>
              </div>
              <div className="meta">{p.event_date}{p.po_number ? ' · ' + p.po_number : ''}</div>
              <div className="stat-row">
                <div className="stat"><div className="label">הכנסות</div><div className="value">{formatMoney(t.income)}</div></div>
                <div className="stat"><div className="label">הוצאות</div><div className="value">{formatMoney(t.expenses)}</div></div>
                <div className="stat"><div className="label">סחורה</div><div className="value">{formatMoney(-t.stockNet)}</div></div>
                <div className="stat"><div className="label">רווח</div><div className={'value ' + (t.profit >= 0 ? 'pos' : 'neg')}>{formatMoney(t.profit)}</div></div>
              </div>
              <div className="card-actions">
                <Link to={`/parties/${p.id}`}>דוח →</Link>
                <Link to={`/parties/${p.id}/edit`}>עריכה</Link>
                <button className="btn secondary" onClick={() => archiveParty(p.id)}>📦 לארכיון</button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
