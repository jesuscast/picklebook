#!/bin/bash

FILES_TO_PACKAGE="\
bin/* \
certs/**/* \
config/* \
lib/* \
mailer/**/* \
mailer/* \
middleware/* \
models/* \
public/**/* \
routes/* \
scripts/* \
test/**/* \
test/* \
views/* \
README.md \
UnifyIDPushDevProd.p12 \
app.js \
package.json \
sites.json \
clang-format.sh \
node_modules/*
"

EXTENSION_NAME="UnifyID-Server"

rm -rf dist/$EXTENSION_NAME dist/$EXTENSION_NAME.tar.gz
mkdir -p $EXTENSION_NAME
rsync -R $FILES_TO_PACKAGE $EXTENSION_NAME
tar cvzf $EXTENSION_NAME.tar.gz $EXTENSION_NAME
mv $EXTENSION_NAME.tar.gz  dist/$EXTENSION_NAME.tar.gz
mv $EXTENSION_NAME         dist/$EXTENSION_NAME