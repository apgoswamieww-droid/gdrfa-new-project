
import { createRoot } from 'react-dom/client'
import './index.css'
import './locales/i18n'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { ScrollProvider } from './utils/ScrollContext.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename="/sports">
  {/* <BrowserRouter> */}
    <ScrollProvider>
      <App />
    </ScrollProvider>
  </BrowserRouter >

)
