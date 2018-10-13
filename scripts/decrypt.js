function decryptFormResponses(rows) {
    var decrypt = new JSEncrypt();
    decrypt.setPrivateKey('-----BEGIN RSA PRIVATE KEY-----'
                        +'MIIEpwIBAAKCAQIAvGIrYJvw1wXHi29KOay4r8pz1+bQQz3T8EhlprtI/7Tcclzr'
                        +'VpKfAlFkzSg+sR1IIP/4g/rmcbRmT7S1QS3A3vtol1sx7NcSuNd4iE2SbnLiD3ZS'
                        +'lQwk3CwThwS4clVC2uyHyUzR70G8q+GUH+rGhRUbdQd/CkGFSm3sm1GB8prY/y1V'
                        +'anTw+B3b+sThDA9QuiQAY7RpJkeUgxqTlinHsJVIVZO0RRf/vsb+YnU4yfCxLsnu'
                        +'IlAf+n36IQ9UzkyzGu2EqfwArRr4YfkZAUYXkAV8A3d9QMqoEpOBe/K2NirXCfpB'
                        +'BYAcWEm3BHzf2cSi6whIMCgzwPlA89zaXuYK1a0CAwEAAQKCAQEJvdXaaBX7OIxK'
                        +'FJY1B06BoKl+56urXn4gNc4z4glzV6nyrAVrc6ePWiApT8R2Kjp5omL6iDX0eUy1'
                        +'IHYjCbeokD2nXgrl4XVRY6sS+VfyKDSycf7xQDCDxi+4UrErEGelpIedDEDq625T'
                        +'QRYE1IIxjZbe5WVXZW38HFUY7w0WO5RDW1/HL3dl+S2bLgiBib+vQIWoD79pbzcd'
                        +'YTcYCtk0wFDneEPq+NuG1u2ToLr2ECHujdQWVe3HkEzMSBo3Z26xwwez0JvZlEVh'
                        +'wWbtPBot7IU43qJqknQ5EJOJkvdaAohP/qkettHaMAl6B67Ge965KtToJan7GxDc'
                        +'QTQ/WZwdTQKBgQ5So885qlROm02WISM563x8SF/68KctRsAcjDoZvebwAHugcx+4'
                        +'v0/Dn7AYDaiJ3+mBBEFPnyqIRg8P8yiZsODIdsL9WshHIv6uLQ91HO5Lym8/UhQM'
                        +'z21tuGYI89i/Jdp8YLXEv6d3tDTN8cG+lE1smEuvWJoczFbh4Jkxu24OewKBgQ0n'
                        +'FotcSH2VJYZIkQgbi0zNEDVTvARbdUTByBnJoEhr3PcGeCz3jXN/YxnTLnzG5Qso'
                        +'ilQ0NdKCmrH9x5uC0UufTq+h4ToLxDwF7HeicUTpYWmS1JAqUn3VhJH1L5fR+gJU'
                        +'a05D2nl8DPXbgeqm4uQu7dPwypreCM862MoCpiiH9wKBgQk47x9k2yc0Ak4gCDBd'
                        +'gCMFB7k9pK2QusjC2QwkPSIxka4I73gShqU+qllB87F9Lb92Ap5nPW6ulqXmOEUB'
                        +'SWJD0izV5BmnrIHe90bHuxw5kxy04g3k/b9RcfXJd/Itips3kTIZgOq9ajzCCxQc'
                        +'ufNspFe/jUaWmoCrKuqZmj1QdwKBgQpJK0RJIxey7+mYDnO8tq+VHrvVhBAURh1D'
                        +'Pm2MVKDOWbuFf64K2sAcOzATCyPhl3WmeqdnPUAnizrvMI7ZOzxclXicrDpswUX/'
                        +'i/HzQ4mUye16OmmT73cg59ANYu7j8xSnWFOYlN60uJ380Bjl8kJowO0iPg/m3BTT'
                        +'/H3enHrN+QKBgQbUCTTktBaKl3lFygzt+uF/mPzY/BKy3Nt/0/wBsMjcw3SKoC5w'
                        +'8YeqsMEj5HS6MbclkRxGJBywBUywLY2lWj+BsqPmhBKfwVsNbTxz0BIy7mFNSJDo'
                        +'nAKNNlsaX6zc7rAqDKNI4mgUEo4n86Eo2MkxOGyXlT90xQi4crCxIe4oNQ=='
                        +'-----END RSA PRIVATE KEY-----')
    function decryptRow(row) {
        var decryptedStringifiedView = JSON.parse(decrypt.decrypt(atob(row[0])));
        var view = decryptedStringifiedView.map(function (str) {
            return parseInt(str);
        });
        var keyBuff = new Uint8Array(view);
        var key = crypto.subtle.importKey('raw', keyBuff, "AES-GCM", false, ['decrypt']);
        var dataString = atob(row[1]);
        var dataBuffer = new Uint8Array(dataString.length);
        for (var i = 0; i < dataString.length; i++) {
            dataBuffer[i] = dataString.charCodeAt(i);
        }
        var iv = atob(row[2]).split(',').map(function (str) {
            return parseInt(str);
        });
        var ivBuffer = new Uint32Array(iv);
        return key.then(function (key) {
                return crypto.subtle.decrypt({
                       name: "AES-GCM",
                       iv: ivBuffer
                   },
                   key,
                   dataBuffer
                ).then(function (payload) {
                    var decoder = new TextDecoder;
                    return JSON.parse(decoder.decode(payload));
                });
            });
    }

    return Promise.all(rows.map(decryptRow));
    //    if (decrypted) {
    //      try {
    //        var cols = JSON.parse(decrypted);
    //      } catch(err) {
    //        continue;
    //      }
    //      var tr = document.createElement('tr');
    //      cols.map(function(c) {
    //         var td = document.createElement('td');
    //         //SECURITY: innerHTML would allow someone to submit malicious html
    //         td.innerText = c;
    //         tr.appendChild(td);
    //      })
    //      table.appendChild(tr);
    //    }
}

$(document).ready(function () {

    var upload = document.getElementById('encrypted')
    var table = document.getElementById('cryptoresults')

    upload.addEventListener('change', function(evt) {
        var reader = new FileReader()
        reader.onload = function(evt) {
           var rows = reader.result.split('\n').map(function (row) {
               return row.split(',');
           });
           rows.shift();
           var decryptedData = decryptFormResponses(rows).then(function (payload) {
              console.log(payload);
           });
        }
        reader.readAsBinaryString(evt.target.files[0])
    });
});
