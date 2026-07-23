import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/auth.jsx';

export function RouteGuard() {
    const { user, checked } = useAuth();

    if (!checked) {
        return <p className="text-center p-6 text-[hsl(319,25%,46%)]">Loading...</p>;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
}