import React from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

export function Login() {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/sticky-note');
    };

    return (
        <main>
            <h2>Welcome to Gedidone!</h2>
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