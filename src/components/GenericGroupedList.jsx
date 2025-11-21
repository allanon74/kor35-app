import React from 'react';

// Funzione helper per determinare il colore del testo (Bianco/Nero)
const getContrastYIQ = (hexcolor) => {
    if (!hexcolor) return 'black';
    hexcolor = hexcolor.replace("#", "");
    var r = parseInt(hexcolor.substr(0, 2), 16);
    var g = parseInt(hexcolor.substr(2, 2), 16);
    var b = parseInt(hexcolor.substr(4, 2), 16);
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}

const GenericGroupedList = ({ 
    items, 
    groupByKey, // Es: "caratteristica" o "aura_richiesta"
    renderItem, // Funzione per renderizzare il singolo elemento (li)
    titleKey = "nome", // Chiave per il titolo del gruppo dentro l'oggetto raggruppante
    colorKey = "colore", // Chiave per il colore del gruppo
    iconKey = "icona_url", // Chiave per l'icona (opzionale)
    compact = false // Se true, usa stili più piccoli
}) => {

    if (!items || items.length === 0) return null;

    // 1. Raggruppa gli elementi
    const groupedItems = items.reduce((acc, item) => {
        // Ottieni l'oggetto di raggruppamento (es. l'oggetto Caratteristica o Aura)
        const groupObj = item[groupByKey];
        
        // Gestione fallback se l'oggetto di raggruppamento è nullo
        const groupId = groupObj ? groupObj.id : 'no-group';
        const groupName = groupObj ? groupObj[titleKey] : 'Altro';
        const groupColor = groupObj ? groupObj[colorKey] : '#cccccc';
        const groupIcon = groupObj ? groupObj[iconKey] : null;

        if (!acc[groupId]) {
            acc[groupId] = {
                id: groupId,
                name: groupName,
                color: groupColor,
                icon: groupIcon,
                items: []
            };
        }
        acc[groupId].items.push(item);
        return acc;
    }, {});

    // Ordina i gruppi (opzionale, qui per nome)
    const sortedGroups = Object.values(groupedItems).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="space-y-4">
            {sortedGroups.map(group => {
                const textColor = getContrastYIQ(group.color);
                // Stili dinamici
                const headerStyle = {
                    backgroundColor: group.color,
                    color: textColor,
                    borderColor: group.color
                };
                const containerStyle = {
                    borderColor: group.color
                };

                return (
                    <div key={group.id} className={`border rounded-lg overflow-hidden shadow-sm mb-4`} style={containerStyle}>
                        {/* Intestazione Gruppo */}
                        <div 
                            className={`px-3 py-1 flex items-center justify-between font-bold ${compact ? 'text-sm' : 'text-base'}`}
                            style={headerStyle}
                        >
                            <div className="flex items-center gap-2">
                                {group.icon && (
                                    <div 
                                        className="w-6 h-6"
                                        style={{
                                            maskImage: `url(${group.icon})`,
                                            WebkitMaskImage: `url(${group.icon})`,
                                            maskSize: 'contain',
                                            WebkitMaskSize: 'contain',
                                            backgroundColor: textColor
                                        }}
                                    />
                                )}
                                <span>{group.name}</span>
                            </div>
                            <span className="text-xs opacity-80">{group.items.length}</span>
                        </div>

                        {/* Lista Elementi */}
                        <div className="bg-white dark:bg-gray-800 p-2">
                            <ul className={`divide-y divide-gray-100 dark:divide-gray-700 ${compact ? 'text-sm' : ''}`}>
                                {group.items.map((item, index) => (
                                    <React.Fragment key={index}>
                                        {renderItem(item)}
                                    </React.Fragment>
                                ))}
                            </ul>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default GenericGroupedList;