import $ from 'jquery';
import JSEncrypt from 'jsencrypt';

function decryptFormResponses(rows) {
  const decrypt = new JSEncrypt();
  decrypt.setPrivateKey();
  function decryptRow(row) {
    const decryptedStringifiedView = JSON.parse(decrypt.decrypt(atob(row[0])));
    const view = decryptedStringifiedView.map(str => parseInt(str, 10));
    const keyBuff = new Uint8Array(view);
    const fetchKey = crypto.subtle.importKey('raw', keyBuff, 'AES-GCM', false, ['decrypt']);
    const dataString = atob(row[1]);
    const dataBuffer = new Uint8Array(dataString.length);
    for (let i = 0; i < dataString.length; i += 1) {
      dataBuffer[i] = dataString.charCodeAt(i);
    }
    const iv = atob(row[2]).split(',').map(str => parseInt(str, 10));
    const ivBuffer = new Uint32Array(iv);
    return fetchKey().then(key => crypto.subtle.decrypt({
      name: 'AES-GCM',
      iv: ivBuffer,
    },
    key,
    dataBuffer).then((payload) => {
      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(payload));
    }).catch((err) => {
      console.log(err);
    }));
  }

  function displayResponses(rows) {
    const keyMap = rows.reduce((keys, row) => {
      Object.keys(row).forEach((key) => {
        if (!keys[key]) {
          keys[key] = true;
        }
      });
      return keys;
    }, {});
    const keys = Object.keys(keyMap).map(key => ({ data: key, title: key }));
    $('#results').DataTable({
      data: rows,
      columns: keys,
    });
    return rows;
  }
  return Promise.all(rows.map(decryptRow)).then(displayResponses);
}

$(document).ready(() => {
  const upload = document.getElementById('encrypted');
  upload.addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rows = reader.result.split('\n').map(row => row.split(','));
      rows.shift();
      decryptFormResponses(rows).then((payload) => {
        console.log(payload);
      });
    };
    reader.readAsBinaryString(e.target.files[0]);
  });
});
