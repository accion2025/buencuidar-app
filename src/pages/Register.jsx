import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, User, Heart, MapPin, Globe, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { translateSupabaseError } from '../utils/translations';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { CENTRAL_AMERICA } from '../constants/locations';
import { CAREGIVER_SPECIALTIES } from '../constants/caregiver';

const Register = () => {
    const navigate = useNavigate();
    const { signUp, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'family', // Default to family
        country: 'nicaragua',
        department: '',
        municipality: '',
        specialization: 'Acompañamiento Integral',
        experience: '',
        bio: ''
    });

    // Location lists based on selection
    const [availableDepartments, setAvailableDepartments] = useState([]);
    const [availableMunicipalities, setAvailableMunicipalities] = useState([]);

    useEffect(() => {
        const countryData = CENTRAL_AMERICA.find(c => c.id === formData.country);
        if (countryData && countryData.departments) {
            const depts = Object.keys(countryData.departments);
            setAvailableDepartments(depts);
            // Auto-select first department if none selected or if switching countries
            if (depts.length > 0) {
                setFormData(prev => ({ ...prev, department: depts[0] }));
            }
        } else {
            setAvailableDepartments([]);
            setAvailableMunicipalities([]);
        }
    }, [formData.country]);

    useEffect(() => {
        const countryData = CENTRAL_AMERICA.find(c => c.id === formData.country);
        if (countryData && countryData.departments && formData.department) {
            const munis = countryData.departments[formData.department] || [];
            setAvailableMunicipalities(munis);
            // Auto-select first municipality
            if (munis.length > 0) {
                setFormData(prev => ({ ...prev, municipality: munis[0] }));
            }
        } else {
            setAvailableMunicipalities([]);
        }
    }, [formData.department, formData.country]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleRoleSelect = (role) => {
        setFormData(prev => ({ ...prev, role }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // New User Registration with unified data
            const { error: signUpError } = await signUp(formData.email, formData.password, {
                full_name: formData.fullName,
                role: formData.role,
                country: formData.country,
                department: formData.department,
                municipality: formData.municipality,
                location: `${formData.municipality}, ${formData.department}`,
                specialization: formData.role === 'caregiver' ? formData.specialization : null,
                experience: formData.role === 'caregiver' ? formData.experience : null,
                bio: formData.role === 'caregiver' ? formData.bio : null
            });

            if (signUpError) {
                if (signUpError.message.includes('already registered')) {
                    setError('Este correo ya está registrado. Intenta iniciar sesión.');
                } else {
                    setError(translateSupabaseError(signUpError.message));
                }
                setLoading(false);
                return;
            }

            navigate('/registration-success', {
                state: {
                    fullName: formData.fullName,
                    email: formData.email,
                    requiresConfirmation: true,
                    role: formData.role
                }
            });

        } catch (err) {
            console.error("Error registration:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--base-bg)] flex flex-col overflow-hidden">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 py-28 md:py-24 flex items-center justify-center relative">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[var(--secondary-color)] rounded-full blur-[120px] opacity-10 -z-10 animate-pulse hidden md:block"></div>
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[var(--accent-color)] rounded-full blur-[120px] opacity-20 -z-10 hidden md:block"></div>

                <div className="card w-full max-w-3xl bg-white p-8 md:p-14 animate-fade-in-up shadow-2xl border-none">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-brand font-bold text-[var(--primary-color)] tracking-tight">
                            Únete a BuenCuidar
                        </h2>
                        <p className="text-[var(--text-light)] mt-2 font-secondary">
                            Regístrate para comenzar tu experiencia con nosotros
                        </p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-[16px] flex items-start gap-3 animate-shake">
                            <AlertCircle className="text-[var(--error-color)] shrink-0" size={20} />
                            <p className="text-xs font-black text-[var(--error-color)] uppercase tracking-widest leading-relaxed">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Role Selector */}
                        <div className="space-y-4">
                            <label className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3 text-center">
                                ¿Cómo deseas usar la plataforma?
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleRoleSelect('family')}
                                    className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-center gap-3 text-center ${formData.role === 'family'
                                        ? 'border-[var(--secondary-color)] bg-green-50 shadow-lg shadow-green-100'
                                        : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                                        }`}
                                >
                                    <div className={`p-3 rounded-full ${formData.role === 'family' ? 'bg-[var(--secondary-color)] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                        <Heart size={24} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold uppercase tracking-widest text-xs ${formData.role === 'family' ? 'text-[var(--primary-color)]' : 'text-gray-500'}`}>Busco Cuidado</h3>
                                        <p className="text-[10px] text-gray-400 font-secondary mt-1">Para familias y pacientes</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleRoleSelect('caregiver')}
                                    className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-center gap-3 text-center ${formData.role === 'caregiver'
                                        ? 'border-[var(--primary-color)] bg-blue-50 shadow-lg shadow-blue-100'
                                        : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                                        }`}
                                >
                                    <div className={`p-3 rounded-full ${formData.role === 'caregiver' ? 'bg-[var(--primary-color)] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold uppercase tracking-widest text-xs ${formData.role === 'caregiver' ? 'text-[var(--primary-color)]' : 'text-gray-500'}`}>Soy Cuidador</h3>
                                        <p className="text-[10px] text-gray-400 font-secondary mt-1">Para profesionales de la salud</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="fullName" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    required
                                    className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800"
                                    placeholder="Ej. Juan Pérez"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800"
                                    placeholder="juan@ejemplo.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Caregiver specific fields */}
                        {formData.role === 'caregiver' && (
                            <div className="space-y-8 animate-fade-in py-4 bg-blue-50/30 rounded-[24px] px-6 border border-blue-100/50">
                                <div className="flex items-center gap-2 border-b border-blue-100 pb-2">
                                    <User size={16} className="text-[var(--primary-color)]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--primary-color)]">Perfil Profesional del Cuidador</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="experience" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3 flex items-center gap-2">
                                            Años de Experiencia
                                        </label>
                                        <input
                                            type="number"
                                            id="experience"
                                            name="experience"
                                            min="0"
                                            required={formData.role === 'caregiver'}
                                            className="w-full px-6 py-4 bg-white border-2 border-transparent rounded-[16px] focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800"
                                            placeholder="Ej. 5"
                                            value={formData.experience}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="specialization" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                            Especialización Principal
                                        </label>
                                        <select
                                            id="specialization"
                                            name="specialization"
                                            required={formData.role === 'caregiver'}
                                            className="w-full px-6 py-4 bg-white border-2 border-transparent rounded-[16px] focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSJncmF5Ij48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMiIgZD0iTTE5IDlsLTcgNy03LTciPjwvcGF0aD48L3N2Zz4=')] bg-no-repeat bg-[right_1.5rem_center] bg-[length:1.2em]"
                                            value={formData.specialization}
                                            onChange={handleChange}
                                        >
                                            {CAREGIVER_SPECIALTIES.map(specialty => (
                                                <option key={specialty} value={specialty}>
                                                    {specialty}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="bio" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                        Breve Biografía Profesional
                                    </label>
                                    <textarea
                                        id="bio"
                                        name="bio"
                                        rows="4"
                                        required={formData.role === 'caregiver'}
                                        className="w-full px-6 py-4 bg-white border-2 border-transparent rounded-[16px] focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800 resize-none"
                                        placeholder="Cuéntanos sobre tu experiencia y por qué amas tu trabajo..."
                                        value={formData.bio}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {/* Location Fields */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                <MapPin size={16} className="text-[var(--secondary-color)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Ubicación del Servicio</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label htmlFor="country" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Globe size={14} /> País
                                    </label>
                                    <select
                                        id="country"
                                        name="country"
                                        className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSJncmF5Ij48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMiIgZD0iTTE5IDlsLTcgNy03LTciPjwvcGF0aD48L3N2Zz4=')] bg-no-repeat bg-[right_1.5rem_center] bg-[length:1.2em]"
                                        value={formData.country}
                                        onChange={handleChange}
                                    >
                                        {CENTRAL_AMERICA.map(c => (
                                            <option key={c.id} value={c.id} disabled={!c.active}>
                                                {c.name} {!c.active && '(Próximamente)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="department" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Home size={14} /> Departamento
                                    </label>
                                    <select
                                        id="department"
                                        name="department"
                                        required
                                        className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSJncmF5Ij48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMiIgZD0iTTE5IDlsLTcgNy03LTciPjwvcGF0aD48L3N2Zz4=')] bg-no-repeat bg-[right_1.5rem_center] bg-[length:1.2em]"
                                        value={formData.department}
                                        onChange={handleChange}
                                    >
                                        {availableDepartments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="municipality" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
                                        Municipio
                                    </label>
                                    <select
                                        id="municipality"
                                        name="municipality"
                                        required
                                        className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlPSJncmF5Ij48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMiIgZD0iTTE5IDlsLTcgNy03LTciPjwvcGF0aD48L3N2Zz4=')] bg-no-repeat bg-[right_1.5rem_center] bg-[length:1.2em]"
                                        value={formData.municipality}
                                        onChange={handleChange}
                                    >
                                        {availableMunicipalities.map(muni => (
                                            <option key={muni} value={muni}>{muni}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="password" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    required
                                    className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-xs font-black text-[var(--primary-color)] uppercase tracking-widest mb-3">
                                    Confirmar Contraseña
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    required
                                    className="w-full px-6 py-4 bg-[var(--base-bg)] border-2 border-transparent rounded-[16px] focus:bg-white focus:border-[var(--secondary-color)] outline-none transition-all font-secondary text-gray-800"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="flex items-start">
                            <input
                                id="terms"
                                name="terms"
                                type="checkbox"
                                required
                                className="mt-1 h-5 w-5 text-[var(--secondary-color)] focus:ring-[var(--secondary-color)] border-gray-300 rounded-[6px] transition-all cursor-pointer"
                            />
                            <label htmlFor="terms" className="ml-3 block text-sm text-[var(--text-main)] font-secondary">
                                Al registrarme, acepto los <a href="#" className="font-bold text-[var(--secondary-color)] hover:underline">Términos y Condiciones</a> y la Política de Privacidad de BuenCuidar.
                            </label>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn btn-primary py-5 text-lg shadow-xl shadow-green-100 uppercase tracking-widest group"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-3">
                                        <Loader2 className="animate-spin" size={24} />
                                        <span>Procesando...</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-3">
                                        Registrarse Ahora
                                    </span>
                                )}
                            </button>
                        </div>
                    </form >

                    <div className="mt-12 text-center space-y-4 border-t border-gray-50 pt-10">
                        <div className="pt-4">
                            <p className="text-sm font-secondary text-[var(--text-light)]">
                                ¿Ya tienes cuenta?{' '}
                                <Link to="/login" className="font-black text-[var(--primary-color)] hover:underline uppercase tracking-widest text-xs">
                                    Inicia Sesión
                                </Link>
                            </p>
                        </div>
                    </div>
                </div >
            </main >

            <Footer />
        </div >
    );
};

export default Register;
