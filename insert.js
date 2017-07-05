var model 		= require('./schemaModel.js');
var request     = require('request');
var cheerio     = require('cheerio');
var http        = require('http');
var mongoose    = require('mongoose');

var setPageNumber; // 하나씩 증가하기 위해 글로벌 선언
var dataCheck = []; // 중복 데이터 확인하기 위한 것 , 추후 DB의 값을 가져와서 비교

requestServer(1, 0); // 1: tabNumber

function requestServer(tabNumber, earlyAnswerDate) {
    // 시작할 게시물 번호 세팅
    if (setPageNumber == undefined)
        setPageNumber = 37000000;

    var options = {
        url: 'https://stackoverflow.com/questions/' + setPageNumber + '?page=' + tabNumber + '&answertab=votes',
        headers : {
            // 'User-Agent' : 'request'
        }
    };
    console.log('------------------------------');
    console.log('tabNumber : ' + tabNumber + ' / pageNumber : ' + setPageNumber);

    request(options, callback);

    function callback(error, response, body){
        /*
            response.request.href = 현재 페이지 url
            response.request.href.split('/') = [ 'https:','','stackoverflow.com','questions','18102859','visual-studio-could-not-copy-during-build','37000078#37000078' ]
            [4] : 실제 게시물의 번호 , [5] : 게시물 제목 , [6] : 내가 요청한 게시물 번호(만약 4번과 일치하지 않는다면 comment 로 작성된 것)
        */

        let reallyContentNumber = response.request.href.split('/')[4];
        // 실제 게시물 번호와 세팅한 게시물 번호가 일치하면 정상 실행 , 일치하지 않는다면 코멘트로 간주하고 다음 게시물로 넘어갑니다.
        if(reallyContentNumber == setPageNumber){

            // 페이지 번호가 1 이면 정상 실행, 1 보다 크면 바로 데이터 넘겨줍니다. (이유 : comment만 구하면 되기 때문입니다.)
            if(tabNumber == 1){
                $ = cheerio.load(body);
                let title = $('#question-header > h1 > a');
                // 페이지를 찾을 수 없는 기준을 html()으로 잡을 수 있습니다.
                // 이 기준에 적합하면 mongoDB에 데이터 저장해 줍니다.   
                if (title.html() != null){ 
                    // 해당 데이터가 없다면 -1 , 있다면 인덱스번호 리턴
                    // 나중에 배열 대신에 mongoDB의 제목과 비교 (만약 하게 된다면 일단 mongoDB 에 저장된 타이틀을 배열로 다 가져와서 해야하나?)
                    if(dataCheck.indexOf(title.text()) === -1){
                        console.log('신규 데이터');
                        dataCheck.push(title.text()); // 제목기준 데이터 추가
                        convertData(body, tabNumber, earlyAnswerDate); // data 넘기기
                    }else{
                        console.log('중복 데이터');
                        setPageNumber++;
                        requestServer(1, 0);
                    }
                }else{
                    console.log('게시물 삭제된 URL');
                    setPageNumber++;
                    requestServer(1, 0);
                }
            }else if(tabNumber > 1){
                convertData(body, tabNumber, earlyAnswerDate); // data 넘기기
            }
        }else{
            console.log('코멘트 게시글이므로 다음 번호로 넘어갑니다.');
            setPageNumber++;
            requestServer(1, 0);
        }
    }

}

