/* Browser-local market coverage, CRM comparison and bounded research planning. */
const SALES_ROLES={business:'Verksamhetsansvarig',it:'Digitalisering / IT',procurement:'Inköp / beslutsväg'};
const SALES_LEVELS={unknown:'Ej bedömd',small:'Liten',medium:'Mellan',large:'Stor'};
const SALES_IMPORTANCE={unknown:'Ej bedömd',low:'Låg',medium:'Mellan',high:'Hög'};
function salesNorm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\b(kommun|stad)\b/g,'').replace(/[^a-z0-9]/g,'')}
function salesDomain(v){return String(v||'').trim().toLowerCase().replace(/^https?:\/\//,'').split('/')[0].replace(/^www\./,'')}
function salesHash(s){let n=2166136261;for(const c of String(s)){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}return (n>>>0).toString(36)}
function salesRole(v){const s=String(v||'').toLowerCase();return /inköp|upphandl|procure|purchas/.test(s)?'procurement':/digital|\bit\b|\bcdo\b|information|teknik|technology/.test(s)?'it':/verksam|social|rektor|chef|director|manager|handlägg|integration|enhets|business/.test(s)?'business':'unknown'}
function salesTrue(v){return ['true','yes','ja','1','spärrad','blocked'].includes(String(v||'').toLowerCase().trim())}
function salesCSV(text){
 text=String(text).replace(/^\uFEFF/,'');if(text.length>4000000)throw Error('Filen är för stor. Dela upp den i mindre CSV-filer.');
 const header=text.split(/\r?\n/)[0]||'',sep=(header.match(/;/g)||[]).length>(header.match(/,/g)||[]).length?';':',';
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===sep&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}else cell+=c;}
 if(quoted)throw Error('CSV-filen innehåller ett oavslutat citattecken.');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 if(rows.length<2)throw Error('CSV-filen behöver en rubrikrad och minst en datarad.');
 const keys=rows.shift().map(k=>k.trim().toLowerCase().replace(/[ _-]+/g,''));if(new Set(keys).size!==keys.length)throw Error('CSV-filen har dubbla kolumnrubriker.');
 if(rows.length>12000)throw Error('Högst 12 000 rader kan läsas in åt gången.');
 return rows.map((values,i)=>{if(values.length!==keys.length)throw Error('Fel antal kolumner på rad '+(i+2)+'.');return Object.fromEntries(keys.map((k,j)=>[k,values[j].trim()]))});
}
function salesCell(r,...keys){for(const k of keys){const v=r[k.toLowerCase().replace(/[ _-]+/g,'')];if(v)return v}return ''}
class SalesEngine{
 constructor(baseline){this.master=JSON.parse(JSON.stringify(baseline.rows));this.coverage=baseline.coverage;this.crm=null;this.confirmed={};this.jobs=[];this.events=[];this.drafts={};this.rules={jobsPerRun:3,maxAttempts:2};this.lastComparison=null;}
 roots(market){return this.master.filter(o=>o.market===market)}
 organisation(id){return this.master.find(o=>o.id===id)}
 importMaster(text,defaultMarket='SE'){
  const rows=salesCSV(text),allowed=['SE','DK','FI','NO','NL','DE','UK','US'];
  const incoming=rows.map(r=>{const name=salesCell(r,'name','organisation','organization','organisation_name'),market=salesCell(r,'market','land')||defaultMarket,domain=salesDomain(salesCell(r,'domain','domän'));if(!name||!allowed.includes(market))throw Error('Varje organisation behöver namn och en giltig landskod.');const id=salesCell(r,'master_id','id')||market+'-IMPORT-'+salesHash(domain||name);const parentId=salesCell(r,'parent_id','parent');const potential=salesCell(r,'potential')||'unknown',importance=salesCell(r,'importance')||'unknown';if(!SALES_LEVELS[potential]||!SALES_IMPORTANCE[importance])throw Error('Ogiltig potential eller strategisk vikt.');return {id,name,market,domain,parentId,type:parentId?'unit':salesCell(r,'type')||'organisation',potential,importance,orgNumber:salesCell(r,'org_number','orgnr'),source:salesCell(r,'source')||'Importerad lista – källa behöver bekräftas',checkedAt:salesCell(r,'checked_at')||new Date().toISOString().slice(0,10),verified:false,aliases:[],classificationBasis:salesCell(r,'classification_basis')||'Manuellt importerat'}});
  if(incoming.some(o=>!/^[A-Za-z0-9_.:-]{1,160}$/.test(o.id)||o.parentId&&!/^[A-Za-z0-9_.:-]{1,160}$/.test(o.parentId)))throw Error('ID får bara innehålla bokstäver a–z, siffror, punkt, kolon, understreck och bindestreck.');
  if(new Set(incoming.map(o=>o.id)).size!==incoming.length)throw Error('Masterlistan innehåller dubbla ID:n.');
  const combined=new Map(this.master.map(o=>[o.id,o]));for(const o of incoming)combined.set(o.id,o);
  for(const o of incoming){const seen=new Set([o.id]);let p=o;while(p.parentId){const parent=combined.get(p.parentId);if(!parent||parent.market!==o.market)throw Error('Överordnad organisation saknas eller ligger i annat land: '+o.name);if(seen.has(parent.id))throw Error('Organisationsträdet innehåller en cirkel.');seen.add(parent.id);p=parent;}}
  this.master=[...combined.values()];return incoming.length;
 }
 importCRM(text,defaultMarket='SE'){
  const rows=salesCSV(text),next=this.crm?JSON.parse(JSON.stringify(this.crm)):{orgs:[],contacts:[],example:false,asOf:null};
  for(const row of rows){
   const get=(...k)=>salesCell(row,...k);const email=get('email','email addresses','e-post').split(/[;,]/).map(s=>s.trim()).find(Boolean)||'';
   if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Ogiltig e-postadress: '+email);
   const market=get('market','land')||defaultMarket;if(!['SE','DK','FI','NO','NL','DE','UK','US'].includes(market))throw Error('Ogiltig landskod i Attio-underlaget.');
   const role=get('job title','role','roll'),company=get('company','organisation','organization'),name=get('name','person','full name')||[get('first name'),get('last name')].filter(Boolean).join(' '),recordId=get('record id','id'),domain=salesDomain(get('domain','domains')),orgNumber=get('org_number','orgnr'),masterId=get('master_id');
   const person=!!email||!!role||get('record_type')==='person';
   if(person&&!company&&!domain&&!masterId)throw Error('Kontaktens organisation, domän eller master-ID saknas.');
   const orgName=company||(!person?name:'');if(!orgName&&!domain&&!masterId)throw Error('Organisationen saknar namn eller identifierare.');
   const orgKey=masterId||orgNumber||domain||market+'|'+salesNorm(orgName);
   let org=next.orgs.find(o=>o.key===orgKey);if(!org){org={key:orgKey,name:orgName,domain,orgNumber,market,masterId,recordId:person?'':recordId};next.orgs.push(org)}
   if(domain)org.domain=domain;if(orgNumber)org.orgNumber=orgNumber;if(masterId)org.masterId=masterId;if(!person&&recordId)org.recordId=recordId;
   const flags={};for(const [key,aliases] of [['active',['active_dialog','active']],['customer',['is_customer','customer']],['blocked',['do_not_contact','blocked']]]){const value=get(...aliases);if(value!=='')flags[key]=salesTrue(value)}if(get('owner','ansvarig'))flags.owner=get('owner','ansvarig');if(get('pause_until'))flags.pauseUntil=get('pause_until');
   // Contact-specific flags never become an organisation-wide stop.
   if(!person)Object.assign(org,flags);
   if(person){const key=email?'email:'+email.toLowerCase():recordId||market+'|'+salesNorm(name+company+role);const contact={key,name,email,role,roleKey:salesRole(role),market,orgKey,masterId,department:get('department','verksamhet'),recordId,...flags};const old=next.contacts.findIndex(c=>c.key===key);if(old<0)next.contacts.push(contact);else next.contacts[old]={...next.contacts[old],...contact};}
  }
  next.asOf=new Date().toISOString();next.example=false;this.crm=next;this.lastComparison=next.asOf;return rows.length;
 }
 match(org){
  if(!this.crm)return {kind:'unknown',org:null};
  const root=org.parentId?this.organisation(org.parentId):org;
  const pool=this.crm.orgs.filter(x=>x.market===org.market);
  const confirmed=pool.find(x=>x.key===this.confirmed[org.id]);if(confirmed)return {kind:'confirmed',org:confirmed};
  const exact=pool.filter(x=>x.masterId===org.id||(!org.parentId&&!org.sharedOrgNumber&&org.orgNumber&&x.orgNumber===org.orgNumber)||(!org.parentId&&org.domain&&x.domain===org.domain));
  if(exact.length===1)return {kind:'exact',org:exact[0]};if(exact.length>1)return {kind:'ambiguous',org:null,candidates:exact};
  if(org.parentId&&root){const inherited=this.match(root);if(['exact','confirmed'].includes(inherited.kind))return {...inherited,inherited:true};}
  const aliases=[org.name,...(org.aliases||[])].map(salesNorm),names=pool.filter(x=>aliases.includes(salesNorm(x.name)));
  return names.length===1?{kind:'name',org:names[0]}:names.length>1?{kind:'ambiguous',org:null,candidates:names}:{kind:'absent',org:null};
 }
 contacts(org,match=this.match(org)){if(!match.org||!this.crm)return [];return this.crm.contacts.filter(c=>c.orgKey===match.org.key&&(!org.parentId||c.masterId===org.id||salesNorm(c.department)===salesNorm(org.name)))}
 gap(org){
  const match=this.match(org),contacts=this.contacts(org,match),usable=contacts.filter(c=>c.name&&c.email&&!c.blocked),required=org.requiredRoles||Object.keys(SALES_ROLES),missing=required.filter(role=>!usable.some(c=>c.roleKey===role));
  const paused=match.org?.pauseUntil&&Date.parse(match.org.pauseUntil+'T23:59:59')>=Date.now();
  const protectedOrg=org.stopped||match.org?.blocked||match.org?.customer||match.org?.active||paused;
  const activeContact=contacts.find(c=>!c.blocked&&(c.active||c.customer));
  const pending=match.kind==='name'||match.kind==='ambiguous';
  const stale=!!this.crm&&Date.now()-Date.parse(this.crm.asOf)>30*86400000;
  const label=!this.crm?'Attio saknas':protectedOrg?'Hos ansvarig':pending?'Bekräfta matchning':stale?'Underlaget är äldre':activeContact?'Pågående dialog':match.kind==='absent'?'Saknas i underlaget':missing.length?missing.length+' roller saknas':'Rollerna täckta';
  return {match,contacts,usable,missing,protected:!!protectedOrg||!!activeContact,pending,stale,label,action:!this.crm?'Läs in Attio':protectedOrg||activeContact?'Visa ansvarig':pending?'Granska matchning':stale?'Uppdatera underlag':missing.length?'Hitta rätt person':'Visa kontakter'};
 }
 priority(org){const gap=this.gap(org);return ({large:30,medium:20,small:10,unknown:5}[org.potential]||0)+({high:20,medium:10,low:5,unknown:0}[org.importance]||0)+(org.signal?10:0)+Math.min(15,gap.missing.length*5)}
 plan(market,existing=[]){
  const rows=this.roots(market).sort((a,b)=>this.priority(b)-this.priority(a)||a.name.localeCompare(b.name,'sv'));
  const jobs=[];
  for(const org of rows){const gap=this.gap(org);if(!this.crm||gap.pending||gap.protected||gap.stale)continue;
   const effort=org.potential==='large'||org.importance==='high'?3:org.potential==='medium'?2:1;let added=0;
   for(const role of gap.missing){const key=org.id+'|'+role;
    const attempts=this.jobs.filter(j=>j.key===key);
    if(attempts.some(j=>['queued','completed'].includes(j.status))||attempts.length>=this.rules.maxAttempts)continue;
    if(existing.some(r=>r.masterId===org.id&&salesRole(r.role)===role&&!['rejected','closed'].includes(r.status)))continue;
    jobs.push({id:'JOB-'+salesHash(key+'|'+attempts.length),key,masterId:org.id,market,role,status:'queued',attempt:attempts.length+1,reason:gap.label,priority:this.priority(org),example:true,createdAt:new Date().toISOString()});
    if(++added>=effort||jobs.length>=this.rules.jobsPerRun)break;
   }if(jobs.length>=this.rules.jobsPerRun)break;
  }this.jobs.push(...jobs);return jobs;
 }
 draft(r,url){const id=contactKey(r),displayUrl=String(url).includes('#motor=')?'{{personlig_demo_länk}}':url;if(!this.drafts[id])this.drafts[id]={id,subject:'Språkstöd för '+r.org,body:'Hej '+(r.contactName||'').split(' ')[0]+',\n\nJag kontaktar dig i din roll som '+r.role.toLowerCase()+' på '+r.org+'. Vi vill gärna undersöka om Tolkster kan vara relevant för era samtal som behöver språkstöd.\n\nHär kan du utforska lösningen och ställa frågor i egen takt:\n'+displayUrl+'\n\nVill du hellre prata med en människa finns Henrik till hands.\n\nVänliga hälsningar,\nTolkster',approved:false,updatedAt:new Date().toISOString()};return this.drafts[id]}
 approveDraft(r,subject,body){if(!subject.trim()||!body.trim())throw Error('Ämne och meddelande behövs.');const id=contactKey(r);this.drafts[id]={id,subject:subject.trim(),body:body.trim(),approved:true,approvedAt:new Date().toISOString(),updatedAt:new Date().toISOString()};return this.drafts[id]}
 event(r,type,route='demo'){if(!['mail.sent','reply.received','link.used','demo.opened','human.requested'].includes(type))throw Error('Okänd händelse.');if(type==='mail.sent'&&!this.drafts[contactKey(r)]?.approved)throw Error('Mejlet behöver godkännas först.');const event={id:'EV-'+salesHash(contactKey(r)+type+Date.now()+this.events.length),contactId:contactKey(r),type,route,at:new Date().toISOString(),example:true,verified:false};this.events.push(event);return event}
 snapshot(){return {version:1,master:this.master,crm:this.crm,confirmed:this.confirmed,jobs:this.jobs,events:this.events,drafts:this.drafts,rules:this.rules}}
 restore(raw){if(!raw||raw.version!==1||!Array.isArray(raw.master)||raw.master.length>15000)throw Error('Ogiltigt sparat underlag.');for(const o of raw.master)if(!o.id||!o.name||!o.market)throw Error('Organisation saknar identifierare.');this.master=raw.master;this.crm=raw.crm||null;this.confirmed=raw.confirmed||{};this.jobs=raw.jobs||[];this.events=raw.events||[];this.drafts=raw.drafts||{};this.rules={jobsPerRun:Math.max(1,Math.min(10,Number(raw.rules?.jobsPerRun)||3)),maxAttempts:Math.max(1,Math.min(3,Number(raw.rules?.maxAttempts)||2))}}
}
