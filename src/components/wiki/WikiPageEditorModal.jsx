import React, { useState, useEffect } from 'react';
import { getWikiTierList, createWikiPage, updateWikiPage, getWikiImageUrl } from '../../api';
import RichTextEditor from '../RichTextEditor';
import { Lock, Eye } from 'lucide-react'; // Assicurati di avere queste icone o rimuovile se non usi lucide

export default function WikiPageEditorModal({ onClose, onSuccess, initialData = null }) {
  const [formData, setFormData] = useState({
    titolo: '',
    slug: '',
    parent: '',
    contenuto: '',
    public: false,
    visibile_solo_staff: false, // <--- NUOVO CAMPO
    ordine: 0,
    banner_y: 50,
    ...initialData
  });

    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [initialBannerY, setInitialBannerY] = useState(50);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStartY(e.clientY);
        setInitialBannerY(formData.banner_y);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const deltaY = e.clientY - dragStartY;
        // Sensibilità del drag: dividiamo per un fattore (es. 2 o 3) per renderlo più controllabile
        // Il segno meno o più dipende da come "senti" lo spostamento. 
        // Spostare il mouse GIÙ dovrebbe mostrare la parte ALTA dell'immagine (quindi decrementare object-position?)
        // Standard CSS object-position: 0% = Top, 100% = Bottom.
        // Se trascino giù, voglio vedere la parte sopra, quindi devo abbassare la percentuale? No, è visivo.
        // Facciamo un calcolo diretto della percentuale.
        
        // Simplificazione: 1px di mouse = 0.5% di spostamento
        const sensitivity = 0.5; 
        let newY = initialBannerY - (deltaY * sensitivity);
        
        // Clamp tra 0 e 100
        if (newY < 0) newY = 0;
        if (newY > 100) newY = 100;
        
        setFormData(prev => ({ ...prev, banner_y: Math.round(newY) }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };
  
  // Gestione file immagine
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initialData?.immagine ? getWikiImageUrl(initialData.slug) : null);

  const isEditing = !!initialData?.id;
  const [loading, setLoading] = useState(false);

  // Widget Helper logic
  const [showWidgetHelper, setShowWidgetHelper] = useState(false);
  const [availableTiers, setAvailableTiers] = useState([]);

  useEffect(() => {
    if (showWidgetHelper) {
        getWikiTierList()
            .then(data => setAvailableTiers(data))
            .catch(err => console.error("Err loading tiers", err));
    }
  }, [showWidgetHelper]);

  const insertWidget = (code) => {
    const widgetHtml = `<p><strong>${code}</strong></p><p>&nbsp;</p>`;
    setFormData(prev => ({
        ...prev,
        contenuto: (prev.contenuto || '') + widgetHtml
    }));
    setShowWidgetHelper(false);
  };

  const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          setImageFile(file);
          setPreviewUrl(URL.createObjectURL(file));
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        const data = new FormData();
        data.append('titolo', formData.titolo);
        data.append('contenuto', formData.contenuto || ''); 
        data.append('public', formData.public);
        data.append('visibile_solo_staff', formData.visibile_solo_staff); // <--- INVIO AL BACKEND
        data.append('ordine', formData.ordine); // Assicuriamoci che l'ordine sia inviato
        data.append('banner_y', formData.banner_y);

        if (formData.slug) data.append('slug', formData.slug);
        if (formData.parent) data.append('parent', formData.parent);
        
        if (imageFile) {
            data.append('immagine', imageFile);
        }

        let response;
        if (isEditing) {
             response = await updateWikiPage(initialData.id, data);
        } else {
             response = await createWikiPage(data);
        }

        // Se la risposta contiene i dati aggiornati (es. slug), li usiamo
        const newSlug = response.slug || formData.slug; 
        onSuccess(newSlug);

    } catch (error) {
        console.error("Errore salvataggio:", error);
        alert("Errore durante il salvataggio. Controlla la console.");
    } finally {
        setLoading(false);
    }
  };

  return (
    // CONTENITORE PRINCIPALE
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-0 md:p-4">
      <div className="bg-white md:rounded-lg shadow-xl w-full max-w-6xl h-full md:h-auto md:max-h-[95vh] flex flex-col">
        
        {/* HEADER */}
        <div className="p-3 md:p-4 border-b flex justify-between items-center bg-gray-100 md:rounded-t-lg shrink-0">
            <h2 className="font-bold text-lg md:text-xl text-gray-800 flex items-center gap-2 truncate">
                {isEditing ? '✏️ Modifica Pagina' : '📄 Nuova Pagina Wiki'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-red-600 font-bold text-xl px-2">✕</button>
        </div>

        {/* BODY SCROLLABILE */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
            
            {/* COLONNA SINISTRA: IMPOSTAZIONI */}
            <div className="w-full md:w-1/3 space-y-6">
                
                {/* 1. Titolo e Slug */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Titolo Pagina</label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                            value={formData.titolo}
                            onChange={e => setFormData({...formData, titolo: e.target.value})}
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Slug URL <span className="font-normal text-gray-400 text-xs">(Opzionale)</span></label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 p-2 rounded bg-gray-50 text-gray-600 text-sm" 
                            value={formData.slug}
                            onChange={e => setFormData({...formData, slug: e.target.value})}
                            placeholder="es: combattimento-avanzato"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            Ordine nel Menu
                        </label>
                        <input 
                            type="number" 
                            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.ordine || 0}
                            onChange={(e) => setFormData({...formData, ordine: parseInt(e.target.value) || 0})}
                            placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Minore è il numero, più in alto appare (es. 0, 10, 20).
                        </p>
                    </div>
                </div>

                {/* 2. Immagine di Copertina e Posizionamento */} 

                <div className="border rounded-lg p-3 bg-gray-50">
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                        Copertina e Posizionamento 
                        <span className="font-normal text-gray-500 ml-2">(Trascina l'immagine per centrarla)</span>
                    </label>
                    
                    <div className="space-y-3">
                        {/* AREA PREVIEW INTERATTIVA */}
                        <div 
                            className="w-full h-32 md:h-48 bg-gray-900 rounded overflow-hidden border border-gray-300 relative group cursor-ns-resize"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            {previewUrl ? (
                                <>
                                    <img 
                                        src={previewUrl} 
                                        alt="Anteprima" 
                                        className="w-full h-full object-cover transition-none select-none pointer-events-none"
                                        style={{ objectPosition: `center ${formData.banner_y}%` }} 
                                    />
                                    {/* Overlay suggerimento */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">
                                            ↕ Trascina per spostare ({formData.banner_y}%)
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                    Nessuna Immagine
                                </div>
                            )}
                        </div>

                        {/* INPUT FILE */}
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageChange}
                            className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-indigo-100 file:text-indigo-700"
                        />
                    </div>
                </div>

                {/* 3. Visibilità (AGGIORNATA) */}
                <div className="space-y-3 border rounded-lg p-3 bg-gray-50">
                    <label className="block text-xs font-bold text-gray-700">Impostazioni di Visibilità</label>
                    
                    {/* Checkbox Pubblica */}
                    <div className={`flex items-center gap-3 p-2 rounded border transition-colors ${formData.public ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200'}`}>
                        <input 
                            type="checkbox" 
                            id="is_public"
                            className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                            checked={formData.public} 
                            onChange={e => setFormData({...formData, public: e.target.checked})}
                        />
                        <label htmlFor="is_public" className="text-sm font-bold text-gray-800 cursor-pointer flex items-center gap-2">
                            <Eye size={16} className="text-gray-500"/> Pubblica Online
                        </label>
                    </div>

                    {/* Checkbox Staff Only */}
                    <div className={`flex items-center gap-3 p-2 rounded border transition-colors ${formData.visibile_solo_staff ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200'}`}>
                        <input 
                            type="checkbox" 
                            id="is_staff"
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            checked={formData.visibile_solo_staff} 
                            onChange={e => setFormData({...formData, visibile_solo_staff: e.target.checked})}
                        />
                        <label htmlFor="is_staff" className="text-sm font-bold text-indigo-900 cursor-pointer flex items-center gap-2">
                            <Lock size={16} /> Visibile solo allo Staff
                        </label>
                    </div>
                    
                    <p className="text-[10px] text-gray-500 leading-tight">
                        Nota: Se "Solo Staff" è attivo, i giocatori non vedranno la pagina anche se "Pubblica" è selezionato.
                    </p>
                </div>

                {/* 4. Widget Helper */}
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <button 
                        type="button"
                        onClick={() => setShowWidgetHelper(!showWidgetHelper)}
                        className="w-full bg-blue-600 text-white px-3 py-2 rounded text-xs hover:bg-blue-700 transition flex justify-between items-center"
                    >
                        <span>🧩 Inserisci Widget</span>
                        <span>{showWidgetHelper ? '▲' : '▼'}</span>
                    </button>
                    
                    {showWidgetHelper && (
                        <div className="mt-2 max-h-40 md:max-h-60 overflow-y-auto bg-white rounded border border-gray-300 shadow-inner">
                            {availableTiers.length === 0 && <p className="p-2 text-xs text-gray-500">Caricamento...</p>}
                            
                            {availableTiers.map(tier => (
                                <button 
                                    key={tier.id}
                                    type="button"
                                    onClick={() => insertWidget(`{{WIDGET_TIER:${tier.id}}}`)}
                                    className="w-full text-left text-xs p-2 border-b hover:bg-blue-50 flex justify-between items-center group"
                                >
                                    <span className="font-bold text-gray-700 group-hover:text-blue-800 truncate pr-2">{tier.nome}</span>
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded">ID:{tier.id}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <p className="text-[10px] text-gray-500 mt-2 leading-tight">
                        Cliccando su un widget, verrà aggiunto in fondo all'editor.
                    </p>
                </div>
            </div>

            {/* COLONNA DESTRA: EDITOR */}
            <div className="w-full md:w-2/3 flex flex-col min-h-[400px]">
                <label className="block text-xs font-bold text-gray-700 mb-2">Contenuto Pagina</label>
                
                <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <RichTextEditor 
                        value={formData.contenuto} 
                        onChange={(newContent) => setFormData({...formData, contenuto: newContent})}
                        placeholder="Scrivi qui il contenuto della pagina..."
                        className="h-full min-h-[300px]"
                    />
                </div>
            </div>

        </div>

        {/* FOOTER AZIONI */}
        <div className="p-3 md:p-4 border-t bg-gray-50 md:rounded-b-lg flex justify-end gap-3 shrink-0">
            <button 
                onClick={onClose} 
                disabled={loading}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded font-medium disabled:opacity-50"
            >
                Annulla
            </button>
            <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-5 py-2 text-sm bg-red-700 text-white font-bold rounded hover:bg-red-800 shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {loading && <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>}
                {isEditing ? 'Salva Modifiche' : 'Crea Pagina'}
            </button>
        </div>

      </div>
    </div>
  );
}