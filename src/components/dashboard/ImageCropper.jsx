import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import AvatarEditor from 'react-avatar-editor';
import { Loader2 } from 'lucide-react';

const ImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
    const editorRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!editorRef.current || isSaving) return;

        setIsSaving(true);
        try {
            // Get the canvas with the cropped image
            const canvas = editorRef.current.getImageScaledToCanvas();

            // Convert canvas to blob
            canvas.toBlob((blob) => {
                if (blob) {
                    onCropComplete(blob);
                } else {
                    console.error('Canvas is empty');
                    alert('Error al procesar la imagen.');
                }
                setIsSaving(false);
            }, 'image/jpeg', 0.9);

        } catch (e) {
            console.error('Error saving cropped image:', e);
            alert('Error al guardar. Intenta de nuevo.');
            setIsSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] overflow-hidden shadow-2xl w-full max-w-[340px] flex flex-col animate-scale-in">
                <div className="relative w-full bg-black flex justify-center items-center py-4" style={{ touchAction: 'none' }}>
                    <AvatarEditor
                        ref={editorRef}
                        image={imageSrc}
                        width={280}
                        height={280}
                        border={20}
                        borderRadius={140} // Circular mask
                        color={[0, 0, 0, 0.6]} // Background dimming
                        scale={scale}
                        rotate={0}
                        className="max-w-full h-auto"
                        allowTransparent={false} // Ensure background isn't weirdly transparent
                    />
                </div>

                <div className="p-6 space-y-6 bg-white shrink-0">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            <span>Zoom</span>
                            <span>{Math.round(scale * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            value={scale}
                            min={1}
                            max={3}
                            step={0.01}
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--secondary-color)]"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onCancel}
                            disabled={isSaving}
                            className="flex-1 bg-gray-50 border border-gray-100 text-gray-500 font-bold py-4 rounded-[16px] uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-[2] bg-[var(--primary-color)] !text-[#FAFAF7] font-bold py-4 rounded-[16px] uppercase tracking-widest text-[10px] shadow-lg shadow-green-900/20 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Procesando
                                </>
                            ) : (
                                'Guardar Foto'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ImageCropper;
