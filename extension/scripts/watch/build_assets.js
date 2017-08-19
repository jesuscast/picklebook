#!/usr/bin/env node
'use strict'

// Requires.
const chokidar = require('chokidar');
const fs = require('fs');
var Rsync = require('rsync');

if(!fs.existsSync('./dist/assets')) {
  fs.mkdirSync('./dist/assets');
}

/**
* Listen for changes in static files.
*/
let staticPaths = [
  './src/js/modals/app/components/dashboard/partials',
  './src/js/modals/app/components/dashboard/templates',
  './src/js/modals/app/components/registration/partials',
  './src/js/modals/app/components/registration/templates',
  './src/js/modals/app/components/overlay',
  './src/js/modals/challenge-ui',
  './src/js/modals/app/shared/templates',
  './src/js/action_script/html'
];

const flatten = arr => arr.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);

let allStaticFiles = staticPaths.map((path) => {
  return fs.readdirSync(path).map((fileValue) => {
    return path+'/'+fileValue;
  });
});

allStaticFiles = flatten(allStaticFiles);

function processStaticFileChange(path) {
  let components = path.split('/');
  let fileName = components[components.length - 1];
  fs.createReadStream(path).pipe(fs.createWriteStream(`dist/assets/${ fileName }`));
  console.log('File', path, 'has been added');
}
let fileSystemWatcher = chokidar.watch('/src/js/modals/challenge-ui', {
  ignored: /[\/\\]\./, persistent: false
}).add(allStaticFiles).on('add', processStaticFileChange);

/**
* Copy libs and images.
*/
const dirsToCopy = ['images', 'libs'];

let rsync_procs = dirsToCopy.map((dir) => {
  return new Rsync()
    .shell('ssh')
    .flags('r')
    .source(`./src/${ dir }`)
    .destination(`./dist`);
});

rsync_procs.forEach((proc) => {
  proc.execute(function(err, code, cmd) {
    if(err) {
      console.log(err);
      return;
    }
    console.log('Code :'+code);
    console.log(cmd);
  });
});