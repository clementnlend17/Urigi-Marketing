"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Smartphone, DownloadCloud, Users, CheckSquare, Square, Search, ArrowRight, Save, QrCode, WifiOff } from "lucide-react";

interface GroupGrabberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contacts: {phone: string; name?: string; sourceGroup?: string}[]) => void;
}

// Supprimé : MOCK_GROUPS

export function GroupGrabberModal({ isOpen, onClose, onSave }: GroupGrabberModalProps) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [extractedContacts, setExtractedContacts] = useState<{phone: string; name?: string; sourceGroup?: string}[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkStatusAndFetchGroups();
    }
  }, [isOpen]);

  const checkStatusAndFetchGroups = async () => {
    try {
      const statusRes = await fetch('http://localhost:3001/api/status');
      const status = await statusRes.json();
      setIsConnected(status.connected);

      if (status.connected) {
        setIsLoadingGroups(true);
        const groupsRes = await fetch('http://localhost:3001/api/groups');
        const groupsData = await groupsRes.json();
        setGroups(groupsData.groups || []);
        setIsLoadingGroups(false);
      }
    } catch (e) {
      setIsConnected(false);
      setIsLoadingGroups(false);
    }
  };

  if (!isOpen) return null;

  const handleToggleGroup = (id: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedGroups(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedGroups.size === groups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(groups.map(g => g.id)));
    }
  };

  const handleExtract = () => {
    if (selectedGroups.size === 0) return;
    setIsExtracting(true);
    
    setTimeout(() => {
      const allExtractedContacts: {phone: string; name?: string; sourceGroup?: string}[] = [];
      selectedGroups.forEach(groupId => {
        const group = groups.find(g => g.id === groupId);
        if (group && group.participants) {
          group.participants.forEach((p: any) => {
            const phoneId = p.id;
            const contactName = p.name || undefined;
            if (phoneId.includes('@lid')) {
               allExtractedContacts.push({ phone: phoneId, name: contactName, sourceGroup: group.name });
            } else {
               const phone = phoneId.split('@')[0];
               allExtractedContacts.push({ phone: `+${phone}`, name: contactName, sourceGroup: group.name });
            }
          });
        }
      });
      setExtractedContacts(allExtractedContacts);
      setIsExtracting(false);
    }, 1000);
  };

  const handleSave = () => {
    onSave(extractedContacts);
    setSelectedGroups(new Set());
    setExtractedContacts([]);
  };

  const getSaveButtonText = () => {
    if (!isConnected) return "Connectez-vous d'abord";
    if (extractedContacts.length === 0) return "Extrayez d'abord les contacts";
    return "Enregistrer dans une liste";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <DownloadCloud className="w-6 h-6 text-primary" />
              Grabber de Groupes WhatsApp
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Récupérez les contacts des groupes auxquels vous appartenez.
            </p>
          </div>
          <div className="flex items-center gap-6">
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  WhatsApp Connecté
                </div>
                <button 
                  onClick={() => setIsConnected(false)}
                  className="text-xs font-medium text-gray-500 hover:text-red-600 underline underline-offset-2 transition-colors"
                >
                  Se déconnecter
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium border border-gray-200">
                <WifiOff className="w-4 h-4" />
                Non connecté
              </div>
            )}
            
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
          
          {!isConnected ? (
            <div className="h-full flex flex-col items-center p-8 text-center bg-white overflow-y-auto">
                <div className="max-w-md mx-auto space-y-6 my-auto">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Smartphone className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Veuillez lier votre compte</h3>
                  <p className="text-gray-500">
                    Pour que notre logiciel puisse détecter vos groupes WhatsApp et en extraire les contacts, vous devez d'abord connecter votre compte WhatsApp Web.
                  </p>
                  <button 
                    onClick={() => {
                      onClose();
                      router.push('/parametres');
                    }}
                    className="mt-6 inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-primary-hover hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
                  >
                    <QrCode className="w-5 h-5" />
                    Aller dans les paramètres
                  </button>
                </div>
            </div>
          ) : (
            /* Flux Grabber (Une fois connecté) */
            <div className="flex-1 flex flex-col md:flex-row h-full">
              {/* Left Column - Groups */}
              <div className="w-full md:w-1/2 border-r border-gray-200 flex flex-col bg-white">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    Vos Groupes ({groups.length})
                  </h3>
                  <button 
                    onClick={handleToggleAll}
                    className="text-xs font-medium text-primary hover:text-primary-hover"
                  >
                    {selectedGroups.size === groups.length ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                </div>
                
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Rechercher un groupe..." 
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {isLoadingGroups ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                      Chargement des groupes...
                    </div>
                  ) : groups.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      Aucun groupe trouvé ou WhatsApp en synchronisation.
                    </div>
                  ) : (
                    groups.map((group) => (
                      <div 
                        key={group.id}
                        onClick={() => handleToggleGroup(group.id)}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${selectedGroups.has(group.id) ? 'bg-primary/5 border-primary/20' : 'bg-white border-transparent hover:bg-gray-50'}`}
                      >
                        <div className="mt-0.5">
                          {selectedGroups.has(group.id) ? (
                            <CheckSquare className="w-5 h-5 text-primary" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{group.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 font-mono truncate">{group.id}</p>
                        </div>
                        <div className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                          ~{group.size}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={handleExtract}
                    disabled={selectedGroups.size === 0 || isExtracting}
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isExtracting ? (
                      <span className="animate-pulse">Extraction en cours...</span>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        Récupérer les contacts ({selectedGroups.size})
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column - Extracted Contacts */}
              <div className="w-full md:w-1/2 flex flex-col bg-white">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-gray-500" />
                    Contacts Extraits
                  </h3>
                  <div className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                    {extractedContacts.length} trouvés
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                  {extractedContacts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                      <DownloadCloud className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-sm font-medium">Aucun contact extrait.</p>
                      <p className="text-xs mt-1 max-w-[250px]">Cochez des groupes à gauche et cliquez sur le bouton récupérer en bas.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {extractedContacts.map((contact, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-md p-2.5 text-sm font-mono text-gray-700 shadow-sm flex flex-col gap-1">
                          <div className="flex items-center gap-2 font-sans font-medium text-gray-900 truncate">
                            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                            {contact.name ? contact.name : "Contact WhatsApp"}
                          </div>
                          <div className="text-xs text-gray-500 pl-4 truncate">
                            {contact.phone.includes('@lid') ? "🔒 Masqué (LID)" : contact.phone}
                          </div>
                          {contact.sourceGroup && (
                            <div className="text-[10px] text-primary bg-primary/10 w-fit px-1.5 py-0.5 rounded-md ml-4 truncate">
                              {contact.sourceGroup}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 border-t border-gray-200 bg-white flex items-center justify-between">
          <p className="text-sm text-gray-500 hidden sm:block">
            {isConnected ? "Ces contacts seront automatiquement ajoutés à une liste pour vos campagnes." : ""}
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button 
              onClick={handleSave}
              disabled={!isConnected || extractedContacts.length === 0}
              className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              title={!isConnected ? "Veuillez connecter WhatsApp" : extractedContacts.length === 0 ? "Veuillez extraire des contacts" : ""}
            >
              <Save className="w-4 h-4" />
              {getSaveButtonText()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
