function doPost(e) {
  var sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("Svar") || 
    SpreadsheetApp.getActiveSpreadsheet().insertSheet("Svar");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Tidsstämpel","Namn","Roll","E-post","Kommun","Skolnamn",
      "Typ av skola","Antal elever","Andel vhn begr. svenska",
      "Antal språk/läsår","Vanligaste språk","Övriga språk",
      "Situationer med behov","Hur ofta","Nuvarande lösningar",
      "Krav tillgänglighet","Fungerar idag?","Största problem",
      "Kommunalt stöd","Digitala verktyg idag","Pilot/referens","Kommentarer"
    ]);
    sheet.getRange(1,1,1,22).setFontWeight("bold").setBackground("#1B3A6B").setFontColor("#fff");
    sheet.setFrozenRows(1);
  }

  var d = JSON.parse(e.postData.contents);

  sheet.appendRow([
    d.tidsstampel||"", d.kontakt_namn||"", d.kontakt_roll||"",
    d.kontakt_email||"", d.kommun||"", d.skolnamn||"",
    d.skoltyp||"", d.antal_elever||"", d.andel_vhn||"",
    d.antal_sprak||"", d.vanliga_sprak||"", d.vanliga_sprak_ovriga||"",
    d.situationer||"", d.frekvens||"", d.losning_idag||"",
    d.tillganglighet||"", d.nulaege_ok||"", d.problem||"",
    d.kommunalt_stod||"", d.ai_idag||"", d.pilot||"", d.kommentarer||""
  ]);

  if (d.kontakt_email || d.kontakt_namn) {
    sheet.getRange(sheet.getLastRow(),1,1,22).setBackground("#E8F5EE");
  }

  return ContentService
    .createTextOutput(JSON.stringify({result:"ok"}))
    .setMimeType(ContentService.MimeType.JSON);
}
