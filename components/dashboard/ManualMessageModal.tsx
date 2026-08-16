import { useState, useEffect } from 'react';
import { X, Send, AlertCircle, Smile, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { consumeManualMessage } from '@/lib/limits';

interface ManualMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: { id: string; name: string; phone: string } | null;
}

export function ManualMessageModal({ isOpen, onClose, contact }: ManualMessageModalProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    } else {
      setMessage('');
      setSelectedTemplate('');
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data } = await supabase.from('templates').select('*').eq('user_id', userData.user.id);
    if (data) setTemplates(data);
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTemplate(val);
    if (val) {
      const t = templates.find(temp => temp.id === val);
      if (t) setMessage(t.content);
    }
  };

  const handleSend = async () => {
    if (!contact) return;
    if (!message.trim()) {
      toast.error("Le message ne peut pas être vide.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    setIsSending(true);

    try {
      // Vérifier les limites
      const allowed = await consumeManualMessage(userData.user.id);
      if (!allowed) {
        toast.error("Vous avez atteint votre limite d'envois manuels pour aujourd'hui.");
        setIsSending(false);
        return;
      }

      let contactName = contact.name || "Ami";
      if (contactName.toLowerCase() === "inconnu" || contactName.toLowerCase() === "contact whatsapp") {
        contactName = "Ami";
      }
      const personalizedMessage = message.replace(/\{\{\s*nom\s*\}\}/gi, contactName);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: contact.phone,
          message: personalizedMessage
        })
      });

      if (res.ok) {
        toast.success("Message envoyé avec succès !");
        onClose();
      } else {
        toast.error("Erreur lors de l'envoi du message.");
      }
    } catch (e: any) {
      toast.error("Exception lors de l'envoi: " + e.message);
    }

    setIsSending(false);
  };

  if (!isOpen || !contact) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Envoi Manuel
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="px-6 py-5 space-y-4">
            <div className="bg-primary/5 rounded-lg p-3 flex items-start gap-3 border border-primary/10">
              <div className="mt-0.5"><AlertCircle className="w-4 h-4 text-primary" /></div>
              <p className="text-sm text-primary font-medium">
                Destinataire : <span className="font-bold">{contact.name || contact.phone}</span>
                <br />
                <span className="text-xs font-normal opacity-80">{contact.phone}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold leading-6 text-gray-900 mb-1.5">
                Modèle de message (Optionnel)
              </label>
              <select
                value={selectedTemplate}
                onChange={handleTemplateChange}
                className="w-full rounded-lg border-gray-300 py-2.5 px-3 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-white"
              >
                <option value="">Partir de zéro</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold leading-6 text-gray-900 mb-1.5">
                Votre message
              </label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border-gray-300 py-3 px-4 leading-relaxed shadow-sm focus:border-primary focus:ring-primary sm:text-sm resize-none"
                placeholder="Écrivez votre message..."
              />
              <p className="text-xs text-gray-500 mt-2">Vous pouvez utiliser l'expression {'{{nom}}'} pour insérer le nom du contact.</p>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !message.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover shadow-sm disabled:opacity-50 transition-colors"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
