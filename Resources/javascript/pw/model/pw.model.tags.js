(function() {
    var _tags,
    _defaults = { //these are the 'built-in' tags
        "string" : "string",
        "asset" : "asset"
        };

    pw.__defineGetter__("tags", function(){
        if(_tags == undefined){
            console.log("getting tags from the db");
            _tags = _defaults;
            getTags(_tags);
        }
        return _tags;
    });

    getTags = function(tagsObj){
        pw.db.execute("SELECT * FROM tags", function(t, results){
            if(results.rows.length){
                var temp = {}, i=0;
                for(i; i < results.rows.length; i++){
                    var row = results.rows.item(i);
                    temp[row['tid']] = row['name'];
                }
                $.extend(true, tagsObj, temp);
                console.log("retrieved tags: " + JSON.stringify(tagsObj));
            }

            var e = $.Event("tagsRetrieved");
            $(document).trigger(e);
        },function(t, error){
            console.log("getting the tags from the database failed: {0}".format(error.message));
        });
    }
}(pw));

//callback passes the ID of the created tag
/*
pw.tags.addTag = function(name, success, fail){
    pw.db.execute("INSERT INTO tags VALUES({0})".format(name), function(t, r){
        if(r.rows.length){
            success(r.insertId);
        }
    }, function(t,e){
        console.log("Error adding tag to the database: {0}".format(e.message));
        fail(e);
    });
}*/