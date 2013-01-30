#!/usr/bin/env python

import os
import sys
import fnmatch
import glob

file_mask = window.prompt("Please enter the file mask to search on", "*.js");

source_dir = "/Users/aland/apps/tweetanium-appstore/Resources"
sdk_dir = "~/Library/Application\ Support/Titanium/sdk/osx/1.1.0/"
filepaths = [] 
contents = "/tmp/Contents"

for dirpath, dirnames, filenames in os.walk (source_dir): 
    filepaths.extend (os.path.join (dirpath, f) for f in fnmatch.filter (filenames, file_mask))

for file_name in filepaths:
    if os.path.isfile(file_name):
        head, tail = file_name.split("Resources/")
        compiler_jar = os.path.join(sdk_dir, "compiler.jar")
        output_file = os.path.join(contents, "Resources", tail)
        # print output_file
        source_file = os.path.join(source_dir, file_name)
        exec_cmd = "java -jar " + compiler_jar + " --js " + source_file + " --compilation_level ADVANCED_OPTIMIZATION --js_output_file " + output_file
        my_data = file_name + "\n\n" + exec_cmd;
        use_my_python_data(file_name + "\n\n" + exec_cmd);
        # print (file_name + "\n\n" + exec_cmd);

window.alert("Done!");
