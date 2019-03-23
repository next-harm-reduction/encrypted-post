import JSEncrypt from 'jsencrypt';
import pubKey from 'PUBLIC_KEY_FILE';

require('./closestPolyfill');
require('./textEncoderPolyfill');

function encryptFormResponse(res) {
  var crypto = window.crypto || window.msCrypto;
  var initVector = window.crypto.getRandomValues(new Uint32Array(8));
  var jsEncrypt = new JSEncrypt();
  jsEncrypt.setPublicKey(pubKey);
  // https://www.w3.org/2012/webcrypto/draft-irtf-cfrg-webcrypto-algorithms-00#sctn-intro
  // https://github.com/diafygi/webcrypto-examples
  var genKey = crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt']);
  var genCipher = genKey.then(function(key) {
    var encoder = new TextEncoder();
    var { buffer } = encoder.encode(JSON.stringify(res));
    return crypto.subtle.encrypt({
      name: 'AES-GCM',
      iv: initVector,
    },
    key,
    buffer);
  }).then(function(cipherTextBuffer) {
    var typedBuffer = new Uint8Array(cipherTextBuffer);
    var binary = '';
    // syntax: using greater-than to avoid inline html parsing issues
    for (var i = 0; typedBuffer.byteLength > i; i += 1) {
      binary += String.fromCharCode(typedBuffer[i]);
    }
    return btoa(binary);
  });
  var genEncryptedKey = genKey
    .then(
      function(key) { return crypto.subtle.exportKey('raw', key)}
    ).then(
      function(serializedKey) {
        var view = new Uint8Array(serializedKey);
        var stringifiedView = [];
        view.forEach(function(point) {
          stringifiedView.push(point.toString());
        });
        return btoa(jsEncrypt.encrypt(JSON.stringify(stringifiedView)));
      }
    );
  return Promise.all([genEncryptedKey, genCipher, Promise.resolve(btoa(initVector.toString()))]);
}

function sendXhr(valuesDict, successCallback, errCallback, baseUrl) {
  var url = baseUrl || SUBMIT_URL
  var urlArgs = []
  for (var a in valuesDict) {
    urlArgs.push(a + '=' + encodeURIComponent(valuesDict[a]))
  }
  var queryString = urlArgs.join('&')

  var x = new XMLHttpRequest();
  var method = 'POST'
  if (method === 'POST') {
    x.open(method, url, true);
  } else if (method === 'GET') {
    x.open(method, url + '?' + queryString, true);
  }
  if (successCallback) {
    x.onreadystatechange = function(b) {
      if (x.readyState >= 2) { successCallback(x) }
    }
  }
  if (errCallback) {
    x.onerror = function(err){ errCallback(err, x) }
  }
  if (method === 'POST') {
    x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    x.send(queryString)
  } else if (method === 'GET') {
    x.setRequestHeader('Content-Type', 'text/plain')
    x.send();
  }
  return x
}

function sendFormResponse([encryptedKey, cipherText, initVector]) {
  // var url = 'https://script.google.com/macros/s/AKfycby_k7iy8n9o2KQWLxrYC6VrRPYw6ssfi-ttx1nmnDw6GxZY9dVv/exec';
  var url = SUBMIT_URL
  console.log(SUBMIT_URL, GITHASH, 'IN FORM RESPONSE');

  return sendXhr({ key: encryptedKey,
                   fielddata: cipherText,
                   initVector: initVector,
                   gitHash: GITHASH,
                 },
                 null,
                 function(err) { console.log('request failed', err) })
}
window.encryptDestination = { sendFormResponse: sendFormResponse }
function main() {
  var frm = document.forms.customer;
  function clearForm() {
    if (window.confirm('Your request has been received. Do you want to clear local data?')) {
      frm.reset();
    }
  }
  function isSet(ele) {
    if (!ele.name) {
      return false;
    }
    if (ele.type === 'radio' || ele.type === 'checkbox') {
      return ele.checked;
    }
    return ele.value !== '';
  }
  function setValue(ele, res) {
    if (ele.type === 'checkbox') {
      var category = (ele.closest('fieldset') || {}).id
      if (category && res[category]) {
        res[category].push(ele.value);
      } else {
        res[category] = [ele.value];
      }
    } else {
      res[ele.name] = ele.value;
    }
  }
  frm.onsubmit = function() {
    var res = {};
    Array.from(frm.elements).forEach(function(ele) {
      if (ele && isSet(ele)) {
        setValue(ele, res);
      }
    });
    encryptFormResponse(res).then(encryptDestination.sendFormResponse).then(clearForm);
  };
}
main()
