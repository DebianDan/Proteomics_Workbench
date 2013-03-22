
pw.scripts = (function(){
    var my = {}; //this is the object that will be returned. Anything inside of this will be publicly accessible

    var scriptHash = {}; //store the scripts after they're generated
    var argumentHash = {}; //store the arguments after they're generated

    //the script object
    var Script = function(){

        this.properties = {
            sid : 0,
            path : "",
            alias : "",
            date_created : "",
            arguments : ["not initialized"]
        }

        //the initialize function. populates the properties object and gets the arguments
        this.create = function(options, success, error){
            //console.log("DEBUG: in create function of project, options is: {0}".format(JSON.stringify(options)));
            $.extend(this.properties, options); //copy data into properties
            this.properties.assets = new Array(); //clear out 'not_initialized' message in array
            //get the assets for this project, assign to the internal array, then finally call supplied success callback
            var self = this;
            //use call to force the context of the function to be this object (first argument = context)
            this.getArguments.call(self, function(argumentsArray){
                if(typeof success == "function"){
                    self.properties.arguments = argumentsArray;
                    success(self);
                }
            }, function(e){
                if(typeof error == "function"){
                    error(e);
                }
            });
        }

        //ensures that the newest copy of the arguments are retrieved (from the database)
        this.getArguments = function(success, error){
            if (this.properties.sid > 0) {
                var sql = "SELECT * from arguments where sid = {0}".format(options.id);
                pw.db.execute(sql, function (t, results) {
                    var argArray = [];
                    if (results.rows.length) {
                        for (var i = 0; i < results.rows.length; i++) {
                            var item = results.rows.item(i);
                            myArgument = new argument(item);
                            argArray.push(myArgument);
                        }
                        if(typeof success == "function"){
                            success(argArray);
                        }
                    }
                }, function (t, e) {
                    if(typeof error == "function"){
                        error(e);
                    }
                });
            }else{
                if(typeof error == "function"){
                    error("script object does not have an sid > 0 (not initialized?)");
                }
            }
        }

        this.update = function(options, success, error){
            console.log('update called on script {0} updating column {1} to {2}'.format(this.sid, options.name, options.value));
			var sql = "UPDATE scripts SET {0} = '{1}' WHERE sid = {2}".format(options.name, options.value, this.sid);
            pw.db.execute(sql, function(t,r){
                //update self and hash object
                this.properties[options.name] = this.properties[options.value];
                //need to keep an eye on this hash object. If it get desynced it will be a tricky bug to track down ("why aren't my options updating?")
                script[this.sid] = this;
                if(typeof success == "function"){ //prevents the nasty error message if the function isn't passed
                    success();
                }
            },function(t,e){
                console.log("error when updating the argument value: {0}".format(JSON.stringify(e)));
                if(typeof error == "function"){ //prevents the nasty error message if the function isn't passed
                    error(e);
                }
            });
        }

        this.remove = function(options, success, error){
            var sql = "DELETE FROM scripts where id={0}".format(this.id);
            pw.db.execute(sql, function(t,r){
                delete argumentHash[this.properties.sid];
                //TODO: DELETE ALL ARGUMENTS ASSOCIATED WITH THIS SCRIPT!
                if(typeof success == "function"){ //prevents the nasty error message if the function isn't passed
                    success(this);
                }
            },function(t,e){
                console.log("error when deleting the argument: {0}".format(JSON.stringify(e)));
                if(typeof error == "function"){ //prevents the nasty error message if the function isn't passed
                    error(e);
                }
            });
        }

        //callback function is passed the last inserted row id
        this.addArgument = function(options, success, error){
            var sql = "INSERT INTO arguments('sid','required','label') VALUES({0},{1},'{2}')".format(this.properties.sid, 0,"new argument");
			console.log("Adding Argument: " + sql);
            pw.db.execute(sql, function(t, r){
                //we are now going to construct an argument object and pass it back to the caller
                var newArg = new argument({id:r.insertId, sid:this.properties.sid, label:"new argument"});
                //add it to the arguments hash to keep it consistent
                argumentHash[newArg.id] = newArg;
                //use this if statement to prevent the nasty error message if the success function isn't defined or isn't a function
                if(typeof success == "function"){
                    success(newArg);
                }
            }, function(t, e){
                console.log("error when adding an argument: {0}".format(JSON.stringify(e)));
                if(typeof error == "function"){
                    error(e);
                }
            })
        }
        scriptHash[this.sid] = this;
    }

    //the argument object
    var Argument = function(data){
		this.properties = {
            aid: 0,
            sid : 0,
            alias: "",
            label : "",
            description: "",
            required : 0
        }

        this.create = function(options, success, error){
            try{
                $.extend(this.properties, options); //mix properties of data with defaults & this context
                argumentHash[this.properties.aid] = this;
                if(typeof success == "function"){
                    success(this);
                }
            }catch(err){
                if(typeof error == "function"){
                    error(err);
                }
            }
        }

        //function used to update a particular value in this argument
        //options argument expects: name (string), value (string) and optional success/error callbacks
        this.update = function(options, success, error){
            var sql = "UPDATE arguments SET {0} = '{1}' WHERE id = {2}".format(options.name, options.value, this.properties.aid);
            pw.db.execute(sql, function(t,r){
                //update self and hash object
                this.properties[options.name] = options.value;
                //need to keep an eye on this hash object. If it get desynced it will be a tricky bug to track down ("why aren't my options updating?")
                argumentHash[this.properties.aid] = this;
                if(typeof success == "function"){ //prevents the nasty error message if the function isn't passed
                    success();
                }
            },function(t,e){
                console.log("error when updating the argument value: {0}".format(JSON.stringify(e)));
                if(typeof error == "function"){ //prevents the nasty error message if the function isn't passed
                    error(e);
                }
            });
        }

        this.remove = function(options, success, error){
            var sql = "DELETE FROM arguments where id={0}".format(this.properties.aid);
            pw.db.execute(sql, function(t,r){
                delete argumentHash[this.properties.aid];
                if(typeof success == "function"){ //prevents the nasty error message if the function isn't passed
                    success(this);
                }
            },function(t,e){
                console.log("error when deleting the argument: {0}".format(JSON.stringify(e)));
                if(typeof error == "function"){ //prevents the nasty error message if the function isn't passed
                    error(e);
                }
            });
        }
    }

    //Gets a single argument
    //options.id [required] is the id of the argument as represented in the arguments database table
    //options.success callback is passed the argument object
    //options.error callback
    my.getArgument = function(options){
        var returnObject = {},
            sql = "SELECT * FROM arguments WHERE id = {0}".format(options.id);
        if(options.id == undefined){
            onError("id must be specified in options object when calling getArgument()");
            return false;
        }else{
            if(argumentHash[options.id]){ //attempt to get it locally first
                if(typeof options.success == "function"){
                    options.success(argumentHash[options.id]);
                }
            }else{ //we have to get it from the database
                pw.db.execute(sql, function(transaction, results){
                    var myArgument = null;
                    if(results.rows.length){
                        var item = results.rows.item(0);
                        myArgument = new argument(item);
                    }
                    if(typeof options.success == "function"){
                        options.success(argumentHash[myArgument]);
                    }
                }, function(t,e){
                    console.log("error in getArgument(): {0}".format(JSON.stringify(e)));
                    if(typeof options.error == "function"){ //prevents the nasty error message if the function isn't passed
                        options.error(e);
                    }
                });
            }
        }
    }

    //Gets a single script
    //options.id [required] corresponds to the sid in the scripts database table
    //options.success callback is passed the populated script object
    //options.error callback
    my.getScript = function(options, success, error){
        var sql = "SELECT * FROM scripts WHERE sid = {0}".format(options.sid),
            myScript = null;

        if(options.sid){
            if(scriptHash[options.sid]){ //attempt to get it locally first
                if(typeof success == "function"){
                    success(scriptHash[options.sid]);
                }
            }else{
                myScript = new Script();
                pw.db.execute(sql, function(transaction, results){
                    if(results.rows.length){
                        var item = results.rows.item(0);
                        myScript.create(item, function(script){
                            scriptHash[myScript.id] = myScript;
                            if(typeof success == "function"){
                                success(script);
                            }
                        });
                        //now that we have the script we can add in the arguments object we got previously
                    }
                }, function(t, e){
                    console.log("error in getScript(): {0}".format(e.message));
                    if(typeof error == "function"){
                        error(e);
                    }
                });
            }
        }else{
            console.log("sid must be specified in options object when calling getScript()");
            if(typeof options.error == "function"){
                options.error("sid must be specified in options object when calling getScript()");
            }
        }
    }

    //Gets all arguments from the database and returns them via a success callback packaged as an array of argument objects
    //success callback will be passed the array of arguments
    //error callback
    my.getAllArguments = function(success, error){
        var returnObject = new Array(),
            sql = "SELECT * FROM arguments";
        argumentHash = {}; //clear out arguments hash
        //get all arguments from the database
        pw.db.execute(sql, function(transaction, results){
            var myArgument = {};
            var count = 0;
            while(count < results.rows.length){
                var item = results.rows.item(count);
                myArgument = new Argument();
                myArgument.create(item);
                returnObject[count] = myArgument;
                argumentHash[myArgument.id] = myArgument;
                count++;
            }
            if(typeof options.success == "function"){
                options.success(returnObject);
            }
        }, function(t, e){
            console.log("error getting all arguments: {0}".format(e.message));
            if(typeof options.error == "function"){
                options.error(e);
            }
        });
    }

    //Gets all scripts from the database and packages each up as a script object
    //options.success callback is passed an object containing a key of 'scripts' whose value is an array of script objects
    //options.error callback
    my.getAllScripts = function(options){
        var sql = "SELECT * FROM scripts ORDER BY date_created DESC",
        returnObj = {
            scripts : [] //array of script objects to return
        };

        //clear out old scripts and arguments each time this is called
        scriptHash = {};

        //we have to first get all the arguments
        my.getAllArguments({
            success : function(argumentsArray){
                //we now have an array of all the arguments for every script
                //get every script now
                pw.db.execute(sql, function(transaction, results){
                    var scriptResults = results; //store the script results
                    console.log(results.rows.length + " scripts retrieved");
                    //create script objects out of each script
                    if(results.rows.length){
                        for(var i = 0; i < results.rows.length; i++){
                            var newScript = new script(results.rows.item(i)),
                            //since we have ALL of the arguments for EVERY script, we need to get only the ones relevant
                            //to this script. We use the grep function to filter the arguments array with this purpose in mind.
                            myArgs = $.grep(argumentsArray, function(n,i){return n.sid == newScript.sid});
                            //now we add the relevant arguments to the newly generated script object
                            newScript.arguments = myArgs;
                            scriptHash[newScript.sid] = newScript; //store it in the hash for future use
                            //put this new script at the end of the array we're building
                            returnObj.scripts.push(newScript);
                        }
                    }
                    if(typeof options.success == "function"){
                        options.success(returnObj);
                    }
                }, function(t, e){
                    console.log("error in getAllScripts(): {0}".format(e.message));
                    if(typeof options.error == "function"){
                        options.error(e);
                    }
                });
            }
        });
    }

    my.addScript = function(path, onSuccess, onError){
        //regex to extract filename works for both \ and / file separators
        var alias = path.replace(/^.*[\\\/]/, '');
        //just the file extension ex: jpg txt csv
        //var filetype = path.substr(path.lastIndexOf('.')+1, path.length);
        var sql = "INSERT INTO scripts (path, alias, date_created) VALUES('{0}', '{1}', DATETIME('NOW'))".format(path, alias);
        pw.db.execute(sql, onSuccess, onError);
    }

    my.deleteScripts = function(sids, onSuccess, onError){
        //remove scripts
        var sql = "DELETE FROM scripts WHERE sid=";
        for (var i = 0; i < sids.length; i++) {
            //treat the last aid differently
            if (i === sids.length-1){
                sql += sids[i];
            }
            else{
                sql += sids[i] + " OR sid=";
            }
        }
        pw.db.execute(sql, onSuccess, onError);
    }

    my.deleteScript = function(sid, onSuccess, onError){
        iSid = parseInt(sid);
        if(iSid >= 0 && iSid){
            var sql = "DELETE FROM scripts WHERE sid={0}".format(sid);
            pw.db.execute(sql, onSuccess, onError);
        }else{
            console.log("script ID {0} is not a positive integer.".format(sid));
        }
    }

    //currently an internal method to retrieve all of the arguments for a single script
    //options.id [required] is the script id the arguments are associated with
    //options.success callback is passed an array of argument objects
    //options.error callback
    function getScriptArguments(o) {
        var options = {
            success:function (data) {
            },
            error:function (e) {
            },
            id:0
        }
        $.extend({}, o, options); //copy options to default options (alternative way to ensure we have a success and error function)
        if (options.id > 0) {
            var sql = "SELECT * from arguments where sid = {0}".format(options.id);
            pw.db.execute(sql, function (t, results) {
                var argArray = [];
                if (results.rows.length) {
                    for (var i = 0; i < results.rows.length; i++) {
                        var item = results.rows.item(i);
                        myArgument = new argument(item);
                        argArray.push(myArgument);
                    }
                    options.success(argArray);
                }
            }, function (t, e) {
                options.error(e)
            });
        }else{
            console.log("getScriptArguments must be passed an id of > 0");
        }
    }


    return my;
}());