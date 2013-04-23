/*
Object assciated with the Runtimes, that is the intreperter of any given language. Example: python.exe is the Runtime needed to execute python scripts
*/
pw.runtimes = (function(){
    var my = {}; // this is the object that will be returned. Anything inside of this will be publicly accessible
				 // for example anything below that is my.Something can be accessed from any other file.
				 // So if you want to get a list of all runtimes in the Settings.view page you would call pw.runtimes.getAllRuntimes(options)
				 // details of what needs to be passed in the options objects is specified below

    //the runtime object. This is private, but is the object returned by all the calls below
	//anytime you get a runtime it will be packaged in this object
    var runtime = function(data){
        this.rid = data['rid'];
        this.path = data['path'];
        this.alias = data['alias'];
        this.sid = "";

		//allows the runtime to be updated directly from the object
        this.update = function(options){
            console.log('update called on runtimes {0} updating column {1} to {2}'.format(this.rid, options.name, options.value));
            var sql = "UPDATE runtimes SET {0} = '{1}' WHERE rid = {2}".format(options.name, options.value, this.rid);
            pw.db.execute(sql, function(t,r){
                //update self and hash object
                this[options.name] = options.value;
                if(typeof options.success == "function"){ //prevents the nasty error message if the function isn't passed
                    options.success();
                }
            },function(t,e){
                console.log("error when updating the argument value: {0}".format(JSON.stringify(e)));
                if(typeof options.error == "function"){ //prevents the nasty error message if the function isn't passed
                    options.error(e);
                }
            });
        }
    }


    //Gets a single runtime
    //options.id [required] corresponds to the rid in the runtimes database table
    //options.success callback is passed to the populated runtime object
    //options.error callback
    my.getRuntime = function(options){
        var sql = "SELECT * FROM runtimes WHERE rid = {0}".format(options.id);
        if(options.id == undefined){
            console.log("id must be specified in options object when calling getRuntime()");
            if(typeof options.error == "function"){
                options.error(e);
            }
        }else{
            //we have to get it from the database
            pw.db.execute(sql, function(transaction, results){
                var myRuntime = null;
                if(results.rows.length){
                    var item = results.rows.item(0);
                    myRuntime = new runtime(item);
					if(typeof options.success == "function"){
						options.success(myRuntime);
					}
                }else{
					//if someone is trying to use a script before a runtime is chosen for it, prompt them to set one before preceeding
					alert("You need to Choose a Runtime for this script before running it!\n1)Go to Menu->Scripts\n2)Click " +options.name+ "\n3) Choose Runtime\n");
				}

            }, function(t, e){
                console.log("error in getScript(): {0}".format(e.message));
                if(typeof options.error == "function"){
                    options.error(e);
                }
            });
        }
    }

    //Gets all runtimes from the database and packages each up as a runtime object
    //options.success callback is passed an object containing a key of 'runtimes' whose value is an array of runtime objects
    //options.error callback
    my.getAllRuntimes = function(options){
        var sql = "SELECT * FROM runtimes ORDER BY rid ASC",
            returnObj = {
                runtimes : [] //array of runtime objects to return
            };

        pw.db.execute(sql, function(transaction, results){
            console.log(results.rows.length + " runtimes retrieved");
            //create script objects out of each script
            if(results.rows.length){
                for(var i = 0; i < results.rows.length; i++){
                    //this is where the private runtime object from above is being used
					//it is creating a runtime object based on the results of the DB call
					var newRuntime = new runtime(results.rows.item(i));
                    returnObj.runtimes.push(newRuntime);
                }
            }
            if(typeof options.success == "function"){
                options.success(returnObj);
            }
        }, function(t, e){
            console.log("error in getAllRuntimes(): {0}".format(e.message));
            if(typeof options.error == "function"){
                options.error(e);
            }
        });
    }

	//add a Runtime to the DB when a new one is added in the settings page
	//alias is the name of the file such as text.txt and path is the full path such as C:\Users\Test\test.txt
    my.addRuntime = function(alias, path, onSuccess, onError){
        var sql = 'INSERT INTO runtimes (alias, path) VALUES("{0}", "{1}")'.format(alias, path);
        pw.db.execute(sql, onSuccess, onError);
    }

	//Delete a runtime based on the rid which is short for RUNTIMEid
    my.deleteRuntime = function(rid, onSuccess, onError){
        iRid = parseInt(rid);
        if(iRid >= 0 && iRid){
            var sql = "DELETE FROM runtimes WHERE rid={0}".format(rid);
            pw.db.execute(sql, onSuccess, onError);
        }else{
            console.log("runtime ID {0} is not a positive integer.".format(rid));
        }
    }

    return my;
}());