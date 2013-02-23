/**
* Copyright (c) 2012 Software in the Public Interest (SPI) Inc.
* Copyright (c) 2012 David Pratt
* 
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*	http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
**/

// create and set menu
var menu = Ti.UI.createMenu(),
fileItem = Ti.UI.createMenuItem('File'),
exitItem = fileItem.addItem('Exit', function() {
  if (confirm('Are you sure you want to quit?')) {
    Ti.App.exit();
  }
});

menu.appendItem(fileItem);
Ti.UI.setMenu(menu);

//Create a callback function for the notification
var doSomething = function() {
    var myScript = Ti.Process.createProcess({
           args:['python',Ti.API.application.resourcesPath + "/test.py"]
	});

	myScript.setOnExit(function(){
		alert("This was triggered on Exit.");
	});
	   
	//Launches the process  
	myScript.launch();
	//var test = myScript.getStdout();
	//alert(test);
	//can poll to see if the process is running by isRunning().
	console.log("Python Script Finished Running");
}


//Creating a notification and displaying it.
var notification = Ti.Notification.createNotification({
    'title' : 'Notification from App',
    'message' : 'Click here for updates!',
    'timeout' : 0,
    'callback' : doSomething
    //'icon' : 'app://images/notificationIcon.png'        
});

var notification2 = Ti.Notification.createNotification({
    'title' : 'Hey',
    'message' : 'updates!',
    'timeout' : 0,
    'callback' : doSomething
    //'icon' : 'app://images/notificationIcon.png'        
});

notification.show();
//notification2.show();