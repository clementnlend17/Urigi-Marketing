"use client";

import { toast } from 'react-hot-toast';
import { useState, useEffect } from "react";
import { Plus, Search, MessageSquare, Edit2, Trash2, Copy, Sparkles, Wand2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
  created_at: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Form states
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("Promotion");
  const [newTemplateContent, setNewTemplateContent] = useState("");

  // AI states
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setTemplates(data);
    }
  };

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch(category) {
      case "Promotion": return "bg-pink-50 text-pink-700 ring-pink-600/20";
      case "Onboarding": return "bg-blue-50 text-blue-700 ring-blue-600/20";
      case "Vente": return "bg-amber-50 text-amber-700 ring-amber-600/20";
      case "Alerte": return "bg-red-50 text-red-700 ring-red-600/20";
      default: return "bg-gray-50 text-gray-700 ring-gray-600/20";
    }
  };

  const handleOpenModal = () => {
    setEditingTemplateId(null);
    setNewTemplateName("");
    setNewTemplateCategory("Promotion");
    setNewTemplateContent("");
    setShowAiGenerator(false);
    setAiPrompt("");
    setIsModalOpen(true);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplateId(template.id);
    setNewTemplateName(template.name);
    setNewTemplateCategory(template.category);
    setNewTemplateContent(template.content);
    setShowAiGenerator(false);
    setAiPrompt("");
    setIsModalOpen(true);
  };

  const handleDuplicate = async (template: Template) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('templates')
      .insert({
        user_id: user.id,
        name: `${template.name} (Copie)`,
        category: template.category,
        content: template.content,
      })
      .select();

    if (error) {
      toast.error("Erreur lors de la duplication : " + error.message);
      return;
    }

    if (data && data.length > 0) {
      setTemplates([data[0], ...templates]);
      setToastMessage("Template dupliqué !");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDelete = (id: string) => {
    setTemplateToDelete(id);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateToDelete);
      
    if (error) {
      toast.error("Erreur : " + error.message);
      setIsDeleting(false);
      return;
    }

    setTemplates(templates.filter(t => t.id !== templateToDelete));
    setTemplateToDelete(null);
    setIsDeleting(false);
    setToastMessage("Template supprimé !");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) return;
    setIsSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Erreur: Utilisateur non connecté.");
      setIsSaving(false);
      return;
    }

    if (editingTemplateId) {
      // Mise à jour
      const { data, error } = await supabase
        .from('templates')
        .update({
          name: newTemplateName,
          category: newTemplateCategory,
          content: newTemplateContent,
        })
        .eq('id', editingTemplateId)
        .select();

      if (error) {
        toast.error("Erreur de mise à jour: " + error.message);
      } else if (data) {
        setTemplates(templates.map(t => (t.id === editingTemplateId ? data[0] : t)));
        setToastMessage("Template modifié !");
      }
    } else {
      // Création
      const { data, error } = await supabase
        .from('templates')
        .insert({
          user_id: user.id,
          name: newTemplateName,
          category: newTemplateCategory,
          content: newTemplateContent,
        })
        .select();

      if (error) {
        toast.error("Erreur d'insertion: " + error.message);
      } else if (data) {
        setTemplates([data[0], ...templates]);
        setToastMessage("Nouveau template enregistré !");
      }
    }

    setIsSaving(false);
    setIsModalOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleGenerateAI = () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);

    // Simulate AI generation time
    setTimeout(() => {
      const promptLower = aiPrompt.toLowerCase();
      let generatedText = "";
      
      if (promptLower.includes("noël") || promptLower.includes("fête")) {
        generatedText = "🎅 Ho ho ho {{nom}} ! La magie de Noël est là. Profitez de nos offres exceptionnelles avec le code NOEL26. Découvrez-les ici : {{lien}} 🎁";
      } else if (promptLower.includes("solde") || promptLower.includes("promo")) {
        generatedText = "🔥 ALERTE PROMO ! Bonjour {{nom}}, c'est le moment de craquer. -30% sur toute la boutique jusqu'à ce soir. N'attendez plus ! 🛍️";
      } else {
        generatedText = `Bonjour {{nom}}, suite à votre intérêt pour "${aiPrompt}", nous avons une offre spéciale pour vous. Cliquez ici pour en savoir plus : {{lien}} ✨`;
      }

      setNewTemplateContent(generatedText);
      setIsGenerating(false);
      setShowAiGenerator(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bibliothèque de Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez vos modèles de messages réutilisables pour gagner du temps lors de la création de campagnes.
          </p>
        </div>
        <div>
          <button 
            onClick={handleOpenModal}
            className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
          >
            <Plus className="-ml-0.5 h-4 w-4" />
            Nouveau Template
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative max-w-md w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-9 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            placeholder="Rechercher un template par nom ou catégorie..."
          />
        </div>
      </div>

      {/* Grille de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-gray-200 border-dashed">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Aucun template trouvé pour votre recherche.</p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{template.name}</h3>
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap ml-2 ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                </div>
                
                {/* Aperçu du message */}
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 line-clamp-4 relative">
                  {template.content}
                </div>
              </div>
              
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-400">Modifié le {new Date(template.created_at).toLocaleDateString('fr-FR')}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDuplicate(template)} className="p-1.5 text-gray-400 hover:text-primary rounded-md hover:bg-primary/10 transition-colors" title="Dupliquer">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEdit(template)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-md hover:bg-blue-50 transition-colors" title="Modifier">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(template.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modale Nouveau Template */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                {editingTemplateId ? "Modifier le Template" : "Créer un nouveau Template"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du template</label>
                  <input 
                    type="text" 
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full rounded-lg border-gray-300 py-2.5 px-3 shadow-sm focus:border-primary focus:ring-primary sm:text-sm" 
                    placeholder="Ex: Relance Hivernale" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select 
                    value={newTemplateCategory}
                    onChange={(e) => setNewTemplateCategory(e.target.value)}
                    className="w-full rounded-lg border-gray-300 py-2.5 px-3 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="Promotion">Promotion</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Alerte">Alerte</option>
                    <option value="Vente">Vente</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Contenu du message</label>
                  <button 
                    onClick={() => setShowAiGenerator(!showAiGenerator)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md border border-purple-200 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Rédiger avec l'IA
                  </button>
                </div>

                {/* AI Generator Panel */}
                {showAiGenerator && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg animate-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-purple-900 mb-2">
                      De quoi doit parler ce message ?
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Ex: Une promo de 20% pour la fête des mères..."
                        className="flex-1 rounded-lg border-purple-200 py-2.5 px-3 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                        disabled={isGenerating}
                      />
                      <button 
                        onClick={handleGenerateAI}
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
                      >
                        {isGenerating ? (
                          <>
                            <Wand2 className="w-4 h-4 animate-spin" />
                            Création...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4" />
                            Générer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    rows={6}
                    value={newTemplateContent}
                    onChange={(e) => setNewTemplateContent(e.target.value)}
                    className="w-full rounded-lg border-gray-300 py-3 px-4 leading-relaxed shadow-sm focus:border-primary focus:ring-primary sm:text-sm resize-none"
                    placeholder="Tapez votre message ici. Utilisez {{nom}} pour personnaliser."
                  />
                  <span className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-1">
                    <span className="text-primary font-medium">{newTemplateContent.length}</span> caractères
                  </span>
                </div>
                
                {/* Variables suggérées */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 font-medium">Variables :</span>
                  <button 
                    onClick={() => setNewTemplateContent(prev => prev + " {{nom}}")}
                    className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20"
                  >
                    {"{{nom}}"}
                  </button>
                  <button 
                    onClick={() => setNewTemplateContent(prev => prev + " {{entreprise}}")}
                    className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20"
                  >
                    {"{{entreprise}}"}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button 
                onClick={handleSaveTemplate}
                disabled={!newTemplateName.trim() || !newTemplateContent.trim() || isSaving}
                className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {editingTemplateId ? "Mettre à jour" : "Enregistrer le modèle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation de suppression */}
      {templateToDelete && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setTemplateToDelete(null)} />
            <div className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">Supprimer le modèle</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Êtes-vous sûr de vouloir supprimer ce modèle de message ? Cette action est définitive.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:col-start-2 disabled:opacity-50"
                  onClick={confirmDelete}
                >
                  {isDeleting ? "Suppression..." : "Oui, supprimer"}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 disabled:opacity-50"
                  onClick={() => setTemplateToDelete(null)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-5">
          <div className="bg-green-500/20 text-green-400 rounded-full p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
