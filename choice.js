var choice=null;
var choices=[];
//deal with choice with note

var handler=function(root) {
	if (this.now.name=="choice") {
		if (root) {
			var from=this.now.attributes["cb:from"];
			choice={corr:"",sic:""};
			if (from) choice.from=from.substr(1);			
		} else {
			this.parentCloseHandler=close_handler;// choice in choice
		}
	}
}
var close_handler=function(root) {
	var node=this.now.name;
	if (node=="corr") {
		choice.corr=this.text;
		this.text="";
	} else if (node=="sic") {
		choice.sic=this.text;
		this.text="";
	} else if (node=="reg") {
		choice.reg=this.text;
		this.text="";
	} else if (node=="orig") {
		choice.orig=this.text;
		this.text="";
	}else if (node=="choice") {
		if (this.now.attributes.from) choice.from=this.now.attributes.from.substr(1);
		if (this.now.attributes.to) choice.to=this.now.attributes.to.substr(1);
		if (this.parentCloseHandler) {
			this.choice=choice;		
			var chandler=this.parentCloseHandler;
			this.parentCloseHandler=null;
			//to prevent choice/corr/choice to double push into choices
			if (chandler!=close_handler) chandler.apply(this,[true]);
		} else {
			if (choice.from) choices.push(choice); 
		}
	}
}
var resolve=function(anchors,texts){
	var froms={};
	choices.map(function(C,idx){ 
		if (!C.from) {
			API.warning("no 'from' in "+JSON.stringify(C));
			return;
		} 
		if (froms[C.from]) API.warning("repeat id "+C.from);
		froms[C.from]=idx+1;
	});

	for (var i=0;i<anchors.length;i++) {
		var id=anchors[i][3];
		var link=anchors[i][4] || [];
		if (froms[id]) {
			var sic=choices[ froms[id]-1].sic;
			/*
			var corr=choices[ froms[id]-1].corr.replace(/[\n\t]/g,"");
			var sourcetext=texts[anchors[i][0]].t.substr( anchors[i][1], anchors[i][2]).replace(/[\n\t]/g,"");
			//beg0034031 , inline note, sourcetext is ""
			if (corr!=sourcetext && corr &&sourcetext) console.log("corr not same"+JSON.stringify(corr+"<>"+sourcetext+" id:"+id));
			*/
			link.push({type:"choice", sic:sic});
		}
		anchors[i][4]=link;
	}
}
var result=function() {
	return choices;
}
var reset=function() {
	choices=[];
	choice=null;
}
var warning=function(err) {
	console.log(err);
}
var API={handler:handler,close_handler:close_handler,
	resolve:resolve,result:result,reset:reset,name:"choice",warning:warning};
module.exports=API;