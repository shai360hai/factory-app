import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { computePartyTotals, formatMoney } from '../lib/calc'

function monthKey(dateStr) {
  return (dateStr || '').slice(0, 7) // YYYY-MM
}

export default function Dashboard() {
  const [parties, setParties] = useState([])
  const [totalsById, setTotalsById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [month, setMonth] = useState('') // '' = all

  async function load() {
    setLoading(true)
    const { data: partyRows, error: pErr } = await supabase.from('parties').select('*').order('event_date', { ascending: false })
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

  useEffect(() => { load() }, [])

  const months = useMemo(() => {
    const set = new Set(parties.map(p => monthKey(p.event_date)).filter(Boolean))
    return Array.from(set).sort().reverse()
  }, [parties])

  const filtered = useMemo(() => {
    if (!month) return parties
    return parties.filter(p => monthKey(p.event_date) === month)
  }, [parties, month])

  const summary = useMemo(() => {
    return filtered.reduce((acc, p) => {
      const t = totalsById[p.id] || { income: 0, expenses: 0, stockNet: 0, profit: 0 }
      acc.income += t.income
      acc.expenses += t.expenses
      acc.stockNet += t.stockNet
      acc.profit += t.profit
      return acc
    }, { income: 0, expenses: 0, stockNet: 0, profit: 0 })
  }, [filtered, totalsById])

  return (
    <div className="main">
      <div className="page-header">
        <h2>דשבורד חודשי</h2>
        <select value={month} onChange={e => setMonth(e.target.value)} style={{ width: 160 }}>
          <option value="">כל החודשים</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {error && <div className="error-box">{error}</div>}
      {loading ? <div className="loading">טוען…</div> : (
        <>
          <div className="summary-cards">
            <div className="card"><div className="label">הכנסות</div><div className="value">{formatMoney(summary.income)}</div></div>
            <div className="card"><div className="label">הוצאות</div><div className="value">{formatMoney(summary.expenses)}</div></div>
            <div className="card"><div className="label">סחורה (נטו)</div><div className="value">{formatMoney(-summary.stockNet)}</div></div>
            <div className="card"><div className="label">רווח</div><div className={'value ' + (summary.profit >= 0 ? 'pos' : 'neg')}>{formatMoney(summary.profit)}</div></div>
          </div>

          <table>
            <thead><tr><th>תאריך</th><th>אירוע</th><th>הכנסות</th><th>הוצאות</th><th>סחורה</th><th>רווח</th></tr></thead>
            <tbody>
              {filtered.map(p => {
                const t = totalsById[p.id] || { income: 0, expenses: 0, stockNet: 0, profit: 0 }
                return (
                  <tr key={p.id}>
                    <td>{p.event_date}</td>
                    <td>{p.name || '—'}</td>
                    <td>{formatMoney(t.income)}</td>
                    <td>{formatMoney(t.expenses)}</td>
                    <td>{formatMoney(-t.stockNet)}</td>
                    <td className={t.profit >= 0 ? 'value pos' : 'value neg'}>{formatMoney(t.profit)}</td>
                  </tr>
                )
              })}
              {filtered.length === 0 && <tr><td colSpan={6} className="empty">אין נתונים</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
