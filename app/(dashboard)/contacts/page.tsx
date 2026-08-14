"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Send, CheckCircle, AlertCircle, Loader2, Bold, Italic, Strikethrough, Link as LinkIcon, Image as ImageIcon, User, Users, DownloadCloud, X, Plus, Search, Filter, MoreVertical, Upload, Pencil } from "lucide-react";
import { GroupGrabberModal } from "@/components/dashboard/GroupGrabberModal";
import { supabase } from "@/lib/supabase";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  tags: string[];
  created_at: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isGrabberModalOpen, setIsGrabberModalOpen] = useState(false);
  const [grabberToastMsg, setGrabberToastMsg] = useState("");

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // CSV State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("recent"); // 'recent' | 'oldest'
  const [activeGroup, setActiveGroup] = useState("all");

  // Selection & Bulk Actions
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // View Contact Details
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);

  // Add Group Modal
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupSelectedContacts, setGroupSelectedContacts] = useState<Set<string>>(new Set());

  // Edit Group Modal
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState("");
  const [editedGroupName, setEditedGroupName] = useState("");

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setContacts(data);
    }
  };

  const handleSaveContact = async () => {
    if (!newPhone) {
      alert("Le numéro de téléphone est obligatoire.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Erreur: Utilisateur non authentifié.");
      return;
    }

    const tags = newGroup && newGroup !== "Aucun" ? [newGroup] : [];

    if (editingContact) {
      // MODE MODIFICATION
      const { data, error } = await supabase
        .from('contacts')
        .update({
          name: newName,
          phone: newPhone,
          tags: tags
        })
        .eq('id', editingContact.id)
        .select();

      if (error) {
        alert("Erreur Supabase: " + error.message);
        return;
      }

      if (data && data.length > 0) {
        setContacts(contacts.map(c => c.id === editingContact.id ? data[0] : c));
        if (viewingContact && viewingContact.id === editingContact.id) {
          setViewingContact(data[0]); // Mettre à jour le panneau latéral
        }
        closeModal();
        setGrabberToastMsg("Contact modifié avec succès.");
        setTimeout(() => setGrabberToastMsg(""), 3000);
      }
    } else {
      // MODE AJOUT
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          name: newName,
          phone: newPhone,
          tags: tags
        })
        .select();

      if (error) {
        alert("Erreur Supabase: " + error.message);
        return;
      }

      if (data && data.length > 0) {
        setContacts([data[0], ...contacts]);
        closeModal();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    }
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setNewName(contact.name || "");
    setNewPhone(contact.phone || "");
    setNewGroup(contact.tags && contact.tags.length > 0 ? contact.tags[0] : "Aucun");
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingContact(null);
    setNewName("");
    setNewPhone("");
    setNewGroup("Aucun");
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert("Le nom du groupe est obligatoire.");
      return;
    }
    if (groupSelectedContacts.size === 0) {
      alert("Veuillez sélectionner au moins un contact pour ce groupe.");
      return;
    }

    const idsToUpdate = Array.from(groupSelectedContacts);
    const contactsToUpdate = contacts.filter(c => idsToUpdate.includes(c.id));
    
    // Pour chaque contact, on ajoute le nouveau groupe à ses tags s'il n'y est pas déjà
    const updates = contactsToUpdate.map(async (contact) => {
      const currentTags = contact.tags || [];
      if (!currentTags.includes(newGroupName)) {
        const newTags = [...currentTags, newGroupName];
        await supabase.from('contacts').update({ tags: newTags }).eq('id', contact.id);
      }
    });

    await Promise.all(updates);
    
    setGrabberToastMsg(`Groupe "${newGroupName}" créé avec succès !`);
    setTimeout(() => setGrabberToastMsg(""), 3000);
    
    setIsAddGroupModalOpen(false);
    setNewGroupName("");
    setGroupSelectedContacts(new Set());
    fetchContacts(); // Recharger pour avoir les tags à jour
  };

  const openEditGroupModal = (group: string) => {
    setGroupToEdit(group);
    setEditedGroupName(group);
    setIsEditGroupModalOpen(true);
  };

  const handleEditGroup = async () => {
    if (!editedGroupName.trim()) {
      alert("Le nom du groupe est obligatoire.");
      return;
    }
    if (editedGroupName === groupToEdit) {
      setIsEditGroupModalOpen(false);
      return;
    }

    const contactsToUpdate = contacts.filter(c => c.tags && c.tags.includes(groupToEdit));
    
    const updates = contactsToUpdate.map(async (contact) => {
      const newTags = contact.tags.map(t => t === groupToEdit ? editedGroupName : t);
      await supabase.from('contacts').update({ tags: newTags }).eq('id', contact.id);
    });

    await Promise.all(updates);
    
    setGrabberToastMsg(`Groupe renommé en "${editedGroupName}" !`);
    setTimeout(() => setGrabberToastMsg(""), 3000);
    
    if (activeGroup === groupToEdit) {
      setActiveGroup(editedGroupName);
    }
    setIsEditGroupModalOpen(false);
    fetchContacts();
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactToDelete);

    if (error) {
      alert("Erreur lors de la suppression : " + error.message);
      setIsDeleting(false);
      return;
    }

    setContacts(contacts.filter(c => c.id !== contactToDelete));
    setContactToDelete(null);
    setIsDeleting(false);
    
    // Toast de suppression
    setGrabberToastMsg("Contact supprimé avec succès.");
    setTimeout(() => setGrabberToastMsg(""), 3000);
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.size === 0) return;
    setIsDeleting(true);

    const idsToDelete = Array.from(selectedContacts);
    
    const { error } = await supabase
      .from('contacts')
      .delete()
      .in('id', idsToDelete);

    if (error) {
      alert("Erreur lors de la suppression groupée : " + error.message);
      setIsDeleting(false);
      return;
    }

    setContacts(contacts.filter(c => !selectedContacts.has(c.id)));
    setSelectedContacts(new Set());
    setIsBulkDeleteModalOpen(false);
    setIsDeleting(false);
    
    setGrabberToastMsg(`${idsToDelete.length} contacts supprimés avec succès.`);
    setTimeout(() => setGrabberToastMsg(""), 3000);
  };

  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = filteredContacts.map(c => c.id);
      setSelectedContacts(new Set(allIds));
    } else {
      setSelectedContacts(new Set());
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedContacts(newSelected);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          alert("Vous devez être connecté.");
          setIsImporting(false);
          return;
        }

        // On ignore la première ligne si c'est un header (Nom, Téléphone)
        const contactsToInsert = [];
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(',');
          if (cols.length >= 2) {
            contactsToInsert.push({
              user_id: user.id,
              name: cols[0].trim(),
              phone: cols[1].trim(),
              tags: ["Import CSV"]
            });
          }
        }

        if (contactsToInsert.length > 0) {
          const { error } = await supabase.from('contacts').insert(contactsToInsert);
          if (error) throw error;
          
          setGrabberToastMsg(`${contactsToInsert.length} contacts importés avec succès !`);
          setTimeout(() => setGrabberToastMsg(""), 4000);
          fetchContacts(); // Recharger la liste
        } else {
          alert("Aucun contact valide trouvé dans le fichier.");
        }
      } catch (err) {
        console.error(err);
        alert("Erreur lors de l'importation.");
      } finally {
        setIsImporting(false);
        setIsCsvModalOpen(false);
      }
    };
    
    reader.readAsText(file);
  };

  // Filtrage
  const filteredContacts = contacts.filter((c) => {
    // Filtrage par groupe
    if (activeGroup !== "all" && (!c.tags || !c.tags.includes(activeGroup))) {
      return false;
    }
    // Recherche par nom/téléphone/email
    const searchLower = searchQuery.toLowerCase();
    return (c.name && c.name.toLowerCase().includes(searchLower)) || 
           (c.phone && c.phone.includes(searchLower)) || 
           (c.email && c.email.toLowerCase().includes(searchLower));
  }).sort((a, b) => {
    if (activeFilter === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    // "recent" (default)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Extraire la liste dynamique des groupes (tags uniques)
  const dynamicGroups = Array.from(new Set(contacts.flatMap(c => c.tags || []))).filter(Boolean).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts & Groupes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez votre répertoire client et organisez-les en segments pour vos campagnes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0 justify-start sm:justify-end">
          <button 
            onClick={() => setIsGrabberModalOpen(true)}
            className="inline-flex flex-1 sm:flex-none justify-center items-center gap-x-2 rounded-md bg-indigo-50 px-3.5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-200 hover:bg-indigo-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer"
          >
            <DownloadCloud className="-ml-0.5 h-4 w-4 text-indigo-600" />
            Extraire depuis WhatsApp
          </button>
          <button 
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex flex-1 sm:flex-none justify-center items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer"
          >
            <Upload className="-ml-0.5 h-4 w-4 text-gray-400" />
            Importer CSV
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex flex-1 sm:flex-none justify-center items-center gap-x-2 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors w-full sm:w-auto"
          >
            <Plus className="-ml-0.5 h-4 w-4" />
            Ajouter un contact
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar des Groupes */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center justify-between">
              Groupes 
              <button onClick={() => setIsAddGroupModalOpen(true)} className="text-gray-400 hover:text-primary transition-colors bg-gray-50 hover:bg-primary/10 p-1 rounded-md">
                <Plus className="w-4 h-4" />
              </button>
            </h3>
            <ul className="space-y-1">
              <li>
                <button 
                  onClick={() => setActiveGroup("all")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${activeGroup === "all" ? "bg-primary/10 text-primary font-medium" : "text-gray-600 hover:bg-gray-50 font-medium"}`}
                >
                  <span className="flex items-center gap-2"><Users className={`w-4 h-4 ${activeGroup !== "all" && "text-gray-400"}`} /> Tous les contacts</span>
                  <span className={`${activeGroup === "all" ? "bg-white/50 text-primary" : "bg-gray-100"} px-2 py-0.5 rounded-full text-xs`}>
                    {contacts.length}
                  </span>
                </button>
              </li>
              
              {dynamicGroups.length === 0 ? (
                <li className="px-3 py-4 text-xs text-center text-gray-400 italic">
                  Aucun groupe créé. Cliquez sur le + pour en créer un.
                </li>
              ) : (
                dynamicGroups.map(group => (
                  <li key={group}>
                    <div className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors group/item ${activeGroup === group ? "bg-primary/10 text-primary font-medium" : "text-gray-600 hover:bg-gray-50 font-medium"}`}>
                      <button 
                        onClick={() => setActiveGroup(group)}
                        className="flex-1 flex items-center gap-2 truncate pr-2 text-left" 
                        title={group}
                      >
                        <Users className={`w-4 h-4 flex-shrink-0 ${activeGroup !== group && "text-gray-400"}`} /> 
                        <span className="truncate">{group}</span>
                      </button>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditGroupModal(group); }} 
                          className="p-1 text-gray-400 hover:text-primary rounded-md opacity-0 group-hover/item:opacity-100 transition-opacity"
                          title="Renommer le groupe"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <span className={`${activeGroup === group ? "bg-white/50 text-primary" : "bg-gray-100"} px-2 py-0.5 rounded-full text-xs`}>
                          {contacts.filter(c => c.tags && c.tags.includes(group)).length}
                        </span>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Table des contacts */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="relative max-w-sm w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-md border-0 py-2 pl-9 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                placeholder="Rechercher par nom, numéro..."
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 text-gray-400" />
                Filtrer
              </button>
              
              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                  <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Trier par date
                    </div>
                    <button
                      onClick={() => { setActiveFilter("recent"); setIsFilterOpen(false); }}
                      className={`block w-full px-4 py-2 text-left text-sm transition-colors ${activeFilter === "recent" ? "bg-primary/10 text-primary font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      Plus récents d'abord
                    </button>
                    <button
                      onClick={() => { setActiveFilter("oldest"); setIsFilterOpen(false); }}
                      className={`block w-full px-4 py-2 text-left text-sm transition-colors ${activeFilter === "oldest" ? "bg-primary/10 text-primary font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      Plus anciens d'abord
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="relative px-4 sm:px-6 py-3.5 w-12">
                    <input 
                      type="checkbox" 
                      onChange={handleToggleSelectAll}
                      checked={filteredContacts.length > 0 && selectedContacts.size === filteredContacts.length}
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary sm:left-6 cursor-pointer" 
                    />
                  </th>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Contact</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Téléphone</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tags</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Ajouté le</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-gray-500">
                      Aucun contact trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => (
                    <tr key={contact.id} onClick={() => setViewingContact(contact)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="relative px-4 sm:px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedContacts.has(contact.id)}
                          onChange={() => handleToggleSelectOne(contact.id)}
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary sm:left-6 cursor-pointer" 
                        />
                      </td>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-0">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border border-gray-200">
                              {contact.name ? contact.name.charAt(0) : <User className="w-5 h-5" />}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{contact.name || "Inconnu"}</div>
                            <div className="text-gray-500 text-xs">{contact.email || "-"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-medium">
                        {contact.phone.includes('@lid') ? (
                          <span className="inline-flex items-center gap-1.5 text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Numéro Masqué
                          </span>
                        ) : (
                          contact.phone
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(contact.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block text-left">
                          <button 
                            onClick={() => setActiveDropdownId(activeDropdownId === contact.id ? null : contact.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                          >
                            <span className="sr-only">Options pour {contact.phone}</span>
                            <MoreVertical className="h-5 w-5" />
                          </button>
                          
                          {activeDropdownId === contact.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownId(null)}></div>
                              <div className="absolute right-10 top-1/2 -translate-y-1/2 z-50 w-48 rounded-md bg-white py-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <button
                                  onClick={() => {
                                    setContactToDelete(contact.id);
                                    setActiveDropdownId(null);
                                  }}
                                  className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                                >
                                  Supprimer le contact
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between sm:px-6">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{filteredContacts.length}</span> résultats
              </p>
              {selectedContacts.size > 0 && (
                <span className="text-sm text-primary font-medium bg-primary/10 px-2.5 py-1 rounded-full">
                  {selectedContacts.size} sélectionné(s)
                </span>
              )}
            </div>
            
            {selectedContacts.size > 0 && (
              <button 
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-md bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-100 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Supprimer la sélection
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slide-over View Contact Details */}
      {viewingContact && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setViewingContact(null)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-md transform bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all flex flex-col h-full animate-in slide-in-from-right">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">Détails du contact</h2>
                <button onClick={() => setViewingContact(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-200 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
                  <div className="h-20 w-20 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center border-2 border-primary/20 mb-4">
                    {viewingContact.name ? viewingContact.name.charAt(0) : <User className="w-8 h-8" />}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{viewingContact.name || "Inconnu"}</h3>
                  <p className="text-gray-500 mt-1">{viewingContact.phone.includes('@lid') ? "Numéro protégé par WhatsApp" : viewingContact.phone}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Informations</label>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Nom (Pseudo)</span>
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={viewingContact.name || "Inconnu"}>{viewingContact.name || "Inconnu"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Téléphone</span>
                        <span className="text-sm font-medium text-gray-900 font-mono">
                          {viewingContact.phone.includes('@lid') ? (
                            <span className="inline-flex items-center gap-1.5 text-gray-600">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                              Masqué (LID)
                            </span>
                          ) : viewingContact.phone}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Email</span>
                        <span className="text-sm font-medium text-gray-900">{viewingContact.email || "-"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Ajouté le</span>
                        <span className="text-sm font-medium text-gray-900">{new Date(viewingContact.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6">Groupes / Tags</label>
                    {viewingContact.tags && viewingContact.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {viewingContact.tags.map(tag => (
                          <span key={tag} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Aucun tag pour ce contact.</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2">
                <button
                  onClick={() => openEditModal(viewingContact)}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Modifier
                </button>
                <button
                  onClick={() => {
                    setContactToDelete(viewingContact.id);
                    setViewingContact(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Supprimer
                </button>
                <button
                  onClick={() => setViewingContact(null)}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'ajout/modification de contact */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={closeModal} />
            <div className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <User className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    {editingContact ? "Modifier le contact" : "Nouveau Contact"}
                  </h3>
                  <div className="mt-6 space-y-5 text-left">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom complet</label>
                      <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all sm:text-sm" placeholder="Ex: Jean Dupont" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Numéro WhatsApp <span className="text-red-500">*</span></label>
                      <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all sm:text-sm" placeholder="+237 ..." />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ajouter au groupe</label>
                      <select value={newGroup} onChange={e => setNewGroup(e.target.value)} className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all sm:text-sm bg-white">
                        <option>Aucun</option>
                        {dynamicGroups.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover sm:col-start-2 transition-colors"
                  onClick={handleSaveContact}
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 transition-colors"
                  onClick={closeModal}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation de suppression */}
      {contactToDelete && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setContactToDelete(null)} />
            <div className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">Supprimer le contact</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Êtes-vous sûr de vouloir supprimer ce contact ? Cette action est irréversible et le retirera de toutes vos futures campagnes.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:col-start-2 disabled:opacity-50"
                  onClick={handleDeleteContact}
                >
                  {isDeleting ? "Suppression..." : "Oui, supprimer"}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 disabled:opacity-50"
                  onClick={() => setContactToDelete(null)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation de suppression GROUPÉE */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsBulkDeleteModalOpen(false)} />
            <div className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">Supprimer {selectedContacts.size} contacts ?</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Vous êtes sur le point de supprimer définitivement <strong>{selectedContacts.size} contacts</strong>. Cette action est irréversible.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:col-start-2 disabled:opacity-50"
                  onClick={handleBulkDelete}
                >
                  {isDeleting ? "Suppression..." : "Oui, tout supprimer"}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 disabled:opacity-50"
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'Importation CSV */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsCsvModalOpen(false)} />
            <div className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Upload className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">Importer depuis un fichier</h3>
                  <div className="mt-2 text-sm text-gray-500 space-y-3">
                    <p>
                      Ajoutez des centaines de contacts d'un coup grâce à l'importation de fichier.
                    </p>
                    <div className="bg-gray-50 p-3 rounded-lg text-left text-xs border border-gray-200">
                      <strong>Format requis (CSV) :</strong>
                      <br/>Ligne 1 : Nom, Téléphone
                      <br/>Ligne 2 : Jean Dupont, +237600000000
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center flex flex-col gap-3">
                <label className="inline-flex justify-center w-full rounded-md bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 cursor-pointer transition-colors relative">
                  {isImporting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Importation...
                    </span>
                  ) : (
                    "Sélectionner un fichier .csv"
                  )}
                  <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} disabled={isImporting} />
                </label>
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  onClick={() => setIsCsvModalOpen(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale de création de nouveau groupe */}
      {isAddGroupModalOpen && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsAddGroupModalOpen(false)} />
            <div className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl sm:p-6 flex flex-col max-h-[85vh]">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <Users className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    Créer un nouveau groupe
                  </h3>
                  <div className="mt-6 text-left">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom du groupe <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={newGroupName} 
                      onChange={e => setNewGroupName(e.target.value)} 
                      className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all sm:text-sm mb-6" 
                      placeholder="Ex: Nouveaux Clients Octobre" 
                    />

                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sélectionnez les contacts à ajouter ({groupSelectedContacts.size}) <span className="text-red-500">*</span></label>
                    
                    <div className="border border-gray-200 rounded-lg overflow-y-auto max-h-60 bg-gray-50/50">
                      <ul className="divide-y divide-gray-200">
                        {contacts.length === 0 ? (
                          <li className="px-4 py-4 text-sm text-gray-500 text-center italic">Aucun contact disponible.</li>
                        ) : (
                          contacts.map(contact => (
                            <li key={contact.id} className="px-4 py-3 flex items-center hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => {
                              const newSet = new Set(groupSelectedContacts);
                              if (newSet.has(contact.id)) newSet.delete(contact.id);
                              else newSet.add(contact.id);
                              setGroupSelectedContacts(newSet);
                            }}>
                              <input 
                                type="checkbox" 
                                checked={groupSelectedContacts.has(contact.id)} 
                                onChange={() => {}} 
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-3"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{contact.name || contact.phone}</p>
                                <p className="text-xs text-gray-500 truncate">{contact.phone}</p>
                              </div>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3 shrink-0">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover sm:col-start-2 transition-colors"
                  onClick={handleCreateGroup}
                >
                  Créer le groupe
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 transition-colors"
                  onClick={() => {
                    setIsAddGroupModalOpen(false);
                    setNewGroupName("");
                    setGroupSelectedContacts(new Set());
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'édition de nom de groupe */}
      {isEditGroupModalOpen && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsEditGroupModalOpen(false)} />
            <div className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                  <Pencil className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    Renommer le groupe
                  </h3>
                  <div className="mt-6 text-left">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nouveau nom <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={editedGroupName} 
                      onChange={e => setEditedGroupName(e.target.value)} 
                      className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all sm:text-sm" 
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 sm:col-start-2 transition-colors"
                  onClick={handleEditGroup}
                >
                  Renommer
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 transition-colors"
                  onClick={() => setIsEditGroupModalOpen(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification (Pop-up de succès) */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-5">
          <div className="bg-green-500/20 text-green-400 rounded-full p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium">Contact enregistré avec succès !</p>
        </div>
      )}

      {/* Toast Notification pour Grabber */}
      {grabberToastMsg && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-5">
          <div className="bg-indigo-500/20 text-indigo-400 rounded-full p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium">{grabberToastMsg}</p>
        </div>
      )}

      <GroupGrabberModal 
        isOpen={isGrabberModalOpen} 
        onClose={() => setIsGrabberModalOpen(false)} 
        onSave={async (extractedContacts) => {
          setIsGrabberModalOpen(false);
          
          if (extractedContacts.length === 0) return;
          
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            alert("Erreur: Utilisateur non connecté.");
            return;
          }

          const contactsToInsert = extractedContacts.map((c: any) => ({
            user_id: user.id,
            name: c.name ? c.name : "Contact WhatsApp",
            phone: c.phone,
            tags: c.sourceGroup ? ["WhatsApp Extrait", c.sourceGroup] : ["WhatsApp Extrait"]
          }));

          const { error } = await supabase.from('contacts').insert(contactsToInsert);
          
          if (!error) {
            fetchContacts(); // Recharge la liste
            setGrabberToastMsg(`${contactsToInsert.length} contacts ont été extraits et enregistrés avec succès dans votre répertoire !`);
            setTimeout(() => setGrabberToastMsg(""), 4000);
          } else {
            alert("Erreur lors de la sauvegarde : " + error.message);
          }
        }}
      />
    </div>
  );
}
