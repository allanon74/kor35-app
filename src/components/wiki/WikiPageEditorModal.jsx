import React, { useState, useEffect, useRef } from 'react';
import { getWikiTierList, getWikiImageList, createWikiPage, updateWikiPage, getWikiImageUrl } from '../../api';
import RichTextEditor from '../RichTextEditor';
import { Lock, Eye, GripVertical, Image as ImageIcon } from 'lucide-react'; 

export default function WikiPageEditorModal({ onClose, onSuccess, initialData = null }) {
  const [formData, setFormData] = useState({
    titolo: '',
    slug: '',
    parent: '',
    contenuto: '',
    public: false,
    visibile_solo_staff: false,
    ordine: 0,
    banner_y: 50, // Default centro verticale (0-100)
    ...initialData
  });
  
  // Gestione file immagine
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
      initialData?.immagine ? getWikiImageUrl(initialData.slug) : null
  );

  const isEditing = !!initialData?.id;
  const [loading, setLoading] = useState(false);

  // Widget Helper logic
  const [showWidgetHelper, setShowWidgetHelper] = useState(false);
  const [availableTiers, setAvailableTiers] = useState([]);
  const [availableImages, setAvailableImages] = useState([]);
  const [widgetHelperTab, setWidgetHelperTab] = useState('tier'); // 'tier' o 'image'

  // Dragging Logic
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [initialBannerY, setInitialBannerY] = useState(50);

  // Refs per calcolo visivo
  const previewRef = useRef(null);

  useEffect(() => {
    if (showWidgetHelper) {
        // Carica Tier
        getWikiTierList()
            .then(data => setAvailableTiers(data))
            .catch(err => console.error("Err loading tiers", err));
        
        // Carica Immagini
        getWikiImageList()
            .then(data => setAvailableImages(data))
            .catch(err => console.error("Err loading images", err));
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
          setFormData(prev => ({ ...prev, banner_y: 50 })); 
      }
  };

  // --- GESTIONE DRAG MAIN PREVIEW ---
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartY(e.clientY);
    setInitialBannerY(formData.banner_y || 50);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaY = e.clientY - dragStartY;
    // Sensibilità: più bassa per essere precisi
    const sensitivity = 0.4; 
    
    // NOTA: Se trascino il mouse GIÙ, voglio vedere la parte SOPRA dell'immagine.
    // CSS object-position 0% = Top, 100% = Bottom.
    // Quindi Drag Giù (delta positivo) -> deve diminuire la percentuale.
    let newY = initialBannerY - (deltaY * sensitivity);
    
    // Clamp tra 0 e 100
    if (newY < 0) newY = 0;
    if (newY > 100) newY = 100;
    
    setFormData(prev => ({ ...prev, banner_y: Math.round(newY) }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // --- GESTIONE CLICK SU MINI-MAPPA ---
  const handleMiniMapClick = (e) => {
      // Calcola click relativo alla barra laterale
      const rect = e.currentTarget.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const percentage = (clickY / rect.height) * 100;
      
      // Aggiorna posizione
      setFormData(prev => ({ 
          ...prev, 
          banner_y: Math.max(0, Math.min(100, Math.round(percentage))) 
      }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        const data = new FormData();
        data.append('titolo', formData.titolo);
        data.append('contenuto', formData.contenuto || ''); 
        data.append('public', formData.public);
        data.append('visibile_solo_staff', formData.visibile_solo_staff);
        data.append('ordine', formData.ordine);
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
                    
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Slug URL</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 p-2 rounded bg-gray-50 text-gray-600 text-sm" 
                                value={formData.slug}
                                onChange={e => setFormData({...formData, slug: e.target.value})}
                                placeholder="auto-generato"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Ordine</label>
                            <input 
                                type="number" 
                                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                                value={formData.ordine || 0}
                                onChange={(e) => setFormData({...formData, ordine: parseInt(e.target.value) || 0})}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Immagine con MINI MAPPA */}
                <div className="border rounded-lg p-3 bg-gray-50">
                    <label className="text-xs font-bold text-gray-700 mb-2 flex justify-between items-center">
                        <span>Copertina & Posizionamento</span>
                    </label>
                    
                    <div className="flex gap-2 h-40">
                        {/* A. ANTEPRIMA PRINCIPALE (CROP) */}
                        <div 
                            ref={previewRef}
                            className="flex-1 bg-gray-900 rounded overflow-hidden border border-gray-400 relative group cursor-ns-resize shadow-inner select-none"
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
                                        className="w-full h-full object-cover pointer-events-none"
                                        style={{ objectPosition: `center ${formData.banner_y}%` }} 
                                    />
                                    
                                    {/* GRIGLIA TERZI (Statico, mostra dove cadono gli elementi) */}
                                    <div className="absolute inset-0 pointer-events-none opacity-30">
                                        <div className="w-full h-1/3 border-b border-white absolute top-0"></div>
                                        <div className="w-full h-1/3 border-b border-white absolute top-1/3"></div>
                                        <div className="h-full w-1/3 border-r border-white absolute left-0"></div>
                                        <div className="h-full w-1/3 border-r border-white absolute left-1/3"></div>
                                    </div>

                                    {/* Icona Grip */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <div className="bg-black/50 p-1 rounded-full text-white">
                                            <GripVertical size={20} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1">
                                    <ImageIcon size={24}/>
                                    <span className="text-[10px]">No Img</span>
                                </div>
                            )}
                        </div>

                        {/* B. MINI MAPPA (INTERA) */}
                        <div 
                            className="w-12 bg-gray-200 rounded border border-gray-300 relative overflow-hidden cursor-pointer"
                            onClick={handleMiniMapClick}
                            title="Clicca per posizionare"
                        >
                            {previewUrl && (
                                <>
                                    {/* Immagine intera fittata in verticale */}
                                    <img 
                                        src={previewUrl} 
                                        alt="Minimap" 
                                        className="w-full h-full object-cover opacity-50"
                                    />
                                    
                                    {/* RETTANGOLO SELEZIONE (Il taglio visibile) */}
                                    {/* Nota: Non sapendo l'altezza esatta del viewport rispetto all'immagine, 
                                        usiamo un box di altezza fissa o percentuale approssimativa che si muove */}
                                    <div 
                                        className="absolute w-full h-1/4 border-2 border-yellow-500 bg-yellow-500/20 box-border transition-all duration-75"
                                        style={{ 
                                            // Centriamo il box sulla percentuale scelta
                                            top: `${formData.banner_y}%`, 
                                            transform: 'translateY(-50%)' 
                                        }}
                                    ></div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-3">
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageChange}
                            className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-indigo-100 file:text-indigo-700"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                            Trascina l'immagine a sinistra o clicca sulla barra a destra per regolare il taglio.
                        </p>
                    </div>
                </div>

                {/* 3. Visibilità */}
                <div className="space-y-3 border rounded-lg p-3 bg-gray-50">
                    <label className="block text-xs font-bold text-gray-700">Impostazioni di Visibilità</label>
                    
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
                        <div className="mt-2 bg-white rounded border border-gray-300 shadow-inner">
                            {/* Tab Selector */}
                            <div className="flex border-b border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setWidgetHelperTab('tier')}
                                    className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${
                                        widgetHelperTab === 'tier'
                                            ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    📊 Tier
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWidgetHelperTab('image')}
                                    className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${
                                        widgetHelperTab === 'image'
                                            ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    🖼️ Immagini
                                </button>
                            </div>
                            
                            {/* Content Area */}
                            <div className="max-h-40 md:max-h-60 overflow-y-auto">
                                {widgetHelperTab === 'tier' && (
                                    <>
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
                                    </>
                                )}
                                
                                {widgetHelperTab === 'image' && (
                                    <>
                                        {availableImages.length === 0 && <p className="p-2 text-xs text-gray-500">Caricamento...</p>}
                                        {availableImages.map(img => (
                                            <button 
                                                key={img.id}
                                                type="button"
                                                onClick={() => insertWidget(`{{WIDGET_IMAGE:${img.id}}}`)}
                                                className="w-full text-left text-xs p-2 border-b hover:bg-blue-50 flex justify-between items-center group"
                                            >
                                                <span className="font-bold text-gray-700 group-hover:text-blue-800 truncate pr-2 flex items-center gap-2">
                                                    <ImageIcon size={14} className="text-gray-400" />
                                                    {img.titolo || `Immagine #${img.id}`}
                                                </span>
                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded">ID:{img.id}</span>
                                            </button>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
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