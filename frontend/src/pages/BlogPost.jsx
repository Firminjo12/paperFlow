import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { blogPosts } from '../data/blogData';
import { ArrowLeft, Calendar, Clock, Share2 } from 'lucide-react';

const BlogPost = () => {
    const { id } = useParams();
    const post = blogPosts.find(p => p.id === id);

    if (!post) return <Navigate to="/blog" />;

    return (
        <div className="min-h-screen bg-white dark:bg-[#060912] text-slate-900 dark:text-white font-sans transition-colors duration-300">
            {/* Minimal Header */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#060912]/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 py-4 px-6 transition-all duration-300">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to="/blog" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors text-[10px] font-black uppercase tracking-widest">
                        <ArrowLeft size={14} /> Retour au blog
                    </Link>
                    <div className="flex gap-4">
                        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                            <Share2 size={18} />
                        </button>
                    </div>
                </div>
            </header>

            <article className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
                {/* Meta info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {post.category}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1] italic uppercase">
                        {post.title}
                    </h1>
                    <div className="flex items-center justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400 pt-4">
                        <span className="flex items-center gap-2"><Calendar size={14} /> {post.date}</span>
                        <span className="flex items-center gap-2"><Clock size={14} /> {post.readTime} de lecture</span>
                    </div>
                </motion.div>

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="prose prose-slate dark:prose-invert max-w-none prose-h2:text-3xl prose-h2:font-black prose-h2:uppercase prose-h2:italic prose-p:text-lg prose-p:leading-relaxed prose-p:font-medium prose-p:text-slate-600 dark:prose-p:text-slate-400"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Author footer */}
                <div className="mt-20 pt-10 border-t border-slate-100 dark:border-white/5 flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl">
                        PF
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Publié par</p>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white italic uppercase">L'équipe paperFlow</h4>
                    </div>
                </div>
            </article>

            {/* Related Posts? maybe later */}
        </div>
    );
};

export default BlogPost;
