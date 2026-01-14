import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useCharacter } from '../components/CharacterContext';
import { getWikiMenu } from '../api';
import WikiPageEditorModal from '../components/wiki/WikiPageEditorModal';

export default function PublicLayout({ token }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // Gestione stato del Modale Editor
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [newParentId, setNewParentId] = useState(null); // Per memorizzare il parent scelto

  const { character, isStaff, isMaster } = useCharacter();
  const canEdit = isStaff || isMaster;

  const location = useLocation();
  
  // Stato per il menu (Albero e Lista Piatta)
  const [menuTree, setMenuTree] = useState([]);
  const [flatMenu, setFlatMenu] = useState([]); // Memorizziamo anche la lista piatta per ricerche
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Caricamento Menu
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const flatList = await getWikiMenu();
        setFlatMenu(flatList); // Salviamo la lista grezza
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

  const buildTree = (items) => {
    if (!Array.isArray(items)) return [];
    // Clona gli oggetti per evitare mutazioni sulla flatList originale
    const map = {};
    const roots = [];
    
    // Inizializza mappa
    items.forEach((item) => {
      map[item.id] = { ...item, children: [] };
    });

    // Collega i nodi
    items.forEach((item) => {
      if (item.parent) {
        if (map[item.parent]) {
          map[item.parent].children.push(map[item.id]);
        }
      } else {
        roots.push(map[item.id]);
      }
    });
    return roots;
  };

  // Funzione per trovare l'ID della pagina corrente basandosi sull'URL
  const getCurrentPageId = () => {
      const path = location.pathname;
      let currentSlug = '';
      
      if (path === '/') {
          currentSlug = 'home';
      } else if (path.startsWith('/regolamento/')) {
          // Estrae lo slug dall'URL: /regolamento/pippo -> pippo
          currentSlug = path.split('/')[2];
      }

      // Cerca nella lista piatta
      const page = flatMenu.find(p => p.slug === currentSlug);
      return page ? page.id : null;
  };

  // Apre modale per NUOVA PAGINA ROOT (dal menu laterale)
  const handleCreateRoot = () => {
      setNewParentId(null); // Nessun genitore
      setEditorOpen(true);
  };

  // Apre modale per SOTTO-PAGINA (dal bottone +)
  const handleCreateNested = () => {
      const parentId = getCurrentPageId();
      setNewParentId(parentId); // Imposta il genitore corrente
      setEditorOpen(true);
  };

  const MenuItem = ({ item }) => (
    <li>
      <Link 
        to={item.slug === 'home' ? '/' : `/regolamento/${item.slug}`}
        className={`block px-4 py-2 hover:bg-gray-700 border-b border-gray-700 transition-colors text-sm ${
           location.pathname.includes(item.slug) ? 'bg-gray-700 text-white font-bold' : 'text-gray-300'
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        {item.titolo}
      </Link>
      {item.children && item.children.length > 0 && (
        <ul className="pl-4 bg-gray-900 bg-opacity-30 border-l border-gray-600">
          {item.children.map(child => <MenuItem key={child.id} item={child} />)}
        </ul>
      )}
    </li>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-900 font-sans">
      
      {/* HEADER */}
      <header className="bg-red-900 text-white shadow-md flex items-center justify-between px-4 py-3 z-20 relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="md:hidden text-2xl focus:outline-none"
          >
            ☰
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
                <Link 
                  to="/app" 
                  className="bg-white text-red-900 px-3 py-1 rounded font-bold hover:bg-gray-200 transition text-sm flex items-center gap-1"
                >
                  <span>🎮</span> <span className="hidden sm:inline">Entra nel Gioco</span>
                </Link>
            </div>
          ) : (
             !location.pathname.includes('login') && 
             <Link to="/login" className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded text-white transition text-sm">
                Login
             </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* SIDEBAR (Menu Regolamento) */}
        <aside 
          className={`
            absolute inset-y-0 left-0 w-72 bg-gray-800 text-gray-200 transform transition-transform duration-300 z-30 shadow-xl flex flex-col
            md:relative md:translate-x-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="p-4 font-bold text-gray-400 uppercase text-xs tracking-widest border-b border-gray-700 flex justify-between items-center bg-gray-900">
            <span>Indice</span>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-lg">✕</button>
          </div>

          {/* BOTTONE CREA ROOT (Solo Staff) */}
          {canEdit && (
             <div className="p-2 border-b border-gray-700 bg-gray-800">
                <button 
                    onClick={handleCreateRoot}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded flex items-center justify-center gap-2 transition"
                >
                    <span>📄</span> Nuova Pagina Principale
                </button>
             </div>
          )}
          
          <nav className="overflow-y-auto flex-1 pb-20 scrollbar-thin scrollbar-thumb-gray-600">
            {loadingMenu ? (
               <div className="p-4 text-gray-400 text-sm animate-pulse">Caricamento indice...</div>
            ) : (
               <ul>
                 {menuTree.map(node => <MenuItem key={node.id} item={node} />)}
               </ul>
            )}
          </nav>
        </aside>

        {/* CONTENUTO PRINCIPALE */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 md:m-0 scroll-smooth relative">
          <Outlet />
          
          {/* --- BOTTONE GALLEGGIANTE 'AGGIUNGI SOTTO-PAGINA' (Solo Staff) --- */}
          {canEdit && (
            <button 
                onClick={handleCreateNested}
                className="fixed bottom-8 right-8 bg-red-700 hover:bg-red-800 text-white w-14 h-14 rounded-full shadow-2xl z-50 flex items-center justify-center text-3xl transition transform hover:scale-110"
                title="Crea Sotto-Pagina qui"
            >
                <span className="relative top-0.5">+</span>
            </button>
          )}
        </main>

        {/* Overlay Mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

      </div>

      {/* --- MODALE EDITOR --- */}
      {isEditorOpen && (
        <WikiPageEditorModal 
            // Passiamo il parent ID calcolato (null per Root, ID per Nested)
            initialData={{ parent: newParentId }} 
            onClose={() => setEditorOpen(false)} 
            onSuccess={(newSlug) => {
                setEditorOpen(false);
                // Ricarichiamo la pagina per aggiornare menu e contenuto
                window.location.href = newSlug ? `/regolamento/${newSlug}` : '/';
            }}
        />
      )}

    </div>
  );
}