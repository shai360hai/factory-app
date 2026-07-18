import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { computePartyTotals, formatMoney } from '../lib/calc'

export default function PartyDetail() {
  const { id } = useParams()
  const [party, setParty] = useState(null)
  const [revenues, setRevenues] = useState([])
  const [entries, setEntries] = useState([])
  const [expenses, setExpenses] = useState([])
  const [stock, setStock] = useState([])
  const [categories, setCategories] = useState([])
  const [tiers, setTiers] = useState([])
  const [templates, setTemplates] = useState([])
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError('')
    const [
      { data: p, error: pErr },
      { data: rev }, { data: ent }, { data: exp }, { data: stk },
      { data: cats }, { data: tiersData }, { data: tpls }, { data: prods },
    ] = await Promise.all([
      supabase.from('parties').select('*').eq('id', id).single(),
      supabase.from('party_revenues').select('*').eq('party_id', id),
      supabase.from('party_entries').select('*, entry_tiers(name, price)').eq('party_id', id),
      supabase.from('party_expenses').select('*').eq('party_id', id),
      supabase.from('party_stock').select('*, products(name)').eq('party_id', id),
      supabase.from('revenue_categories').select('*'),
      supabase.from('entry_tiers').select('*'),
      supabase.from('expense_templates').select('*'),
      supabase.from('products').select('*'),
    ])
    if (pErr) { setError(pErr.message); setLoading(false); return }
    setParty(p)
    setRevenues(rev || [])
    setEntries(ent || [])
    setExpenses(exp || [])
    setStock(stk || [])
    setCategories(cats || [])
    setTiers(tiersData || [])
    setTemplates(tpls || [])
    setProducts(prods || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function addRevenue() {
    await supabase.from('party_revenues').insert({ party_id: id, description: 'הכנסה', amount: 0 })
    load()
  }
  async function updateRevenue(rid, field, value) {
    await supabase.from('party_revenues').update({ [field]: value }).eq('id', rid)
    load()
  }
  async function removeRevenue(rid) {
    await supabase.from('party_revenues').delete().eq('id', rid)
    load()
  }

  async function addEntry() {
    if (tiers.length === 0) { alert('אין מחירי כניסה מוגדרים. הוסף בעמוד "מחירי כניסה".'); return }
    await supabase.from('party_entries').insert({ party_id: id, tier_id: tiers[0].id, count: 0 })
    load()
  }
  async function updateEntry(eid, field, value) {
    await supabase.from('party_entries').update({ [field]: value }).eq('id', eid)
    load()
  }
  async function removeEntry(eid) {
    await supabase.from('party_entries').delete().eq('id', eid)
    load()
  }

  async function addExpense() {
    await supabase.from('party_expenses').insert({ party_id: id, name: 'הוצאה', amount: 0 })
    load()
  }
  async function updateExpense(xid, field, value) {
    await supabase.from('party_expenses').update({ [field]: value }).eq('id', xid)
    load()
  }
  async function removeExpense(xid) {
    await supabase.from('party_expenses').delete().eq('id', xid)
    load()
  }

  async function addStock() {
    if (products.length === 0) { alert('אין מוצרים מוגדרים. הוסף בעמוד "מוצרים".'); return }
    await supabase.from('party_stock').insert({ party_id: id, product_id: products[0].id, quantity_sold: 0, revenue: 0, cost: 0 })
    load()
  }
  async function updateStock(sid, field, value) {
    await supabase.from('party_stock').update({ [field]: value }).eq('id', sid)
    load()
  }
  async function removeStock(sid) {
    await supabase.from('party_stock').delete().eq('id', sid)
    load()
  }

  if (loading) return <div className="main"><div className="loading">טוען…</div></div>
  if (error) return <div className="main"><div className="error-box">{error}</div></div>
  if (!party) return null

  const totals = computePartyTotals({
    revenues,
    entries: entries.map(e => ({ count: e.count, tier_price: e.entry_tiers?.price })),
    expenses,
    stock,
  })

  return (
    <div className="main">
      <div className="page-header">
        <div>
          <h2>{party.name || 'ללא שם'}</h2>
          <div className="meta">{party.event_date} · {party.po_number}</div>
        </div>
        <Link to={`/parties/${id}/edit`} className="btn secondary">עריכת פרטי מסיבה</Link>
      </div>

      <div className="summary-cards">
        <div className="card"><div className="label">הכנסות</div><div className="value">{formatMoney(totals.income)}</div></div>
        <div className="card"><div className="label">הוצאות</div><div className="value">{formatMoney(totals.expenses)}</div></div>
        <div className="card"><div className="label">סחורה (נטו)</div><div className="value">{formatMoney(-totals.stockNet)}</div></div>
        <div className="card"><div className="label">רווח</div><div className={'value ' + (totals.profit >= 0 ? 'pos' : 'neg')}>{formatMoney(totals.profit)}</div></div>
      </div>

      {/* Revenue */}
      <div className="card">
        <div className="card-header"><div className="title">הכנסות</div><button className="btn secondary" onClick={addRevenue}>+ הוסף</button></div>
        <table>
          <thead><tr><th>תיאור</th><th>קטגוריה</th><th>סכום</th><th></th></tr></thead>
          <tbody>
            {revenues.map(r => (
              <tr key={r.id}>
                <td><input defaultValue={r.description || ''} onBlur={e => updateRevenue(r.id, 'description', e.target.value)} /></td>
                <td>
                  <select defaultValue={r.category_id || ''} onChange={e => updateRevenue(r.id, 'category_id', e.target.value || null)}>
                    <option value="">—</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
                <td><input type="number" step="0.01" defaultValue={r.amount} onBlur={e => updateRevenue(r.id, 'amount', Number(e.target.value))} /></td>
                <td><button className="btn secondary" onClick={() => removeRevenue(r.id)}>מחק</button></td>
              </tr>
            ))}
            {revenues.length === 0 && <tr><td colSpan={4} className="empty">אין שורות הכנסה</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Entries / tickets */}
      <div className="card">
        <div className="card-header"><div className="title">כניסות (כרטיסים)</div><button className="btn secondary" onClick={addEntry}>+ הוסף</button></div>
        <table>
          <thead><tr><th>שכבת מחיר</th><th>כמות</th><th>סה״כ</th><th></th></tr></thead>
          <tbody>
            {entries.map(en => (
              <tr key={en.id}>
                <td>
                  <select defaultValue={en.tier_id} onChange={e => updateEntry(en.id, 'tier_id', e.target.value)}>
                    {tiers.map(t => <option key={t.id} value={t.id}>{t.name} ({formatMoney(t.price)})</option>)}
                  </select>
                </td>
                <td><input type="number" defaultValue={en.count} onBlur={e => updateEntry(en.id, 'count', Number(e.target.value))} /></td>
                <td>{formatMoney((en.count || 0) * (en.entry_tiers?.price || 0))}</td>
                <td><button className="btn secondary" onClick={() => removeEntry(en.id)}>מחק</button></td>
              </tr>
            ))}
            {entries.length === 0 && <tr><td colSpan={4} className="empty">אין כניסות</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Expenses */}
      <div className="card">
        <div className="card-header"><div className="title">הוצאות</div><button className="btn secondary" onClick={addExpense}>+ הוסף</button></div>
        <table>
          <thead><tr><th>שם</th><th>תבנית</th><th>סכום</th><th></th></tr></thead>
          <tbody>
            {expenses.map(x => (
              <tr key={x.id}>
                <td><input defaultValue={x.name || ''} onBlur={e => updateExpense(x.id, 'name', e.target.value)} /></td>
                <td>
                  <select defaultValue={x.template_id || ''} onChange={e => updateExpense(x.id, 'template_id', e.target.value || null)}>
                    <option value="">—</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </td>
                <td><input type="number" step="0.01" defaultValue={x.amount} onBlur={e => updateExpense(x.id, 'amount', Number(e.target.value))} /></td>
                <td><button className="btn secondary" onClick={() => removeExpense(x.id)}>מחק</button></td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={4} className="empty">אין הוצאות</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Stock */}
      <div className="card">
        <div className="card-header"><div className="title">סחורה</div><button className="btn secondary" onClick={addStock}>+ הוסף</button></div>
        <table>
          <thead><tr><th>מוצר</th><th>כמות</th><th>הכנסה</th><th>עלות</th><th></th></tr></thead>
          <tbody>
            {stock.map(s => (
              <tr key={s.id}>
                <td>
                  <select defaultValue={s.product_id} onChange={e => updateStock(s.id, 'product_id', e.target.value)}>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </td>
                <td><input type="number" defaultValue={s.quantity_sold} onBlur={e => updateStock(s.id, 'quantity_sold', Number(e.target.value))} /></td>
                <td><input type="number" step="0.01" defaultValue={s.revenue} onBlur={e => updateStock(s.id, 'revenue', Number(e.target.value))} /></td>
                <td><input type="number" step="0.01" defaultValue={s.cost} onBlur={e => updateStock(s.id, 'cost', Number(e.target.value))} /></td>
                <td><button className="btn secondary" onClick={() => removeStock(s.id)}>מחק</button></td>
              </tr>
            ))}
            {stock.length === 0 && <tr><td colSpan={5} className="empty">אין סחורה</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
