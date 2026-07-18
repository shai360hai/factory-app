import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatMoney } from '../lib/calc'

const FIXED_CATEGORY_NAMES = ['כניסה', 'מלצריות', 'בר']

export default function PartyDetail() {
  const { id } = useParams()
  const [party, setParty] = useState(null)
  const [revenues, setRevenues] = useState([])
  const [expenses, setExpenses] = useState([])
  const [stock, setStock] = useState([])
  const [templates, setTemplates] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pickedTemplate, setPickedTemplate] = useState('')

  async function ensureFixedRows(partyId, cats, prods) {
    // Ensure the 3 fixed revenue categories each have a row for this party
    const { data: existingRev } = await supabase.from('party_revenues').select('category_id').eq('party_id', partyId)
    const existingCatIds = new Set((existingRev || []).map(r => r.category_id))
    const missingCats = cats.filter(c => FIXED_CATEGORY_NAMES.includes(c.name) && !existingCatIds.has(c.id))
    if (missingCats.length > 0) {
      await supabase.from('party_revenues').insert(
        missingCats.map(c => ({ party_id: partyId, category_id: c.id, description: c.name, amount: 0, cash_amount: 0, credit_amount: 0 }))
      )
    }

    // Ensure every product has a fixed stock row for this party
    const { data: existingStock } = await supabase.from('party_stock').select('product_id').eq('party_id', partyId)
    const existingProdIds = new Set((existingStock || []).map(s => s.product_id))
    const missingProds = prods.filter(p => !existingProdIds.has(p.id))
    if (missingProds.length > 0) {
      await supabase.from('party_stock').insert(
        missingProds.map(p => ({ party_id: partyId, product_id: p.id, start_qty: 0, end_qty: 0, price: p.sale_price || 0, quantity_sold: 0, revenue: 0, cost: 0 }))
      )
    }
  }

  async function load() {
    setLoading(true)
    setError('')
    const [{ data: p, error: pErr }, { data: cats }, { data: prods }] = await Promise.all([
      supabase.from('parties').select('*').eq('id', id).single(),
      supabase.from('revenue_categories').select('*'),
      supabase.from('products').select('*'),
    ])
    if (pErr) { setError(pErr.message); setLoading(false); return }

    await ensureFixedRows(id, cats || [], prods || [])

    const [{ data: rev }, { data: exp }, { data: stk }, { data: tpls }] = await Promise.all([
      supabase.from('party_revenues').select('*, revenue_categories(name)').eq('party_id', id),
      supabase.from('party_expenses').select('*').eq('party_id', id),
      supabase.from('party_stock').select('*, products(name, cost_price)').eq('party_id', id),
      supabase.from('expense_templates').select('*'),
    ])
    setParty(p)
    setRevenues(rev || [])
    setExpenses(exp || [])
    setStock(stk || [])
    setTemplates(tpls || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  // ---- Revenue (cash/credit) ----
  async function updateRevenueCashCredit(rid, field, value) {
    const row = revenues.find(r => r.id === rid)
    const cash = field === 'cash_amount' ? value : Number(row.cash_amount || 0)
    const credit = field === 'credit_amount' ? value : Number(row.credit_amount || 0)
    await supabase.from('party_revenues').update({ [field]: value, amount: cash + credit }).eq('id', rid)
    load()
  }

  async function addExtraRevenue() {
    await supabase.from('party_revenues').insert({ party_id: id, description: 'הכנסה נוספת', amount: 0, cash_amount: 0, credit_amount: 0 })
    load()
  }
  async function updateRevenueField(rid, field, value) {
    await supabase.from('party_revenues').update({ [field]: value }).eq('id', rid)
    load()
  }
  async function removeRevenue(rid) {
    await supabase.from('party_revenues').delete().eq('id', rid)
    load()
  }

  // ---- Expenses ----
  async function addExpense() {
    await supabase.from('party_expenses').insert({ party_id: id, name: 'הוצאה', amount: 0 })
    load()
  }
  async function addFixedExpense() {
    if (!pickedTemplate) return
    const tpl = templates.find(t => t.id === pickedTemplate)
    if (!tpl) return
    await supabase.from('party_expenses').insert({ party_id: id, template_id: tpl.id, name: tpl.name, amount: tpl.default_amount || 0 })
    setPickedTemplate('')
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

  // ---- Stock (start/end qty + price) ----
  async function updateStock(sid, field, value) {
    const row = stock.find(s => s.id === sid)
    const start = field === 'start_qty' ? value : Number(row.start_qty || 0)
    const end = field === 'end_qty' ? value : Number(row.end_qty || 0)
    const price = field === 'price' ? value : Number(row.price || 0)
    const sold = Math.max(0, start - end)
    const revenue = sold * price
    const cost = sold * Number(row.products?.cost_price || 0)
    await supabase.from('party_stock').update({ [field]: value, quantity_sold: sold, revenue, cost }).eq('id', sid)
    load()
  }

  if (loading) return <div className="main"><div className="loading">טוען…</div></div>
  if (error) return <div className="main"><div className="error-box">{error}</div></div>
  if (!party) return null

  const fixedRevenues = revenues.filter(r => FIXED_CATEGORY_NAMES.includes(r.revenue_categories?.name))
  const extraRevenues = revenues.filter(r => !FIXED_CATEGORY_NAMES.includes(r.revenue_categories?.name))

  const revenueTotal = revenues.reduce((s, r) => s + Number(r.cash_amount || 0) + Number(r.credit_amount || 0), 0)
  const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const stockCost = stock.reduce((s, r) => s + Number(r.cost || 0), 0)
  const stockRevenue = stock.reduce((s, r) => s + Number(r.revenue || 0), 0)
  const stockNet = stockCost - stockRevenue
  const profit = revenueTotal - expenseTotal - stockNet

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
        <div className="card"><div className="label">הכנסות</div><div className="value">{formatMoney(revenueTotal)}</div></div>
        <div className="card"><div className="label">הוצאות</div><div className="value">{formatMoney(expenseTotal)}</div></div>
        <div className="card"><div className="label">סחורה (נטו)</div><div className="value">{formatMoney(-stockNet)}</div></div>
        <div className="card"><div className="label">רווח</div><div className={'value ' + (profit >= 0 ? 'pos' : 'neg')}>{formatMoney(profit)}</div></div>
      </div>

      {/* Fixed revenue: כניסה / מלצריות / בר, each with cash + credit */}
      <div className="card">
        <div className="card-header"><div className="title">הכנסות</div></div>
        <table>
          <thead><tr><th>קטגוריה</th><th>מזומן</th><th>אשראי</th><th>סה״כ</th></tr></thead>
          <tbody>
            {fixedRevenues.map(r => (
              <tr key={r.id}>
                <td>{r.revenue_categories?.name}</td>
                <td><input type="number" step="0.01" defaultValue={r.cash_amount} onBlur={e => updateRevenueCashCredit(r.id, 'cash_amount', Number(e.target.value))} /></td>
                <td><input type="number" step="0.01" defaultValue={r.credit_amount} onBlur={e => updateRevenueCashCredit(r.id, 'credit_amount', Number(e.target.value))} /></td>
                <td>{formatMoney(Number(r.cash_amount || 0) + Number(r.credit_amount || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {extraRevenues.length > 0 && (
          <>
            <div style={{ marginTop: 14, marginBottom: 6, color: 'var(--text-dim)', fontSize: 13 }}>הכנסות נוספות</div>
            <table>
              <thead><tr><th>תיאור</th><th>מזומן</th><th>אשראי</th><th>סה״כ</th><th></th></tr></thead>
              <tbody>
                {extraRevenues.map(r => (
                  <tr key={r.id}>
                    <td><input defaultValue={r.description || ''} onBlur={e => updateRevenueField(r.id, 'description', e.target.value)} /></td>
                    <td><input type="number" step="0.01" defaultValue={r.cash_amount} onBlur={e => updateRevenueCashCredit(r.id, 'cash_amount', Number(e.target.value))} /></td>
                    <td><input type="number" step="0.01" defaultValue={r.credit_amount} onBlur={e => updateRevenueCashCredit(r.id, 'credit_amount', Number(e.target.value))} /></td>
                    <td>{formatMoney(Number(r.cash_amount || 0) + Number(r.credit_amount || 0))}</td>
                    <td><button className="btn secondary" onClick={() => removeRevenue(r.id)}>מחק</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div style={{ marginTop: 10 }}>
          <button className="btn secondary" onClick={addExtraRevenue}>+ קטגוריית הכנסה נוספת</button>
        </div>
      </div>

      {/* Expenses */}
      <div className="card">
        <div className="card-header">
          <div className="title">הוצאות</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={pickedTemplate} onChange={e => setPickedTemplate(e.target.value)} style={{ width: 180 }}>
              <option value="">בחר הוצאה קבועה…</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({formatMoney(t.default_amount)})</option>)}
            </select>
            <button className="btn secondary" onClick={addFixedExpense} disabled={!pickedTemplate}>+ הוסף קבועה</button>
            <button className="btn secondary" onClick={addExpense}>+ הוצאה חופשית</button>
          </div>
        </div>
        <table>
          <thead><tr><th>שם</th><th>סכום</th><th></th></tr></thead>
          <tbody>
            {expenses.map(x => (
              <tr key={x.id}>
                <td><input defaultValue={x.name || ''} onBlur={e => updateExpense(x.id, 'name', e.target.value)} /></td>
                <td><input type="number" step="0.01" defaultValue={x.amount} onBlur={e => updateExpense(x.id, 'amount', Number(e.target.value))} /></td>
                <td><button className="btn secondary" onClick={() => removeExpense(x.id)}>מחק</button></td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={3} className="empty">אין הוצאות</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Stock: fixed row per product, start/end qty + price */}
      <div className="card">
        <div className="card-header"><div className="title">סחורה</div></div>
        <table>
          <thead><tr><th>מוצר</th><th>כמות התחלה</th><th>כמות סיום</th><th>מחיר</th><th>נמכר</th><th>הכנסה</th></tr></thead>
          <tbody>
            {stock.map(s => (
              <tr key={s.id}>
                <td>{s.products?.name}</td>
                <td><input type="number" defaultValue={s.start_qty} onBlur={e => updateStock(s.id, 'start_qty', Number(e.target.value))} /></td>
                <td><input type="number" defaultValue={s.end_qty} onBlur={e => updateStock(s.id, 'end_qty', Number(e.target.value))} /></td>
                <td><input type="number" step="0.01" defaultValue={s.price} onBlur={e => updateStock(s.id, 'price', Number(e.target.value))} /></td>
                <td>{s.quantity_sold}</td>
                <td>{formatMoney(s.revenue)}</td>
              </tr>
            ))}
            {stock.length === 0 && <tr><td colSpan={6} className="empty">אין מוצרים מוגדרים — הוסף מוצרים בעמוד "מוצרים"</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
