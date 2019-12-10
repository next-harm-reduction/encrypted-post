#!/bin/bash

cd "$(dirname "$0")"
DATE=$(date +'%Y-%m-%d-%H:%M:%S')
SUBMIT_URL=https://script.google.com/macros/s/AKfycbwe7OLOLtxAN_smlnNFyQWDqbjVVk9Vq76QwA0Cj8yiX4_SDS7Z/exec

mkdir -p old_keys

openssl genrsa -out old_keys/rsa_2048_${DATE}_priv.pem 2048
openssl rsa -pubout -in old_keys/rsa_2048_${DATE}_priv.pem -out old_keys/rsa_2048_${DATE}_pub.pem

# copy the new public file locally to make it clear which one is current
cp old_keys/rsa_2048_${DATE}_pub.pem rsa_2048_pub.pem

# aggregate all the private keys into one file so it can be built to decrypt both with old and new keys
cat old_keys/*_priv.pem > rsa_2048_priv.pem

# upload the public key replacing the '+' which urlencodes as a space, but needs to stay a '+'
curl -v -X POST -d"date=$DATE"'&'"publicKey=$(cat ./rsa_2048_pub.pem|sed -e 's/\+/%2B/g'||tr -d '\n')" $SUBMIT_URL
