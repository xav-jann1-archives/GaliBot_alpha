var Debug = require('./Debug.js'); // LIB: Affichage console 
var NoSQL = require('nosql');
var db;

exports.init = function(hostname, username, password, database) {
	db = NoSQL.load("mongodb://" + username + ":" + password + "11@" + hostname + "/" + database);
	console.log(db.find());
}

exports.close = function() {
	//Mongo.close();
}