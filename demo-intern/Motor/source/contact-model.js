/* Every simulated work item belongs to one person, not just an organisation. */
function exampleContact(org,seed=0){
 const people=[['Anna','Lind'],['Johan','Berg'],['Sara','Ek'],['Erik','Lund'],['Maria','Dahl'],['David','Holm'],['Emma','Björk'],['Oskar','Nyström']];
 const n=Number(String(seed).replace(/\D/g,''))||0;
 const [first,last]=people[n%people.length];
 const slug=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'exempel';
 return {contactName:first+' '+last,email:slug(first)+'.'+slug(last)+'+'+n+'@'+slug(org)+'.example',emailVerified:false,contactSource:'Fiktiv kontakt för simulering',isExample:true};
}
function contactLabel(r){return r.contactName||'Kontakt saknas'}
function contactKey(r){return r.contactId||(r.email?'email:'+String(r.email).trim().toLowerCase():r.id)}
