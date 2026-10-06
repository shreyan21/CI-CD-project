import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'

const Page = window.location.pathname.startsWith('/admin')
  ? lazy(() => import('./admin/AdminApp.jsx'))
  : lazy(() => import('./App.jsx'))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<main className="page-loading"><span /><p>Loading portfolio…</p></main>}>
      <Page />
    </Suspense>
  </React.StrictMode>,
)