function convertData(data, tabNumber, earlyAnswerDate){
    var commentArr = []; // commentId 를 넣는 배열

    $ = cheerio.load(data);

    let parseTitle = $('#question-header > h1 > a');
    let parseViewCount = $('#qinfo > tbody > tr:nth-child(2) > td:nth-child(2) > p > b');
    let parseQuestionTime = $('#question > table > tbody > tr:nth-child(1) > .postcell > div > .fw > tbody > tr > .owner > .user-info > div:nth-child(1) > span'); 
    let parseQuestionUserName = $('#question > table > tbody > tr:nth-child(1) > .postcell > div > .fw > tbody > tr > .owner > .user-info > div:nth-child(3) > a'); 
    let parseQuestionUserUrl = $('#question > table > tbody > tr:nth-child(1) > .postcell > div > .fw > tbody > tr > .owner > .user-info > div:nth-child(3) > a'); 
    let parseAnswersCount = $('#answers-header > div > h2 > span');
    let answers = $('#answers > .answer'); // answers 의 아이디값을 가져옵니다. comment 에서 사용

    let title = parseTitle.text();
    let viewCount = parseViewCount.text(); // text() , html() 둘다 같음
    let questionTime = Date.parse(parseQuestionTime.attr('title')); // title 속성값 가져오기 위해 사용
    let questionUserName = parseQuestionUserName.text(); // text() , html() 둘다 같음
    let questionUserUrl = parseQuestionUserUrl.attr('href'); // href 속성값 가져오기 위해 사용
    let answersCount = parseAnswersCount.text(); // text() , html() 둘다 같음

    // console.log('title : ' + title);
    // console.log('viewCount : ' + viewCount); 
    // console.log('questionTime : ' + questionTime);
    // console.log('questionUserName : ' + questionUserName);
    // console.log('questionUserUrl : ' + questionUserUrl);
    // console.log('answersCount : ' + answersCount);

    /*
        응답 시간 구하기 위해 응답의 각 id 를 배열로 가져옵니다.
        1. 가져온 응답의 수(배열길이)가 30개 초과면 다음 Next 버튼 누르게 trigger OR 30개 이하면 return
        2. 만약 1번에서 Next 버튼이 없다면 return
    */
    commentArr = []; // 배열 비워주기
    answers.each(function(){
        commentArr.push($(this).attr('id'));
    });

    // comment 가 있다면 데이터 추가하고 없다면 다음페이지 이동( 기준 : answersCount)
    if(answersCount == ''){
        setPageNumber++;
        requestServer(1, 0);
        mongoConnectAndInsertData(title, viewCount, questionTime, questionUserName, questionUserUrl, answersCount, null);
    }else{
        comment(data, commentArr, earlyAnswerDate, tabNumber, title, viewCount, questionTime, questionUserName, questionUserUrl, answersCount);
    }
}

function comment(data, arr, earlyAnswerDate, tabNumber, title, viewCount, questionTime, questionUserName, questionUserUrl, answersCount){
    var findQuickDate = []; // answer 중에 가장 빠른 시간 찾기 위한 배열

    $ = cheerio.load(data);

    let hasNextButton = $('#answers > .pager-answers > a[rel="next"] > span');

    let earliestDate = 0;

    // 가장 빠른 시간 구하기
    for(var i=0; i < arr.length; i++){
        let answersTime = $('#answers > #'+ arr[i] +' > table > tbody > tr:nth-child(1) > .answercell > table > tbody > tr > td:nth-child(3) > div > .user-action-time > span');
        // console.log('answersTime : ' + answersTime.attr('title'));
        if(answersTime.attr('title') != undefined){ // 날짜가 존재하는 데이터만 배열에 Date로 변환하여 추가하기
            findQuickDate.push(Date.parse(answersTime.attr('title')));
        }
    }
    
    earliestDate = Math.min.apply(null, findQuickDate); // 배열 중 작은 수 구하기 (가장 빠른 날짜 구하기)

    /*
        0 이면 기본 세팅 값이므로 넘어가고 0이 아닌 경우에는 이전 페이지에서 가장 응답시간이 빨랐던 데이터를 담고 있습니다.
    */
    if(earlyAnswerDate != 0){
        earliestDate = (earliestDate < earlyAnswerDate ? earliestDate : earlyAnswerDate);
    }

    /*
        null == 다음페이지가 없는 것으로 판단하고 setPageNumber +1 합니다.
        null != 현재페이지에 +1 을 하여 다시 호출합니다.
    */
    if(hasNextButton.html() != null){
        requestServer(tabNumber + 1, earliestDate);
    }else{
        mongoConnectAndInsertData(title, viewCount, questionTime, questionUserName, questionUserUrl, answersCount, earliestDate);
        setPageNumber++;
        requestServer(1, 0);
    }
}


function mongoConnectAndInsertData(title, viewCount, questionTime, questionUserName, questionUserUrl, answersCount, earliestDate){
    if(earliestDate == null){
        earliestDate = 0;
    }
    if(questionTime == NaN){
        questionTime = 0;
    }
	mongoose.connect('mongodb://localhost:27017/sofDB');
	var modelData = new model({
        title: title
       , viewCount: viewCount
       , questionTime: questionTime
       , questionUserName: questionUserName
       , questionUserUrl: questionUserUrl
       , answersCount: answersCount
       , answerTime: earliestDate
	});
	modelData.save(function(err){
		if(err) console.log(err);
        else console.log('DB save title : ' + title);
	});
}






