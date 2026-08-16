"use client";

import { toast } from 'react-hot-toast';
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Send, CheckCircle, AlertCircle, Loader2, Bold, Italic, Strikethrough, Link as LinkIcon, Image as ImageIcon, User, X, Smile } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { canLaunchCampaign } from "@/lib/limits";

interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string[];
}

export default function NouvelleCampagnePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const campaignId = searchParams.get('id');

  const [campaignType, setCampaignType] = useState<"message" | "status">("message");
  const [campaignName, setCampaignName] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [message, setMessage] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(5);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const EMOJIS = ["😀","😂","🤣","😊","🥰","😍","😘","😋","😎","😢","😭","😡","👍","👎","👏","🙌","🤝","🔥","✨","🎉","💯","✅","❌","⚠️","📱","💻","🛍️","🎁","📅","📍"];
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  
  // Progress State
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [showProgressModal, setShowProgressModal] = useState(false);

  // WhatsApp Engine State
  const [whatsappUser, setWhatsappUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetchContacts();
    fetchTemplates();
    checkWhatsAppStatus();
    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

  const fetchTemplates = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userData.user.id);
      
    if (data && !error) {
      setDbTemplates(data);
    }
  };

  const loadCampaign = async () => {
    const { data, error } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
    if (data) {
      setCampaignName(data.name || "");
      setTargetGroup(data.target_group || "");
      setMessage(data.message_content || "");
      if (data.type) {
        setCampaignType(data.type as "message" | "status");
      }
      if (data.delay_seconds) {
        setDelaySeconds(data.delay_seconds);
      }
      if (data.image_base64) {
        setImageBase64(data.image_base64);
        setImagePreview("data:image/jpeg;base64," + data.image_base64);
      }
    }
  };

  const checkWhatsAppStatus = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/status`, { cache: 'no-store' });
      const data = await res.json();
      setIsConnected(data.connected);
      if (data.user) {
        setWhatsappUser(data.user);
      }
    } catch (e) {
      setIsConnected(false);
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      if (isVideo && file.size > 15 * 1024 * 1024) {
        toast.error("La vidéo est trop volumineuse. Veuillez choisir une vidéo de moins de 15 Mo.");
        return;
      }
      if (!isVideo && file.size > 5 * 1024 * 1024) {
        toast.error("L'image est trop volumineuse. Veuillez choisir une image de moins de 5 Mo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setMediaType(isVideo ? 'video' : 'image');
        const base64Data = base64String.split(',')[1];
        setImageBase64(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview("");
    setImageBase64("");
  };

  const insertFormatting = (type: string) => {
    const textarea = document.getElementById('message') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);
    let newText = "";
    
    if (type === 'var') {
      newText = message.substring(0, start) + "{{nom}}" + message.substring(end);
      setMessage(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + 7, start + 7); }, 0);
      return;
    }
    
    if (type === 'link') {
      newText = message.substring(0, start) + (selectedText || "https://") + message.substring(end);
      setMessage(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + 8, start + 8 + (selectedText ? 0 : 0)); }, 0);
      return;
    }

    const char = type;
    if (selectedText) {
      newText = message.substring(0, start) + char + selectedText + char + message.substring(end);
      setMessage(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start, end + 2); }, 0);
    } else {
      newText = message.substring(0, start) + char + "texte" + char + message.substring(end);
      setMessage(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + 1, start + 6); }, 0);
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTemplateId(val);
    if (val !== "") {
      const template = dbTemplates.find(t => t.id === val);
      if (template) {
        setMessage(template.content);
      }
    }
  };

  const fetchContacts = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userData.user.id);
      
    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setContacts(data);
      const tags = new Set<string>();
      data.forEach(c => {
        if (c.tags) c.tags.forEach((t: string) => tags.add(t));
      });
      setAvailableTags(Array.from(tags));
    }
  };

  const startCampaign = async () => {
    if (!isConnected) {
      toast.error("Votre compte WhatsApp n'est pas connecté. Veuillez le connecter dans les paramètres avant d'envoyer la campagne.");
      return;
    }

    if (!campaignName || !targetGroup || !message) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    let targetContacts = contacts;
    if (targetGroup !== "all") {
      targetContacts = contacts.filter(c => c.tags && c.tags.includes(targetGroup));
    }

    if (targetContacts.length === 0) {
      toast.error("Aucun contact trouvé pour ce groupe.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Vous devez être connecté.");
      return;
    }

    const limitCheck = await canLaunchCampaign(userData.user.id, targetContacts.length);
    if (!limitCheck.allowed) {
      toast.error(`Votre abonnement ne vous permet d'envoyer qu'à ${limitCheck.maxAllowed} contacts par campagne (ou cette fonctionnalité est bloquée). Vous essayez d'envoyer à ${targetContacts.length} contacts. Veuillez passer à l'abonnement supérieur.`);
      return;
    }

    setShowProgressModal(true);
    setIsSending(true);
    setProgress({ current: 0, total: targetContacts.length, success: 0, failed: 0 });

    let successCount = 0;
    let failedCount = 0;

    if (campaignType === 'status') {
      // ENVOI D'UN STATUT WHATSAPP (Un seul appel API pour tout le groupe)
      const phones = targetContacts.map(c => c.phone);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/send-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contacts: phones,
            message: message,
            mediaBase64: imageBase64 || undefined,
            mediaType: mediaType
          })
        });
        if (res.ok) {
          successCount = phones.length;
          setProgress({ current: phones.length, total: phones.length, success: successCount, failed: 0 });
        } else {
          failedCount = phones.length;
          setProgress({ current: phones.length, total: phones.length, success: 0, failed: failedCount });
        }
      } catch (err) {
        failedCount = phones.length;
        setProgress({ current: phones.length, total: phones.length, success: 0, failed: failedCount });
      }
    } else {
      // ENVOI DE MESSAGES DIRECTS (Boucle classique)
      for (let i = 0; i < targetContacts.length; i++) {
        const contact = targetContacts[i];
        
        // Personnalisation du message
        let contactName = contact.name;
        if (!contactName || contactName.toLowerCase() === "contact whatsapp" || contactName.toLowerCase() === "inconnu") {
          contactName = "Ami";
        }
        
        const personalizedMessage = message.replace(/\{\{\s*nom\s*\}\}/gi, contactName);

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          const res = await fetch(`${apiUrl}/api/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: contact.phone,
              message: personalizedMessage,
              imageBase64: imageBase64 || undefined
            })
          });

          if (res.ok) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (err) {
          failedCount++;
        }

        setProgress({ current: i + 1, total: targetContacts.length, success: successCount, failed: failedCount });

        if (i < targetContacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        }
      }
    }

    setIsSending(false);
    
    // Tentative d'enregistrement dans la table campaigns
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const payload = {
          user_id: userData.user.id,
          name: campaignName,
          status: 'Terminée',
          total_messages: targetContacts.length,
          sent_messages: successCount,
          message_content: message,
          target_group: targetGroup,
          delay_seconds: delaySeconds,
          image_base64: imageBase64 || null,
          type: campaignType
        };

        let error;
        if (campaignId) {
          const res = await supabase.from('campaigns').update(payload).eq('id', campaignId);
          error = res.error;
        } else {
          const res = await supabase.from('campaigns').insert([payload]);
          error = res.error;
        }

        if (error) {
          console.error("Erreur d'insertion:", error);
          toast.error("Erreur lors de l'enregistrement de l'historique de campagne: " + error.message);
        }
      }
    } catch(e: any) {
      console.log("Historique de campagne non sauvegardé", e);
      toast.error("Exception: " + e.message);
    }
  };

  const saveDraft = async () => {
    if (!campaignName) {
      toast.error("Veuillez au moins renseigner le nom de la campagne pour la sauvegarder en brouillon.");
      return;
    }

    let targetContacts = contacts;
    if (targetGroup && targetGroup !== "all") {
      targetContacts = contacts.filter(c => c.tags && c.tags.includes(targetGroup));
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const payload = {
          user_id: userData.user.id,
          name: campaignName,
          status: 'Brouillon',
          total_messages: targetContacts.length,
          sent_messages: 0,
          message_content: message,
          target_group: targetGroup,
          delay_seconds: delaySeconds,
          image_base64: imageBase64 || null,
          type: campaignType
        };

        let error;
        if (campaignId) {
          const res = await supabase.from('campaigns').update(payload).eq('id', campaignId);
          error = res.error;
        } else {
          const res = await supabase.from('campaigns').insert([payload]);
          error = res.error;
        }

        if (error) {
          toast.error("Erreur lors de la sauvegarde du brouillon: " + error.message);
        } else {
          router.push('/campagnes');
        }
      }
    } catch(e: any) {
      toast.error("Exception: " + e.message);
    }
  };
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/campagnes" className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Nouvelle Campagne</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 hidden sm:block">
              Configurez et envoyez une nouvelle campagne WhatsApp.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto w-full sm:w-auto">
          <button 
            onClick={saveDraft}
            className="flex-1 sm:flex-none inline-flex justify-center items-center gap-x-2 rounded-md bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="-ml-0.5 h-4 w-4 text-gray-400" />
            Brouillon
          </button>
          <button 
            onClick={startCampaign}
            disabled={isSending}
            className="flex-1 sm:flex-none inline-flex justify-center items-center gap-x-2 rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            <Send className="-ml-0.5 h-4 w-4" />
            Lancer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne Principale (Formulaire) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
            <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-4">Paramètres généraux</h2>
            
            <div>
              <label htmlFor="campaignName" className="block text-sm font-semibold leading-6 text-gray-900 mb-1.5">
                Nom de la campagne
              </label>
              <div>
                <input
                  type="text"
                  name="campaignName"
                  id="campaignName"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm sm:leading-6 transition-all"
                  placeholder="Ex: Promo Hiver 2026"
                />
              </div>
            </div>

            <div>
              <label htmlFor="campaignType" className="block text-sm font-semibold leading-6 text-gray-900 mb-1.5">
                Type de campagne
              </label>
              <div>
                <select
                  id="campaignType"
                  name="campaignType"
                  value={campaignType}
                  onChange={(e) => setCampaignType(e.target.value as "message" | "status")}
                  className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm sm:leading-6 transition-all bg-white"
                >
                  <option value="message">Message Direct (Classique)</option>
                  <option value="status">Statut WhatsApp (Nouveau)</option>
                </select>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                {campaignType === "status" 
                  ? "Votre statut sera posté et visible par les contacts sélectionnés. Attention: ils doivent avoir enregistré votre numéro."
                  : "Chaque contact recevra un message privé individuel."}
              </p>
            </div>

            <div>
              <label htmlFor="targetGroup" className="block text-sm font-semibold leading-6 text-gray-900 mb-1.5">
                {campaignType === 'status' ? "Qui peut voir ce statut ?" : "Groupe cible (Contacts)"}
              </label>
              <div>
                <select
                  id="targetGroup"
                  name="targetGroup"
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm sm:leading-6 transition-all bg-white"
                >
                  <option value="">Sélectionnez un groupe</option>
                  <option value="all">Tous les contacts ({contacts.length})</option>
                  {availableTags.map(tag => (
                    <option key={tag} value={tag}>{tag} ({contacts.filter(c => c.tags?.includes(tag)).length})</option>
                  ))}
                </select>
              </div>
            </div>

            {campaignType === 'message' && (
              <div>
                <label htmlFor="delaySeconds" className="block text-sm font-semibold leading-6 text-gray-900 mb-1.5 flex items-center justify-between">
                  Délai entre les envois (en secondes)
                  <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Anti-Blocage</span>
                </label>
                <div>
                  <input
                    type="number"
                    name="delaySeconds"
                    id="delaySeconds"
                    min={1}
                    max={600}
                    value={delaySeconds}
                    onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 3)}
                    className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm sm:leading-6 transition-all"
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500">Un délai plus long (ex: 5 à 15s) réduit considérablement le risque que WhatsApp bloque votre numéro pour spam.</p>
              </div>
            )}

            <div>
              <label htmlFor="whatsappAccount" className="block text-sm font-semibold leading-6 text-gray-900 mb-1.5">
                Compte WhatsApp expéditeur
              </label>
              <div>
                <select
                  id="whatsappAccount"
                  name="whatsappAccount"
                  disabled={!isConnected}
                  className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm sm:leading-6 disabled:bg-gray-50 disabled:text-gray-500 transition-all bg-white"
                >
                  {isConnected ? (
                    <option>
                      {whatsappUser?.name || "Mon Compte"} ({whatsappUser?.id ? whatsappUser.id.split(':')[0].split('@')[0] : "WhatsApp Connecté"})
                    </option>
                  ) : (
                    <option>⚠️ Aucun compte WhatsApp connecté</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
            <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-4">
              {campaignType === 'status' ? 'Contenu du statut' : 'Contenu du message'}
            </h2>
            
            {campaignType === 'status' ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold leading-6 text-gray-900 mb-2">
                    Média du statut (Image ou Vidéo)
                  </label>
                  {!imagePreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                          <ImageIcon className="w-6 h-6 text-primary" />
                        </div>
                        <p className="mb-1 text-sm text-gray-600"><span className="font-semibold text-primary">Cliquez</span> pour ajouter une photo ou vidéo</p>
                        <p className="text-xs text-gray-400">Taille idéale : Format vertical (9:16). Vidéo max 15Mo.</p>
                      </div>
                      <input type="file" accept="image/*,video/mp4,video/quicktime" className="hidden" onChange={handleMediaUpload} />
                    </label>
                  ) : (
                    <div className="relative inline-block w-full h-48 rounded-xl overflow-hidden border border-gray-200 group bg-gray-900">
                      {mediaType === 'video' ? (
                        <video src={imagePreview} className="w-full h-full object-contain" controls />
                      ) : (
                        <img src={imagePreview} className="w-full h-full object-contain" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={removeImage} className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-red-50 shadow-lg transition-colors">
                          <X className="w-4 h-4" /> Supprimer le média
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label htmlFor="message" className="block text-sm font-semibold leading-6 text-gray-900 mb-1.5">
                    Texte ou Légende
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      id="message"
                      name="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 py-3 pl-4 pr-12 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm transition-all"
                      placeholder="Ajoutez une légende à votre statut..."
                      maxLength={150}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute right-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>

                  {showEmojiPicker && (
                    <div className="absolute z-30 bottom-full right-0 mb-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-3">
                      <div className="grid grid-cols-6 gap-2">
                        {EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setMessage(prev => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="text-xl hover:bg-gray-100 p-1 rounded transition-colors text-center"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-500">Si vous n'ajoutez pas de média, ce texte sera publié sur un fond coloré.</p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="template" className="block text-sm font-semibold leading-6 text-gray-900 mb-1.5">
                    Modèle (Optionnel)
                  </label>
                  <div>
                    <select
                      id="template"
                      name="template"
                      value={selectedTemplateId}
                      onChange={handleTemplateChange}
                      className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm sm:leading-6 transition-all bg-white"
                    >
                      <option value="">Partir de zéro</option>
                      {dbTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="message" className="block text-sm font-semibold leading-6 text-gray-900">
                      Contenu du message
                    </label>
                  </div>
                  
                  <div className="border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary focus-within:border-primary shadow-sm bg-white">
                    {/* Toolbar */}
                    <div className="bg-gray-50 border-b border-gray-300 px-3 py-2 flex flex-wrap items-center gap-1">
                      <button type="button" onClick={() => insertFormatting('*')} className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors" title="Gras">
                        <Bold className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => insertFormatting('_')} className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors" title="Italique">
                        <Italic className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => insertFormatting('~')} className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors" title="Barré">
                        <Strikethrough className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-gray-300 mx-1"></div>
                      <button type="button" onClick={() => insertFormatting('link')} className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors" title="Lien">
                        <LinkIcon className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => insertFormatting('var')} className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded flex items-center gap-1 text-xs font-medium transition-colors" title="Insérer variable">
                        <User className="w-3.5 h-3.5" /> {"{{nom}}"}
                      </button>
                      <div className="w-px h-4 bg-gray-300 mx-1"></div>
                      
                      <label className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors" title="Joindre une image">
                        <ImageIcon className="w-4 h-4" /> Image
                        <input type="file" accept="image/*" className="hidden" onChange={handleMediaUpload} />
                      </label>

                      <div className="w-px h-4 bg-gray-300 mx-1"></div>
                      
                      <div className="relative">
                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded flex items-center gap-1 text-xs font-medium transition-colors" title="Emojis">
                          <Smile className="w-4 h-4" /> Emoji
                        </button>
                        
                        {showEmojiPicker && (
                          <div className="absolute z-30 top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-3 cursor-default" onClick={e => e.stopPropagation()}>
                            <div className="grid grid-cols-6 gap-2">
                              {EMOJIS.map(emoji => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMessage(prev => prev + emoji);
                                    setShowEmojiPicker(false);
                                  }}
                                  className="text-xl hover:bg-gray-100 p-1 rounded transition-colors text-center"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {imagePreview && (
                      <div className="px-4 pt-3 pb-1 border-b border-gray-100 bg-gray-50/50">
                        <div className="relative inline-block group">
                          <img src={imagePreview} alt="Aperçu jointe" className="h-20 w-auto rounded border border-gray-200 object-cover" />
                          <button 
                            type="button" 
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="block w-full border-0 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 resize-y"
                      placeholder="Écrivez votre message WhatsApp ici... Vous pouvez utiliser les boutons ci-dessus pour le mettre en forme."
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Colonne Latérale (Aperçu) */}
        <div className="space-y-6">
          <div className="bg-gray-100 border border-gray-200 rounded-xl shadow-sm p-4 sticky top-24">
            <h3 className="text-sm font-medium text-gray-900 flex items-center justify-center gap-2 mb-4">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-500">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              Aperçu WhatsApp
            </h3>
            
            {campaignType === 'status' ? (
              <div className="bg-black w-full rounded-2xl h-[400px] relative overflow-hidden flex flex-col shadow-2xl ring-4 ring-black/5">
                {/* Header du Statut */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xs font-bold overflow-hidden border-2 border-white/20">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-white text-[15px] font-semibold drop-shadow-md">Mon Statut</p>
                    <p className="text-white/80 text-[11px] drop-shadow-md">À l'instant</p>
                  </div>
                </div>
                
                {/* Contenu principal (Image, Vidéo ou Fond de couleur) */}
                <div className={`flex-1 flex flex-col items-center justify-center w-full h-full relative ${!imagePreview ? 'bg-primary' : 'bg-black'}`}>
                  {imagePreview ? (
                    <>
                      {mediaType === 'video' ? (
                        <video src={imagePreview} className="w-full max-h-full object-contain relative z-10" />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl" style={{ backgroundImage: `url(${imagePreview})` }}></div>
                          <img src={imagePreview} alt="Statut" className="w-full max-h-full object-contain relative z-10" />
                        </>
                      )}
                    </>
                  ) : (
                    <div className="px-6 relative z-10 w-full flex items-center justify-center h-full">
                      <p className="text-white text-center font-medium text-2xl leading-snug drop-shadow-sm break-words">
                        {message || "Votre statut WhatsApp..."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Barre de légende (si image présente) */}
                {imagePreview && message && (
                  <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-center z-20">
                    <p className="text-white text-[15px] font-medium drop-shadow-md break-words">{message}</p>
                  </div>
                )}
                
                {/* Indicateur de swipe up */}
                <div className="absolute bottom-2 left-0 right-0 flex justify-center z-20 opacity-50">
                  <div className="w-12 h-1 bg-white/50 rounded-full"></div>
                </div>
              </div>
            ) : (
              <div className="bg-[#E5DDD5] w-full rounded-2xl h-[400px] relative overflow-hidden flex flex-col shadow-inner">
                <div className="bg-[#075E54] h-14 w-full flex items-center px-4 shadow-sm z-10">
                  <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold overflow-hidden">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-white text-[15px] font-semibold">Client</p>
                  </div>
                </div>
                <div className="flex-1 p-4 flex flex-col justify-end bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-cover bg-center">
                  <div className="bg-[#DCF8C6] self-end max-w-[85%] rounded-xl rounded-tr-none p-1 mb-2 shadow-sm relative">
                    {imagePreview && (
                      <img src={imagePreview} alt="Image envoyée" className="w-full h-auto rounded-lg mb-1.5 max-h-48 object-cover" />
                    )}
                    <p className="text-[14px] leading-relaxed text-gray-800 break-words whitespace-pre-wrap px-2 pb-5 pt-1">
                      {message ? message.replace(/\{\{\s*nom\s*\}\}/gi, "John") : "Bonjour John, voici notre offre..."}
                    </p>
                    <p className="text-[10px] text-gray-500/80 text-right mt-1 absolute bottom-1.5 right-2 font-medium">10:42</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" />
            <div className="relative transform overflow-hidden rounded-2xl bg-white p-8 text-left shadow-2xl transition-all w-full max-w-md">
              <div className="flex flex-col items-center">
                {isSending ? (
                  <div className="relative mb-6">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="45" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200" />
                      <circle 
                        cx="48" cy="48" r="45" stroke="currentColor" strokeWidth="6" fill="transparent" 
                        strokeDasharray={282.7} 
                        strokeDashoffset={282.7 - (282.7 * (progress.current / Math.max(1, progress.total)))} 
                        className="text-primary transition-all duration-500" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-primary">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isSending ? "Envoi en cours..." : "Campagne terminée !"}
                </h3>
                <p className="text-gray-500 text-center mb-6">
                  {isSending 
                    ? "Veuillez patienter pendant l'envoi de vos messages. Ne fermez pas cette fenêtre." 
                    : "Vos messages ont été distribués avec succès."}
                </p>

                <div className="w-full bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Progression</span>
                    <span className="font-bold text-gray-900">{progress.current} / {progress.total}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Réussis</span>
                    <span className="font-bold text-green-600">{progress.success}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-red-500" /> Échoués</span>
                    <span className="font-bold text-red-600">{progress.failed}</span>
                  </div>
                </div>

                {!isSending && (
                  <button
                    onClick={() => { setShowProgressModal(false); window.location.href = '/campagnes'; }}
                    className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 font-medium hover:bg-gray-800 transition-colors"
                  >
                    Retour aux campagnes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
