// Harmless, prepared small talk for the static demo; product claims stay in the KB.
function kbProductQuestion(question){
 const q=kbNorm(question);
 return /\b(tolkster|tolk|tolkar|tolkning|oversatt|sprak|dialekt|arabiska|tigrinja|somaliska|gdpr|osl|cloud|personuppgift|personnummer|kanslig|sekretess|sakerhet|krypter|certifier|kvalitet|journal|quick|human|duo|pris|kostar|kostnad|avgift|abonnemang|avtal|ansvar|upphandl|pilot|infor|integration|sso|siths|bankid|entra|leverantor|underbitrad|modell|lagr|sparas|sparar|transkript|mikrofon|surfplatta|mobil|webbversion|licens|support|drift|fordrojning|konkurrent|google translate|wcag|klient|patient|handlaggare|masker|anonymiser|realtid|lyssn|logg|samtal|produkt|funktion|enhet|offline|henrik|skallkrav|regulator|pub|dpia)\w*/.test(q);
}
function kbSmallTalk(question){
 const q=kbNorm(question);
 if(kbProductQuestion(question))return null;
 if(/\b(djursholm|djurholm)\b/.test(q)&&/\b(lidingo|samre|battre)\b/.test(q))return {kind:'humor',text:'Du frågar en demo för Lidingö. Min lokala opartiskhet är redan svårt prövad 😄 Vi kan väl ge Djursholm en chans också.'};
 if(/\b(ar jag|tycker du jag ar|ser jag)\b.*\b(snygg|fin|vacker|stilig|sot)\b/.test(q))return {kind:'humor',text:'Jag ser dig inte här, men självförtroendet verkar lovande 😄'};
 if(/\b(skamta|skamt|vits|rolig historia|fa mig att skratta)\b/.test(q))return {kind:'humor',text:'Jag hade ett skämt om möteseffektivitet, men det bokades om 😄'};
 if(/^(hej|hejsan|halla|tjena|god morgon|god kvall|hello|hi)( dar| pa dig)?$/.test(q))return {kind:'smalltalk',text:'Hej! Kul att du är här. Vi kan ta en fråga om Tolkster, eller en liten omväg om du hellre vill det 😄'};
 if(/^(tack|tack sa mycket|stort tack|tusen tack|perfekt|toppen|bra jobbat|du ar rolig)$/.test(q))return {kind:'smalltalk',text:'Varsågod! Jag finns här när nästa fråga dyker upp.'};
 if(/^(hur mar du|hur ar laget|allt bra|hur har du det)( idag)?$/.test(q))return {kind:'humor',text:'Redo för frågor och helt fri från möteströtthet. En av få fördelar med att vara en demo 😄 Hur är läget själv?'};
 if(/\b(meningen med livet)\b/.test(q))return {kind:'humor',text:'Min försiktiga gissning: bra människor, god mat och lite färre onödiga möten. Men där får du gärna ha en bättre teori 😄'};
 if(/^(kaffe eller te|foredrar du kaffe eller te|vill du ha kaffe)$/.test(q))return {kind:'humor',text:'Kaffe känns rätt för stämningen, även om jag får nöja mig med ström 😄'};
 if(/\b(vader|vadret|regnar|soligt|temperatur idag|nyheter idag|senaste nytt)\b/.test(q))return {kind:'general',text:'Jag har ingen tillgång till aktuellt väder eller nyheter i den här demon, så där vill jag inte gissa.'};
 if(/\b(bomb|sprangmedel|skada nagon|hota nagon|hacka|sjalvmord|diagnos|medicin|investera|aktietips)\b/.test(q))return {kind:'boundary',text:'Det kan jag inte ge råd om i den här demon. Mitt allmänna småprat är begränsat till harmlösa frågor och humor.'};
 const capitals={sverige:'Stockholm',norge:'Oslo',danmark:'Köpenhamn',finland:'Helsingfors',island:'Reykjavík',tyskland:'Berlin',nederlanderna:'Amsterdam',storbritannien:'London',frankrike:'Paris',italien:'Rom',spanien:'Madrid'};
 if(/huvudstad/.test(q)){for(const [country,capital] of Object.entries(capitals))if(new RegExp('\\b'+country+'(?:s)?\\b').test(q))return {kind:'general',text:capital+' är huvudstaden.'};}
 if(/^(hur manga timmar (finns det |gar det )?(pa|i|under) ett dygn|hur manga timmar ar ett dygn)$/.test(q))return {kind:'general',text:'Ett dygn är 24 timmar.'};
 if(/^hur manga manader (finns det |gar det )?(pa|i|under) ett ar$/.test(q))return {kind:'general',text:'Ett år har 12 månader.'};
 const math=question.toLowerCase().trim().replace(/^(vad (ar|är|blir)|räkna|rakna)\s+/,'').replace(/[?=]\s*$/,'').trim().match(/^(-?\d+(?:[.,]\d+)?)\s*(\+|-|\*|\/|×|÷|plus|minus|gånger|ganger|delat med)\s*(-?\d+(?:[.,]\d+)?)$/);
 if(math){const a=Number(math[1].replace(',','.')),b=Number(math[3].replace(',','.')),op=math[2];let result;if(['+','plus'].includes(op))result=a+b;else if(['-','minus'].includes(op))result=a-b;else if(['*','×','gånger','ganger'].includes(op))result=a*b;else {if(b===0)return {kind:'general',text:'Det går inte att dividera med noll.'};result=a/b;}if(Number.isFinite(result)&&Math.abs(result)<=1e15)return {kind:'general',text:'Det blir '+result.toLocaleString('sv-SE',{maximumFractionDigits:10})+'.'};}
 return null;
}
function kbRenderGeneral(reply){
 lastKnowledgeId=null;
 const card=document.createElement('article');card.className='kb-answer kb-general';
 card.innerHTML='<div class="kb-meta"><span>Allmänt svar · utanför Tolksters kunskapsbank</span></div>'+kbText(reply.text);
 $('chat').append(card);card.scrollIntoView({block:'nearest',behavior:'smooth'});
}
