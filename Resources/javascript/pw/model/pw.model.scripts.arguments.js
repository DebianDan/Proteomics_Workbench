pw.scripts.arguments = (function(){

    var my = {};

    my.updateArgument = function(id, name, newVal){
        var sql = "UPDATE arguments SET {0}={1} WHERE id={2}".format(name, newVal, id);
        pw.db.execute(sql);
    }

    return my;
});