
pw.runtimes = (function(){
    var my = {}; //this is the object that will be returned. Anything inside of this will be publicly accessible

    //the script object
    var runtime = function(data){
        this.rid = data['rid'];
        this.path = data['path'];
        this.alias = data['alias'];
        this.sid = "";

        /*
		this.update = function(options){
            console.log('update called on script {0} updating column {1} to {2}'.format(this.sid, options.name, options.value));
			var sql = "UPDATE scripts SET {0} = '{1}' WHERE sid = {2}".format(options.name, options.value, this.sid);
            pw.db.execute(sql, function(t,r){
                //update self and hash object
                this[options.name] = options.value;
                //need to keep an eye on this hash object. If it get desynced it will be a tricky bug to track down ("why aren't my options updating?")
                script[this.sid] = this;
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
		
        this.remove = function(options){
            var sql = "DELETE FROM scripts where id={0}".format(this.id);
            pw.db.execute(sql, function(t,r){
                delete argumentHash[this.id];
                //TODO: DELETE ALL ARGUMENTS ASSOCIATED WITH THIS SCRIPT!
                if(typeof options.success == "function"){ //prevents the nasty error message if the function isn't passed
                    options.success(this);
                }
            },function(t,e){
                console.log("error when deleting the argument: {0}".format(JSON.stringify(e)));
                if(typeof options.error == "function"){ //prevents the nasty error message if the function isn't passed
                    options.error(e);
                }
            });
        }
		*/
    }

	/*
    //Gets a single runtime
    //options.id [required] corresponds to the sid in the scripts database table
    //options.success callback is passed the populated script object
    //options.error callback
    my.getScript = function(options){
        var sql = "SELECT * FROM scripts WHERE sid = {0}".format(options.id);
        if(options.id == undefined){
            console.log("id must be specified in options object when calling getScript()");
            if(typeof options.error == "function"){
                options.error(e);
            }
        }else{
            if(scriptHash[options.id]){ //attempt to get it locally first
                if(typeof options.success == "function"){
                    options.success(scriptHash[options.id]);
                }
            }else{
                //we have to get it from the database
                //first we need to get the script arguments so that we can add them to the script object
                getScriptArguments({
                    id: options.id,
                    success : function(argumentArray){
                        pw.db.execute(sql, function(transaction, results){
                            var myScript = null;
                            if(results.rows.length){
                                var item = results.rows.item(0);
                                myScript = new script(item);
                                //now that we have the script we can add in the arguments object we got previously
                                myScript.arguments = argumentArray;
                                scriptHash[myScript.id] = myScript;
                            }
                            if(typeof options.success == "function"){
                                options.success(myScript);
                            }
                        }, function(t, e){
                            console.log("error in getScript(): {0}".format(e.message));
                            if(typeof options.error == "function"){
                                options.error(e);
                            }
                        });
                    }
                })

            }
        }
    }
*/
    //Gets all runtimes from the database and packages each up as a runtime object
    //options.success callback is passed an object containing a key of 'runtimes' whose value is an array of runtime objects
    //options.error callback
    my.getAllRuntimes = function(options){
        var sql = "SELECT * FROM runtimes ORDER BY rid ASC",
        returnObj = {
            runtimes : [] //array of runtime objects to return
        };

		pw.db.execute(sql, function(transaction, results){
		//var runtimeResults = results; //store the script results
		console.log(results.rows.length + " runtimes retrieved");
		//create script objects out of each script
		if(results.rows.length){
			for(var i = 0; i < results.rows.length; i++){
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
	
	
    my.addRuntime = function(alias, path, onSuccess, onError){
        //regex to extract filename works for both \ and / file separators
        //var filename = path.replace(/^.*[\\\/]/, '');
        //just the file extension ex: jpg txt csv
        //var filetype = path.substr(path.lastIndexOf('.')+1, path.length);
        var sql = 'INSERT INTO runtimes (alias, path) VALUES("{0}", "{1}")'.format(alias, path);
        pw.db.execute(sql, onSuccess, onError);
    }

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