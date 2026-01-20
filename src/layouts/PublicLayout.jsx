import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useCharacter } from '../components/CharacterContext';
import { getWikiMenu } from '../api';
import WikiPageEditorModal from '../components/wiki/WikiPageEditorModal';
import { 
    Menu, X, Search, 
    Folder, FolderOpen, FileText, 
    ChevronRight, ChevronDown, Plus 
} from 'lucide-react';

export default function PublicLayout({ token }) {
  // --- STATI GENERALI ---
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [newParentId, setNewParentId] = useState(null);
  
  // --- STATI DATI & RICERCA ---
  const [flatMenu, setFlatMenu] = useState([]); // Dati grezzi per la ricerca
  const [menuTree, setMenuTree] = useState([]); // Dati strutturati per l'albero
  const [searchTerm, setSearchTerm] = useState(''); // Testo cercato
  const [loadingMenu, setLoadingMenu] = useState(true);

  const { character, isStaff, isMaster } = useCharacter();
  const canEdit = isStaff || isMaster;
  const location = useLocation();

  // --- 1. CARICAMENTO DATI ---
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const flatList = await getWikiMenu();
        setFlatMenu(flatList); 
        // Costruiamo l'albero iniziale
        const tree = buildTree(flatList);
        setMenuTree(tree);
      } catch (error) {
        console.error("Errore caricamento menu:", error);
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchMenu();
  }, []);

  // --- 2. LOGICA DI ORDINAMENTO E COSTRUZIONE ALBERO ---
  const buildTree = (items) => {
    if (!Array.isArray(items)) return [];
    
    // Mappa per riferimenti rapidi
    const map = {};
    const roots = [];
    
    // Inizializza nodi con array figli vuoto
    items.forEach((item) => {
      map[item.id] = { ...item, children: [] };
    });

    // Costruisci gerarchia
    items.forEach((item) => {
      if (item.parent && map[item.parent]) {
        map[item.parent].children.push(map[item.id]);
      } else {
        roots.push(map[item.id]);
      }
    });

    // Funzione di ordinamento: Ordine (numerico) > Titolo (alfabetico)
    const sortNodes = (nodes) => {
        return nodes.sort((a, b) => {
            const ordineA = a.ordine !== undefined ? a.ordine : 999;
            const ordineB = b.ordine !== undefined ? b.ordine : 999;
            
            if (ordineA !== ordineB) return ordineA - ordineB;
            return (a.titolo || "").localeCompare(b.titolo || "");
        });
    };

    // Ordina ricorsivamente
    const sortRecursive = (nodes) => {
        sortNodes(nodes);
        nodes.forEach(node => {
            if (node.children?.length > 0) sortRecursive(node.children);
        });
    };

    sortRecursive(roots);
    return roots;
  };

  // --- 3. RISULTATI DELLA RICERCA ---
  // Se c'è testo, filtra la lista piatta. Usa useMemo per performance.
  const searchResults = useMemo(() => {
      if (!searchTerm) return [];
      return flatMenu.filter(item => 
          item.titolo.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [searchTerm, flatMenu]);

  // --- HELPER NAVIGAZIONE ---
  const getCurrentPageId = () => {
      const path = location.pathname;
      let currentSlug = 'home';
      if (path.startsWith('/regolamento/')) currentSlug = path.split('/')[2];
      const page = flatMenu.find(p => p.slug === currentSlug);
      return page ? page.id : null;
  };

  const handleCreateRoot = () => { setNewParentId(null); setEditorOpen(true); };
  const handleCreateNested = () => { setNewParentId(getCurrentPageId()); setEditorOpen(true); };

  // --- COMPONENTE INTERNO: Voce di Menu (Ricorsiva) ---
  const WikiSidebarItem = ({ item, level = 0 }) => {
    const hasChildren = item.children && item.children.length > 0;
    // La voce è attiva se l'URL corrisponde
    const isActive = location.pathname.includes(item.slug) || (item.slug === 'home' && location.pathname === '/');
    
    // Apri automaticamente se: è attivo, è un livello alto (0), o un figlio è attivo (logica semplificata: teniamo aperti i primi livelli)
    // Nota: per un "auto-open" perfetto sui padri servirebbe controllare ricorsivamente i figli, qui semplifichiamo.
    const [isOpen, setIsOpen] = useState(level === 0 || isActive);

    const handleToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
      <li className="select-none mb-1">
        <div 
            className={`
                group flex items-center gap-2 py-1.5 pr-3 cursor-pointer transition-all rounded-r-md mr-2 text-sm
                ${isActive 
                    ? 'bg-red-900/10 text-red-800 font-bold border-l-4 border-red-800' 
                    : 'text-gray-300 hover:bg-gray-700 border-l-4 border-transparent hover:border-gray-500'}
            `}
            style={{ paddingLeft: `${level * 12 + 12}px` }} // Indentazione dinamica
        >
          {/* Icona Freccia (Solo se ha figli) */}
          <div 
             onClick={hasChildren ? handleToggle : undefined}
             className={`p-1 rounded hover:bg-white/10 ${hasChildren ? 'cursor-pointer' : 'opacity-0'}`}
          >
             {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>

          {/* Icona Cartella/File e Link */}
          <Link 
            to={item.slug === 'home' ? '/' : `/regolamento/${item.slug}`}
            className="flex-1 flex items-center gap-2 truncate"
            onClick={() => setSidebarOpen(false)} // Chiude sidebar su mobile al click
          >
             {hasChildren 
                ? (isOpen ? <FolderOpen size={16} className="text-yellow-500" /> : <Folder size={16} className="text-yellow-500" />)
                : <FileText size={16} className="text-gray-400" />
             }
             <span className="truncate">{item.titolo}</span>
          </Link>
        </div>

        {/* Rendering Ricorsivo dei Figli */}
        {hasChildren && isOpen && (
            <ul className="border-l border-gray-700/50 ml-4"> {/* Linea guida visiva */}
                {item.children.map(child => (
                    <WikiSidebarItem key={child.id} item={child} level={level + 1} />
                ))}
            </ul>
        )}
      </li>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-900 font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="bg-red-900 text-white shadow-md flex items-center justify-between px-4 py-3 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-1 hover:bg-red-800 rounded focus:outline-none"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <Link to="/" className="text-xl font-bold tracking-wider flex items-center gap-2">
            <img src="/Logo Kor-AD_Trasp.png" alt="Logo" className="h-8" />
            <span className="hidden xs:inline">KOR35 WIKI</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {token ? (
            <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block leading-tight">
                    <div className="font-bold text-sm">{character?.nome}</div>
                    <div className="text-xs text-red-200">{isStaff ? 'Staff' : 'Giocatore'}</div>
                </div>
                <Link to="/app" className="bg-white text-red-900 px-3 py-1.5 rounded font-bold hover:bg-gray-100 transition text-sm flex items-center gap-2 shadow-sm">
                  <span>🎮</span> <span className="hidden sm:inline">Entra nel Gioco</span>
                </Link>
            </div>
          ) : (
             !location.pathname.includes('login') && 
             <Link to="/login" className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded text-white transition text-sm font-medium">
                Login
             </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* SIDEBAR */}
        <aside 
          className={`
            absolute inset-y-0 left-0 w-80 bg-gray-800 text-gray-200 
            transform transition-transform duration-300 z-30 shadow-2xl flex flex-col border-r border-gray-700
            md:relative md:translate-x-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* BARRA DI RICERCA */}
          <div className="p-3 bg-gray-900 border-b border-gray-700 sticky top-0 z-10">
              <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                  <input 
                    type="text"
                    placeholder="Cerca pagine..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 text-gray-200 text-sm rounded-md pl-9 pr-8 py-2 border border-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder-gray-500"
                  />
                  {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-2 text-gray-500 hover:text-white"
                      >
                          <X size={16} />
                      </button>
                  )}
              </div>
          </div>

          {/* CONTENUTO MENU (Scrollable) */}
          <nav className="overflow-y-auto flex-1 pb-20 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
             {loadingMenu ? (
               <div className="p-6 text-center text-gray-500 text-sm animate-pulse">Caricamento indice...</div>
             ) : (
               <>
                 {/* MODALITA' RICERCA */}
                 {searchTerm ? (
                    <ul className="py-2">
                        {searchResults.length === 0 ? (
                            <li className="p-4 text-gray-500 text-sm text-center">Nessun risultato trovato.</li>
                        ) : (
                            searchResults.map(item => (
                                <li key={item.id}>
                                    <Link 
                                        to={item.slug === 'home' ? '/' : `/regolamento/${item.slug}`}
                                        className="block px-4 py-3 hover:bg-gray-700 border-b border-gray-700/50 transition-colors text-sm"
                                        onClick={() => {
                                            setSidebarOpen(false);
                                            // Opzionale: pulire la ricerca dopo il click
                                            // setSearchTerm('');
                                        }}
                                    >
                                        <div className="font-bold text-gray-200 highlight-match">{item.titolo}</div>
                                        {item.parent && (
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                in {flatMenu.find(p => p.id === item.parent)?.titolo || '...'}
                                            </div>
                                        )}
                                    </Link>
                                </li>
                            ))
                        )}
                    </ul>
                 ) : (
                    /* MODALITA' ALBERO */
                    <ul className="py-2">
                        {menuTree.map(node => <WikiSidebarItem key={node.id} item={node} />)}
                    </ul>
                 )}
               </>
             )}
          </nav>

          {/* BOTTONE "NUOVA PAGINA ROOT" (Sticky Bottom in Sidebar) */}
          {canEdit && !searchTerm && (
             <div className="p-3 border-t border-gray-700 bg-gray-900">
                <button 
                    onClick={handleCreateRoot}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-2 transition border border-gray-600"
                >
                    <Plus size={14} /> Nuova Pagina Principale
                </button>
             </div>
          )}
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 relative scroll-smooth w-full">
          <Outlet />
          
          {/* FAB: AGGIUNGI SOTTO-PAGINA (Solo Staff) */}
          {canEdit && (
            <button 
                onClick={handleCreateNested}
                className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-red-700 hover:bg-red-800 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl z-40 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95"
                title="Aggiungi Sotto-Pagina qui"
            >
                <Plus size={32} />
            </button>
          )}
        </main>

        {/* Overlay Mobile per chiudere sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

      </div>

      {/* MODALE EDITOR */}
      {isEditorOpen && (
        <WikiPageEditorModal 
            initialData={{ parent: newParentId }} 
            onClose={() => setEditorOpen(false)} 
            onSuccess={(newSlug) => {
                setEditorOpen(false);
                window.location.href = newSlug ? `/regolamento/${newSlug}` : '/';
            }}
        />
      )}

    </div>
  );
}