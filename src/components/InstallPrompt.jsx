import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Detect if already installed related logic could go here

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-[100] animate-slide-up">
            <div className="bg-slate-900 !text-[#FAFAF7] p-4 rounded-[16px] shadow-2xl border border-white/10 flex items-center gap-4 max-w-sm ml-auto">
                <div className="bg-blue-600 p-2 rounded-[16px]">
                    <Download size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-sm">Instalar App</h3>
                    <p className="text-xs text-slate-300">Accede más rápido desde tu inicio</p>
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
                        Instalar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
