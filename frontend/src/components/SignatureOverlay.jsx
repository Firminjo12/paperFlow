import React, { useState, useEffect } from 'react';
import { GripVertical, X } from 'lucide-react';

const SignatureOverlay = ({ imageUrl, onRemove, onUpdate, onSelect, width = 200, height = 100, position = { x: 0, y: 0 }, opacity = 1, isSelected = false, isSignature = false }) => {
    const [size, setSize] = useState({ width, height });
    const [pos, setPos] = useState(position);

    useEffect(() => {
        setPos(position);
    }, [position]);

    useEffect(() => {
        setSize({ width, height });
    }, [width, height]);

    const handlePointerDown = (e) => {
        onSelect();
        const startX = e.clientX - pos.x;
        const startY = e.clientY - pos.y;
        
        // On utilise des variables locales pour éviter les problèmes de closure (stale state)
        let currentX = pos.x;
        let currentY = pos.y;

        const handleMove = (moveEvent) => {
            currentX = moveEvent.clientX - startX;
            currentY = moveEvent.clientY - startY;
            setPos({ x: currentX, y: currentY });
        };

        const handleUp = () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
            onUpdate({
                x: currentX,
                y: currentY,
                width: size.width,
                height: size.height
            });
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
    };

    return (
        <div
            style={{
                position: 'absolute',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
                opacity,
                zIndex: isSelected ? 40 : 20,
                cursor: 'move'
            }}
            onPointerDown={handlePointerDown}
            className={`group select-none touch-none ${isSelected ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
        >
            <div className="relative w-full h-full border-2 border-transparent group-hover:border-blue-500 rounded-lg p-1 transition-colors bg-white/10">
                {/* Toolbar */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-2 bg-white shadow-xl border border-slate-200 rounded-full px-3 py-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                        <X size={16} />
                    </button>
                    <div className="w-px h-4 bg-slate-200" />
                    <GripVertical size={16} className="text-slate-400" />
                </div>

                <img
                    src={imageUrl}
                    alt="Element"
                    className="w-full h-full object-contain pointer-events-none"
                    style={{ filter: isSignature ? 'contrast(1.4) brightness(0.8)' : 'none' }}
                />

                {/* Resize Handle */}
                <div
                    className={`absolute -bottom-2 -right-2 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-nwse-resize shadow-xl z-30 transition-opacity ${isSelected ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'}`}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const startX = e.clientX;
                        const startWidth = size.width;

                        const handleResizeMove = (moveEvent) => {
                            const deltaX = moveEvent.clientX - startX;
                            const newWidth = Math.max(60, startWidth + deltaX);
                            const aspectRatio = height / width;
                            const newHeight = newWidth * aspectRatio;

                            setSize({ width: newWidth, height: newHeight });
                            
                            // On utilise pos.x/y car ils sont stables pendant un redimensionnement
                            // mais on utilise le nouvel état de size directement
                            onUpdate({
                                x: pos.x,
                                y: pos.y,
                                width: newWidth,
                                height: newHeight
                            });
                        };

                        const handleResizeUp = () => {
                            window.removeEventListener('pointermove', handleResizeMove);
                            window.removeEventListener('pointerup', handleResizeUp);
                        };

                        window.addEventListener('pointermove', handleResizeMove);
                        window.addEventListener('pointerup', handleResizeUp);
                    }}
                >
                    <div className="w-2.5 h-2.5 bg-white rounded-full shadow-inner" />
                </div>
            </div>
        </div>
    );
};

export default SignatureOverlay;
