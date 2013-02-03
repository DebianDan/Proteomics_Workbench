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
		alert('Test');
	}
}