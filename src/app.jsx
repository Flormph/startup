import React, { useState } from 'react';
import './app.css';

import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Login } from './login/login.jsx';
import { PetMeadow } from './pet-meadow/pet-meadow.jsx';
import { StickyNote } from './sticky-note/sticky-note.jsx';
import { About } from './about/about.jsx';
import { Game } from './game/game.jsx';
import { NotFound } from './not-found/not-found.jsx';
import { AuthProvider } from './auth/auth.jsx';
import { RouteGuard } from './route-guard/route-guard.jsx';
import { LogoutButton } from './logout-button/logout-button.jsx';


export default function App() {
    const [navOpen, setNavOpen] = useState(false);
    const location = useLocation();

    React.useEffect(() => {
        setNavOpen(false);
    }, [location]);

    return (
        <AuthProvider>
            <div className="font-geist bg-[antiquewhite] m-0 min-h-screen flex flex-col">
                <header className="bg-[#f3c3e0] p-2.5 text-center text-[hsl(319,25%,46%)] border-b-2 border-[hsl(319,25%,46%)] flex gap-[30px] justify-start items-center sticky top-0 left-0 w-full box-border z-50">
                    <NavLink className="text-[hsl(319,25%,46%)] bg-[antiquewhite] no-underline text-2xl font-bold p-2.5 py-1 border-2 border-[hsl(319,25%,46%)] hover:bg-[hsl(319,25%,46%)] hover:text-[antiquewhite]" to="/">Gedidone</NavLink>

                    <button
                        onClick={() => setNavOpen(!navOpen)}
                        className="md:hidden text-2xl px-3"
                        aria-label="Toggle navigation"
                        aria-expanded={navOpen}
                    >
                        ☰
                    </button>

                    <nav className={`${navOpen ? 'flex' : 'hidden'} md:flex absolute md:static top-full left-0 w-full md:w-auto bg-[#f3c3e0] md:bg-transparent border-b-2 border-[hsl(319,25%,46%)] md:border-none`}>
                        <ul className="flex flex-col md:flex-row items-start gap-4 md:gap-12 list-none m-0 p-4 md:p-0">
                            <li>
                                <NavLink
                                    className={({ isActive }) =>
                                        `no-underline ${isActive ? 'text-[hsl(319,25%,30%)] font-bold' : 'text-[hsl(319,25%,46%)]'}`
                                    }
                                    to="/sticky-note"
                                >
                                    Sticky Note
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    className={({ isActive }) =>
                                        `no-underline ${isActive ? 'text-[hsl(319,25%,30%)] font-bold' : 'text-[hsl(319,25%,46%)]'}`
                                    }
                                    to="/pet-meadow"
                                >
                                    Pet Meadow
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    className={({ isActive }) =>
                                        `no-underline ${isActive ? 'text-[hsl(319,25%,30%)] font-bold' : 'text-[hsl(319,25%,46%)]'}`
                                    }
                                    to="/game"
                                >
                                    Game
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    className={({ isActive }) =>
                                        `no-underline ${isActive ? 'text-[hsl(319,25%,30%)] font-bold' : 'text-[hsl(319,25%,46%)]'}`
                                    }
                                    to="/about"
                                >
                                    About
                                </NavLink>
                            </li>
                            <li>
                                <LogoutButton />
                            </li>

                        </ul>
                    </nav>
                </header>

                <main className="flex-1">
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route element={<RouteGuard />}>
                            <Route path="/pet-meadow" element={<PetMeadow />} />
                            <Route path="/sticky-note" element={<StickyNote />} />
                            <Route path="/game" element={<Game />} />
                        </Route>
                        <Route path="/about" element={<About />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>

                <footer className="p-6 text-center text-sm text-[hsl(319,25%,46%)]">
                    <hr className="gedidone-divider border-[hsl(319,25%,46%)] mb-4 w-screen relative left-1/2 -translate-x-1/2" />
                    <span className="text-black opacity-75">Joseph Lee</span>
                    <br />
                    <a href="https://www.github.com/Flormph/startup" className="text-[hsl(319,25%,46%)] no-underline opacity-75" title="GitHub repository">GitHub repository</a>
                    <br />
                    <a href="https://www.flaticon.com/free-icons/axolotl" title="axolotl icons" className="text-[hsl(319,25%,46%)] no-underline opacity-75">Axolotl icons created by Freepik - Flaticon</a>
                </footer>
            </div>
        </AuthProvider >
    );
}
