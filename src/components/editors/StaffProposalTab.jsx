import React, { useState, useEffect } from 'react';
import { getProposteInValutazione, rifiutaProposta, approvaProposta } from '../../api';
import GenericHeader from '../GenericHeader';
import { Eye, X, Check } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
// Importiamo gli editor esistenti per riutilizzarli nel modale di approvazione
import InfusioneEditor from './InfusioneEditor';
import TessituraEditor from './TessituraEditor';
import CerimonialeEditor from './CerimonialeEditor';

const StaffProposalTab = () => {
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [staffNotes, setStaffNotes] = useState("");
  
  // Refresh data
  const loadProposals = async () => {
    try {
      const data = await getProposteInValutazione();
      // Se l'API ritorna paginazione, gestisci data.results, altrimenti data
      setProposals(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error("Errore caricamento proposte", error);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const handleOpen = (prop) => {
    setSelectedProposal(prop);
    setStaffNotes(prop.note_staff || "");
    setIsRejecting(false);
    setIsApproving(false);
  };

  const handleClose = () => {
    setSelectedProposal(null);
    setIsApproving(false);
  };

  const handleReject = async () => {
    if (!selectedProposal) return;
    if (!confirm("Sei sicuro di voler rifiutare questa proposta? Tornerà in bozza al giocatore.")) return;
    
    try {
      await rifiutaProposta(selectedProposal.id, staffNotes);
      alert("Proposta rifiutata.");
      handleClose();
      loadProposals();
    } catch (err) {
      alert("Errore: " + err.message);
    }
  };

  // Prepara i dati per l'editor di approvazione
  const getInitialDataForEditor = () => {
    if (!selectedProposal) return {};
    
    // Mappa i campi comuni dalla proposta alla struttura richiesta dagli editor
    return {
      nome: selectedProposal.nome,
      descrizione: selectedProposal.descrizione, // Gli editor spesso usano 'testo' o 'descrizione'
      testo: selectedProposal.descrizione, 
      aura_richiesta: selectedProposal.aura, // ID o Oggetto a seconda di come lo gestisce l'editor
      componenti: selectedProposal.componenti, // Array di {caratteristica, valore}
      // Campi specifici da passare se presenti nella proposta o default
      prerequisiti: selectedProposal.prerequisiti,
      svolgimento: selectedProposal.svolgimento,
      effetto: selectedProposal.effetto,
      liv: selectedProposal.livello_proposto,
      note_staff: staffNotes // Passiamo le note editate
    };
  };

  // Callback per quando lo staff salva dal form di creazione (Approvazione finale)
  const onFinalizeApproval = async (finalData) => {
    try {
      // Includiamo le note staff nel payload finale
      finalData.note_staff = staffNotes;
      await approvaProposta(selectedProposal.id, finalData);
      alert("Tecnica creata e assegnata con successo!");
      handleClose();
      loadProposals();
    } catch (err) {
      console.error(err);
      alert("Errore durante l'approvazione: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="text-white p-4">
      <GenericHeader title="Valutazione Proposte Tecniche" />
      
      {/* LISTA PROPOSTE */}
      <div className="overflow-x-auto bg-gray-900 rounded-lg border border-gray-700 mt-4">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-800">
            <tr>
              <th className="px-4 py-3">Personaggio</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Nome Tecnica</th>
              <th className="px-4 py-3">Aura</th>
              <th className="px-4 py-3">Data Invio</th>
              <th className="px-4 py-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {proposals.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-4">Nessuna proposta in attesa.</td></tr>
            ) : (
              proposals.map((prop) => (
                <tr key={prop.id} className="border-b border-gray-700 hover:bg-gray-800">
                  <td className="px-4 py-3 font-medium text-white">
                    {/* Gestione oggetto personaggio o ID */}
                    {typeof prop.personaggio === 'object' ? prop.personaggio.nome : prop.personaggio}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold 
                      ${prop.tipo === 'INF' ? 'bg-blue-900 text-blue-200' : 
                        prop.tipo === 'TES' ? 'bg-purple-900 text-purple-200' : 'bg-yellow-900 text-yellow-200'}`}>
                      {prop.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3">{prop.nome}</td>
                  <td className="px-4 py-3">
                     {/* Gestione oggetto aura o ID - assumiamo che il serializer restituisca l'oggetto o il nome */}
                     {prop.aura_nome || (typeof prop.aura === 'object' ? prop.aura.nome : prop.aura)}
                  </td>
                  <td className="px-4 py-3">{new Date(prop.data_invio).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => handleOpen(prop)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded flex items-center gap-1 ml-auto"
                    >
                      <Eye size={14} /> Valuta
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODALE DI VALUTAZIONE */}
      {selectedProposal && !isApproving && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-600 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            
            {/* Header Modale */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
              <h2 className="text-xl font-bold text-cyan-400">
                Valutazione: {selectedProposal.nome} ({selectedProposal.tipo})
              </h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {/* Body Modale */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Dettagli Proposta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded border border-gray-700">
                  <h3 className="text-sm uppercase text-gray-500 font-bold mb-2">Dati Tecnici</h3>
                  <p><strong>Livello Calcolato:</strong> {selectedProposal.livello}</p>
                  <p><strong>Aura:</strong> {typeof selectedProposal.aura === 'object' ? selectedProposal.aura.nome : selectedProposal.aura}</p>
                  {selectedProposal.tipo === 'CER' && (
                     <p><strong>Livello Proposto:</strong> {selectedProposal.livello_proposto}</p>
                  )}
                  {/* Lista Componenti/Mattoni */}
                  <div className="mt-2">
                    <strong>Componenti:</strong>
                    <ul className="list-disc pl-5 text-sm text-gray-300 mt-1">
                      {selectedProposal.componenti && selectedProposal.componenti.map((c, idx) => (
                        <li key={idx}>
                           {/* Gestione struttura dati componenti (potrebbe variare in base al serializer) */}
                           {c.caratteristica_nome || c.caratteristica} : {c.valore}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded border border-gray-700">
                  <h3 className="text-sm uppercase text-gray-500 font-bold mb-2">Descrizione Giocatore</h3>
                  <div className="prose prose-invert max-w-none text-sm" 
                       dangerouslySetInnerHTML={{ __html: selectedProposal.descrizione }} />
                  
                  {selectedProposal.tipo === 'CER' && (
                    <div className="mt-4 space-y-2 text-sm">
                        <p><strong>Prerequisiti:</strong> {selectedProposal.prerequisiti}</p>
                        <p><strong>Svolgimento:</strong> {selectedProposal.svolgimento}</p>
                        <p><strong>Effetto:</strong> {selectedProposal.effetto}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Note Staff Editabili */}
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Note Staff (Visibili al giocatore)</label>
                <RichTextEditor 
                  value={staffNotes} 
                  onChange={setStaffNotes}
                  placeholder="Inserisci qui le motivazioni del rifiuto o note di approvazione..."
                />
              </div>

            </div>

            {/* Footer Azioni */}
            <div className="p-4 border-t border-gray-700 bg-gray-800 flex justify-end gap-3">
              <button 
                onClick={handleReject}
                className="bg-red-900/50 border border-red-700 text-red-200 hover:bg-red-800 px-4 py-2 rounded flex items-center gap-2"
              >
                <X size={18} /> Rifiuta e Invia Note
              </button>
              
              <button 
                onClick={() => setIsApproving(true)}
                className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 font-bold shadow-lg shadow-green-900/20"
              >
                <Check size={18} /> Procedi all'Approvazione
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE APPROVAZIONE (EDITOR SPECIFICO) */}
      {selectedProposal && isApproving && (
        <div className="fixed inset-0 bg-black z-60 overflow-y-auto">
           {/* Wrapper per riutilizzare gli editor esistenti a schermo intero */}
           <div className="p-4">
              <div className="flex justify-between items-center mb-4 bg-gray-800 p-3 rounded">
                  <h2 className="text-xl font-bold text-green-400">Finalizzazione {selectedProposal.tipo}</h2>
                  <button onClick={() => setIsApproving(false)} className="bg-gray-700 px-3 py-1 rounded">Annulla</button>
              </div>
              
              {selectedProposal.tipo === 'INF' && (
                <InfusioneEditor 
                  initialData={getInitialDataForEditor()} 
                  onSave={onFinalizeApproval} 
                  onCancel={() => setIsApproving(false)}
                  isApprovalMode={true} // Prop opzionale per dire all'editor di nascondere cose inutili se serve
                />
              )}
              
              {selectedProposal.tipo === 'TES' && (
                <TessituraEditor 
                  initialData={getInitialDataForEditor()} 
                  onSave={onFinalizeApproval} 
                  onCancel={() => setIsApproving(false)}
                  isApprovalMode={true}
                />
              )}

              {selectedProposal.tipo === 'CER' && (
                <CerimonialeEditor 
                  initialData={getInitialDataForEditor()} 
                  onSave={onFinalizeApproval} 
                  onCancel={() => setIsApproving(false)}
                  isApprovalMode={true}
                />
              )}
           </div>
        </div>
      )}

    </div>
  );
};

export default StaffProposalTab;