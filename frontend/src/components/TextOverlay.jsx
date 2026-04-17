import React, { useState, useRef, useEffect } from 'react';
import { X, GripVertical, Check, Type } from 'lucide-react';

const TextOverlay = ({ initialText, onRemove, onUpdate, position = { x: 0, y: 0 }, fontSize = 16, color = '#000000' }) => {
    const [text, setText] = useState(initialText);
    const [isEditing, setIsEditing] = useState(false);
    const [size, setSize] = useState({ fontSize });
    const [isDragging, setIsDragging] = useState(false);
    const [pos, setPos] = useState(position);
    const inputRef = useRef(null);

    useEffect(() => {
        setPos(position);
    }, [position]);

    useEffect(() => {
        setSize({ fontSize });
    }, [fontSize]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handlePointerDown = (e) => {
        if (isEditing) return;
        const startX = e.clientX - pos.x;
        const startY = e.clientY - pos.y;
        
        // On utilise des variables locales pour éviter les problèmes de stale closure
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
            onUpdate({ x: currentX, y: currentY, text, fontSize: size.fontSize });
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
    };

    const handleBlur = () => {
        setIsEditing(false);
        onUpdate({ x: pos.x, y: pos.y, text, fontSize: size.fontSize });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            inputRef.current?.blur();
        }
    };

    return (
        <div
            style={{
                position: 'absolute',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                cursor: isEditing ? 'text' : 'move',
                zIndex: 30
            }}
            onPointerDown={handlePointerDown}
            className="group select-none touch-none"
        >
            <div className={`relative px-3 py-1.5 border-2 rounded-lg transition-all ${isEditing ? 'border-blue-500 bg-white shadow-lg' : 'border-transparent hover:border-blue-400 hover:bg-white/50'}`}>
                {/* Actions */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-2 bg-white shadow-xl border border-slate-200 rounded-full px-3 py-1">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Modifier le texte"
                        >
                            <Type size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleBlur}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                        >
                            <Check size={16} />
                        </button>
                    )}
                    <div className="w-px h-4 bg-slate-200" />
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                        <X size={16} />
                    </button>
                    {!isEditing && (
                        <>
                            <div className="w-px h-4 bg-slate-200" />
                            <GripVertical size={16} className="text-slate-400" />
                        </>
                    )}
                </div>

                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={text}
                        onChange={(e) => {
                            const newText = e.target.value;
                            setText(newText);
                            onUpdate({ x: pos.x, y: pos.y, text: newText, fontSize: size.fontSize });
                        }}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className="bg-transparent border-none outline-none font-medium min-w-[50px] text-slate-900 pr-2"
                        style={{ fontSize: `${size.fontSize}px` }}
                    />
                ) : (
                    <div
                        onClick={() => setIsEditing(true)}
                        className="font-medium text-slate-900 cursor-text whitespace-nowrap min-w-[50px]"
                        style={{ fontSize: `${size.fontSize}px` }}
                    >
                        {text || "Texte ici..."}
                    </div>
                )}

                {!isEditing && (
                    <div className="absolute -right-12 top-0 flex flex-col gap-1 hidden group-hover:flex">
                        <button
                            onClick={() => {
                                const newSize = size.fontSize + 2;
                                setSize({ fontSize: newSize });
                                onUpdate({ x: pos.x, y: pos.y, text, fontSize: newSize });
                            }}
                            className="w-6 h-6 bg-white border border-slate-200 rounded shadow hover:bg-slate-50 flex items-center justify-center text-xs font-bold"
                        >
                            +
                        </button>
                        <button
                            onClick={() => {
                                const newSize = Math.max(8, size.fontSize - 2);
                                setSize({ fontSize: newSize });
                                onUpdate({ x: pos.x, y: pos.y, text, fontSize: newSize });
                            }}
                            className="w-6 h-6 bg-white border border-slate-200 rounded shadow hover:bg-slate-50 flex items-center justify-center text-xs font-bold"
                        >
                            -
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextOverlay;
