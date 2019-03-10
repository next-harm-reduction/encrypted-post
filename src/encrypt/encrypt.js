import JSEncrypt from 'jsencrypt';
import pubKey from './key.pub.rsa';

require('./closestPolyfill');
require('./textEncoderPolyfill');

function encryptFormResponse(res) {
  const crypto = window.crypto || window.msCrypto;
  const initVector = window.crypto.getRandomValues(new Uint32Array(8));
  const jsEncrypt = new JSEncrypt();
  jsEncrypt.setPublicKey(pubKey);
  // https://www.w3.org/2012/webcrypto/draft-irtf-cfrg-webcrypto-algorithms-00#sctn-intro
  // https://github.com/diafygi/webcrypto-examples
  const genKey = crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt']);
  const genCipher = genKey.then((key) => {
    const encoder = new TextEncoder();
    const { buffer } = encoder.encode(JSON.stringify(res));
    return crypto.subtle.encrypt({
      name: 'AES-GCM',
      iv: initVector,
    },
    key,
    buffer);
  }).then((cipherTextBuffer) => {
    const typedBuffer = new Uint8Array(cipherTextBuffer);
    let binary = '';
    // syntax: using greater-than to avoid inline html parsing issues
    for (let i = 0; typedBuffer.byteLength > i; i += 1) {
      binary += String.fromCharCode(typedBuffer[i]);
    }
    return btoa(binary);
  });
  const genEncryptedKey = genKey.then(key => crypto.subtle.exportKey('raw', key)).then((serializedKey) => {
    const view = new Uint8Array(serializedKey);
    const stringifiedView = [];
    view.forEach((point) => {
      stringifiedView.push(point.toString());
    });
    return btoa(jsEncrypt.encrypt(JSON.stringify(stringifiedView)));
  });
  return Promise.all([genEncryptedKey, genCipher, Promise.resolve(initVector)]);
}

function sendXhr(valuesDict, successCallback, errCallback, baseUrl) {
  let url = baseUrl || SUBMIT_URL
  const urlArgs = []
  for (var a in valuesDict) {
    urlArgs.push(a + '=' + encodeURIComponent(valuesDict[a]))
  }
  const queryString = urlArgs.join('&')

  const x = new XMLHttpRequest();
  const method = 'POST'
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
  // const url = 'https://script.google.com/macros/s/AKfycby_k7iy8n9o2KQWLxrYC6VrRPYw6ssfi-ttx1nmnDw6GxZY9dVv/exec';
  const url = SUBMIT_URL
  console.log(SUBMIT_URL, GITHASH, 'IN FORM RESPONSE');

  return sendXhr({ key: encryptedKey,
                   fielddata: cipherText,
                   initVector: btoa(initVector.toString()),
                   gitHash: GITHASH,
                 },
                 null,
                 (err) => { console.log('request failed', err) })
}

function main() {
  const frm = document.forms.customer;
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
      const category = (ele.closest('fieldset') || {}).id
      if (category && res[category]) {
        res[category].push(ele.value);
      } else {
        res[category] = [ele.value];
      }
    } else {
      res[ele.name] = ele.value;
    }
  }
  frm.onsubmit = () => {
    const res = {};
    Array.from(frm.elements).forEach((ele) => {
      if (ele && isSet(ele)) {
        setValue(ele, res);
      }
    });
    encryptFormResponse(res).then(sendFormResponse).then(clearForm);
  };
}

main()
