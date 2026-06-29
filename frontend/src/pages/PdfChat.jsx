import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, FileSearch, Trash2, Bot, User, Loader2, Sparkles } from 'lucide-react';
import FileDropzone from '../components/FileDropzone';
import api from '../services/api';

const PdfChat = () => {
    const [file, setFile] = useState(null);
    const [extractedText, setExtractedText] = useState("");
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleFileSelect = async (selectedFile) => {
        setFile(selectedFile);
        setIsExtracting(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await api.post('/ai/extract-text', formData);
            setExtractedText(response.data.text);
            setMessages([
                { 
                    role: 'assistant', 
                    content: "Bonjour ! J'ai bien analysé votre document. De quoi souhaitez-vous discuter ?" 
                }
            ]);
        } catch (error) {
            console.error("Extraction error:", error);
            alert("Erreur lors de l'analyse du PDF. Assurez-vous qu'il contient du texte lisible.");
            setFile(null);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading || !extractedText) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const response = await api.post('/ai/chat', {
                text: extractedText,
                messages: messages.slice(-5), // Envoyer les 5 derniers messages pour le contexte
                userMessage: input
            });

            setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: "Désolé, j'ai rencontré une erreur lors du traitement de votre question." 
            }]);
        } finally {
            setLoading(false);
        }
    };

    const resetChat = () => {
        setFile(null);
        setExtractedText("");
        setMessages([]);
        setInput("");
    };

    return (
        <div className="flex-1 flex flex-col min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-[#060912]">
            <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col p-4 md:p-8">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                            <Sparkles className="text-blue-600" />
                            Discuter avec PDF
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Posez des questions, demandez des résumés ou des clarifications sur vos documents.
                        </p>
                    </div>
                    {file && (
                        <button 
                            onClick={resetChat}
                            className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-2xl hover:scale-105 transition-all"
                            title="Nouveau document"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>

                {!file ? (
                    /* Upload Section */
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1 flex flex-col items-center justify-center"
                    >
                        <div className="w-full max-w-xl">
                            <FileDropzone 
                                onFileSelect={handleFileSelect}
                                label="Déposez votre PDF pour commencer à discuter"
                                description="Analyse immédiate par l'IA"
                            />
                            {isExtracting && (
                                <div className="mt-8 flex items-center justify-center gap-3 text-blue-600">
                                    <Loader2 className="animate-spin" />
                                    <span className="font-bold uppercase text-xs tracking-widest">Analyse du document en cours...</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    /* Chat Interface */
                    <div className="flex-1 flex flex-col glass-card rounded-[32px] overflow-hidden border border-slate-200 dark:border-white/5 shadow-2xl">
                        
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                            <AnimatePresence initial={false}>
                                {messages.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                                                msg.role === 'user' 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-white dark:bg-slate-800 text-blue-600 border border-slate-100 dark:border-white/5'
                                            }`}>
                                                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                                            </div>
                                            <div className={`p-4 rounded-3xl ${
                                                msg.role === 'user'
                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                    : 'bg-white dark:bg-slate-800 dark:text-white border border-slate-100 dark:border-white/5 rounded-tl-none'
                                            }`}>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center animate-pulse">
                                            <Bot size={20} className="text-blue-600" />
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl rounded-tl-none border border-slate-100 dark:border-white/5">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5">
                            <form onSubmit={handleSend} className="flex gap-4">
                                <input 
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Posez une question sur le document..."
                                    className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-blue-600 dark:text-white transition-all"
                                />
                                <button 
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="p-4 bg-blue-600 text-white rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-xl shadow-blue-500/20"
                                >
                                    <Send size={24} />
                                </button>
                            </form>
                            <p className="mt-3 text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                                Alimenté par paperFlow AI • Gemini 1.5 Flash
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfChat;
