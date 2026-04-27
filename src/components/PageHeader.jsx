export default function PageHeader({ title, subtitle, search, onSearch, searchPlaceholder = 'Search…', actionLabel, onAction }) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <h2 className="page-title">{title}</h2>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      <div className="page-header-right">
        {onSearch && (
          <div className="search-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="search" placeholder={searchPlaceholder} value={search} onChange={(e) => onSearch(e.target.value)} />
          </div>
        )}
        {onAction && (
          <button className="btn btn-primary btn-icon" onClick={onAction}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
