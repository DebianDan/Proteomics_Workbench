//PROJECTS STUFF
//TODO: pw.projects.getProjectEx({id:1,success:function(p){console.log(JSON.stringify(p));}, error:function(e){console.log("oops " + JSON.stringify(e))}});

pw.projects = (function(){
    var my = {};

    //we'll use this to mixin with the options argument in case people don't pass us the success/error functions
    var _defaultOptions = {
        success : function(){},
        error : function(){}
    }

    //the asset object
    var Asset = function(){
        this.properties = {
            aid : "",
            pid : "",
            path : "",
            filename : "",
            filetype : "",
            fav : "",
            date_created : ""
        }

        //TODO: get properties getter/setters working

        this.getProperties = function(){
            return this.properties;
        }

        this.setProperties = function(newValue){
            console.log("DEBUG: setting asset properties to {0}".format(JSON.stringify(newValue)));
            this.properties = $.extend({}, newValue, this.properties);

            return this.properties;
        }

        //call this function to initialize the properties
        this.create = function(options, success, error){
            options = $.extend({},_defaultOptions, options);
            $.extend(this.properties, options); //copy data into properties
            console.log("DEBUG: in create function of asset, properties is: {0}".format(JSON.stringify(this.properties)));
            //check for alterative success callback
            if(typeof success == "function"){
                success(this);
            }else if(typeof options.success == "function"){
                options.success(this);
            }
            //no callback specified
        }

        //function used to update a particular value in this asset
        //options argument expects: name (string), value (string) and optional success/error callbacks
        this.update = function(options){
            options = $.extend({},_defaultOptions, options);
            var sql = "UPDATE assets SET {0} = '{1}' WHERE aid = {2}".format(options.name, options.value, properties.aid);
            pw.db.execute(sql, function(t,r){
                //update self and hash object
                properties[options.name] = options.value;
                options.success(this);
            },function(t,e){
                console.log("error when updating the argument value: {0}".format(JSON.stringify(e)));
                options.error(e);
            });
        }

        this.remove = function(options){
            options = $.extend({},_defaultOptions, options);
            var sqlDeleteFav = "DELETE FROM favorites WHERE aid={0}".format(properties.aid);
            var sql = "DELETE FROM assets WHERE aid={0}".format(properties.aid);
            pw.db.execute(sqlDeleteFav);
            pw.db.execute(sql, options.success, options.error);
        }

        this.addFavorite = function(options){
            options = $.extend({},_defaultOptions, options);
            var sql = "INSERT INTO favorites VALUES({0}, {1})".format(properties.pid, properties.aid);
            pw.db.execute(sql, options.success, options.error);
        }

        this.removeFavorite = function(options){
            options = $.extend({},_defaultOptions, options);
            var sql = "DELETE FROM favorites WHERE pid={0} and aid={0})".format(properties.pid, properties.aid);
            pw.db.execute(sql, options.success, options.error);
        }
    }

    //the project object
   var Project = function(){
       this.properties = {
           pid : "",
           name : "",
           description: "",
           active : "",
           date_created : "",
           assets : ["not_initialized"]
       };

       this.getProperties = function(){
           return this.properties;
       }

       this.setProperties = function(newValue){
           this.properties = $.extend({}, newValue, this.properties);
           //console.log("DEBUG: set project properties to {0}".format(JSON.stringify(newValue)));
           return this.properties;
       }

       this.create = function(options, success, error){
           options = $.extend({},_defaultOptions, options); //ensure success and error callbacks are defined
           console.log("DEBUG: in create function of project, options is: {0}".format(JSON.stringify(options)));
           //$.extend(properties, options.data); //copy data into properties
           var properties = this.setProperties(options);
           properties.assets = new Array(); //clear out 'not_initialized' message in array
           //get the assets for this project, assign to the internal array, then finally call supplied success callback
           var self = this;
           this.getAssets(options, function(assetsArray){
               if(typeof success == "function"){
                   self.properties.assets = assetsArray; //should use setProperties?
                   success(self);
               }else{
                   options.success(self); //pass our context to caller
               }
           });
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
               options.aid = r.insertId;
               //create a new Asset object and call the create function
               var myAsset = new Asset();
               myAsset.create(options, function(newAsset){
                   this.properties.assets.push(newAsset); //add the new asset to our properties object
                   options.success(newAsset);
               });
           }, function(t,e){
               options.error(e);
           });
       }

       //on success returns an array of asset objects
       //optionalCallback will be called instead of options.success if supplied as an argument
       this.getAssets = function(options, optionalCallback){
           //var properties = this.getProperties();
           options = $.extend({},_defaultOptions, options); //copy default success & error callback functions into options
           var self = this;
           if(!this.properties.assets.length){ //check to see if the array already has something in it, run the query if it doesn't
               if(!options.pid){
                   options.error("id (project) must be specified when calling getAllAssets()");
                   return false;
               }else{
                   var sql = "SELECT assets.aid, assets.pid, assets.path, assets.filename, assets.filetype, assets.date_created, favorites.aid as fav FROM assets LEFT OUTER JOIN favorites ON assets.aid = favorites.aid WHERE assets.pid = "+options.pid+" ORDER BY assets.date_created DESC";
                   this.properties.assets = new Array(); // array of asset objects to build & pass to callback

                   pw.db.execute(sql, function(t,r){
                       if(r.rows.length){
                           //if we have results, loop through results and build array of assets
                           for(var i = 0; i < r.rows.length; i++){
                               var item = r.rows.item(i);
                               var myAsset = new Asset();
                               myAsset.create(item, function(myAsset){
                                   self.properties.assets.push(myAsset);
                                   console.log("DEBUG: pushed " + JSON.stringify(myAsset));
                               });
                           }
                       }
                       //check the optional callback to call it instead of what's in the options object
                       if(typeof optionalCallback === "function"){
                           optionalCallback(self.properties.assets);
                       }else{
                           options.success(self.properties.assets);
                       }
                   }, function(t,e){
                       options.error(e);
                   });
               }
           }
           //there was already something in the array, return what we have
           if(typeof optionalCallback === "function"){
               optionalCallback(this.properties.assets);
           }else{
               options.success(this.properties.assets);
           }
       }

       this.update = function(options){
           console.log('DEBUG: update called on project {0} updating column {1} to {2}'.format(this.properties.id, options.name, options.value));
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
    }



    //options object expects an 'id' key corresponding to the id of the project to fetch
    my.getProjectEx = function(options){
        options = $.extend({},_defaultOptions, options);
        if(options.pid){
            var sql = "SELECT pid, name, description, active, date_created FROM projects WHERE pid = {0}".format(options.pid);
            //execute the database call to get the project
            pw.db.execute(sql, function(t, r){
                var myProject = new Project();
                if(r.rows.length){
                    //if we have results, create a new project object
                    var item = r.rows.item(0);
                    //projectOptions contains the data from the database and the success/error callbacks
                    var projectOptions = {
                        data : item,
                        success : options.success,
                        error : options.error
                    }
                    //want to copy the contents of the item to the options object
                    options = $.extend({},item,options);//explanation: (options overrides item which overrides {})
                    //the init function will set all the property values and call the success/error callback as specified in the options argument
                    myProject.create(options);
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