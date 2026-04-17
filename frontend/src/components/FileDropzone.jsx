import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const FileDropzone = ({ 
    onFileSelect, 
    selectedFile, 
    accept = "application/pdf", 
    multiple = false,
    label = "Sélectionner les fichiers",
    description = "ou déposez les fichiers ici"
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            if (multiple) {
                onFileSelect(Array.from(e.dataTransfer.files));
            } else {
                onFileSelect(e.dataTransfer.files[0]);
            }
        }
    };

    const handleChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            if (multiple) {
                onFileSelect(Array.from(files));
            } else {
                onFileSelect(files[0]);
            }
        }
    };

    const handleClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4 w-full">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                className={cn(
                    "relative group cursor-pointer transition-all duration-500",
                    "w-full max-w-lg h-32 flex flex-col items-center justify-center rounded-[32px] shadow-2xl border-2 border-transparent",
                    isDragging
                        ? "bg-red-700/90 scale-[1.02] border-white/20"
                        : "bg-[#e52424] hover:bg-[#d11f1f] hover:scale-[1.01] active:scale-95 shadow-red-500/20"
                )}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    accept={accept}
                    multiple={multiple}
                    onChange={handleChange}
                    className="hidden"
                />

                <div className="flex flex-col items-center justify-center px-8 text-center space-y-2 pointer-events-none">
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest leading-tight">
                        {selectedFile 
                            ? (Array.isArray(selectedFile) ? `${selectedFile.length} fichiers` : selectedFile.name) 
                            : label}
                    </h3>
                    {selectedFile && (
                        <div className="flex items-center gap-2 text-white/80 text-[10px] font-black uppercase tracking-[0.2em] animate-in fade-in zoom-in duration-300">
                            <CheckCircle2 size={14} className="text-white" />
                            SÉLECTIONNÉ
                        </div>
                    )}
                </div>
            </div>
            
            {!selectedFile && description && (
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    {description}
                </p>
            )}
        </div>
    );
};

export default FileDropzone;
export { cn };
