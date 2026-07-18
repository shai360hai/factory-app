import SimpleListManager from '../components/SimpleListManager'

export default function RevenueCategories() {
  return (
    <SimpleListManager
      table="revenue_categories"
      title="קטגוריות הכנסה"
      amountFields={[]}
    />
  )
}
