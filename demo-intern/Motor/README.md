# 01 MOTOR – kontaktbaserad arbetsyta

Öppna `../01index.html` eller `01index.html` i denna katalog.

1. Startsidan visar kontakter för Sverige. Byt land i marknadsväljaren. Varje land har egna agenter, inställningar och köer för 01–04.
2. Varje rad är en person med namn, roll, e-post, organisation och steg. Samma kontakt visas en gång i huvudlistan även när historik finns i flera steg.
3. Klicka **Hitta kontakter**. Välj organisationstyp och verksamhet, och starta simuleringen. Roller, signaler, källor och exempelurval finns under **Finjustera uppdraget**. De detaljerade köerna och tempo finns under **Avancerat**.
4. I ett ärende kan du sätta gemensam status: fortsätt, pausa till datum, avsluta bearbetning eller spärra kontakt. Välj om beslutet gäller affären, organisationen eller kontakten. Kontaktspärr gäller kontakten.
5. Prova återkopplingen till 01 från ärendedialogen. Samma kund-ID behålls, spärrar respekteras och kompletteringar skapar inte nya kampanjer. Högst två kompletteringsrundor simuleras innan manuell bedömning krävs.
6. **Behöver ditt OK** samlar beslut från alla marknader. Öppna ett ärende och godkänn till nästa steg. Underlaget och fler åtgärder kan fällas ut.
7. När Access lämnat vidare en kontakt, öppna personen och välj den personliga Demon. Namn, e-post, kontakt-ID, organisation, land, verksamhet, roll och segment följer med. Samma kontakt visas i Demo och i underlaget till Henrik. **Avancerat → Demoinbjudningar** visar förberedda inbjudningar.

Alla personer är fiktiva och alla e-postadresser använder `.example`. En persons kontakt-ID och e-post behålls genom Attio-steget, kontaktsteget och Demo. Attio-ID:n är markerade som simulerade. Ingen inbjudan eller annan e-post skickas.

## Automatik

Små kunder går automatiskt inom godkänt upplägg. Mellankunder stannar före Outreach. Stora eller strategiska kunder stannar tidigt och före Outreach. Oklarheter och okända segment granskas manuellt. Segmentgränser är inte fastställda; du väljer segment i skissen.

## Begränsningar

Allt är en lokal prototyp med exempeldata. Ingen research, Attio-ändring, mejlleverans, avregistreringsintegration, autentisering eller verklig återkallelse körs. En blockerad statisk Demo-länk kan inte återkallas på serversidan. Målbilden kräver gemensam backend, verklig identitetsmatchning och statuskontroll före varje extern åtgärd. Namn och marknad används endast som en enkel matchning i denna skiss.

Kontextöverföringen till Demo använder URL-fragment med exempeldata. Den skapar aldrig behörighet och ska inte användas för känsliga uppgifter. Live-AI och produktprov är fortfarande inte anslutna.

## Verifiering

Marknadsvyer och navigation är kontrollerade med en förenklad DOM-testmiljö. Tester täcker separata inställningar, köer och tempo, segmentregler, kontaktspärrar, återkommande signaler, kontakt-/organisationsomfattning, kompletteringsloop och landsspecifik Demo/Plan-kontext. Ingen visuell webbläsartestning har gjorts i denna miljö.
