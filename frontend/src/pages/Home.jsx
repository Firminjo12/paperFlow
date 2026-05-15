import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileStack, 
  Scissors, 
  FileSearch, 
  Zap, 
  Settings, 
  FileImage, 
  FileText, 
  Presentation, 
  Globe, 
  Image as ImageIcon, 
  FileType, 
  RotateCcw, 
  Hash, 
  Type, 
  FileEdit, 
  Unlock, 
  Lock, 
  Signature, 
  LayoutGrid,
  Files,
  X,
  ArrowRightLeft
} from 'lucide-react';
import GoogleAd from '../components/GoogleAd';
import { ADS_CONFIG } from '../config/ads.config';
import SEO from '../components/SEO';

const tools = [
  // ORGANISER PDF
  {
    id: 'merge',
    title: 'Fusionner PDF',
    description: 'Fusionner et combiner des fichiers PDF et les mettre dans l\'ordre que vous voulez.',
    icon: <FileStack className="text-orange-500" />,
    path: '/merge',
    category: 'Organiser PDF'
  },
  {
    id: 'split',
    title: 'Diviser PDF',
    description: 'Sélectionner la portée de pages, séparer une page, ou convertir chaque page en fichier PDF.',
    icon: <Scissors className="text-red-500" />,
    path: '/split',
    category: 'Organiser PDF'
  },
  {
    id: 'remove-pages',
    title: 'Supprimer des pages',
    description: 'Supprimez des pages d\'un document PDF pour obtenir un nouveau fichier.',
    icon: <X className="text-red-400" />,
    path: '/remove-pages',
    category: 'Organiser PDF'
  },
  {
    id: 'extract-pages',
    title: 'Extraire des pages',
    description: 'Récupérez des pages spécifiques de votre PDF pour créer un document séparé.',
    icon: <Files className="text-orange-400" />,
    path: '/extract-pages',
    category: 'Organiser PDF'
  },
  {
    id: 'organize',
    title: 'Organiser PDF',
    description: 'Triez les pages de votre document PDF comme bon vous semble.',
    icon: <LayoutGrid className="text-orange-600" />,
    path: '/organize',
    category: 'Organiser PDF'
  },
  {
    id: 'scan-to-pdf',
    title: 'Numériser au format PDF',
    description: 'Convertissez vos documents papier en PDF numériques directement.',
    icon: <FileSearch className="text-red-600" />,
    path: '/scan-to-pdf',
    category: 'Organiser PDF'
  },

  // OPTIMISER LE PDF
  {
    id: 'compress',
    title: 'Compresser PDF',
    description: 'Diminuer la taille de votre fichier PDF, tout en conservant la qualité.',
    icon: <Zap className="text-green-500" />,
    path: '/compress',
    category: 'Optimiser le PDF'
  },
  {
    id: 'repair',
    title: 'Réparer PDF',
    description: 'Réparez un document PDF endommagé et récupérez les données.',
    icon: <Settings className="text-green-600" />,
    path: '/repair',
    category: 'Optimiser le PDF'
  },
  {
    id: 'ocr',
    title: 'OCR PDF',
    description: 'Convertissez en toute simplicité vos PDF numérisés en documents indexables.',
    icon: <FileSearch className="text-green-400" />,
    path: '/ocr',
    category: 'Optimiser le PDF'
  },

  // CONVERTIR EN PDF
  {
    id: 'jpg-to-pdf',
    title: 'JPG en PDF',
    description: 'Convertissez vos images en PDF. Ajustez l\'orientation et les marges.',
    icon: <FileImage className="text-yellow-500" />,
    path: '/jpg-to-pdf',
    category: 'Convertir en PDF'
  },
  {
    id: 'word-to-pdf',
    title: 'Word en PDF',
    description: 'Convertissez vos documents Word en PDF avec la meilleure qualité possible.',
    icon: <FileText className="text-blue-600" />,
    path: '/word-to-pdf',
    category: 'Convertir en PDF'
  },
  {
    id: 'ppt-to-pdf',
    title: 'PowerPoint en PDF',
    description: 'Transformez vos fichiers PPT et PPTX en présentations PDF.',
    icon: <Presentation className="text-orange-600" />,
    path: '/ppt-to-pdf',
    category: 'Convertir en PDF'
  },
  {
    id: 'html-to-pdf',
    title: 'HTML en PDF',
    description: 'Convertissez des pages web HTML en PDF. Copiez-collez l\'URL.',
    icon: <Globe className="text-yellow-600" />,
    path: '/html-to-pdf',
    category: 'Convertir en PDF'
  },

  // CONVERTIR DEPUIS PDF
  {
    id: 'pdf-to-jpg',
    title: 'PDF en JPG',
    description: 'Extraire toutes les images contenues dans un fichier PDF ou convertir.',
    icon: <ImageIcon className="text-yellow-500" />,
    path: '/pdf-to-jpg',
    category: 'Convertir depuis PDF'
  },
  {
    id: 'pdf-to-word',
    title: 'PDF en Word',
    description: 'Convertissez facilement vos fichiers PDF en documents DOC et DOCX.',
    icon: <FileText className="text-blue-400" />,
    path: '/pdf-to-word',
    category: 'Convertir depuis PDF'
  },
  {
    id: 'pdf-to-ppt',
    title: 'PDF en PowerPoint',
    description: 'Transformez vos fichiers PDF en présentations PPT et PPTX.',
    icon: <Presentation className="text-orange-400" />,
    path: '/pdf-to-ppt',
    category: 'Convertir depuis PDF'
  },
  {
    id: 'pdf-to-pdfa',
    title: 'PDF en PDF/A',
    description: 'Transformez votre PDF en PDF/A pour un archivage à long terme.',
    icon: <FileType className="text-blue-900" />,
    path: '/pdf-to-pdfa',
    category: 'Convertir depuis PDF'
  },

  // MODIFIER PDF
  {
    id: 'rotate',
    title: 'Faire pivoter PDF',
    description: 'Faites pivoter votre PDF comme vous le souhaitez.',
    icon: <RotateCcw className="text-pink-500" />,
    path: '/rotate',
    category: 'Modifier PDF'
  },
  {
    id: 'page-numbers',
    title: 'Ajouter des numéros de pages',
    description: 'Insérez des numéros de pages dans les documents PDF simplement.',
    icon: <Hash className="text-purple-600" />,
    path: '/page-numbers',
    category: 'Modifier PDF'
  },
  {
    id: 'watermark',
    title: 'Ajouter un filigrane',
    description: 'Choisissez une image ou un texte à appliquer sur votre PDF.',
    icon: <Type className="text-red-600" />,
    path: '/watermark',
    category: 'Modifier PDF'
  },
  {
    id: 'rogner',
    title: 'Rogner PDF',
    description: 'Réduisez les marges de vos documents PDF ou sélectionnez une zone.',
    icon: <Scissors className="text-purple-400" />,
    path: '/rogner',
    category: 'Modifier PDF'
  },
  {
    id: 'edit',
    title: 'Modifier PDF',
    description: 'Ajoutez du texte, des images, des formes ou des annotations.',
    icon: <FileEdit className="text-purple-500" />,
    path: '/edit',
    category: 'Modifier PDF'
  },

  // SÉCURITÉ PDF
  {
    id: 'unlock',
    title: 'Déverrouiller PDF',
    description: 'Retirez le mot de passe de sécurité du PDF simplement.',
    icon: <Unlock className="text-indigo-500" />,
    path: '/unlock',
    category: 'Sécurité PDF'
  },
  {
    id: 'protect',
    title: 'Protéger PDF',
    description: 'Protégez les fichiers PDF avec un mot de passe.',
    icon: <Lock className="text-gray-700" />,
    path: '/protect',
    category: 'Sécurité PDF'
  },
  {
    id: 'sign',
    title: 'Signer PDF',
    description: 'Signez vous-même ou demandez des signatures électroniques.',
    icon: <Signature className="text-blue-500" />,
    path: '/sign',
    category: 'Sécurité PDF'
  },
  {
    id: 'censure',
    title: 'Censurer PDF',
    description: 'Censurez le texte et les graphiques pour supprimer des infos.',
    icon: <FileSearch className="text-blue-900" />,
    path: '/censure',
    category: 'Sécurité PDF'
  }
];

