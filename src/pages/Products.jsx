import SimpleListManager from '../components/SimpleListManager'

export default function Products() {
  return (
    <SimpleListManager
      table="products"
      title="מוצרים (סחורה)"
      amountFields={[
        { key: 'cost_price', label: 'מחיר עלות' },
        { key: 'sale_price', label: 'מחיר מכירה' },
      ]}
    />
  )
}
