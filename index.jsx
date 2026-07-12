import { createRoot } from 'react-dom/client'
import './src/app.css'
import App from './src/app.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
)