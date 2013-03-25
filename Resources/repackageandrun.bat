:packages everything in css folder, javascript folder and includes the index.html and package.json file
7za u package.zip css/* javascript/* images/* *.html package.json
:move and rename to package.nw in nw folder
move /Y package.zip ./node-webkit-v0.4.2-win-ia32/package.nw
:run the package
node-webkit-v0.4.2-win-ia32\nw.exe node-webkit-v0.4.2-win-ia32\package.nw