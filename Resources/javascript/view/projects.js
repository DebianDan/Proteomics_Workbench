//execute on projects page load
$(document).on('pagebeforecreate', '#projects', function (event) {
    //get all projects in database
    pw.projects.getAllProjects(
        //success callback
        function (transaction, results) {
            console.log(results.rows.length + " projects retrieved");
            console.log("rendering projects list");
            var pList = $("#projectList"); //save a reference to the element for efficiency
            for (var i = 0; i < results.rows.length; i++) {
                var row = results.rows.item(i);
                pList.append(projectTemplate.format(row['pid'], row['name']));
            }
            $("#projectList").listview("refresh"); //have to refresh the list after we add elements
        },
        function (transaction, error) {
            alert("there was an error when attempting to retrieve the projects: ", error.code);
        }
    );
});

//bind to the click event of the create new project button
$(document).on('click', "#createProjectPopup :submit", function(){
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
                //clear form data
                $("#createProjectPopup .projectTitle").val('');
                $("#createProjectPopup .projectDescription").val('');
                $("#projectList").prepend(projectTemplate.format(pid, title));
                $("#projectList").listview("refresh"); //have to refresh the list after we add an element
            },
            //error callback
            function(transaction, error){
                alert("there was an error when attempting to create the project: ", error.code);
            }
        );
    }
});

//bind to the click event of the delete project button
$("#deleteProjectPopup #delete").click(function(){
    console.log("delete project button clicked");
    var pid = pw.activeProject;
    pw.projects.deleteProject(pid,
        //success callback
        function(transaction, results){
            //Remove deleted project from the list
            $("#projectList").find("li[data-pid='"+pid+"']").remove();
            //have to refresh the list after we delete an element
            $("#projectList").listview("refresh");
        },
        //error callback
        function(transaction, error){
            alert("there was an error when attempting to delete the project: ", error.code);
        }
    );
});

//bind to the click event of the edit project button
$(document).on('click', "#editProjectPopup :submit", function(){
    console.log("edit project button clicked");
    var title = $("#editProjectPopup .newTitle").val();
    var description = $("#editProjectPopup .newDescription").val();
    if(title == ""){
        alert('Project title must be filled in.');
    }else{
        pw.projects.editProject(title, description, pw.activeProject,
            //success callback
            function(transaction, results){
               $("#editProjectPopup").popup("close");
            },
            //error callback
            function(transaction, error){
                alert("there was an error when attempting to edit the project: ", error.code);
            }
        );
    }
});
