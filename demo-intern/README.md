# Tolkster Demo – intern kunskapsversion

**Detta paket är en intern testversion med svarsutkast som ännu inte godkänts för kund.** Öppna `index.html` lokalt för att prova chatten direkt.

Den färdiga sidan är `index.html` i denna katalog. ZIP-filen innehåller filerna direkt i roten: lägg **innehållet** i roten av ett GitHub-repository, till exempel ett repo som heter `demo`.

## Publicera med GitHub Pages

1. Packa upp `demo-intern.zip` och ladda upp alla filer, inklusive den dolda katalogen `.github`, i repots rot på grenen `main`.
2. I GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. När arbetsflödet **Publish Tolkster Demo** är klart finns länken under Pages eller i arbetsflödets deployment.

## Lägg till material senare

Ladda upp filerna **direkt i repots rot** via GitHub. Du behöver inte välja katalog eller redigera någon lista. Varje uppladdning till `main` bygger om sidan och listar filerna automatiskt.

| Fil | Visas under |
| --- | --- |
| `video-quick.mp4`, `intro.webm` | Video |
| `presentation-socialtjanst.pdf`, `presentation-produkt.pptx` | Presentationer |
| `whitepaper-sakerhet.pdf`, `rapport-kvalitet.pdf` | Whitepapers |
| `henrik.jpg`, `bild-surfplatta.png` | Bilder |

En PDF utan prefix hamnar under Whitepapers. Använd prefixet `presentation-` för presentations-PDF. Filnamnet används som titel. PDF, bilder och MP4/WebM visas i sidan; PPT/PPTX, DOCX och MOV öppnas som filer. Undvik mycket stora videofiler i repot och använd i stället en godkänd videoplattform när det blir aktuellt.

`build_site.py` skapar den publicerade sidan och `content-manifest.json` automatiskt vid varje GitHub Pages-bygge. Den medföljande tomma manifestfilen gör att `index.html` också fungerar som lokal skiss. Chatten söker i 73 inbyggda kunskapsposter, kan visa fördjupningar och har ett förberett småpratsläge märkt som svar utanför kunskapsbanken. Ingen extern språkmodell är ansluten. Produkttestet är fortfarande simulerat. Resursfilerna är verkliga först när ni laddat upp dem.

## Åtkomst

GitHub Pages är normalt offentligt även om källrepot är privat. Publicera därför inte interna underlag, personuppgifter eller kundspecifika dokument där. För att begränsa själva webbsidan till kollegor krävs en separat åtkomstlösning eller GitHub Enterprise Cloud med privat Pages-publicering. En lösenordsruta i statisk HTML ger inget faktiskt skydd.
