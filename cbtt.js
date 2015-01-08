var cbtt=null,cbt=null;
var cbtts=[];

var resolve=function(anchors,texts) { //resolve app and cb:tt
	var froms={};
	cbtts.map(function(A,idx){ 
		if (!A.from) {
			API.warning("CBTT error, no 'from' in "+JSON.stringify(A));
			return;
		} 
		if (froms[A.from]) API.warning("repeat id "+A.from);
		froms[A.from]=idx+1;
	});

	for (var i=0;i<anchors.length;i++) {
		var id=anchors[i][3];
		var link=anchors[i][4] || [];
		if (froms[id]) {

			var rdg=cbtts[ froms[id]-1].rdg;
			/*
			var lemma=cbtt[ froms[id]-1].lemma.replace(/[\n\t]/g,"");
			var sourcetext=texts[anchors[i][0]].t.substr( anchors[i][1], anchors[i][2]).replace(/[\n\t]/g,"");
			sourcetext=sourcetext.substring(0,lemma.length);//remote possible node beg0816012 , <note> is removed
			//beg0034031 , inline note, sourcetext is ""
			if (lemma!=sourcetext && lemma &&sourcetext) console.log("lemma not same"+JSON.stringify(lemma+"<>"+sourcetext+" id:"+id));
			*/
			link.push({type:"cbtt", rdg:rdg});
		}
		anchors[i][4]=link;
	}
}
var handler=function(root) {
	var node=this.now.name;
	if (root) {
		if (node=="cb:tt" && this.now.attributes["type"]=="app")  {
			cbtt={from:this.now.attributes["from"].substr(1),cbt:[]};
		} else cbtt=null; //not processing
	} else {
		if (node=="cb:t") {
			this.text="";
			cbt={lang:this.now.attributes["xml:lang"]};
		} else if (node=="app") {
			this.parentHandler=handler;
			this.parentCloseHandler=close_handler;
			this.handler=require("./apparatus").handler;
			this.close_handler=require("./apparatus").close_handler;
			this.handler(true);
		}
	}
}
var close_handler=function(root) {
	var node=this.now.name;
	if (root) {
		if (cbtt) cbtts.push(cbtt);
		cbtt=null;
	} else {
		if (node=="cb:t" &&cbtt) {
			cbt.text=this.text;
			this.text="";
			cbtt.cbt.push(cbt);
			cbt=null;
		} else if (node=="app") {
			this.parentHandler=null;
			this.parentCloseHandler=null;
			if (typeof this.app=="undefined") {
				
					return;
			}
			this.text+=this.app.lemma;
			this.app=null;
			this.handler=handler;
			this.close_handler=close_handler;
		}
	}
}
var result=function() {
	return cbtts;
}
var reset=function() {
	cbtts=[];
	cbtt=null;
}
var warning=function(err) {
	console.log(err);
}
var API={handler:handler,close_handler:close_handler,
	resolve:resolve,result:result,reset:reset,name:"cbtt",warning:warning};
module.exports=API;