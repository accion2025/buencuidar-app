import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, LayoutDashboard, Menu, X } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, profile } = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);

    const isRegistrationSuccess = location.pathname === '/registration-success';
    const showUserMenu = user && !isRegistrationSuccess;

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    <Link to="/" className="text-2xl font-bold text-[var(--primary-color)] flex-shrink-0">
                        BuenCuidar
                    </Link>

                    {/* Desktop Menu */}
                    <nav className="hidden md:flex items-center gap-4">
                        <Link to="/services" className="btn btn-secondary">
                            Servicios
                        </Link>
                        {!showUserMenu ? (
                            <>
                                <button onClick={() => navigate('/login')} className="btn btn-secondary text-sm">Iniciar Sesión</button>
                                <button onClick={() => navigate('/register')} className="btn btn-primary text-sm whitespace-nowrap">Registrarse</button>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className="hidden lg:flex flex-col items-end">
                                    <span className="text-xs text-gray-400 font-medium">Hola de nuevo</span>
                                    <span className="text-sm font-bold text-gray-800">{profile?.full_name || 'Usuario'}</span>
                                </div>
                                <button
                                    onClick={() => navigate(profile?.role === 'caregiver' ? '/caregiver' : '/dashboard')}
                                    className="btn btn-primary flex items-center gap-2 text-sm"
                                >
                                    <LayoutDashboard size={18} />
                                    <span>Mi Panel</span>
                                </button>
                            </div>
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {isOpen && (
                    <div className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4 animate-fade-in space-y-3">
                        {showUserMenu && (
                            <div className="flex items-center gap-3 px-2 pb-2 mb-2 border-b border-gray-50">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                    <User size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-800">{profile?.full_name || 'Usuario'}</span>
                                    <span className="text-xs text-gray-400">Sesión activa</span>
                                </div>
                            </div>
                        )}

                        <Link
                            to="/services"
                            className="btn btn-secondary w-full justify-center"
                            onClick={() => setIsOpen(false)}
                        >
                            Servicios
                        </Link>

                        {!showUserMenu ? (
                            <div className="grid gap-3 pt-2">
                                <button
                                    onClick={() => { navigate('/login'); setIsOpen(false); }}
                                    className="w-full btn btn-secondary justify-center"
                                >
                                    Iniciar Sesión
                                </button>
                                <button
                                    onClick={() => { navigate('/register'); setIsOpen(false); }}
                                    className="w-full btn btn-primary justify-center"
                                >
                                    Registrarse
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    navigate(profile?.role === 'caregiver' ? '/caregiver' : '/dashboard');
                                    setIsOpen(false);
                                }}
                                className="w-full btn btn-primary justify-center gap-2 mt-2"
                            >
                                <LayoutDashboard size={20} />
                                Ir a Mi Panel
                            </button>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;
