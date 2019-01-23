import $ from 'jquery';
import JSEncrypt from 'jsencrypt';
import pubKey from './key.pub.rsa';

require('./textEncoder');

function encryptFormResponse(res) {
  const crypto = window.crypto || window.msCrypto;
  const initVector = window.crypto.getRandomValues(new Uint32Array(8));
  const jsEncrypt = new JSEncrypt();
  jsEncrypt.setPublicKey(pubKey);
  // https://www.w3.org/2012/webcrypto/draft-irtf-cfrg-webcrypto-algorithms-00#sctn-intro
  // https://github.com/diafygi/webcrypto-examples
  const genKey = crypto.subtle.generateKey({
    name: 'AES-GCM',
    length: 256,
  },
  true,
  ['encrypt', 'decrypt']);
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
    for (let i = 0; i < typedBuffer.byteLength; i += 1) {
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

function sendFormResponse([encryptedKey, cipherText, initVector]) {
  // DEBUG URL
  const url = 'https://script.google.com/macros/s/AKfycby_k7iy8n9o2KQWLxrYC6VrRPYw6ssfi-ttx1nmnDw6GxZY9dVv/exec';
  //   var url = 'https://script.google.com/macros/s/AKfycbwe7OLOLtxAN_smlnNFyQWDqbjVVk9Vq76QwA0Cj8yiX4_SDS7Z/exec';
  $.ajax(url, {
    dataType: 'jsonp',
    data: {
      key: encryptedKey,
      fielddata: cipherText,
      initVector: btoa(initVector.toString()),
    },
  })
    .fail((err) => {
      console.error(err);
    });
}

$(document).ready(() => {
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
      const category = $(ele).closest('fieldset').attr('id');
      if (res[category]) {
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
});
