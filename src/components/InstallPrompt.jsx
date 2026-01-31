import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

const InstallPrompt = ({ className }) => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        // 1. Check if already installed (Standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

        // ALWAYS show the prompt if not currently installed
        if (!isStandalone) {
            setShowPrompt(true);
        }

        // 2. Detect iOS
        const userAgent = window.navigator.userAgent;
        const isIosDevice = /iPad|iPhone|iPod/.test(userAgent) ||
            (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
        setIsIOS(isIosDevice);

        // 3. Listen for Android install event
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            console.log("Native install event captured");
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleShareClick = async () => {
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
            // Fallback if web share api not supported
            setShowInstructions(true);
        }
    };

    const handleAndroidInstall = async () => {
        if (!deferredPrompt) {
            alert("La instalación automática no está lista. Intenta desde el menú del navegador.");
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <>
            {/* Main Prompt Toast */}
            <div className={className || "fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-[100] animate-slide-up"}>
                <div className="bg-slate-900 !text-[#FAFAF7] p-4 rounded-[16px] shadow-2xl border border-white/10 flex flex-col sm:flex-row items-center gap-4 max-w-md ml-auto w-full">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="bg-blue-600 p-2 rounded-[16px] flex-shrink-0">
                            {isIOS ? <Share size={24} /> : <Download size={24} />}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-sm !text-[#2FAE8F]">
                                {isIOS ? 'Instalar en iPhone' : 'Instalar App'}
                            </h3>
                            <p className="text-xs text-slate-300">
                                {isIOS ? 'Agrega a inicio para mejor experiencia' : 'Accede más rápido desde tu inicio'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowPrompt(false)}
                            className="p-2 hover:bg-white/10 rounded-[16px] text-slate-400 transition-colors sm:order-3"
                        >
                            <X size={18} />
                        </button>

                        {isIOS ? (
                            <>
                                <button
                                    onClick={() => setShowInstructions(true)}
                                    className="text-slate-300 px-3 py-2 rounded-[16px] text-xs font-medium hover:bg-white/5 transition-colors whitespace-nowrap"
                                >
                                    Instrucciones
                                </button>
                                <button
                                    onClick={handleShareClick}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-[16px] text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                                >
                                    <Share size={14} />
                                    Compartir
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleAndroidInstall}
                                className="bg-white text-slate-900 px-4 py-2 rounded-[16px] text-xs font-bold hover:bg-gray-100 transition-colors whitespace-nowrap"
                            >
                                Instalar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* iOS Instructions Modal */}
            {showInstructions && (
                <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white text-slate-900 w-full max-w-sm rounded-[24px] p-6 shadow-2xl animate-slide-up relative">
                        <button
                            onClick={() => setShowInstructions(false)}
                            className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold mb-2">Instalar en iPhone</h3>
                            <p className="text-sm text-gray-500">Sigue estos sencillos pasos</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                    <Share size={24} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">1. Toca 'Compartir'</p>
                                    <p className="text-xs text-gray-500">En la barra inferior de Safari</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                <div className="bg-gray-200 p-2 rounded-lg text-gray-600">
                                    <span className="text-xl font-bold leading-none">+</span>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">2. 'Agregar a Inicio'</p>
                                    <p className="text-xs text-gray-500">Desliza hacia abajo para encontrarlo</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                <div className="bg-gray-200 p-2 rounded-lg text-gray-600">
                                    <span className="text-sm font-bold">Agregar</span>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">3. Confirma</p>
                                    <p className="text-xs text-gray-500">Toca 'Agregar' arriba a la derecha</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowInstructions(false)}
                            className="w-full mt-6 bg-slate-900 text-white py-3 rounded-[16px] font-bold hover:bg-slate-800 transition-transform active:scale-95"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default InstallPrompt;
