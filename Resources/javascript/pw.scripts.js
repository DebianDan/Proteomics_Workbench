
pw.scripts = (function(){
    var my = {}; //this is the objec that will be returned. Anything inside of this will be publicly accessible

    var scriptHash = {}; //store the scripts after they're generated
    var argumentHash = {}; //store the arguments after they're generated

    //the script object
    var script = function(data){
        this.sid = data['sid'];
        this.path = data['path'];
        this.alias = data['alias'];
        this.date_created = data['date_created'];
        this.arguments = [];

        this.update = function(options){
            console.log('update called on script {0} updating column {1} to {2}'.format(this.sid, options.name, options.value));
        }

        //callback function is passed the last inserted row id
        this.addArgument = function(options){
            var sql = "INSERT INTO arguments('sid','required','label') VALUES({0},{1},'{2}')".format(this.sid, 0,"new argument");
            pw.db.execute(sql, function(t, r){
                //we are now going to construct an argument object and pass it back to the caller
                var newArg = new argument({id:r.insertId, sid:this.sid});
                //add it to the arguments hash to keep it consistent
                argumentHash[newArg.id] = newArg;
                //use this if statement to prevent the nasty error message if the success function isn't defined or isn't a function
                if(typeof options.success == "function"){
                    options.success(newArg);
                }
            }, function(t, e){
                console.log("error when adding an argument: {0}".format(JSON.stringify(e)));
                if(typeof options.error == "function"){
                    options.error(e);
                }
            })
        }
        scriptHash[this.sid] = this;
    }

    //the argument object
    var argument = function(data){
		defaults = {
            id: -1,
            sid : -1,
            alias: "",
            label : "",
            description: "",
            required : 0
        }
        $.extend(this, defaults, data); //mix properties of data with defaults & this context

        //function used to update a particular value in this argument
        //options argument expects: name (string), value (string) and options success/error callbacks
        this.update = function(options){
            var sql = "UPDATE arguments SET {0} = '{1}' WHERE id = {2}".format(options.name, options.value, this.id);
            pw.db.execute(sql, function(t,r){
                //update self and hash object
                this[options.name] = options.value;
                //need to keep an eye on this hash object. If it get desynced it will be a tricky bug to track down ("why aren't my options updating?")
                argumentHash[this.id] = this;
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
            var sql = "DELETE FROM arguments where id={0}".format(this.id);
            pw.db.execute(sql, function(t,r){
                delete argumentHash[this.id];
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
        this.test = function(){
            alert("TEST!");
        }

        argumentHash[this.id] = this;
        return argumentHash[this.id];
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

    //Gets all arguments from the database and returns them via a success callback packaged as an array of argument objects
    //options.success callback will be passed the array of arguments
    //options.error callback
	my.getAllArguments = function(options){
        var returnObject = new Array(),
            sql = "SELECT * FROM arguments";
        argumentHash = {}; //clear out arguments hash
        //get all arguments from the database
        pw.db.execute(sql, function(transaction, results){
            var myArgument = {};
            var count = 0;
            while(count < results.rows.length){
                var item = results.rows.item(count);
                myArgument = new argument(item);
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

    //Gets a single script
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
                            myArgs = $.grep(argumentsArray, function(n,i){return n.sid == newScript.sid});
                            newScript.arguments = myArgs;
                            scriptHash[newScript.sid] = newScript; //store it in the hash for future use
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