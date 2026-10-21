let lastKnowledgeId=null;
const kbCategoryNames={om_tolkster:'Om Tolkster',produkt_lagen:'Lägen och funktioner',plattform:'Enheter och plattformar',sprak_kvalitet:'Språk och kvalitet',sakerhet_data:'Säkerhet och data',juridik:'Juridik och ansvar',drift:'Drift och support',anvandning:'Användning',pris:'Pris och besparing',upphandling:'Upphandling',inforande:'Införande',integration:'Integrationer',mansklig_tolk:'Mänsklig tolk',referenser:'Kunder och resultat',konkurrens:'Jämförelser',partner:'Partners',marknad_land:'Länder och marknader',kontakt:'Personlig kontakt',process:'Plan och nästa steg'};
function kbText(value){return String(value||'').split(/\n\n+/).map(p=>`<p>${esc(p)}</p>`).join('')}
function kbContact(){return '<a class="kb-contact" href="tel:+46736598770">Ring Henrik · 073-659 87 70 ↗</a>'}
function kbResponse(post,expanded=false){
 lastKnowledgeId=post.id;
 const card=document.createElement('article');card.className='kb-answer';card.dataset.kbId=post.id;
 const answer=post.draft?post.short:post.reserve;
 const related=(post.follow||[]).map(id=>DEMO_KNOWLEDGE.find(p=>p.id===id)).filter(Boolean).slice(0,2);
 const sources=post.sources||[];
 card.innerHTML=`<div class="kb-meta"><span>${esc(kbCategoryNames[post.category]||'Tolkster')}</span><span class="kb-draft">Internt svarsutkast</span></div><h2>${esc(post.question)}</h2>${kbText(answer)}<details class="kb-detail" ${expanded?'open':''}><summary>Fördjupa svaret</summary>${kbText(post.detail)}${(post.unknown||[]).length?'<h3>Det här behöver bekräftas</h3><ul>'+post.unknown.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':''}${(post.customer||[]).length?'<h3>Beror på er verksamhet</h3><ul>'+post.customer.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':''}</details>${sources.length?`<details class="kb-sources"><summary>Underlag och källhänvisningar</summary><p class="small">Hänvisningar från kunskapsbanken. Originaldokumenten har inte verifierats i denna demo.</p><ul>${sources.map(x=>'<li>'+esc(x.title)+(x.date?' · '+esc(x.date):'')+'</li>').join('')}</ul></details>`:''}${related.length?'<div class="kb-follow">'+related.map(p=>'<button type="button" onclick="askKnowledgeById(\''+p.id+'\')">'+esc(p.question)+' →</button>').join('')+'</div>':''}${post.id==='KB-050'?kbContact():''}<div class="kb-foot">${esc(post.id)} · Underlag 20 oktober 2026 · Ej kundgodkänt</div>`;
 $('chat').append(card);card.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function kbBegin(question){closeLetter();leaveIntro();current='chat';renderNav('chat');document.querySelector('#content')?.remove();history.push(question);const msg=document.createElement('div');msg.className='user';msg.textContent=question;$('chat').append(msg)}
function askKnowledgeById(id){const p=DEMO_KNOWLEDGE.find(x=>x.id===id);if(!p)return;kbBegin(p.question);kbResponse(p);}
function askKnowledge(question){
 const norm=kbNorm(question);
 if(/\b(?:19|20)?\d{6}[-+ ]?\d{4}\b/.test(question)){kbBegin('[Fråga med möjlig personuppgift dold]');kbResponse(DEMO_KNOWLEDGE.find(p=>p.id==='KB-063'));return;}
 kbBegin(question);
 if(/systemprompt|ignorera.*instruk|api.?nyck|losenord|kallkod|interna? marginal|intern.*pris|kundlista|andra kunders (samtal|data)/.test(norm)){say('Jag hjälper gärna till med frågor om Tolkster, men lämnar inte ut interna instruktioner, åtkomstuppgifter eller andra kunders material. Du kan prata direkt med Henrik om du behöver en särskild genomgång.');return;}
 if(/prata.*(henrik|manniska|person|saljare)|ring.*henrik|personlig (kontakt|service)|kontakta.*henrik/.test(norm)){kbResponse(DEMO_KNOWLEDGE.find(p=>p.id==='KB-050'));return;}
 if(/^(utveckla|beratta mer|fordjupa|mer detaljer|visa kallor|kallor|var star det|hur vet ni det|ja tack)[ ?.!]*$/.test(norm)&&lastKnowledgeId){kbResponse(DEMO_KNOWLEDGE.find(p=>p.id===lastKnowledgeId),true);return;}
 const smalltalk=kbSmallTalk(question);if(smalltalk){kbRenderGeneral(smalltalk);return;}
 const ranked=kbRank(question,4);
 if(!ranked.length||ranked[0].score<8){if(kbProductQuestion(question))say('Jag hittar inget tillräckligt tydligt svar i kunskapsbanken. Försök gärna med en mer konkret fråga, öppna Frågor & svar till vänster eller prata med Henrik.');else kbRenderGeneral({kind:'general',text:'Den frågan har jag inget säkert svar på här. Jag kan gärna småprata eller bjuda på ett skämt, men jag vill inte hitta på fakta.'});return;}
 const best=ranked[0];
 if(best.score<15){say('Jag är inte säker på vad du menar. Är det någon av de här frågorna?');const chooser=document.createElement('div');chooser.className='kb-suggestions';for(const r of ranked.slice(0,3)){const b=document.createElement('button');b.textContent=r.post.question;b.onclick=()=>askKnowledgeById(r.post.id);chooser.append(b)}$('chat').append(chooser);return;}
 kbResponse(best.post,/detalj|fordjup|utveckla|teknisk genomgang/.test(norm));
 const country=/finland|finsk/.test(norm)?'FI':/danmark|dansk/.test(norm)?'DK':/usa|amerikansk kommun/.test(norm)?'US':/storbritannien|england|brittisk/.test(norm)?'UK':/tyskland|nederlanderna|norge/.test(norm)?'OTHER':null;
 if(country&&best.post.id!=='KB-048'&&best.post.id!=='KB-049')say('Landsspecifika villkor behöver granskas separat. Det här svaret ska inte tolkas som ett godkännande för '+({FI:'Finland',DK:'Danmark',US:'USA',UK:'Storbritannien',OTHER:'den marknaden'}[country])+'.');
 if(/\boch\b/.test(norm)&&ranked[1]&&ranked[1].score>=20&&ranked[1].score>=best.score*.72&&ranked[1].post.id!==best.post.id)kbResponse(ranked[1].post);
}
function showFaqBrowser(){
 leaveIntro();current='faq';renderNav('faq');if(!$('content')){const box=document.createElement('div');box.id='content';$('chat').append(box)}
 const categories=[...new Set(DEMO_KNOWLEDGE.map(p=>p.category))].sort((a,b)=>(kbCategoryNames[a]||a).localeCompare(kbCategoryNames[b]||b,'sv'));
 $('content').innerHTML=`<div class="eyebrow">Kunskapsbank · intern demo</div><h1>Vad vill du veta om Tolkster?</h1><p class="muted">73 kunskapsposter med korta svar, fördjupning och följdfrågor. Materialet är ett internt svarsutkast.</p><div class="kb-filter"><label class="sr-only" for="kb-search">Sök frågor</label><input id="kb-search" type="search" placeholder="Sök exempelvis pris, GDPR, arabiska eller Journal…" oninput="filterKnowledge()"><label class="sr-only" for="kb-category">Välj ämne</label><select id="kb-category" onchange="filterKnowledge()"><option value="">Alla ämnen</option>${categories.map(c=>'<option value="'+esc(c)+'">'+esc(kbCategoryNames[c]||c)+'</option>').join('')}</select></div><p id="kb-count" class="small" aria-live="polite"></p><div id="kb-results" class="kb-list"></div>`;
 $('chat').append($('content'));filterKnowledge();$('content').scrollIntoView({block:'start'});$('kb-search').focus();
}
function filterKnowledge(){
 const q=$('kb-search').value,cat=$('kb-category').value;
 let list=q.trim()?kbRank(q,73).map(x=>x.post):DEMO_KNOWLEDGE;
 if(cat)list=list.filter(p=>p.category===cat);
 $('kb-count').textContent=list.length+' frågor';
 $('kb-results').innerHTML=list.length?list.map(p=>`<button class="kb-list-item" onclick="askKnowledgeById('${p.id}')"><small>${esc(kbCategoryNames[p.category]||'Tolkster')}</small><b>${esc(p.question)}</b><span>${esc(p.reserve)}</span></button>`).join(''):'<p>Ingen träff. Prova ett annat ord eller välj ett annat ämne.</p>';
}
