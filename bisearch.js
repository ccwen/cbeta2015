/* search with bigram enable */
var kde=require("ksana-document").kde;
var kse=require("ksana-document").kse;
var Search=require("ksana-document").search;


var search=function(db) {
	//console.time("search");
	kse.search(db,"菩提心",{range:{start:0},nospan:true},function(data){ //218ms without bigram
		//console.timeEnd("search");
		//console.log(data.excerpt.map(function(d){return d.text}));
		console.log(db.searchtime)
		console.log(data.rawresult.length);
	});
}

/*
var testsplitphrase=function(db) {
	var res=Search.splitPhrase(db,"發菩提心");
	console.log(res);
	res=Search.splitPhrase(db,"菩提心");
	console.log(res);
	res=Search.splitPhrase(db,"所生道");
	console.log(res);
	res=Search.splitPhrase(db,"因緣所生道");
	console.log(res);
	res=Search.splitPhrase(db,"劫劫");
	console.log(res);
	res=Search.splitPhrase(db,"菩提");
	console.log(res);
	res=Search.splitPhrase(db,"菩提屓因緣所生道");
	console.log(res);
	res=Search.splitPhrase(db,"所生道菩提");
	console.log(res);
}
*/
kde.open("cbeta",search);
