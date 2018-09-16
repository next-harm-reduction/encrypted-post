## Installation steps

1. Create a google spreadsheet where the encrypted submissions will go.
2. Go to Tools->ScriptEditor and paste in `Code.gs` content
3. Edit the bottom where the Spreadsheet url token is and put the token of the spreadsheet
4. Publish -> Deploy as webapp, with *Execute As* as the spreads    heet owner and *Who has access*:Anyone
5. Copy the Current web app url for a later step (Step 7)
6. Generate a Private/Public key pair as described in the jsencrypt project:
   * From here: [https://github.com/travist/jsencrypt#how-to-use-this-library](https://github.com/travist/jsencrypt#how-to-use-this-library)
   * Ideally you would do this step on a air-gapped laptop, and then copy the public key part from that laptop to
     another where you would do step 7, but Step 8 would be done on the air-gapped laptop.
7. Edit index.html:
   * Replace the public key at the bottom of index.html with the generated public key.
   * Change the script.google.com url at the bottom with the one copyied from Step 5.
     Append the current suffix so that the line still ends with ?fielddata=`';`
8. Edit decrypt.html:
   * Replace the private key in the file with the one generated.
9. Adjust and install the index.html somewhere on the web.

## Decrypting

1. Visit the google spreadsheet and File->Download as CSV
2. Copy that to the air-gapped laptop by USB or wherever you have the decrypt.html file
3. In a web browser File->Open decrypt.html wherever it lives on the computer
4. Click upload, and choose the downloaded csv file -- the browser will display the decrypted contents


## Development
1. For a quick startup,
    ````
    python -m SimpleHTTPServer
    ````
    from this directory.
