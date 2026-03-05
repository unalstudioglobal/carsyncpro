import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';
import { getSetting, saveSetting } from '../services/settingsService';

interface Step {
  title: string;
  description: string;
  icon: React.ElementType;
}

interface OnboardingGuideProps {
  tourKey: string; // Unique key for localStorage (e.g., 'tour_garage_v1')
  steps: Step[];
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ tourKey, steps }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = getSetting(tourKey, false);
    if (!hasSeenTour) {
      // Small delay to allow page render before showing guide
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [tourKey]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    saveSetting(tourKey, true);
  };

  if (!isOpen) return null;

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={handleClose}></div>

      {/* Card */}
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-slideUp">
        {/* Progress Dots */}
        <div className="flex justify-center space-x-1.5 mb-6 absolute top-6 right-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${index === currentStep ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-700'}`}
            />
          ))}
        </div>

        <button onClick={handleClose} className="absolute top-4 left-4 text-slate-500 hover:text-white p-2">
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mt-4">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mb-5 ring-4 ring-blue-600/10">
            <StepIcon size={32} />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">{steps[currentStep].title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-8 h-10">
            {steps[currentStep].description}
          </p>

          <button
            onClick={handleNext}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition active:scale-95 shadow-lg shadow-blue-900/30"
          >
            <span>{currentStep === steps.length - 1 ? 'Anladım, Başla' : 'Devam Et'}</span>
            {currentStep === steps.length - 1 ? <Check size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};
