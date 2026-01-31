import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

const InstallPrompt = ({ className }) => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // 1. Check if already installed (Standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

        // ALWAYS show the prompt if not currently installed
        // This ensures the button is visible even if the browser event is delayed or suppressed
        if (!isStandalone) {
            setShowPrompt(true);
        }

        // 2. Detect iOS (including iPads requesting desktop site)
        const userAgent = window.navigator.userAgent;
        const isIosDevice = /iPad|iPhone|iPod/.test(userAgent) ||
            (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
        setIsIOS(isIosDevice);

        // 3. Listen for the native Android install event
        // Even if we showed the prompt above, we need this event to trigger the native dialog
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            console.log("Native install event captured");
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            // Try to open the native share sheet
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'BuenCuidar',
                        text: 'Instala BuenCuidar en tu inicio para acceder más rápido.',
                        url: window.location.href,
                    });
                } catch (err) {
                    console.log('Share canceled or failed', err);
                }
            } else {
                // Fallback implementation instructions
                alert("Para instalar en iPhone/iPad:\n1. Pulsa el botón 'Compartir' (icono cuadrado con flecha)\n2. Desliza hacia abajo y selecciona 'Agregar a Inicio'");
            }
        } else {
            // Android/Desktop standard install
            if (!deferredPrompt) {
                alert("La instalación automática no está lista. Intenta desde el menú del navegador (3 puntos) -> Instalar aplicación.");
                return;
            }
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`);
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    if (!showPrompt) return null;

    return (
        <div className={className || "fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-[100] animate-slide-up"}>
            <div className="bg-slate-900 !text-[#FAFAF7] p-4 rounded-[16px] shadow-2xl border border-white/10 flex items-center gap-4 max-w-sm ml-auto w-full">
                <div className="bg-blue-600 p-2 rounded-[16px] flex-shrink-0">
                    {isIOS ? <Share size={24} /> : <Download size={24} />}
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-sm !text-[#2FAE8F]">
                        {isIOS ? 'Instalar en iPhone' : 'Instalar App'}
                    </h3>
                    <p className="text-xs text-slate-300">
                        {isIOS ? 'Pulsa Compartir y Agrégala' : 'Accede más rápido desde tu inicio'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowPrompt(false)}
                        className="p-2 hover:bg-white/10 rounded-[16px] text-slate-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="bg-white text-slate-900 px-4 py-2 rounded-[16px] text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                        {isIOS ? 'Instrucción' : 'Instalar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
