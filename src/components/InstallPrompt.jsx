import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPrompt = ({ className }) => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // 1. Check if already installed (Standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (isStandalone) return;

        // 2. Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        if (isIosDevice) {
            // On iOS, we always show the prompt because there's no event to wait for
            setShowPrompt(true);
        } else {
            // On Android/Desktop, we wait for the browser event
            const handler = (e) => {
                e.preventDefault();
                setDeferredPrompt(e);
                setShowPrompt(true);
            };
            window.addEventListener('beforeinstallprompt', handler);
            return () => window.removeEventListener('beforeinstallprompt', handler);
        }
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            // Show iOS instructions
            alert("Para instalar en iPhone/iPad:\n1. Pulsa el botón 'Compartir' (cuadrado con flecha)\n2. Selecciona 'Agregar a Inicio'");
        } else {
            // Android/Desktop standard install
            if (!deferredPrompt) return;
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
                    <Download size={24} />
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
