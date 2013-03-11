//PROJECTS STUFF
pw.projects = (function(){
    var my = {};

    //we'll use this to mixin with the options argument in case people don't pass us the success/error functions
    var _defaultOptions = {
        success : function(){},
        error : function(){}
    }

    //the project object
    var project = function(){
        //properties
        var properties = {
            id : "",
            name : "",
            description: "",
            active : "",
            date_created : ""
        }

        assets = []; //empty assets array

        //this init function should be called whenever constructing a new instance of this object
        //a data object is expected to be found in the options argument, will be mixed with the project's properties object
        //the success and error callbacks are expected to be found in the options argument
        this.init = function(options){
            options = $.extend(_defaultOptions, options); //ensure success and error callbacks are defined
            $.extend(properties, options.data); //copy data into properties

            //TODO: get the assets for this project and then call the success callback
        }

        this.addAsset = function(options){
            //copy options into defaults
            options = $.extend({path:"", success : function(){}, error : function(){}}, options);
            //regex to extract filename works for both \ and / file separators
            options.fileName = path.replace(/^.*[\\\/]/, '');
            //just the file extension ex: jpg txt csv
            options.fileType = options.path.substr(options.path.lastIndexOf('.')+1, options.path.length);
            var sql = "INSERT INTO assets (pid, path, filename, filetype, date_created) VALUES('{0}', '{1}', '{2}', '{3}', DATETIME('NOW'))".format(options.pid, options.path, options.fileName, options.fileType);
            pw.db.execute(sql, function(t,r,options){
                options.id = r.insertId;
                var newAsset = new asset(options);
                options.success(newAsset)
            }, function(t,e){
                options.error(e);
            });
        }

        //on success returns an array of asset objects
        this.getAssets = function(options){
            //TODO: Implement
        }

        this.update = function(options){
            console.log('update called on project {0} updating column {1} to {2}'.format(this.properties.id, options.name, options.value));
            var sql = "UPDATE projects SET {0} = '{1}' WHERE pid = {2}".format(options.name, options.value, this.properties.id);
            pw.db.execute(sql, function(t,r){
                //update self and hash object
                this.properties[options.name] = options.value;
                if(typeof options.success == "function"){ //prevents the nasty error message if the function isn't passed
                    options.success();
                }
            },function(t,e){
                console.log("error when updating the project value: {0}".format(JSON.stringify(e)));
                if(typeof options.error == "function"){ //prevents the nasty error message if the function isn't passed
                    options.error(e);
                }
            });
        }

        this.remove = function(options){
            var sql = "DELETE FROM projects where pid={0}".format(this.properties.id);
            pw.db.execute(sql, function(t,r){
                if(typeof options.success == "function"){ //prevents the nasty error message if the function isn't passed
                    options.success(this);
                }
            },function(t,e){
                console.log("error when deleting the project: {0}".format(JSON.stringify(e)));
                if(typeof options.error == "function"){ //prevents the nasty error message if the function isn't passed
                    options.error(e);
                }
            });
        }
    };

    //the asset object
    var asset = function(data){
        var properties = {
            id : "",
            pid : "",
            path : "",
            filename : "",
            filetype : "",
            date_created : ""
        }
        $.extend(properties, data); //copy data into properties

        //function used to update a particular value in this asset
        //options argument expects: name (string), value (string) and optional success/error callbacks
        this.update = function(options){
            options = $.extend(_defaultOptions, options);
            var sql = "UPDATE assets SET {0} = '{1}' WHERE aid = {2}".format(options.name, options.value, properties.id);
            pw.db.execute(sql, function(t,r){
                //update self and hash object
                properties[options.name] = options.value;
                options.success(this);
            },function(t,e){
                console.log("error when updating the argument value: {0}".format(JSON.stringify(e)));
                options.error(e);
            });
        }

        var remove = function(options){
            options = $.extend(_defaultOptions, options);
            var sqlDeleteFav = "DELETE FROM favorites WHERE aid={0}".format(properties.id);
            var sql = "DELETE FROM assets WHERE aid={0}".format(properties.id);
            pw.db.execute(sqlDeleteFav);
            pw.db.execute(sql, options.success, options.error);
        }

        var addFavorite = function(options){
            options = $.extend(_defaultOptions, options);
            var sql = "INSERT INTO favorites VALUES({0}, {1})".format(properties.pid, properties.id);
            pw.db.execute(sql, options.success, options.error);
        }

        var removeFavorite = function(options){
            options = $.extend(_defaultOptions, options);
            var sql = "DELETE FROM favorites WHERE pid={0} and aid={0})".format(properties.pid, properties.id);
            pw.db.execute(sql, options.success, options.error);
        }
    }

    //options object expects an 'id' key corresponding to the id of the project to fetch
    my.getProjectEx = function(options){
        options = $.extend(_defaultOptions, options);
        if(options.id){
            var sql = "SELECT pid, name, description, active, date_created FROM projects WHERE pid = {0}".format(options.id);
            //execute the database call to get the project
            pw.db.execute(sql, function(t, r){
                var myProject = null;
                if(r.rows.length){
                    //if we have results, create a new project object
                    var item = results.rows.item(0);
                    myProject = new project();
                    //projectOptions contains the data from the database and the success/error callbacks
                    var projectOptions = {
                        data : item,
                        success : options.success,
                        error : options.error
                    }
                    //the init function will set all the property values and call the success/error callback as specified in the options argument
                    myProject.init(projectOptions);
                }
            }, function(t, e){
                options.error(e);
            });
        }else{
            console.log("pid must be specified when calling getProject()");
            options.error();
        }
    }

    my.getProject = function(pid, onSuccess, onError){
        var sql = "SELECT pid, name, description, active, date_created FROM projects WHERE pid = " + pid;
        if(pid == undefined){
            onError("pid must be specified when calling getProject()");
            return false;
        }else{
            pw.db.execute(sql, onSuccess, onError);
        }
    }

    my.getAllProjects = function(onSuccess, onError){
        var sql = "SELECT pid, name, description, active, date_created FROM projects ORDER BY date_created DESC";
        pw.db.execute(sql, onSuccess, onError);
    }

    my.createProject = function(name, description, onSuccess, onError){
        var sql = "INSERT INTO projects (name, description, active, date_created) VALUES('" + name + "', '" + description +"', 1, DATETIME('NOW'))";
        pw.db.execute(sql, onSuccess, onError);
    }

    my.deleteProject = function(id, onSuccess, onError){
        var sql = "DELETE FROM projects WHERE pid=" + id + "";
        pw.db.execute(sql, onSuccess, onError);
    }

	my.editProject = function(name, description, pid, onSuccess, onError){
		var sql = "UPDATE projects SET name = '" + name + "', description = '" + description +"' WHERE pid=" + pid + "";
        pw.db.execute(sql, onSuccess, onError);
    }

    return my;

})();