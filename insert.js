var model 		= require('./schemaModel.js');
var request     = require('request');
var cheerio     = require('cheerio');
var http        = require('http');
var mongoose    = require('mongoose');

var setNumber; // 하나씩 증가하기 위해 글로벌 선언
var dataCheck = []; // 중복 데이터 확인하기 위한 것

setInterval(function () {
    requestServer();
}, 2000);

requestServer();

function requestServer() {
    if (setNumber == undefined)
        setNumber = 37000000;
    console.log('setNumber : ' + setNumber);
    request('https://stackoverflow.com/questions/' + setNumber, function (error, response, body) {
        $ = cheerio.load(body);
        var title = $('#question-header > h1 > a');
        // 페이지를 찾을 수 없는 기준을 html()으로 잡을 수 있습니다.
        // 이 기준에 적합하면 mongoDB에 데이터 저장해 줍니다.
        if (title.html() != null){ 
            // 해당 데이터가 없다면 -1 , 있다면 인덱스번호 리턴
            if(dataCheck.indexOf(title.text()) === -1){
            	console.log('title : ' + title.text());
            	dataCheck.push(title.text());
            	mongoConnect(title.text());
            }else{
            	console.log('data overlap');
            }
        }else{
        	console.log('게시물 삭제된 URL');
        }
    });
    setNumber++;
}

function mongoConnect(crawlingData){
	mongoose.connect('mongodb://localhost:27017/sofDB');
	var modelData = new model({
		row1: crawlingData
	});
	modelData.save(function(err){
		if(err) console.log(err); 
	});
}
