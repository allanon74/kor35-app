import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, ShoppingBag, Loader2 } from 'lucide-react';
import { useShopItems } from '../hooks/useGameData';
import { buyShopItem } from '../api';
import { useCharacter } from './CharacterContext';

const ShopModal = ({ onClose }) => {
  const { data: items, isLoading } = useShopItems();
  const { selectedCharacterData: char, refreshCharacterData } = useCharacter();
  const [buyingId, setBuyingId] = useState(null);

  const handleBuy = async (item) => {
    if (char.crediti < item.costo_acquisto) {
        alert("Crediti insufficienti!");
        return;
    }
    if (!window.confirm(`Acquistare ${item.nome} per ${item.costo_acquisto} CR?`)) return;

    setBuyingId(item.id);
    try {
        await buyShopItem(item.id, char.id);
        await refreshCharacterData(); // Aggiorna crediti e inventario
    } catch (error) {
        alert("Errore acquisto: " + error.message);
    } finally {
        setBuyingId(null);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800/50 rounded-t-xl">
                <Dialog.Title className="text-xl font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="text-yellow-500" />
                    Negozio Base
                </Dialog.Title>
                <div className="flex items-center gap-4">
                    <div className="text-sm font-mono text-yellow-400 bg-yellow-900/20 px-3 py-1 rounded-full border border-yellow-700/30">
                        {char?.crediti || 0} CR
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto grow custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {items?.map((item) => (
                            <div key={item.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex flex-col justify-between hover:border-gray-600 transition-colors">
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-gray-200">{item.nome}</h4>
                                        <span className="text-xs bg-gray-900 px-2 py-0.5 rounded text-gray-400 border border-gray-700">
                                            {item.classe_oggetto_nome || "Oggetto"}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400 mb-3 line-clamp-2" dangerouslySetInnerHTML={{__html: item.testo}} />
                                </div>
                                
                                <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-700/50">
                                    <span className="font-mono font-bold text-yellow-500">{item.costo_acquisto} CR</span>
                                    <button
                                        onClick={() => handleBuy(item)}
                                        disabled={buyingId === item.id || char.crediti < item.costo_acquisto}
                                        className={`px-3 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-all ${
                                            char.crediti >= item.costo_acquisto
                                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                            : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                                        }`}
                                    >
                                        {buyingId === item.id ? <Loader2 className="animate-spin" size={16} /> : "Compra"}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(!items || items.length === 0) && (
                            <div className="col-span-full text-center text-gray-500 py-8">Nessun oggetto in vendita.</div>
                        )}
                    </div>
                )}
            </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ShopModal;