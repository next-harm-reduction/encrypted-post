## Installation steps

### Setting up the pieces

1. Create a google spreadsheet where the encrypted submissions will go.
2. Rename the first Sheet1 => "Responses"
3. Copy the token inside the Spreadsheet url between /spreadsheets/d/ and /edit (note: withOUT the '/'s). It will probably be about 44 characters (numbers, letters, underscores).  We will call that the `SPREADSHEET_ID` and need it later.
3. Go to Tools->ScriptEditor, name the script (anything)
4. Choose menu: Publish -> Deploy as webapp, with *Execute As* as the spreadsheet owner and *Who has access*: "Anyone, event anonymous"
5. Click Deploy button, and copy the url for the app.  It will look like 'https://script.google.com/macros/s/....../exec'. We will call this the `SUBMIT_URL` and need it later.
6. Generate a Private/Public key pair as described in the [jsencrypt project](https://github.com/travist/jsencrypt#how-to-use-this-library) but we want 2048 keys.
   * Ideally you would do this step on a air-gapped laptop, and then copy the public key part from that laptop to another where you would do the encrypt build externally, but building and running the decrypt section would be done on the air-gapped laptop.
   * `openssl genrsa -out rsa_2048_priv.pem 2048`
   * `openssl rsa -pubout -in rsa_2048_priv.pem -out rsa_2048_pub.pem`

### Building the encrypt html

7. Assuming you have generated/copied the public key to the root of the project to a file called `rsa_2048_pub.pem` we will call that the `PUBLIC_KEY_FILE`
8. We now have three variables and (after running `npm install` if you haven't, to load the node/webpack modules) you now want to run (all on one line):
```
SPREADSHEET_ID=<YOUR SPREADSHEET_ID> SUBMIT_URL=<YOUR SUBMIT_URL> PUBLIC_KEY_FILE=<RELATIVE PATH TO PUBLIC_KEY> ./node_modules/.bin/webpack
```
and an example of what the command might look like is (FAKE):
```
SPREADSHEET_ID=20L466aa6uYM_YSbezDI0lkrXduKtB6eaM4YXSGJ7w78  SUBMIT_URL=https://script.google.com/macros/s/AKfycaz7sP8Gkr7xD7AGZSJUnOtrVi2vwxbgUFl05RAX4WqFUhH9dVI/exec PUBLIC_KEY_FILE=./rsa_2048_pub.pem  ./node_modules/.bin/webpack
```

ONLY if you are on the laptop with the private key, then you should also include `PRIVATE_KEY_FILE=./rsa_2048_priv.pem` just after the public key file variable is set.

9. The built files will be in a directory called `dist/`
10. Copy the contents of the file `./dist/encrypt/Code.gs` to the Google Script Editor
    * Click the Save icon at the top
    * Choose menu: Publish -> Deploy as webapp, then choose 'New' in project version and click 'Update'
    * The first time you deploy, Google may prompt you to accept permissions for read/write access to spreadsheets -- just follow the prompts.
11. Copy `./dist/encrypt/index.html` onto the website -- if you are using it with a different form, copy the javascript in `./dist/encrypt/main.js inline below the form contents`
12. Now is a good time to test your encrypted form.  In development you can use the quick-startup process in the Develpment section below and then visit [http://localhost:8000/dist/encrypt/](http://localhost:8000/dist/encrypt/)


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