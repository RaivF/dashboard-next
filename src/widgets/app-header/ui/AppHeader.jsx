export default function AppHeader({ activePath, navItems, title, onNavigate }) {
  return (
    <header className="hero">
      <div className="hero__content">
        <h1>{title}</h1>
      </div>

      <div className="hero__controls">
        <nav className="page-tabs" aria-label="Разделы">
          {navItems.map((item) => (
            <button
              className={`page-tab${activePath === item.path ? ' page-tab--active' : ''}`}
              key={item.path}
              type="button"
              onClick={() => onNavigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
