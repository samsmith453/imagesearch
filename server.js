var express = require("express");
var request = require("request");
var mongo = require("mongodb").MongoClient;

var mongourl = "mongodb://searchhistory:history@ds127260.mlab.com:27260/imgsearch";
var app = express();

app.use("/search/", function(req, res){
    var url = (req.path).slice(1);
    var insertobj = {
        "search": url,
        "time": new Date()
    };
    
    mongo.connect(mongourl, function(err, db){
        if(err) throw err;
        var coll = db.collection("search");
        coll.insert(insertobj, function(err){
            if(err) throw err;
            db.close();
        })
    });
    
    var offset = req.query.offset;
    if(offset)url+="&offset="+offset;
    searcher(url, function(data){res.send(data)});
    
});

app.use("/history/", function(req, res){
    mongo.connect(mongourl, function(err, db){
        if(err) throw err;
        var coll = db.collection("search");
        coll.find({}).toArray(function(err, docs){
            if(err) throw err;
            res.send(docs);
        });
    });
});


app.listen(process.env.PORT);

function searcher(url, callback){
    request({
        uri: "https://api.cognitive.microsoft.com/bing/v5.0/images/search?q=" + url + "&count=10",
        method: "GET",
        headers:{
            "Ocp-Apim-Subscription-Key": "34d8756f80004652b4ba3bc993494ecb"
        }
    }, function(err, res, body){
        if(err) throw err;
        var obj = JSON.parse(body);
        var arr = obj.value;
        var ans = [];
        arr.forEach(function(e, i){
            var temp = {
                "URL": arr[i].contentUrl,
                "Text":arr[i].name,
                "Page":arr[i].hostPageUrl
            };
            ans.push(temp);
        });
        callback(ans);
    });
}