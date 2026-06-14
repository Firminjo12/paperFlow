import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { blogPosts } from '../data/blogData';
import { Calendar, Clock, ChevronRight, BookOpen } from 'lucide-react';
import NewsletterSection from '../components/NewsletterSection';

const Blog = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-[#060912] text-slate-900 dark:text-white font-sans transition-colors duration-300">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 border-b border-slate-100 dark:border-white/5 overflow-hidden">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="max-w-5xl mx-auto relative text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4"
                    >
                        <BookOpen size={14} /> Le Blog paperFlow
                    </motion.div>
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9]">
                        Conseils & <br />
                        <span className="text-blue-600">Actualités.</span>
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-bold max-w-2xl mx-auto leading-relaxed pt-4">
                        Apprenez à maîtriser vos documents PDF et découvrez les meilleures pratiques pour votre productivité numérique.
                    </p>
                </div>
            </section>

            {/* Articles Grid */}
            <section className="max-w-7xl mx-auto px-6 py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {blogPosts.map((post, index) => (
                        <motion.article
                            key={post.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative flex flex-col h-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[40px] overflow-hidden hover:border-blue-600/30 transition-all"
                        >
                            <Link to={`/blog/${post.id}`} className="absolute inset-0 z-10" />
                            <div className="p-10 flex flex-col h-full space-y-6">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span className="flex items-center gap-2"><Calendar size={12} /> {post.date}</span>
                                    <span className="flex items-center gap-2"><Clock size={12} /> {post.readTime}</span>
                                </div>
                                <h2 className="text-2xl font-black italic uppercase leading-tight group-hover:text-blue-600 transition-colors">
                                    {post.title}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    {post.excerpt}
                                </p>
                                <div className="mt-auto pt-8 flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                                    Lire l'article <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </section>

            {/* Newsletter Section */}
            <NewsletterSection className="pb-24" />
        </div>
    );
};

export default Blog;
