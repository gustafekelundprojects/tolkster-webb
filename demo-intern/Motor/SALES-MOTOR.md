# Tolkster Motor – marknadstäckning och kontaktflöde

## Prova

1. Öppna `../01index.html`.
2. Välj **Läs in Attio-underlag**. Du kan läsa in CSV eller välja **Prova och styr motorn → Prova med exempel-CRM**.
3. Öppna en organisation, bedöm intäktspotential och strategisk vikt och ange motivering.
4. Starta prioriterat arbete. De viktigaste saknade rollerna skapar ett avgränsat antal fiktiva kontakter i simuleringen.
5. Följ personen i **Kontakter**. Alla mejl stannar för ett uttryckligt godkännande. Redigera ämne och text före godkänt simulerat utskick.
6. Följ personlig Demo och kontaktens händelser. En länk identifierar inte säkert personen som använder den.

## Grundlista

570 svenska organisationsposter hämtade 21 oktober 2026: 290 kommuner, 20 separata regionorganisationer och 260 unika myndighetsposter med organisationsnummer i Statskontorets förteckning. Region Gotland har kommun- och regionansvar och är en gemensam post. Myndigheter med värdmyndighet kan ligga under denna i hierarkin.

Detta är inte en fullständig förteckning över alla offentliga organ eller alla lokala verksamheter. Statskontorets källa exkluderar bland annat myndigheter under riksdagen, utlandsmyndigheter och tillfälliga organ. Lokala enheter läggs till med källa eller via masterimport. Övriga sju marknaders fullständiga register är ännu inte inlästa.

Källor:

- SCB: https://www.scb.se/hitta-statistik/regional-statistik-och-kartor/regionala-indelningar/lan-och-kommuner/
- SKR kommuner: https://skr.se/kommunerochregioner/kommunerlista.8288.html
- SKR regioner: https://skr.se/kommunerochregioner/regionerlista.8289.html
- Statskontoret: https://www.statskontoret.se/analys-och-statistik/oppna-data/myndighetsforteckning/

## Hur gap beräknas

Master-ID, entydig domän och entydigt organisationsnummer kan ge stark matchning. Delade organisationsnummer ger inte automatisk matchning. Namnträffar kräver bekräftelse. Lokal verksamhet ärver inte automatiskt moderorganisationens kontakter; personen behöver knytas till rätt enhet.

Gap bedöms för verksamhetsansvarig, digitalisering/IT och inköp/beslutsväg. Rollbedömningen är en enkel ordregel som ska utvecklas mot kundernas faktiska roller. Personer utan namn eller e-post räknas inte som nåbara kontakter. Kontaktspärrar gäller personen, inte automatiskt hela organisationen. Kända kunder, pågående dialoger, organisationsspärrar och pauser påverkar köbildningen.

**Saknas i underlaget** betyder inte säkert att posten saknas i hela Attio. Utdrag kan vara filtrerade. Underlag äldre än 30 dagar stoppar nya prioriterade researchuppdrag tills det uppdaterats.

## Import

CSV med komma eller semikolon och citerade fält stöds. People- och Companies-utdrag kan läsas in efter varandra. Mallar kan laddas ned i Underlag. Ange `market` med SE, DK, FI, NO, NL, DE, UK eller US. Vanliga rubriker som Name, Email addresses, Job title, Company, Record ID och Domain stöds. Kund-/spärr-/dialogstatus kräver uttryckliga kolumner, se mallen. Saknade flaggkolumner får inte nollställa en tidigare kontaktspärr.

Masterimport stöder `master_id,name,market,type,parent_id,domain,potential,importance,source,classification_basis`. Tillåtna potentialvärden: unknown/small/medium/large. Strategisk vikt: unknown/low/medium/high. ID:n måste vara stabila och unika. Överordnad organisation måste finnas i samma marknad; cirklar avvisas.

## Automation i denna version

Prioriteringen väger potential, strategisk vikt, eventuell signal och saknade roller. Hög potential eller strategisk vikt ger utrymme för fler saknade roller. Det finns ett tak per start och per organisation/roll; upprepade klick skapar inte dubbletter. Budgeten är ett antal exempelkontakter, inte en uppmätt kostnadsbudget. Alla nya personer är uttryckligt fiktiva med `.example`-adresser.

Lokala ändringar, inlästa utdrag, utkast och kontakter sparas i webbläsarens localStorage. De delas inte mellan kollegor och hamnar inte i HTML/ZIP. Vid omladdning återställs arbetet med körningen pausad. Simuleringen arbetar bara när sidan är öppen. Om lagring blockeras visas detta i gränssnittet.

Demo kan registrera en oidentifierad öppning i samma webbläsare och på samma origin. Detta är ingen serverbaserad spårning. Händelser kan också simuleras uttryckligt i kontaktkortet. Ingen öppning markeras som verifierad identitet.

## Återstår för skarp drift

- Serverlagrad organisation/kontakt/affär och schemalagd kö som kan köras när sidan är stängd.
- Attio-adapter med kontrollerad läsning, fältägarskap, webhookar, idempotenta upserts och spärrkontroll direkt före externa åtgärder.
- Researchadapter som returnerar verkliga källor och kontakter; inga gissade personadresser får märkas verifierade.
- Brevo-adapter med godkännande bundet till exakt mottagare och meddelandeversion, leveransstatus, svarshantering och avregistrering.
- Korta serverlagrade inbjudningar, åtkomstkontroll och instrumentering på riktig hemsida/Demo. Skilj skannerklick från besök och verifierad inloggning.
- Landsregister och granskade kontaktregler per marknad samt kontrollerade definitioner av potential och kundsegment.

Inga externa CRM-poster ändras och inga mejl skickas av denna version.
