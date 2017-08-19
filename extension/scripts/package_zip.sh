#!/bin/bash

FILES_TO_PACKAGE="\
_locales/* \
manifest.json \
dist/*
"

rm -rf ./dist/*.map

EXTENSION_NAME="UnifyID-Chrome-Extension"

rm -rf $EXTENSION_NAME $EXTENSION_NAME.zip
mkdir -p $EXTENSION_NAME
rsync -rR $FILES_TO_PACKAGE $EXTENSION_NAME

rm -rf $EXTENSION_NAME/dist/*.map

(cd $EXTENSION_NAME && zip -qr -9 -X ../$EXTENSION_NAME.zip .)
