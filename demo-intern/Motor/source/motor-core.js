class MotorCore {
 constructor(){
  this.running=false;this.events=[];this.delivered=[];this.counter=100;
  this.stages=[
   {name:'Intelligence',tag:'Researchagenter',pace:65,paused:false,auto:true,credit:0,market:'Sverige',segment:'Kommun',agent:'Nationell researchagent',task:'Hitta kommuner med tydliga AI-initiativ eller behov av språkstöd. Identifiera relevanta roller och ange källa.',records:[]},
   {name:'Attio',tag:'CRM & kvalificering',pace:45,paused:false,auto:true,credit:0,market:'Alla marknader',segment:'Alla',agent:'CRM-agent',task:'Matcha organisation och kontakt, hitta dubbletter och föreslå ansvarig säljare. Förbered ändringarna för granskning.',records:[]},
   {name:'Outreach',tag:'Dialog & mejlutkast',pace:35,paused:false,auto:true,credit:0,market:'Sverige',segment:'Kommun',agent:'Dialogagent',task:'Förbered ett kort, relevant första mejl utifrån roll och signal. Bifoga inga dokument. Inkludera personlig kontakt och väg till Demo.',records:[]},
   {name:'Access',tag:'Tillgång & kundkontext',pace:55,paused:false,auto:true,credit:0,market:'Alla marknader',segment:'Alla',agent:'Access-agent',task:'Granska organisation och arbetsdomän, föreslå åtkomst och bygg kundkontext inför Demo. Oklarheter ska till manuell bedömning.',records:[]}
  ];
  const groups=[['Lidingö stad','Herrljunga kommun','Aarhus kommun','Esbo stad','Utrecht kommun','Exempelkommun A'],['Gävle kommun','Exempelkommun B','Exempelregion A','Exempelkommun C','Exempelmyndighet A'],['Exempelkommun D','Exempelkommun E','Exempelregion B','Exempelkommun F'],['Exempelkommun G','Exempelkommun H','Exempelmyndighet B','Exempelkommun I']];
  groups.forEach((list,i)=>list.forEach((org,j)=>this.stages[i].records.push(this.makeRecord(org,i,j<2?'ready':j===2?'review':'waiting',j))));
  for(let i=0;i<4;i++)for(const r of this.stages[i].records)if(['ready','review'].includes(r.status))r.status=this.needsApproval(i,r,i+1)?'review':'ready';
  this.log('Skissen är redo','Alla organisationer och signaler här är exempeldata.','info');
 }
 makeRecord(org,stage,status='waiting',offset=0){const id='EX-'+(++this.counter);return {id,customer:id,org,...exampleContact(org,this.counter),country:org.includes('Aarhus')?'Danmark':org.includes('Esbo')?'Finland':org.includes('Utrecht')?'Nederländerna':'Sverige',role:['Digitaliseringsansvarig','Verksamhetschef','Inköpsansvarig'][offset%3],signal:['AI-initiativ i verksamheten','Behov av språkstöd','Intresse från webbplatsen'][offset%3],status,stage,origin:'Exempeldata',customerSegment:['small','medium','large'][offset%3],exception:status==='review'?'Uppgift behöver verifieras':null,approvals:{},trail:[]}}
 log(title,detail,kind='info'){this.events.unshift({title,detail,kind,time:Date.now()});this.events=this.events.slice(0,40)}
 setPace(i,n){this.stages[i].pace=Math.max(0,Math.min(100,Number(n)));}
 togglePause(i){const s=this.stages[i];s.paused=!s.paused;this.log((s.paused?'Pausat ':'Återupptagit ')+s.name,'Övriga arbetsstationer påverkas inte.');}
 isAllowed(r){return !this.admission||this.admission(r).allowed;}
 needsApproval(from,r,to=from+1){
  if(from===2&&!r.approvals.mail)return true;
  if(r.exception&&!r.approvals.exception)return true;
  if(!['small','medium','large'].includes(r.customerSegment))return true;
  if(r.customerSegment==='large'&&from===0&&!r.approvals.strategic)return true;
  if(r.customerSegment!=='small'&&to>=2&&from<=2&&!r.approvals.outreach)return true;
  return false;
 }
 grantApproval(from,r){r.approvals={...r.approvals,exception:!!r.exception||r.approvals.exception};if(from===0&&r.customerSegment==='large')r.approvals.strategic=true;if(from===1||from===2)r.approvals.outreach=true;if(from===2)r.approvals.mail=true;}
 setSegment(i,id,segment){const r=this.stages[i].records.find(x=>x.id===id);if(!r||!['small','medium','large'].includes(segment))return;r.customerSegment=segment;r.approvals={};if(['ready','review'].includes(r.status))r.status=this.needsApproval(i,r,i+1)?'review':'ready';this.log('Kundsegment ändrat',r.org+' · '+({small:'småkund',medium:'mellankund',large:'stor / strategisk kund'}[segment])+'.');}
 tick(multiplier=1){if(!this.running)return;for(let i=0;i<4;i++){const s=this.stages[i];if(s.paused||s.pace===0)continue;
  if(s.auto){const ready=s.records.filter(r=>r.status==='ready'&&this.isAllowed(r)&&!this.needsApproval(i,r,i+1));if(ready.length){for(const r of ready)if(r.enrichmentOnly&&this.onEnrichmentComplete)this.onEnrichmentComplete(r);this.handoff(i,ready.filter(r=>r.status==='ready').map(r=>r.id),i+1,false);}}
  s.credit+=s.pace/100*multiplier;while(s.credit>=1){s.credit-=1;const active=s.records.find(r=>r.status==='working'&&this.isAllowed(r));if(active){active.status=this.needsApproval(i,active,i+1)?'review':'ready';this.log(s.name+': resultat klart',active.org+(active.status==='review'?' · väntar på godkännande enligt segmentregler.':' · klart enligt segmentregler.'));if(s.auto&&active.status==='ready'){if(active.enrichmentOnly&&this.onEnrichmentComplete)this.onEnrichmentComplete(active);else this.handoff(i,[active.id],i+1,false);}}else{const waiting=s.records.find(r=>r.status==='waiting'&&this.isAllowed(r));if(waiting)waiting.status='working';else break;}}}}

 launch(i,task,market,limit=3,customerSegment='small'){const s=this.stages[i];s.task=task;s.market=market;const n=Math.max(1,Math.min(10,Number(limit)||3));for(let j=0;j<n;j++){const r=this.makeRecord('Nytt exempeluppdrag '+(this.counter+1),i);r.country=market==='Alla marknader'?'Sverige':market;r.signal=task;r.customerSegment=customerSegment;r.origin='Manuellt startad demokörning';s.records.push(r)}this.log('Nytt uppdrag i '+s.name,n+' simulerade ärenden lades i kön.');return n}
 approve(i,ids){for(const r of this.stages[i].records)if(ids.includes(r.id)&&r.status==='review'){this.grantApproval(i,r);r.status='ready';}this.log('Granskning bekräftad',ids.length+' valda ärenden i '+this.stages[i].name+'. Inget skickas till externa system.');}
 reject(i,id){const r=this.stages[i].records.find(x=>x.id===id);if(r){r.status='rejected';this.log('Ärende avvisat',r.org+' · avvisat i skissen.')}}
 handoff(from,ids,to,approved=false){
  if(to===from||to<0||to>4)return {sent:0,error:'Välj en annan mottagare.'};
  const selected=this.stages[from].records.filter(r=>ids.includes(r.id)&&['ready','review'].includes(r.status));
  let sent=0,blocked=0;
  for(const r of selected){if(!this.isAllowed(r)){blocked++;continue;}if((r.status==='review'||this.needsApproval(from,r,to))&&!approved){blocked++;continue;}if(approved)this.grantApproval(from,r);if(r.enrichmentOnly&&this.onEnrichmentComplete){this.onEnrichmentComplete(r);sent++;continue;}
   const destination=to===4?this.delivered:this.stages[to].records;
   if(destination.some(x=>x.customer===r.customer&&x.fromRecord===r.id)){continue;}
   const journey={...(r.contactJourney||{})};
   if(from===0&&to===1)journey.found={state:'simulated',at:Date.now()};
   if(from===1&&to===2)journey.attio={state:'simulated',recordId:'SIM-ATTIO-'+contactKey(r),at:Date.now()};
   if(from===2&&to===3)journey.outreach={state:'simulated',at:Date.now()};
   if(from===3&&to===4)journey.demo={state:'prepared',at:Date.now()};
   const next={...r,id:'EX-'+(++this.counter),fromRecord:r.id,stage:to,status:to===4?'delivered':'waiting',contactJourney:journey,approvals:{...r.approvals},trail:[...r.trail,{from,to,time:Date.now()}]};destination.push(next);r.status='forwarded';sent++;}
  if(sent)this.log('Överlämnat '+sent+' ärende'+(sent===1?'':'n'),this.stages[from].name+' → '+(to===4?'05 Demo':this.stages[to].name)+(to<4&&this.stages[to].paused?' · mottaget i en pausad kö.':' · mottaget.'),'success');
  return {sent,blocked};
 }
 counts(i){const r=this.stages[i].records;return {waiting:r.filter(x=>x.status==='waiting').length,working:r.filter(x=>x.status==='working').length,ready:r.filter(x=>x.status==='ready').length,review:r.filter(x=>x.status==='review').length}}
}
