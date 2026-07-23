// LogoutButton.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth.jsx';

export function LogoutButton() {
    const navigate = useNavigate();
    const { setUser } = useAuth();

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'DELETE', credentials: 'include' });
        setUser(null);
        navigate('/');
    }

    return (
        <button
            className="text-[hsl(319,25%,46%)] border-2 border-[hsl(319,25%,46%)] px-3 py-1 bg-[#f3c3e0] hover:text-[antiquewhite] hover:bg-[hsl(319,25%,46%)]"
            onClick={handleLogout}
        >
            Log Out
        </button>
    );
}