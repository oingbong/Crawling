var mongoose	= require('mongoose');
var model 		= require('./schemaModel.js');

mongoose.connect('mongodb://localhost:27017/sofDB');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
var a1= db.once('open',function(){
	model.find({},{},function (err, sampleModel) {
		mongoose.connection.close();
		console.log(sampleModel);
	})
});