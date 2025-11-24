import React from 'react';
import { MessageSquare, Mic, Heart, X } from 'lucide-react';

interface OnboardingProps {
    onClose: () => void;
}

export default function Onboarding({ onClose }: OnboardingProps) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-8 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                        aria-label="Close welcome screen"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <h2 className="text-3xl font-bold mb-2">Welcome to Buddy AI! 👋</h2>
                    <p className="text-amber-50 text-lg">Your personal AI assistant for conversations and emotional support.</p>
                </div>

                <div className="p-8 space-y-8">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center space-y-3 p-4 rounded-xl bg-amber-50 border border-amber-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Chat Naturally</h3>
                            <p className="text-sm text-gray-600">Talk to Buddy like a friend. Ask questions, share thoughts, or just chat.</p>
                        </div>

                        <div className="text-center space-y-3 p-4 rounded-xl bg-orange-50 border border-orange-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                                <Mic className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Voice Chat</h3>
                            <p className="text-sm text-gray-600">Click "I need to talk" for a hands-free voice conversation experience.</p>
                        </div>

                        <div className="text-center space-y-3 p-4 rounded-xl bg-rose-50 border border-rose-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                                <Heart className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Emotion Tracking</h3>
                            <p className="text-sm text-gray-600">Buddy understands how you feel and tracks your emotional journey.</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-xl">💡</span> Quick Tips:
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-2">
                            <li>Use the <strong>microphone icon</strong> to speak instead of typing.</li>
                            <li>Check the <strong>sidebar</strong> to see your past conversations.</li>
                            <li>Buddy speaks <strong>Hindi and English</strong> automatically!</li>
                        </ul>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}
