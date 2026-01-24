import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-[var(--primary-color)] text-white py-12">
            <div className="container mx-auto px-4 text-center">
                <div className="mb-8">
                    <h4 className="text-xl font-bold mb-4">BuenCuidar</h4>
                    <p className="max-w-md mx-auto text-gray-300">
                        La plataforma líder en cuidado de adultos mayores.
                        Seguridad, profesionalismo y calidez humana.
                    </p>
                </div>
                <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} BuenCuidar. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;
