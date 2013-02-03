//should be wrapped into a listProjects() function. proof of concept right now
//should be able to pass each 'row' into the constructor to create a new pw.projects.project object. or the row collection to create a project collection
$('#projects').live('pagebeforecreate', function(event){
    // manipulate this page before its widgets are auto-initialized
    /*if(projects = pw.projects.getProject()){
     var pList = $("#projectList");
     while(projects.isValidRow()) {
     $("#projectList").append("<li>"+ projects.fieldByName('name') +"</li>");
     projects.next();
     }
     pList.listview('refresh'); //tell jquery mobile that we added some stuff so it can style it
     }else{
     alert("no projects found.");
     }*/
    alert('test');
});

/////////////
//get handle to the database
var db = Ti.Database.openFile(Ti.Filesystem.getFile(Ti.Filesystem.getApplicationDataDirectory(), 'capDB.sqlite'));
//Create a table
db.execute("CREATE  TABLE  IF NOT EXISTS 'main'.'projects' ('pid' INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , 'name' VARCHAR NOT NULL , 'description' VARCHAR, 'active' BOOL NOT NULL  DEFAULT 1, 'date_created' DATETIME NOT NULL DEFAULT CURRENT_DATE )");
//try to insert a row into the DB
db.execute("INSERT INTO projects (name, description, active, date_created) VALUES('First Project!', 'This is the first project to see if it gets inserted correctly...', 1, DATETIME('NOW'))");
/////////////

//define our proteomics workbench namespace to hold all of our stuff
var pw = {};
pw.projects = {
    project : function(name, description){
        var self = this;
        var name = name;
        var description = description;
        return this;
    },
    //returns Ti.Database.ResultSet
    getProject : function(id){
        var results = {};
        //Select from Table
        var rows = db.execute("SELECT pid, name, description, active FROM projects");
        results = rows;
        //Release memory once you are done with the resultset and the database
        rows.close();
        db.close();
        return results;



    }
};

function processForm(form) 
{
	var e = form.elements;
	if(e.projectTitle.value == "")
	{
		alert('Project title must be filled in.');
		e.projectTitle.focus();
		return false;
	}
	else
	{
		alert('Title: ' + e.projectTitle.value);
		alert('Discription: ' + e.projectDescription.value);
	}
}
