import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WikiRenderer from '../components/WikiRenderer';
import WikiPageEditorModal from '../components/wiki/WikiPageEditorModal'; // Importiamo il modale
import { getWikiPage } from '../api';
import { useCharacter } from '../components/CharacterContext'; // Per i permessi

export default function WikiPage({ slug: propSlug }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const currentSlug = propSlug || slug || 'home'; 
  
  // Recuperiamo i permessi
  // Nota: controlliamo isStaff all'interno del token/context
  const { isStaff, isMaster } = useCharacter(); 
  const canEdit = isStaff || isMaster; // Definisci chi può editare

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stato per il modale di modifica
  const [isEditorOpen, setEditorOpen] = useState(false);

  // Funzione di caricamento (estratta per poter ricaricare dopo l'edit)
  const fetchPage = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWikiPage(currentSlug);
      setPageData(data);
    } catch (err) {
      console.error("Errore fetch pagina:", err);
      setError("Pagina non trovata.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage();
  }, [currentSlug]);

  const handleEditSuccess = (newSlug) => {
      setEditorOpen(false);
      // Se lo slug è cambiato, navighiamo alla nuova URL
      if (newSlug && newSlug !== currentSlug) {
          navigate(`/regolamento/${newSlug}`);
      } else {
          // Altrimenti ricarichiamo i dati della pagina corrente
          fetchPage();
      }
  };

  if (loading) return <div className="p-10 text-center text-gray-500 animate-pulse">Caricamento contenuto...</div>;

  if (error || !pageData) {
    return (
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-2">404 - Pagina non trovata</h2>
            <p className="text-gray-500 mb-4">{error}</p>
            {/* Se siamo staff, offriamo di creare la pagina qui */}
            {canEdit && (
                <button 
                    onClick={() => setEditorOpen(true)}
                    className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800"
                >
                    Crea pagina "{currentSlug}"
                </button>
            )}
            
            {/* Modale Creazione su 404 */}
            {isEditorOpen && (
                <WikiPageEditorModal 
                    initialData={{ title: currentSlug, slug: currentSlug }}
                    onClose={() => setEditorOpen(false)}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto bg-white min-h-screen shadow-sm md:rounded-lg overflow-hidden relative group">
        
        {/* PULSANTE MODIFICA (Visibile solo a Staff/Master) */}
        {canEdit && (
            <div className="absolute top-4 right-4 z-10 opacity-30 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => setEditorOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 font-bold text-sm"
                >
                    ✏️ Modifica Pagina
                </button>
            </div>
        )}

        {/* Immagine Copertina */}
        {pageData.immagine && (
            <div className="w-full h-48 md:h-64 overflow-hidden relative">
                <img src={pageData.immagine} alt={pageData.titolo} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <h1 className="absolute bottom-4 left-4 text-3xl md:text-5xl font-bold text-white drop-shadow-lg">{pageData.titolo}</h1>
            </div>
        )}

        <div className="p-6 md:p-10">
            {/* Titolo se non c'è immagine */}
            {!pageData.immagine && (
                <h1 className="text-3xl md:text-4xl font-bold mb-8 text-red-900 border-b pb-4 flex justify-between items-center">
                    {pageData.titolo}
                </h1>
            )}
            
            {/* Contenuto */}
            <WikiRenderer content={pageData.contenuto} />
        </div>

        {/* MODALE EDITOR */}
        {isEditorOpen && (
            <WikiPageEditorModal 
                initialData={pageData} // Passiamo i dati attuali per popolare il form
                onClose={() => setEditorOpen(false)}
                onSuccess={handleEditSuccess}
            />
        )}
    </div>
  );
}