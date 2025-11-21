import React from 'react';
import { useCharacter } from './CharacterContext';
import GenericGroupedList from './GenericGroupedList';
import { ScrollText, Coins, Dna } from 'lucide-react'; // Icone opzionali per abbellire (o usa le tue)

const HomeTab = () => {
  const { character, loading, error } = useCharacter();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">
        <p>Errore nel caricamento del personaggio.</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!character) return null;

  // --- Render Item per le Abilità ---
  // Definisce come appare ogni singola riga dell'abilità dentro la lista
  const renderAbilitaItem = (abilita) => (
    <li className="flex justify-between items-center py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-sm cursor-default">
      <div className="flex flex-col">
        <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
          {abilita.nome}
        </span>
        {/* Opzionale: Mostra costo se vuoi renderlo visibile */}
        {/* <span className="text-[10px] text-gray-400">Cost: {abilita.costo_pc} PC</span> */}
      </div>
      
      {/* Esempio: Icona info o altro (opzionale) */}
      {/* <Info className="w-3 h-3 text-gray-300" /> */}
    </li>
  );

  // --- Render Item per l'Inventario (Bonus: riutilizziamo GenericGroupedList!) ---
  // Raggruppiamo per "Aura" se presente, altrimenti finisce in "Altro"
  const renderOggettoItem = (oggetto) => (
    <li className="flex justify-between items-center py-2 px-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <div className="flex flex-col">
            <span className="font-semibold text-sm">{oggetto.nome}</span>
            <span className="text-xs text-gray-500">Liv. {oggetto.livello}</span>
        </div>
        {oggetto.statistiche && oggetto.statistiche.length > 0 && (
            <div className="flex gap-1">
                {oggetto.statistiche.map((stat, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded text-gray-600">
                        {stat.statistica.sigla} {stat.valore > 0 ? '+' : ''}{stat.valore}
                    </span>
                ))}
            </div>
        )}
    </li>
  );

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto pb-20">
      
      {/* --- HEADER PERSONAGGIO --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 text-center">
        <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full mb-4 overflow-hidden ring-4 ring-white shadow-lg">
            {/* Placeholder Avatar - Sostituire con immagine reale se disponibile */}
            <img 
                src={`https://ui-avatars.com/api/?name=${character.nome}&background=1976D2&color=fff&size=128`} 
                alt={character.nome} 
                className="w-full h-full object-cover"
            />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{character.nome}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider font-semibold">
            {character.tipologia ? character.tipologia.nome : 'Nessuna Tipologia'}
        </p>
        
        {/* STATISTICHE RAPIDE */}
        <div className="flex justify-center gap-6 mt-6">
            <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg min-w-20">
                <Coins className="w-5 h-5 text-blue-600 mb-1" />
                <span className="text-xl font-bold text-blue-700 dark:text-blue-400">{character.crediti}</span>
                <span className="text-xs text-blue-600/80 uppercase font-bold">Crediti</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg min-w-20">
                <Dna className="w-5 h-5 text-purple-600 mb-1" />
                <span className="text-xl font-bold text-purple-700 dark:text-purple-400">{character.punti_caratteristica}</span>
                <span className="text-xs text-purple-600/80 uppercase font-bold">Punti Car.</span>
            </div>
        </div>
      </div>

      {/* --- ABILITA' POSSEDUTE (CON GENERIC GROUPED LIST) --- */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-1">
            <ScrollText className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Abilità Acquisite</h3>
        </div>

        {character.abilita_possedute && character.abilita_possedute.length > 0 ? (
            <GenericGroupedList 
                items={character.abilita_possedute}
                groupByKey="caratteristica" // Raggruppa per l'oggetto 'caratteristica' (che è un Punteggio)
                titleKey="nome"             // Usa il campo 'nome' della caratteristica come titolo
                colorKey="colore"           // Usa il campo 'colore' per lo stile
                iconKey="icona_url"         // Usa l'icona SVG
                renderItem={renderAbilitaItem}
                compact={true}              // Stile compatto come richiesto
            />
        ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 text-center border border-dashed border-gray-300">
                <p className="text-gray-500 italic">Nessuna abilità ancora appresa.</p>
            </div>
        )}
      </div>

      {/* --- INVENTARIO (BONUS: RAGGRUPPATO PER AURA) --- */}
      {/* Se vuoi mantenere l'inventario semplice, puoi usare una lista normale. 
          Qui ti mostro come usare GenericGroupedList anche per gli oggetti! */}
      {character.oggetti && character.oggetti.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 px-1 border-b pb-2">Inventario</h3>
            
            {/* Gli oggetti hanno un campo 'aura'. Se è null, il componente li metterà sotto 'Altro' */}
            <GenericGroupedList 
                items={character.oggetti}
                groupByKey="aura" 
                renderItem={renderOggettoItem}
                compact={false} // Stile normale per gli oggetti
            />
          </div>
      )}

    </div>
  );
};

export default HomeTab;