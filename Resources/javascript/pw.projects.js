//PROJECTS STUFF
pw.projects = (function(){
    var my = {};

    //the project object
    var project = function(data){
        //properties
        var properties = {
            id : "",
            name : "",
            description: "",
            active : "",
            date_created : ""
        }
        $.extend(properties, data); //copy data into properties
        assets = []; //empty assets array

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