"use client";

import { useState } from "react";
import { 
  Search, BookOpen, MessageCircle, FileText, 
  ChevronDown, ChevronUp, Mail, Phone, ExternalLink, HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Comment connecter mon compte WhatsApp ?",
    answer: "Rendez-vous dans la section 'Paramètres' ou sur le tableau de bord principal. Vous y trouverez un QR Code à scanner avec votre application WhatsApp mobile (Appareils connectés > Connecter un appareil)."
  },
  {
    question: "Quelles sont les limites d'envoi de messages ?",
    answer: "Le plan Starter est limité à 15 messages manuels/jour. Le plan Pro permet des campagnes jusqu'à 500 contacts, avec des messages manuels illimités. Le plan Elite offre des envois et contacts illimités sous réserve du respect des politiques anti-spam de WhatsApp."
  },
  {
    question: "Mon chatbot ne répond pas aux messages, que faire ?",
    answer: "Vérifiez que le statut du Chatbot est activé (bouton vert) sur la page 'Chatbot'. Assurez-vous également que votre téléphone principal est bien connecté à Internet et que les mots-clés de votre règle correspondent exactement au message reçu."
  },
  {
    question: "Puis-je importer une liste de contacts ?",
    answer: "Oui ! Depuis la page Contacts, vous pouvez importer un fichier CSV contenant les numéros de vos clients pour lancer des campagnes massives (disponible à partir du plan Pro)."
  },
  {
    question: "Comment changer mon abonnement ?",
    answer: "Allez dans la section 'Abonnement Pro' dans le menu latéral. Vous pourrez y choisir un nouveau plan. La mise à niveau est instantanée."
  }
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      {/* Header & Search */}
      <div className="bg-primary rounded-3xl p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <HelpCircle className="w-96 h-96" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-extrabold mb-4">Comment pouvons-nous vous aider ?</h1>
          <p className="text-primary-foreground/80 text-lg mb-8">
            Recherchez dans notre base de connaissances ou contactez notre équipe d'experts.
          </p>
          
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Rechercher une question, un mot-clé (ex: chatbot, facturation)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-gray-900 rounded-2xl py-4 pl-12 pr-4 shadow-md focus:outline-none focus:ring-4 focus:ring-white/20 transition-all text-lg"
            />
          </div>
        </div>
      </div>

      {/* Quick Links / Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <button className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md hover:border-primary/20 transition-all group">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BookOpen className="h-7 w-7 text-blue-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Guides & Tutoriels</h3>
          <p className="text-sm text-gray-500">Apprenez à maîtriser la plateforme étape par étape.</p>
        </button>

        <button className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md hover:border-primary/20 transition-all group">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <MessageCircle className="h-7 w-7 text-green-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Règles Anti-Spam</h3>
          <p className="text-sm text-gray-500">Comprendre les politiques de WhatsApp pour éviter les blocages.</p>
        </button>

        <button className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md hover:border-primary/20 transition-all group">
          <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText className="h-7 w-7 text-purple-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Facturation</h3>
          <p className="text-sm text-gray-500">Gérez vos factures, reçus et détails de paiement.</p>
        </button>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Questions Fréquemment Posées</h2>
        
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500">Aucun résultat trouvé pour "{searchQuery}".</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl">
            {filteredFaqs.map((faq, index) => (
              <div 
                key={index} 
                className={cn(
                  "bg-white border rounded-2xl overflow-hidden transition-all duration-200",
                  openFaqIndex === index ? "border-primary shadow-md" : "border-gray-200 hover:border-gray-300"
                )}
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
                >
                  <span className="font-semibold text-gray-900 pr-8">{faq.question}</span>
                  {openFaqIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                  )}
                </button>
                
                <div 
                  className={cn(
                    "px-6 overflow-hidden transition-all duration-300 ease-in-out",
                    openFaqIndex === index ? "max-h-96 pb-5 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <p className="text-gray-600 leading-relaxed pt-2 border-t border-gray-100">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Support */}
      <div className="mt-16 bg-gray-900 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Vous ne trouvez pas votre réponse ?</h2>
          <p className="text-gray-400 max-w-xl">
            Notre équipe de support technique est disponible 24/7 pour les clients Elite, et du lundi au vendredi pour les plans Pro et Starter.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
          <a href="mailto:support@urigimarketing.com" className="flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">
            <Mail className="h-5 w-5" />
            Nous écrire
          </a>
          <button className="flex items-center gap-2 bg-gray-800 text-white border border-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-700 transition-colors">
            <Phone className="h-5 w-5" />
            Rappelez-moi
          </button>
        </div>
      </div>
    </div>
  );
}
