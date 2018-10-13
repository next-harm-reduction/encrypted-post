// From a google spreadsheet open Tools->ScriptEditor and paste this in

// original from: http://mashe.hawksey.info/2014/07/google-sheets-as-a-database-insert-with-apps-script-using-postget-methods-with-ajax-example/
// original gist: https://gist.github.com/willpatera/ee41ae374d3c9839c2d6

// JSONP for CORS workaround
// https://ctrlq.org/code/20197-jquery-ajax-call-google-script
function doGet(e){
  // TODO:
  // 1. Test the origin/referrer domain
  // NOT TO DO:
  // We don't want to have a parameter that directs to different spreadsheets, because
  // which form someone submits might be too much information -- better to handle that
  // in decryption
  if (!e.parameter.fielddata || !e.parameter.key || !e.parameter.initVector) {
      throw "Missing required field, either 'key' or 'fielddata'";
  }
  appendToSpreadsheet(e.parameter.key, e.parameter.fielddata, e.parameter.initVector);
  return ContentService
  .createTextOutput(e.parameter.callback + "('success')")
  .setMimeType(ContentService.MimeType.JAVASCRIPT);
  //return handleResponse(e);
}

//  Enter sheet name where data is to be written below
var SHEET_NAME = "Responses";

function appendToSpreadsheet(key, fieldata, initVector) {
  //This is the Spreadsheet token in the url between /d/...../edit

  // DEBUG
  var doc = SpreadsheetApp.openById('1FyKBMiKmMvKu8QtHakIu0Ih1Mt0cjSD-xvvTLJdYQn0');
  // var doc = SpreadsheetApp.openById('1VmcE6WHkF_xWkhCiJGIBnwKF021LwnF7rkpfJlvtOOE');
  var sheet = doc.getSheetByName(SHEET_NAME);

  sheet.appendRow([key, fieldata, initVector]);
}
