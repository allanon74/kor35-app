/**
 * Pulisce l'HTML rimuovendo stili inline, classi e spazi non-breaking (&nbsp;)
 * che impediscono il corretto "a capo" del testo.
 */
export const sanitizeHtml = (htmlContent) => {
    if (!htmlContent) return "";

    // 1. Sostituzione preliminare brutale: &nbsp; -> spazio normale
    // Questo risolve il problema del testo che non va a capo.
    let cleanString = htmlContent.replace(/&nbsp;/g, ' ');

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(cleanString, 'text/html');
        
        // 2. Rimuove tutti gli attributi 'style' e 'class' da ogni elemento
        const allElements = doc.body.querySelectorAll('*');
        allElements.forEach(el => {
            el.removeAttribute('style');
            el.removeAttribute('class'); // Rimuove classi esterne (es. colori testo copiati)
            
            // Opzionale: Rimuovi span inutili che spesso avvolgono il testo incollato
            if (el.tagName === 'SPAN' && el.attributes.length === 0) {
                // Mantiene il contenuto rimuovendo il tag span (logica complessa, per ora lo lasciamo pulito)
            }
        });

        // 3. Rimuove paragrafi vuoti (<p><br></p> o <p> </p>)
        const paragraphs = doc.body.querySelectorAll('p');
        paragraphs.forEach(p => {
            const text = p.textContent.trim();
            // Se è vuoto e non ha immagini o altro, via
            if (!text && p.children.length === 0) {
                p.remove();
            }
            // Se contiene solo un <br>, via (riduce lo spazio verticale eccessivo)
            if (p.innerHTML.trim() === '<br>') {
                p.remove();
            }
        });

        return doc.body.innerHTML;
    } catch (e) {
        console.error("Errore sanitizzazione HTML:", e);
        return htmlContent; // Fallback al contenuto originale
    }
};