import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth.jsx';

export function Login() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [error, setError] = React.useState(null);

    async function handleSubmit(event) {
        event.preventDefault();

        const action = event.nativeEvent.submitter.name; // 'login-action' or 'create-account-action'
        const endpoint = action === 'create-account-action' ? '/api/auth/create' : '/api/auth/login';

        const formData = new FormData(event.target);
        const email = formData.get('email');
        const password = formData.get('password');

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include', // Include cookies in the request
        });

        if (response.ok) {
            const data = await response.json();
            setUser(data);
            navigate('/sticky-note'); // Redirect to the sticky note page after successful login or account creation
        } else {
            const data = await response.json();
            setError(data.msg || 'An error occurred. Please try again.');
        }
    }

    return (
        <main className="p-5 pb-[70px] flex flex-col items-center">
            <h2 className="p-[2px]">Welcome to Gedidone!</h2>
            <p>Log in or create an account to get started!"</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 p-5 items-center border-2 border-[hsl(319,25%,46%)]">                <div className="flex items-center gap-2">
                <span className="w-24 text-right">Email:</span>
                <input type="email" name="email" required placeholder="Enter your email"
                    className="flex-1 border-2 border-[hsl(319,25%,46%)] rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(319,25%,46%)]" />
            </div>
                <div className="flex items-center gap-2">
                    <span className="w-24 text-right">Password:</span>
                    <input type="password" name="password" required placeholder="Enter your password"
                        className="flex-1 border-2 border-[hsl(319,25%,46%)] rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(319,25%,46%)]" />
                </div>
                <div className="flex gap-2.5">
                    <input type="submit" value="Log In" name="login-action"
                        className="px-4 py-2 rounded cursor-pointer bg-[hsl(319,25%,46%)] text-[antiquewhite] border-none hover:bg-[hsl(319,25%,56%)]" />
                    <input type="submit" value="Create Account" name="create-account-action"
                        className="px-4 py-2 rounded cursor-pointer bg-[hsl(319,25%,46%)] text-[antiquewhite] border-none hover:bg-[hsl(319,25%,56%)]" />
                </div>
            </form>
        </main >
    );
}