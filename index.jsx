import { createRoot } from 'react-dom/client'
import './src/app.css'
import App from './src/app.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './src/auth/auth.jsx';
import { RouteGuard } from './src/route-guard/route-guard.jsx';

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <AuthProvider>
            <App />
        </AuthProvider>
    </BrowserRouter>
)