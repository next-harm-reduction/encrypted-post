/* eslint-disable */
// From a google spreadsheet open Tools->ScriptEditor and paste this in

function doPost(e){
  // TODO:
  // 1. Test the origin/referrer domain
  // NOT TO DO:
  // We don't want to have a parameter that directs to different spreadsheets, because
  // which form someone submits might be too much information -- better to handle that
  // in decryption
  var params = [
      "key",
      "fielddata",
      "initVector",
      "gitHash"
  ];
  var data = e.parameter;
  /*
  params.forEach(function(p) {
     if ((data[p]) === null || data[p] === '') {
         throw "Missing required field: {0}".format(p);
     }
  });
  */
  appendToSpreadsheet(data.key, data.fielddata, data.initVector, data.gitHash);
  return ContentService
    .createTextOutput(JSON.stringify({'foo': 'success'}))
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

// JSONP for CORS workaround
// https://ctrlq.org/code/20197-jquery-ajax-call-google-script
doGet = doPost


//  Enter sheet name where data is to be written below
var SHEET_NAME = "Responses";
function appendToSpreadsheet(key, fieldata, initVector, gitHash) {
  //This is the Spreadsheet token in the url between /d/...../edit
  var doc = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = doc.getSheetByName(SHEET_NAME);

  sheet.appendRow([key, fieldata, initVector, gitHash]);
}
