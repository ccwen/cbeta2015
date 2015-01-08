/*
TODO , normalize all traditional and variants to simplified Chinese

foldername (大部類 level 1, 冊 level 2)
經名  level 3
mulu level 4~level8

repeat beg0639002
*/
var taisho="/CBReader/XML/T*/*.xml";//T01n0001_001
var tei=require("ksana-indexer").tei;
var juannow=0,njuan=0,title="";
var filename2sutrano=function(fn) {
	var m=fn.match(/n(.*?)_/);
	if (m) return m[1];
}
var do_milestone=function(text,tag,attributes,status) {
	juannow=parseInt(attributes["n"],10);
}

var do_juan=function(text,tag,attributes,status) {
	if (attributes["fun"]=="open") {		
		njuan++;
		var sutrano=filename2sutrano(status.filename) || "?";
		return [
			{path:["juan","text"], value:text  }
			,{path:["juan","no"], value: sutrano+"."+attributes["n"] }
			,{path:["sutra",sutrano,"juan"], value:[attributes["n"] ,njuan]   }
		]
	}
	return null;
}

var folder2name=require("./foldername");

var folder=0,lastfolder=0,newfolder=1;
var extramulu=function(vpos) {
	var res=[];
	if (newfolder>0) {
		for (var i=0;i<folder2name.length;i++){
			var toc=folder2name[i];
			if (toc[0]==newfolder) {
				res.push(
					{path:["mulu_depth"], value:toc[2] }
					,{path:["mulu"], value:toc[1]  }
					,{path:["mulu_voff"], value: vpos }
					
				);
			}
		}
		newfolder=-1;	
	}
	if (title) {
		res.push(
			{path:["mulu_depth"], value:3 }
			,{path:["mulu"], value:title  }
			,{path:["mulu_voff"], value: vpos }
		);
		title="";
	}	
	return res;
}
var do_mulu=function(text,tag,attributes,status) {
	var res=[];
	if (!attributes["level"]) return null;
		//console.log(text,attributes.level);
	var level=parseInt(attributes.level);

	var res=extramulu(status.vpos);

	res=res.concat([
		{path:["mulu_depth"], value:level+3 }
		,{path:["mulu"], value:text  }
		,{path:["mulu_voff"], value: status.vpos }
	]);
	return res;
}
var captureTags={
	//"cb:juan":do_juan,"/cb:juan":do_juanend
	"milestone":do_milestone,
	"cb:juan":do_juan,
	"cb:mulu":do_mulu,
	//"title":do_title_body,
};

var beforebodystart=function(s,status) {
	var juan=status.filename.substr(status.filename.length-7,3);
	//capture title from teiHeader
	if (juan!="001") return;

	var titleend=s.indexOf('</title>');
	var comma=titleend;
	while (s[comma]!="," && comma) comma--;
	title=s.substring(comma+6,titleend);
}
var afterbodyend=function(s,status) {
	//status has parsed body text and raw body text, raw start text
	var apps=tei(status.starttext+s,status.parsed,status.filename,config,status);
	//console.log(apps)
}

var getFolder=function(fn) {
	var idx=fn.lastIndexOf(require("path").sep);
	if (idx==-1) {
		idx=fn.lastIndexOf("/");
	}
	if (idx==-1) return 0;
	folder=parseInt(fn.substr(idx+2,2));
	return folder;
}
var warning=function() {
	console.log.apply(console,arguments);
}

var onFile=function(fn) {

	var folder=getFolder(fn);
	if (folder!=lastfolder) {
		newfolder=folder;
	}
	juannow=0;
	lastfolder=folder;
	process.stdout.write("indexing "+fn+"\033[0G");
}
var setupHandlers=function() {
	this.addHandler("cb:div/p/note", require("./note"));
	this.addHandler("cb:div/p/app", require("./apparatus"));
	this.addHandler("cb:div/p/choice", require("./choice"));
	this.addHandler("cb:div/p/cb:tt", require("./cbtt"));
}
var finalized=function(session) {
	console.log("VPOS",session.vpos);
	console.log("FINISHED");
}
var finalizeField=function(fields) {

}
var loadToSim=function() {
	var fs=require("fs");
	if (fs.existsSync("tosim.json")){
		return JSON.parse(fs.readFileSync("tosim.json","utf8"));
	} else return [];	
}
var loadBigram=function() {
	var fs=require("fs");
	if (fs.existsSync("bigram.json")){
		return JSON.parse(fs.readFileSync("bigram.json","utf8"));
	} else return [];
}
var beforeParseTag=function(xml) {
	//make <back> as root node
	var back=xml.indexOf("<back>");
	xml=xml.substr(back);
	xml=xml.replace("</text></TEI>","");
	return xml;
}

var config={
	name:"cbeta"
	,meta:{
		config:"simple1"	
		,bigram:loadBigram()
		,normalize:loadToSim()
	}
	,glob:taisho
	,segsep:"pb.n"
	,format:"TEI-P5"
	,bodystart: "<body>"
	,bodyend : "</body>"
	,reset:true
	,setupHandlers:setupHandlers
	,finalized:finalized
	,finalizeField:finalizeField
	,warning:warning
	,captureTags:captureTags
	,callbacks: {
		beforebodystart:beforebodystart
		,afterbodyend:afterbodyend
		,onFile:onFile
		,beforeParseTag:beforeParseTag
	}
}
require("ksana-indexer").build(config);
module.exports=config;