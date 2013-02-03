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
        //Select Projects in order of Newest First
        var rows = db.execute("SELECT pid, name, description, active FROM projects ORDER BY pid DESC");
        results = rows;
        return results;
    }
};

/////////////
//get handle to the database
var db = Ti.Database.openFile(Ti.Filesystem.getFile(Ti.Filesystem.getApplicationDataDirectory(), 'capDB.sqlite'));
//Create a table
db.execute("CREATE  TABLE  IF NOT EXISTS 'main'.'projects' ('pid' INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , 'name' VARCHAR NOT NULL , 'description' VARCHAR, 'active' BOOL NOT NULL  DEFAULT 1, 'date_created' DATETIME NOT NULL DEFAULT CURRENT_DATE )");
//Propogate the list of projects from the db
listProjects();
/////////////

//Create Project Functionality (needs to be cleaned up)
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
		//create the new project
		db.execute("INSERT INTO projects (name, description, active, date_created) VALUES('" +e.projectTitle.value+ "', '" +e.projectDescription.value +"', 1, DATETIME('NOW'))");
		
		//TODO should check if the add was successful
		alert(e.projectTitle.value + " was added successfully!");
		
		//TODO should take you to that project details page of the newly added project 
	}
}

//should be wrapped into a listProjects() function. proof of concept right now
//should be able to pass each 'row' into the constructor to create a new pw.projects.project object. or the row collection to create a project collection
function listProjects() 
{
//$('#projects').live('pagebeforecreate', function(event){
    // manipulate this page before its widgets are auto-initialized
	if(projects = pw.projects.getProject()){
		var pList = $("#projectList");
		while(projects.isValidRow()) {
			 $("#projectList").append("<li><a href=\"#projectDetails\">"+ projects.fieldByName('name') +"</li>");
			 projects.next();
		}
		//TODO don't think this is needed...
		//pList.listview('refresh'); //tell jquery mobile that we added some stuff so it can style it
     }else{
		alert("no projects found.");
     }
	 
}