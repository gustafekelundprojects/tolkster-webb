// Local retrieval for the internal prototype. No external model or network calls.
function kbNorm(value){return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
const kbStop=new Set('vad hur vilka vilken vilket vem var vart nar ar er ni vi jag du det den de dom en ett att och om i pa av till for med kan ska har finns far som sa da fran oss era vara tolkster ai fungerar anvanda anvands maste gar ge'.split(' '));
function kbWords(value){return kbNorm(value).split(' ').filter(w=>w.length>1&&!kbStop.has(w)).map(w=>w.length>6?w.replace(/(ningarna|ning|ningar|heten|heter|erna|arna|ande|ande|ade|ar|er|en|et)$/,''):w)}
const kbAliases={kostar:'pris',kostnad:'pris',prislista:'pris',priser:'pris',prismodell:'pris',budget:'pris',avgift:'pris',spara:'besparing',sparar:'besparing',besparingar:'besparing',kvaliteten:'kvalitet',kvalite:'kvalitet',sakerheten:'sakerhet',gdpr:'gdpr',personuppgiftsbitradesavtal:'pub',dpa:'pub',anvandare:'personal',surfplattor:'surfplatta',tablets:'surfplatta',tablet:'surfplatta',telefonen:'mobil',tjanstetelefon:'mobil',sso:'inloggning',entra:'inloggning',sekretess:'osl',sekretessbelagda:'osl',konkurrent:'konkurrens',konkurrenter:'konkurrens',certifieringar:'certifiering',certifierat:'certifiering',latens:'fordrojning',retention:'lagring',sparas:'lagring',sparar:'lagring',transkript:'lagring',ljud:'tal',riktighet:'kvalitet',accuracy:'kvalitet',offline:'lokal',onprem:'lokal',wifi:'natverk',avbrott:'nere',driftstopp:'nere',dokumentera:'journal',integrera:'integration',integreras:'integration'};
function kbExpand(value){const words=kbWords(value);return [...new Set(words.flatMap(w=>kbAliases[w]?[w,kbAliases[w]]:[w]))]}
function kbRank(query,limit=4){
 const norm=kbNorm(query),q=kbExpand(query);if(!norm)return [];
 const phraseBoost=[
  [/\b(kostar|pris|prislista|manadsavgift|betala|abonnemang|notan)\b/, 'KB-035'],[/\b(spara|sparar|besparing)\b/,'KB-036'],[/\b(kvalitet|kvalite)\b/,'KB-011'],
  [/\b(kansliga samtal|sekretess|osl)\b/,'KB-031'],[/\b(gdpr|pub|dpa)\b/,'KB-030'],[/\b(cloud act)\b/,'KB-020'],
  [/\b(sso|entra|siths|bankid)\b/,'KB-040'],[/\b(maskera|maskering|pseudonym|anonymiser|dolja.*(?:namn|personnummer))\w*/,'FAQ-033'],
  [/\b(konkurrent|konkurrens|battre an)\w*/,'KB-045'],[/\b(google translate|gratisapp)\b/,'KB-046'],
  [/\b(talsvarighet)\w*/,'FAQ-044'],[/\b(bildstod|fardiga fraser)\b/,'FAQ-036'],[/\b(innan.*las|godkann.*upplas|granska.*text)\b/,'FAQ-034'],
  [/\b(fordrojning|latens|sekunder|snabbt.*oversatt)\b/,'KB-026'],[/\b(trana|traning)\w*/,'KB-018'],[/\b(dialekt)\w*/,'KB-010'],
  [/\b(tigrinja|somaliska|dari|kurdiska)\b/,'KB-009'],[/\b(lvu|lvm|forhor|asylutredning)\b/,'KB-014'],
  [/\b(krypter)\w*/,'KB-021'],[/\b(iso|penetrationstest)\w*/,'KB-022'],[/\b(offline|on prem|utan internet|lokal drift)\b/,'KB-054'],
  [/\b(konkurs|foretaget laggs ner|avtalet slutar|avslutar avtalet)\b/,'KB-062'],[/\b(mobiltelefon|iphone|ipad|egna enheter|tjanstetelefon)\w*/,'KB-005'],[/\b(mansklig tolk|auktoriserad tolk)\b/,'KB-041'],[/\b(nere|avbrott|driftstopp)\b/,'KB-024'],[/\b(egna termer|fackord|ordlista|forkortning)\w*/,'KB-028'],
  [/\b(finland|finska)\b/,'KB-048'],[/\b(direktupphandling|ramavtal)\b/,'KB-037'],[/\b(pilot|testa innan)\b/,'KB-051']
 ];
 const df=new Map();for(const p of DEMO_KNOWLEDGE){for(const w of new Set(kbExpand(p.question+' '+p.aliases.join(' '))))df.set(w,(df.get(w)||0)+1)}
 return DEMO_KNOWLEDGE.map(p=>{
  const phrases=[p.question,...p.aliases].map(kbNorm);let score=phrases.includes(norm)?120:0;
  const terms=new Set(kbExpand(p.question+' '+p.aliases.join(' ')));const body=new Set(kbExpand(p.reserve+' '+p.short));let matched=0;
  for(const word of q){const weight=Math.log(1+DEMO_KNOWLEDGE.length/(1+(df.get(word)||0)));if(terms.has(word)){score+=weight*3;matched++}else if([...terms].some(x=>x.length>4&&word.length>4&&(x.startsWith(word)||word.startsWith(x)))){score+=weight*1.3;matched++}else if(body.has(word))score+=weight*.3}
  for(const [regex,id] of phraseBoost)if(p.id===id&&regex.test(norm))score+=14;
  if(q.length)score+=matched/q.length*4;
  return {post:p,score,matched};
 }).filter(r=>r.score>=5).sort((a,b)=>b.score-a.score).slice(0,limit);
}
