// Money formatting: ₪ with 2 decimals, Hebrew locale
export function formatMoney(n) {
  const v = Number(n) || 0
  return '₪' + v.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Given raw rows for one party, compute totals.
// income = sum(revenue line items) + sum(entries.count * tier.price)
// expenses = sum(expense line items)
// stockNet = sum(stock.cost) - sum(stock.revenue)   (positive = net cost, negative = net gain)
// profit = income - expenses - stockNet
export function computePartyTotals({ revenues = [], entries = [], expenses = [], stock = [] }) {
  const revenueTotal = revenues.reduce((s, r) => s + Number(r.amount || 0), 0)
  const entriesTotal = entries.reduce((s, e) => s + Number(e.count || 0) * Number(e.tier_price || 0), 0)
  const income = revenueTotal + entriesTotal

  const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)

  const stockCost = stock.reduce((s, r) => s + Number(r.cost || 0), 0)
  const stockRevenue = stock.reduce((s, r) => s + Number(r.revenue || 0), 0)
  const stockNet = stockCost - stockRevenue

  const profit = income - expenseTotal - stockNet

  return {
    income,
    expenses: expenseTotal,
    stockNet,
    profit,
  }
}
