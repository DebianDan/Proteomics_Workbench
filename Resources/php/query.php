	$db_host		= 'localhost';
	$db_user		= 'root';
	$db_pass		= '';
	$db_database	= 'capstone'; 
	
	$db = new mysqli($db_host,$db_user,$db_pass,$db_database);
	
	if($db->connect_errno > 0){
		die('Unable to connect to database [' . $db->connect_error . ']');
	}

	/* End config */

	function sendQuery($str){
	
		$sql = "SELECT * FROM `projects` WHERE `active` = 1";
		
		if(!$result = $db->query($sql)){
			die('There was an error running the query [' . $db->error . ']');
		}

		//Number of returned rows
		echo 'Total results: ' . $result->num_rows;

		// OUTPUT QUERY RESULTS
		while($row = $result->fetch_assoc()){
			echo $row['name'] . '<br />';
		}

		//free result after done using it
		$result->free();

		$db->close();
	}