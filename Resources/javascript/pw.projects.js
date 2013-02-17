//PROJECTS STUFF
pw.projects = {
    project : function(name, description){
        this.name = name;
        this.description = description;
        return this;
    },
    getProject : function(pid, onSuccess, onError){
        var sql = "SELECT pid, name, description, active, date_created FROM projects WHERE pid = " + pid;
        if(pid == undefined){
            onError("pid must be specified when calling getProject()");
            return false;
        }else{
            pw.db.execute(sql, onSuccess, onError);
        }
    },
    getAllProjects : function(onSuccess, onError){
        var sql = "SELECT pid, name, description, active, date_created FROM projects ORDER BY date_created DESC";
        pw.db.execute(sql, onSuccess, onError);
    },
    createProject : function(name, description, onSuccess, onError){
        var sql = "INSERT INTO projects (name, description, active, date_created) VALUES('" + name + "', '" + description +"', 1, DATETIME('NOW'))";
        pw.db.execute(sql, onSuccess, onError);
    },
    deleteProject : function(id, onSuccess, onError){
        var sql = "DELETE FROM projects WHERE pid=" + id + "";
        pw.db.execute(sql, onSuccess, onError);
    }
};