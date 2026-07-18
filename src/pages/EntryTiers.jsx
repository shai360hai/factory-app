import SimpleListManager from '../components/SimpleListManager'

export default function EntryTiers() {
  return (
    <SimpleListManager
      table="entry_tiers"
      title="מחירי כניסה"
      amountFields={[{ key: 'price', label: 'מחיר' }]}
    />
  )
}
