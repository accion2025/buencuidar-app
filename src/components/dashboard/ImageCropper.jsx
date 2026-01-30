import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import { Sliders } from 'lucide-react';

const [isSaving, setIsSaving] = useState(false);

const onCropChange = (crop) => {
    setCrop(crop);
};

const onZoomChange = (zoom) => {
    setZoom(zoom);
};

const onRotationChange = (rotation) => {
    setRotation(rotation);
};

const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
}, []);

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous'); // Essential for external images (Supabase)
        image.src = url;
    });

const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
    );
    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((file) => {
            if (file) {
                resolve(file);
            } else {
                reject(new Error('Canvas is empty'));
            }
        }, 'image/jpeg', 0.9);
    });
};

const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
        if (!croppedAreaPixels) {
            throw new Error("No hay área de recorte seleccionada");
        }
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
        if (onCropComplete) {
            await onCropComplete(croppedImage);
        }
    } catch (e) {
        console.error('Error saving cropped image:', e);
        alert('Error al guardar la imagen. Asegúrate de mover la imagen un poco antes de guardar.');
    } finally {
        setIsSaving(false);
    }
};

return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-[24px] overflow-hidden shadow-2xl w-full max-w-[340px] animate-scale-in flex flex-col">
            <div className="relative w-full h-[340px] bg-black">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={1}
                    cropSize={{ width: 280, height: 280 }}
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteHandler}
                    onZoomChange={onZoomChange}
                    cropShape="round"
                    showGrid={true}
                    restrictPosition={false}
                    objectFit="horizontal-cover"
                    classes={{
                        containerClassName: "h-full w-full",
                        mediaClassName: "h-auto max-h-full",
                    }}
                />
            </div>

            <div className="p-6 space-y-6 bg-white shrink-0">
                <div className="space-y-5">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 w-12 text-right">Zoom</span>
                        <div className="flex-1 relative h-6 flex items-center">
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[var(--secondary-color)]"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 w-12 text-right">Giro</span>
                        <div className="flex-1 relative h-6 flex items-center">
                            <input
                                type="range"
                                value={rotation}
                                min={0}
                                max={360}
                                step={1}
                                aria-labelledby="Rotation"
                                onChange={(e) => setRotation(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[var(--secondary-color)]"
                            />
                        </div>
                    </div>
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
                        {isSaving ? 'Guardando...' : 'Guardar Foto'}
                    </button>
                </div>
            </div>
        </div>
    </div>,
    document.body
);
};

export default ImageCropper;
