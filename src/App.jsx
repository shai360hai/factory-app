import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Calendar from './pages/Calendar'
import Parties from './pages/Parties'
import PartiesArchive from './pages/PartiesArchive'
import PartyForm from './pages/PartyForm'
import PartyDetail from './pages/PartyDetail'
import Dashboard from './pages/Dashboard'
import Settlement from './pages/Settlement'
import Stock from './pages/Stock'
import Products from './pages/Products'
import ExpenseTemplates from './pages/ExpenseTemplates'
import RevenueCategories from './pages/RevenueCategories'
import EntryTiers from './pages/EntryTiers'

export default function App() {
  return (
    <div className="layout">
      <Sidebar />
      <Routes>
        <Route path="/" element={<Navigate to="/parties" replace />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/parties" element={<Parties />} />
        <Route path="/parties/archive" element={<PartiesArchive />} />
        <Route path="/parties/new" element={<PartyForm />} />
        <Route path="/parties/:id" element={<PartyDetail />} />
        <Route path="/parties/:id/edit" element={<PartyForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settlement" element={<Settlement />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/products" element={<Products />} />
        <Route path="/expenses" element={<ExpenseTemplates />} />
        <Route path="/revenue-categories" element={<RevenueCategories />} />
        <Route path="/entry-tiers" element={<EntryTiers />} />
      </Routes>
    </div>
  )
}
