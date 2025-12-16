import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Loader2, X, Plus, PlayCircle, Clock } from 'lucide-react';

interface FileUploadProps {
  onAnalyze: (files: File[]) => void;
  isProcessing: boolean;
}

const LOADING_MESSAGES = [
  "正在预处理图片并建立加密通道...",
  "AI 正在识别合同中的微小条款...",
  "提取本金、期数与隐含费用...",
  "构建现金流折现模型 (DCF)...",
  "运行牛顿迭代法 (Newton-Raphson) 双重验算...",
  "正在生成详细避坑分析报告...",
];

const FileUpload: React.FC<FileUploadProps> = ({ onAnalyze, isProcessing }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle simulated progress and messages during processing
  useEffect(() => {
    let progressInterval: any;
    let messageInterval: any;

    if (isProcessing) {
      setProgress(0);
      setCurrentMessageIndex(0);

      // Simulate progress bar (fast at first, slows down at end)
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev; // Cap at 90% until done
          // Slow down as it gets higher
          const increment = Math.max(0.5, (90 - prev) / 10);
          return prev + Math.random() * increment;
        });
      }, 200);

      // Cycle messages every 2.5 seconds
      messageInterval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    } else {
      setProgress(0);
    }

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isProcessing]);

  const processFiles = (files: File[]) => {
    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        newFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }
    });

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

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
    if (!isProcessing && e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]); // Cleanup memory
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleStartAnalysis = () => {
    if (selectedFiles.length > 0) {
      onAnalyze(selectedFiles);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Upload Area */}
      {selectedFiles.length === 0 ? (
        <div
          onClick={() => !isProcessing && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative overflow-hidden cursor-pointer group
            border-2 border-dashed rounded-3xl p-12
            flex flex-col items-center justify-center text-center
            transition-all duration-300
            bg-slate-900/50 backdrop-blur-sm
            min-h-[360px]
            ${isDragging 
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02]' 
              : isProcessing 
                ? 'border-slate-700 bg-slate-900/80 cursor-default' 
                : 'border-slate-700 hover:border-emerald-400 hover:bg-slate-800'
            }
          `}
        >
          {isProcessing ? (
             <div className="flex flex-col items-center w-full max-w-sm">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                <Loader2 className="relative w-16 h-16 text-emerald-500 animate-spin" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 transition-all duration-500 min-h-[1.75rem]">
                {LOADING_MESSAGES[currentMessageIndex]}
              </h3>
              
              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3 border border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                <Clock size={12} className="text-emerald-500" />
                <span>预计耗时: 5 ~ 15 秒 (视计算复杂度而定)</span>
              </div>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 mb-6 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-slate-700 group-hover:border-emerald-500/50 shadow-xl relative z-10">
                <UploadCloud className="w-10 h-10 text-slate-300 group-hover:text-emerald-400 transition-colors" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2 relative z-10">上传利率截图</h3>
              <p className="text-slate-400 mb-6 relative z-10">
                支持多张图片 (如: 首页广告 + 详细还款计划表)<br/>
                <span className="text-xs text-slate-500">(拖拽多图到这里，或点击上传)</span>
              </p>
              
              {/* Decorative background elements */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </>
          )}
        </div>
      ) : (
        /* Preview Grid */
        <div className="bg-slate-900/50 border border-slate-700 rounded-3xl p-6 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {previews.map((src, idx) => (
              <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
                <img src={src} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                {!isProcessing && (
                  <button 
                    onClick={() => removeFile(idx)}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            {!isProcessing && (
              <div 
                onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:text-emerald-500 text-slate-500 transition-colors"
              >
                <Plus size={24} />
                <span className="text-xs mt-2">添加更多</span>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            {isProcessing ? (
               <div className="w-full max-w-md mx-auto">
                 <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                    <span className="flex items-center gap-2">
                       <Loader2 className="animate-spin w-4 h-4 text-emerald-500" />
                       {LOADING_MESSAGES[currentMessageIndex]}
                    </span>
                    <span className="font-mono text-emerald-500">{Math.round(progress)}%</span>
                 </div>
                 <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                 </div>
                 <p className="text-center text-xs text-slate-500 mt-3">
                   预计耗时 5-15 秒，请勿关闭页面
                 </p>
               </div>
            ) : (
              <button 
                onClick={handleStartAnalysis}
                className="group relative px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <PlayCircle className="w-5 h-5 fill-current" />
                开始深度分析
                <div className="absolute inset-0 rounded-full ring-4 ring-emerald-500/30 animate-pulse-slow group-hover:ring-emerald-400/50"></div>
              </button>
            )}
          </div>
        </div>
      )}

      <input
        type="file"
        ref={inputRef}
        onChange={handleInputChange}
        className="hidden"
        accept="image/*"
        multiple
      />
      
      {!isProcessing && selectedFiles.length === 0 && (
        <p className="text-center text-slate-500 text-xs mt-6 max-w-sm mx-auto">
          为了获得最准确的结果，建议上传包含“每期还款金额”的详细截图，我们将为您进行双重验算。
        </p>
      )}
    </div>
  );
};

export default FileUpload;