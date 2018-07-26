// From a google spreadsheet open Tools->ScriptEditor and paste this in

// original from: http://mashe.hawksey.info/2014/07/google-sheets-as-a-database-insert-with-apps-script-using-postget-methods-with-ajax-example/
// original gist: https://gist.github.com/willpatera/ee41ae374d3c9839c2d6 

function doGet(e){
  // TODO:
  // 1. Test the origin/referrer domain
  // NOT TO DO:
  // We don't want to have a parameter that directs to different spreadsheets, because
  // which form someone submits might be too much information -- better to handle that
  // in decryption
  console.log('GET', e, e.parameter.fielddata)
  if (e.parameter.fielddata) {
    appendToSpreadsheet(e.parameter.fielddata)
  }
  return ContentService
  .createTextOutput(JSON.stringify({"result":"success"}))
          .setMimeType(ContentService.MimeType.JSON);
  //return handleResponse(e);
}

//  Enter sheet name where data is to be written below
var SHEET_NAME = "Sheet1";

function appendToSpreadsheet(x) {
  //This is the Spreadsheet token in the url between /d/...../edit
  var doc = SpreadsheetApp.openById('1VmcE6WHkF_xWkhCiJGIBnwKF021LwnF7rkpfJlvtOOE');
  var sheet = doc.getSheetByName(SHEET_NAME);

  sheet.appendRow([x||'foobar']);
}
