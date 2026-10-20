# Intern kunskapsdemo – 20 oktober 2026

- 62 poster från den uppladdade kunskapsbanken.
- 11 kompletterande poster från FAQ-dokumentet i samtalet. Dessa använder försiktiga svar där produktstatus saknas.
- Alla 48 ursprungliga frågor är mappade. Kopplingarna finns i `faq48-map.json`.
- Kort svar, fördjupning, verifieringsluckor, källhänvisningar och upp till två följdfrågor per post.
- Nytt menyval **Frågor & svar** med fritextsökning och ämnesfilter.
- Alla svar är märkta **Internt svarsutkast**. Inget har ändrats till kundgodkänt.

## Hur chatten fungerar

Chatten använder lokal textsökning med svenska frågevarianter. Den skriver inte nya svar med en språkmodell. Vid osäker träff visar den alternativ eller ber om en mer konkret fråga. Skriv `berätta mer` för att fördjupa det senaste svaret. De fyra snabbfrågorna startar svar från kunskapsbanken. Lidingö-knappen öppnar den tidigare behovsanalysen.

Originalens interna källregister, policy, råa leverantörsavtal och testfall ingår inte i den publicerade sidan. Källhänvisningar återges som hänvisningar från kunskapsbanken; originaldokumenten har inte granskats i detta arbete. Svaren är inte verifierade produktutfästelser.

## Kontroller

- Alla 124 grundfrågor och omformuleringar i det uppladdade testpaketet hittar rätt kunskapspost som första träff.
- De 48 FAQ-kopplingarna hänvisar till befintliga poster.
- Sidans JavaScript har kontrollerats med Node. Ingen webbläsartestning har gjorts i denna körning.
- Det innebär inte att alla 174 beteendetester har körts eller att svarens sakuppgifter är verifierade.

GitHub Pages kan göra hela den inbyggda kunskapen tillgänglig för besökaren. Publicera endast där åtkomsten är avsedd för den här interna testversionen.
