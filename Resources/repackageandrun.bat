:packages everything in css folder, javascript folder and includes the index.html and package.json file
7za u package.zip css/* javascript/* images/* node_modules/* *.html package.json
:move and rename to package.nw in nw folder
copy /Y "package.zip" "./node-webkit-v0.4.2-win-ia32/package.nw"
:create mac bundle
copy /Y "package.zip" "./node-webkit.app/Contents/Resources/app.nw"
copy /Y "pw_icon.icns" "./node-webkit.app/Contents/Resources/app.icns"
:create the windows executable
cd node-webkit-v0.4.2-win-ia32
copy /b nw.exe+package.nw pw.exe
:run the package
:node-webkit-v0.4.2-win-ia32\nw.exe node-webkit-v0.4.2-win-ia32\package.nw
:or run the executable
cd ..
pw.exe.lnk