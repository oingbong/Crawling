var mongoose 	= require('mongoose');
var Schema 		= mongoose.Schema;
/*
	일반적으로 스키마를 인스턴스화 한 다음 필요에 따라 전역 개체를 호출 해야합니다.
	이전에는 이미 스키마가 정의되어 있고 다시 스키마를 정의하므로 오류를 발생하였습니다.
*/
var sampleSchema = new Schema({
   row1:String
});
module.exports = mongoose.model('sofData', sampleSchema);
/*
	크롤링 하기 전에 mongoDB 실행 한 후에 크롤링 시작해야 합니다.
	경로
		서버 실행
			1. cd /usr/local/bin/mongodb/mongodb-osx-x86_64-3.4.5/bin/
			2. mongod
		mongoDB 커맨드
			1. cd /usr/local/bin/mongodb/mongodb-osx-x86_64-3.4.5/bin/
			2. mongo
*/

/*
	mongoDB 에서 table 명은 위에 mongoose.model에 정의된 처음 부분으로 정의되며 뒤에 s가 붙습니다.
	명령어
		show databases
		use 데이터베이스명
		show tables
		db.테이블명.find()
		db.테이블명.remove({}) // 전체 데이터 삭제
		db.테이블명.remove({row1:'기준되는 데이터명'}) // 기준 데이터 삭제
		db.테이블명.drop() // 테이블 삭제 
		db.테이블명.count() // data 갯수 구하기
		db.테이블명.datasize() // return unit : byte
*/

/*
	알게 된 사항 및 설정 사항
	1.
		mongoose 버전은 최신버전보다는 4.10 버전 추천. openUri 등 에러 발생
			npm install mongoose@4.10.8 --save
	2.
		.bash_profile 에 mongoDB 경로 지정
			export MONGO_PATH=/usr/local/bin/mongodb/mongodb-osx-x86_64-3.4.5
			export PATH=$PATH:MONGO_PATH/bin
	3.

*/
