import React from 'react';
import './login.css';

export function Login() {
    return (
        <main>
            <h2>Welcome to Gedidone!</h2>
            <p>Log in or create an account to get started!"</p>

            <form method="post" action="sticky-note.html" class="flex flex-col gap-2.5 p-5 items-center border-2 border-[hsl(319,25%,46%)]">
                <div class="flex items-center gap-2">
                    <span class="w-24 text-right">Email:</span>
                    <input type="email" name="email" required placeholder="Enter your email"
                        class="flex-1 border-2 border-[hsl(319,25%,46%)] rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(319,25%,46%)]" />
                </div>
                <div class="flex items-center gap-2">
                    <span class="w-24 text-right">Password:</span>
                    <input type="password" name="password" required placeholder="Enter your password"
                        class="flex-1 border-2 border-[hsl(319,25%,46%)] rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(319,25%,46%)]" />
                </div>
                <div class="flex gap-2.5">
                    <input type="submit" value="Log In" name="login-action"
                        class="px-4 py-2 rounded cursor-pointer bg-[hsl(319,25%,46%)] text-[antiquewhite] border-none hover:bg-[hsl(319,25%,56%)]" />
                    <input type="submit" value="Create Account" name="create-account-action"
                        class="px-4 py-2 rounded cursor-pointer bg-[hsl(319,25%,46%)] text-[antiquewhite] border-none hover:bg-[hsl(319,25%,56%)]" />
                </div>
            </form>
        </main>
    );
}