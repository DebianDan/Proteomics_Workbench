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
                    //assets table
                    transaction.executeSql("CREATE TABLE IF NOT EXISTS assets('aid' INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL , 'pid' INTEGER NOT NULL ,'path' VARCHAR NOT NULL, 'filename' VARCHAR NOT NULL , 'filetype' VARCHAR NOT NULL, 'date_created' DATETIME NOT NULL DEFAULT CURRENT_DATE )");
                    //favorites table
                    transaction.executeSql("CREATE TABLE IF NOT EXISTS favorites('pid' INTEGER NOT NULL, 'aid' INTEGER NOT NULL)");
                    //scripts table
                    transaction.executeSql("CREATE TABLE IF NOT EXISTS scripts('sid' INTEGER PRIMARY KEY  AUTOINCREMENT  NOT NULL ,'path' VARCHAR NOT NULL, 'filename' VARCHAR NOT NULL , 'filetype' VARCHAR NOT NULL, 'date_created' DATETIME NOT NULL DEFAULT CURRENT_DATE )");
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