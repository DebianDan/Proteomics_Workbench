//see: https://github.com/rogerwang/node-webkit/wiki/Shell
var gui = require('nw.gui');
    //see: http://nodejs.org/api/child_process.html
    spawn = require('child_process').spawn,
    //see: http://nodejs.org/api/path.html
    path = require('path'),
    //see: https://github.com/isaacs/minimatch
    minimatch = require("minimatch"),
    //see: http://nodejs.org/api/fs.html
    fs = require('fs'),
    //define our proteomics workbench namespace to hold all of our stuff
    pw = {};

