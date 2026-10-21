"""Build standalone Motor entry points from the shared source modules."""
from pathlib import Path
import re, shutil, zipfile,json

SOURCE=Path(__file__).resolve().parent
ROOT=SOURCE.parent
DEMO=ROOT/'demo-intern'
html=(DEMO/'index.html').read_text()
# Keep Demo's embedded context adapter in sync with the editable source.
adapter=(DEMO/'motor-demo-context.js').read_text()
html=re.sub(r'<script id="motor-demo-context">[\s\S]*?</script>',lambda _: '<script id="motor-demo-context">'+adapter+'</script>',html)
(DEMO/'index.html').write_text(html)
font=re.search(r'@font-face\{font-family:Nunito;src:url\(data:font/ttf;base64,[^}]+\}',html).group(0)
logo=re.search(r'<a class="brand-home".*?<img src="([^"]+)"',html,re.S).group(1)
baseline=json.dumps(json.loads((SOURCE/'master-se.json').read_text()),ensure_ascii=False).replace('<','\\u003c')
core='const MASTER_BASELINE='+baseline+';\n'+'\n'.join((SOURCE/name).read_text() for name in ['contact-model.js','motor-core.js','lead-registry.js','market-core.js','sales-engine.js'])
ui='\n'.join((SOURCE/name).read_text() for name in ['motor-ui.js','market-ui.js','demo-handoff.js','lifecycle-ui.js','simple-ui.js','contact-ui.js','sales-ui.js'])
css='\n'.join((SOURCE/name).read_text() for name in ['market-styles.css','simple-styles.css','contact-styles.css','sales-styles.css'])
page=(SOURCE/'page-template.html').read_text().replace('__FONT__',font).replace('__LOGO__',logo).replace('__CORE__',core).replace('__UI__',ui).replace('</style>',css+'\n</style>',1)
page=page.replace('<title>Tolkster Motor · intern kontrollpanel</title>','<title>01 Motor · Tolkster</title>')
targets=[(SOURCE/'index.html','demo.html'),(DEMO/'01index.html','index.html'),(DEMO/'motor/index.html','../index.html'),(DEMO/'motor/01index.html','../index.html')]
for path,url in targets:
 path.parent.mkdir(parents=True,exist_ok=True)
 path.write_text(page.replace("const MOTOR_DEMO_URL='demo.html'",f"const MOTOR_DEMO_URL='{url}'").replace('href="demo.html"',f'href="{url}"'))
dest=DEMO/'motor/source';dest.mkdir(exist_ok=True,parents=True)
shutil.copy2(DEMO/'motor-demo-context.js',dest/'demo-context.js')
for name in ['contact-model.js','motor-core.js','lead-registry.js','market-core.js','motor-ui.js','market-ui.js','demo-handoff.js','lifecycle-ui.js','simple-ui.js','contact-ui.js','sales-engine.js','sales-ui.js','sales-styles.css','master-se.json','refresh_master.py','market-styles.css','simple-styles.css','contact-styles.css','page-template.html','build_motor.py']:
 shutil.copy2(SOURCE/name,dest/name)
# One small, self-contained delivery for testing just Motor.
with zipfile.ZipFile(ROOT/'motor-forenklad.zip','w',zipfile.ZIP_DEFLATED) as z:
 z.write(DEMO/'01index.html','01index.html')
 z.write(DEMO/'index.html','index.html')
 for path in sorted(dest.iterdir()):
  if path.is_file():z.write(path,'motor/source/'+path.name)
 z.writestr('README.txt','Öppna 01index.html för Motor. index.html är kunddemon. Varje rad är en fiktiv person med namn, e-post, organisation och steg. Byt marknad och välj Hitta kontakter. Alla adresser använder .example. Inga mejl skickas.\n')
# Refresh the existing full web delivery, preserving root-level uploads.
with zipfile.ZipFile(ROOT/'demo-intern.zip','w',zipfile.ZIP_DEFLATED) as z:
 for path in sorted(DEMO.rglob('*')):
  if path.is_file() and 'dist' not in path.relative_to(DEMO).parts and '__pycache__' not in path.relative_to(DEMO).parts:
   z.write(path,path.relative_to(DEMO))
print('Built 4 Motor entry points and motor-forenklad.zip')
