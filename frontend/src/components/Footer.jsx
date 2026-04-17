import React from 'react';

const Footer = () => {
    return (
        <footer className="w-full bg-[#060912] border-t border-white/5 py-12 px-6 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-white/10 text-[10px] font-black uppercase tracking-[0.3em]">
                    © 2026 SignFlow • Propulsé par Next-Gen Tech
                </p>

                <div className="flex items-center gap-6">
                    <a href="#" className="text-white/20 hover:text-white/50 text-[10px] font-bold uppercase tracking-widest transition-colors">Confidentialité</a>
                    <a href="#" className="text-white/20 hover:text-white/50 text-[10px] font-bold uppercase tracking-widest transition-colors">Support</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
