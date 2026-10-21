/* Shared lifecycle registry for the local prototype. No Attio API calls. */
class LeadRegistry{
 constructor(){this.accounts=new Map();this.opportunities=new Map();this.contacts=new Map();this.accountKeys=new Map();this.next=0;this.audit=[];this.enrichment=new Map();}
 norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9@.]+/g,' ').trim()}
 register(market,r){
  if(!r.organizationId||!this.accounts.has(r.organizationId)){
   const key=r.verifiedDomain?'domain:'+this.norm(r.verifiedDomain):market.id+'|'+this.norm(r.org);
   let id=this.accountKeys.get(key);if(!id){id='KUND-'+String(++this.next).padStart(3,'0');this.accountKeys.set(key,id);this.accounts.set(id,{id,name:r.org,market:market.id,status:'active',reason:'',until:null});}r.organizationId=id;
  }
  r.customer=r.organizationId;
  if(!r.opportunityId)r.opportunityId=r.organizationId+'|'+this.norm((r.researchSpec||{}).domain||'generellt');
  if(!this.opportunities.has(r.opportunityId))this.opportunities.set(r.opportunityId,{id:r.opportunityId,status:'active',reason:'',until:null});
  if(!r.contactId)r.contactId=r.email?'email:'+this.norm(r.email):r.organizationId+'|role:'+this.norm(r.role);
  if(!this.contacts.has(r.contactId))this.contacts.set(r.contactId,{id:r.contactId,name:r.contactName||'',email:r.email||'',role:r.role||'',status:'active',reason:'',until:null});
  r.marketId=market.id;
  this.screen(r);
  return r;
 }
 screen(r){
  if(r.optOut)this.set(r,'contact','blocked','Avregistrering / uttryckligt kontaktstopp');
  else if(r.outsideTarget)this.set(r,'opportunity','disqualified','Utanför uppdragets målgrupp');
  else if(r.suspectedCompetitor){r.exception='Misstänkt konkurrent – kräver manuell granskning';if(['waiting','ready','working'].includes(r.status))r.status='review';}
 }
 entry(r,scope){return scope==='organisation'?this.accounts.get(r.organizationId):scope==='contact'?this.contacts.get(r.contactId):this.opportunities.get(r.opportunityId)}
 set(r,scope,status,reason,until=null){const e=this.entry(r,scope);if(!e)return false;if(status!=='active'&&!String(reason||'').trim())return false;if(e.status===status&&e.reason===reason&&e.until===until)return true;e.status=status;e.reason=String(reason||'');e.until=until;this.audit.unshift({customer:r.organizationId,scope,status,reason:e.reason,until,time:Date.now()});return true;}
 decision(r){for(const [scope,e] of [['contact',this.contacts.get(r.contactId)],['organisation',this.accounts.get(r.organizationId)],['opportunity',this.opportunities.get(r.opportunityId)]]){if(!e)continue;if(['blocked','disqualified'].includes(e.status))return {allowed:false,status:e.status,reason:e.reason,scope,until:e.until};}
 for(const [scope,e] of [['contact',this.contacts.get(r.contactId)],['organisation',this.accounts.get(r.organizationId)],['opportunity',this.opportunities.get(r.opportunityId)]]){if(e&&e.status==='paused'&&(!e.until||Date.parse(e.until+'T23:59:59')>=Date.now()))return {allowed:false,status:'paused',reason:e.reason,scope,until:e.until};}return {allowed:true,status:'active',reason:'',scope:null};}
 sync(fleet){for(const m of Object.values(fleet)){for(const s of m.stages){for(const r of s.records){this.register(m.market,r);const d=this.decision(r);if(['forwarded','rejected'].includes(r.status))continue;if(!d.allowed){if(!['held','closed','blocked'].includes(r.status))r.resumeStatus=r.status;r.status=d.status==='paused'?'held':d.status==='blocked'?'blocked':'closed';}else if(['held','closed','blocked'].includes(r.status)){r.status='waiting';delete r.resumeStatus;}}}}}
 completeEnrichment(m,r){r.status='forwarded';for(const stage of m.stages)for(const target of stage.records)if(target.opportunityId===r.opportunityId&&target.contactId===r.contactId&&target.id!==r.id)target.researchUpdatedAt=Date.now();m.log('Komplettering återförd',r.org+' · befintlig kontakt uppdaterad. Ingen ny kampanj eller CRM-post skapades.');}
 requestEnrichment(m,r,from){this.register(m.market,r);const gate=this.decision(r);if(!gate.allowed){m.log('Ny signal stoppades',r.org+' · '+gate.reason);return {status:'blocked',message:'Kontakten återstartas inte: '+gate.reason};}
 const existing=m.stages[0].records.find(x=>x.opportunityId===r.opportunityId&&x.contactId===r.contactId&&!['forwarded','rejected','closed','blocked'].includes(x.status));if(existing){m.log('Befintligt researchärende återanvänds',r.org+' · samma kontakt-ID, ingen dubblett.');return {status:'existing',message:'Ett researchärende finns redan för kontakten. Ingen dubblett skapades.'};}
 const enrichmentKey=r.opportunityId+'|'+r.contactId;const n=this.enrichment.get(enrichmentKey)||0;if(n>=2){m.log('Återkopplingsgräns nådd',r.org+' · två kompletteringsrundor. Manuell granskning krävs.');return {status:'limit',message:'Två kompletteringsrundor har körts. Ta ett manuellt beslut innan fler startas.'};}
 this.enrichment.set(enrichmentKey,n+1);const next={...r,id:m.market.id+'-RET-'+(++m.counter),stage:0,status:'waiting',enrichmentOnly:true,returnStage:from,origin:'Återkoppling från '+(from===1?'Attio':'steg 0'+(from+1)),trail:[...r.trail,{from,to:0,time:Date.now()}],signal:'Komplettera uppgifter för befintlig kontakt. Bevara kundstatus och kontaktspärrar.'};m.stages[0].records.push(next);m.log('Återkoppling till 01',r.org+' · kompletteringsrunda '+(n+1)+' av 2.');return {status:'created',message:'Ett kompletteringsuppdrag lades i 01 med samma kontakt-ID.'};
 }
}
