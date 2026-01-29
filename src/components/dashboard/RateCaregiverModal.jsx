import React, { useState } from 'react';
import { Star, X, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const RateCaregiverModal = ({ isOpen, onClose, appointment, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !appointment) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    appointment_id: appointment.id,
                    reviewer_id: appointment.client_id, // Assuming user is client
                    caregiver_id: appointment.caregiver_id,
                    rating: rating,
                    comment: comment
                });

            if (error) throw error;

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Error al enviar la calificación. Intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-start justify-center pt-24 p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-[16px] shadow-xl w-full max-w-md overflow-hidden relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Califica el Servicio</h2>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        ¿Cómo fue tu experiencia con <span className="font-bold text-blue-600">{appointment.caregiver?.full_name}</span>?
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Star Rating */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <Star
                                            size={32}
                                            className={`${star <= (hoverRating || rating)
                                                ? 'fill-orange-400 text-orange-400'
                                                : 'fill-gray-100 text-gray-200'
                                                } transition-colors`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-sm font-medium text-orange-500 h-5">
                                {hoverRating === 1 && 'Malo'}
                                {hoverRating === 2 && 'Regular'}
                                {hoverRating === 3 && 'Bueno'}
                                {hoverRating === 4 && 'Muy Bueno'}
                                {hoverRating === 5 && '¡Excelente!'}
                            </p>
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                <MessageSquare size={14} /> Tu opinión (opcional)
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Comparte detalles sobre el cuidado recibido..."
                                className="w-full px-4 py-3 rounded-[16px] border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none text-sm"
                                rows="3"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={rating === 0 || isSubmitting}
                            className={`w-full py-3 rounded-[16px] font-bold !text-[#FAFAF7] flex items-center justify-center gap-2 transition-all ${rating > 0 && !isSubmitting
                                ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
                                : 'bg-gray-300 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" /> Enviando...
                                </>
                            ) : (
                                'Enviar Calificación'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RateCaregiverModal;
