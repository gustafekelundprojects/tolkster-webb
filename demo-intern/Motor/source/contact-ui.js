// Contact-first default: one list, one start action, and the person's next step.
function contactRecords(code=null){
 const byPerson=new Map();
 for(const m of Object.values(fleet).filter(m=>!code||m.market.id===code))for(const [i,records] of [...m.stages.map((s,i)=>[i,s.records]),[4,m.delivered]])for(const r of records){
  if(r.enrichmentOnly)continue;
  const key=contactKey(r),old=byPerson.get(key);
  if(!old||i>=old.i)byPerson.set(key,{m,i,r});
 }
 return [...byPerson.values()];
}
function contactStatus(i,r){
 const state=fleet.registry.decision(r);
 if(!state.allowed)return {text:({paused:'Pausad',blocked:'Kontaktspärr',disqualified:'Avslutad'}[state.status])||'Stoppad',kind:'stopped'};
 if(r.status==='rejected')return {text:'Avvisad',kind:'stopped'};
 if(r.status==='review')return {text:'Behöver OK',kind:'review'};
 if(i===4)return {text:'Demo-inbjudan redo',kind:'ready'};
 return {text:['Hittad','Till Attio','Kontaktas','Demo förbereds'][i],kind:'normal'};
}
function contactTable(items){return `<div class="contact-table-wrap"><table class="contact-table"><thead><tr><th>Person</th><th>E-post</th><th>Organisation</th><th>Steg</th></tr></thead><tbody>${items.map(({m,i,r})=>{const s=contactStatus(i,r);return `<tr><td data-label="Person"><button class="contact-open" onclick="contactOpen('${m.market.id}',${i},'${r.id}')">${esc(contactLabel(r))}</button><small>${esc(r.role)}</small></td><td data-label="E-post"><span class="contact-email">${esc(r.email||'Saknas – behöver hittas')}</span></td><td data-label="Organisation">${esc(r.org)}</td><td data-label="Steg"><span class="contact-state ${s.kind}">${esc(s.text)}</span></td></tr>`}).join('')||'<tr><td colspan="4"><div class="empty">Inga kontakter ännu. Välj Hitta kontakter för att börja.</div></td></tr>'}</tbody></table></div>`}
renderNav=function(){
 const n=simpleReviewItems().length;
 $('navigation').innerHTML=`<button class="nav-item ${['markets','overview'].includes(view)?'active':''}" onclick="navigate('overview')">Kontakter</button><button class="nav-item ${view==='reviews'?'active':''}" onclick="navigate('reviews')">Behöver ditt OK <span class="simple-count">${n}</span></button><details class="simple-nav-details" ${simpleDisclosure.nav?'open':''} ontoggle="simpleToggleDisclosure('nav',this.open)"><summary>Avancerat</summary>${motor.stages.map((s,i)=>`<button class="nav-item ${view===String(i)?'active':''}" onclick="navigate('${i}')">0${i+1} ${s.name}</button>`).join('')}<button class="nav-item" onclick="navigate('demos')">Demoinbjudningar</button><button class="nav-item" onclick="navigate('runs')">Händelselogg</button><button class="nav-item" onclick="resetDemo()">Återställ exempeldata</button></details>`;
 const mobile=document.querySelector('.mobile-nav');mobile.innerHTML=`<option value="overview" ${view==='overview'?'selected':''}>Kontakter</option><option value="reviews" ${view==='reviews'?'selected':''}>Behöver ditt OK (${n})</option><option value="demos" ${view==='demos'?'selected':''}>Demoinbjudningar</option>`;mobile.onchange=e=>navigate(e.target.value);
};
renderMarketHome=function(){const p=marketProfile(),rows=contactRecords(p.id);return `<div class="contact-header"><div><div class="eyebrow">Tolkster Motor</div><h1>Kontakter</h1><p>Hitta rätt person. Följ kontakten hela vägen till Demo.</p></div><div class="contact-header-actions"><label class="sr" for="contact-market">Marknad</label><select id="contact-market" onchange="openMarket(this.value)">${MARKET_PROFILES.map(x=>`<option value="${x.id}" ${x.id===p.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select><button class="primary" onclick="openContactSearch()">Hitta kontakter</button></div></div><div class="contact-list-meta"><span>${rows.length} kontakter · ${esc(p.name)}</span>${motor.running?`<button class="table-action" onclick="toggleCountry('${p.id}')">Pausa arbetet</button>`:rows.some(x=>['waiting','working','ready'].includes(x.r.status))?`<button class="table-action" onclick="toggleCountry('${p.id}')">Fortsätt arbetet</button>`:''}</div>${contactTable(rows)}<p class="contact-caption">Hittad → Attio → Kontakt → Demo-inbjudan</p><p class="simple-footnote">Fiktiva personer och exempeladresser. Attio och e-post är inte anslutna; stegen simuleras.</p>`};
function openContactSearch(){
 $('settings-content').innerHTML=`<div class="eyebrow">${esc(motor.market.name)} · nytt uppdrag</div><h2>Hitta rätt personer</h2><p>Agenten söker namn, roll och arbetsmejl hos relevanta organisationer.</p>${researchForm()}`;
 const title=$('settings-content').querySelector('.simple-command h2');if(title)title.textContent='Hos vilka organisationer?';
 $('settings-dialog').showModal();
}
launchResearch=function(){
 const p=marketProfile(),c=motor.config,task=$('research-task').value.trim();
 if(!task){notify('Beskriv uppdraget under Finjustera uppdraget.');return}
 if(!c.sources.length){notify('Välj minst en källa under Finjustera uppdraget.');return}
 const before=motor.stages[0].records.length,count=motor.launch(0,task,p.name,c.limit,c.customerSegment),roles=c.roles.split(/[,;\n]/).map(s=>s.trim()).filter(Boolean);
 motor.stages[0].records.slice(before).forEach((r,j)=>{r.id=p.id+'-'+r.id;r.customer=r.id;r.role=roles[j%roles.length]||'Ansvarig roll att bekräfta';r.org=c.orgType+' · exempel '+p.id+' '+r.id.split('-').at(-1);Object.assign(r,exampleContact(r.org,r.id));r.researchSpec={market:p.id,...c,sources:[...c.sources]};r.signal=c.mode==='roles'?'Relevant roll: '+r.role:'Möjlig signal: '+c.signals;fleet.registry.register(p,r)});
 motor.running=true;motor.log('Kontaktsökning startad i '+p.name,count+' fiktiva kontakter · '+c.orgType+' · '+c.domain+'.');
 if($('settings-dialog').open)$('settings-dialog').close();navigate('overview');notify(count+' exempelkontakter lades i '+p.name+'.');
};
renderSimpleReviews=function(){return `<div class="intro"><div><div class="eyebrow">Alla marknader</div><h1>Behöver ditt OK</h1><p>Öppna personen, granska underlaget och välj nästa steg.</p></div></div>${contactTable(simpleReviewItems())}<p class="simple-footnote">Alla namn och e-postadresser är fiktiva exempel.</p>`};
renderSimpleDemos=function(){return `<div class="intro"><div><div class="eyebrow">05 Demo</div><h1>Demoinbjudningar</h1><p>En personlig Demo för varje kontakt.</p></div></div>${contactTable(contactRecords().filter(x=>x.i===4))}<a class="simple-sample" href="${esc(MOTOR_DEMO_URL)}" target="_blank" rel="noopener">Se Lidingö-exemplet →</a>`};
function contactOpen(code,i,id){activeMarket=code;motor=fleet[code];if(i<4){showRecord(i,id);return}const r=motor.delivered.find(x=>x.id===id);if(!r)return;contactDetail(i,r);$('record-dialog').showModal()}
function contactProgress(i,r){return `<ol class="contact-progress">${['Hittad','Attio','Kontakt','Demo'].map((label,j)=>`<li class="${j<Math.min(i,4)?'done':j===i?'current':''}"><span>${label}</span><small>${j<i?'Passerat i skissen':j===i?'Här nu':'Nästa'}</small></li>`).join('')}</ol>`}
function contactDetail(i,r,extra=null){
 const state=fleet.registry.decision(r),s=contactStatus(i,r),canAdvance=i<4&&['review','ready'].includes(r.status)&&state.allowed;
 const next=['Attio','kontakt','Demo-förberedelse','Demo-inbjudan'][i];
 const action=i===0?'Lägg i Attio':i===1?'Godkänn kontakt':i===2?'Förbered Demo':'Gör inbjudan redo';
 $('record-detail').innerHTML=`<div class="eyebrow">${esc(motor.market.name)} · fiktiv kontakt</div><h2>${esc(contactLabel(r))}</h2><p class="contact-detail-email">${esc(r.email||'Arbetsmejl saknas')}</p><p>${esc(r.role)} · ${esc(r.org)}</p>${contactProgress(i,r)}<span class="contact-state ${s.kind}">${esc(s.text)}</span><p>${esc(r.exception||r.signal)}</p>${i===2?`<div class="mock-mail">Till: ${esc(contactLabel(r))} &lt;${esc(r.email||'Saknas')}&gt;\n\nHej ${esc((r.contactName||'').split(' ')[0])},\n\nVi vill gärna visa hur Tolkster skulle kunna hjälpa ${esc(r.org)} inom ${esc(((r.researchSpec||{}).domain||'er verksamhet').toLowerCase())}. Du kan utforska lösningen i egen takt och välja personlig kontakt när du vill.\n\nVänliga hälsningar,\nTolkster\n\n[Utkast på svenska. Avsett språk: ${esc(motor.market.language)}. Ingen e-post skickas.]</div>`:''}<div class="dialog-actions">${canAdvance?`<button class="primary" onclick="simpleApproveNext(${i},'${r.id}')">${action} →</button>`:''}${i===4&&state.allowed?`<a class="contact-demo-button" href="${esc(MOTOR_DEMO_URL+'#motor='+encodeURIComponent(JSON.stringify(demoContextFor(r))))}" target="_blank" rel="noopener">Öppna ${esc((r.contactName||'kontaktens').split(' ')[0])}s Demo →</a>`:''}<button onclick="document.getElementById('record-dialog').close()">Stäng</button></div><p class="simple-policy">${state.allowed?(i===4?'Personlig inbjudan är förberedd i skissen. Inget mejl har skickats.':canAdvance?'Nästa steg: '+next+'. Åtgärden simuleras.':'Kontakten väntar på bearbetning. Åtgärderna simuleras.'):esc(state.reason)}</p>`;
 if(extra)$('record-detail').append(extra);
}
showRecord=function(i,id){
 detailedRecord(i,id);const r=motor.stages[i].records.find(x=>x.id===id);if(!r)return;
 const extra=document.createElement('details');extra.className='simple-advanced';const summary=document.createElement('summary');summary.textContent='Mer underlag och kontaktstyrning';extra.append(summary);
 const detail=$('record-detail');while(detail.firstChild)extra.append(detail.firstChild);
 contactDetail(i,r,extra);
};
const contactDetailedStage=renderStage;
renderStage=function(i){let html=contactDetailedStage(i).replace('<th>Organisation</th>','<th>Kontakt</th>');for(const r of motor.stages[i].records)html=html.replace('<td><b>'+esc(r.org)+'</b>','<td><b>'+esc(contactLabel(r))+'</b><small>'+esc(r.email||'Arbetsmejl saknas')+'</small><small>'+esc(r.org)+'</small>');return html};
activeMarket='SE';motor=fleet.SE;view='overview';render();
