#!/bin/bash

DATE=$(date +'%Y-%m-%d')
SUBMIT_URL=https://script.google.com/macros/s/AKfycbwe7OLOLtxAN_smlnNFyQWDqbjVVk9Vq76QwA0Cj8yiX4_SDS7Z/exec

mkdir -p old_keys
mv rsa_2048_pub.pem old_keys/rsa_2048_${DATE}_pub.pem
mv rsa_2048_priv.pem old_keys/rsa_2048_${DATE}_priv.pem

openssl genrsa -out rsa_2048_priv.pem 2048
openssl rsa -pubout -in rsa_2048_priv.pem -out rsa_2048_pub.pem

curl -v -X POST -d"date=$DATE"'&'"publicKey=$(cat ./rsa_2048_pub.pem||tr -d '\n')" $SUBMIT_URL
