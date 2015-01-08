var notes=[];
var note=null;
var handler=function(root) {
	var node=this.now.name;
	var target=this.now.attributes.target;
	if (node=="note") {
		if (target) note={target:target.substr(1),text:""};
		else this.handler.null; //note without target is dropped
	} else if (node=="choice") {
		this.parentHandler=handler;
		this.parentCloseHandler=close_handler;
		this.handler=require("./choice").handler;
		this.close_handler=require("./choice").close_handler;
		this.handler(true);
	} else if (node=="app") {
		this.parentHandler=handler;
		this.parentCloseHandler=close_handler;
		this.handler=require("./apparatus").handler;
		this.close_handler=require("./apparatus").close_handler;
		this.handler(true);
	}
}
var close_handler=function(root) {
	var node=this.now.name;
	if (node=="note") {
		note.text=this.text;
		notes.push(note);			
	} else if (node=="choice") {
		this.parentHandler=null;
		this.parentCloseHandler=null;
		this.text+=this.choice.corr;
		this.choice=null;
		this.handler=handler;
		this.close_handler=close_handler;
	} else if (node=="app") {
		this.parentHandler=null;
		this.parentCloseHandler=null;
		this.text+=this.app.lemma;
		this.app=null;
		this.handler=handler;
		this.close_handler=close_handler;
	}
}
var resolve=function(anchors) {
	var targets={};
	notes.map(function(N,idx){ 
		if (!N.target) {
			warn("no 'target' in "+JSON.stringify(N));
			return;
		} 
		/*
		t01n0026_009.xml
		<note n="0478005" place="foot" type="cf." target="#nkr_note_cf._0478005">[Nos. 33-35]</note>
		<note n="0478005" place="foot" type="cf." target="#nkr_note_cf._0478005">cf. Vinaya, Cu IX.1.4<
		*/
		if (targets[N.target]) { //multiple <note> share same target
			if (typeof targets[N.target]=="number")  targets[N.target]=[targets[N.target]];
			targets[N.target].push(idx+1);
		}else {
			targets[N.target]=idx+1;	
		}
	});

	for (var i=0;i<anchors.length;i++) {
		var id=anchors[i][3];
		var link=anchors[i][4] || [];
		if (targets[id]) {
			if (typeof targets[id]=="number") {
				var text=notes[ targets[id]-1].text;	
			} else { //joining multiple note
				var text="";
				for (var j=0;j<targets[id].length;j++) {
					text+=notes[targets[id][j]-1].text+'\n';
				}
			}
			link.push({type:"note", text:text});
		}
		anchors[i][4]=link;
	}
}
var result=function() {
	return notes;
}
var reset=function() {
	notes=[];
	note=null;
}
var warning=function(err) {
	console.log(err);
}
var API={handler:handler,close_handler:close_handler,
	resolve:resolve,result:result,reset:reset,name:"note",warning:warning};
module.exports=API;