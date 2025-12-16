import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2, ScanLine, BrainCircuit, Calculator, ShieldCheck, Lightbulb } from 'lucide-react';
import { Language } from '../types';
import { getTexts } from '../utils/translations';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  lang: Language;
}

const ICONS = [ScanLine, BrainCircuit, Calculator, ShieldCheck];

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing, lang }) => {
  const t = getTexts(lang);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTip, setCurrentTip] = useState(t.scamTips[0]);

  // Reset tip when language changes
  useEffect(() => {
    setCurrentTip(t.scamTips[0]);
  }, [lang]);

  useEffect(() => {
    let tipTimer: ReturnType<typeof setInterval>;

    if (isProcessing) {
      setCurrentStep(0);
      setCurrentTip(t.scamTips[Math.floor(Math.random() * t.scamTips.length)]);
      
      const stepDelays = [0, 2000, 4500, 7000];
      
      const timers = stepDelays.map((delay, index) => {
        return setTimeout(() => {
          setCurrentStep(index);
        }, delay);
      });

      tipTimer = setInterval(() => {
        setCurrentTip(t.scamTips[Math.floor(Math.random() * t.scamTips.length)]);
      }, 4000);

      return () => {
        timers.forEach(t => clearTimeout(t));
        clearInterval(tipTimer);
      };
    }
  }, [isProcessing, lang]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isProcessing && e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  };

  const handleClick = () => {
    if (!isProcessing) inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative overflow-hidden
          border-2 border-dashed rounded-3xl p-8 sm:p-10
          flex flex-col items-center justify-center text-center
          transition-all duration-300
          bg-slate-900/50 backdrop-blur-sm
          min-h-[450px]
          ${isDragging 
            ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02]' 
            : isProcessing 
              ? 'border-emerald-500/30 bg-slate-900/80 cursor-default' 
              : 'border-slate-700 hover:border-emerald-400 hover:bg-slate-800 cursor-pointer group'
          }
        `}
      >
        <input
          type="file"
          ref={inputRef}
          onChange={handleInputChange}
          className="hidden"
          accept="image/*"
        />

        {isProcessing ? (
          <div className="w-full flex flex-col h-full justify-between animate-fade-in">
            {/* Steps Visualization */}
            <div className="space-y-6 mt-4">
              {t.steps.map((stepText, idx) => {
                const isActive = idx === currentStep;
                const isCompleted = idx < currentStep;
                const Icon = ICONS[idx];

                return (
                  <div 
                    key={idx} 
                    className={`flex items-center gap-4 transition-all duration-500 ${
                      isActive ? 'scale-105 opacity-100 translate-x-2' : 
                      isCompleted ? 'opacity-50' : 
                      'opacity-20'
                    }`}
                  >
                    <div className={`
                      p-2 rounded-full border-2 
                      ${isActive ? 'border-emerald-400 bg-emerald-400/20 text-emerald-400 animate-pulse' : 
                        isCompleted ? 'border-emerald-800 bg-emerald-900/20 text-emerald-700' : 
                        'border-slate-700 bg-slate-800 text-slate-600'}
                    `}>
                      {isActive ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-sm font-medium ${isActive ? 'text-emerald-300' : 'text-slate-400'}`}>
                      {stepText}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Tip Card */}
            <div className="mt-8 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Lightbulb size={40} className="text-amber-500" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">{t.tipTitle}</span>
              </div>
              <p className="text-sm text-amber-100/90 leading-relaxed animate-fade-in min-h-[3em]">
                {currentTip}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-20 h-20 mb-6 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-slate-700 group-hover:border-emerald-500/50 shadow-xl">
              <UploadCloud className="w-10 h-10 text-slate-300 group-hover:text-emerald-400 transition-colors" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">{t.uploadTitle}</h3>
            <p className="text-slate-400 mb-6">
              {t.uploadDesc}<br/>
              <span className="text-xs text-slate-500">{t.uploadDrag}</span>
            </p>

            <div className="flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><ImageIcon size={12}/> JPG</span>
              <span className="flex items-center gap-1"><ImageIcon size={12}/> PNG</span>
              <span className="flex items-center gap-1"><ImageIcon size={12}/> WEBP</span>
            </div>
          </div>
        )}
      </div>
      
      {!isProcessing && (
        <p className="text-center text-slate-500 text-xs mt-6 max-w-sm mx-auto">
          {t.privacyNote}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
