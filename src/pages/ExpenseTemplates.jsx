import SimpleListManager from '../components/SimpleListManager'

export default function ExpenseTemplates() {
  return (
    <SimpleListManager
      table="expense_templates"
      title="תבניות הוצאות"
      amountFields={[{ key: 'default_amount', label: 'סכום ברירת מחדל' }]}
    />
  )
}