const categories = [
  'Tout',
  'Organiser PDF',
  'Optimiser le PDF',
  'Convertir en PDF',
  'Convertir depuis PDF',
  'Modifier PDF',
  'Sécurité PDF'
];

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('Tout');
  const navigate = useNavigate();

  const filteredTools = activeCategory === 'Tout' 
    ? tools 
    : tools.filter(tool => tool.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#f3f0f1] dark:bg-[#0f172a] transition-colors duration-300">
      <SEO 
        title="Outils PDF Gratuits - Signer, Compresser, Fusionner"
        description="paperFlow est une suite d'outils PDF en ligne gratuits. Signez vos documents, compressez vos fichiers et convertissez vos PDF en Word ou JPG sans inscription."
        keywords="paperflow, paperFlow, PAPERFLOW, Paperflow, outils pdf, signer pdf, compresser pdf, fusionner pdf, convertir pdf"
      />
      {/* Header / Hero Section */}
      <section className="pt-20 pb-12 px-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-[#33333b] dark:text-white mb-4 italic">
          <span className="text-blue-600">paperFlow</span> - Tous les outils PDF nécessaires, 
          <br className="hidden md:block" /> en un seul endroit
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-4xl mx-auto mb-8">
          Tous les outils dont vous avez besoin pour utiliser les PDF, à portée de main. Ils sont tous 100% GRATUITS et simples d'utilisation ! Fusionnez, divisez, compressez, convertissez, faites pivoter, déverrouillez et ajoutez un filigrane à vos PDF en seulement quelques clics.
        </p>

        <div className="max-w-4xl mx-auto px-4">
            <GoogleAd slot={ADS_CONFIG.SLOTS.HOME_HERO} className="shadow-2xl shadow-blue-500/5" />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === category
                  ? 'bg-[#33333b] text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Tools Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        {activeCategory === 'Tout' ? (
          <div className="space-y-16">
            {categories.filter(c => c !== 'Tout').map(category => (
              <div key={category} className="space-y-8">
                <h2 className="text-xl font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200 dark:border-white/5 pb-4">
                  {category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {tools.filter(tool => tool.category === category).map(tool => (
                    <ToolCard key={tool.id} tool={tool} navigate={navigate} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} navigate={navigate} />
            ))}
          </div>
        )}

      </section>
    </div>
  );
};

const ToolCard = ({ tool, navigate }) => (
  <div
    onClick={() => navigate(tool.path)}
    className="bg-white dark:bg-slate-800 p-6 rounded-[32px] border border-slate-100 dark:border-white/5 hover:border-red-500/30 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group h-full flex flex-col shadow-sm"
  >
    <div className="mb-4 text-3xl group-hover:scale-110 transition-transform">
      {tool.icon}
    </div>
    <h3 className="text-lg font-bold text-[#33333b] dark:text-white mb-2 group-hover:text-red-600 transition-colors">
      {tool.title}
    </h3>
    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
      {tool.description}
    </p>
  </div>
);

export default Home;
