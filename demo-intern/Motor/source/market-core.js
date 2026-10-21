const MARKET_PROFILES=[
 {id:'SE',name:'Sverige',flag:'🇸🇪',language:'Svenska',orgs:['Lidingö stad','Herrljunga kommun','Gävle kommun','Exempelregion Sverige']},
 {id:'DK',name:'Danmark',flag:'🇩🇰',language:'Danska',orgs:['Aarhus kommun','Odense kommun','Aalborg kommun','Exempelregion Danmark']},
 {id:'FI',name:'Finland',flag:'🇫🇮',language:'Finska / svenska',orgs:['Esbo stad','Åbo stad','Tammerfors stad','Exempelregion Finland']},
 {id:'NO',name:'Norge',flag:'🇳🇴',language:'Norska',orgs:['Oslo kommun','Bergen kommun','Trondheim kommun','Exempelregion Norge']},
 {id:'NL',name:'Nederländerna',flag:'🇳🇱',language:'Nederländska',orgs:['Utrecht','Rotterdam','Eindhoven','Exempelregion Nederländerna']},
 {id:'DE',name:'Tyskland',flag:'🇩🇪',language:'Tyska',orgs:['Hamburg','Köln','Leipzig','Exempelregion Tyskland']},
 {id:'UK',name:'Storbritannien',flag:'🇬🇧',language:'Engelska',orgs:['Exempelkommun England','Exempelvård Storbritannien','Exempelmyndighet Skottland','Exempelkommun Wales']},
 {id:'US',name:'USA',flag:'🇺🇸',language:'Engelska',orgs:['Exempelstad USA','Exempelvård USA','Exempelmyndighet USA','Exempelcounty USA']}
];
function createMarketFleet(){
 const fleet={};const registry=new LeadRegistry();Object.defineProperty(fleet,'registry',{value:registry,enumerable:false});
 for(const profile of MARKET_PROFILES){
  const m=new MotorCore();m.events=[];m.counter=0;m.delivered=[];
  m.config={orgType:'Kommun / stad',domain:'Arbetsmarknad & integration',roles:'Verksamhetschef, digitaliseringsansvarig, inköpsansvarig',mode:'both',signals:'AI-projekt, upphandling, språkbehov',sources:['Officiella organisationswebbplatser','Offentliga beslut','Upphandlingsportaler'],customerSegment:'small',limit:3,region:'',channel:'Direkt'};
  m.market=profile;
  m.stages.forEach((s,i)=>{s.records=[];s.market=profile.name;s.agent=profile.name+' · '+['researchagent','CRM-agent','dialogagent','access-agent'][i];});
  m.stages[0].task='Hitta relevanta organisationer i '+profile.name+' och identifiera ansvariga roller. Leta efter aktuella signaler om AI och språkstöd. Visa källor och skilj fakta från antaganden.';
  function seed(stage,name,status,segment,exception=null){const r=m.makeRecord(name,stage,status);r.id=profile.id+'-'+r.id;r.customer=r.id;r.country=profile.name;r.customerSegment=segment;r.exception=exception;r.researchSpec={market:profile.id,...m.config,sources:[...m.config.sources]};if(['ready','review'].includes(status))r.status=m.needsApproval(stage,r,stage+1)?'review':'ready';m.stages[stage].records.push(r)}
  seed(0,profile.orgs[0],'ready','small');seed(0,profile.orgs[1],'ready','medium');seed(0,profile.orgs[2],'waiting','large');seed(1,profile.orgs[3],'review','medium');seed(2,'Exempelorganisation '+profile.id+' – dialog','waiting','small');seed(3,'Exempelorganisation '+profile.id+' – åtkomst','review','small','Arbetsdomän behöver granskas');
  m.stages.forEach(s=>s.records.forEach(r=>registry.register(profile,r)));m.admission=r=>{registry.register(profile,r);return registry.decision(r)};m.onEnrichmentComplete=r=>registry.completeEnrichment(m,r);
  m.log(profile.name+' är redo','Separata agenter, köer och inställningar. Alla fynd är exempeldata.');fleet[profile.id]=m;
 }
 registry.sync(fleet);return fleet;
}
