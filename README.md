## Installation steps

### Project setup

1. Create a google spreadsheet where the encrypted submissions will go.
2. Rename the first tab in the spreadsheet Sheet1 => "Responses"
3. From the Spreadsheet url in your browser copy the identifier between `/spreadsheets/d/` and `/edit` (*note: **without** the '/'s*). It will be ~44 characters including numbers, letters and underscores.  This is the `SPREADSHEET_ID` configuration variable, we'll need it later.
3. Choose menu: Tools -> ScriptEditor.  Name the script (anything)
4. Choose menu: Publish -> Deploy as webapp.  Set *Execute As* -> spreadsheet owner and *Who has access* -> "Anyone, even anonymous"
5. Press Deploy.  Copy the url for the app.  It will look like: 'https://script.google.com/macros/s/....../exec'. This is the `SUBMIT_URL` config variable, we'll need it later.
6. Generate a Private/Public key pair as described in the [jsencrypt](https://github.com/travist/jsencrypt#how-to-use-this-library) project.  2048-bit keys are presumed in the example in this README.
   * _Note: Generating keys on an air-gapped laptop is recommended, along with building and running the decrypt section of it project.  You could use an online laptop to build the wider project (see step #8) and run the encrypt section of the project._
   * `openssl genrsa -out rsa_2048_priv.pem 2048`
   * `openssl rsa -pubout -in rsa_2048_priv.pem -out rsa_2048_pub.pem`

### Building the encrypt tool

7. Run `npm install` if you haven't done so to load the node/webpack modules.
8. We'll assume you generated/copied the public key to the root of the project to a file `rsa_2048_pub.pem`. This is `PUBLIC_KEY_FILE` in the config.  We now have three variables to input to our build command.  Run the following command all on line line:
```
SPREADSHEET_ID=<YOUR SPREADSHEET_ID> SUBMIT_URL=<YOUR SUBMIT_URL> PUBLIC_KEY_FILE=<RELATIVE PATH TO PUBLIC_KEY> ./node_modules/.bin/webpack
```

ONLY if you are on the laptop with the private key, then you should also include `PRIVATE_KEY_FILE=./rsa_2048_priv.pem` just after the public key file variable is set.

Example of what the full command might look like:
```
SPREADSHEET_ID=20L466aa6uYM_YSbezDI0lkrXduKtB6eaM4YXSGJ7w78  SUBMIT_URL=https://script.google.com/macros/s/AKfycaz7sP8Gkr7xD7AGZSJUnOtrVi2vwxbgUFl05RAX4WqFUhH9dVI/exec PUBLIC_KEY_FILE=./rsa_2048_pub.pem PRIVATE_KEY_FILE=./rsa_2048_priv.pem ./node_modules/.bin/webpack
```
9. The built files will be in a directory called `dist/`
10. Copy the contents of the file `./dist/encrypt/Code.gs` to the Google Script Editor (Tools -> ScriptEditor)
    * Press Save (icon at the top)
    * Choose menu: Publish -> Deploy as webapp.  Choose 'New' in project version and click 'Update'
    * On your first deploy, Google may prompt you to accept permissions for read/write access to spreadsheets -- follow the prompts.
11. Copy `./dist/encrypt/index.html` to your user-facing website.  If you are using a form generated from a CMS or platform like Squarespace, copy the javascript in `./dist/encrypt/main.js` and paste it inline below the form contents
12. Time to test your encrypted form.  In development you can use the quick-startup process in the Develpment section below and then visit [http://localhost:8000/dist/encrypt/](http://localhost:8000/dist/encrypt/)


## Decrypting

1. Visit the google spreadsheet and File->Download as CSV
2. Copy that to the air-gapped laptop by USB or wherever you have the decrypt.html file
3. In a web browser File->Open ./dist/decrypt/index.html wherever it lives on the computer
4. Click upload, and choose the downloaded csv file -- the browser will display the decrypted contents


## Development
1. For a quick startup,
    ````
    python -m SimpleHTTPServer
    ````
    from this directory.

2. When you have made changes, run `webpack` (possibly as `./node_modules/.bin/webpack`)
   which deploys changes in ./src to ./dist however the project tracks the ./testdist directory
   There are some important environment variables that control webpack's build.

## Browser compatibility

Webpacked config still uses some 'old-modern' javascript browser features.
This project targets compatibility with Internet Explorer 10+

Features used for the encrypt part:

* [btoa](https://caniuse.com/#feat=atob-btoa) (Base64 encoding and decoding)
* [xmlhttprequest2](https://caniuse.com/#feat=xhr2) fails for IE9, but IE10+ is ok. Note that Google Script Api did [not always support x-domain requests](https://ctrlq.org/code/20197-jquery-ajax-call-google-script), but they appear to now.
* [cors xmlhttprequest](https://caniuse.com/#feat=cors) requires polyfill for IE9, but IE10+ is ok
* [querySelector](https://caniuse.com/#feat=queryselector) We avoid jQuery as a dependency for universal deployment but thus need querySelector
* [Array.forEach](https://caniuse.com/#feat=es5) began support in IE10

Features avoided:
* [Promises](https://caniuse.com/#feat=promises) are not available in pre-Edge Trident Internet Explorers including 10-11
* [TextEncoder](https://caniuse.com/#feat=textencoder) is unavailable in IE 10-11, so we add a polyfill
* [Arrow functions](https://caniuse.com/#feat=arrow-functions) are unsupported in IE 10-11
* [Const/Let declarations](https://caniuse.com/#feat=const) are unsupported in IE10

## Multiple Key support

Both the PRIVATE_KEY_FILE and PUBLIC_KEY_FILE can support multiple keys.
For the PRIVATE_KEY_FILE, just append the keys together (leaving the begin/end `------BEGIN RSA.....----` lines in).

For the PUBLIC_KEY_FILE, the first key is the default.
After that, subsequent keys should be prefixed with a line like
```
OPTION=State:CA
```
Which means if someone fills in field with name="State" and the value is "CA" then we should use this public key.

