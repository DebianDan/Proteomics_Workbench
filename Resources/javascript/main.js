//define our proteomics workbench namespace to hold all of our stuff
var pw = {};

//DATABASE STUFF
(function() {
    var _db; //private variable to hold the returned database object
    //we define this getter so that it will only try to retrieve the database one time
    pw.__defineGetter__("db", function(){
        shortName = 'pwDB';
        version = '1.0';
        displayName = 'Database for the Proteomics Workbench software';
        maxSize = 52428800; // 50MB
        if(_db == undefined){ //only retrieve the database & create tables on program start
            console.log("getting the database");
            _db = openDatabase(shortName, version, displayName, maxSize);
            console.log("creating initial tables")
            _db.transaction(
                function(transaction){
                    //projects table
                    transaction.executeSql("CREATE TABLE IF NOT EXISTS projects('pid' INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , 'name' VARCHAR NOT NULL , 'description' VARCHAR, 'active' BOOL NOT NULL  DEFAULT 1, 'date_created' DATETIME NOT NULL DEFAULT CURRENT_DATE )");
                }
            );
        }
        return _db;
    });

    //function used to execute sql
    pw.db.execute = function(sql, dataHandler, errorHandler){
        console.log(sql);
        pw.db.transaction(
            function(transaction){
                transaction.executeSql(sql, [], dataHandler, errorHandler);
            }
        );
    }
})(pw); //this ensures that the closure is in the context of the pw object

//PROJECTS STUFF
pw.projects = {
    project : function(name, description){
        this.name = name;
        this.description = description;
        return this;
    },
    getProject : function(pid, onSuccess, onError){
        var sql = "SELECT pid, name, description, active, date_created FROM projects WHERE pid = " + pid;
        if(id == undefined){
            onError("id must be specified when calling getProject()");
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
    deleteProject : function(id){

    }
};

//bind to the click event of the create new project button
$("#createProjectPopup :submit").click(function(){
    console.log("create new project button clicked");
    var title = $("#createProjectPopup .projectTitle").val();
    var description = $("#createProjectPopup .projectDescription").val();
    if(title == ""){
        alert('Project title must be filled in.');
    }else{
        pw.projects.createProject(title, description,
            //success callback
            function(transaction, results){
                var pid = results.insertId; //id of last inserted row
                $("#createProjectPopup").popup("close");
                $("#projectList").prepend("<li data-pid=" + pid + "><a href=\"#projectDetails\">"+ title +"</li>");
                $("#projectList").listview("refresh"); //have to refresh the list after we add an element
            },
            //error callback
            function(transaction, error){
                alert("there was an error when attempting to create the project: ", error.code);
            }
        );
    }
});

//execute on projects page load
$('#projects').live('pagebeforecreate', function (event) {
    //get all projects in database
    pw.projects.getAllProjects(
        //success callback
        function (transaction, results) {
            console.log(results.rows.length + " projects retrieved");
            console.log("rendering projects list");
            var pList = $("#projectList"); //save a reference to the element for efficiency
            for (var i = 0; i < results.rows.length; i++) {
                var row = results.rows.item(i);
                pList.append("<li data-pid=" + row['pid'] + "><a href=\"#projectDetails\">" + row['name'] + "</li>");
            }
            $("#projectList").listview("refresh"); //have to refresh the list after we add elements
        },
        function (transaction, error) {
            alert("there was an error when attempting to retrieve the projects: ", error.code);
        }
    );
});

