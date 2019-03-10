/* eslint-disable */
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
  var params = [
      "key",
      "fielddata",
      "initVector",
      "gitHash"
  ];
  var data = e.parameter;
  params.forEach(function(p) {
     if ((data[p]) === null || data[p] === '') {
         throw "Missing required field: {0}".format(p);
     }
  });
  var enrollmentCode =
    [
        Math.random().toString(36).substr(2, 3),
        Math.random().toString(36).substr(2, 3),
    ].join('-').toUpperCase();

  appendToSpreadsheet.apply(
      null,
      params.map(function (p) {
         return data[p];
     }).concat([enrollmentCode])
  );
  return ContentService
  .createTextOutput(e.parameter.callback + "({0})".format(enrollmentCode))
  .setMimeType(ContentService.MimeType.JAVASCRIPT);
  //return handleResponse(e);
}

//  Enter sheet name where data is to be written below
var SHEET_NAME = "Responses";

function appendToSpreadsheet(key, fieldata, initVector, gitHash, enrollmentCode) {
  //This is the Spreadsheet token in the url between /d/...../edit

  // DEBUG
  var doc = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = doc.getSheetByName(SHEET_NAME);


  sheet.appendRow([key, fieldata, initVector, gitHash, enrollmentCode]);
}
