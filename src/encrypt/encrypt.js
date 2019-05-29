import JSEncrypt from 'jsencrypt';
import pubKey from 'PUBLIC_KEY_FILE';

require('./closestPolyfill');
require('./textEncoderPolyfill');

function encryptFormResponse(res, passedData) {
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
  return Promise.all([genEncryptedKey,
                      genCipher,
                      Promise.resolve(btoa(initVector.toString())),
                      Promise.resolve(passedData)]);
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

function generateEnrollmentCode() {
  var char32 = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  var getChar = function() { return char32[parseInt(Math.random() * 32, 0)] }
  return getChar() + getChar() + getChar() + getChar() + getChar() + getChar()
}

function fakeFill() {
  Array.from(document.forms.customer).forEach(function(ele) {
    if (ele.tagName.toLowerCase() === 'select') {
      // random option
      var options = ele.getElementsByTagName('option')
      for (var i=0, l=options.length; l>i; i++) {
        if (options[i].value) {
          options[i].selected = true
          break
        }
      }
    } else if (ele.type === 'checkbox') {
      // ignore
    } else if (ele.type === 'radio') {
      ele.checked = true // will end up selecting last one for all
    } else if (ele.type === 'date') {
      ele.value = String(1950 + parseInt( Math.random() * 60 )) + '-01-01'
    } else if (ele.tagName.toLowerCase() == 'input' && ele.type != 'submit') {
      if (ele.pattern) {
        // hopefully zipcode
        ele.value = '11111'
      } else {
        ele.value = generateEnrollmentCode()
      }
    }
  })
}

function sendFormResponse([encryptedKey, cipherText, initVector, passedData]) {
  var url = SUBMIT_URL

  return sendXhr({ key: encryptedKey,
                   fielddata: cipherText,
                   initVector: initVector,
                   gitHash: GITHASH,
                 },
                 function(retval) {
                   if (passedData && passedData.success) {
                     passedData.success(passedData, retval)
                   }
                 },
                 function(err) {
                   console.log('request failed', err)
                   if (passedData && passedData.error) {
                     passedData.error(passedData, err)
                   }
                 })
}
window.encryptDestination = { sendFormResponse: sendFormResponse,
                              fakeFill: fakeFill }
function main() {
  var frm = document.forms.customer;
  function clearForm(passedData) {
    var confirmMessage = ['Your request has been received.',
                          'Do you want to clear local data?']
    var enrollmentCode = (passedData && passedData.enrollmentCode)
    if (enrollmentCode) {
      confirmMessage.splice(1, 0, 'Your enrollment code is ' + enrollmentCode + '.')
    }
    if (window.confirm(confirmMessage.join(' '))) {
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
    if (String(ele.tagName).toLowerCase() === 'select') {
      // this is a lie, but we resolve it in setValue
      return true
    }
    return ele.value !== '';
  }
  function setValue(ele, res) {
    if (ele.type === 'checkbox') {
      if (ele.name) {
        res[ele.name] = ele.checked ? ele.value : ''
      } else {
        var category = (ele.closest('fieldset') || {}).id
        console.log('checkbox category', category, ele.value, res[category])
        if (category && res[category]) {
          res[category].push(ele.value);
        } else {
          res[category] = [ele.value];
        }
      }
    } else if (String(ele.tagName).toLowerCase() === 'select') {
      if (ele.value) {
        res[ele.name] = ele.value
        return
      }
      var options = ele.getElementsByTagName('option')
      for (var i=0,l=options.length; l > i; i++) {
        if (options[i].selected && options[i].value) {
          res[ele.name] = options[i].value
        }
      }
    } else {
      res[ele.name] = ele.value;
    }
  }
  if (frm) {
    frm.onsubmit = function() {
      var res = {};
      Array.from(frm.elements).forEach(function(ele) {
        if (ele && isSet(ele)) {
          setValue(ele, res);
        }
      });
      res['Submitted At'] = (new Date()).toISOString().substring(0, 10)
      res['Enrollment Code'] = 'E-' + generateEnrollmentCode()
      encryptFormResponse(res, {
        enrollmentCode: res['Enrollment Code'],
        success: clearForm,
        error: function(passedData, err) {
          alert('Your form submission failed. Please return to the form later and try again.')
        }
      })
        .then(encryptDestination.sendFormResponse)
    };
  }
}
main()
