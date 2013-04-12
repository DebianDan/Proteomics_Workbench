:packages everything in css folder, javascript folder and includes the index.html and package.json file
7za u package.zip css/* javascript/* images/* *.html package.json
:move and rename to package.nw in nw folder
copy /Y "package.zip" "./node-webkit-v0.4.2-win-ia32/package.nw"
copy /Y "package.zip" "./node-webkit.app/Contents/Resources/app.nw"
copy /Y "pw_icon.icns" "./node-webkit.app/Contents/Resources/app.icns"
:run the package
node-webkit-v0.4.2-win-ia32\nw.exe node-webkit-v0.4.2-win-ia32\package.nw