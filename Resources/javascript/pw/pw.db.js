//ALL DATABASE STUFF
(function() {
    var _db; //private variable to hold the returned database object

    //debugging feature to reset all the tables..  BE CAREFUL YOU WILL LOSE ALL OF YOUR DATA!!
	function dropTables(){
        pw.db.transaction(
            function(transaction){
                console.log("dropping existing tables");
                //projects table
                transaction.executeSql("DROP TABLE IF EXISTS projects");
                //assets table
                transaction.executeSql("DROP TABLE IF EXISTS assets");
                //favorites table
                transaction.executeSql("DROP TABLE IF EXISTS favorites");
                //scripts table
                transaction.executeSql("DROP TABLE IF EXISTS scripts");
                //arguments table
                transaction.executeSql("DROP TABLE IF EXISTS arguments");
                //settings table
                transaction.executeSql("DROP TABLE IF EXISTS settings");
                //script arg types
                transaction.executeSql("DROP TABLE IF EXISTS tags");
                //runtimes table
                transaction.executeSql("DROP TABLE IF EXISTS runtimes");
            }
        );
    }

	//Create all the DB tables if they are not already created, should only be ran once the first time you open the app
    function createTables(){
        pw.db.transaction(
            function(transaction){
                console.log("creating initial tables");
                //projects table
                transaction.executeSql("CREATE TABLE IF NOT EXISTS projects('pid' INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , 'name' VARCHAR NOT NULL , 'description' VARCHAR, 'active' BOOL NOT NULL  DEFAULT 1, 'date_created' DATETIME NOT NULL DEFAULT CURRENT_DATE )");
                //assets table
                transaction.executeSql("CREATE TABLE IF NOT EXISTS assets('aid' INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , 'pid' INTEGER NOT NULL ,'path' VARCHAR NOT NULL, 'filename' VARCHAR NOT NULL , 'filetype' VARCHAR NOT NULL, 'date_created' DATETIME NOT NULL DEFAULT CURRENT_DATE )");
                //favorites table
                transaction.executeSql("CREATE TABLE IF NOT EXISTS favorites('pid' INTEGER NOT NULL, 'aid' INTEGER NOT NULL)");
                //scripts table
                transaction.executeSql("CREATE TABLE IF NOT EXISTS scripts('sid' INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL ,'path' VARCHAR NOT NULL, 'alias' VARCHAR NOT NULL, 'description' TEXT, 'date_created' DATETIME NOT NULL DEFAULT CURRENT_DATE, 'rid' INTEGER DEFAULT -1, 'output_directory' VARCHAR, 'produces_output' BOOL NOT NULL DEFAULT 0, 'output_regex' VARCHAR)");
                //arguments table, defines the arguments each script takes
                transaction.executeSql("CREATE TABLE IF NOT EXISTS arguments('id' INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 'sid' INTEGER NOT NULL, 'label' VARCHAR NOT NULL, 'switch' VARCHAR, 'required' INTEGER NOT NULL DEFAULT 0, 'description' TEXT, 'type' INTEGER DEFAULT 0, 'default_value' VARCHAR, 'multiselect' BOOL NOT NULL DEFAULT 0, 'separator' VARCHAR DEFAULT ' ')");
                //argument types (defines the argument -- STRING, ASSET
                transaction.executeSql("CREATE TABLE IF NOT EXISTS tags('tid' INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 'name' VARCHAR UNIQUE NOT NULL)");
                //settings table (just stores the JSON representation of the settings object)
                transaction.executeSql("CREATE TABLE IF NOT EXISTS settings('settingsString' TEXT)");
                //runtimes table, defines the runtimes each script uses
                transaction.executeSql("CREATE TABLE IF NOT EXISTS runtimes('rid' INTEGER PRIMARY KEY AUTOINCREMENT, 'sid' INTEGER, 'alias' VARCHAR NOT NULL, 'path' VARCHAR)");
                console.log("DONE creating initial tables");
            }
        );
    }

    //we define this getter so that it will only try to retrieve the database one time
    pw.__defineGetter__("db", function(){
        var shortName = 'pwDB',
            version = '1.0',
            displayName = 'Database for the Proteomics Workbench software',
            maxSize = 52428800; // 50MB
        if(!_db){ //only retrieve the database & create tables on program start
            console.log("getting the database");
            _db = openDatabase(shortName, version, displayName, maxSize);
            createTables();
        }
        return _db;
    });

    pw.db.reset = function(){
        dropTables();
        createTables();
        //if database needs to be seeded with values, do it here
    }

    //function used to execute sql
    pw.db.execute = function(sql, dataHandler, errorHandler){
        console.log(sql);
        pw.db.transaction(
            function(transaction){
                transaction.executeSql(sql, [], dataHandler, function(t, e){
                    console.log("bad sql here: " + sql);
                    errorHandler(t,e);
                });
            }
        );
    }

    //used to handle multiple statements in a single transaction. sqlArray is plaintext array of statements to execute
    //not sure if necessary yet
    pw.db.executeStatements = function(sqlArray, dataHandler, errorHandler){
        pw.db.transaction(
            function(transaction){
                $.each(sqlArray, function(sql){
                    transaction.executeSql(sql, [], dataHandler, errorHandler);
                });
            }
        );
    }
})(pw); //this ensures that the closure is in the context of the pw object