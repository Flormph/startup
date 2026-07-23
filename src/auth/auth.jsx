import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [checked, setChecked] = useState(false); // New state to track if the auth check is complete

    useEffect(() => {
        fetch('/api/auth/me', { credentials: 'include' })
            .then((response) => (response.ok ? response.json() : null))
            .then((data) => setUser(data))
            .finally(() => setChecked(true)) // Set checked to true after the fetch is complete
            .catch(() => {
                setUser(null);
                setChecked(true);
            });
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, checked }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

export function useAuthedFetch() {
    const { setUser } = useAuth();

    return async function authedFetch(url, options = {}) {
        const res = await fetch(url, { ...options, credentials: 'include' });
        if (res.status === 401) {
            setUser(null); // session's gone — RouteGuard will redirect on its own
        }
        return res;
    };
}