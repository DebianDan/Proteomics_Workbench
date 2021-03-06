//PROJECTS STUFF
//CONSOLE DEBUG STRING: pw.projects.getProjectEx({id:1,success:function(p){console.log(JSON.stringify(p));}, error:function(e){console.log("oops " + JSON.stringify(e))}});
//TODO: $.extend() is copying functions all over the place. go back to testing if functions are defined and typeof == "function"

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

        //call this function to initialize the properties
        this.create = function(options, success, error){
            $.extend(this.properties, options); //copy data into properties
            //console.log("DEBUG: in create function of asset, properties is: {0}".format(JSON.stringify(this.properties)));
            //check for alterative success callback
            if(typeof success == "function"){
                success(this);
            }
            //no callback specified
        }

        //function used to update a particular value in this asset
        //options argument expects: name (string), value (string) and optional success/error callbacks
        this.update = function(options){
            var sql = "UPDATE assets SET {0} = '{1}' WHERE aid = {2}".format(options.name, options.value, properties.aid);
            pw.db.execute(sql, function(t,r){
                //update self and hash object
                properties[options.name] = options.value;
                if(typeof options.success == "function"){
                    options.success(this);
                }
            },function(t,e){
                console.log("error when updating the argument value: {0}".format(JSON.stringify(e)));
                if(typeof options.error == "function"){
                    options.error(e);
                }
            });
        }

        this.remove = function(options){
            var sqlDeleteFav = "DELETE FROM favorites WHERE aid={0}".format(properties.aid);
            var sql = "DELETE FROM assets WHERE aid={0}".format(properties.aid);
            pw.db.execute(sqlDeleteFav);
            pw.db.execute(sql, function(){
                if(typeof options.success == "function"){
                    options.success();
                }
            }, function(){
                if(typeof options.error == "function"){
                    options.error();
                }
            });
        }

        this.addFavorite = function(options, success, error){
            //options = $.extend({},_defaultOptions, options);
            var sql = "INSERT INTO favorites VALUES({0}, {1})".format(properties.pid, properties.aid);
            pw.db.execute(sql, function(t, r){
                if(typeof success == "function"){
                    success();
                }
            }, function(t, e){
                if(typeof error == "function"){
                    error(e);
                }
            });
        }

        this.removeFavorite = function(options, success, error){
            //options = $.extend({},_defaultOptions, options);
            var sql = "DELETE FROM favorites WHERE pid={0} and aid={0})".format(properties.pid, properties.aid);
            pw.db.execute(sql, function(t, r){
                if(typeof success == "function"){
                    success();
                }
            }, function(t, e){
                if(typeof error == "function"){
                    error(e);
                }
            });
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

       this.create = function(options, success, error){
           //options = $.extend({},_defaultOptions, options); //ensure success and error callbacks are defined
           //console.log("DEBUG: in create function of project, options is: {0}".format(JSON.stringify(options)));
           $.extend(this.properties, options); //copy data into properties
           this.properties.assets = new Array(); //clear out 'not_initialized' message in array
           //get the assets for this project, assign to the internal array, then finally call supplied success callback
           var self = this;
           this.getAssets(options, function(assetsArray){
               if(typeof success == "function"){
                   self.properties.assets = assetsArray;
				   success(self);
               }
           }, function(e){
               if(typeof error == "function"){
                   error(e);
               }
           });
       }

       this.addAsset = function(options, success, error){
           var self = this;
           //copy options into defaults
           options = $.extend({path:"", success : function(){}, error : function(){}}, options);
           //regex to extract filename works for both \ and / file separators
           //options.fileName = path.replace(/^.*[\\\/]/, '');
           options.fileName = path.basename(options.path);
           //just the file extension ex: jpg txt csv
           //options.fileType = options.path.substr(options.path.lastIndexOf('.')+1, options.path.length);
           options.fileType = path.extname(options.path);
           var myOptions = options;
           var sql = "INSERT INTO assets (pid, path, filename, filetype, date_created) VALUES('{0}', '{1}', '{2}', '{3}', DATETIME('NOW'))".format(options.pid, options.path, options.fileName, options.fileType);
           pw.db.execute(sql, function(t,r){
               myOptions.aid = r.insertId;
               //create a new Asset object and call the create function
               var myAsset = new Asset();
               myAsset.create(myOptions, function(newAsset){
                   self.properties.assets.push(newAsset); //add the new asset to our properties object
                   if(typeof success == "function"){
                    success(newAsset);
                   }
               });
           }, function(t,e){
               if(typeof error == "function"){
                error(e);
               }
           });
       }

       //on success returns an array of asset objects
       this.getAssets = function(options, success, error){
           var self = this;
           if(!this.properties.assets.length){ //check to see if the array already has something in it, run the query if it doesn't
               if(!this.properties.pid){
                   if(typeof error == "function"){
                    error("pid must be specified when calling getAssets(). pid is: " + this.properties.pid);
                   }
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
                                   //console.log("DEBUG: pushed " + JSON.stringify(myAsset));
                               });
                           }
                       }
                       //check the optional callback to call it instead of what's in the options object
                       if(typeof success == "function"){
                           success(self.properties.assets);
                       }
                   }, function(t,e){
                       if(typeof error == "function"){
                        options.error(e);
                       }
                   });
               }
           }else{
               //there was already something in the array, return what we have
               if(typeof success === "function"){
                   success(this.properties.assets);
               }
           }

       }

       this.update = function(options, success, error){
           //console.log('DEBUG: update called on project {0} updating column {1} to {2}'.format(this.properties.id, options.name, options.value));
           var sql = "UPDATE projects SET {0} = '{1}' WHERE pid = {2}".format(options.name, options.value, this.properties.id);
           pw.db.execute(sql, function(t,r){
               //update self and hash object
               this.properties[options.name] = options.value;
               if(typeof success == "function"){ //prevents the nasty error message if the function isn't passed
                   success();
               }
           },function(t,e){
               console.log("error when updating the project value: {0}".format(JSON.stringify(e)));
               if(typeof error == "function"){ //prevents the nasty error message if the function isn't passed
                   error(e);
               }
           });
       }

       this.remove = function(success, error){
           var sql = "DELETE FROM projects where pid={0}".format(this.properties.id);
           pw.db.execute(sql, function(t,r){
               if(typeof success == "function"){ //prevents the nasty error message if the function isn't passed
                   success(this);
               }
           },function(t,e){
               console.log("error when deleting the project: {0}".format(JSON.stringify(e)));
               if(typeof error == "function"){ //prevents the nasty error message if the function isn't passed
                   error(e);
               }
           });
       }
    }

    //options object expects a 'pid' key corresponding to the id of the project to fetch
    //returns the full project object to the success function
    my.getProjectEx = function(options, success, error){
        if(options.pid){
            var sql = "SELECT pid, name, description, active, date_created FROM projects WHERE pid = {0}".format(options.pid);
            //execute the database call to get the project
            pw.db.execute(sql, function(t, r){
                var myProject = new Project();
                if(r.rows.length){
                    //if we have results, create a new project object
                    var item = r.rows.item(0);
                    //want to copy the contents of the item to the options object
                    //options = $.extend({},item,options);//explanation: (options overrides item which overrides {})
                    //the init function will set all the property values and call the success/error callback as specified in the options argument
                    myProject.create(item, function(project){
                        success(project);
                    }, error);
                }
            }, function(t, e){
                if(typeof error == "function"){
                    error(e);
                }
            });
        }else{
            console.log("pid must be specified when calling getProject()");
            error("pid must be specified when calling getProject()");
        }
    }

    my.getProject = function(pid, success, error){
        var sql = "SELECT pid, name, description, active, date_created FROM projects WHERE pid = " + pid;
        if(pid == undefined){
            onError("pid must be specified when calling getProject()");
            return false;
        }else{
            pw.db.execute(sql, success, error);
        }
    }

    my.getAllProjects = function(onSuccess, onError){
        var sql = "SELECT pid, name, description, active, date_created FROM projects ORDER BY date_created DESC";
        pw.db.execute(sql, onSuccess, onError);
    }

    //returns the created project object to the success function
    my.createProjectEx = function(options, success, error){
        if(options.name){
            var sql = "INSERT INTO projects (name, description, active, date_created) VALUES('" + options.name + "', '" + options.description +"', 1, DATETIME('NOW'))";
            pw.db.execute(sql, function(t, r){
                var myProject = new Project();
                myProject.create(options, success, error);
            }, function(t, e){
                error(e);
            });
        }else{
            error("name must be defined when creating a new project");
        }
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
	
	//on success returns an array of asset objects
    my.getSortedAssets = function(options, success, error){
	   if(!options.pid){
		   if(typeof error == "function"){
			error("pid must be specified when calling getSortedAssets(). pid is: " + options.pid);
		   }
		   return false;
	   }else{
			//query is different based on which way we are sorting the assets
			var sql;
			switch(options.sortBy)
			{
				//Newest
				case 1:
				  sql = "SELECT assets.aid, assets.pid, assets.path, assets.filename, assets.filetype, assets.date_created, favorites.aid as fav FROM assets LEFT OUTER JOIN favorites ON assets.aid = favorites.aid WHERE assets.pid = "+options.pid+" ORDER BY assets.date_created DESC";
				  break;
				//Favorites
				case 2:
				  sql = "SELECT assets.aid, assets.pid, assets.path, assets.filename, assets.filetype, assets.date_created, favorites.aid as fav FROM assets JOIN favorites ON assets.aid = favorites.aid WHERE assets.pid = "+options.pid+" ORDER BY assets.date_created DESC";
				  break;
				//FileType  
				case 3:
				   sql = "SELECT assets.aid, assets.pid, assets.path, assets.filename, assets.filetype, assets.date_created, favorites.aid as fav FROM assets LEFT OUTER JOIN favorites ON assets.aid = favorites.aid WHERE assets.pid = "+options.pid+" ORDER BY assets.filetype COLLATE NOCASE ASC";
				  break;
				//FileName
				case 4:
				  sql = "SELECT assets.aid, assets.pid, assets.path, assets.filename, assets.filetype, assets.date_created, favorites.aid as fav FROM assets LEFT OUTER JOIN favorites ON assets.aid = favorites.aid WHERE assets.pid = "+options.pid+ " ORDER BY assets.filename COLLATE NOCASE ASC";
				  break;
				default : sql = "SELECT assets.aid, assets.pid, assets.path, assets.filename, assets.filetype, assets.date_created, favorites.aid as fav FROM assets LEFT OUTER JOIN favorites ON assets.aid = favorites.aid WHERE assets.pid = "+options.pid+" ORDER BY assets.date_created DESC";
			}
			if(options.pid == undefined){
				onError("pid must be specified when calling getSortedAssets()");
				return false;
			}
			sortedAssets = new Array();

		   pw.db.execute(sql, function(t,r){
			   if(r.rows.length){
				   //if we have results, loop through results and build array of assets
				   for(var i = 0; i < r.rows.length; i++){
					   var item = r.rows.item(i);
					   var myAsset = new Asset();
					   myAsset.create(item, function(myAsset){
						   sortedAssets.push(myAsset);
						   //console.log("DEBUG: pushed " + JSON.stringify(myAsset));
					   });
				   }
			   }
			   //check the optional callback to call it instead of what's in the options object
			   if(typeof success == "function"){
				   success(sortedAssets);
			   }
		   }, function(t,e){
			   if(typeof error == "function"){
				options.error(e);
			   }
		   });
	   }

    }

    return my;

})();