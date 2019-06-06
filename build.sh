#!/bin/bash

SPREADSHEET_ID=1VmcE6WHkF_xWkhCiJGIBnwKF021LwnF7rkpfJlvtOOE
SUBMIT_URL=https://script.google.com/macros/s/AKfycbwe7OLOLtxAN_smlnNFyQWDqbjVVk9Vq76QwA0Cj8yiX4_SDS7Z/exec
PUBLIC_KEY_FILE=./rsa_2048_pub.pem
PRIVATE_KEY_FILE=./rsa_2048_priv.pem

./node_modules/.bin/webpack

