"""Refresh the Swedish organisation baseline from official public sources.
The registry does not contain researched people or Tolkster revenue estimates.
"""
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urljoin,urlparse
from html.parser import HTMLParser
from concurrent.futures import ThreadPoolExecutor
import json,io,zipfile,re,hashlib,xml.etree.ElementTree as E

ROOT=Path(__file__).resolve().parent
URLS={
 'municipalities':'https://api.scb.se/OV0104/v1/doris/sv/ssd/START/BE/BE0101/BE0101A/BefolkningNy',
 'regions':'https://skr.se/kommunerochregioner/regionerlista.8289.html',
 'municipalityDomains':'https://skr.se/kommunerochregioner/kommunerlista.8288.html',
 'agencies':'https://www.statskontoret.se/contentassets/bbd19bc969054c86bbc1aa757e7d5c85/statskontorets-myndighetsforteckning-2026.xlsx?v=8ded29d908c4780'}
def fetch(url):
 with urlopen(url,timeout=35) as r:return r.read()
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.current=None
 def handle_starttag(self,tag,attrs):
  if tag=='a':self.current=[dict(attrs).get('href',''),'']
 def handle_data(self,data):
  if self.current is not None:self.current[1]+=data
 def handle_endtag(self,tag):
  if tag=='a' and self.current is not None:self.links.append(self.current);self.current=None

with ThreadPoolExecutor(max_workers=3) as ex:
 data=dict(zip(URLS,ex.map(fetch,URLS.values())))
rows=[]
def add(id,name,type,source,**extra):
 rows.append(dict(id=id,name=name,market='SE',type=type,parentId='',domain='',orgNumber='',aliases=[],potential='unknown',importance='unknown',classificationBasis='',checkedAt='2026-10-21',source=source,verified=True,**extra))
meta=json.loads(data['municipalities']);region=next(v for v in meta['variables'] if v['code']=='Region')
for code,name in zip(region['values'],region['valueTexts']):
 if re.fullmatch(r'\d{4}',code):
  add('SE-KOM-'+code,name+' kommun','municipality',URLS['municipalities'],code=code)
  rows[-1]['aliases']=[name,name+' stad']
assert len(rows)==290,'Unexpected municipality count; inspect source before updating.'
parser=Links();parser.feed(data['regions'].decode());regions=[]
for href,name in parser.links:
 name=re.sub(r'\s+',' ',name).strip()
 if '(länsbokstav ' not in name:continue
 name=name.split(' (länsbokstav ')[0].strip()
 if name not in [x[1] for x in regions]:regions.append((href,name))
assert len(regions)==21,'Unexpected region list; inspect source.'
regionCodes=['01','03','04','05','06','07','08','09','10','12','13','14','17','18','19','20','21','22','23','24','25']
for index,(href,name) in enumerate(regions):
 if name=='Region Gotland':
  row=next(r for r in rows if r['id']=='SE-KOM-0980');row.update(name=name,type='municipality_region',domain=urlparse(href).hostname.removeprefix('www.'),aliases=['Gotland','Gotlands kommun'],regionalSource=URLS['regions']);continue
 add('SE-REG-'+regionCodes[index],name,'region',URLS['regions'])
 rows[-1]['domain']=urlparse(href).hostname.removeprefix('www.')
parser=Links();parser.feed(data['municipalityDomains'].decode())
for href,name in parser.links:
 name=re.sub(r'\s+',' ',name).split(' Länk till')[0].strip()
 row=next((r for r in rows if r.get('code') and name in r['aliases']),None)
 if row and href.startswith('http'):
  row['domain']=urlparse(href).hostname.removeprefix('www.');row['domainSource']=URLS['municipalityDomains']
z=zipfile.ZipFile(io.BytesIO(data['agencies']));ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
shared=[''.join(t.itertext()) for t in E.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',ns)]
agencyRows=[]
for row in E.fromstring(z.read('xl/worksheets/sheet4.xml')).findall('.//s:row',ns)[1:]:
 cells={}
 for cell in row.findall('s:c',ns):
  value=cell.find('s:v',ns);v=value.text if value is not None else ''
  cells[re.sub(r'\d','',cell.attrib['r'])]=shared[int(v)] if cell.attrib.get('t')=='s' and v else v
 if cells.get('B') and cells.get('A'):
  agencyRows.append(cells)
  identifier='SE-MYN-'+cells['A']+'-'+hashlib.sha256(cells['B'].encode()).hexdigest()[:8]
  if any(r['id']==identifier for r in rows):continue
  add(identifier,cells['B'],'agency',URLS['agencies'])
  rows[-1].update(orgNumber=cells['A'],aliases=[cells['C']] if cells.get('C') else [],hostAgency=cells.get('H',''))
assert len(agencyRows)>200,'Unexpected agency count; inspect source.'
for row in rows:
 if row['type']=='agency':
  row['sharedOrgNumber']=sum(x['orgNumber']==row['orgNumber'] for x in rows)>1
  host=next((r for r in rows if r['type']=='agency' and r['name']==row.get('hostAgency')),None)
  if host and host['id']!=row['id']:row['parentId']=host['id']
assert len({r['id'] for r in rows})==len(rows),'Duplicate organisation identity'
result={'asOf':'2026-10-21','rows':rows,'coverage':{'SE':{'municipalities':290,'regionalResponsibilities':21,'separateRegions':20,'agenciesInSource':sum(r['type']=='agency' for r in rows),'note':'Gotland är en gemensam kommun- och regionorganisation. Myndighetsdelen följer Statskontorets förteckning 2026; myndigheter under riksdagen, utlandsmyndigheter och tillfälliga organ omfattas inte. Lokala verksamheter är ännu inte kartlagda.'}}}
(ROOT/'master-se.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result['coverage'],ensure_ascii=False))
