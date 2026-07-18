import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { computePartyTotals, formatMoney } from '../lib/calc'

export default function Settlement() {
  const [parties, setParties] = useState([])
  const [totalsById, setTotalsById] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sharePercent, setSharePercent] = useState(50)

  async function load() {
    setLoading(true)
    const { data: partyRows, error: pErr } = await supabase.from('parties').select('*').order('event_date', { ascending: true })
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

  const filtered = useMemo(() => {
    return parties.filter(p => {
      if (from && p.event_date < from) return false
      if (to && p.event_date > to) return false
      return true
    })
  }, [parties, from, to])

  const totalProfit = filtered.reduce((s, p) => s + (totalsById[p.id]?.profit || 0), 0)
  const myShare = totalProfit * (Number(sharePercent) / 100)
  const partnerShare = totalProfit - myShare

  return (
    <div className="main">
      <div className="page-header">
        <h2>התחשבנות</h2>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="card" style={{ maxWidth: 500 }}>
        <label>מתאריך</label>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <label>עד תאריך</label>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} />
        <label>אחוז חלוקה שלי (%)</label>
        <input type="number" value={sharePercent} onChange={e => setSharePercent(e.target.value)} />
      </div>

      {loading ? <div className="loading">טוען…</div> : (
        <>
          <div className="summary-cards">
            <div className="card"><div className="label">רווח כולל בטווח</div><div className={'value ' + (totalProfit >= 0 ? 'pos' : 'neg')}>{formatMoney(totalProfit)}</div></div>
            <div className="card"><div className="label">חלק שלי ({sharePercent}%)</div><div className="value">{formatMoney(myShare)}</div></div>
            <div className="card"><div className="label">חלק שותף ({100 - sharePercent}%)</div><div className="value">{formatMoney(partnerShare)}</div></div>
          </div>

          <table>
            <thead><tr><th>תאריך</th><th>אירוע</th><th>רווח</th></tr></thead>
            <tbody>
              {filtered.map(p => {
                const t = totalsById[p.id] || { profit: 0 }
                return (
                  <tr key={p.id}>
                    <td>{p.event_date}</td>
                    <td>{p.name || '—'}</td>
                    <td className={t.profit >= 0 ? 'value pos' : 'value neg'}>{formatMoney(t.profit)}</td>
                  </tr>
                )
              })}
              {filtered.length === 0 && <tr><td colSpan={3} className="empty">אין מסיבות בטווח</td></tr>}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
