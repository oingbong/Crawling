var request     = require('request');
var cheerio     = require('cheerio');
var http        = require('http');
var mongoose    = require('mongoose');

var setNumber;
function requestServer() {
    if (setNumber == undefined)
        setNumber = 4;
        //setNumber = 35000000;
    console.log('setNumber : ' + setNumber);
    request('https://stackoverflow.com/questions/' + setNumber, function (error, response, body) {
        $ = cheerio.load(body);
        var title = $('#question-header > h1 > a');
        // 페이지를 찾을 수 없는 기준을 html()으로 잡을 수 있습니다.
        // 이 기준에 적합하면 mongoDB에 데이터 저장해 줍니다.
        if (title.html() != null){ 
            console.log('title : ' + title.text());
            mongoConnect(title.text());
        }
    });
    setNumber++;
}

setInterval(function () {
    requestServer();
}, 2000);

function mongoConnect(crawlingData){
    mongoose.connect('mongodb://localhost:27017/sofDB/sof');

    var db = mongoose.connection;
    db.on('error', console.error);
    db.once('open', function(){
        console.log('Connected to mongod server');
    });

    var sampleSchema = mongoose.Schema({
        row1: String
    });
    
    sampleSchema.methods.speak = function (){
        var greeting = this.row1
        ? "Meow row1 is " + this.row1
        : "I don't have a title"
        console.log(greeting);
    }

    var sampleModel = mongoose.model('sampleModel', sampleSchema);

    var sampleIns = new sampleModel({row1: crawlingData});
    console.log(sampleIns.row1);
    sampleIns.speak();

    sampleIns.save(function(err, sampleIns){
        if(err) return console.error(err);
        sampleIns.speak();
    });

    db.close();
}