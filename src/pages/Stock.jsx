import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatMoney } from '../lib/calc'

export default function Stock() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('party_stock').select('*, products(name), parties(event_date, name)').order('created_at', { ascending: false }).then(({ data }) => {
      setRows(data || [])
      setLoading(false)
    })
  }, [])

  const byProduct = {}
  for (const r of rows) {
    const key = r.products?.name || 'לא ידוע'
    byProduct[key] = byProduct[key] || { qty: 0, revenue: 0, cost: 0 }
    byProduct[key].qty += r.quantity_sold || 0
    byProduct[key].revenue += Number(r.revenue || 0)
    byProduct[key].cost += Number(r.cost || 0)
  }

  return (
    <div className="main">
      <div className="page-header"><h2>ניהול מלאי</h2></div>

      {loading ? <div className="loading">טוען…</div> : (
        <>
          <div className="card">
            <div className="card-header"><div className="title">סיכום לפי מוצר (כל הזמן)</div></div>
            <table>
              <thead><tr><th>מוצר</th><th>כמות נמכרה</th><th>הכנסה</th><th>עלות</th><th>נטו</th></tr></thead>
              <tbody>
                {Object.entries(byProduct).map(([name, v]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{v.qty}</td>
                    <td>{formatMoney(v.revenue)}</td>
                    <td>{formatMoney(v.cost)}</td>
                    <td className={(v.revenue - v.cost) >= 0 ? 'value pos' : 'value neg'}>{formatMoney(v.revenue - v.cost)}</td>
                  </tr>
                ))}
                {Object.keys(byProduct).length === 0 && <tr><td colSpan={5} className="empty">אין נתוני סחורה</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-header"><div className="title">היסטוריה לפי מסיבה</div></div>
            <table>
              <thead><tr><th>תאריך</th><th>מסיבה</th><th>מוצר</th><th>כמות</th><th>הכנסה</th><th>עלות</th></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.parties?.event_date}</td>
                    <td>{r.parties?.name || '—'}</td>
                    <td>{r.products?.name}</td>
                    <td>{r.quantity_sold}</td>
                    <td>{formatMoney(r.revenue)}</td>
                    <td>{formatMoney(r.cost)}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={6} className="empty">אין נתונים</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
