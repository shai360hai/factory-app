import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }) => 'nav-link' + (isActive ? ' active' : '')

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h1>פקטורי</h1>
      <div className="sub">ניהול מועדון</div>

      <div className="nav-group">
        <NavLink to="/calendar" className={linkClass}>📅 יומן אירועים</NavLink>
        <NavLink to="/parties" className={linkClass}>🎉 מסיבות</NavLink>
        <NavLink to="/parties/new" className={linkClass}>➕ מסיבה חדשה</NavLink>
        <NavLink to="/dashboard" className={linkClass}>📊 דשבורד חודשי</NavLink>
        <NavLink to="/settlement" className={linkClass}>⚖️ התחשבנות</NavLink>
        <NavLink to="/stock" className={linkClass}>📦 ניהול מלאי</NavLink>
      </div>

      <div className="nav-group">
        <h4>הגדרות</h4>
        <NavLink to="/products" className={linkClass}>📦 מוצרים (סחורה)</NavLink>
        <NavLink to="/expenses" className={linkClass}>💸 תבניות הוצאות</NavLink>
        <NavLink to="/revenue-categories" className={linkClass}>💰 קטגוריות הכנסה</NavLink>
        <NavLink to="/entry-tiers" className={linkClass}>🎫 מחירי כניסה</NavLink>
      </div>
    </div>
  )
}
