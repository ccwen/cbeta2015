var app=null,rdg=null,childrdg=null,childapp=null;  //<app> apparatus
var apps=[];
/*
TODO 
  nested app can have lem and rdg

*/
var resolve=function(anchors,texts) { //resolve app and cb:tt
	var froms={};
	apps.map(function(A,idx){ 
		if (!A.from) {
			API.warning("APP error, no 'from' in "+JSON.stringify(A));
			return;
		} 
		if (froms[A.from]) {
			API.warning("repeat id "+A.from);
		}
		froms[A.from]=idx+1;
	});
/*known problem
  beg0053009 , extra pb , causing last word 來 not included in source text
*/
	for (var i=0;i<anchors.length;i++) {
		var id=anchors[i][3];
		var link=anchors[i][4] || [];
		if (froms[id]) {
			/*
			var rdg=apps[ froms[id]-1].rdg;
			var lemma=apps[ froms[id]-1].lemma.replace(/[\n\t]/g,"");
			var sourcetext=texts[anchors[i][0]].t.substr( anchors[i][1], anchors[i][2]).replace(/[\n\t]/g,"");
			sourcetext=sourcetext.substring(0,lemma.length);//remote possible node beg0816012 , <note> is removed
			//beg0034031 , inline note, sourcetext is ""
			if (lemma!=sourcetext && lemma &&sourcetext) console.log("lemma not same"+JSON.stringify(lemma+"<>"+sourcetext+" id:"+id));
			*/
			link.push({type:"app", rdg:rdg});
		}
		anchors[i][4]=link;
	}
}
var beforenote="";
var handler=function(root) {
	var node=this.now.name;
	if (root) {
		var from=this.now.attributes.from;
		if (from) from=from.substr(1);
		app={lemma:"",rdg:[],from:from};
	} else {
		if (node=="app") {		
				childapp={lemma:"",rdg:[] , from: app.from};//reuse parent from
		}else if (node=="rdg") {
			if (childapp)childrdg={text:"",wit: this.now.attributes.wit };
			else rdg={text:"",wit: this.now.attributes.wit };
		} else if (node=="note") {
			beforenote=this.text;
		} else {
		//console.log("unknown tag",this.now.name);
		}
	}
}


var close_handler=function(root) {
	var node=this.now.name;
	if (node=="app") {
		if (root) {
			apps.push(app);
			app=null;
		} else {
			if (childapp) this.text+=childapp.lemma; //only take lemma
			if (this.parentCloseHandler && !childapp) { //T02n0125_047.xml cb:tt/cb:t/app/lem/app
				this.app=app;
				this.parentCloseHandler();
			}
			childapp=null;
		}
	} else if (node=="lem") {
		if (childapp) childapp.lemma=this.text;
		else 	app.lemma=this.text;
		this.text="";
	} else if (node=="note") {
		this.text=beforenote;//remove all text inside note
	} else if (node=="rdg") {
		if (childapp) {
			childrdg.text=this.text;
			childapp.rdg.push(childrdg);
		} else {
			if (rdg) {
				rdg.text=this.text;
				app.rdg.push(rdg);
			}
		}
		this.text="";
	}
}
var result=function() {
	return apps;
}
var reset=function() {
	apps=[];
	app=null;
}
var warning=function(err) {
	console.log(err);
}
var API={handler:handler,close_handler:close_handler,
	resolve:resolve,result:result,reset:reset,name:"app",warning:warning};
module.exports=API;