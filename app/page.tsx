"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { MessageCircle, Zap, PlayCircle, ArrowRight, TimerOff, MessageSquareOff, UserX, Target, Settings, Layers, Rocket, Monitor, Tablet, Smartphone } from 'lucide-react';

const devices = [
  { id: 'desktop', icon: <Monitor className="w-4 h-4" />, name: 'Desktop' },
  { id: 'tablet', icon: <Tablet className="w-4 h-4" />, name: 'Tablette' },
  { id: 'mobile', icon: <Smartphone className="w-4 h-4" />, name: 'Mobile' }
];

export default function LandingPage() {
  const [activeDeviceIndex, setActiveDeviceIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDeviceIndex((prev) => (prev + 1) % devices.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fadeUpVariant: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">Urigi</span>
            </div>
            
            <div className="hidden md:flex space-x-10">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Fonctionnalités</a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Tarifs</a>
              <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Connexion
              </Link>
              <Link href="/register" className="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary-hover transition-all shadow-sm shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5">
                Commencer gratuitement
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/3 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-2xl">
              <motion.div variants={fadeUpVariant} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 text-green-700 mb-6">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Nouveau : Intégration CRM</span>
              </motion.div>
              
              <motion.h1 variants={fadeUpVariant} className="text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.1]">
                Transformez WhatsApp en votre <span className="text-primary">meilleur</span> <span className="text-indigo-900">commercial.</span>
              </motion.h1>
              
              <motion.p variants={fadeUpVariant} className="text-lg text-gray-500 mb-8 leading-relaxed max-w-lg">
                Automatisez votre marketing WhatsApp, gérez vos contacts et boostez vos ventes sans toucher à votre téléphone. La puissance de l'automatisation dans votre poche.
              </motion.p>
              
              <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row gap-4">
                <Link href="/register" className="inline-flex justify-center items-center gap-2 bg-primary text-white px-6 py-3.5 rounded-full text-base font-semibold hover:bg-primary-hover transition-all shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 group">
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="inline-flex justify-center items-center gap-2 bg-white text-gray-700 border border-gray-200 px-6 py-3.5 rounded-full text-base font-semibold hover:bg-gray-50 transition-all hover:border-gray-300">
                  <PlayCircle className="w-5 h-5 text-gray-500" />
                  Voir la démo
                </button>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="mt-16 lg:mt-0 relative flex flex-col items-center"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-3xl -z-10"></div>
              
              {/* Device Tabs */}
              <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8 relative z-20 shadow-sm border border-gray-200/60">
                {devices.map((device, idx) => (
                  <button
                    key={device.id}
                    onClick={() => setActiveDeviceIndex(idx)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeDeviceIndex === idx ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {activeDeviceIndex === idx && (
                      <motion.div layoutId="activeDeviceTab" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200/50" />
                    )}
                    <span className="relative z-10 flex items-center gap-2">{device.icon} <span className="hidden sm:inline">{device.name}</span></span>
                  </button>
                ))}
              </div>

              {/* Device Mockups */}
              <div className="relative w-full max-w-[600px] aspect-[4/3] flex items-center justify-center perspective-[1000px]">
                <AnimatePresence mode="wait">
                  {activeDeviceIndex === 0 && (
                    <motion.div 
                      key="desktop"
                      initial={{ opacity: 0, rotateX: 10, scale: 0.95 }}
                      animate={{ opacity: 1, rotateX: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="w-full relative rounded-2xl overflow-hidden border border-gray-200 shadow-2xl bg-white"
                    >
                      <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center px-4 gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="flex-1 text-center text-xs font-medium text-gray-400">app.urigi.com</div>
                      </div>
                      <div className="aspect-[16/10] relative bg-gray-100">
                        <Image src="/images/dashboard-preview.jpg" alt="Urigi Desktop" fill className="object-cover object-top" priority />
                      </div>
                    </motion.div>
                  )}

                  {activeDeviceIndex === 1 && (
                    <motion.div 
                      key="tablet"
                      initial={{ opacity: 0, rotateY: -10, scale: 0.95 }}
                      animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="w-[85%] relative rounded-3xl overflow-hidden border-[8px] border-gray-900 shadow-2xl bg-gray-900 aspect-[4/3]"
                    >
                      <div className="absolute top-1/2 -left-[8px] w-1 h-12 bg-gray-800 rounded-l-md"></div>
                      <div className="absolute inset-0 bg-white overflow-hidden rounded-xl">
                        <Image src="/images/dashboard-preview.jpg" alt="Urigi Tablet" fill className="object-cover object-left-top" />
                      </div>
                    </motion.div>
                  )}

                  {activeDeviceIndex === 2 && (
                    <motion.div 
                      key="mobile"
                      initial={{ opacity: 0, rotateY: 10, scale: 0.95 }}
                      animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="w-[30%] min-w-[200px] relative rounded-[2rem] overflow-hidden border-[6px] border-gray-900 shadow-2xl bg-gray-900 aspect-[9/19]"
                    >
                      <div className="absolute top-0 inset-x-0 h-4 bg-gray-900 rounded-b-xl z-10 mx-auto w-1/2"></div>
                      <div className="absolute inset-0 bg-white overflow-hidden rounded-[1.5rem]">
                        <Image src="/images/dashboard-preview.jpg" alt="Urigi Mobile" fill className="object-cover object-left-top scale-[2] origin-top-left" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Pain points section */}
      <section className="py-24 bg-gray-50/50 border-y border-gray-100" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUpVariant}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Le marketing WhatsApp manuel est un frein à votre croissance.</h2>
            <p className="text-gray-500 text-lg">Découvrez pourquoi vous perdez du temps et de l'argent avec des méthodes obsolètes.</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { title: "Perte de temps", desc: "Passer des heures à copier-coller des messages est épuisant et non scalable.", icon: <TimerOff className="w-6 h-6 text-red-500" />, bg: "bg-red-50" },
              { title: "Messages un par un", desc: "L'envoi individuel limite drastiquement votre portée quotidienne.", icon: <MessageSquareOff className="w-6 h-6 text-orange-500" />, bg: "bg-orange-50" },
              { title: "Aucun suivi CRM", desc: "Difficile de savoir qui a répondu, cliqué ou acheté sans outil dédié.", icon: <UserX className="w-6 h-6 text-purple-500" />, bg: "bg-purple-50" },
              { title: "Ciblage impossible", desc: "Envoyer le même message à tout le monde détruit votre taux de conversion.", icon: <Target className="w-6 h-6 text-blue-500" />, bg: "bg-blue-50" }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeUpVariant} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${feature.bg}`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03] z-0" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23000000\\' fill-opacity=\\'1\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUpVariant}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">La méthode Urigi.</h2>
            <p className="text-gray-500 text-lg">Nous avons repensé la façon dont vous interagissez avec votre audience sur WhatsApp.</p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { title: "Automatisation complète", desc: "Planifiez vos campagnes et laissez Urigi s'occuper de l'envoi pendant que vous dormez.", icon: <Settings className="w-6 h-6 text-primary" /> },
              { title: "Gestion centralisée", desc: "Tous vos contacts, listes et rapports de performance dans un seul tableau de bord clair.", icon: <Layers className="w-6 h-6 text-primary" /> },
              { title: "Délivrabilité optimale", desc: "Des algorithmes intelligents pour éviter les blocages et garantir l'arrivée de vos messages.", icon: <Rocket className="w-6 h-6 text-primary" /> }
            ].map((sol, i) => (
              <motion.div key={i} variants={fadeUpVariant} className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:-translate-y-1 transition-transform duration-300">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  {sol.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{sol.title}</h3>
                <p className="text-gray-500 leading-relaxed">{sol.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 text-white" />
                </div>
                <span className="font-bold text-lg text-gray-900 tracking-tight">Urigi</span>
              </div>
              <p className="text-sm text-gray-500 max-w-xs">
                © 2026 Urigi Marketing. Tous droits réservés.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">Produit</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a href="#" className="hover:text-primary transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">Ressources</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Centre d'aide</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">Légal</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><a href="#" className="hover:text-primary transition-colors">Conditions d'utilisation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Politique de confidentialité</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
