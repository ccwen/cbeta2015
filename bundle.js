(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"c:\\ksana2015\\cbeta2015\\index.js":[function(require,module,exports){
var runtime=require("ksana2015-webruntime");
runtime.boot("cbeta2014",function(){
	var Main=React.createElement(require("./main.jsx"));
	ksana.mainComponent=React.render(Main,document.getElementById("main"));
});
},{"./main.jsx":"c:\\ksana2015\\cbeta2015\\main.jsx","ksana2015-webruntime":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\index.js"}],"c:\\ksana2015\\cbeta2015\\main.jsx":[function(require,module,exports){

var tofindExtra=function(historytofind) {
  var res=[];
  historytofind.map(function(tf){
  	res.unshift(React.createElement("a", {href: "#", onClick: this.dosearch}, tf));
  	res.unshift(React.createElement("span", null, " "));
  },this);
  return res;
}
 
var Main = React.createClass({displayName: "Main",
  mixins:[require("ksana2015-swipe3-ui").main],
  tocTag:"mulu",  
  defaultTofind:"發菩提心",
  tofindExtra:tofindExtra,
  dbid:"cbeta",
  dictionaries:["dingfubao_dict"]
});
module.exports=Main;
},{"ksana2015-swipe3-ui":"c:\\ksana2015\\node_modules\\ksana2015-swipe3-ui\\index.js"}],"c:\\ksana2015\\node_modules\\ksana-analyzer\\configs.js":[function(require,module,exports){
var tokenizers=require('./tokenizers');
var normalizeTbl=null;
var setNormalizeTable=function(tbl,obj) {
	if (!obj) {
		obj={};
		for (var i=0;i<tbl.length;i++) {
			var arr=tbl[i].split("=");
			obj[arr[0]]=arr[1];
		}
	}
	normalizeTbl=obj;
	return obj;
}
var normalize1=function(token) {
	if (!token) return "";
	token=token.replace(/[ \n\.,，。！．「」：；、]/g,'').trim();
	if (!normalizeTbl) return token;
	if (token.length==1) {
		return normalizeTbl[token] || token;
	} else {
		for (var i=0;i<token.length;i++) {
			token[i]=normalizeTbl[token[i]] || token[i];
		}
		return token;
	}
}
var isSkip1=function(token) {
	var t=token.trim();
	return (t=="" || t=="　" || t=="※" || t=="\n");
}
var normalize_tibetan=function(token) {
	return token.replace(/[།་ ]/g,'').trim();
}

var isSkip_tibetan=function(token) {
	var t=token.trim();
	return (t=="" || t=="　" ||  t=="\n");	
}
var simple1={
	func:{
		tokenize:tokenizers.simple
		,setNormalizeTable:setNormalizeTable
		,normalize: normalize1
		,isSkip:	isSkip1
	}
	
}
var tibetan1={
	func:{
		tokenize:tokenizers.tibetan
		,setNormalizeTable:setNormalizeTable
		,normalize:normalize_tibetan
		,isSkip:isSkip_tibetan
	}
}
module.exports={"simple1":simple1,"tibetan1":tibetan1}
},{"./tokenizers":"c:\\ksana2015\\node_modules\\ksana-analyzer\\tokenizers.js"}],"c:\\ksana2015\\node_modules\\ksana-analyzer\\index.js":[function(require,module,exports){
/* 
  custom func for building and searching ydb

  keep all version
  
  getAPI(version); //return hash of functions , if ver is omit , return lastest
	
  postings2Tree      // if version is not supply, get lastest
  tokenize(text,api) // convert a string into tokens(depends on other api)
  normalizeToken     // stemming and etc
  isSpaceChar        // not a searchable token
  isSkipChar         // 0 vpos

  for client and server side
  
*/
var configs=require("./configs");
var config_simple="simple1";
var optimize=function(json,config) {
	config=config||config_simple;
	return json;
}

var getAPI=function(config) {
	config=config||config_simple;
	var func=configs[config].func;
	func.optimize=optimize;
	if (config=="simple1") {
		//add common custom function here
	} else if (config=="tibetan1") {

	} else throw "config "+config +"not supported";

	return func;
}

module.exports={getAPI:getAPI};
},{"./configs":"c:\\ksana2015\\node_modules\\ksana-analyzer\\configs.js"}],"c:\\ksana2015\\node_modules\\ksana-analyzer\\tokenizers.js":[function(require,module,exports){
var tibetan =function(s) {
	//continuous tsheg grouped into same token
	//shad and space grouped into same token
	var offset=0;
	var tokens=[],offsets=[];
	s=s.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
	var arr=s.split('\n');

	for (var i=0;i<arr.length;i++) {
		var last=0;
		var str=arr[i];
		str.replace(/[།་ ]+/g,function(m,m1){
			tokens.push(str.substring(last,m1)+m);
			offsets.push(offset+last);
			last=m1+m.length;
		});
		if (last<str.length) {
			tokens.push(str.substring(last));
			offsets.push(last);
		}
		if (i===arr.length-1) break;
		tokens.push('\n');
		offsets.push(offset+last);
		offset+=str.length+1;
	}

	return {tokens:tokens,offsets:offsets};
};
var isSpace=function(c) {
	return (c==" ") ;//|| (c==",") || (c==".");
}
var isCJK =function(c) {return ((c>=0x3000 && c<=0x9FFF) 
|| (c>=0xD800 && c<0xDC00) || (c>=0xFF00) ) ;}
var simple1=function(s) {
	var offset=0;
	var tokens=[],offsets=[];
	s=s.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
	arr=s.split('\n');

	var pushtoken=function(t,off) {
		var i=0;
		if (t.charCodeAt(0)>255) {
			while (i<t.length) {
				var c=t.charCodeAt(i);
				offsets.push(off+i);
				tokens.push(t[i]);
				if (c>=0xD800 && c<=0xDFFF) {
					tokens[tokens.length-1]+=t[i]; //extension B,C,D
				}
				i++;
			}
		} else {
			tokens.push(t);
			offsets.push(off);	
		}
	}
	for (var i=0;i<arr.length;i++) {
		var last=0,sp="";
		str=arr[i];
		str.replace(/[_0-9A-Za-z]+/g,function(m,m1){
			while (isSpace(sp=str[last]) && last<str.length) {
				tokens[tokens.length-1]+=sp;
				last++;
			}
			pushtoken(str.substring(last,m1)+m , offset+last);
			offsets.push(offset+last);
			last=m1+m.length;
		});

		if (last<str.length) {
			while (isSpace(sp=str[last]) && last<str.length) {
				tokens[tokens.length-1]+=sp;
				last++;
			}
			pushtoken(str.substring(last), offset+last);
			
		}		
		offsets.push(offset+last);
		offset+=str.length+1;
		if (i===arr.length-1) break;
		tokens.push('\n');
	}

	return {tokens:tokens,offsets:offsets};

};

var simple=function(s) {
	var token='';
	var tokens=[], offsets=[] ;
	var i=0; 
	var lastspace=false;
	var addtoken=function() {
		if (!token) return;
		tokens.push(token);
		offsets.push(i);
		token='';
	}
	while (i<s.length) {
		var c=s.charAt(i);
		var code=s.charCodeAt(i);
		if (isCJK(code)) {
			addtoken();
			token=c;
			if (code>=0xD800 && code<0xDC00) { //high sorragate
				token+=s.charAt(i+1);i++;
			}
			addtoken();
		} else {
			if (c=='&' || c=='<' || c=='?' || c=="," || c=="."
			|| c=='|' || c=='~' || c=='`' || c==';' 
			|| c=='>' || c==':' 
			|| c=='=' || c=='@'  || c=="-" 
			|| c==']' || c=='}'  || c==")" 
			//|| c=='{' || c=='}'|| c=='[' || c==']' || c=='(' || c==')'
			|| code==0xf0b || code==0xf0d // tibetan space
			|| (code>=0x2000 && code<=0x206f)) {
				addtoken();
				if (c=='&' || c=='<'){ // || c=='{'|| c=='('|| c=='[') {
					var endchar='>';
					if (c=='&') endchar=';'
					//else if (c=='{') endchar='}';
					//else if (c=='[') endchar=']';
					//else if (c=='(') endchar=')';

					while (i<s.length && s.charAt(i)!=endchar) {
						token+=s.charAt(i);
						i++;
					}
					token+=endchar;
					addtoken();
				} else {
					token=c;
					addtoken();
				}
				token='';
			} else {
				if (c==" ") {
					token+=c;
					lastspace=true;
				} else {
					if (lastspace) addtoken();
					lastspace=false;
					token+=c;
				}
			}
		}
		i++;
	}
	addtoken();
	return {tokens:tokens,offsets:offsets};
}
module.exports={simple:simple,tibetan:tibetan};
},{}],"c:\\ksana2015\\node_modules\\ksana-database\\bsearch.js":[function(require,module,exports){
var indexOfSorted = function (array, obj, near) { 
  var low = 0,
  high = array.length;
  while (low < high) {
    var mid = (low + high) >> 1;
    if (array[mid]==obj) return mid;
    array[mid] < obj ? low = mid + 1 : high = mid;
  }
  if (near) return low;
  else if (array[low]==obj) return low;else return -1;
};
var indexOfSorted_str = function (array, obj, near) { 
  var low = 0,
  high = array.length;
  while (low < high) {
    var mid = (low + high) >> 1;
    if (array[mid]==obj) return mid;
    (array[mid].localeCompare(obj)<0) ? low = mid + 1 : high = mid;
  }
  if (near) return low;
  else if (array[low]==obj) return low;else return -1;
};


var bsearch=function(array,value,near) {
	var func=indexOfSorted;
	if (typeof array[0]=="string") func=indexOfSorted_str;
	return func(array,value,near);
}
var bsearchNear=function(array,value) {
	return bsearch(array,value,true);
}

module.exports=bsearch;//{bsearchNear:bsearchNear,bsearch:bsearch};
},{}],"c:\\ksana2015\\node_modules\\ksana-database\\index.js":[function(require,module,exports){
var KDE=require("./kde");
//currently only support node.js fs, ksanagap native fs, html5 file system
//use socket.io to read kdb from remote server in future
module.exports=KDE;
},{"./kde":"c:\\ksana2015\\node_modules\\ksana-database\\kde.js"}],"c:\\ksana2015\\node_modules\\ksana-database\\kde.js":[function(require,module,exports){
/* Ksana Database Engine

   2015/1/2 , 
   move to ksana-database
   simplified by removing document support and socket.io support


*/
var pool={},localPool={};
var apppath="";
var bsearch=require("./bsearch");
var Kdb=require('ksana-jsonrom');
var kdbs=[]; //available kdb , id and absolute path
var strsep="\uffff";
var kdblisted=false;
/*
var _getSync=function(paths,opts) {
	var out=[];
	for (var i in paths) {
		out.push(this.getSync(paths[i],opts));	
	}
	return out;
}
*/
var _gets=function(paths,opts,cb) { //get many data with one call

	if (!paths) return ;
	if (typeof paths=='string') {
		paths=[paths];
	}
	var engine=this, output=[];

	var makecb=function(path){
		return function(data){
				if (!(data && typeof data =='object' && data.__empty)) output.push(data);
				engine.get(path,opts,taskqueue.shift());
		};
	};

	var taskqueue=[];
	for (var i=0;i<paths.length;i++) {
		if (typeof paths[i]=="null") { //this is only a place holder for key data already in client cache
			output.push(null);
		} else {
			taskqueue.push(makecb(paths[i]));
		}
	};

	taskqueue.push(function(data){
		output.push(data);
		cb.apply(engine.context||engine,[output,paths]); //return to caller
	});

	taskqueue.shift()({__empty:true}); //run the task
}

var getFileRange=function(i) {
	var engine=this;

	var filesegcount=engine.get(["filesegcount"]);
	if (filesegcount) {
		if (i==0) {
			return {start:0,end:filesegcount[0]-1};
		} else {
			return {start:filesegcount[i-1],end:filesegcount[i]-1};
		}
	}
	//old buggy code
	var filenames=engine.get(["filenames"]);
	var fileoffsets=engine.get(["fileoffsets"]);
	var segoffsets=engine.get(["segoffsets"]);
	var segnames=engine.get(["segnames"]);
	var filestart=fileoffsets[i], fileend=fileoffsets[i+1]-1;

	var start=bsearch(segoffsets,filestart,true);
	//if (segOffsets[start]==fileStart) start--;
	
	//work around for jiangkangyur
	while (segNames[start+1]=="_") start++;

  //if (i==0) start=0; //work around for first file
	var end=bsearch(segoffsets,fileend,true);
	return {start:start,end:end};
}

var getfileseg=function(absoluteseg) {
	var fileoffsets=this.get(["fileoffsets"]);
	var segoffsets=this.get(["segoffsets"]);
	var segoffset=segOffsets[absoluteseg];
	var file=bsearch(fileOffsets,segoffset,true)-1;

	var fileStart=fileoffsets[file];
	var start=bsearch(segoffsets,fileStart,true);	

	var seg=absoluteseg-start-1;
	return {file:file,seg:seg};
}
//return array of object of nfile nseg given segname
var findSeg=function(segname) {
	var segnames=this.get("segnames");
	var out=[];
	for (var i=0;i<segnames.length;i++) {
		if (segnames[i]==segname) {
			var fileseg=getfileseg.apply(this,[i]);
			out.push({file:fileseg.file,seg:fileseg.seg,absseg:i});
		}
	}
	return out;
}
var getFileSegOffsets=function(i) {
	var segoffsets=this.get("segoffsets");
	var range=getFileRange.apply(this,[i]);
	return segoffsets.slice(range.start,range.end+1);
}

var getFileSegNames=function(i) {
	var range=getFileRange.apply(this,[i]);
	var segnames=this.get("segnames");
	return segnames.slice(range.start,range.end+1);
}
var localengine_get=function(path,opts,cb) {
	var engine=this;
	if (typeof opts=="function") {
		cb=opts;
		opts={recursive:false};
	}
	if (!path) {
		if (cb) cb(null);
		return null;
	}

	if (typeof cb!="function") {
		return engine.kdb.get(path,opts);
	}

	if (typeof path=="string") {
		return engine.kdb.get([path],opts,cb);
	} else if (typeof path[0] =="string") {
		return engine.kdb.get(path,opts,cb);
	} else if (typeof path[0] =="object") {
		return _gets.apply(engine,[path,opts,cb]);
	} else {
		engine.kdb.get([],opts,function(data){
			cb(data[0]);//return top level keys
		});
	}
};	

var getPreloadField=function(user) {
	var preload=[["meta"],["filenames"],["fileoffsets"],["segnames"],["segoffsets"],["filesegcount"]];
	//["tokens"],["postingslen"] kse will load it
	if (user && user.length) { //user supply preload
		for (var i=0;i<user.length;i++) {
			if (preload.indexOf(user[i])==-1) {
				preload.push(user[i]);
			}
		}
	}
	return preload;
}
var createLocalEngine=function(kdb,opts,cb,context) {
	var engine={kdb:kdb, queryCache:{}, postingCache:{}, cache:{}};

	if (typeof context=="object") engine.context=context;
	engine.get=localengine_get;

	engine.segOffset=segOffset;
	engine.fileOffset=fileOffset;
	engine.getFileSegNames=getFileSegNames;
	engine.getFileSegOffsets=getFileSegOffsets;
	engine.getFileRange=getFileRange;
	engine.findSeg=findSeg;
	//only local engine allow getSync
	//if (kdb.fs.getSync) engine.getSync=engine.kdb.getSync;
	
	//speedy native functions
	if (kdb.fs.mergePostings) {
		engine.mergePostings=kdb.fs.mergePostings.bind(kdb.fs);
	}
	
	var setPreload=function(res) {
		engine.dbname=res[0].name;
		//engine.customfunc=customfunc.getAPI(res[0].config);
		engine.ready=true;
	}

	var preload=getPreloadField(opts.preload);
	var opts={recursive:true};
	//if (typeof cb=="function") {
		_gets.apply(engine,[ preload, opts,function(res){
			setPreload(res);
			cb.apply(engine.context,[engine]);
		}]);
	//} else {
	//	setPreload(_getSync.apply(engine,[preload,opts]));
	//}
	return engine;
}

var segOffset=function(segname) {
	var engine=this;
	if (arguments.length>1) throw "argument : segname ";

	var segNames=engine.get("segnames");
	var segOffsets=engine.get("segoffsets");

	var i=segNames.indexOf(segname);
	return (i>-1)?segOffsets[i]:0;
}
var fileOffset=function(fn) {
	var engine=this;
	var filenames=engine.get("filenames");
	var offsets=engine.get("fileoffsets");
	var i=filenames.indexOf(fn);
	if (i==-1) return null;
	return {start: offsets[i], end:offsets[i+1]};
}

var folderOffset=function(folder) {
	var engine=this;
	var start=0,end=0;
	var filenames=engine.get("filenames");
	var offsets=engine.get("fileoffsets");
	for (var i=0;i<filenames.length;i++) {
		if (filenames[i].substring(0,folder.length)==folder) {
			if (!start) start=offsets[i];
			end=offsets[i];
		} else if (start) break;
	}
	return {start:start,end:end};
}

 //TODO delete directly from kdb instance
 //kdb.free();
var closeLocal=function(kdbid) {
	var engine=localPool[kdbid];
	if (engine) {
		engine.kdb.free();
		delete localPool[kdbid];
	}
}
var close=function(kdbid) {
	var engine=pool[kdbid];
	if (engine) {
		engine.kdb.free();
		delete pool[kdbid];
	}
}

var getLocalTries=function(kdbfn) {
	if (!kdblisted) {
		kdbs=require("./listkdb")();
		kdblisted=true;
	}

	var kdbid=kdbfn.replace('.kdb','');
	var tries= ["./"+kdbid+".kdb"
	           ,"../"+kdbid+".kdb"
	];

	for (var i=0;i<kdbs.length;i++) {
		if (kdbs[i][0]==kdbid) {
			tries.push(kdbs[i][1]);
		}
	}
	return tries;
}
var openLocalKsanagap=function(kdbid,opts,cb,context) {
	var kdbfn=kdbid;
	var tries=getLocalTries(kdbfn);

	for (var i=0;i<tries.length;i++) {
		if (fs.existsSync(tries[i])) {
			//console.log("kdb path: "+nodeRequire('path').resolve(tries[i]));
			var kdb=new Kdb.open(tries[i],function(err,kdb){
				if (err) {
					cb.apply(context,[err]);
				} else {
					createLocalEngine(kdb,opts,function(engine){
						localPool[kdbid]=engine;
						cb.apply(context||engine.context,[0,engine]);
					},context);
				}
			});
			return null;
		}
	}
	if (cb) cb.apply(context,[kdbid+" not found"]);
	return null;

}
var openLocalNode=function(kdbid,opts,cb,context) {
	var fs=require('fs');
	var tries=getLocalTries(kdbid);

	for (var i=0;i<tries.length;i++) {
		if (fs.existsSync(tries[i])) {

			new Kdb.open(tries[i],function(err,kdb){
				if (err) {
					cb.apply(context||engine.content,[err]);
				} else {
					createLocalEngine(kdb,opts,function(engine){
							localPool[kdbid]=engine;
							cb.apply(context||engine.context,[0,engine]);
					},context);
				}
			});
			return null;
		}
	}
	if (cb) cb.apply(context,[kdbid+" not found"]);
	return null;
}

var openLocalHtml5=function(kdbid,opts,cb,context) {	
	var engine=localPool[kdbid];
	var kdbfn=kdbid;
	if (kdbfn.indexOf(".kdb")==-1) kdbfn+=".kdb";
	new Kdb.open(kdbfn,function(err,handle){
		if (err) {
			cb.apply(context,[err]);
		} else {
			createLocalEngine(handle,opts,function(engine){
				localPool[kdbid]=engine;
				cb.apply(context||engine.context,[0,engine]);
			},context);
		}
	});
}
//omit cb for syncronize open
var openLocal=function(kdbid,opts,cb,context)  {
	if (typeof opts=="function") { //no opts
		if (typeof cb=="object") context=cb;
		cb=opts;
		opts={};
	}

	var engine=localPool[kdbid];
	if (engine) {
		if (cb) cb.apply(context||engine.context,[0,engine]);
		return engine;
	}

	var platform=require("./platform").getPlatform();
	if (platform=="node-webkit" || platform=="node") {
		openLocalNode(kdbid,opts,cb,context);
	} else if (platform=="html5" || platform=="chrome"){
		openLocalHtml5(kdbid,opts,cb,context);		
	} else {
		openLocalKsanagap(kdbid,opts,cb,context);	
	}
}
var setPath=function(path) {
	apppath=path;
	console.log("set path",path)
}

var enumKdb=function(cb,context){
	return kdbs.map(function(k){return k[0]});
}

module.exports={open:openLocal,setPath:setPath, close:closeLocal, enumKdb:enumKdb};
},{"./bsearch":"c:\\ksana2015\\node_modules\\ksana-database\\bsearch.js","./listkdb":"c:\\ksana2015\\node_modules\\ksana-database\\listkdb.js","./platform":"c:\\ksana2015\\node_modules\\ksana-database\\platform.js","fs":false,"ksana-jsonrom":"c:\\ksana2015\\node_modules\\ksana-jsonrom\\index.js"}],"c:\\ksana2015\\node_modules\\ksana-database\\listkdb.js":[function(require,module,exports){
/* return array of dbid and absolute path*/
var listkdb_html5=function() {
	throw "not implement yet";
	require("ksana-jsonrom").html5fs.readdir(function(kdbs){
			cb.apply(this,[kdbs]);
	},context||this);		

}

var listkdb_node=function(){
	var fs=require("fs");
	var path=require("path")
	var parent=path.resolve(process.cwd(),"..");
	var files=fs.readdirSync(parent);
	var output=[];
	files.map(function(f){
		var subdir=parent+path.sep+f;
		var stat=fs.statSync(subdir );
		if (stat.isDirectory()) {
			var subfiles=fs.readdirSync(subdir);
			for (var i=0;i<subfiles.length;i++) {
				var file=subfiles[i];
				var idx=file.indexOf(".kdb");
				if (idx>-1&&idx==file.length-4) {
					output.push([ file.substr(0,file.length-4), subdir+path.sep+file]);
				}
			}
		}
	})
	return output;
}

var listkdb=function() {
	var platform=require("./platform").getPlatform();
	var files=[];
	if (platform=="node" || platform=="node-webkit") {
		files=listkdb_node();
	} else {
		throw "not implement yet";
	}
	return files;
}
module.exports=listkdb;
},{"./platform":"c:\\ksana2015\\node_modules\\ksana-database\\platform.js","fs":false,"ksana-jsonrom":"c:\\ksana2015\\node_modules\\ksana-jsonrom\\index.js","path":false}],"c:\\ksana2015\\node_modules\\ksana-database\\platform.js":[function(require,module,exports){
var getPlatform=function() {
	if (typeof ksanagap=="undefined") {
		platform="node";
	} else {
		platform=ksanagap.platform;
	}
	return platform;
}
module.exports={getPlatform:getPlatform};
},{}],"c:\\ksana2015\\node_modules\\ksana-jsonrom\\html5read.js":[function(require,module,exports){

/* emulate filesystem on html5 browser */
/* emulate filesystem on html5 browser */
var read=function(handle,buffer,offset,length,position,cb) {//buffer and offset is not used
	var xhr = new XMLHttpRequest();
	xhr.open('GET', handle.url , true);
	var range=[position,length+position-1];
	xhr.setRequestHeader('Range', 'bytes='+range[0]+'-'+range[1]);
	xhr.responseType = 'arraybuffer';
	xhr.send();
	xhr.onload = function(e) {
		var that=this;
		setTimeout(function(){
			cb(0,that.response.byteLength,that.response);
		},0);
	}; 
}
var close=function(handle) {}
var fstatSync=function(handle) {
	throw "not implement yet";
}
var fstat=function(handle,cb) {
	throw "not implement yet";
}
var _open=function(fn_url,cb) {
		var handle={};
		if (fn_url.indexOf("filesystem:")==0){
			handle.url=fn_url;
			handle.fn=fn_url.substr( fn_url.lastIndexOf("/")+1);
		} else {
			handle.fn=fn_url;
			var url=API.files.filter(function(f){ return (f[0]==fn_url)});
			if (url.length) handle.url=url[0][1];
			else cb(null);
		}
		cb(handle);
}
var open=function(fn_url,cb) {
		if (!API.initialized) {init(1024*1024,function(){
			_open.apply(this,[fn_url,cb]);
		},this)} else _open.apply(this,[fn_url,cb]);
}
var load=function(filename,mode,cb) {
	open(filename,mode,cb,true);
}
function errorHandler(e) {
	console.error('Error: ' +e.name+ " "+e.message);
}
var readdir=function(cb,context) {
	 var dirReader = API.fs.root.createReader();
	 var out=[],that=this;
		dirReader.readEntries(function(entries) {
			if (entries.length) {
				for (var i = 0, entry; entry = entries[i]; ++i) {
					if (entry.isFile) {
						out.push([entry.name,entry.toURL ? entry.toURL() : entry.toURI()]);
					}
				}
			}
			API.files=out;
			if (cb) cb.apply(context,[out]);
		}, function(){
			if (cb) cb.apply(context,[null]);
		});
}
var initfs=function(grantedBytes,cb,context) {
	webkitRequestFileSystem(PERSISTENT, grantedBytes,  function(fs) {
		API.fs=fs;
		API.quota=grantedBytes;
		readdir(function(){
			API.initialized=true;
			cb.apply(context,[grantedBytes,fs]);
		},context);
	}, errorHandler);
}
var init=function(quota,cb,context) {
	navigator.webkitPersistentStorage.requestQuota(quota, 
			function(grantedBytes) {
				initfs(grantedBytes,cb,context);
		}, errorHandler 
	);
}
var API={
	read:read
	,readdir:readdir
	,open:open
	,close:close
	,fstatSync:fstatSync
	,fstat:fstat
}
module.exports=API;
},{}],"c:\\ksana2015\\node_modules\\ksana-jsonrom\\index.js":[function(require,module,exports){
module.exports={
	open:require("./kdb")
}

},{"./kdb":"c:\\ksana2015\\node_modules\\ksana-jsonrom\\kdb.js"}],"c:\\ksana2015\\node_modules\\ksana-jsonrom\\kdb.js":[function(require,module,exports){
/*
	KDB version 3.0 GPL
	yapcheahshen@gmail.com
	2013/12/28
	asyncronize version of yadb

  remove dependency of Q, thanks to
  http://stackoverflow.com/questions/4234619/how-to-avoid-long-nesting-of-asynchronous-functions-in-node-js

  2015/1/2
  moved to ksanaforge/ksana-jsonrom
  add err in callback for node.js compliant
*/
var Kfs=null;

if (typeof ksanagap=="undefined") {
	Kfs=require('./kdbfs');			
} else {
	if (ksanagap.platform=="ios") {
		Kfs=require("./kdbfs_ios");
	} else if (ksanagap.platform=="node-webkit") {
		Kfs=require("./kdbfs");
	} else if (ksanagap.platform=="chrome") {
		Kfs=require("./kdbfs");
	} else {
		Kfs=require("./kdbfs_android");
	}
		
}


var DT={
	uint8:'1', //unsigned 1 byte integer
	int32:'4', // signed 4 bytes integer
	utf8:'8',  
	ucs2:'2',
	bool:'^', 
	blob:'&',
	utf8arr:'*', //shift of 8
	ucs2arr:'@', //shift of 2
	uint8arr:'!', //shift of 1
	int32arr:'$', //shift of 4
	vint:'`',
	pint:'~',	

	array:'\u001b',
	object:'\u001a' 
	//ydb start with object signature,
	//type a ydb in command prompt shows nothing
}
var verbose=0, readLog=function(){};
var _readLog=function(readtype,bytes) {
	console.log(readtype,bytes,"bytes");
}
if (verbose) readLog=_readLog;
var strsep="\uffff";
var Create=function(path,opts,cb) {
	/* loadxxx functions move file pointer */
	// load variable length int
	if (typeof opts=="function") {
		cb=opts;
		opts={};
	}

	
	var loadVInt =function(opts,blocksize,count,cb) {
		//if (count==0) return [];
		var that=this;

		this.fs.readBuf_packedint(opts.cur,blocksize,count,true,function(o){
			//console.log("vint");
			opts.cur+=o.adv;
			cb.apply(that,[o.data]);
		});
	}
	var loadVInt1=function(opts,cb) {
		var that=this;
		loadVInt.apply(this,[opts,6,1,function(data){
			//console.log("vint1");
			cb.apply(that,[data[0]]);
		}])
	}
	//for postings
	var loadPInt =function(opts,blocksize,count,cb) {
		var that=this;
		this.fs.readBuf_packedint(opts.cur,blocksize,count,false,function(o){
			//console.log("pint");
			opts.cur+=o.adv;
			cb.apply(that,[o.data]);
		});
	}
	// item can be any type (variable length)
	// maximum size of array is 1TB 2^40
	// structure:
	// signature,5 bytes offset, payload, itemlengths
	var getArrayLength=function(opts,cb) {
		var that=this;
		var dataoffset=0;

		this.fs.readUI8(opts.cur,function(len){
			var lengthoffset=len*4294967296;
			opts.cur++;
			that.fs.readUI32(opts.cur,function(len){
				opts.cur+=4;
				dataoffset=opts.cur; //keep this
				lengthoffset+=len;
				opts.cur+=lengthoffset;

				loadVInt1.apply(that,[opts,function(count){
					loadVInt.apply(that,[opts,count*6,count,function(sz){						
						cb({count:count,sz:sz,offset:dataoffset});
					}]);
				}]);
				
			});
		});
	}

	var loadArray = function(opts,blocksize,cb) {
		var that=this;
		getArrayLength.apply(this,[opts,function(L){
				var o=[];
				var endcur=opts.cur;
				opts.cur=L.offset;

				if (opts.lazy) { 
						var offset=L.offset;
						L.sz.map(function(sz){
							o[o.length]=strsep+offset.toString(16)
								   +strsep+sz.toString(16);
							offset+=sz;
						})
				} else {
					var taskqueue=[];
					for (var i=0;i<L.count;i++) {
						taskqueue.push(
							(function(sz){
								return (
									function(data){
										if (typeof data=='object' && data.__empty) {
											 //not pushing the first call
										}	else o.push(data);
										opts.blocksize=sz;
										load.apply(that,[opts, taskqueue.shift()]);
									}
								);
							})(L.sz[i])
						);
					}
					//last call to child load
					taskqueue.push(function(data){
						o.push(data);
						opts.cur=endcur;
						cb.apply(that,[o]);
					});
				}

				if (opts.lazy) cb.apply(that,[o]);
				else {
					taskqueue.shift()({__empty:true});
				}
			}
		])
	}		
	// item can be any type (variable length)
	// support lazy load
	// structure:
	// signature,5 bytes offset, payload, itemlengths, 
	//                    stringarray_signature, keys
	var loadObject = function(opts,blocksize,cb) {
		var that=this;
		var start=opts.cur;
		getArrayLength.apply(this,[opts,function(L) {
			opts.blocksize=blocksize-opts.cur+start;
			load.apply(that,[opts,function(keys){ //load the keys
				if (opts.keys) { //caller ask for keys
					keys.map(function(k) { opts.keys.push(k)});
				}

				var o={};
				var endcur=opts.cur;
				opts.cur=L.offset;
				if (opts.lazy) { 
					var offset=L.offset;
					for (var i=0;i<L.sz.length;i++) {
						//prefix with a \0, impossible for normal string
						o[keys[i]]=strsep+offset.toString(16)
							   +strsep+L.sz[i].toString(16);
						offset+=L.sz[i];
					}
				} else {
					var taskqueue=[];
					for (var i=0;i<L.count;i++) {
						taskqueue.push(
							(function(sz,key){
								return (
									function(data){
										if (typeof data=='object' && data.__empty) {
											//not saving the first call;
										} else {
											o[key]=data; 
										}
										opts.blocksize=sz;
										if (verbose) readLog("key",key);
										load.apply(that,[opts, taskqueue.shift()]);
									}
								);
							})(L.sz[i],keys[i-1])

						);
					}
					//last call to child load
					taskqueue.push(function(data){
						o[keys[keys.length-1]]=data;
						opts.cur=endcur;
						cb.apply(that,[o]);
					});
				}
				if (opts.lazy) cb.apply(that,[o]);
				else {
					taskqueue.shift()({__empty:true});
				}
			}]);
		}]);
	}

	//item is same known type
	var loadStringArray=function(opts,blocksize,encoding,cb) {
		var that=this;
		this.fs.readStringArray(opts.cur,blocksize,encoding,function(o){
			opts.cur+=blocksize;
			cb.apply(that,[o]);
		});
	}
	var loadIntegerArray=function(opts,blocksize,unitsize,cb) {
		var that=this;
		loadVInt1.apply(this,[opts,function(count){
			var o=that.fs.readFixedArray(opts.cur,count,unitsize,function(o){
				opts.cur+=count*unitsize;
				cb.apply(that,[o]);
			});
		}]);
	}
	var loadBlob=function(blocksize,cb) {
		var o=this.fs.readBuf(this.cur,blocksize);
		this.cur+=blocksize;
		return o;
	}	
	var loadbysignature=function(opts,signature,cb) {
		  var blocksize=opts.blocksize||this.fs.size; 
			opts.cur+=this.fs.signature_size;
			var datasize=blocksize-this.fs.signature_size;
			//basic types
			if (signature===DT.int32) {
				opts.cur+=4;
				this.fs.readI32(opts.cur-4,cb);
			} else if (signature===DT.uint8) {
				opts.cur++;
				this.fs.readUI8(opts.cur-1,cb);
			} else if (signature===DT.utf8) {
				var c=opts.cur;opts.cur+=datasize;
				this.fs.readString(c,datasize,'utf8',cb);
			} else if (signature===DT.ucs2) {
				var c=opts.cur;opts.cur+=datasize;
				this.fs.readString(c,datasize,'ucs2',cb);	
			} else if (signature===DT.bool) {
				opts.cur++;
				this.fs.readUI8(opts.cur-1,function(data){cb(!!data)});
			} else if (signature===DT.blob) {
				loadBlob(datasize,cb);
			}
			//variable length integers
			else if (signature===DT.vint) {
				loadVInt.apply(this,[opts,datasize,datasize,cb]);
			}
			else if (signature===DT.pint) {
				loadPInt.apply(this,[opts,datasize,datasize,cb]);
			}
			//simple array
			else if (signature===DT.utf8arr) {
				loadStringArray.apply(this,[opts,datasize,'utf8',cb]);
			}
			else if (signature===DT.ucs2arr) {
				loadStringArray.apply(this,[opts,datasize,'ucs2',cb]);
			}
			else if (signature===DT.uint8arr) {
				loadIntegerArray.apply(this,[opts,datasize,1,cb]);
			}
			else if (signature===DT.int32arr) {
				loadIntegerArray.apply(this,[opts,datasize,4,cb]);
			}
			//nested structure
			else if (signature===DT.array) {
				loadArray.apply(this,[opts,datasize,cb]);
			}
			else if (signature===DT.object) {
				loadObject.apply(this,[opts,datasize,cb]);
			}
			else {
				console.error('unsupported type',signature,opts)
				cb.apply(this,[null]);//make sure it return
				//throw 'unsupported type '+signature;
			}
	}

	var load=function(opts,cb) {
		opts=opts||{}; // this will served as context for entire load procedure
		opts.cur=opts.cur||0;
		var that=this;
		this.fs.readSignature(opts.cur, function(signature){
			loadbysignature.apply(that,[opts,signature,cb])
		});
		return this;
	}
	var CACHE=null;
	var KEY={};
	var ADDRESS={};
	var reset=function(cb) {
		if (!CACHE) {
			load.apply(this,[{cur:0,lazy:true},function(data){
				CACHE=data;
				cb.call(this);
			}]);	
		} else {
			cb.call(this);
		}
	}

	var exists=function(path,cb) {
		if (path.length==0) return true;
		var key=path.pop();
		var that=this;
		get.apply(this,[path,false,function(data){
			if (!path.join(strsep)) return (!!KEY[key]);
			var keys=KEY[path.join(strsep)];
			path.push(key);//put it back
			if (keys) cb.apply(that,[keys.indexOf(key)>-1]);
			else cb.apply(that,[false]);
		}]);
	}

	var getSync=function(path) {
		if (!CACHE) return undefined;	
		var o=CACHE;
		for (var i=0;i<path.length;i++) {
			var r=o[path[i]];
			if (typeof r=="undefined") return null;
			o=r;
		}
		return o;
	}
	var get=function(path,opts,cb) {
		if (typeof path=='undefined') path=[];
		if (typeof path=="string") path=[path];
		//opts.recursive=!!opts.recursive;
		if (typeof opts=="function") {
			cb=opts;node
			opts={};
		}
		var that=this;
		if (typeof cb!='function') return getSync(path);

		reset.apply(this,[function(){
			var o=CACHE;
			if (path.length==0) {
				if (opts.address) {
					cb([0,that.fs.size]);
				} else {
					cb([Object.keys(CACHE)]);
				}
				return;
			} 
			
			var pathnow="",taskqueue=[],newopts={},r=null;
			var lastkey="";

			for (var i=0;i<path.length;i++) {
				var task=(function(key,k){

					return (function(data){
						if (!(typeof data=='object' && data.__empty)) {
							if (typeof o[lastkey]=='string' && o[lastkey][0]==strsep) o[lastkey]={};
							o[lastkey]=data; 
							o=o[lastkey];
							r=data[key];
							KEY[pathnow]=opts.keys;								
						} else {
							data=o[key];
							r=data;
						}

						if (typeof r==="undefined") {
							taskqueue=null;
							cb.apply(that,[r]); //return empty value
						} else {							
							if (parseInt(k)) pathnow+=strsep;
							pathnow+=key;
							if (typeof r=='string' && r[0]==strsep) { //offset of data to be loaded
								var p=r.substring(1).split(strsep).map(function(item){return parseInt(item,16)});
								var cur=p[0],sz=p[1];
								newopts.lazy=!opts.recursive || (k<path.length-1) ;
								newopts.blocksize=sz;newopts.cur=cur,newopts.keys=[];
								lastkey=key; //load is sync in android
								if (opts.address && taskqueue.length==1) {
									ADDRESS[pathnow]=[cur,sz];
									taskqueue.shift()(null,ADDRESS[pathnow]);
								} else {
									load.apply(that,[newopts, taskqueue.shift()]);
								}
							} else {
								if (opts.address && taskqueue.length==1) {
									taskqueue.shift()(null,ADDRESS[pathnow]);
								} else {
									taskqueue.shift().apply(that,[r]);
								}
							}
						}
					})
				})
				(path[i],i);
				
				taskqueue.push(task);
			}

			if (taskqueue.length==0) {
				cb.apply(that,[o]);
			} else {
				//last call to child load
				taskqueue.push(function(data,cursz){
					if (opts.address) {
						cb.apply(that,[cursz]);
					} else{
						var key=path[path.length-1];
						o[key]=data; KEY[pathnow]=opts.keys;
						cb.apply(that,[data]);
					}
				});
				taskqueue.shift()({__empty:true});			
			}

		}]); //reset
	}
	// get all keys in given path
	var getkeys=function(path,cb) {
		if (!path) path=[]
		var that=this;

		get.apply(this,[path,false,function(){
			if (path && path.length) {
				cb.apply(that,[KEY[path.join(strsep)]]);
			} else {
				cb.apply(that,[Object.keys(CACHE)]); 
				//top level, normally it is very small
			}
		}]);
	}

	var setupapi=function() {
		this.load=load;
//		this.cur=0;
		this.cache=function() {return CACHE};
		this.key=function() {return KEY};
		this.free=function() {
			CACHE=null;
			KEY=null;
			this.fs.free();
		}
		this.setCache=function(c) {CACHE=c};
		this.keys=getkeys;
		this.get=get;   // get a field, load if needed
		this.exists=exists;
		this.DT=DT;
		
		//install the sync version for node
		//if (typeof process!="undefined") require("./kdb_sync")(this);
		//if (cb) setTimeout(cb.bind(this),0);
		var that=this;
		var err=0;
		if (cb) {
			setTimeout(function(){
				cb(err,that);	
			},0);
		}
	}
	var that=this;
	var kfs=new Kfs(path,opts,function(err){
		if (err) {
			setTimeout(function(){
				cb(err,0);
			},0);
			return null;
		} else {
			that.size=this.size;
			setupapi.call(that);			
		}
	});
	this.fs=kfs;
	return this;
}

Create.datatypes=DT;

if (module) module.exports=Create;
//return Create;

},{"./kdbfs":"c:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs.js","./kdbfs_android":"c:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs_android.js","./kdbfs_ios":"c:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs_ios.js"}],"c:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs.js":[function(require,module,exports){
/* node.js and html5 file system abstraction layer*/
try {
	var fs=require("fs");
	var Buffer=require("buffer").Buffer;
} catch (e) {
	var fs=require('./html5read');
	var Buffer=function(){ return ""};
	var html5fs=true; 	
}
var signature_size=1;
var verbose=0, readLog=function(){};
var _readLog=function(readtype,bytes) {
	console.log(readtype,bytes,"bytes");
}
if (verbose) readLog=_readLog;

var unpack_int = function (ar, count , reset) {
   count=count||ar.length;
  var r = [], i = 0, v = 0;
  do {
	var shift = 0;
	do {
	  v += ((ar[i] & 0x7F) << shift);
	  shift += 7;	  
	} while (ar[++i] & 0x80);
	r.push(v); if (reset) v=0;
	count--;
  } while (i<ar.length && count);
  return {data:r, adv:i };
}
var Open=function(path,opts,cb) {
	opts=opts||{};

	var readSignature=function(pos,cb) {
		var buf=new Buffer(signature_size);
		var that=this;
		fs.read(this.handle,buf,0,signature_size,pos,function(err,len,buffer){
			if (html5fs) var signature=String.fromCharCode((new Uint8Array(buffer))[0])
			else var signature=buffer.toString('utf8',0,signature_size);
			cb.apply(that,[signature]);
		});
	}

	//this is quite slow
	//wait for StringView +ArrayBuffer to solve the problem
	//https://groups.google.com/a/chromium.org/forum/#!topic/blink-dev/ylgiNY_ZSV0
	//if the string is always ucs2
	//can use Uint16 to read it.
	//http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
	var decodeutf8 = function (utftext) {
		var string = "";
		var i = 0;
		var c=0,c1 = 0, c2 = 0 , c3=0;
		for (var i=0;i<utftext.length;i++) {
			if (utftext.charCodeAt(i)>127) break;
		}
		if (i>=utftext.length) return utftext;

		while ( i < utftext.length ) {
			c = utftext.charCodeAt(i);
			if (c < 128) {
				string += utftext[i];
				i++;
			} else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			} else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
		}
		return string;
	}

	var readString= function(pos,blocksize,encoding,cb) {
		encoding=encoding||'utf8';
		var buffer=new Buffer(blocksize);
		var that=this;
		fs.read(this.handle,buffer,0,blocksize,pos,function(err,len,buffer){
			readLog("string",len);
			if (html5fs) {
				if (encoding=='utf8') {
					var str=decodeutf8(String.fromCharCode.apply(null, new Uint8Array(buffer)))
				} else { //ucs2 is 3 times faster
					var str=String.fromCharCode.apply(null, new Uint16Array(buffer))	
				}
				
				cb.apply(that,[str]);
			} 
			else cb.apply(that,[buffer.toString(encoding)]);	
		});
	}

	//work around for chrome fromCharCode cannot accept huge array
	//https://code.google.com/p/chromium/issues/detail?id=56588
	var buf2stringarr=function(buf,enc) {
		if (enc=="utf8") 	var arr=new Uint8Array(buf);
		else var arr=new Uint16Array(buf);
		var i=0,codes=[],out=[],s="";
		while (i<arr.length) {
			if (arr[i]) {
				codes[codes.length]=arr[i];
			} else {
				s=String.fromCharCode.apply(null,codes);
				if (enc=="utf8") out[out.length]=decodeutf8(s);
				else out[out.length]=s;
				codes=[];				
			}
			i++;
		}
		
		s=String.fromCharCode.apply(null,codes);
		if (enc=="utf8") out[out.length]=decodeutf8(s);
		else out[out.length]=s;

		return out;
	}
	var readStringArray = function(pos,blocksize,encoding,cb) {
		var that=this,out=null;
		if (blocksize==0) return [];
		encoding=encoding||'utf8';
		var buffer=new Buffer(blocksize);
		fs.read(this.handle,buffer,0,blocksize,pos,function(err,len,buffer){
			if (html5fs) {
				readLog("stringArray",buffer.byteLength);

				if (encoding=='utf8') {
					out=buf2stringarr(buffer,"utf8");
				} else { //ucs2 is 3 times faster
					out=buf2stringarr(buffer,"ucs2");
				}
			} else {
				readLog("stringArray",buffer.length);
				out=buffer.toString(encoding).split('\0');
			} 	
			cb.apply(that,[out]);
		});
	}
	var readUI32=function(pos,cb) {
		var buffer=new Buffer(4);
		var that=this;
		fs.read(this.handle,buffer,0,4,pos,function(err,len,buffer){
			readLog("ui32",len);
			if (html5fs){
				//v=(new Uint32Array(buffer))[0];
				var v=new DataView(buffer).getUint32(0, false)
				cb(v);
			}
			else cb.apply(that,[buffer.readInt32BE(0)]);	
		});		
	}

	var readI32=function(pos,cb) {
		var buffer=new Buffer(4);
		var that=this;
		fs.read(this.handle,buffer,0,4,pos,function(err,len,buffer){
			readLog("i32",len);
			if (html5fs){
				var v=new DataView(buffer).getInt32(0, false)
				cb(v);
			}
			else  	cb.apply(that,[buffer.readInt32BE(0)]);	
		});
	}
	var readUI8=function(pos,cb) {
		var buffer=new Buffer(1);
		var that=this;

		fs.read(this.handle,buffer,0,1,pos,function(err,len,buffer){
			readLog("ui8",len);
			if (html5fs)cb( (new Uint8Array(buffer))[0]) ;
			else  			cb.apply(that,[buffer.readUInt8(0)]);	
			
		});
	}
	var readBuf=function(pos,blocksize,cb) {
		var that=this;
		var buf=new Buffer(blocksize);
		fs.read(this.handle,buf,0,blocksize,pos,function(err,len,buffer){
			readLog("buf",len);
			var buff=new Uint8Array(buffer)
			cb.apply(that,[buff]);
		});
	}
	var readBuf_packedint=function(pos,blocksize,count,reset,cb) {
		var that=this;
		readBuf.apply(this,[pos,blocksize,function(buffer){
			cb.apply(that,[unpack_int(buffer,count,reset)]);	
		}]);
		
	}
	var readFixedArray_html5fs=function(pos,count,unitsize,cb) {
		var func=null;
		if (unitsize===1) {
			func='getUint8';//Uint8Array;
		} else if (unitsize===2) {
			func='getUint16';//Uint16Array;
		} else if (unitsize===4) {
			func='getUint32';//Uint32Array;
		} else throw 'unsupported integer size';

		fs.read(this.handle,null,0,unitsize*count,pos,function(err,len,buffer){
			readLog("fix array",len);
			var out=[];
			if (unitsize==1) {
				out=new Uint8Array(buffer);
			} else {
				for (var i = 0; i < len / unitsize; i++) { //endian problem
				//	out.push( func(buffer,i*unitsize));
					out.push( v=new DataView(buffer)[func](i,false) );
				}
			}

			cb.apply(that,[out]);
		});
	}
	// signature, itemcount, payload
	var readFixedArray = function(pos ,count, unitsize,cb) {
		var func=null;
		var that=this;
		
		if (unitsize* count>this.size && this.size)  {
			console.log("array size exceed file size",this.size)
			return;
		}
		
		if (html5fs) return readFixedArray_html5fs.apply(this,[pos,count,unitsize,cb]);

		var items=new Buffer( unitsize* count);
		if (unitsize===1) {
			func=items.readUInt8;
		} else if (unitsize===2) {
			func=items.readUInt16BE;
		} else if (unitsize===4) {
			func=items.readUInt32BE;
		} else throw 'unsupported integer size';
		//console.log('itemcount',itemcount,'buffer',buffer);

		fs.read(this.handle,items,0,unitsize*count,pos,function(err,len,buffer){
			readLog("fix array",len);
			var out=[];
			for (var i = 0; i < items.length / unitsize; i++) {
				out.push( func.apply(items,[i*unitsize]));
			}
			cb.apply(that,[out]);
		});
	}

	var free=function() {
		//console.log('closing ',handle);
		fs.closeSync(this.handle);
	}
	var setupapi=function() {
		var that=this;
		this.readSignature=readSignature;
		this.readI32=readI32;
		this.readUI32=readUI32;
		this.readUI8=readUI8;
		this.readBuf=readBuf;
		this.readBuf_packedint=readBuf_packedint;
		this.readFixedArray=readFixedArray;
		this.readString=readString;
		this.readStringArray=readStringArray;
		this.signature_size=signature_size;
		this.free=free;
		if (html5fs) {
			var fn=path;
			if (path.indexOf("filesystem:")==0) fn=path.substr(path.lastIndexOf("/"));
			fs.fs.root.getFile(fn,{},function(entry){
			  entry.getMetadata(function(metadata) { 
				that.size=metadata.size;
				if (cb) setTimeout(cb.bind(that),0);
				});
			});
		} else {
			var stat=fs.fstatSync(this.handle);
			this.stat=stat;
			this.size=stat.size;		
			if (cb)	setTimeout(cb.bind(this,0),0);	
		}
	}

	var that=this;
	if (html5fs) {
		fs.open(path,function(h){
			if (!h) {
				if (cb)	setTimeout(cb.bind(null,"file not found:"+path),0);	
			} else {
				that.handle=h;
				that.html5fs=true;
				setupapi.call(that);
				that.opened=true;				
			}
		})
	} else {
		if (fs.existsSync(path)){
			this.handle=fs.openSync(path,'r');//,function(err,handle){
			this.opened=true;
			setupapi.call(this);
		} else {
			if (cb)	setTimeout(cb.bind(null,"file not found:"+path),0);	
			return null;
		}
	}
	return this;
}
module.exports=Open;
},{"./html5read":"c:\\ksana2015\\node_modules\\ksana-jsonrom\\html5read.js","buffer":false,"fs":false}],"c:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs_android.js":[function(require,module,exports){
/*
  JAVA can only return Number and String
	array and buffer return in string format
	need JSON.parse
*/
var verbose=0;

var readSignature=function(pos,cb) {
	if (verbose) console.debug("read signature");
	var signature=kfs.readUTF8String(this.handle,pos,1);
	if (verbose) console.debug(signature,signature.charCodeAt(0));
	cb.apply(this,[signature]);
}
var readI32=function(pos,cb) {
	if (verbose) console.debug("read i32 at "+pos);
	var i32=kfs.readInt32(this.handle,pos);
	if (verbose) console.debug(i32);
	cb.apply(this,[i32]);	
}
var readUI32=function(pos,cb) {
	if (verbose) console.debug("read ui32 at "+pos);
	var ui32=kfs.readUInt32(this.handle,pos);
	if (verbose) console.debug(ui32);
	cb.apply(this,[ui32]);
}
var readUI8=function(pos,cb) {
	if (verbose) console.debug("read ui8 at "+pos); 
	var ui8=kfs.readUInt8(this.handle,pos);
	if (verbose) console.debug(ui8);
	cb.apply(this,[ui8]);
}
var readBuf=function(pos,blocksize,cb) {
	if (verbose) console.debug("read buffer at "+pos+ " blocksize "+blocksize);
	var buf=kfs.readBuf(this.handle,pos,blocksize);
	var buff=JSON.parse(buf);
	if (verbose) console.debug("buffer length"+buff.length);
	cb.apply(this,[buff]);	
}
var readBuf_packedint=function(pos,blocksize,count,reset,cb) {
	if (verbose) console.debug("read packed int at "+pos+" blocksize "+blocksize+" count "+count);
	var buf=kfs.readBuf_packedint(this.handle,pos,blocksize,count,reset);
	var adv=parseInt(buf);
	var buff=JSON.parse(buf.substr(buf.indexOf("[")));
	if (verbose) console.debug("packedInt length "+buff.length+" first item="+buff[0]);
	cb.apply(this,[{data:buff,adv:adv}]);	
}


var readString= function(pos,blocksize,encoding,cb) {
	if (verbose) console.debug("readstring at "+pos+" blocksize " +blocksize+" enc:"+encoding);
	if (encoding=="ucs2") {
		var str=kfs.readULE16String(this.handle,pos,blocksize);
	} else {
		var str=kfs.readUTF8String(this.handle,pos,blocksize);	
	}	 
	if (verbose) console.debug(str);
	cb.apply(this,[str]);	
}

var readFixedArray = function(pos ,count, unitsize,cb) {
	if (verbose) console.debug("read fixed array at "+pos+" count "+count+" unitsize "+unitsize); 
	var buf=kfs.readFixedArray(this.handle,pos,count,unitsize);
	var buff=JSON.parse(buf);
	if (verbose) console.debug("array length"+buff.length);
	cb.apply(this,[buff]);	
}
var readStringArray = function(pos,blocksize,encoding,cb) {
	if (verbose) console.log("read String array at "+pos+" blocksize "+blocksize +" enc "+encoding); 
	encoding = encoding||"utf8";
	var buf=kfs.readStringArray(this.handle,pos,blocksize,encoding);
	//var buff=JSON.parse(buf);
	if (verbose) console.debug("read string array");
	var buff=buf.split("\uffff"); //cannot return string with 0
	if (verbose) console.debug("array length"+buff.length);
	cb.apply(this,[buff]);	
}
var mergePostings=function(positions,cb) {
	var buf=kfs.mergePostings(this.handle,JSON.stringify(positions));
	if (!buf || buf.length==0) return [];
	else return JSON.parse(buf);
}

var free=function() {
	//console.log('closing ',handle);
	kfs.close(this.handle);
}
var Open=function(path,opts,cb) {
	opts=opts||{};
	var signature_size=1;
	var setupapi=function() { 
		this.readSignature=readSignature;
		this.readI32=readI32;
		this.readUI32=readUI32;
		this.readUI8=readUI8;
		this.readBuf=readBuf;
		this.readBuf_packedint=readBuf_packedint;
		this.readFixedArray=readFixedArray;
		this.readString=readString;
		this.readStringArray=readStringArray;
		this.signature_size=signature_size;
		this.mergePostings=mergePostings;
		this.free=free;
		this.size=kfs.getFileSize(this.handle);
		if (verbose) console.log("filesize  "+this.size);
		if (cb)	cb.call(this);
	}

	this.handle=kfs.open(path);
	this.opened=true;
	setupapi.call(this);
	return this;
}

module.exports=Open;
},{}],"c:\\ksana2015\\node_modules\\ksana-jsonrom\\kdbfs_ios.js":[function(require,module,exports){
/*
  JSContext can return all Javascript types.
*/
var verbose=1;

var readSignature=function(pos,cb) {
	if (verbose)  ksanagap.log("read signature at "+pos);
	var signature=kfs.readUTF8String(this.handle,pos,1);
	if (verbose)  ksanagap.log(signature+" "+signature.charCodeAt(0));
	cb.apply(this,[signature]);
}
var readI32=function(pos,cb) {
	if (verbose)  ksanagap.log("read i32 at "+pos);
	var i32=kfs.readInt32(this.handle,pos);
	if (verbose)  ksanagap.log(i32);
	cb.apply(this,[i32]);	
}
var readUI32=function(pos,cb) {
	if (verbose)  ksanagap.log("read ui32 at "+pos);
	var ui32=kfs.readUInt32(this.handle,pos);
	if (verbose)  ksanagap.log(ui32);
	cb.apply(this,[ui32]);
}
var readUI8=function(pos,cb) {
	if (verbose)  ksanagap.log("read ui8 at "+pos); 
	var ui8=kfs.readUInt8(this.handle,pos);
	if (verbose)  ksanagap.log(ui8);
	cb.apply(this,[ui8]);
}
var readBuf=function(pos,blocksize,cb) {
	if (verbose)  ksanagap.log("read buffer at "+pos);
	var buf=kfs.readBuf(this.handle,pos,blocksize);
	if (verbose)  ksanagap.log("buffer length"+buf.length);
	cb.apply(this,[buf]);	
}
var readBuf_packedint=function(pos,blocksize,count,reset,cb) {
	if (verbose)  ksanagap.log("read packed int fast, blocksize "+blocksize+" at "+pos);var t=new Date();
	var buf=kfs.readBuf_packedint(this.handle,pos,blocksize,count,reset);
	if (verbose)  ksanagap.log("return from packedint, time" + (new Date()-t));
	if (typeof buf.data=="string") {
		buf.data=eval("["+buf.data.substr(0,buf.data.length-1)+"]");
	}
	if (verbose)  ksanagap.log("unpacked length"+buf.data.length+" time" + (new Date()-t) );
	cb.apply(this,[buf]);
}


var readString= function(pos,blocksize,encoding,cb) {

	if (verbose)  ksanagap.log("readstring at "+pos+" blocksize "+blocksize+" "+encoding);var t=new Date();
	if (encoding=="ucs2") {
		var str=kfs.readULE16String(this.handle,pos,blocksize);
	} else {
		var str=kfs.readUTF8String(this.handle,pos,blocksize);	
	}
	if (verbose)  ksanagap.log(str+" time"+(new Date()-t));
	cb.apply(this,[str]);	
}

var readFixedArray = function(pos ,count, unitsize,cb) {
	if (verbose)  ksanagap.log("read fixed array at "+pos); var t=new Date();
	var buf=kfs.readFixedArray(this.handle,pos,count,unitsize);
	if (verbose)  ksanagap.log("array length "+buf.length+" time"+(new Date()-t));
	cb.apply(this,[buf]);	
}
var readStringArray = function(pos,blocksize,encoding,cb) {
	//if (verbose)  ksanagap.log("read String array "+blocksize +" "+encoding); 
	encoding = encoding||"utf8";
	if (verbose)  ksanagap.log("read string array at "+pos);var t=new Date();
	var buf=kfs.readStringArray(this.handle,pos,blocksize,encoding);
	if (typeof buf=="string") buf=buf.split("\0");
	//var buff=JSON.parse(buf);
	//var buff=buf.split("\uffff"); //cannot return string with 0
	if (verbose)  ksanagap.log("string array length"+buf.length+" time"+(new Date()-t));
	cb.apply(this,[buf]);
}

var mergePostings=function(positions) {
	var buf=kfs.mergePostings(this.handle,positions);
	if (typeof buf=="string") {
		buf=eval("["+buf.substr(0,buf.length-1)+"]");
	}
	return buf;
}
var free=function() {
	////if (verbose)  ksanagap.log('closing ',handle);
	kfs.close(this.handle);
}
var Open=function(path,opts,cb) {
	opts=opts||{};
	var signature_size=1;
	var setupapi=function() { 
		this.readSignature=readSignature;
		this.readI32=readI32;
		this.readUI32=readUI32;
		this.readUI8=readUI8;
		this.readBuf=readBuf;
		this.readBuf_packedint=readBuf_packedint;
		this.readFixedArray=readFixedArray;
		this.readString=readString;
		this.readStringArray=readStringArray;
		this.signature_size=signature_size;
		this.mergePostings=mergePostings;
		this.free=free;
		this.size=kfs.getFileSize(this.handle);
		if (verbose)  ksanagap.log("filesize  "+this.size);
		if (cb)	cb.call(this);
	}

	this.handle=kfs.open(path);
	this.opened=true;
	setupapi.call(this);
	return this;
}

module.exports=Open;
},{}],"c:\\ksana2015\\node_modules\\ksana-search\\boolsearch.js":[function(require,module,exports){
/*
  TODO
  and not

*/

// http://jsfiddle.net/neoswf/aXzWw/
var plist=require('./plist');
function intersect(I, J) {
  var i = j = 0;
  var result = [];

  while( i < I.length && j < J.length ){
     if      (I[i] < J[j]) i++; 
     else if (I[i] > J[j]) j++; 
     else {
       result[result.length]=l[i];
       i++;j++;
     }
  }
  return result;
}

/* return all items in I but not in J */
function subtract(I, J) {
  var i = j = 0;
  var result = [];

  while( i < I.length && j < J.length ){
    if (I[i]==J[j]) {
      i++;j++;
    } else if (I[i]<J[j]) {
      while (I[i]<J[j]) result[result.length]= I[i++];
    } else {
      while(J[j]<I[i]) j++;
    }
  }

  if (j==J.length) {
    while (i<I.length) result[result.length]=I[i++];
  }

  return result;
}

var union=function(a,b) {
	if (!a || !a.length) return b;
	if (!b || !b.length) return a;
    var result = [];
    var ai = 0;
    var bi = 0;
    while (true) {
        if ( ai < a.length && bi < b.length) {
            if (a[ai] < b[bi]) {
                result[result.length]=a[ai];
                ai++;
            } else if (a[ai] > b[bi]) {
                result[result.length]=b[bi];
                bi++;
            } else {
                result[result.length]=a[ai];
                result[result.length]=b[bi];
                ai++;
                bi++;
            }
        } else if (ai < a.length) {
            result.push.apply(result, a.slice(ai, a.length));
            break;
        } else if (bi < b.length) {
            result.push.apply(result, b.slice(bi, b.length));
            break;
        } else {
            break;
        }
    }
    return result;
}
var OPERATION={'include':intersect, 'union':union, 'exclude':subtract};

var boolSearch=function(opts) {
  opts=opts||{};
  ops=opts.op||this.opts.op;
  this.docs=[];
	if (!this.phrases.length) return;
	var r=this.phrases[0].docs;
  /* ignore operator of first phrase */
	for (var i=1;i<this.phrases.length;i++) {
		var op= ops[i] || 'union';
		r=OPERATION[op](r,this.phrases[i].docs);
	}
	this.docs=plist.unique(r);
	return this;
}
module.exports={search:boolSearch}
},{"./plist":"c:\\ksana2015\\node_modules\\ksana-search\\plist.js"}],"c:\\ksana2015\\node_modules\\ksana-search\\bsearch.js":[function(require,module,exports){
module.exports=require("c:\\ksana2015\\node_modules\\ksana-database\\bsearch.js")
},{"c:\\ksana2015\\node_modules\\ksana-database\\bsearch.js":"c:\\ksana2015\\node_modules\\ksana-database\\bsearch.js"}],"c:\\ksana2015\\node_modules\\ksana-search\\excerpt.js":[function(require,module,exports){
var plist=require("./plist");

var getPhraseWidths=function (Q,phraseid,vposs) {
	var res=[];
	for (var i in vposs) {
		res.push(getPhraseWidth(Q,phraseid,vposs[i]));
	}
	return res;
}
var getPhraseWidth=function (Q,phraseid,vpos) {
	var P=Q.phrases[phraseid];
	var width=0,varwidth=false;
	if (P.width) return P.width; // no wildcard
	if (P.termid.length<2) return P.termlength[0];
	var lasttermposting=Q.terms[P.termid[P.termid.length-1]].posting;

	for (var i in P.termid) {
		var T=Q.terms[P.termid[i]];
		if (T.op=='wildcard') {
			width+=T.width;
			if (T.wildcard=='*') varwidth=true;
		} else {
			width+=P.termlength[i];
		}
	}
	if (varwidth) { //width might be smaller due to * wildcard
		var at=plist.indexOfSorted(lasttermposting,vpos);
		var endpos=lasttermposting[at];
		if (endpos-vpos<width) width=endpos-vpos+1;
	}

	return width;
}
/* return [vpos, phraseid, phrasewidth, optional_tagname] by slot range*/
var hitInRange=function(Q,startvpos,endvpos) {
	var res=[];
	if (!Q || !Q.rawresult || !Q.rawresult.length) return res;
	for (var i=0;i<Q.phrases.length;i++) {
		var P=Q.phrases[i];
		if (!P.posting) continue;
		var s=plist.indexOfSorted(P.posting,startvpos);
		var e=plist.indexOfSorted(P.posting,endvpos);
		var r=P.posting.slice(s,e+1);
		var width=getPhraseWidths(Q,i,r);

		res=res.concat(r.map(function(vpos,idx){ return [vpos,width[idx],i] }));
	}
	// order by vpos, if vpos is the same, larger width come first.
	// so the output will be
	// <tag1><tag2>one</tag2>two</tag1>
	//TODO, might cause overlap if same vpos and same width
	//need to check tag name
	res.sort(function(a,b){return a[0]==b[0]? b[1]-a[1] :a[0]-b[0]});

	return res;
}

var tagsInRange=function(Q,renderTags,startvpos,endvpos) {
	var res=[];
	if (typeof renderTags=="string") renderTags=[renderTags];

	renderTags.map(function(tag){
		var starts=Q.engine.get(["fields",tag+"_start"]);
		var ends=Q.engine.get(["fields",tag+"_end"]);
		if (!starts) return;

		var s=plist.indexOfSorted(starts,startvpos);
		var e=s;
		while (e<starts.length && starts[e]<endvpos) e++;
		var opentags=starts.slice(s,e);

		s=plist.indexOfSorted(ends,startvpos);
		e=s;
		while (e<ends.length && ends[e]<endvpos) e++;
		var closetags=ends.slice(s,e);

		opentags.map(function(start,idx) {
			res.push([start,closetags[idx]-start,tag]);
		})
	});
	// order by vpos, if vpos is the same, larger width come first.
	res.sort(function(a,b){return a[0]==b[0]? b[1]-a[1] :a[0]-b[0]});

	return res;
}

/*
given a vpos range start, file, convert to filestart, fileend
   filestart : starting file
   start   : vpos start
   showfile: how many files to display
   showpage: how many pages to display

output:
   array of fileid with hits
*/
var getFileWithHits=function(engine,Q,range) {
	var fileOffsets=engine.get("fileoffsets");
	var out=[],filecount=100;
	var start=0 , end=Q.byFile.length;
	Q.excerptOverflow=false;
	if (range.start) {
		var first=range.start ;
		var last=range.end;
		if (!last) last=Number.MAX_SAFE_INTEGER;
		for (var i=0;i<fileOffsets.length;i++) {
			//if (fileOffsets[i]>first) break;
			if (fileOffsets[i]>last) {
				end=i;
				break;
			}
			if (fileOffsets[i]<first) start=i;
		}		
	} else {
		start=range.filestart || 0;
		if (range.maxfile) {
			filecount=range.maxfile;
		} else if (range.showseg) {
			throw "not implement yet"
		}
	}

	var fileWithHits=[],totalhit=0;
	range.maxhit=range.maxhit||1000;

	for (var i=start;i<end;i++) {
		if(Q.byFile[i].length>0) {
			totalhit+=Q.byFile[i].length;
			fileWithHits.push(i);
			range.nextFileStart=i;
			if (fileWithHits.length>=filecount) {
				Q.excerptOverflow=true;
				break;
			}
			if (totalhit>range.maxhit) {
				Q.excerptOverflow=true;
				break;
			}
		}
	}
	if (i>=end) { //no more file
		Q.excerptStop=true;
	}
	return fileWithHits;
}
var resultlist=function(engine,Q,opts,cb) {
	var output=[];
	if (!Q.rawresult || !Q.rawresult.length) {
		cb(output);
		return;
	}

	if (opts.range) {
		if (opts.range.maxhit && !opts.range.maxfile) {
			opts.range.maxfile=opts.range.maxhit;
			opts.range.maxseg=opts.range.maxhit;
		}
		if (!opts.range.maxseg) opts.range.maxseg=100;
		if (!opts.range.end) {
			opts.range.end=Number.MAX_SAFE_INTEGER;
		}
	}
	var fileWithHits=getFileWithHits(engine,Q,opts.range);
	if (!fileWithHits.length) {
		cb(output);
		return;
	}

	var output=[],files=[];//temporary holder for segnames
	for (var i=0;i<fileWithHits.length;i++) {
		var nfile=fileWithHits[i];
		var segoffsets=engine.getFileSegOffsets(nfile);
		var segnames=engine.getFileSegNames(nfile);
		files[nfile]={segoffsets:segoffsets};
		var segwithhit=plist.groupbyposting2(Q.byFile[ nfile ],  segoffsets);
		//if (segoffsets[0]==1)
		//segwithhit.shift(); //the first item is not used (0~Q.byFile[0] )

		for (var j=0; j<segwithhit.length;j++) {
			if (!segwithhit[j].length) continue;
			//var offsets=segwithhit[j].map(function(p){return p- fileOffsets[i]});
			if (segoffsets[j]>opts.range.end) break;
			output.push(  {file: nfile, seg:j,  segname:segnames[j]});
			if (output.length>opts.range.maxseg) break;
		}
	}

	var segpaths=output.map(function(p){
		return ["filecontents",p.file,p.seg];
	});
	//prepare the text
	engine.get(segpaths,function(segs){
		var seq=0;
		if (segs) for (var i=0;i<segs.length;i++) {
			var startvpos=files[output[i].file].segoffsets[output[i].seg-1] ||0;
			var endvpos=files[output[i].file].segoffsets[output[i].seg];
			var hl={};

			if (opts.range && opts.range.start  ) {
				if ( startvpos<opts.range.start) startvpos=opts.range.start;
			//	if (endvpos>opts.range.end) endvpos=opts.range.end;
			}
			
			if (opts.nohighlight) {
				hl.text=segs[i];
				hl.hits=hitInRange(Q,startvpos,endvpos);
			} else {
				var o={nocrlf:true,nospan:true,
					text:segs[i],startvpos:startvpos, endvpos: endvpos, 
					Q:Q,fulltext:opts.fulltext};
				hl=highlight(Q,o);
			}
			if (hl.text) {
				output[i].text=hl.text;
				output[i].hits=hl.hits;
				output[i].seq=seq;
				seq+=hl.hits.length;

				output[i].start=startvpos;				
			} else {
				output[i]=null; //remove item vpos less than opts.range.start
			}
		} 
		output=output.filter(function(o){return o!=null});
		cb(output);
	});
}
var injectTag=function(Q,opts){
	var hits=opts.hits;
	var tags=opts.tags;
	if (!tags) tags=[];
	var hitclass=opts.hitclass||'hl';
	var output='',O=[],j=0,k=0;
	var surround=opts.surround||5;

	var tokens=Q.tokenize(opts.text).tokens;
	var vpos=opts.vpos;
	var i=0,previnrange=!!opts.fulltext ,inrange=!!opts.fulltext;
	var hitstart=0,hitend=0,tagstart=0,tagend=0,tagclass="";
	while (i<tokens.length) {
		var skip=Q.isSkip(tokens[i]);
		var hashit=false;
		inrange=opts.fulltext || (j<hits.length && vpos+surround>=hits[j][0] ||
				(j>0 && j<=hits.length &&  hits[j-1][0]+surround*2>=vpos));	

		if (previnrange!=inrange) {
			output+=opts.abridge||"...";
		}
		previnrange=inrange;
		var token=tokens[i];
		if (opts.nocrlf && token=="\n") token="";

		if (inrange && i<tokens.length) {
			if (skip) {
				output+=token;
			} else {
				var classes="";	

				//check hit
				if (j<hits.length && vpos==hits[j][0]) {
					var nphrase=hits[j][2] % 10, width=hits[j][1];
					hitstart=hits[j][0];
					hitend=hitstart+width;
					j++;
				}

				//check tag
				if (k<tags.length && vpos==tags[k][0]) {
					var width=tags[k][1];
					tagstart=tags[k][0];
					tagend=tagstart+width;
					tagclass=tags[k][2];
					k++;
				}

				if (vpos>=hitstart && vpos<hitend) classes=hitclass+" "+hitclass+nphrase;
				if (vpos>=tagstart && vpos<tagend) classes+=" "+tagclass;

				if (classes || !opts.nospan) {
					output+='<span vpos="'+vpos+'"';
					if (classes) classes=' class="'+classes+'"';
					output+=classes+'>';
					output+=token+'</span>';
				} else {
					output+=token;
				}
			}
		}
		if (!skip) vpos++;
		i++; 
	}

	O.push(output);
	output="";

	return O.join("");
}
var highlight=function(Q,opts) {
	if (!opts.text) return {text:"",hits:[]};
	var opt={text:opts.text,
		hits:null,abridge:opts.abridge,vpos:opts.startvpos,
		fulltext:opts.fulltext,renderTags:opts.renderTags,nospan:opts.nospan,nocrlf:opts.nocrlf,
	};

	opt.hits=hitInRange(opts.Q,opts.startvpos,opts.endvpos);
	return {text:injectTag(Q,opt),hits:opt.hits};
}

var getSeg=function(engine,fileid,segid,cb) {
	var fileOffsets=engine.get("fileoffsets");
	var segpaths=["filecontents",fileid,segid];
	var segnames=engine.getFileSegNames(fileid);

	engine.get(segpaths,function(text){
		cb.apply(engine.context,[{text:text,file:fileid,seg:segid,segname:segnames[segid]}]);
	});
}

var getSegSync=function(engine,fileid,segid) {
	var fileOffsets=engine.get("fileoffsets");
	var segpaths=["filecontents",fileid,segid];
	var segnames=engine.getFileSegNames(fileid);

	var text=engine.get(segpaths);
	return {text:text,file:fileid,seg:segid,segname:segnames[segid]};
}

var getRange=function(engine,start,end,cb) {
	var fileoffsets=engine.get("fileoffsets");
	//var pagepaths=["fileContents",];
	//find first page and last page
	//create get paths

}

var getFile=function(engine,fileid,cb) {
	var filename=engine.get("filenames")[fileid];
	var segnames=engine.getFileSegNames(fileid);
	var filestart=engine.get("fileoffsets")[fileid];
	var offsets=engine.getFileSegOffsets(fileid);
	var pc=0;
	engine.get(["fileContents",fileid],true,function(data){
		var text=data.map(function(t,idx) {
			if (idx==0) return ""; 
			var pb='<pb n="'+segnames[idx]+'"></pb>';
			return pb+t;
		});
		cb({texts:data,text:text.join(""),segnames:segnames,filestart:filestart,offsets:offsets,file:fileid,filename:filename}); //force different token
	});
}

var highlightRange=function(Q,startvpos,endvpos,opts,cb){
	//not implement yet
}

var highlightFile=function(Q,fileid,opts,cb) {
	if (typeof opts=="function") {
		cb=opts;
	}

	if (!Q || !Q.engine) return cb(null);

	var segoffsets=Q.engine.getFileSegOffsets(fileid);
	var output=[];	
	//console.log(startvpos,endvpos)
	Q.engine.get(["fileContents",fileid],true,function(data){
		if (!data) {
			console.error("wrong file id",fileid);
		} else {
			for (var i=0;i<data.length-1;i++ ){
				var startvpos=segoffsets[i];
				var endvpos=segoffsets[i+1];
				var segnames=Q.engine.getFileSegNames(fileid);
				var seg=getSegSync(Q.engine, fileid,i+1);
					var opt={text:seg.text,hits:null,tag:'hl',vpos:startvpos,
					fulltext:true,nospan:opts.nospan,nocrlf:opts.nocrlf};
				var segname=segnames[i+1];
				opt.hits=hitInRange(Q,startvpos,endvpos);
				var pb='<pb n="'+segname+'"></pb>';
				var withtag=injectTag(Q,opt);
				output.push(pb+withtag);
			}			
		}

		cb.apply(Q.engine.context,[{text:output.join(""),file:fileid}]);
	})
}
var highlightSeg=function(Q,fileid,segid,opts,cb) {
	if (typeof opts=="function") {
		cb=opts;
	}

	if (!Q || !Q.engine) return cb(null);
	var segoffsets=Q.engine.getFileSegOffsets(fileid);
	var startvpos=segoffsets[segid-1];
	var endvpos=segoffsets[segid];
	var segnames=Q.engine.getFileSegNames(fileid);

	this.getSeg(Q.engine,fileid,segid,function(res){
		var opt={text:res.text,hits:null,vpos:startvpos,fulltext:true,
			nospan:opts.nospan,nocrlf:opts.nocrlf};
		opt.hits=hitInRange(Q,startvpos,endvpos);
		if (opts.renderTags) {
			opt.tags=tagsInRange(Q,opts.renderTags,startvpos,endvpos);
		}

		var segname=segnames[segid];
		cb.apply(Q.engine.context,[{text:injectTag(Q,opt),seg:segid,file:fileid,hits:opt.hits,segname:segname}]);
	});
}
module.exports={resultlist:resultlist, 
	hitInRange:hitInRange, 
	highlightSeg:highlightSeg,
	getSeg:getSeg,
	highlightFile:highlightFile,
	getFile:getFile
	//highlightRange:highlightRange,
  //getRange:getRange,
};
},{"./plist":"c:\\ksana2015\\node_modules\\ksana-search\\plist.js"}],"c:\\ksana2015\\node_modules\\ksana-search\\index.js":[function(require,module,exports){
/*
  Ksana Search Engine.

  need a KDE instance to be functional
  
*/
var bsearch=require("./bsearch");
var dosearch=require("./search");

var prepareEngineForSearch=function(engine,cb){
	if (engine.analyzer)return;
	var analyzer=require("ksana-analyzer");
	var config=engine.get("meta").config;
	engine.analyzer=analyzer.getAPI(config);
	engine.get([["tokens"],["postingslength"]],function(){
		cb();
	});
}

var _search=function(engine,q,opts,cb,context) {
	if (typeof engine=="string") {//browser only
		var kde=require("ksana-database");
		if (typeof opts=="function") { //user didn't supply options
			if (typeof cb=="object")context=cb;
			cb=opts;
			opts={};
		}
		opts.q=q;
		opts.dbid=engine;
		kde.open(opts.dbid,function(err,db){
			if (err) {
				cb(err);
				return;
			}
			console.log("opened",opts.dbid)
			prepareEngineForSearch(db,function(){
				return dosearch(db,q,opts,cb);	
			});
		},context);
	} else {
		prepareEngineForSearch(engine,function(){
			return dosearch(engine,q,opts,cb);	
		});
	}
}

var _highlightSeg=function(engine,fileid,segid,opts,cb){
	if (!opts.q) opts.q=""; 
	_search(engine,opts.q,opts,function(Q){
		api.excerpt.highlightSeg(Q,fileid,segid,opts,cb);
	});	
}
var _highlightRange=function(engine,start,end,opts,cb){

	if (opts.q) {
		_search(engine,opts.q,opts,function(Q){
			api.excerpt.highlightRange(Q,start,end,opts,cb);
		});
	} else {
		prepareEngineForSearch(engine,function(){
			api.excerpt.getRange(engine,start,end,cb);
		});
	}
}
var _highlightFile=function(engine,fileid,opts,cb){
	if (!opts.q) opts.q=""; 
	_search(engine,opts.q,opts,function(Q){
		api.excerpt.highlightFile(Q,fileid,opts,cb);
	});
	/*
	} else {
		api.excerpt.getFile(engine,fileid,function(data) {
			cb.apply(engine.context,[data]);
		});
	}
	*/
}

var vpos2fileseg=function(engine,vpos) {
    var segoffsets=engine.get("segoffsets");
    var fileoffsets=engine.get(["fileoffsets"]);
    var segnames=engine.get("segnames");
    var fileid=bsearch(fileoffsets,vpos+1,true);
    fileid--;
    var segid=bsearch(segoffsets,vpos+1,true);
	var range=engine.getFileRange(fileid);
	segid-=range.start;
    return {file:fileid,seg:segid};
}
var api={
	search:_search
//	,concordance:require("./concordance")
//	,regex:require("./regex")
	,highlightSeg:_highlightSeg
	,highlightFile:_highlightFile
//	,highlightRange:_highlightRange
	,excerpt:require("./excerpt")
	,vpos2fileseg:vpos2fileseg
}
module.exports=api;
},{"./bsearch":"c:\\ksana2015\\node_modules\\ksana-search\\bsearch.js","./excerpt":"c:\\ksana2015\\node_modules\\ksana-search\\excerpt.js","./search":"c:\\ksana2015\\node_modules\\ksana-search\\search.js","ksana-analyzer":"c:\\ksana2015\\node_modules\\ksana-analyzer\\index.js","ksana-database":"c:\\ksana2015\\node_modules\\ksana-database\\index.js"}],"c:\\ksana2015\\node_modules\\ksana-search\\plist.js":[function(require,module,exports){

var unpack = function (ar) { // unpack variable length integer list
  var r = [],
  i = 0,
  v = 0;
  do {
	var shift = 0;
	do {
	  v += ((ar[i] & 0x7F) << shift);
	  shift += 7;
	} while (ar[++i] & 0x80);
	r[r.length]=v;
  } while (i < ar.length);
  return r;
}

/*
   arr:  [1,1,1,1,1,1,1,1,1]
   levels: [0,1,1,2,2,0,1,2]
   output: [5,1,3,1,1,3,1,1]
*/

var groupsum=function(arr,levels) {
  if (arr.length!=levels.length+1) return null;
  var stack=[];
  var output=new Array(levels.length);
  for (var i=0;i<levels.length;i++) output[i]=0;
  for (var i=1;i<arr.length;i++) { //first one out of toc scope, ignored
    if (stack.length>levels[i-1]) {
      while (stack.length>levels[i-1]) stack.pop();
    }
    stack.push(i-1);
    for (var j=0;j<stack.length;j++) {
      output[stack[j]]+=arr[i];
    }
  }
  return output;
}
/* arr= 1 , 2 , 3 ,4 ,5,6,7 //token posting
  posting= 3 , 5  //tag posting
  out = 3 , 2, 2
*/
var countbyposting = function (arr, posting) {
  if (!posting.length) return [arr.length];
  var out=[];
  for (var i=0;i<posting.length;i++) out[i]=0;
  out[posting.length]=0;
  var p=0,i=0,lasti=0;
  while (i<arr.length && p<posting.length) {
    if (arr[i]<=posting[p]) {
      while (p<posting.length && i<arr.length && arr[i]<=posting[p]) {
        out[p]++;
        i++;
      }      
    } 
    p++;
  }
  out[posting.length] = arr.length-i; //remaining
  return out;
}

var groupbyposting=function(arr,gposting) { //relative vpos
  if (!gposting.length) return [arr.length];
  var out=[];
  for (var i=0;i<=gposting.length;i++) out[i]=[];
  
  var p=0,i=0,lasti=0;
  while (i<arr.length && p<gposting.length) {
    if (arr[i]<gposting[p]) {
      while (p<gposting.length && i<arr.length && arr[i]<gposting[p]) {
        var start=0;
        if (p>0) start=gposting[p-1];
        out[p].push(arr[i++]-start);  // relative
      }      
    } 
    p++;
  }
  //remaining
  while(i<arr.length) out[out.length-1].push(arr[i++]-gposting[gposting.length-1]);
  return out;
}
var groupbyposting2=function(arr,gposting) { //absolute vpos
  if (!arr || !arr.length) return [];
  if (!gposting.length) return [arr.length];
  var out=[];
  for (var i=0;i<=gposting.length;i++) out[i]=[];
  
  var p=0,i=0,lasti=0;
  while (i<arr.length && p<gposting.length) {
    if (arr[i]<gposting[p]) {
      while (p<gposting.length && i<arr.length && arr[i]<gposting[p]) {
        var start=0;
        if (p>0) start=gposting[p-1]; //absolute
        out[p].push(arr[i++]);
      }      
    } 
    p++;
  }
  //remaining
  while(i<arr.length) out[out.length-1].push(arr[i++]-gposting[gposting.length-1]);
  return out;
}
var groupbyblock2 = function(ar, ntoken,slotshift,opts) {
  if (!ar.length) return [{},{}];
  
  slotshift = slotshift || 16;
  var g = Math.pow(2,slotshift);
  var i = 0;
  var r = {}, ntokens={};
  var groupcount=0;
  do {
    var group = Math.floor(ar[i] / g) ;
    if (!r[group]) {
      r[group] = [];
      ntokens[group]=[];
      groupcount++;
    }
    r[group].push(ar[i] % g);
    ntokens[group].push(ntoken[i]);
    i++;
  } while (i < ar.length);
  if (opts) opts.groupcount=groupcount;
  return [r,ntokens];
}
var groupbyslot = function (ar, slotshift, opts) {
  if (!ar.length)
	return {};
  
  slotshift = slotshift || 16;
  var g = Math.pow(2,slotshift);
  var i = 0;
  var r = {};
  var groupcount=0;
  do {
	var group = Math.floor(ar[i] / g) ;
	if (!r[group]) {
	  r[group] = [];
	  groupcount++;
	}
	r[group].push(ar[i] % g);
	i++;
  } while (i < ar.length);
  if (opts) opts.groupcount=groupcount;
  return r;
}
/*
var identity = function (value) {
  return value;
};
var sortedIndex = function (array, obj, iterator) { //taken from underscore
  iterator || (iterator = identity);
  var low = 0,
  high = array.length;
  while (low < high) {
	var mid = (low + high) >> 1;
	iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
  }
  return low;
};*/

var indexOfSorted = function (array, obj) { 
  var low = 0,
  high = array.length-1;
  while (low < high) {
    var mid = (low + high) >> 1;
    array[mid] < obj ? low = mid + 1 : high = mid;
  }
  return low;
};
var plhead=function(pl, pltag, opts) {
  opts=opts||{};
  opts.max=opts.max||1;
  var out=[];
  if (pltag.length<pl.length) {
    for (var i=0;i<pltag.length;i++) {
       k = indexOfSorted(pl, pltag[i]);
       if (k>-1 && k<pl.length) {
        if (pl[k]==pltag[i]) {
          out[out.length]=pltag[i];
          if (out.length>=opts.max) break;
        }
      }
    }
  } else {
    for (var i=0;i<pl.length;i++) {
       k = indexOfSorted(pltag, pl[i]);
       if (k>-1 && k<pltag.length) {
        if (pltag[k]==pl[i]) {
          out[out.length]=pltag[k];
          if (out.length>=opts.max) break;
        }
      }
    }
  }
  return out;
}
/*
 pl2 occur after pl1, 
 pl2>=pl1+mindis
 pl2<=pl1+maxdis
*/
var plfollow2 = function (pl1, pl2, mindis, maxdis) {
  var r = [],i=0;
  var swap = 0;
  
  while (i<pl1.length){
    var k = indexOfSorted(pl2, pl1[i] + mindis);
    var t = (pl2[k] >= (pl1[i] +mindis) && pl2[k]<=(pl1[i]+maxdis)) ? k : -1;
    if (t > -1) {
      r[r.length]=pl1[i];
      i++;
    } else {
      if (k>=pl2.length) break;
      var k2=indexOfSorted (pl1,pl2[k]-maxdis);
      if (k2>i) {
        var t = (pl2[k] >= (pl1[i] +mindis) && pl2[k]<=(pl1[i]+maxdis)) ? k : -1;
        if (t>-1) r[r.length]=pl1[k2];
        i=k2;
      } else break;
    }
  }
  return r;
}

var plnotfollow2 = function (pl1, pl2, mindis, maxdis) {
  var r = [],i=0;
  
  while (i<pl1.length){
    var k = indexOfSorted(pl2, pl1[i] + mindis);
    var t = (pl2[k] >= (pl1[i] +mindis) && pl2[k]<=(pl1[i]+maxdis)) ? k : -1;
    if (t > -1) {
      i++;
    } else {
      if (k>=pl2.length) {
        r=r.concat(pl1.slice(i));
        break;
      } else {
        var k2=indexOfSorted (pl1,pl2[k]-maxdis);
        if (k2>i) {
          r=r.concat(pl1.slice(i,k2));
          i=k2;
        } else break;
      }
    }
  }
  return r;
}
/* this is incorrect */
var plfollow = function (pl1, pl2, distance) {
  var r = [],i=0;

  while (i<pl1.length){
    var k = indexOfSorted(pl2, pl1[i] + distance);
    var t = (pl2[k] === (pl1[i] + distance)) ? k : -1;
    if (t > -1) {
      r.push(pl1[i]);
      i++;
    } else {
      if (k>=pl2.length) break;
      var k2=indexOfSorted (pl1,pl2[k]-distance);
      if (k2>i) {
        t = (pl2[k] === (pl1[k2] + distance)) ? k : -1;
        if (t>-1) {
           r.push(pl1[k2]);
           k2++;
        }
        i=k2;
      } else break;
    }
  }
  return r;
}
var plnotfollow = function (pl1, pl2, distance) {
  var r = [];
  var r = [],i=0;
  var swap = 0;
  
  while (i<pl1.length){
    var k = indexOfSorted(pl2, pl1[i] + distance);
    var t = (pl2[k] === (pl1[i] + distance)) ? k : -1;
    if (t > -1) { 
      i++;
    } else {
      if (k>=pl2.length) {
        r=r.concat(pl1.slice(i));
        break;
      } else {
        var k2=indexOfSorted (pl1,pl2[k]-distance);
        if (k2>i) {
          r=r.concat(pl1.slice(i,k2));
          i=k2;
        } else break;
      }
    }
  }
  return r;
}
var pland = function (pl1, pl2, distance) {
  var r = [];
  var swap = 0;
  
  if (pl1.length > pl2.length) { //swap for faster compare
    var t = pl2;
    pl2 = pl1;
    pl1 = t;
    swap = distance;
    distance = -distance;
  }
  for (var i = 0; i < pl1.length; i++) {
    var k = indexOfSorted(pl2, pl1[i] + distance);
    var t = (pl2[k] === (pl1[i] + distance)) ? k : -1;
    if (t > -1) {
      r.push(pl1[i] - swap);
    }
  }
  return r;
}
var combine=function (postings) {
  var out=[];
  for (var i in postings) {
    out=out.concat(postings[i]);
  }
  out.sort(function(a,b){return a-b});
  return out;
}

var unique = function(ar){
   if (!ar || !ar.length) return [];
   var u = {}, a = [];
   for(var i = 0, l = ar.length; i < l; ++i){
    if(u.hasOwnProperty(ar[i])) continue;
    a.push(ar[i]);
    u[ar[i]] = 1;
   }
   return a;
}



var plphrase = function (postings,ops) {
  var r = [];
  for (var i=0;i<postings.length;i++) {
  	if (!postings[i])  return [];
  	if (0 === i) {
  	  r = postings[0];
  	} else {
      if (ops[i]=='andnot') {
        r = plnotfollow(r, postings[i], i);  
      }else {
        r = pland(r, postings[i], i);  
      }
  	}
  }
  
  return r;
}
//return an array of group having any of pl item
var matchPosting=function(pl,gupl,start,end) {
  start=start||0;
  end=end||-1;
  if (end==-1) end=Math.pow(2, 53); // max integer value

  var count=0, i = j= 0,  result = [] ,v=0;
  var docs=[], freq=[];
  if (!pl) return {docs:[],freq:[]};
  while( i < pl.length && j < gupl.length ){
     if (pl[i] < gupl[j] ){ 
       count++;
       v=pl[i];
       i++; 
     } else {
       if (count) {
        if (v>=start && v<end) {
          docs.push(j);
          freq.push(count);          
        }
       }
       j++;
       count=0;
     }
  }
  if (count && j<gupl.length && v>=start && v<end) {
    docs.push(j);
    freq.push(count);
    count=0;
  }
  else {
    while (j==gupl.length && i<pl.length && pl[i] >= gupl[gupl.length-1]) {
      i++;
      count++;
    }
    if (v>=start && v<end) {
      docs.push(j);
      freq.push(count);      
    }
  } 
  return {docs:docs,freq:freq};
}

var trim=function(arr,start,end) {
  var s=indexOfSorted(arr,start);
  var e=indexOfSorted(arr,end);
  return arr.slice(s,e+1);
}
var plist={};
plist.unpack=unpack;
plist.plphrase=plphrase;
plist.plhead=plhead;
plist.plfollow2=plfollow2;
plist.plnotfollow2=plnotfollow2;
plist.plfollow=plfollow;
plist.plnotfollow=plnotfollow;
plist.unique=unique;
plist.indexOfSorted=indexOfSorted;
plist.matchPosting=matchPosting;
plist.trim=trim;

plist.groupbyslot=groupbyslot;
plist.groupbyblock2=groupbyblock2;
plist.countbyposting=countbyposting;
plist.groupbyposting=groupbyposting;
plist.groupbyposting2=groupbyposting2;
plist.groupsum=groupsum;
plist.combine=combine;
module.exports=plist;
},{}],"c:\\ksana2015\\node_modules\\ksana-search\\search.js":[function(require,module,exports){
/*
var dosearch2=function(engine,opts,cb,context) {
	opts
		nfile,npage  //return a highlighted page
		nfile,[pages] //return highlighted pages 
		nfile        //return entire highlighted file
		abs_npage
		[abs_pages]  //return set of highlighted pages (may cross file)

		filename, pagename
		filename,[pagenames]

		excerpt      //
	    sortBy       //default natural, sortby by vsm ranking

	//return err,array_of_string ,Q  (Q contains low level search result)
}

*/
/* TODO sorted tokens */
var plist=require("./plist");
var boolsearch=require("./boolsearch");
var excerpt=require("./excerpt");
var parseTerm = function(engine,raw,opts) {
	if (!raw) return;
	var res={raw:raw,variants:[],term:'',op:''};
	var term=raw, op=0;
	var firstchar=term[0];
	var termregex="";
	if (firstchar=='-') {
		term=term.substring(1);
		firstchar=term[0];
		res.exclude=true; //exclude
	}
	term=term.trim();
	var lastchar=term[term.length-1];
	term=engine.analyzer.normalize(term);
	
	if (term.indexOf("%")>-1) {
		var termregex="^"+term.replace(/%+/g,".+")+"$";
		if (firstchar=="%") 	termregex=".+"+termregex.substr(1);
		if (lastchar=="%") 	termregex=termregex.substr(0,termregex.length-1)+".+";
	}

	if (termregex) {
		res.variants=expandTerm(engine,termregex);
	}

	res.key=term;
	return res;
}
var expandTerm=function(engine,regex) {
	var r=new RegExp(regex);
	var tokens=engine.get("tokens");
	var postingsLength=engine.get("postingslength");
	if (!postingsLength) postingsLength=[];
	var out=[];
	for (var i=0;i<tokens.length;i++) {
		var m=tokens[i].match(r);
		if (m) {
			out.push([m[0],postingsLength[i]||1]);
		}
	}
	out.sort(function(a,b){return b[1]-a[1]});
	return out;
}
var isWildcard=function(raw) {
	return !!raw.match(/[\*\?]/);
}

var isOrTerm=function(term) {
	term=term.trim();
	return (term[term.length-1]===',');
}
var orterm=function(engine,term,key) {
		var t={text:key};
		if (engine.analyzer.simplifiedToken) {
			t.simplified=engine.analyzer.simplifiedToken(key);
		}
		term.variants.push(t);
}
var orTerms=function(engine,tokens,now) {
	var raw=tokens[now];
	var term=parseTerm(engine,raw);
	if (!term) return;
	orterm(engine,term,term.key);
	while (isOrTerm(raw))  {
		raw=tokens[++now];
		var term2=parseTerm(engine,raw);
		orterm(engine,term,term2.key);
		for (var i in term2.variants){
			term.variants[i]=term2.variants[i];
		}
		term.key+=','+term2.key;
	}
	return term;
}

var getOperator=function(raw) {
	var op='';
	if (raw[0]=='+') op='include';
	if (raw[0]=='-') op='exclude';
	return op;
}
var parsePhrase=function(q) {
	var match=q.match(/(".+?"|'.+?'|\S+)/g)
	match=match.map(function(str){
		var n=str.length, h=str.charAt(0), t=str.charAt(n-1)
		if (h===t&&(h==='"'|h==="'")) str=str.substr(1,n-2)
		return str;
	})
	return match;
}
var tibetanNumber={
	"\u0f20":"0","\u0f21":"1","\u0f22":"2",	"\u0f23":"3",	"\u0f24":"4",
	"\u0f25":"5","\u0f26":"6","\u0f27":"7","\u0f28":"8","\u0f29":"9"
}
var parseNumber=function(raw) {
	var n=parseInt(raw,10);
	if (isNaN(n)){
		var converted=[];
		for (var i=0;i<raw.length;i++) {
			var nn=tibetanNumber[raw[i]];
			if (typeof nn !="undefined") converted[i]=nn;
			else break;
		}
		return parseInt(converted,10);
	} else {
		return n;
	}
}
var parseWildcard=function(raw) {
	var n=parseNumber(raw) || 1;
	var qcount=raw.split('?').length-1;
	var scount=raw.split('*').length-1;
	var type='';
	if (qcount) type='?';
	else if (scount) type='*';
	return {wildcard:type, width: n , op:'wildcard'};
}

var newPhrase=function() {
	return {termid:[],posting:[],raw:'',termlength:[]};
} 
var parseQuery=function(q,sep) {
	if (sep && q.indexOf(sep)>-1) {
		var match=q.split(sep);
	} else {
		var match=q.match(/(".+?"|'.+?'|\S+)/g)
		match=match.map(function(str){
			var n=str.length, h=str.charAt(0), t=str.charAt(n-1)
			if (h===t&&(h==='"'|h==="'")) str=str.substr(1,n-2)
			return str
		})
		//console.log(input,'==>',match)		
	}
	return match;
}
var loadPhrase=function(phrase) {
	/* remove leading and ending wildcard */
	var Q=this;
	var cache=Q.engine.postingCache;
	if (cache[phrase.key]) {
		phrase.posting=cache[phrase.key];
		return Q;
	}
	if (phrase.termid.length==1) {
		if (!Q.terms.length){
			phrase.posting=[];
		} else {
			cache[phrase.key]=phrase.posting=Q.terms[phrase.termid[0]].posting;	
		}
		return Q;
	}

	var i=0, r=[],dis=0;
	while(i<phrase.termid.length) {
	  var T=Q.terms[phrase.termid[i]];
		if (0 === i) {
			r = T.posting;
		} else {
		    if (T.op=='wildcard') {
		    	T=Q.terms[phrase.termid[i++]];
		    	var width=T.width;
		    	var wildcard=T.wildcard;
		    	T=Q.terms[phrase.termid[i]];
		    	var mindis=dis;
		    	if (wildcard=='?') mindis=dis+width;
		    	if (T.exclude) r = plist.plnotfollow2(r, T.posting, mindis, dis+width);
		    	else r = plist.plfollow2(r, T.posting, mindis, dis+width);		    	
		    	dis+=(width-1);
		    }else {
		    	if (T.posting) {
		    		if (T.exclude) r = plist.plnotfollow(r, T.posting, dis);
		    		else r = plist.plfollow(r, T.posting, dis);
		    	}
		    }
		}
		dis += phrase.termlength[i];
		i++;
		if (!r) return Q;
  }
  phrase.posting=r;
  cache[phrase.key]=r;
  return Q;
}
var trimSpace=function(engine,query) {
	if (!query) return "";
	var i=0;
	var isSkip=engine.analyzer.isSkip;
	while (isSkip(query[i]) && i<query.length) i++;
	return query.substring(i);
}
var getSegWithHit=function(fileid,offsets) {
	var Q=this,engine=Q.engine;
	var segWithHit=plist.groupbyposting2(Q.byFile[fileid ], offsets);
	if (segWithHit.length) segWithHit.shift(); //the first item is not used (0~Q.byFile[0] )
	var out=[];
	segWithHit.map(function(p,idx){if (p.length) out.push(idx)});
	return out;
}
var segWithHit=function(fileid) {
	var Q=this,engine=Q.engine;
	var offsets=engine.getFileSegOffsets(fileid);
	return getSegWithHit.apply(this,[fileid,offsets]);
}
var isSimplePhrase=function(phrase) {
	var m=phrase.match(/[\?%^]/);
	return !m;
}

// 發菩提心   ==> 發菩  提心       2 2   
// 菩提心     ==> 菩提  提心       1 2
// 劫劫       ==> 劫    劫         1 1   // invalid
// 因緣所生道  ==> 因緣  所生   道   2 2 1
var splitPhrase=function(engine,simplephrase,bigram) {
	var bigram=bigram||engine.get("meta").bigram||[];
	var tokens=engine.analyzer.tokenize(simplephrase).tokens;
	var loadtokens=[],lengths=[],j=0,lastbigrampos=-1;
	while (j+1<tokens.length) {
		var token=engine.analyzer.normalize(tokens[j]);
		var nexttoken=engine.analyzer.normalize(tokens[j+1]);
		var bi=token+nexttoken;
		var i=plist.indexOfSorted(bigram,bi);
		if (bigram[i]==bi) {
			loadtokens.push(bi);
			if (j+3<tokens.length) {
				lastbigrampos=j;
				j++;
			} else {
				if (j+2==tokens.length){ 
					if (lastbigrampos+1==j ) {
						lengths[lengths.length-1]--;
					}
					lastbigrampos=j;
					j++;
				}else {
					lastbigrampos=j;	
				}
			}
			lengths.push(2);
		} else {
			if (!bigram || lastbigrampos==-1 || lastbigrampos+1!=j) {
				loadtokens.push(token);
				lengths.push(1);				
			}
		}
		j++;
	}

	while (j<tokens.length) {
		var token=engine.analyzer.normalize(tokens[j]);
		loadtokens.push(token);
		lengths.push(1);
		j++;
	}

	return {tokens:loadtokens, lengths: lengths , tokenlength: tokens.length};
}
/* host has fast native function */
var fastPhrase=function(engine,phrase) {
	var phrase_term=newPhrase();
	//var tokens=engine.analyzer.tokenize(phrase).tokens;
	var splitted=splitPhrase(engine,phrase);

	var paths=postingPathFromTokens(engine,splitted.tokens);
//create wildcard

	phrase_term.width=splitted.tokenlength; //for excerpt.js to getPhraseWidth

	engine.get(paths,{address:true},function(postingAddress){ //this is sync
		phrase_term.key=phrase;
		var postingAddressWithWildcard=[];
		for (var i=0;i<postingAddress.length;i++) {
			postingAddressWithWildcard.push(postingAddress[i]);
			if (splitted.lengths[i]>1) {
				postingAddressWithWildcard.push([splitted.lengths[i],0]); //wildcard has blocksize==0 
			}
		}
		engine.postingCache[phrase]=engine.mergePostings(postingAddressWithWildcard);
	});
	return phrase_term;
	// put posting into cache[phrase.key]
}
var slowPhrase=function(engine,terms,phrase) {
	var j=0,tokens=engine.analyzer.tokenize(phrase).tokens;
	var phrase_term=newPhrase();
	var termid=0;
	while (j<tokens.length) {
		var raw=tokens[j], termlength=1;
		if (isWildcard(raw)) {
			if (phrase_term.termid.length==0)  { //skip leading wild card
				j++
				continue;
			}
			terms.push(parseWildcard(raw));
			termid=terms.length-1;
			phrase_term.termid.push(termid);
			phrase_term.termlength.push(termlength);
		} else if (isOrTerm(raw)){
			var term=orTerms.apply(this,[tokens,j]);
			if (term) {
				terms.push(term);
				termid=terms.length-1;
				j+=term.key.split(',').length-1;					
			}
			j++;
			phrase_term.termid.push(termid);
			phrase_term.termlength.push(termlength);
		} else {
			var phrase="";
			while (j<tokens.length) {
				if (!(isWildcard(tokens[j]) || isOrTerm(tokens[j]))) {
					phrase+=tokens[j];
					j++;
				} else break;
			}

			var splitted=splitPhrase(engine,phrase);
			for (var i=0;i<splitted.tokens.length;i++) {

				var term=parseTerm(engine,splitted.tokens[i]);
				var termidx=terms.map(function(a){return a.key}).indexOf(term.key);
				if (termidx==-1) {
					terms.push(term);
					termid=terms.length-1;
				} else {
					termid=termidx;
				}				
				phrase_term.termid.push(termid);
				phrase_term.termlength.push(splitted.lengths[i]);
			}
		}
		j++;
	}
	phrase_term.key=phrase;
	//remove ending wildcard
	var P=phrase_term , T=null;
	do {
		T=terms[P.termid[P.termid.length-1]];
		if (!T) break;
		if (T.wildcard) P.termid.pop(); else break;
	} while(T);		
	return phrase_term;
}
var newQuery =function(engine,query,opts) {
	//if (!query) return;
	opts=opts||{};
	query=trimSpace(engine,query);

	var phrases=query,phrases=[];
	if (typeof query=='string' && query) {
		phrases=parseQuery(query,opts.phrase_sep || "");
	}
	
	var phrase_terms=[], terms=[],variants=[],operators=[];
	var pc=0;//phrase count
	for  (var i=0;i<phrases.length;i++) {
		var op=getOperator(phrases[pc]);
		if (op) phrases[pc]=phrases[pc].substring(1);

		/* auto add + for natural order ?*/
		//if (!opts.rank && op!='exclude' &&i) op='include';
		operators.push(op);

		if (isSimplePhrase(phrases[pc]) && engine.mergePostings ) {
			var phrase_term=fastPhrase(engine,phrases[pc]);
		} else {
			var phrase_term=slowPhrase(engine,terms,phrases[pc]);
		}
		phrase_terms.push(phrase_term);

		if (!engine.mergePostings && phrase_terms[pc].termid.length==0) {
			phrase_terms.pop();
		} else pc++;
	}
	opts.op=operators;

	var Q={dbname:engine.dbname,engine:engine,opts:opts,query:query,
		phrases:phrase_terms,terms:terms
	};
	Q.tokenize=function() {return engine.analyzer.tokenize.apply(engine,arguments);}
	Q.isSkip=function() {return engine.analyzer.isSkip.apply(engine,arguments);}
	Q.normalize=function() {return engine.analyzer.normalize.apply(engine,arguments);}
	Q.segWithHit=segWithHit;

	//Q.getRange=function() {return that.getRange.apply(that,arguments)};
	//API.queryid='Q'+(Math.floor(Math.random()*10000000)).toString(16);
	return Q;
}
var postingPathFromTokens=function(engine,tokens) {
	var alltokens=engine.get("tokens");

	var tokenIds=tokens.map(function(t){ return 1+alltokens.indexOf(t)});
	var postingid=[];
	for (var i=0;i<tokenIds.length;i++) {
		postingid.push( tokenIds[i]); // tokenId==0 , empty token
	}
	return postingid.map(function(t){return ["postings",t]});
}
var loadPostings=function(engine,tokens,cb) {
	var toloadtokens=tokens.filter(function(t){
		return !engine.postingCache[t.key]; //already in cache
	});
	if (toloadtokens.length==0) {
		cb();
		return;
	}
	var postingPaths=postingPathFromTokens(engine,tokens.map(function(t){return t.key}));
	engine.get(postingPaths,function(postings){
		postings.map(function(p,i) { tokens[i].posting=p });
		if (cb) cb();
	});
}
var groupBy=function(Q,posting) {
	phrases.forEach(function(P){
		var key=P.key;
		var docfreq=docfreqcache[key];
		if (!docfreq) docfreq=docfreqcache[key]={};
		if (!docfreq[that.groupunit]) {
			docfreq[that.groupunit]={doclist:null,freq:null};
		}		
		if (P.posting) {
			var res=matchPosting(engine,P.posting);
			P.freq=res.freq;
			P.docs=res.docs;
		} else {
			P.docs=[];
			P.freq=[];
		}
		docfreq[that.groupunit]={doclist:P.docs,freq:P.freq};
	});
	return this;
}
var groupByFolder=function(engine,filehits) {
	var files=engine.get("filenames");
	var prevfolder="",hits=0,out=[];
	for (var i=0;i<filehits.length;i++) {
		var fn=files[i];
		var folder=fn.substring(0,fn.indexOf('/'));
		if (prevfolder && prevfolder!=folder) {
			out.push(hits);
			hits=0;
		}
		hits+=filehits[i].length;
		prevfolder=folder;
	}
	out.push(hits);
	return out;
}
var phrase_intersect=function(engine,Q) {
	var intersected=null;
	var fileoffsets=Q.engine.get("fileoffsets");
	var empty=[],emptycount=0,hashit=0;
	for (var i=0;i<Q.phrases.length;i++) {
		var byfile=plist.groupbyposting2(Q.phrases[i].posting,fileoffsets);
		if (byfile.length) byfile.shift();
		if (byfile.length) byfile.pop();
		byfile.pop();
		if (intersected==null) {
			intersected=byfile;
		} else {
			for (var j=0;j<byfile.length;j++) {
				if (!(byfile[j].length && intersected[j].length)) {
					intersected[j]=empty; //reuse empty array
					emptycount++;
				} else hashit++;
			}
		}
	}

	Q.byFile=intersected;
	Q.byFolder=groupByFolder(engine,Q.byFile);
	var out=[];
	//calculate new rawposting
	for (var i=0;i<Q.byFile.length;i++) {
		if (Q.byFile[i].length) out=out.concat(Q.byFile[i]);
	}
	Q.rawresult=out;
	countFolderFile(Q);
}
var countFolderFile=function(Q) {
	Q.fileWithHitCount=0;
	Q.byFile.map(function(f){if (f.length) Q.fileWithHitCount++});
			
	Q.folderWithHitCount=0;
	Q.byFolder.map(function(f){if (f) Q.folderWithHitCount++});
}

var main=function(engine,q,opts,cb){
	var starttime=new Date();
	var meta=engine.get("meta");
	if (meta.normalize && engine.analyzer.setNormalizeTable) {
		meta.normalizeObj=engine.analyzer.setNormalizeTable(meta.normalize,meta.normalizeObj);
	}
	if (typeof opts=="function") cb=opts;
	opts=opts||{};
	var Q=engine.queryCache[q];
	if (!Q) Q=newQuery(engine,q,opts); 
	if (!Q) {
		engine.searchtime=new Date()-starttime;
		engine.totaltime=engine.searchtime;
		if (engine.context) cb.apply(engine.context,["empty result",{rawresult:[]}]);
		else cb("empty result",{rawresult:[]});
		return;
	};
	engine.queryCache[q]=Q;
	if (Q.phrases.length) {
		loadPostings(engine,Q.terms,function(){
			if (!Q.phrases[0].posting) {
				engine.searchtime=new Date()-starttime;
				engine.totaltime=engine.searchtime

				cb.apply(engine.context,["no such posting",{rawresult:[]}]);
				return;			
			}
			
			if (!Q.phrases[0].posting.length) { //
				Q.phrases.forEach(loadPhrase.bind(Q));
			}
			if (Q.phrases.length==1) {
				Q.rawresult=Q.phrases[0].posting;
			} else {
				phrase_intersect(engine,Q);
			}
			var fileoffsets=Q.engine.get("fileoffsets");
			//console.log("search opts "+JSON.stringify(opts));

			if (!Q.byFile && Q.rawresult && !opts.nogroup) {
				Q.byFile=plist.groupbyposting2(Q.rawresult, fileoffsets);
				Q.byFile.shift();Q.byFile.pop();
				Q.byFolder=groupByFolder(engine,Q.byFile);

				countFolderFile(Q);
			}

			if (opts.range) {
				engine.searchtime=new Date()-starttime;
				excerpt.resultlist(engine,Q,opts,function(data) { 
					//console.log("excerpt ok");
					Q.excerpt=data;
					engine.totaltime=new Date()-starttime;
					cb.apply(engine.context,[0,Q]);
				});
			} else {
				engine.searchtime=new Date()-starttime;
				engine.totaltime=new Date()-starttime;
				cb.apply(engine.context,[0,Q]);
			}
		});
	} else { //empty search
		engine.searchtime=new Date()-starttime;
		engine.totaltime=new Date()-starttime;
		cb.apply(engine.context,[0,Q]);
	};
}

main.splitPhrase=splitPhrase; //just for debug
module.exports=main;
},{"./boolsearch":"c:\\ksana2015\\node_modules\\ksana-search\\boolsearch.js","./excerpt":"c:\\ksana2015\\node_modules\\ksana-search\\excerpt.js","./plist":"c:\\ksana2015\\node_modules\\ksana-search\\plist.js"}],"c:\\ksana2015\\node_modules\\ksana2015-swipe3-ui\\index.js":[function(require,module,exports){
module.exports={
  main:require("./main"),
  resultlist:require("./resultlist"),
  showtext:require("./showtext")
}
},{"./main":"c:\\ksana2015\\node_modules\\ksana2015-swipe3-ui\\main.js","./resultlist":"c:\\ksana2015\\node_modules\\ksana2015-swipe3-ui\\resultlist.js","./showtext":"c:\\ksana2015\\node_modules\\ksana2015-swipe3-ui\\showtext.js"}],"c:\\ksana2015\\node_modules\\ksana2015-swipe3-ui\\main.js":[function(require,module,exports){
//var bootstrap=require("bootstrap"); 
var kde=require('ksana-database');  // Ksana Database Engine
var kse=require('ksana-search'); // Ksana Search Engine (run at client side)
var Stacktoc=require("./stacktoccomponent");
var Swipe=require("./swipecomponent");
var Fileinstaller=require("ksana2015-webruntime").fileinstaller;
var E=React.createElement;
var DefaultmainMixin = {
  getInitialState: function() {
    return {res:{excerpt:[]},db:null , msg:"click GO button to search"};
  },
  swipetargets:[],
  action:function() {
    var args=Array.prototype.slice.call(arguments);
    var type=args.shift();

    if (!this.handlers) return;
    if (!this.handlers[type]) return;
    this.handlers[type].apply(this,args);
  }, 
  newTofind:function(tf) {
    if (!localStorage) return;
    var historytofind=JSON.parse(localStorage.getItem("historytofind")||"[]");
    var i=historytofind.indexOf(tf);
    if (i>-1) historytofind.splice(i,1);
    historytofind.push(tf);
    while(historytofind.length>5) {
      historytofind.shift();
    }
    localStorage.setItem("historytofind",JSON.stringify(historytofind));
    return historytofind;
  },
  search:function(tofind,start,end) {
    var t=new Date();
    if (this.state.q!=tofind) {
      this.newTofind(tofind);
    }
    this.setState({q:tofind,msg:"Searching"});
    var that=this;
    setTimeout(function(){
      kse.search(that.state.db,tofind,{range:{start:start,end:end,maxhit:25}},function(err,data){ //call search engine
        that.setState({res:data,msg:(new Date()-t)+"ms"});
        //console.log(data) ; // watch the result from search engine
      });
    },0);
  },
  dosearch:function(e,reactid,start_end) {
    var start=start_end,tochit=0;
    var end=this.state.db.get("meta").vsize;
    if (typeof start_end=="undefined") {
      start=0;
    }else if (typeof start_end!="number" && typeof start_end[0]=="number") {
      start=start_end[0];
      end=start_end[1];
      tochit=start_end[2];
    }
    var tofind=this.refs.tofind.getDOMNode().value;
    if (e) tofind=e.target.innerHTML;
    if (tofind=="GO") tofind=this.refs.tofind.getDOMNode().value;
    this.search(tofind,start,end);
  },
  keypress:function(e) {
    if (e.key=="Enter") this.dosearch();
  },
  renderExtraInput:function() {
    if (this.tofindExtra) {
      var historytofind=[];
      if (localStorage) {
        historytofind=JSON.parse(localStorage.getItem("historytofind")||"[]");  
      }
      return this.tofindExtra(historytofind);
    }
    else return null;
  },
  renderinputs:function() {  // input interface for search
    if (this.state.db) {
      return (    
        E("div", null, 
        E("div", {className: "centered inputs"}, E("input", {size: "8", onKeyPress: this.keypress, ref: "tofind", defaultValue: this.defaultTofind||""}), 
        E("button", {ref: "btnsearch", onClick: this.dosearch}, "GO"), 
        this.renderExtraInput()
        ), 
        this.state.db.searchtime?Math.floor(this.state.db.searchtime)+" ms":"", 
        this.renderResultList()
        )
        )          
    } else {
      return E("span", null, "loading database....")
    }
  }, 
  renderResultList:function() {
    var ResultListComponent=require("./resultlist");
    if (this.resultListComponent) {
      ResultListComponent=this.resultListComponent;
    }
    return E(ResultListComponent, {gotoseg: this.gotoseg, 
    action: this.action, res: this.state.res})
  },
  genToc:function(texts,depths,voffs) {

    var out=[{depth:0,text:ksana.js.title}];
    if (texts) for (var i=0;i<texts.length;i++) {
      out.push({text:texts[i],depth:depths[i], voff:voffs[i]});
    }
    return out; 
  },     
  showSeg:function(f,p,hideResultlist) {
    var that=this;
    kse.highlightSeg(this.state.db,f,p,{q:this.state.q,renderTags:this.renderTags},function(data){
      that.setState({bodytext:data});
      if (hideResultlist) that.setState({res:{excerpt:[]}});
    });
  },
  gotoseg:function(vpos) {
    var res=kse.vpos2fileseg(this.state.db,vpos);
    this.showSeg(res.file,res.seg);
    this.slideText();
  },
  nextseg:function() {
    if(!this.state.bodytext)return;
    var seg=this.state.bodytext.seg+1;
    this.showSeg(this.state.bodytext.file,seg);
  },
  prevseg:function() {
    if(!this.state.bodytext)return;
    var seg=this.state.bodytext.seg-1;
    if (seg<0) seg=0;
    this.showSeg(this.state.bodytext.file,seg);
  },
  setSeg:function(newsegname,file) {
    file=file||this.state.bodytext.file;
    var segnames=this.state.db.getFileSegNames(file);
    var p=segnames.indexOf(newsegname);
    if (p>-1) this.showSeg(file,p);
  },
  fileseg2vpos:function() {
    var offsets=this.state.db.getFileSegOffsets(this.state.bodytext.file);
    return offsets[this.state.bodytext.seg];
  },
  showText:function(n) {
    var res=kse.vpos2fileseg(this.state.db,this.state.toc[n].voff);
    this.showSeg(res.file,res.seg);
    this.slideText();
  },
  onReady:function(usage,quota) {
    var head=this.tocTag||"head";
    if (!this.state.db) kde.open(this.dbid,function(err,db){
        this.setState({db:db});

        var preloadtags=[["fields",head],["fields",head+"_depth"],
          ["fields",head+"_voff"]];
        if (this.renderTags) {
          this.renderTags.map(function(tag){
            preloadtags.push(["fields",tag+"_start"]);
            preloadtags.push(["fields",tag+"_end"]);
          });
        }
        db.get([preloadtags],function() {
          var heads=db.get(["fields",head]);
          var depths=db.get(["fields",head+"_depth"]);
          var voffs=db.get(["fields",head+"_voff"]);
          var toc=this.genToc(heads,depths,voffs);//,toc:toc
          this.setState({toc:toc});
       });
    },this);      
    this.setState({dialog:false,quota:quota,usage:usage});
  },
  getRequire_kdb:function() {//return an array of require db from ksana.js
    var required=[];
    ksana.js.files.map(function(f){
      if (f.indexOf(".kdb")==f.length-4) {
        var slash=f.lastIndexOf("/");
        if (slash>-1) {
          var dbid=f.substring(slash+1,f.length-4);
          required.push({url:f,dbid:dbid,filename:dbid+".kdb"});
        } else {
          var dbid=f.substring(0,f.length-4);
          required.push({url:ksana.js.baseurl+f,dbid:dbid,filename:f});
        }        
      }
    });
    return required;
  },
  openFileinstaller:function(autoclose) {
    var require_kdb=this.getRequire_kdb().map(function(db){
      return {
        url:window.location.origin+window.location.pathname+db.dbid+".kdb",
        dbdb:db.dbid,
        filename:db.filename
      }
    })
    return E(Fileinstaller, {quota: "512M", autoclose: autoclose, needed: require_kdb, 
                     onReady: this.onReady})
  },
  fidialog:function() {
      this.setState({dialog:true});
  }, 
  showExcerpt:function(n) {
    var voff=this.state.toc[n].voff;
    var end=this.state.toc[n].end;
    var hit=this.state.toc[n].hit;
    this.dosearch(null,null,[voff,end,hit]);
    this.slideSearch();
  },
  syncToc:function(voff) {
    this.setState({goVoff:voff||this.fileseg2vpos()});
    this.slideToc();
  },
  slideSearch:function() {
    $("body").scrollTop(0);
    if (this.refs.Swipe) this.refs.Swipe.swipe.slide(2);
  },
  slideToc:function() {
    $("body").scrollTop(0);
    if (this.refs.Swipe) this.refs.Swipe.swipe.slide(0);
  },
  slideText:function() {
    if (this.refs.Swipe) {
      $("body").scrollTop(0);
      this.refs.Swipe.swipe.slide(1);
    }
  },
  onSwipeStart:function(target) {
    if (target && this.swipable(target)) {
      this.swipetargets.push([target,target.style.background]);
      target.style.background="yellow";
    }
    if (this.swipetimer) clearTimeout(this.swipetimer);
    var that=this;
    this.swipetimer=setTimeout(function(){
      if(!that.swipetargets.length) return;
      that.swipetargets.map(function(t){
        t[0].style.background=t[1];
      });
      that.swipetargets=[];
    },3000);
  },
  swipable:function(target) {
    while (target && target.dataset && 
      typeof target.dataset.n=="undefined" && typeof target.dataset.vpos=="undefined" ) {
      target=target.parentNode;
    }
    if (target && target.dataset) return true;
  },
  tryTocNode:function(index,target){
    while (target && target.dataset && typeof target.dataset.n=="undefined") {
      target=target.parentNode;
    }
    if (target && target.dataset&&target.dataset.n) {
      if (index==2) {//filter search result
        this.showExcerpt(target.dataset.n);
      } else {
        var voff=this.state.toc[target.dataset.n].voff;
        this.gotoseg(voff);  
      }    
      return true;
    }
  },
  tryResultItem:function(index,target) {
    while (target && target.dataset && typeof target.dataset.vpos=="undefined") {
      target=target.parentNode;
    }
    if (target && target.dataset&&target.dataset.vpos) {
      var vpos=parseInt(target.dataset.vpos);
      if (index==1) {
        this.gotoseg(vpos);
      } else {
       // this.syncToc(vpos);
      }
      return true;
    }
  },
  onSwipeEnd:function(target) {
    if (this.swipetargets.length) {
      this.swipetargets[0][0].style.background=this.swipetargets[0][1];
      this.swipetargets.shift();
    }
  },
  onTransitionEnd:function(index,slide,target) {
    if (!this.tryResultItem(index,target)) this.tryTocNode(index,target);
  },
  renderSlideButtons:function() {
    if (ksana.platform!="ios" && ksana.platform!="android") {
      return E("div", null, 
                E("button", {onClick: this.slideToc}, "Toc"), 
                E("button", {onClick: this.slideText}, "Text"), 
                E("button", {onClick: this.slideSearch}, "Search")
              )
    }
  },
  renderStacktoc:function() {
    return  E(Stacktoc, {showText: this.showText, 
            showExcerpt: this.showExcerpt, hits: this.state.res.rawresult, 
            action: this.action, 
            data: this.state.toc, goVoff: this.state.goVoff, 
            showTextOnLeafNodeOnly: true})
  },
  renderShowtext:function(text,segname) {
    var ShowTextComponent=require("./showtext");
    if (this.showTextComponent) {
      ShowTextComponent=this.showTextComponent;
    }
    return E(ShowTextComponent, {segname: segname, text: text, 
      dictionaries: this.dictionaries, 
      action: this.action, 
      nextseg: this.nextseg, setseg: this.setseg, prevseg: this.prevseg, syncToc: this.syncToc})
  },
  renderMobile:function(text,segname) {
     return (
      E("div", {className: "main"}, 
        E(Swipe, {ref: "Swipe", continuous: true, 
               transitionEnd: this.onTransitionEnd, 
               swipeStart: this.onSwipeStart, swipeEnd: this.onSwipeEnd}, 
        E("div", {className: "swipediv"}, 
          this.renderStacktoc()
        ), 
        E("div", {className: "swipediv"}, 
          this.renderShowtext(text,segname)
        ), 
        E("div", {className: "swipediv"}, 
            this.renderinputs()
        )
        )
      )
      );
  },
  renderPC:function(text,segname) {
    return E("div", {className: "main"}, 
        E("div", {className: "col-md-3"}, 
          this.renderStacktoc()
        ), 
        E("div", {className: "col-md-4"}, 
            this.renderinputs()
        ), 
        E("div", {className: "col-md-5"}, 
            this.renderShowtext(text,segname)
        )
      )
  },
  render: function() {  //main render routine
    if (!this.state.quota) { // install required db
        return this.openFileinstaller(true);
    } else {
      var text="";
      var segname="";
      if (this.state.bodytext) {
        text=this.state.bodytext.text;
        segname=this.state.bodytext.segname;
      }
      if (ksanagap.platform=="chrome" || ksanagap.platform=="node-webkit") {
        return this.renderPC(text,segname);
      } else {
        return this.renderMobile(text,segname);
      }
  }
  } 
}

module.exports=DefaultmainMixin;
},{"./resultlist":"c:\\ksana2015\\node_modules\\ksana2015-swipe3-ui\\resultlist.js","./showtext":"c:\\ksana2015\\node_modules\\ksana2015-swipe3-ui\\showtext.js","./stacktoccomponent":"c:\\ksana2015\\node_modules\\ksana2015-swipe3-ui\\stacktoccomponent.js","./swipecomponent":"c:\\ksana2015\\node_modules\\ksana2015-swipe3-ui\\swipecomponent.js","ksana-database":"c:\\ksana2015\\node_modules\\ksana-database\\index.js","ksana-search":"c:\\ksana2015\\node_modules\\ksana-search\\index.js","ksana2015-webruntime":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\index.js"}],"c:\\ksana2015\\node_modules\\ksana2015-swipe3-ui\\resultlist.js":[function(require,module,exports){
var Resultlist=React.createClass({  //should search result
  show:function() {  
    return this.props.res.excerpt.map(function(r,i){ // excerpt is an array 
      if (! r) return null;
      return React.createElement("div", {"data-vpos": r.hits[0][0]}, 
      React.createElement("a", {href: "#", onClick: this.gotopage, className: "sourcepage"}, r.pagename), ")", 
      React.createElement("span", {className: "resultitem", dangerouslySetInnerHTML: {__html:r.text}})
      )
    },this);
  },
  gotopage:function(e) {
    var vpos=parseInt(e.target.parentNode.dataset['vpos']);
    this.props.gotopage(vpos);
  },
  render:function() { 
    if (this.props.res) return React.createElement("div", null, this.show());
    else return React.createElement("div", null, "Not Found");
  } 
}); 

module.exports=Resultlist;
},{}],"c:\\ksana2015\\node_modules\\ksana2015-swipe3-ui\\showtext.js":[function(require,module,exports){
//var Dictionary=require("ksana2015-dictionary-ui");
var Controls = React.createClass({
  getInitialState: function() {
    return {segname:this.props.segname};
  },
  updateValue:function(e){
    if (e.key!="Enter") return;
    var newsegname=this.refs.segname.getDOMNode().value;
    this.props.setseg(newsegname);
  },  
  shouldComponentUpdate:function(nextProps,nextState) {
    this.refs.segname.getDOMNode().value=nextProps.segname;
    nextState.segname=nextProps.segname;
    return true;
  },
  gotoToc:function() {
    this.props.syncToc(); 
  },
  render: function() {   
   return React.createElement("div", {className: "inputs"}, 
      React.createElement("button", {onClick: this.gotoToc}, "TOC"), 
      React.createElement("span", null, "___"), 
      React.createElement("button", {onClick: this.props.prev}, " \u25c0 "), 
       React.createElement("input", {size: "8", type: "text", ref: "segname", onKeyUp: this.updateValue}), 
      React.createElement("button", {onClick: this.props.next}, " \u25b6 ")
      )
  }  
});
var addbr=function(t) {
  return t.split("\n").map(function(line){return line+" <br/>"}).join("\n");
};

var Showtext = React.createClass({
  getInitialState: function() {
    return {dicttofind:""};
  },
  touchdistance:function(start,end) {
    var dx=end[0]-start[0];
    var dy=end[1]-start[1];
    return Math.sqrt(dx*dx+dy*dy);
  },
  touchstart:function(e) {
    this.touching=e.target;
    this.touchpos=[e.targetTouches[0].pageX,e.targetTouches[0].pageY];
  },
  touchend:function(e){
    var touching=this.touching;
    this.touching=null;
    if (e.target!=touching) {
      return;
    }
    var touchpos=[e.changedTouches[0].pageX,e.changedTouches[0].pageY];
    var dist=this.touchdistance(this.touchpos,touchpos);
    if (dist<5) this.checkUnderTap(e);
  },
  checkUnderTap:function(e) {
    var span=e.target;
    this.props.action("showtext.ontap",e);
    if (span.nodeName!="SPAN" || span.parentElement.classList[0]!="bodytext") return;
    if (this.props.dictionaries && this.props.dictionaries.length) {
      this.setState({dicttofind:span});
    }
  },
//          <Dictionary dictionaries={this.props.dictionaries}  tofind={this.state.dicttofind}/>
  render: function() {
    var pn=this.props.segname;
    return ( 
      React.createElement("div", null, 
        React.createElement(Controls, {segname: this.props.segname, next: this.props.nextseg, 
        prev: this.props.prevseg, setseg: this.props.setseg, 
        syncToc: this.props.syncToc}), 

        React.createElement("div", {onTouchStart: this.touchstart, 
             onTouchEnd: this.touchend, 
             onClick: this.checkUnderTap, 
             className: "bodytext", 
             dangerouslySetInnerHTML: {__html:addbr(this.props.text||"")}})
      )
    );
  }
});
module.exports=Showtext;
},{}],"c:\\ksana2015\\node_modules\\ksana2015-swipe3-ui\\stacktoccomponent.js":[function(require,module,exports){
/** @jsx React.DOM */
var E=React.createElement;
var trimHit=function(hit) {
  if (hit>999) { 
    return (Math.floor(hit/1000)).toString()+"K+";
  } else return hit.toString();
}
var trimText=function(text,opts) {
    if (opts.maxitemlength && text.length>opts.maxitemlength) {
      var stopAt=opts.stopAt||"";
      if (stopAt) {
        var at=opts.maxitemlength;
        while (at>10) {
          if (text.charAt(at)==stopAt) return text.substr(0,at)+"...";
          at--;
        }
      } else {
        return text.substr(0,opts.maxitemlength)+"...";
      }
    } 
    return text;
}
var renderDepth=function(depth,opts,nodetype) {
  var out=[];
  if (opts.tocstyle=="vertical_line") {
    for (var i=0;i<depth;i++) {
      if (i==depth-1) {
        out.push(E("img", {src: opts.tocbar_start}));
      } else {
        out.push(E("img", {src: opts.tocbar}));  
      }
    }
    return out;    
  } else {
    if (depth) return E("span", null, depth, ".")
    else return null;
  }
  return null;
};

var Ancestors=React.createClass({
  goback:function(e) {
    var n=e.target.dataset["n"];  
    if (typeof n=="undefined") n=e.target.parentNode.dataset["n"];
    this.props.setCurrent(n); 
  },
  showExcerpt:function(e) {
    var n=parseInt(e.target.parentNode.dataset["n"]);
    e.stopPropagation();
    e.preventDefault();
    this.props.showExcerpt(n);
  }, 
  showHit:function(hit) {
    if (hit)  return E("a", {href: "#", onClick: this.showExcerpt, className: "pull-right badge hitbadge"}, trimHit(hit))
    else return E("span", null);
  },
  renderAncestor:function(n,idx) {
    var hit=this.props.toc[n].hit;
    var text=this.props.toc[n].text.trim();
    text=trimText(text,this.props.opts);
    if (this.props.textConverter) text=this.props.textConverter(text);
    return E("div", {key: "a"+n, className: "node parent", "data-n": n, onClick: this.goback}, renderDepth(idx,this.props.opts,"ancestor"),
              E("a", {className: "text", href: "#"}, text), this.showHit(hit))
  },
  render:function() {
    if (!this.props.data || !this.props.data.length) return E("div",null);
    return E("div", null, this.props.data.map(this.renderAncestor))
  } 
}); 
var Children=React.createClass({
  getInitialState:function() {
    return {selected:0};
  },
  shouldComponentUpdate:function(nextProps,nextState) {
    if (nextProps.data.join()!=this.props.data.join() ) {
      nextState.selected=parseInt(nextProps.data[0]);
    }
    return true;
  },
  open:function(e) {
    var n=e.target.parentNode.dataset["n"];
    if (typeof n!=="undefined") this.props.setCurrent(parseInt(n));
  }, 
  showHit:function(hit) {
    if (hit)  return E("a", {href: "#", onClick: this.showExcerpt, 
      className: "pull-right badge hitbadge"}, trimHit(hit))
    else return E("span",null);
  },
  showExcerpt:function(e) {
    var n=parseInt(e.target.parentNode.dataset["n"]);
    e.stopPropagation();
    e.preventDefault();
    this.props.hitClick(n);
  }, 
  nodeClicked:function(e) {
    var target=e.target;
    while (target && typeof target.dataset.n=="undefined")target=target.parentNode;
    if (!target) return;
    var n=parseInt(target.dataset.n);
    var child=this.props.toc[n];
    if (this.props.showTextOnLeafNodeOnly) {
      if (child.hasChild) {
        this.open(e);
      } else {
        this.showText(e);
      }
    } else {
      if (n==this.state.selected) {
        if (child.hasChild) this.open(e);
        else this.showText(e);
      } else {
        this.showText(e);
      }
    }
    this.setState({selected:n});
  },
  renderChild:function(n) {
    var child=this.props.toc[n];
    var hit=this.props.toc[n].hit;
    var classes="node child",haschild=false;  
    //if (child.extra) extra="<extra>"+child.extra+"</extra>";
    if (!child.hasChild) classes+=" nochild";
    else haschild=true;
    var selected=this.state.selected;
    if (this.props.showTextOnLeafNodeOnly) {
      selected=n;
    }

    var classes="btn btn-link";
    if (n==selected) {
      if (haschild) classes="btn btn-default expandable";
      else classes="btn btn-link link-selected";
    }

    var text=this.props.toc[n].text.trim();
    var depth=this.props.toc[n].depth;
    text=trimText(text,this.props.opts)
    if (this.props.textConverter) text=this.props.textConverter(text);
    return E("div", {key: "child"+n, "data-n": n}, renderDepth(depth,this.props.opts,"child"), 
           E("a", {"data-n": n, className: classes +" tocitem text", onClick: this.nodeClicked}, text+" "), this.showHit(hit)
           )
  },
  showText:function(e) { 
    var target=e.target;
    var n=e.target.dataset.n;
    while (target && typeof target.dataset.n=="undefined") {
      target=target.parentNode;
    }
    if (target && target.dataset.n && this.props.showText) {
      this.props.showText(parseInt(target.dataset.n));
    }
  },
  render:function() {
    if (!this.props.data || !this.props.data.length) return E("div", null);
    return E("div", null, this.props.data.map(this.renderChild))
  }
}); 

var stacktoc = React.createClass({
  getInitialState: function() {
    return {bar: "world",tocReady:false,cur:0};//403
  },
  buildtoc: function() {
      var toc=this.props.data;
      if (!toc || !toc.length) return;  
      var depths=[];
      var prev=0;
      for (var i=0;i<toc.length;i++) {
        var depth=toc[i].depth;
        if (prev>depth) { //link to prev sibling
          if (depths[depth]) toc[depths[depth]].next = i;
          for (var j=depth;j<prev;j++) depths[j]=0;
        }
        if (i<toc.length-1 && toc[i+1].depth>depth) {
          toc[i].hasChild=true;
        }
        depths[depth]=i;
        prev=depth;
      } 
  }, 
  enumAncestors:function() {
    var toc=this.props.data;
    if (!toc || !toc.length) return;
    var cur=this.state.cur;
    if (cur==0) return [];
    var n=cur-1;
    var depth=toc[cur].depth - 1;
    var parents=[];
    while (n>=0 && depth>0) {
      if (toc[n].depth==depth) {
        parents.unshift(n);
        depth--;
      }
      n--;
    }
    parents.unshift(0); //first ancestor is root node
    return parents;
  },
  enumChildren : function() {
    var cur=this.state.cur;
    var toc=this.props.data;

    var children=[];
    if (!toc || !toc.length || toc.length==1) return children;

    if (toc[cur+1].depth!= 1+toc[cur].depth) return children;  // no children node
    var n=cur+1;
    var child=toc[n];
    while (child) {
      children.push(n);
      var next=toc[n+1];
      if (!next) break;
      if (next.depth==child.depth) {
        n++;
      } else if (next.depth>child.depth) {
        n=child.next;
      } else break;
      if (n) child=toc[n];else break;
    }

    return children;
  },
  rebuildToc:function() {
    if (!this.state.tocReady && this.props.data) {
      this.buildtoc();
      this.setState({tocReady:true});
    }
  },
  componentDidMount:function() {
    this.rebuildToc();
  },
  componentDidUpdate:function() {
    this.rebuildToc();
  },   
  setCurrent:function(n) {
    n=parseInt(n);
    this.setState({cur:n});
    var child=this.props.data[n];
    if (!(child.hasChild && this.props.showTextOnLeafNodeOnly)) {
      this.props.showText(n);
    }
  },
  findByVoff:function(voff) {
    for (var i=0;i<this.props.data.length;i++) {
      var t=this.props.data[i];
      if (t.voff>voff) return i-1;
    }
    return 0; //return root node
  },
  shouldComponentUpdate:function(nextProps,nextState) {
    if (nextProps.goVoff&&nextProps.goVoff !=this.props.goVoff) {
      nextState.cur=this.findByVoff(nextProps.goVoff);
    }
    return true;
  },
  fillHit:function(nodeIds) {
    if (typeof nodeIds=="undefined") return;
    if (typeof nodeIds=="number") nodeIds=[nodeIds];
    var toc=this.props.data;
    var hits=this.props.hits;
    if (toc.length<2) return;
    var getRange=function(n) {
      if (n+1>=toc.length) {
        console.error("exceed toc length",n);
        return;
      }
      var depth=toc[n].depth , nextdepth=toc[n+1].depth;
      if (n==toc.length-1 || n==0) {
          toc[n].end=Math.pow(2, 48);
          return;
      } else  if (nextdepth>depth){
        if (toc[n].next) {
          toc[n].end= toc[toc[n].next].voff;  
        } else { //last sibling
          var next=n+1;
          while (next<toc.length && toc[next].depth>depth) next++;
          if (next==toc.length) toc[n].end=Math.pow(2,48);
          else toc[n].end=toc[next].voff;
        }
      } else { //same level or end of sibling
        toc[n].end=toc[n+1].voff;
      }
    }
    var getHit=function(n) {
      var start=toc[n].voff;
      var end=toc[n].end;
      if (n==0) {
        toc[0].hit=hits.length;
      } else {
        var hit=0;
        for (var i=0;i<hits.length;i++) {
          if (hits[i]>=start && hits[i]<end) hit++;
        }
        toc[n].hit=hit;
      }
    }
    nodeIds.forEach(function(n){getRange(n)});
    nodeIds.forEach(function(n){getHit(n)});
  },
  fillHits:function(ancestors,children) {
      this.fillHit(ancestors);
      this.fillHit(children);
      this.fillHit(this.state.cur);
  },
  hitClick:function(n) {
    if (this.props.showExcerpt)  this.props.showExcerpt(n);
  },
  onHitClick:function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.hitClick(this.state.cur);
  },
  showHit:function(hit) {
    if (hit)  return E("a", {href: "#", onClick: this.onHitClick, className: "pull-right badge hitbadge"}, trimHit(hit))
    else return E("span",null);
  },
  showText:function(e) {
    var target=e.target;
    var n=e.target.dataset.n;
    while (target && typeof target.dataset.n=="undefined") {
      target=target.parentNode;
    }
    if (target && target.dataset.n && this.props.showText) {
      this.props.showText(parseInt(target.dataset.n));
    }
  },

  render: function() {
    if (!this.props.data || !this.props.data.length) return E("div",null);
    var depth=this.props.data[this.state.cur].depth+1;
    var ancestors=this.enumAncestors();
    var children=this.enumChildren();
    var opts=this.props.opts||{};
    var current=this.props.data[this.state.cur];
    if (this.props.hits && this.props.hits.length) {
      this.fillHits(ancestors,children);
    }

    var text=current.text.trim();
    text=trimText(text,opts);
    if (this.props.textConverter) text=this.props.textConverter(text);
    return ( 
      E("div", {className: "stacktoc"}, 
        E(Ancestors, {opts: opts, textConverter: this.props.textConverter, showExcerpt: this.hitClick, setCurrent: this.setCurrent, toc: this.props.data, data: ancestors}), 
        E("div", {className: "node current"}, renderDepth(depth-1,opts,"current"), E("a", {href: "#", onClick: this.showText, "data-n": this.state.cur}, E("span", {className: "text"}, text)), this.showHit(current.hit)), 
        E(Children, {opts: opts, textConverter: this.props.textConverter, showTextOnLeafNodeOnly: this.props.showTextOnLeafNodeOnly, 
                  showText: this.props.showText, hitClick: this.hitClick, setCurrent: this.setCurrent, toc: this.props.data, data: children})
      )
    ); 
  }
});
module.exports=stacktoc;
},{}],"c:\\ksana2015\\node_modules\\ksana2015-swipe3-ui\\swipe.js":[function(require,module,exports){
/*
 * Swipe 2.0
 *
 * Brad Birdsall
 * Copyright 2013, MIT License
 *
*/

module.exports = function Swipe(container, options) {

  "use strict";

  // utilities
  var noop = function() {}; // simple no operation function
  var offloadFn = function(fn) { setTimeout(fn || noop, 0) }; // offload a functions execution

  // check browser capabilities
  var browser = {
    addEventListener: !!window.addEventListener,
    touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
    transitions: (function(temp) {
      var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
      for ( var i in props ) if (temp.style[ props[i] ] !== undefined) return true;
      return false;
    })(document.createElement('swipe'))
  };

  // quit if no root element
  if (!container) return;
  var element = container.children[0];
  var slides, slidePos, width, length;
  options = options || {};
  var index = parseInt(options.startSlide, 10) || 0;
  var speed = options.speed || 300;
  options.continuous = options.continuous !== undefined ? options.continuous : true;

  var target=null; //yap to keep the domnode fires the swipe
  function setup() {

    // cache slides
    slides = element.children;
    length = slides.length;

    // set continuous to false if only one slide
    if (slides.length < 2) options.continuous = false;

    //special case if two slides
    if (browser.transitions && options.continuous && slides.length < 3) {
      element.appendChild(slides[0].cloneNode(true));
      element.appendChild(element.children[1].cloneNode(true));
      slides = element.children;
    }

    // create an array to store current positions of each slide
    slidePos = new Array(slides.length);

    // determine width of each slide
    width = container.getBoundingClientRect().width || container.offsetWidth;

    element.style.width = (slides.length * width) + 'px';

    // stack elements
    var pos = slides.length;
    while(pos--) {

      var slide = slides[pos];

      slide.style.width = width + 'px';
      slide.setAttribute('data-index', pos);

      if (browser.transitions) {
        slide.style.left = (pos * -width) + 'px';
        move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
      }

    }

    // reposition elements before and after index
    if (options.continuous && browser.transitions) {
      move(circle(index-1), -width, 0);
      move(circle(index+1), width, 0);
    }

    if (!browser.transitions) element.style.left = (index * -width) + 'px';

    container.style.visibility = 'visible';

  }

  function prev() {

    if (options.continuous) slide(index-1);
    else if (index) slide(index-1);

  }

  function next() {

    if (options.continuous) slide(index+1);
    else if (index < slides.length - 1) slide(index+1);

  }

  function circle(index) {

    // a simple positive modulo using slides.length
    return (slides.length + (index % slides.length)) % slides.length;

  }

  function slide(to, slideSpeed) {

    // do nothing if already on requested slide
    if (index == to) return;

    if (browser.transitions) {

      var direction = Math.abs(index-to) / (index-to); // 1: backward, -1: forward

      // get the actual position of the slide
      if (options.continuous) {
        var natural_direction = direction;
        direction = -slidePos[circle(to)] / width;

        // if going forward but to < index, use to = slides.length + to
        // if going backward but to > index, use to = -slides.length + to
        if (direction !== natural_direction) to =  -direction * slides.length + to;

      }

      var diff = Math.abs(index-to) - 1;

      // move all the slides between index and to in the right direction
      while (diff--) move( circle((to > index ? to : index) - diff - 1), width * direction, 0);

      to = circle(to);

      move(index, width * direction, slideSpeed || speed);
      move(to, 0, slideSpeed || speed);

      if (options.continuous) move(circle(to - direction), -(width * direction), 0); // we need to get the next in place

    } else {

      to = circle(to);
      animate(index * -width, to * -width, slideSpeed || speed);
      //no fallback for a circular continuous if the browser does not accept transitions
    }

    index = to;
    offloadFn(options.callback && options.callback(index, slides[index], target));
  }

  function move(index, dist, speed) {

    translate(index, dist, speed);
    slidePos[index] = dist;

  }

  function translate(index, dist, speed) {

    var slide = slides[index];
    var style = slide && slide.style;

    if (!style) return;

    style.webkitTransitionDuration =
    style.MozTransitionDuration =
    style.msTransitionDuration =
    style.OTransitionDuration =
    style.transitionDuration = speed + 'ms';

    style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
    style.msTransform =
    style.MozTransform =
    style.OTransform = 'translateX(' + dist + 'px)';
  }

  function animate(from, to, speed) {
    // if not an animation, just reposition
    if (!speed) {
      element.style.left = to + 'px';
      return;
    }
    var start = +new Date;
    var timer = setInterval(function() {
      var timeElap = +new Date - start;
      if (timeElap > speed) {
        element.style.left = to + 'px';
        if (delay) begin();
        options.transitionEnd && options.transitionEnd.call(event, index, slides[index], target);
        clearInterval(timer);
        return;
      }
      element.style.left = (( (to - from) * (Math.floor((timeElap / speed) * 100) / 100) ) + from) + 'px';
    }, 4);
  }

  // setup auto slideshow
  var delay = options.auto || 0;
  var interval;

  function begin() {
    interval = setTimeout(next, delay);
  }

  function stop() {
    delay = 0;
    clearTimeout(interval);
  }

  // setup initial vars
  var start = {};
  var delta = {};
  var isScrolling;

  // setup event capturing
  var events = {
    handleEvent: function(event) {
      switch (event.type) {
        case 'touchstart': this.start(event); break;
        case 'touchmove': this.move(event); break;
        case 'touchend': offloadFn(this.end(event)); break;
        case 'webkitTransitionEnd':
        case 'msTransitionEnd':
        case 'oTransitionEnd':
        case 'otransitionend':
        case 'transitionend': offloadFn(this.transitionEnd(event)); break;
        case 'resize': offloadFn(setup); break;
      }
      if (options.stopPropagation) event.stopPropagation();
    },
    start: function(event) {
      target=event.target;//yap save the event target
      var touches = event.touches[0];
      // measure start values
      start = {
        // get initial touch coords
        x: touches.pageX,
        y: touches.pageY,
        // store time to determine touch duration
        time: +new Date
      };
      // used for testing first move event
      isScrolling = undefined;
      // reset delta and end measurements
      delta = {};
      // attach touchmove and touchend listeners
      element.addEventListener('touchmove', this, false);
      element.addEventListener('touchend', this, false);
      if (options.swipeStart) options.swipeStart(target);

    },
    move: function(event) {
      // ensure swiping with one touch and not pinching
      if ( event.touches.length > 1 || event.scale && event.scale !== 1) return;
      if (options.disableScroll) event.preventDefault();

      var touches = event.touches[0];
      // measure change in x and y
      delta = {
        x: touches.pageX - start.x,
        y: touches.pageY - start.y
      }
      // determine if scrolling test has run - one time test
      if ( typeof isScrolling == 'undefined') {
        isScrolling = !!( isScrolling || Math.abs(delta.x) < Math.abs(delta.y) );
      }
      // if user is not trying to scroll vertically
      if (!isScrolling) {
        // prevent native scrolling
        event.preventDefault();
        // stop slideshow
        stop();
        // increase resistance if first or last slide
        if (options.continuous) { // we don't add resistance at the end
          translate(circle(index-1), delta.x + slidePos[circle(index-1)], 0);
          translate(index, delta.x + slidePos[index], 0);
          translate(circle(index+1), delta.x + slidePos[circle(index+1)], 0);
        } else {
          delta.x =
            delta.x /
              ( (!index && delta.x > 0               // if first slide and sliding left
                || index == slides.length - 1        // or if last slide and sliding right
                && delta.x < 0                       // and if sliding at all
              ) ?
              ( Math.abs(delta.x) / width + 1 )      // determine resistance level
              : 1 );                                 // no resistance if false

          // translate 1:1
          translate(index-1, delta.x + slidePos[index-1], 0);
          translate(index, delta.x + slidePos[index], 0);
          translate(index+1, delta.x + slidePos[index+1], 0);
        }
      } else {
        if (options.swipeEnd) options.swipeEnd(target);
      }
    },
    end: function(event) {
      // measure duration
      var duration = +new Date - start.time;
      // determine if slide attempt triggers next/prev slide
      var isValidSlide =
            Number(duration) < 250               // if slide duration is less than 250ms
            && Math.abs(delta.x) > 20            // and if slide amt is greater than 20px
            || Math.abs(delta.x) > width/2;      // or if slide amt is greater than half the width

      // determine if slide attempt is past start and end
      var isPastBounds =
            !index && delta.x > 0                            // if first slide and slide amt is greater than 0
            || index == slides.length - 1 && delta.x < 0;    // or if last slide and slide amt is less than 0

      if (options.continuous) isPastBounds = false;
      // determine direction of swipe (true:right, false:left)
      var direction = delta.x < 0;
      // if not scrolling vertically
      if (!isScrolling) {
        if (isValidSlide && !isPastBounds) {
          if (direction) {
            if (options.continuous) { // we need to get the next in this direction in place
              move(circle(index-1), -width, 0);
              move(circle(index+2), width, 0);
            } else {
              move(index-1, -width, 0);
            }
            move(index, slidePos[index]-width, speed);
            move(circle(index+1), slidePos[circle(index+1)]-width, speed);
            index = circle(index+1);
          } else {
            if (options.continuous) { // we need to get the next in this direction in place
              move(circle(index+1), width, 0);
              move(circle(index-2), -width, 0);
            } else {
              move(index+1, width, 0);
            }
            move(index, slidePos[index]+width, speed);
            move(circle(index-1), slidePos[circle(index-1)]+width, speed);
            index = circle(index-1);
          }
          options.callback && options.callback(index, slides[index], target);
        } else {
          if (options.continuous) {
            move(circle(index-1), -width, speed);
            move(index, 0, speed);
            move(circle(index+1), width, speed);
          } else {
            move(index-1, -width, speed);
            move(index, 0, speed);
            move(index+1, width, speed);
          }
        }
      }
      if (options.swipeEnd) options.swipeEnd(target);
      // kill touchmove and touchend event listeners until touchstart called again
      element.removeEventListener('touchmove', events, false)
      element.removeEventListener('touchend', events, false)
    },
    transitionEnd: function(event) {
      if (parseInt(event.target.getAttribute('data-index'), 10) == index) {
        if (delay) begin();
        options.transitionEnd && options.transitionEnd.call(event, index, slides[index],target);
      }
    }
  }
  // trigger setup
  setup();
  // start auto slideshow if applicable
  if (delay) begin();
  // add event listeners
  if (browser.addEventListener) {
    // set touchstart event on element
    if (browser.touch) element.addEventListener('touchstart', events, false);

    if (browser.transitions) {
      element.addEventListener('webkitTransitionEnd', events, false);
      element.addEventListener('msTransitionEnd', events, false);
      element.addEventListener('oTransitionEnd', events, false);
      element.addEventListener('otransitionend', events, false);
      element.addEventListener('transitionend', events, false);
    }
    // set resize event on window
    window.addEventListener('resize', events, false);
  } else {
    window.onresize = function () { setup() }; // to play nice with old IE
  }
  // expose the Swipe API
  return {
    setup: function() {
      setup();
    },
    slide: function(to, speed) {
      // cancel slideshow
      stop();
      slide(to, speed);
    },
    prev: function() {
      // cancel slideshow
      stop();
      prev();
    },
    next: function() {
      // cancel slideshow
      stop();
      next();
    },
    stop: function() {
      // cancel slideshow
      stop();
    },
    getPos: function() {
      // return current index position
      return index;
    },
    getNumSlides: function() {
      // return total number of slides
      return length;
    },
    kill: function() {
      // cancel slideshow
      stop();
      // reset element
      element.style.width = '';
      element.style.left = '';
      // reset slides
      var pos = slides.length;
      while(pos--) {
        var slide = slides[pos];
        slide.style.width = '';
        slide.style.left = '';
        if (browser.transitions) translate(pos, 0, 0);
      }
      // removed event listeners
      if (browser.addEventListener) {
        // remove current event listeners
        element.removeEventListener('touchstart', events, false);
        element.removeEventListener('webkitTransitionEnd', events, false);
        element.removeEventListener('msTransitionEnd', events, false);
        element.removeEventListener('oTransitionEnd', events, false);
        element.removeEventListener('otransitionend', events, false);
        element.removeEventListener('transitionend', events, false);
        window.removeEventListener('resize', events, false);
      }
      else {
        window.onresize = null;
      }

    }
  }
}
},{}],"c:\\ksana2015\\node_modules\\ksana2015-swipe3-ui\\swipecomponent.js":[function(require,module,exports){
//taken from https://github.com/jed/react-swipe
var Swipe=require("./swipe");
var styles = {
  container: {
    overflow: "hidden",
    visibility: "hidden",
    position: "relative"
  },
  wrapper: {
    overflow: "hidden",
    position: "relative"
  },
  child: {
    float: "left",
    width: "100%",
    position: "relative"
  }
}

module.exports = React.createClass({
  displayName: "Swipe",
  // https://github.com/thebird/Swipe#config-options
  propTypes: {
    startSlide      : React.PropTypes.number,
    speed           : React.PropTypes.number,
    auto            : React.PropTypes.number,
    continuous      : React.PropTypes.bool,
    disableScroll   : React.PropTypes.bool,
    stopPropagation : React.PropTypes.bool,
    callback        : React.PropTypes.func,
    transitionEnd   : React.PropTypes.func,
    swipeStart      : React.PropTypes.func, //by yap
    swipeEnd        : React.PropTypes.func
  },
  componentDidMount: function() {
    this.swipe = Swipe(this.getDOMNode(), this.props);
  },
  componentWillUnmount: function() {
    this.swipe.kill();
    delete this.swipe;
  },
  render: function() {
    var container = React.DOM.div(this.props,
      React.DOM.div({style: styles.wrapper},
        React.Children.map(this.props.children, function(child) {
          return React.addons.cloneWithProps(child, {style: styles.child})
        })
      )
    )
    return React.addons.cloneWithProps(container, {style: styles.container})
  }
});
},{"./swipe":"c:\\ksana2015\\node_modules\\ksana2015-swipe3-ui\\swipe.js"}],"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\checkbrowser.js":[function(require,module,exports){
/** @jsx React.DOM */
/*
convert to pure js
save -g reactify
*/
var E=React.createElement;

var hasksanagap=(typeof ksanagap!="undefined");
if (hasksanagap && (typeof console=="undefined" || typeof console.log=="undefined")) {
		window.console={log:ksanagap.log,error:ksanagap.error,debug:ksanagap.debug,warn:ksanagap.warn};
		console.log("install console output funciton");
}

var checkfs=function() {
	return (navigator && navigator.webkitPersistentStorage) || hasksanagap;
}
var featurechecks={
	"fs":checkfs
}
var checkbrowser = React.createClass({
	getInitialState:function() {

		var missingFeatures=this.getMissingFeatures();
		return {ready:false, missing:missingFeatures};
	},
	getMissingFeatures:function() {
		var feature=this.props.feature.split(",");
		var status=[];
		feature.map(function(f){
			var checker=featurechecks[f];
			if (checker) checker=checker();
			status.push([f,checker]);
		});
		return status.filter(function(f){return !f[1]});
	},
	downloadbrowser:function() {
		window.location="https://www.google.com/chrome/"
	},
	renderMissing:function() {
		var showMissing=function(m) {
			return E("div", null, m);
		}
		return (
		 E("div", {ref: "dialog1", className: "modal fade", "data-backdrop": "static"}, 
		    E("div", {className: "modal-dialog"}, 
		      E("div", {className: "modal-content"}, 
		        E("div", {className: "modal-header"}, 
		          E("button", {type: "button", className: "close", "data-dismiss": "modal", "aria-hidden": "true"}, "×"), 
		          E("h4", {className: "modal-title"}, "Browser Check")
		        ), 
		        E("div", {className: "modal-body"}, 
		          E("p", null, "Sorry but the following feature is missing"), 
		          this.state.missing.map(showMissing)
		        ), 
		        E("div", {className: "modal-footer"}, 
		          E("button", {onClick: this.downloadbrowser, type: "button", className: "btn btn-primary"}, "Download Google Chrome")
		        )
		      )
		    )
		  )
		 );
	},
	renderReady:function() {
		return E("span", null, "browser ok")
	},
	render:function(){
		return  (this.state.missing.length)?this.renderMissing():this.renderReady();
	},
	componentDidMount:function() {
		if (!this.state.missing.length) {
			this.props.onReady();
		} else {
			$(this.refs.dialog1.getDOMNode()).modal('show');
		}
	}
});

module.exports=checkbrowser;
},{}],"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\downloader.js":[function(require,module,exports){

var userCancel=false;
var files=[];
var totalDownloadByte=0;
var targetPath="";
var tempPath="";
var nfile=0;
var baseurl="";
var result="";
var downloading=false;
var startDownload=function(dbid,_baseurl,_files) { //return download id
	var fs     = require("fs");
	var path   = require("path");

	
	files=_files.split("\uffff");
	if (downloading) return false; //only one session
	userCancel=false;
	totalDownloadByte=0;
	nextFile();
	downloading=true;
	baseurl=_baseurl;
	if (baseurl[baseurl.length-1]!='/')baseurl+='/';
	targetPath=ksanagap.rootPath+dbid+'/';
	tempPath=ksanagap.rootPath+".tmp/";
	result="";
	return true;
}

var nextFile=function() {
	setTimeout(function(){
		if (nfile==files.length) {
			nfile++;
			endDownload();
		} else {
			downloadFile(nfile++);	
		}
	},100);
}

var downloadFile=function(nfile) {
	var url=baseurl+files[nfile];
	var tmpfilename=tempPath+files[nfile];
	var mkdirp = require("./mkdirp");
	var fs     = require("fs");
	var http   = require("http");

	mkdirp.sync(path.dirname(tmpfilename));
	var writeStream = fs.createWriteStream(tmpfilename);
	var datalength=0;
	var request = http.get(url, function(response) {
		response.on('data',function(chunk){
			writeStream.write(chunk);
			totalDownloadByte+=chunk.length;
			if (userCancel) {
				writeStream.end();
				setTimeout(function(){nextFile();},100);
			}
		});
		response.on("end",function() {
			writeStream.end();
			setTimeout(function(){nextFile();},100);
		});
	});
}

var cancelDownload=function() {
	userCancel=true;
	endDownload();
}
var verify=function() {
	return true;
}
var endDownload=function() {
	nfile=files.length+1;//stop
	result="cancelled";
	downloading=false;
	if (userCancel) return;
	var fs     = require("fs");
	var mkdirp = require("./mkdirp");

	for (var i=0;i<files.length;i++) {
		var targetfilename=targetPath+files[i];
		var tmpfilename   =tempPath+files[i];
		mkdirp.sync(path.dirname(targetfilename));
		fs.renameSync(tmpfilename,targetfilename);
	}
	if (verify()) {
		result="success";
	} else {
		result="error";
	}
}

var downloadedByte=function() {
	return totalDownloadByte;
}
var doneDownload=function() {
	if (nfile>files.length) return result;
	else return "";
}
var downloadingFile=function() {
	return nfile-1;
}

var downloader={startDownload:startDownload, downloadedByte:downloadedByte,
	downloadingFile:downloadingFile, cancelDownload:cancelDownload,doneDownload:doneDownload};
module.exports=downloader;
},{"./mkdirp":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\mkdirp.js","fs":false,"http":false,"path":false}],"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\fileinstaller.js":[function(require,module,exports){
/** @jsx React.DOM */

/* todo , optional kdb */

var HtmlFS=require("./htmlfs");
var html5fs=require("./html5fs");
var CheckBrowser=require("./checkbrowser");
var E=React.createElement;
  

var FileList = React.createClass({
	getInitialState:function() {
		return {downloading:false,progress:0};
	},
	updatable:function(f) {
        var classes="btn btn-warning";
        if (this.state.downloading) classes+=" disabled";
		if (f.hasUpdate) return   E("button", {className: classes, 
			"data-filename": f.filename, "data-url": f.url, 
	            onClick: this.download
	       }, "Update")
		else return null;
	},
	showLocal:function(f) {
        var classes="btn btn-danger";
        if (this.state.downloading) classes+=" disabled";
	  return E("tr", null, E("td", null, f.filename), 
	      E("td", null), 
	      E("td", {className: "pull-right"}, 
	      this.updatable(f), E("button", {className: classes, 
	               onClick: this.deleteFile, "data-filename": f.filename}, "Delete")
	        
	      )
	  )
	},  
	showRemote:function(f) { 
	  var classes="btn btn-warning";
	  if (this.state.downloading) classes+=" disabled";
	  return (E("tr", {"data-id": f.filename}, E("td", null, 
	      f.filename), 
	      E("td", null, f.desc), 
	      E("td", null, 
	      E("span", {"data-filename": f.filename, "data-url": f.url, 
	            className: classes, 
	            onClick: this.download}, "Download")
	      )
	  ));
	},
	showFile:function(f) {
	//	return <span data-id={f.filename}>{f.url}</span>
		return (f.ready)?this.showLocal(f):this.showRemote(f);
	},
	reloadDir:function() {
		this.props.action("reload");
	},
	download:function(e) {
		var url=e.target.dataset["url"];
		var filename=e.target.dataset["filename"];
		this.setState({downloading:true,progress:0,url:url});
		this.userbreak=false;
		html5fs.download(url,filename,function(){
			this.reloadDir();
			this.setState({downloading:false,progress:1});
			},function(progress,total){
				if (progress==0) {
					this.setState({message:"total "+total})
			 	}
			 	this.setState({progress:progress});
			 	//if user press abort return true
			 	return this.userbreak;
			}
		,this);
	},
	deleteFile:function( e) {
		var filename=e.target.attributes["data-filename"].value;
		this.props.action("delete",filename);
	},
	allFilesReady:function(e) {
		return this.props.files.every(function(f){ return f.ready});
	},
	dismiss:function() {
		$(this.refs.dialog1.getDOMNode()).modal('hide');
		this.props.action("dismiss");
	},
	abortdownload:function() {
		this.userbreak=true;
	},
	showProgress:function() {
	     if (this.state.downloading) {
	      var progress=Math.round(this.state.progress*100);
	      return (
	      	E("div", null, 
	      	"Downloading from ", this.state.url, 
	      E("div", {key: "progress", className: "progress col-md-8"}, 
	          E("div", {className: "progress-bar", role: "progressbar", 
	              "aria-valuenow": progress, "aria-valuemin": "0", 
	              "aria-valuemax": "100", style: {width: progress+"%"}}, 
	            progress, "%"
	          )
	        ), 
	        E("button", {onClick: this.abortdownload, 
	        	className: "btn btn-danger col-md-4"}, "Abort")
	        )
	        );
	      } else {
	      		if ( this.allFilesReady() ) {
	      			return E("button", {onClick: this.dismiss, className: "btn btn-success"}, "Ok")
	      		} else return null;
	      		
	      }
	},
	showUsage:function() {
		var percent=this.props.remainPercent;
           return (E("div", null, E("span", {className: "pull-left"}, "Usage:"), E("div", {className: "progress"}, 
		  E("div", {className: "progress-bar progress-bar-success progress-bar-striped", role: "progressbar", style: {width: percent+"%"}}, 
		    	percent+"%"
		  )
		)));
	},
	render:function() {
	  	return (
		E("div", {ref: "dialog1", className: "modal fade", "data-backdrop": "static"}, 
		    E("div", {className: "modal-dialog"}, 
		      E("div", {className: "modal-content"}, 
		        E("div", {className: "modal-header"}, 
		          E("h4", {className: "modal-title"}, "File Installer")
		        ), 
		        E("div", {className: "modal-body"}, 
		        	E("table", {className: "table"}, 
		        	E("tbody", null, 
		          	this.props.files.map(this.showFile)
		          	)
		          )
		        ), 
		        E("div", {className: "modal-footer"}, 
		        	this.showUsage(), 
		           this.showProgress()
		        )
		      )
		    )
		  )
		);
	},	
	componentDidMount:function() {
		$(this.refs.dialog1.getDOMNode()).modal('show');
	}
});
/*TODO kdb check version*/
var Filemanager = React.createClass({
	getInitialState:function() {
		var quota=this.getQuota();
		return {browserReady:false,noupdate:true,	requestQuota:quota,remain:0};
	},
	getQuota:function() {
		var q=this.props.quota||"128M";
		var unit=q[q.length-1];
		var times=1;
		if (unit=="M") times=1024*1024;
		else if (unit="K") times=1024;
		return parseInt(q) * times;
	},
	missingKdb:function() {
		if (ksanagap.platform!="chrome") return [];
		var missing=this.props.needed.filter(function(kdb){
			for (var i in html5fs.files) {
				if (html5fs.files[i][0]==kdb.filename) return false;
			}
			return true;
		},this);
		return missing;
	},
	getRemoteUrl:function(fn) {
		var f=this.props.needed.filter(function(f){return f.filename==fn});
		if (f.length ) return f[0].url;
	},
	genFileList:function(existing,missing){
		var out=[];
		for (var i in existing) {
			var url=this.getRemoteUrl(existing[i][0]);
			out.push({filename:existing[i][0], url :url, ready:true });
		}
		for (var i in missing) {
			out.push(missing[i]);
		}
		return out;
	},
	reload:function() {
		html5fs.readdir(function(files){
  			this.setState({files:this.genFileList(files,this.missingKdb())});
  		},this);
	 },
	deleteFile:function(fn) {
	  html5fs.rm(fn,function(){
	  	this.reload();
	  },this);
	},
	onQuoteOk:function(quota,usage) {
		if (ksanagap.platform!="chrome") {
			//console.log("onquoteok");
			this.setState({noupdate:true,missing:[],files:[],autoclose:true
				,quota:quota,remain:quota-usage,usage:usage});
			return;
		}
		//console.log("quote ok");
		var files=this.genFileList(html5fs.files,this.missingKdb());
		var that=this;
		that.checkIfUpdate(files,function(hasupdate) {
			var missing=this.missingKdb();
			var autoclose=this.props.autoclose;
			if (missing.length) autoclose=false;
			that.setState({autoclose:autoclose,
				quota:quota,usage:usage,files:files,
				missing:missing,
				noupdate:!hasupdate,
				remain:quota-usage});
		});
	},  
	onBrowserOk:function() {
	  this.totalDownloadSize();
	}, 
	dismiss:function() {
		this.props.onReady(this.state.usage,this.state.quota);
		setTimeout(function(){
			var modalin=$(".modal.in");
			if (modalin.modal) modalin.modal('hide');
		},500);
	}, 
	totalDownloadSize:function() {
		var files=this.missingKdb();
		var taskqueue=[],totalsize=0;
		for (var i=0;i<files.length;i++) {
			taskqueue.push(
				(function(idx){
					return (function(data){
						if (!(typeof data=='object' && data.__empty)) totalsize+=data;
						html5fs.getDownloadSize(files[idx].url,taskqueue.shift());
					});
				})(i)
			);
		}
		var that=this;
		taskqueue.push(function(data){	
			totalsize+=data;
			setTimeout(function(){that.setState({requireSpace:totalsize,browserReady:true})},0);
		});
		taskqueue.shift()({__empty:true});
	},
	checkIfUpdate:function(files,cb) {
		var taskqueue=[];
		for (var i=0;i<files.length;i++) {
			taskqueue.push(
				(function(idx){
					return (function(data){
						if (!(typeof data=='object' && data.__empty)) files[idx-1].hasUpdate=data;
						html5fs.checkUpdate(files[idx].url,files[idx].filename,taskqueue.shift());
					});
				})(i)
			);
		}
		var that=this;
		taskqueue.push(function(data){	
			files[files.length-1].hasUpdate=data;
			var hasupdate=files.some(function(f){return f.hasUpdate});
			if (cb) cb.apply(that,[hasupdate]);
		});
		taskqueue.shift()({__empty:true});
	},
	render:function(){
    		if (!this.state.browserReady) {   
      			return E(CheckBrowser, {feature: "fs", onReady: this.onBrowserOk})
    		} if (!this.state.quota || this.state.remain<this.state.requireSpace) {  
    			var quota=this.state.requestQuota;
    			if (this.state.usage+this.state.requireSpace>quota) {
    				quota=(this.state.usage+this.state.requireSpace)*1.5;
    			}
      			return E(HtmlFS, {quota: quota, autoclose: "true", onReady: this.onQuoteOk})
      		} else {
			if (!this.state.noupdate || this.missingKdb().length || !this.state.autoclose) {
				var remain=Math.round((this.state.usage/this.state.quota)*100);				
				return E(FileList, {action: this.action, files: this.state.files, remainPercent: remain})
			} else {
				setTimeout( this.dismiss ,0);
				return E("span", null, "Success");
			}
      		}
	},
	action:function() {
	  var args = Array.prototype.slice.call(arguments);
	  var type=args.shift();
	  var res=null, that=this;
	  if (type=="delete") {
	    this.deleteFile(args[0]);
	  }  else if (type=="reload") {
	  	this.reload();
	  } else if (type=="dismiss") {
	  	this.dismiss();
	  }
	}
});

module.exports=Filemanager;
},{"./checkbrowser":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\checkbrowser.js","./html5fs":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js","./htmlfs":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\htmlfs.js"}],"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js":[function(require,module,exports){
/* emulate filesystem on html5 browser */
var get_head=function(url,field,cb){
	var xhr = new XMLHttpRequest();
	xhr.open("HEAD", url, true);
	xhr.onreadystatechange = function() {
			if (this.readyState == this.DONE) {
				cb(xhr.getResponseHeader(field));
			} else {
				if (this.status!==200&&this.status!==206) {
					cb("");
				}
			} 
	};
	xhr.send();	
}
var get_date=function(url,cb) {
	get_head(url,"Last-Modified",function(value){
		cb(value);
	});
}
var get_size=function(url, cb) {
	get_head(url,"Content-Length",function(value){
		cb(parseInt(value));
	});
};
var checkUpdate=function(url,fn,cb) {
	if (!url) {
		cb(false);
		return;
	}
	get_date(url,function(d){
		API.fs.root.getFile(fn, {create: false, exclusive: false}, function(fileEntry) {
			fileEntry.getMetadata(function(metadata){
				var localDate=Date.parse(metadata.modificationTime);
				var urlDate=Date.parse(d);
				cb(urlDate>localDate);
			});
		},function(){
			cb(false);
		});
	});
}
var download=function(url,fn,cb,statuscb,context) {
	 var totalsize=0,batches=null,written=0;
	 var fileEntry=0, fileWriter=0;
	 var createBatches=function(size) {
		var bytes=1024*1024, out=[];
		var b=Math.floor(size / bytes);
		var last=size %bytes;
		for (var i=0;i<=b;i++) {
			out.push(i*bytes);
		}
		out.push(b*bytes+last);
		return out;
	 }
	 var finish=function() {
		 rm(fn,function(){
				fileEntry.moveTo(fileEntry.filesystem.root, fn,function(){
					setTimeout( cb.bind(context,false) , 0) ; 
				},function(e){
					console.log("failed",e)
				});
		 },this); 
	 };
		var tempfn="temp.kdb";
		var batch=function(b) {
		var abort=false;
		var xhr = new XMLHttpRequest();
		var requesturl=url+"?"+Math.random();
		xhr.open('get', requesturl, true);
		xhr.setRequestHeader('Range', 'bytes='+batches[b]+'-'+(batches[b+1]-1));
		xhr.responseType = 'blob';    
		xhr.addEventListener('load', function() {
			var blob=this.response;
			fileEntry.createWriter(function(fileWriter) {
				fileWriter.seek(fileWriter.length);
				fileWriter.write(blob);
				written+=blob.size;
				fileWriter.onwriteend = function(e) {
					if (statuscb) {
						abort=statuscb.apply(context,[ fileWriter.length / totalsize,totalsize ]);
						if (abort) setTimeout( cb.bind(context,false) , 0) ;
				 	}
					b++;
					if (!abort) {
						if (b<batches.length-1) setTimeout(batch.bind(context,b),0);
						else                    finish();
				 	}
			 	};
			}, console.error);
		},false);
		xhr.send();
	}

	get_size(url,function(size){
		totalsize=size;
		if (!size) {
			if (cb) cb.apply(context,[false]);
		} else {//ready to download
			rm(tempfn,function(){
				 batches=createBatches(size);
				 if (statuscb) statuscb.apply(context,[ 0, totalsize ]);
				 API.fs.root.getFile(tempfn, {create: 1, exclusive: false}, function(_fileEntry) {
							fileEntry=_fileEntry;
						batch(0);
				 });
			},this);
		}
	});
}

var readFile=function(filename,cb,context) {
	API.fs.root.getFile(filename, function(fileEntry) {
			var reader = new FileReader();
			reader.onloadend = function(e) {
					if (cb) cb.apply(cb,[this.result]);
				};            
	}, console.error);
}
var writeFile=function(filename,buf,cb,context){
	API.fs.root.getFile(filename, {create: true, exclusive: true}, function(fileEntry) {
			fileEntry.createWriter(function(fileWriter) {
				fileWriter.write(buf);
				fileWriter.onwriteend = function(e) {
					if (cb) cb.apply(cb,[buf.byteLength]);
				};            
			}, console.error);
	}, console.error);
}

var readdir=function(cb,context) {
	var dirReader = API.fs.root.createReader();
	var out=[],that=this;
	dirReader.readEntries(function(entries) {
		if (entries.length) {
			for (var i = 0, entry; entry = entries[i]; ++i) {
				if (entry.isFile) {
					out.push([entry.name,entry.toURL ? entry.toURL() : entry.toURI()]);
				}
			}
		}
		API.files=out;
		if (cb) cb.apply(context,[out]);
	}, function(){
		if (cb) cb.apply(context,[null]);
	});
}
var getFileURL=function(filename) {
	if (!API.files ) return null;
	var file= API.files.filter(function(f){return f[0]==filename});
	if (file.length) return file[0][1];
}
var rm=function(filename,cb,context) {
	var url=getFileURL(filename);
	if (url) rmURL(url,cb,context);
	else if (cb) cb.apply(context,[false]);
}

var rmURL=function(filename,cb,context) {
	webkitResolveLocalFileSystemURL(filename, function(fileEntry) {
		fileEntry.remove(function() {
			if (cb) cb.apply(context,[true]);
		}, console.error);
	},  function(e){
		if (cb) cb.apply(context,[false]);//no such file
	});
}
function errorHandler(e) {
	console.error('Error: ' +e.name+ " "+e.message);
}
var initfs=function(grantedBytes,cb,context) {
	webkitRequestFileSystem(PERSISTENT, grantedBytes,  function(fs) {
		API.fs=fs;
		API.quota=grantedBytes;
		readdir(function(){
			API.initialized=true;
			cb.apply(context,[grantedBytes,fs]);
		},context);
	}, errorHandler);
}
var init=function(quota,cb,context) {
	navigator.webkitPersistentStorage.requestQuota(quota, 
			function(grantedBytes) {
				initfs(grantedBytes,cb,context);
		}, errorHandler
	);
}
var queryQuota=function(cb,context) {
	var that=this;
	navigator.webkitPersistentStorage.queryUsageAndQuota( 
	 function(usage,quota){
			initfs(quota,function(){
				cb.apply(context,[usage,quota]);
			},context);
	});
}
var API={
	init:init
	,readdir:readdir
	,checkUpdate:checkUpdate
	,rm:rm
	,rmURL:rmURL
	,getFileURL:getFileURL
	,writeFile:writeFile
	,readFile:readFile
	,download:download
	,get_head:get_head
	,get_date:get_date
	,get_size:get_size
	,getDownloadSize:get_size
	,queryQuota:queryQuota
}
module.exports=API;
},{}],"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\htmlfs.js":[function(require,module,exports){
var html5fs=require("./html5fs");
var E=React.createElement;

var htmlfs = React.createClass({
	getInitialState:function() { 
		return {ready:false, quota:0,usage:0,Initialized:false,autoclose:this.props.autoclose};
	},
	initFilesystem:function() {
		var quota=this.props.quota||1024*1024*128; // default 128MB
		quota=parseInt(quota);
		html5fs.init(quota,function(q){
			this.dialog=false;
			$(this.refs.dialog1.getDOMNode()).modal('hide');
			this.setState({quota:q,autoclose:true});
		},this);
	},
	welcome:function() {
		return (
		E("div", {ref: "dialog1", className: "modal fade", id: "myModal", "data-backdrop": "static"}, 
		    E("div", {className: "modal-dialog"}, 
		      E("div", {className: "modal-content"}, 
		        E("div", {className: "modal-header"}, 
		          E("h4", {className: "modal-title"}, "Welcome")
		        ), 
		        E("div", {className: "modal-body"}, 
		          "Browser will ask for your confirmation."
		        ), 
		        E("div", {className: "modal-footer"}, 
		          E("button", {onClick: this.initFilesystem, type: "button", 
		            className: "btn btn-primary"}, "Initialize File System")
		        )
		      )
		    )
		  )
		 );
	},
	renderDefault:function(){
		var used=Math.floor(this.state.usage/this.state.quota *100);
		var more=function() {
			if (used>50) return E("button", {type: "button", className: "btn btn-primary"}, "Allocate More");
			else null;
		}
		return (
		E("div", {ref: "dialog1", className: "modal fade", id: "myModal", "data-backdrop": "static"}, 
		    E("div", {className: "modal-dialog"}, 
		      E("div", {className: "modal-content"}, 
		        E("div", {className: "modal-header"}, 
		          E("h4", {className: "modal-title"}, "Sandbox File System")
		        ), 
		        E("div", {className: "modal-body"}, 
		          E("div", {className: "progress"}, 
		            E("div", {className: "progress-bar", role: "progressbar", style: {width: used+"%"}}, 
		               used, "%"
		            )
		          ), 
		          E("span", null, this.state.quota, " total , ", this.state.usage, " in used")
		        ), 
		        E("div", {className: "modal-footer"}, 
		          E("button", {onClick: this.dismiss, type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "Close"), 
		          more()
		        )
		      )
		    )
		  )
		  );
	},
	dismiss:function() {
		var that=this;
		setTimeout(function(){
			that.props.onReady(that.state.quota,that.state.usage);	
		},0);
	},
	queryQuota:function() {
		if (ksanagap.platform=="chrome") {
			html5fs.queryQuota(function(usage,quota){
				this.setState({usage:usage,quota:quota,initialized:true});
			},this);			
		} else {
			this.setState({usage:333,quota:1000*1000*1024,initialized:true,autoclose:true});
		}
	},
	render:function() {
		var that=this;
		if (!this.state.quota || this.state.quota<this.props.quota) {
			if (this.state.initialized) {
				this.dialog=true;
				return this.welcome();	
			} else {
				return E("span", null, "checking quota");
			}			
		} else {
			if (!this.state.autoclose) {
				this.dialog=true;
				return this.renderDefault(); 
			}
			this.dismiss();
			this.dialog=false;
			return null;
		}
	},
	componentDidMount:function() {
		if (!this.state.quota) {
			this.queryQuota();

		};
	},
	componentDidUpdate:function() {
		if (this.dialog) $(this.refs.dialog1.getDOMNode()).modal('show');
	}
});

module.exports=htmlfs;
},{"./html5fs":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js"}],"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\index.js":[function(require,module,exports){
var ksana={"platform":"remote"};
if (typeof window!="undefined") {
	window.ksana=ksana;
	if (typeof ksanagap=="undefined") {
		window.ksanagap=require("./ksanagap"); //compatible layer with mobile
	}
}
if (typeof process !="undefined") {
	if (process.versions && process.versions["node-webkit"]) {
  		if (typeof nodeRequire!="undefined") ksana.require=nodeRequire;
  		ksana.platform="node-webkit";
  		window.ksanagap.platform="node-webkit";
		var ksanajs=require("fs").readFileSync("ksana.js","utf8").trim();
		ksana.js=JSON.parse(ksanajs.substring(14,ksanajs.length-1));
		window.kfs=require("./kfs");
  	}
} else if (typeof chrome!="undefined"){//} && chrome.fileSystem){
//	window.ksanagap=require("./ksanagap"); //compatible layer with mobile
	window.ksanagap.platform="chrome";
	window.kfs=require("./kfs_html5");
	require("./livereload")();
	ksana.platform="chrome";
} else {
	if (typeof ksanagap!="undefined" && typeof fs!="undefined") {//mobile
		var ksanajs=fs.readFileSync("ksana.js","utf8").trim(); //android extra \n at the end
		ksana.js=JSON.parse(ksanajs.substring(14,ksanajs.length-1));
		ksana.platform=ksanagap.platform;
		if (typeof ksanagap.android !="undefined") {
			ksana.platform="android";
		}
	}
}
var timer=null;
var boot=function(appId,cb) {
	ksana.appId=appId;
	if (ksanagap.platform=="chrome") { //need to wait for jsonp ksana.js
		timer=setInterval(function(){
			if (ksana.ready){
				clearInterval(timer);
				if (ksana.js && ksana.js.files && ksana.js.files.length) {
					require("./installkdb")(ksana.js,cb);
				} else {
					cb();		
				}
			}
		},300);
	} else {
		cb();
	}
}

module.exports={boot:boot
	,htmlfs:require("./htmlfs")
	,html5fs:require("./html5fs")
	,liveupdate:require("./liveupdate")
	,fileinstaller:require("./fileinstaller")
	,downloader:require("./downloader")
	,installkdb:require("./installkdb")
};
},{"./downloader":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\downloader.js","./fileinstaller":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\fileinstaller.js","./html5fs":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js","./htmlfs":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\htmlfs.js","./installkdb":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\installkdb.js","./kfs":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\kfs.js","./kfs_html5":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\kfs_html5.js","./ksanagap":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\ksanagap.js","./livereload":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\livereload.js","./liveupdate":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\liveupdate.js","fs":false}],"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\installkdb.js":[function(require,module,exports){
var Fileinstaller=require("./fileinstaller");

var getRequire_kdb=function() {
    var required=[];
    ksana.js.files.map(function(f){
      if (f.indexOf(".kdb")==f.length-4) {
        var slash=f.lastIndexOf("/");
        if (slash>-1) {
          var dbid=f.substring(slash+1,f.length-4);
          required.push({url:f,dbid:dbid,filename:dbid+".kdb"});
        } else {
          var dbid=f.substring(0,f.length-4);
          required.push({url:ksana.js.baseurl+f,dbid:dbid,filename:f});
        }        
      }
    });
    return required;
}
var callback=null;
var onReady=function() {
	callback();
}
var openFileinstaller=function(keep) {
	var require_kdb=getRequire_kdb().map(function(db){
	  return {
	    url:window.location.origin+window.location.pathname+db.dbid+".kdb",
	    dbdb:db.dbid,
	    filename:db.filename
	  }
	})
	return React.createElement(Fileinstaller, {quota: "512M", autoclose: !keep, needed: require_kdb, 
	                 onReady: onReady});
}
var installkdb=function(ksanajs,cb,context) {
	console.log(ksanajs.files);
	React.render(openFileinstaller(),document.getElementById("main"));
	callback=cb;
}
module.exports=installkdb;
},{"./fileinstaller":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\fileinstaller.js"}],"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\kfs.js":[function(require,module,exports){
//Simulate feature in ksanagap
/* 
  runs on node-webkit only
*/

var readDir=function(path) { //simulate Ksanagap function
	var fs=nodeRequire("fs");
	path=path||"..";
	var dirs=[];
	if (path[0]==".") {
		if (path==".") dirs=fs.readdirSync(".");
		else {
			dirs=fs.readdirSync("..");
		}
	} else {
		dirs=fs.readdirSync(path);
	}

	return dirs.join("\uffff");
}
var listApps=function() {
	var fs=nodeRequire("fs");
	var ksanajsfile=function(d) {return "../"+d+"/ksana.js"};
	var dirs=fs.readdirSync("..").filter(function(d){
				return fs.statSync("../"+d).isDirectory() && d[0]!="."
				   && fs.existsSync(ksanajsfile(d));
	});
	
	var out=dirs.map(function(d){
		var content=fs.readFileSync(ksanajsfile(d),"utf8");
  	content=content.replace("})","}");
  	content=content.replace("jsonp_handler(","");
		var obj= JSON.parse(content);
		obj.dbid=d;
		obj.path=d;
		return obj;
	})
	return JSON.stringify(out);
}



var kfs={readDir:readDir,listApps:listApps};

module.exports=kfs;
},{}],"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\kfs_html5.js":[function(require,module,exports){
var readDir=function(){
	return [];
}
var listApps=function(){
	return [];
}
module.exports={readDir:readDir,listApps:listApps};
},{}],"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\ksanagap.js":[function(require,module,exports){
var appname="installer";
var switchApp=function(path) {
	var fs=require("fs");
	path="../"+path;
	appname=path;
	document.location.href= path+"/index.html"; 
	process.chdir(path);
}
var downloader={};
var rootPath="";

var deleteApp=function(app) {
	console.error("not allow on PC, do it in File Explorer/ Finder");
}
var username=function() {
	return "";
}
var useremail=function() {
	return ""
}
var runtime_version=function() {
	return "1.4";
}

//copy from liveupdate
var jsonp=function(url,dbid,callback,context) {
  var script=document.getElementById("jsonp2");
  if (script) {
    script.parentNode.removeChild(script);
  }
  window.jsonp_handler=function(data) {
    if (typeof data=="object") {
      data.dbid=dbid;
      callback.apply(context,[data]);    
    }  
  }
  window.jsonp_error_handler=function() {
    console.error("url unreachable",url);
    callback.apply(context,[null]);
  }
  script=document.createElement('script');
  script.setAttribute('id', "jsonp2");
  script.setAttribute('onerror', "jsonp_error_handler()");
  url=url+'?'+(new Date().getTime());
  script.setAttribute('src', url);
  document.getElementsByTagName('head')[0].appendChild(script); 
}

var ksanagap={
	platform:"node-webkit",
	startDownload:downloader.startDownload,
	downloadedByte:downloader.downloadedByte,
	downloadingFile:downloader.downloadingFile,
	cancelDownload:downloader.cancelDownload,
	doneDownload:downloader.doneDownload,
	switchApp:switchApp,
	rootPath:rootPath,
	deleteApp: deleteApp,
	username:username, //not support on PC
	useremail:username,
	runtime_version:runtime_version,
	
}

if (typeof process!="undefined") {
	var ksanajs=require("fs").readFileSync("./ksana.js","utf8").trim();
	downloader=require("./downloader");
	console.log(ksanajs);
	//ksana.js=JSON.parse(ksanajs.substring(14,ksanajs.length-1));
	rootPath=process.cwd();
	rootPath=require("path").resolve(rootPath,"..").replace(/\\/g,"/")+'/';
	ksana.ready=true;
} else{
	var url=window.location.origin+window.location.pathname.replace("index.html","")+"ksana.js";
	jsonp(url,appname,function(data){
		ksana.js=data;
		ksana.ready=true;
	});
}
module.exports=ksanagap;
},{"./downloader":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\downloader.js","fs":false,"path":false}],"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\livereload.js":[function(require,module,exports){
var started=false;
var timer=null;
var bundledate=null;
var get_date=require("./html5fs").get_date;
var checkIfBundleUpdated=function() {
	get_date("bundle.js",function(date){
		if (bundledate &&bundledate!=date){
			location.reload();
		}
		bundledate=date;
	});
}
var livereload=function() {
	if (started) return;

	timer1=setInterval(function(){
		checkIfBundleUpdated();
	},2000);
	started=true;
}

module.exports=livereload;
},{"./html5fs":"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\html5fs.js"}],"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\liveupdate.js":[function(require,module,exports){

var jsonp=function(url,dbid,callback,context) {
  var script=document.getElementById("jsonp");
  if (script) {
    script.parentNode.removeChild(script);
  }
  window.jsonp_handler=function(data) {
    //console.log("receive from ksana.js",data);
    if (typeof data=="object") {
      if (typeof data.dbid=="undefined") {
        data.dbid=dbid;
      }
      callback.apply(context,[data]);
    }  
  }

  window.jsonp_error_handler=function() {
    console.error("url unreachable",url);
    callback.apply(context,[null]);
  }

  script=document.createElement('script');
  script.setAttribute('id', "jsonp");
  script.setAttribute('onerror', "jsonp_error_handler()");
  url=url+'?'+(new Date().getTime());
  script.setAttribute('src', url);
  document.getElementsByTagName('head')[0].appendChild(script); 
}
var runtime_version_ok=function(minruntime) {
  if (!minruntime) return true;//not mentioned.
  var min=parseFloat(minruntime);
  var runtime=parseFloat( ksanagap.runtime_version()||"1.0");
  if (min>runtime) return false;
  return true;
}

var needToUpdate=function(fromjson,tojson) {
  var needUpdates=[];
  for (var i=0;i<fromjson.length;i++) { 
    var to=tojson[i];
    var from=fromjson[i];
    var newfiles=[],newfilesizes=[],removed=[];
    
    if (!to) continue; //cannot reach host
    if (!runtime_version_ok(to.minruntime)) {
      console.warn("runtime too old, need "+to.minruntime);
      continue; 
    }
    if (!from.filedates) {
      console.warn("missing filedates in ksana.js of "+from.dbid);
      continue;
    }
    from.filedates.map(function(f,idx){
      var newidx=to.files.indexOf( from.files[idx]);
      if (newidx==-1) {
        //file removed in new version
        removed.push(from.files[idx]);
      } else {
        var fromdate=Date.parse(f);
        var todate=Date.parse(to.filedates[newidx]);
        if (fromdate<todate) {
          newfiles.push( to.files[newidx] );
          newfilesizes.push(to.filesizes[newidx]);
        }        
      }
    });
    if (newfiles.length) {
      from.newfiles=newfiles;
      from.newfilesizes=newfilesizes;
      from.removed=removed;
      needUpdates.push(from);
    }
  }
  return needUpdates;
}
var getUpdatables=function(apps,cb,context) {
  getRemoteJson(apps,function(jsons){
    var hasUpdates=needToUpdate(apps,jsons);
    cb.apply(context,[hasUpdates]);
  },context);
}
var getRemoteJson=function(apps,cb,context) {
  var taskqueue=[],output=[];
  var makecb=function(app){
    return function(data){
        if (!(data && typeof data =='object' && data.__empty)) output.push(data);
        if (!app.baseurl) {
          taskqueue.shift({__empty:true});
        } else {
          var url=app.baseurl+"/ksana.js";    
          console.log(url);
          jsonp( url ,app.dbid,taskqueue.shift(), context);           
        }
    };
  };
  apps.forEach(function(app){taskqueue.push(makecb(app))});

  taskqueue.push(function(data){
    output.push(data);
    cb.apply(context,[output]);
  });

  taskqueue.shift()({__empty:true}); //run the task
}
var humanFileSize=function(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if(bytes < thresh) return bytes + ' B';
    var units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(bytes >= thresh);
    return bytes.toFixed(1)+' '+units[u];
};

var start=function(ksanajs,cb,context){
  var files=ksanajs.newfiles||ksanajs.files;
  var baseurl=ksanajs.baseurl|| "http://127.0.0.1:8080/"+ksanajs.dbid+"/";
  var started=ksanagap.startDownload(ksanajs.dbid,baseurl,files.join("\uffff"));
  cb.apply(context,[started]);
}
var status=function(){
  var nfile=ksanagap.downloadingFile();
  var downloadedByte=ksanagap.downloadedByte();
  var done=ksanagap.doneDownload();
  return {nfile:nfile,downloadedByte:downloadedByte, done:done};
}

var cancel=function(){
  return ksanagap.cancelDownload();
}

var liveupdate={ humanFileSize: humanFileSize, 
  needToUpdate: needToUpdate , jsonp:jsonp, 
  getUpdatables:getUpdatables,
  start:start,
  cancel:cancel,
  status:status
  };
module.exports=liveupdate;
},{}],"c:\\ksana2015\\node_modules\\ksana2015-webruntime\\mkdirp.js":[function(require,module,exports){
function mkdirP (p, mode, f, made) {
     var path = nodeRequire('path');
     var fs = nodeRequire('fs');
	
    if (typeof mode === 'function' || mode === undefined) {
        f = mode;
        mode = 0x1FF & (~process.umask());
    }
    if (!made) made = null;

    var cb = f || function () {};
    if (typeof mode === 'string') mode = parseInt(mode, 8);
    p = path.resolve(p);

    fs.mkdir(p, mode, function (er) {
        if (!er) {
            made = made || p;
            return cb(null, made);
        }
        switch (er.code) {
            case 'ENOENT':
                mkdirP(path.dirname(p), mode, function (er, made) {
                    if (er) cb(er, made);
                    else mkdirP(p, mode, cb, made);
                });
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                fs.stat(p, function (er2, stat) {
                    // if the stat fails, then that's super weird.
                    // let the original error be the failure reason.
                    if (er2 || !stat.isDirectory()) cb(er, made)
                    else cb(null, made);
                });
                break;
        }
    });
}

mkdirP.sync = function sync (p, mode, made) {
    var path = nodeRequire('path');
    var fs = nodeRequire('fs');
    if (mode === undefined) {
        mode = 0x1FF & (~process.umask());
    }
    if (!made) made = null;

    if (typeof mode === 'string') mode = parseInt(mode, 8);
    p = path.resolve(p);

    try {
        fs.mkdirSync(p, mode);
        made = made || p;
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT' :
                made = sync(path.dirname(p), mode, made);
                sync(p, mode, made);
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                var stat;
                try {
                    stat = fs.statSync(p);
                }
                catch (err1) {
                    throw err0;
                }
                if (!stat.isDirectory()) throw err0;
                break;
        }
    }

    return made;
};

module.exports = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;

},{}]},{},["c:\\ksana2015\\cbeta2015\\index.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uXFwuLlxcVXNlcnNcXGNoZWFoc2hlblxcQXBwRGF0YVxcUm9hbWluZ1xcbnBtXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsImluZGV4LmpzIiwibWFpbi5qc3giLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYS1hbmFseXplclxcY29uZmlncy5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hLWFuYWx5emVyXFxpbmRleC5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hLWFuYWx5emVyXFx0b2tlbml6ZXJzLmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEtZGF0YWJhc2VcXGJzZWFyY2guanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYS1kYXRhYmFzZVxcaW5kZXguanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYS1kYXRhYmFzZVxca2RlLmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEtZGF0YWJhc2VcXGxpc3RrZGIuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYS1kYXRhYmFzZVxccGxhdGZvcm0uanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYS1qc29ucm9tXFxodG1sNXJlYWQuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYS1qc29ucm9tXFxpbmRleC5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hLWpzb25yb21cXGtkYi5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hLWpzb25yb21cXGtkYmZzLmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEtanNvbnJvbVxca2RiZnNfYW5kcm9pZC5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hLWpzb25yb21cXGtkYmZzX2lvcy5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hLXNlYXJjaFxcYm9vbHNlYXJjaC5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hLXNlYXJjaFxcZXhjZXJwdC5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hLXNlYXJjaFxcaW5kZXguanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYS1zZWFyY2hcXHBsaXN0LmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEtc2VhcmNoXFxzZWFyY2guanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYTIwMTUtc3dpcGUzLXVpXFxpbmRleC5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hMjAxNS1zd2lwZTMtdWlcXG1haW4uanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYTIwMTUtc3dpcGUzLXVpXFxyZXN1bHRsaXN0LmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXN3aXBlMy11aVxcc2hvd3RleHQuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYTIwMTUtc3dpcGUzLXVpXFxzdGFja3RvY2NvbXBvbmVudC5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hMjAxNS1zd2lwZTMtdWlcXHN3aXBlLmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXN3aXBlMy11aVxcc3dpcGVjb21wb25lbnQuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYTIwMTUtd2VicnVudGltZVxcY2hlY2ticm93c2VyLmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXdlYnJ1bnRpbWVcXGRvd25sb2FkZXIuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYTIwMTUtd2VicnVudGltZVxcZmlsZWluc3RhbGxlci5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hMjAxNS13ZWJydW50aW1lXFxodG1sNWZzLmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXdlYnJ1bnRpbWVcXGh0bWxmcy5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hMjAxNS13ZWJydW50aW1lXFxpbmRleC5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hMjAxNS13ZWJydW50aW1lXFxpbnN0YWxsa2RiLmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXdlYnJ1bnRpbWVcXGtmcy5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hMjAxNS13ZWJydW50aW1lXFxrZnNfaHRtbDUuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYTIwMTUtd2VicnVudGltZVxca3NhbmFnYXAuanMiLCIuLlxcbm9kZV9tb2R1bGVzXFxrc2FuYTIwMTUtd2VicnVudGltZVxcbGl2ZXJlbG9hZC5qcyIsIi4uXFxub2RlX21vZHVsZXNcXGtzYW5hMjAxNS13ZWJydW50aW1lXFxsaXZldXBkYXRlLmpzIiwiLi5cXG5vZGVfbW9kdWxlc1xca3NhbmEyMDE1LXdlYnJ1bnRpbWVcXG1rZGlycC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4YUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHJ1bnRpbWU9cmVxdWlyZShcImtzYW5hMjAxNS13ZWJydW50aW1lXCIpO1xyXG5ydW50aW1lLmJvb3QoXCJjYmV0YTIwMTRcIixmdW5jdGlvbigpe1xyXG5cdHZhciBNYWluPVJlYWN0LmNyZWF0ZUVsZW1lbnQocmVxdWlyZShcIi4vbWFpbi5qc3hcIikpO1xyXG5cdGtzYW5hLm1haW5Db21wb25lbnQ9UmVhY3QucmVuZGVyKE1haW4sZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYWluXCIpKTtcclxufSk7IiwiXHJcbnZhciB0b2ZpbmRFeHRyYT1mdW5jdGlvbihoaXN0b3J5dG9maW5kKSB7XHJcbiAgdmFyIHJlcz1bXTtcclxuICBoaXN0b3J5dG9maW5kLm1hcChmdW5jdGlvbih0Zil7XHJcbiAgXHRyZXMudW5zaGlmdChSZWFjdC5jcmVhdGVFbGVtZW50KFwiYVwiLCB7aHJlZjogXCIjXCIsIG9uQ2xpY2s6IHRoaXMuZG9zZWFyY2h9LCB0ZikpO1xyXG4gIFx0cmVzLnVuc2hpZnQoUmVhY3QuY3JlYXRlRWxlbWVudChcInNwYW5cIiwgbnVsbCwgXCIgXCIpKTtcclxuICB9LHRoaXMpO1xyXG4gIHJldHVybiByZXM7XHJcbn1cclxuIFxyXG52YXIgTWFpbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogXCJNYWluXCIsXHJcbiAgbWl4aW5zOltyZXF1aXJlKFwia3NhbmEyMDE1LXN3aXBlMy11aVwiKS5tYWluXSxcclxuICB0b2NUYWc6XCJtdWx1XCIsICBcclxuICBkZWZhdWx0VG9maW5kOlwi55m86I+p5o+Q5b+DXCIsXHJcbiAgdG9maW5kRXh0cmE6dG9maW5kRXh0cmEsXHJcbiAgZGJpZDpcImNiZXRhXCIsXHJcbiAgZGljdGlvbmFyaWVzOltcImRpbmdmdWJhb19kaWN0XCJdXHJcbn0pO1xyXG5tb2R1bGUuZXhwb3J0cz1NYWluOyIsInZhciB0b2tlbml6ZXJzPXJlcXVpcmUoJy4vdG9rZW5pemVycycpO1xyXG52YXIgbm9ybWFsaXplVGJsPW51bGw7XHJcbnZhciBzZXROb3JtYWxpemVUYWJsZT1mdW5jdGlvbih0Ymwsb2JqKSB7XHJcblx0aWYgKCFvYmopIHtcclxuXHRcdG9iaj17fTtcclxuXHRcdGZvciAodmFyIGk9MDtpPHRibC5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdHZhciBhcnI9dGJsW2ldLnNwbGl0KFwiPVwiKTtcclxuXHRcdFx0b2JqW2FyclswXV09YXJyWzFdO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRub3JtYWxpemVUYmw9b2JqO1xyXG5cdHJldHVybiBvYmo7XHJcbn1cclxudmFyIG5vcm1hbGl6ZTE9ZnVuY3Rpb24odG9rZW4pIHtcclxuXHRpZiAoIXRva2VuKSByZXR1cm4gXCJcIjtcclxuXHR0b2tlbj10b2tlbi5yZXBsYWNlKC9bIFxcblxcLizvvIzjgILvvIHvvI7jgIzjgI3vvJrvvJvjgIFdL2csJycpLnRyaW0oKTtcclxuXHRpZiAoIW5vcm1hbGl6ZVRibCkgcmV0dXJuIHRva2VuO1xyXG5cdGlmICh0b2tlbi5sZW5ndGg9PTEpIHtcclxuXHRcdHJldHVybiBub3JtYWxpemVUYmxbdG9rZW5dIHx8IHRva2VuO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRmb3IgKHZhciBpPTA7aTx0b2tlbi5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdHRva2VuW2ldPW5vcm1hbGl6ZVRibFt0b2tlbltpXV0gfHwgdG9rZW5baV07XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdG9rZW47XHJcblx0fVxyXG59XHJcbnZhciBpc1NraXAxPWZ1bmN0aW9uKHRva2VuKSB7XHJcblx0dmFyIHQ9dG9rZW4udHJpbSgpO1xyXG5cdHJldHVybiAodD09XCJcIiB8fCB0PT1cIuOAgFwiIHx8IHQ9PVwi4oC7XCIgfHwgdD09XCJcXG5cIik7XHJcbn1cclxudmFyIG5vcm1hbGl6ZV90aWJldGFuPWZ1bmN0aW9uKHRva2VuKSB7XHJcblx0cmV0dXJuIHRva2VuLnJlcGxhY2UoL1vgvI3gvIsgXS9nLCcnKS50cmltKCk7XHJcbn1cclxuXHJcbnZhciBpc1NraXBfdGliZXRhbj1mdW5jdGlvbih0b2tlbikge1xyXG5cdHZhciB0PXRva2VuLnRyaW0oKTtcclxuXHRyZXR1cm4gKHQ9PVwiXCIgfHwgdD09XCLjgIBcIiB8fCAgdD09XCJcXG5cIik7XHRcclxufVxyXG52YXIgc2ltcGxlMT17XHJcblx0ZnVuYzp7XHJcblx0XHR0b2tlbml6ZTp0b2tlbml6ZXJzLnNpbXBsZVxyXG5cdFx0LHNldE5vcm1hbGl6ZVRhYmxlOnNldE5vcm1hbGl6ZVRhYmxlXHJcblx0XHQsbm9ybWFsaXplOiBub3JtYWxpemUxXHJcblx0XHQsaXNTa2lwOlx0aXNTa2lwMVxyXG5cdH1cclxuXHRcclxufVxyXG52YXIgdGliZXRhbjE9e1xyXG5cdGZ1bmM6e1xyXG5cdFx0dG9rZW5pemU6dG9rZW5pemVycy50aWJldGFuXHJcblx0XHQsc2V0Tm9ybWFsaXplVGFibGU6c2V0Tm9ybWFsaXplVGFibGVcclxuXHRcdCxub3JtYWxpemU6bm9ybWFsaXplX3RpYmV0YW5cclxuXHRcdCxpc1NraXA6aXNTa2lwX3RpYmV0YW5cclxuXHR9XHJcbn1cclxubW9kdWxlLmV4cG9ydHM9e1wic2ltcGxlMVwiOnNpbXBsZTEsXCJ0aWJldGFuMVwiOnRpYmV0YW4xfSIsIi8qIFxyXG4gIGN1c3RvbSBmdW5jIGZvciBidWlsZGluZyBhbmQgc2VhcmNoaW5nIHlkYlxyXG5cclxuICBrZWVwIGFsbCB2ZXJzaW9uXHJcbiAgXHJcbiAgZ2V0QVBJKHZlcnNpb24pOyAvL3JldHVybiBoYXNoIG9mIGZ1bmN0aW9ucyAsIGlmIHZlciBpcyBvbWl0ICwgcmV0dXJuIGxhc3Rlc3RcclxuXHRcclxuICBwb3N0aW5nczJUcmVlICAgICAgLy8gaWYgdmVyc2lvbiBpcyBub3Qgc3VwcGx5LCBnZXQgbGFzdGVzdFxyXG4gIHRva2VuaXplKHRleHQsYXBpKSAvLyBjb252ZXJ0IGEgc3RyaW5nIGludG8gdG9rZW5zKGRlcGVuZHMgb24gb3RoZXIgYXBpKVxyXG4gIG5vcm1hbGl6ZVRva2VuICAgICAvLyBzdGVtbWluZyBhbmQgZXRjXHJcbiAgaXNTcGFjZUNoYXIgICAgICAgIC8vIG5vdCBhIHNlYXJjaGFibGUgdG9rZW5cclxuICBpc1NraXBDaGFyICAgICAgICAgLy8gMCB2cG9zXHJcblxyXG4gIGZvciBjbGllbnQgYW5kIHNlcnZlciBzaWRlXHJcbiAgXHJcbiovXHJcbnZhciBjb25maWdzPXJlcXVpcmUoXCIuL2NvbmZpZ3NcIik7XHJcbnZhciBjb25maWdfc2ltcGxlPVwic2ltcGxlMVwiO1xyXG52YXIgb3B0aW1pemU9ZnVuY3Rpb24oanNvbixjb25maWcpIHtcclxuXHRjb25maWc9Y29uZmlnfHxjb25maWdfc2ltcGxlO1xyXG5cdHJldHVybiBqc29uO1xyXG59XHJcblxyXG52YXIgZ2V0QVBJPWZ1bmN0aW9uKGNvbmZpZykge1xyXG5cdGNvbmZpZz1jb25maWd8fGNvbmZpZ19zaW1wbGU7XHJcblx0dmFyIGZ1bmM9Y29uZmlnc1tjb25maWddLmZ1bmM7XHJcblx0ZnVuYy5vcHRpbWl6ZT1vcHRpbWl6ZTtcclxuXHRpZiAoY29uZmlnPT1cInNpbXBsZTFcIikge1xyXG5cdFx0Ly9hZGQgY29tbW9uIGN1c3RvbSBmdW5jdGlvbiBoZXJlXHJcblx0fSBlbHNlIGlmIChjb25maWc9PVwidGliZXRhbjFcIikge1xyXG5cclxuXHR9IGVsc2UgdGhyb3cgXCJjb25maWcgXCIrY29uZmlnICtcIm5vdCBzdXBwb3J0ZWRcIjtcclxuXHJcblx0cmV0dXJuIGZ1bmM7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzPXtnZXRBUEk6Z2V0QVBJfTsiLCJ2YXIgdGliZXRhbiA9ZnVuY3Rpb24ocykge1xyXG5cdC8vY29udGludW91cyB0c2hlZyBncm91cGVkIGludG8gc2FtZSB0b2tlblxyXG5cdC8vc2hhZCBhbmQgc3BhY2UgZ3JvdXBlZCBpbnRvIHNhbWUgdG9rZW5cclxuXHR2YXIgb2Zmc2V0PTA7XHJcblx0dmFyIHRva2Vucz1bXSxvZmZzZXRzPVtdO1xyXG5cdHM9cy5yZXBsYWNlKC9cXHJcXG4vZywnXFxuJykucmVwbGFjZSgvXFxyL2csJ1xcbicpO1xyXG5cdHZhciBhcnI9cy5zcGxpdCgnXFxuJyk7XHJcblxyXG5cdGZvciAodmFyIGk9MDtpPGFyci5sZW5ndGg7aSsrKSB7XHJcblx0XHR2YXIgbGFzdD0wO1xyXG5cdFx0dmFyIHN0cj1hcnJbaV07XHJcblx0XHRzdHIucmVwbGFjZSgvW+C8jeC8iyBdKy9nLGZ1bmN0aW9uKG0sbTEpe1xyXG5cdFx0XHR0b2tlbnMucHVzaChzdHIuc3Vic3RyaW5nKGxhc3QsbTEpK20pO1xyXG5cdFx0XHRvZmZzZXRzLnB1c2gob2Zmc2V0K2xhc3QpO1xyXG5cdFx0XHRsYXN0PW0xK20ubGVuZ3RoO1xyXG5cdFx0fSk7XHJcblx0XHRpZiAobGFzdDxzdHIubGVuZ3RoKSB7XHJcblx0XHRcdHRva2Vucy5wdXNoKHN0ci5zdWJzdHJpbmcobGFzdCkpO1xyXG5cdFx0XHRvZmZzZXRzLnB1c2gobGFzdCk7XHJcblx0XHR9XHJcblx0XHRpZiAoaT09PWFyci5sZW5ndGgtMSkgYnJlYWs7XHJcblx0XHR0b2tlbnMucHVzaCgnXFxuJyk7XHJcblx0XHRvZmZzZXRzLnB1c2gob2Zmc2V0K2xhc3QpO1xyXG5cdFx0b2Zmc2V0Kz1zdHIubGVuZ3RoKzE7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4ge3Rva2Vuczp0b2tlbnMsb2Zmc2V0czpvZmZzZXRzfTtcclxufTtcclxudmFyIGlzU3BhY2U9ZnVuY3Rpb24oYykge1xyXG5cdHJldHVybiAoYz09XCIgXCIpIDsvL3x8IChjPT1cIixcIikgfHwgKGM9PVwiLlwiKTtcclxufVxyXG52YXIgaXNDSksgPWZ1bmN0aW9uKGMpIHtyZXR1cm4gKChjPj0weDMwMDAgJiYgYzw9MHg5RkZGKSBcclxufHwgKGM+PTB4RDgwMCAmJiBjPDB4REMwMCkgfHwgKGM+PTB4RkYwMCkgKSA7fVxyXG52YXIgc2ltcGxlMT1mdW5jdGlvbihzKSB7XHJcblx0dmFyIG9mZnNldD0wO1xyXG5cdHZhciB0b2tlbnM9W10sb2Zmc2V0cz1bXTtcclxuXHRzPXMucmVwbGFjZSgvXFxyXFxuL2csJ1xcbicpLnJlcGxhY2UoL1xcci9nLCdcXG4nKTtcclxuXHRhcnI9cy5zcGxpdCgnXFxuJyk7XHJcblxyXG5cdHZhciBwdXNodG9rZW49ZnVuY3Rpb24odCxvZmYpIHtcclxuXHRcdHZhciBpPTA7XHJcblx0XHRpZiAodC5jaGFyQ29kZUF0KDApPjI1NSkge1xyXG5cdFx0XHR3aGlsZSAoaTx0Lmxlbmd0aCkge1xyXG5cdFx0XHRcdHZhciBjPXQuY2hhckNvZGVBdChpKTtcclxuXHRcdFx0XHRvZmZzZXRzLnB1c2gob2ZmK2kpO1xyXG5cdFx0XHRcdHRva2Vucy5wdXNoKHRbaV0pO1xyXG5cdFx0XHRcdGlmIChjPj0weEQ4MDAgJiYgYzw9MHhERkZGKSB7XHJcblx0XHRcdFx0XHR0b2tlbnNbdG9rZW5zLmxlbmd0aC0xXSs9dFtpXTsgLy9leHRlbnNpb24gQixDLERcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aSsrO1xyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0b2tlbnMucHVzaCh0KTtcclxuXHRcdFx0b2Zmc2V0cy5wdXNoKG9mZik7XHRcclxuXHRcdH1cclxuXHR9XHJcblx0Zm9yICh2YXIgaT0wO2k8YXJyLmxlbmd0aDtpKyspIHtcclxuXHRcdHZhciBsYXN0PTAsc3A9XCJcIjtcclxuXHRcdHN0cj1hcnJbaV07XHJcblx0XHRzdHIucmVwbGFjZSgvW18wLTlBLVphLXpdKy9nLGZ1bmN0aW9uKG0sbTEpe1xyXG5cdFx0XHR3aGlsZSAoaXNTcGFjZShzcD1zdHJbbGFzdF0pICYmIGxhc3Q8c3RyLmxlbmd0aCkge1xyXG5cdFx0XHRcdHRva2Vuc1t0b2tlbnMubGVuZ3RoLTFdKz1zcDtcclxuXHRcdFx0XHRsYXN0Kys7XHJcblx0XHRcdH1cclxuXHRcdFx0cHVzaHRva2VuKHN0ci5zdWJzdHJpbmcobGFzdCxtMSkrbSAsIG9mZnNldCtsYXN0KTtcclxuXHRcdFx0b2Zmc2V0cy5wdXNoKG9mZnNldCtsYXN0KTtcclxuXHRcdFx0bGFzdD1tMSttLmxlbmd0aDtcclxuXHRcdH0pO1xyXG5cclxuXHRcdGlmIChsYXN0PHN0ci5sZW5ndGgpIHtcclxuXHRcdFx0d2hpbGUgKGlzU3BhY2Uoc3A9c3RyW2xhc3RdKSAmJiBsYXN0PHN0ci5sZW5ndGgpIHtcclxuXHRcdFx0XHR0b2tlbnNbdG9rZW5zLmxlbmd0aC0xXSs9c3A7XHJcblx0XHRcdFx0bGFzdCsrO1xyXG5cdFx0XHR9XHJcblx0XHRcdHB1c2h0b2tlbihzdHIuc3Vic3RyaW5nKGxhc3QpLCBvZmZzZXQrbGFzdCk7XHJcblx0XHRcdFxyXG5cdFx0fVx0XHRcclxuXHRcdG9mZnNldHMucHVzaChvZmZzZXQrbGFzdCk7XHJcblx0XHRvZmZzZXQrPXN0ci5sZW5ndGgrMTtcclxuXHRcdGlmIChpPT09YXJyLmxlbmd0aC0xKSBicmVhaztcclxuXHRcdHRva2Vucy5wdXNoKCdcXG4nKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiB7dG9rZW5zOnRva2VucyxvZmZzZXRzOm9mZnNldHN9O1xyXG5cclxufTtcclxuXHJcbnZhciBzaW1wbGU9ZnVuY3Rpb24ocykge1xyXG5cdHZhciB0b2tlbj0nJztcclxuXHR2YXIgdG9rZW5zPVtdLCBvZmZzZXRzPVtdIDtcclxuXHR2YXIgaT0wOyBcclxuXHR2YXIgbGFzdHNwYWNlPWZhbHNlO1xyXG5cdHZhciBhZGR0b2tlbj1mdW5jdGlvbigpIHtcclxuXHRcdGlmICghdG9rZW4pIHJldHVybjtcclxuXHRcdHRva2Vucy5wdXNoKHRva2VuKTtcclxuXHRcdG9mZnNldHMucHVzaChpKTtcclxuXHRcdHRva2VuPScnO1xyXG5cdH1cclxuXHR3aGlsZSAoaTxzLmxlbmd0aCkge1xyXG5cdFx0dmFyIGM9cy5jaGFyQXQoaSk7XHJcblx0XHR2YXIgY29kZT1zLmNoYXJDb2RlQXQoaSk7XHJcblx0XHRpZiAoaXNDSksoY29kZSkpIHtcclxuXHRcdFx0YWRkdG9rZW4oKTtcclxuXHRcdFx0dG9rZW49YztcclxuXHRcdFx0aWYgKGNvZGU+PTB4RDgwMCAmJiBjb2RlPDB4REMwMCkgeyAvL2hpZ2ggc29ycmFnYXRlXHJcblx0XHRcdFx0dG9rZW4rPXMuY2hhckF0KGkrMSk7aSsrO1xyXG5cdFx0XHR9XHJcblx0XHRcdGFkZHRva2VuKCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRpZiAoYz09JyYnIHx8IGM9PSc8JyB8fCBjPT0nPycgfHwgYz09XCIsXCIgfHwgYz09XCIuXCJcclxuXHRcdFx0fHwgYz09J3wnIHx8IGM9PSd+JyB8fCBjPT0nYCcgfHwgYz09JzsnIFxyXG5cdFx0XHR8fCBjPT0nPicgfHwgYz09JzonIFxyXG5cdFx0XHR8fCBjPT0nPScgfHwgYz09J0AnICB8fCBjPT1cIi1cIiBcclxuXHRcdFx0fHwgYz09J10nIHx8IGM9PSd9JyAgfHwgYz09XCIpXCIgXHJcblx0XHRcdC8vfHwgYz09J3snIHx8IGM9PSd9J3x8IGM9PSdbJyB8fCBjPT0nXScgfHwgYz09JygnIHx8IGM9PScpJ1xyXG5cdFx0XHR8fCBjb2RlPT0weGYwYiB8fCBjb2RlPT0weGYwZCAvLyB0aWJldGFuIHNwYWNlXHJcblx0XHRcdHx8IChjb2RlPj0weDIwMDAgJiYgY29kZTw9MHgyMDZmKSkge1xyXG5cdFx0XHRcdGFkZHRva2VuKCk7XHJcblx0XHRcdFx0aWYgKGM9PScmJyB8fCBjPT0nPCcpeyAvLyB8fCBjPT0neyd8fCBjPT0nKCd8fCBjPT0nWycpIHtcclxuXHRcdFx0XHRcdHZhciBlbmRjaGFyPSc+JztcclxuXHRcdFx0XHRcdGlmIChjPT0nJicpIGVuZGNoYXI9JzsnXHJcblx0XHRcdFx0XHQvL2Vsc2UgaWYgKGM9PSd7JykgZW5kY2hhcj0nfSc7XHJcblx0XHRcdFx0XHQvL2Vsc2UgaWYgKGM9PSdbJykgZW5kY2hhcj0nXSc7XHJcblx0XHRcdFx0XHQvL2Vsc2UgaWYgKGM9PScoJykgZW5kY2hhcj0nKSc7XHJcblxyXG5cdFx0XHRcdFx0d2hpbGUgKGk8cy5sZW5ndGggJiYgcy5jaGFyQXQoaSkhPWVuZGNoYXIpIHtcclxuXHRcdFx0XHRcdFx0dG9rZW4rPXMuY2hhckF0KGkpO1xyXG5cdFx0XHRcdFx0XHRpKys7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR0b2tlbis9ZW5kY2hhcjtcclxuXHRcdFx0XHRcdGFkZHRva2VuKCk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHRva2VuPWM7XHJcblx0XHRcdFx0XHRhZGR0b2tlbigpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHR0b2tlbj0nJztcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRpZiAoYz09XCIgXCIpIHtcclxuXHRcdFx0XHRcdHRva2VuKz1jO1xyXG5cdFx0XHRcdFx0bGFzdHNwYWNlPXRydWU7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGlmIChsYXN0c3BhY2UpIGFkZHRva2VuKCk7XHJcblx0XHRcdFx0XHRsYXN0c3BhY2U9ZmFsc2U7XHJcblx0XHRcdFx0XHR0b2tlbis9YztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGkrKztcclxuXHR9XHJcblx0YWRkdG9rZW4oKTtcclxuXHRyZXR1cm4ge3Rva2Vuczp0b2tlbnMsb2Zmc2V0czpvZmZzZXRzfTtcclxufVxyXG5tb2R1bGUuZXhwb3J0cz17c2ltcGxlOnNpbXBsZSx0aWJldGFuOnRpYmV0YW59OyIsInZhciBpbmRleE9mU29ydGVkID0gZnVuY3Rpb24gKGFycmF5LCBvYmosIG5lYXIpIHsgXHJcbiAgdmFyIGxvdyA9IDAsXHJcbiAgaGlnaCA9IGFycmF5Lmxlbmd0aDtcclxuICB3aGlsZSAobG93IDwgaGlnaCkge1xyXG4gICAgdmFyIG1pZCA9IChsb3cgKyBoaWdoKSA+PiAxO1xyXG4gICAgaWYgKGFycmF5W21pZF09PW9iaikgcmV0dXJuIG1pZDtcclxuICAgIGFycmF5W21pZF0gPCBvYmogPyBsb3cgPSBtaWQgKyAxIDogaGlnaCA9IG1pZDtcclxuICB9XHJcbiAgaWYgKG5lYXIpIHJldHVybiBsb3c7XHJcbiAgZWxzZSBpZiAoYXJyYXlbbG93XT09b2JqKSByZXR1cm4gbG93O2Vsc2UgcmV0dXJuIC0xO1xyXG59O1xyXG52YXIgaW5kZXhPZlNvcnRlZF9zdHIgPSBmdW5jdGlvbiAoYXJyYXksIG9iaiwgbmVhcikgeyBcclxuICB2YXIgbG93ID0gMCxcclxuICBoaWdoID0gYXJyYXkubGVuZ3RoO1xyXG4gIHdoaWxlIChsb3cgPCBoaWdoKSB7XHJcbiAgICB2YXIgbWlkID0gKGxvdyArIGhpZ2gpID4+IDE7XHJcbiAgICBpZiAoYXJyYXlbbWlkXT09b2JqKSByZXR1cm4gbWlkO1xyXG4gICAgKGFycmF5W21pZF0ubG9jYWxlQ29tcGFyZShvYmopPDApID8gbG93ID0gbWlkICsgMSA6IGhpZ2ggPSBtaWQ7XHJcbiAgfVxyXG4gIGlmIChuZWFyKSByZXR1cm4gbG93O1xyXG4gIGVsc2UgaWYgKGFycmF5W2xvd109PW9iaikgcmV0dXJuIGxvdztlbHNlIHJldHVybiAtMTtcclxufTtcclxuXHJcblxyXG52YXIgYnNlYXJjaD1mdW5jdGlvbihhcnJheSx2YWx1ZSxuZWFyKSB7XHJcblx0dmFyIGZ1bmM9aW5kZXhPZlNvcnRlZDtcclxuXHRpZiAodHlwZW9mIGFycmF5WzBdPT1cInN0cmluZ1wiKSBmdW5jPWluZGV4T2ZTb3J0ZWRfc3RyO1xyXG5cdHJldHVybiBmdW5jKGFycmF5LHZhbHVlLG5lYXIpO1xyXG59XHJcbnZhciBic2VhcmNoTmVhcj1mdW5jdGlvbihhcnJheSx2YWx1ZSkge1xyXG5cdHJldHVybiBic2VhcmNoKGFycmF5LHZhbHVlLHRydWUpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cz1ic2VhcmNoOy8ve2JzZWFyY2hOZWFyOmJzZWFyY2hOZWFyLGJzZWFyY2g6YnNlYXJjaH07IiwidmFyIEtERT1yZXF1aXJlKFwiLi9rZGVcIik7XHJcbi8vY3VycmVudGx5IG9ubHkgc3VwcG9ydCBub2RlLmpzIGZzLCBrc2FuYWdhcCBuYXRpdmUgZnMsIGh0bWw1IGZpbGUgc3lzdGVtXHJcbi8vdXNlIHNvY2tldC5pbyB0byByZWFkIGtkYiBmcm9tIHJlbW90ZSBzZXJ2ZXIgaW4gZnV0dXJlXHJcbm1vZHVsZS5leHBvcnRzPUtERTsiLCIvKiBLc2FuYSBEYXRhYmFzZSBFbmdpbmVcclxuXHJcbiAgIDIwMTUvMS8yICwgXHJcbiAgIG1vdmUgdG8ga3NhbmEtZGF0YWJhc2VcclxuICAgc2ltcGxpZmllZCBieSByZW1vdmluZyBkb2N1bWVudCBzdXBwb3J0IGFuZCBzb2NrZXQuaW8gc3VwcG9ydFxyXG5cclxuXHJcbiovXHJcbnZhciBwb29sPXt9LGxvY2FsUG9vbD17fTtcclxudmFyIGFwcHBhdGg9XCJcIjtcclxudmFyIGJzZWFyY2g9cmVxdWlyZShcIi4vYnNlYXJjaFwiKTtcclxudmFyIEtkYj1yZXF1aXJlKCdrc2FuYS1qc29ucm9tJyk7XHJcbnZhciBrZGJzPVtdOyAvL2F2YWlsYWJsZSBrZGIgLCBpZCBhbmQgYWJzb2x1dGUgcGF0aFxyXG52YXIgc3Ryc2VwPVwiXFx1ZmZmZlwiO1xyXG52YXIga2RibGlzdGVkPWZhbHNlO1xyXG4vKlxyXG52YXIgX2dldFN5bmM9ZnVuY3Rpb24ocGF0aHMsb3B0cykge1xyXG5cdHZhciBvdXQ9W107XHJcblx0Zm9yICh2YXIgaSBpbiBwYXRocykge1xyXG5cdFx0b3V0LnB1c2godGhpcy5nZXRTeW5jKHBhdGhzW2ldLG9wdHMpKTtcdFxyXG5cdH1cclxuXHRyZXR1cm4gb3V0O1xyXG59XHJcbiovXHJcbnZhciBfZ2V0cz1mdW5jdGlvbihwYXRocyxvcHRzLGNiKSB7IC8vZ2V0IG1hbnkgZGF0YSB3aXRoIG9uZSBjYWxsXHJcblxyXG5cdGlmICghcGF0aHMpIHJldHVybiA7XHJcblx0aWYgKHR5cGVvZiBwYXRocz09J3N0cmluZycpIHtcclxuXHRcdHBhdGhzPVtwYXRoc107XHJcblx0fVxyXG5cdHZhciBlbmdpbmU9dGhpcywgb3V0cHV0PVtdO1xyXG5cclxuXHR2YXIgbWFrZWNiPWZ1bmN0aW9uKHBhdGgpe1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0XHRcdGlmICghKGRhdGEgJiYgdHlwZW9mIGRhdGEgPT0nb2JqZWN0JyAmJiBkYXRhLl9fZW1wdHkpKSBvdXRwdXQucHVzaChkYXRhKTtcclxuXHRcdFx0XHRlbmdpbmUuZ2V0KHBhdGgsb3B0cyx0YXNrcXVldWUuc2hpZnQoKSk7XHJcblx0XHR9O1xyXG5cdH07XHJcblxyXG5cdHZhciB0YXNrcXVldWU9W107XHJcblx0Zm9yICh2YXIgaT0wO2k8cGF0aHMubGVuZ3RoO2krKykge1xyXG5cdFx0aWYgKHR5cGVvZiBwYXRoc1tpXT09XCJudWxsXCIpIHsgLy90aGlzIGlzIG9ubHkgYSBwbGFjZSBob2xkZXIgZm9yIGtleSBkYXRhIGFscmVhZHkgaW4gY2xpZW50IGNhY2hlXHJcblx0XHRcdG91dHB1dC5wdXNoKG51bGwpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGFza3F1ZXVlLnB1c2gobWFrZWNiKHBhdGhzW2ldKSk7XHJcblx0XHR9XHJcblx0fTtcclxuXHJcblx0dGFza3F1ZXVlLnB1c2goZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRvdXRwdXQucHVzaChkYXRhKTtcclxuXHRcdGNiLmFwcGx5KGVuZ2luZS5jb250ZXh0fHxlbmdpbmUsW291dHB1dCxwYXRoc10pOyAvL3JldHVybiB0byBjYWxsZXJcclxuXHR9KTtcclxuXHJcblx0dGFza3F1ZXVlLnNoaWZ0KCkoe19fZW1wdHk6dHJ1ZX0pOyAvL3J1biB0aGUgdGFza1xyXG59XHJcblxyXG52YXIgZ2V0RmlsZVJhbmdlPWZ1bmN0aW9uKGkpIHtcclxuXHR2YXIgZW5naW5lPXRoaXM7XHJcblxyXG5cdHZhciBmaWxlc2VnY291bnQ9ZW5naW5lLmdldChbXCJmaWxlc2VnY291bnRcIl0pO1xyXG5cdGlmIChmaWxlc2VnY291bnQpIHtcclxuXHRcdGlmIChpPT0wKSB7XHJcblx0XHRcdHJldHVybiB7c3RhcnQ6MCxlbmQ6ZmlsZXNlZ2NvdW50WzBdLTF9O1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIHtzdGFydDpmaWxlc2VnY291bnRbaS0xXSxlbmQ6ZmlsZXNlZ2NvdW50W2ldLTF9O1xyXG5cdFx0fVxyXG5cdH1cclxuXHQvL29sZCBidWdneSBjb2RlXHJcblx0dmFyIGZpbGVuYW1lcz1lbmdpbmUuZ2V0KFtcImZpbGVuYW1lc1wiXSk7XHJcblx0dmFyIGZpbGVvZmZzZXRzPWVuZ2luZS5nZXQoW1wiZmlsZW9mZnNldHNcIl0pO1xyXG5cdHZhciBzZWdvZmZzZXRzPWVuZ2luZS5nZXQoW1wic2Vnb2Zmc2V0c1wiXSk7XHJcblx0dmFyIHNlZ25hbWVzPWVuZ2luZS5nZXQoW1wic2VnbmFtZXNcIl0pO1xyXG5cdHZhciBmaWxlc3RhcnQ9ZmlsZW9mZnNldHNbaV0sIGZpbGVlbmQ9ZmlsZW9mZnNldHNbaSsxXS0xO1xyXG5cclxuXHR2YXIgc3RhcnQ9YnNlYXJjaChzZWdvZmZzZXRzLGZpbGVzdGFydCx0cnVlKTtcclxuXHQvL2lmIChzZWdPZmZzZXRzW3N0YXJ0XT09ZmlsZVN0YXJ0KSBzdGFydC0tO1xyXG5cdFxyXG5cdC8vd29yayBhcm91bmQgZm9yIGppYW5na2FuZ3l1clxyXG5cdHdoaWxlIChzZWdOYW1lc1tzdGFydCsxXT09XCJfXCIpIHN0YXJ0Kys7XHJcblxyXG4gIC8vaWYgKGk9PTApIHN0YXJ0PTA7IC8vd29yayBhcm91bmQgZm9yIGZpcnN0IGZpbGVcclxuXHR2YXIgZW5kPWJzZWFyY2goc2Vnb2Zmc2V0cyxmaWxlZW5kLHRydWUpO1xyXG5cdHJldHVybiB7c3RhcnQ6c3RhcnQsZW5kOmVuZH07XHJcbn1cclxuXHJcbnZhciBnZXRmaWxlc2VnPWZ1bmN0aW9uKGFic29sdXRlc2VnKSB7XHJcblx0dmFyIGZpbGVvZmZzZXRzPXRoaXMuZ2V0KFtcImZpbGVvZmZzZXRzXCJdKTtcclxuXHR2YXIgc2Vnb2Zmc2V0cz10aGlzLmdldChbXCJzZWdvZmZzZXRzXCJdKTtcclxuXHR2YXIgc2Vnb2Zmc2V0PXNlZ09mZnNldHNbYWJzb2x1dGVzZWddO1xyXG5cdHZhciBmaWxlPWJzZWFyY2goZmlsZU9mZnNldHMsc2Vnb2Zmc2V0LHRydWUpLTE7XHJcblxyXG5cdHZhciBmaWxlU3RhcnQ9ZmlsZW9mZnNldHNbZmlsZV07XHJcblx0dmFyIHN0YXJ0PWJzZWFyY2goc2Vnb2Zmc2V0cyxmaWxlU3RhcnQsdHJ1ZSk7XHRcclxuXHJcblx0dmFyIHNlZz1hYnNvbHV0ZXNlZy1zdGFydC0xO1xyXG5cdHJldHVybiB7ZmlsZTpmaWxlLHNlZzpzZWd9O1xyXG59XHJcbi8vcmV0dXJuIGFycmF5IG9mIG9iamVjdCBvZiBuZmlsZSBuc2VnIGdpdmVuIHNlZ25hbWVcclxudmFyIGZpbmRTZWc9ZnVuY3Rpb24oc2VnbmFtZSkge1xyXG5cdHZhciBzZWduYW1lcz10aGlzLmdldChcInNlZ25hbWVzXCIpO1xyXG5cdHZhciBvdXQ9W107XHJcblx0Zm9yICh2YXIgaT0wO2k8c2VnbmFtZXMubGVuZ3RoO2krKykge1xyXG5cdFx0aWYgKHNlZ25hbWVzW2ldPT1zZWduYW1lKSB7XHJcblx0XHRcdHZhciBmaWxlc2VnPWdldGZpbGVzZWcuYXBwbHkodGhpcyxbaV0pO1xyXG5cdFx0XHRvdXQucHVzaCh7ZmlsZTpmaWxlc2VnLmZpbGUsc2VnOmZpbGVzZWcuc2VnLGFic3NlZzppfSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdHJldHVybiBvdXQ7XHJcbn1cclxudmFyIGdldEZpbGVTZWdPZmZzZXRzPWZ1bmN0aW9uKGkpIHtcclxuXHR2YXIgc2Vnb2Zmc2V0cz10aGlzLmdldChcInNlZ29mZnNldHNcIik7XHJcblx0dmFyIHJhbmdlPWdldEZpbGVSYW5nZS5hcHBseSh0aGlzLFtpXSk7XHJcblx0cmV0dXJuIHNlZ29mZnNldHMuc2xpY2UocmFuZ2Uuc3RhcnQscmFuZ2UuZW5kKzEpO1xyXG59XHJcblxyXG52YXIgZ2V0RmlsZVNlZ05hbWVzPWZ1bmN0aW9uKGkpIHtcclxuXHR2YXIgcmFuZ2U9Z2V0RmlsZVJhbmdlLmFwcGx5KHRoaXMsW2ldKTtcclxuXHR2YXIgc2VnbmFtZXM9dGhpcy5nZXQoXCJzZWduYW1lc1wiKTtcclxuXHRyZXR1cm4gc2VnbmFtZXMuc2xpY2UocmFuZ2Uuc3RhcnQscmFuZ2UuZW5kKzEpO1xyXG59XHJcbnZhciBsb2NhbGVuZ2luZV9nZXQ9ZnVuY3Rpb24ocGF0aCxvcHRzLGNiKSB7XHJcblx0dmFyIGVuZ2luZT10aGlzO1xyXG5cdGlmICh0eXBlb2Ygb3B0cz09XCJmdW5jdGlvblwiKSB7XHJcblx0XHRjYj1vcHRzO1xyXG5cdFx0b3B0cz17cmVjdXJzaXZlOmZhbHNlfTtcclxuXHR9XHJcblx0aWYgKCFwYXRoKSB7XHJcblx0XHRpZiAoY2IpIGNiKG51bGwpO1xyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fVxyXG5cclxuXHRpZiAodHlwZW9mIGNiIT1cImZ1bmN0aW9uXCIpIHtcclxuXHRcdHJldHVybiBlbmdpbmUua2RiLmdldChwYXRoLG9wdHMpO1xyXG5cdH1cclxuXHJcblx0aWYgKHR5cGVvZiBwYXRoPT1cInN0cmluZ1wiKSB7XHJcblx0XHRyZXR1cm4gZW5naW5lLmtkYi5nZXQoW3BhdGhdLG9wdHMsY2IpO1xyXG5cdH0gZWxzZSBpZiAodHlwZW9mIHBhdGhbMF0gPT1cInN0cmluZ1wiKSB7XHJcblx0XHRyZXR1cm4gZW5naW5lLmtkYi5nZXQocGF0aCxvcHRzLGNiKTtcclxuXHR9IGVsc2UgaWYgKHR5cGVvZiBwYXRoWzBdID09XCJvYmplY3RcIikge1xyXG5cdFx0cmV0dXJuIF9nZXRzLmFwcGx5KGVuZ2luZSxbcGF0aCxvcHRzLGNiXSk7XHJcblx0fSBlbHNlIHtcclxuXHRcdGVuZ2luZS5rZGIuZ2V0KFtdLG9wdHMsZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdGNiKGRhdGFbMF0pOy8vcmV0dXJuIHRvcCBsZXZlbCBrZXlzXHJcblx0XHR9KTtcclxuXHR9XHJcbn07XHRcclxuXHJcbnZhciBnZXRQcmVsb2FkRmllbGQ9ZnVuY3Rpb24odXNlcikge1xyXG5cdHZhciBwcmVsb2FkPVtbXCJtZXRhXCJdLFtcImZpbGVuYW1lc1wiXSxbXCJmaWxlb2Zmc2V0c1wiXSxbXCJzZWduYW1lc1wiXSxbXCJzZWdvZmZzZXRzXCJdLFtcImZpbGVzZWdjb3VudFwiXV07XHJcblx0Ly9bXCJ0b2tlbnNcIl0sW1wicG9zdGluZ3NsZW5cIl0ga3NlIHdpbGwgbG9hZCBpdFxyXG5cdGlmICh1c2VyICYmIHVzZXIubGVuZ3RoKSB7IC8vdXNlciBzdXBwbHkgcHJlbG9hZFxyXG5cdFx0Zm9yICh2YXIgaT0wO2k8dXNlci5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdGlmIChwcmVsb2FkLmluZGV4T2YodXNlcltpXSk9PS0xKSB7XHJcblx0XHRcdFx0cHJlbG9hZC5wdXNoKHVzZXJbaV0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdHJldHVybiBwcmVsb2FkO1xyXG59XHJcbnZhciBjcmVhdGVMb2NhbEVuZ2luZT1mdW5jdGlvbihrZGIsb3B0cyxjYixjb250ZXh0KSB7XHJcblx0dmFyIGVuZ2luZT17a2RiOmtkYiwgcXVlcnlDYWNoZTp7fSwgcG9zdGluZ0NhY2hlOnt9LCBjYWNoZTp7fX07XHJcblxyXG5cdGlmICh0eXBlb2YgY29udGV4dD09XCJvYmplY3RcIikgZW5naW5lLmNvbnRleHQ9Y29udGV4dDtcclxuXHRlbmdpbmUuZ2V0PWxvY2FsZW5naW5lX2dldDtcclxuXHJcblx0ZW5naW5lLnNlZ09mZnNldD1zZWdPZmZzZXQ7XHJcblx0ZW5naW5lLmZpbGVPZmZzZXQ9ZmlsZU9mZnNldDtcclxuXHRlbmdpbmUuZ2V0RmlsZVNlZ05hbWVzPWdldEZpbGVTZWdOYW1lcztcclxuXHRlbmdpbmUuZ2V0RmlsZVNlZ09mZnNldHM9Z2V0RmlsZVNlZ09mZnNldHM7XHJcblx0ZW5naW5lLmdldEZpbGVSYW5nZT1nZXRGaWxlUmFuZ2U7XHJcblx0ZW5naW5lLmZpbmRTZWc9ZmluZFNlZztcclxuXHQvL29ubHkgbG9jYWwgZW5naW5lIGFsbG93IGdldFN5bmNcclxuXHQvL2lmIChrZGIuZnMuZ2V0U3luYykgZW5naW5lLmdldFN5bmM9ZW5naW5lLmtkYi5nZXRTeW5jO1xyXG5cdFxyXG5cdC8vc3BlZWR5IG5hdGl2ZSBmdW5jdGlvbnNcclxuXHRpZiAoa2RiLmZzLm1lcmdlUG9zdGluZ3MpIHtcclxuXHRcdGVuZ2luZS5tZXJnZVBvc3RpbmdzPWtkYi5mcy5tZXJnZVBvc3RpbmdzLmJpbmQoa2RiLmZzKTtcclxuXHR9XHJcblx0XHJcblx0dmFyIHNldFByZWxvYWQ9ZnVuY3Rpb24ocmVzKSB7XHJcblx0XHRlbmdpbmUuZGJuYW1lPXJlc1swXS5uYW1lO1xyXG5cdFx0Ly9lbmdpbmUuY3VzdG9tZnVuYz1jdXN0b21mdW5jLmdldEFQSShyZXNbMF0uY29uZmlnKTtcclxuXHRcdGVuZ2luZS5yZWFkeT10cnVlO1xyXG5cdH1cclxuXHJcblx0dmFyIHByZWxvYWQ9Z2V0UHJlbG9hZEZpZWxkKG9wdHMucHJlbG9hZCk7XHJcblx0dmFyIG9wdHM9e3JlY3Vyc2l2ZTp0cnVlfTtcclxuXHQvL2lmICh0eXBlb2YgY2I9PVwiZnVuY3Rpb25cIikge1xyXG5cdFx0X2dldHMuYXBwbHkoZW5naW5lLFsgcHJlbG9hZCwgb3B0cyxmdW5jdGlvbihyZXMpe1xyXG5cdFx0XHRzZXRQcmVsb2FkKHJlcyk7XHJcblx0XHRcdGNiLmFwcGx5KGVuZ2luZS5jb250ZXh0LFtlbmdpbmVdKTtcclxuXHRcdH1dKTtcclxuXHQvL30gZWxzZSB7XHJcblx0Ly9cdHNldFByZWxvYWQoX2dldFN5bmMuYXBwbHkoZW5naW5lLFtwcmVsb2FkLG9wdHNdKSk7XHJcblx0Ly99XHJcblx0cmV0dXJuIGVuZ2luZTtcclxufVxyXG5cclxudmFyIHNlZ09mZnNldD1mdW5jdGlvbihzZWduYW1lKSB7XHJcblx0dmFyIGVuZ2luZT10aGlzO1xyXG5cdGlmIChhcmd1bWVudHMubGVuZ3RoPjEpIHRocm93IFwiYXJndW1lbnQgOiBzZWduYW1lIFwiO1xyXG5cclxuXHR2YXIgc2VnTmFtZXM9ZW5naW5lLmdldChcInNlZ25hbWVzXCIpO1xyXG5cdHZhciBzZWdPZmZzZXRzPWVuZ2luZS5nZXQoXCJzZWdvZmZzZXRzXCIpO1xyXG5cclxuXHR2YXIgaT1zZWdOYW1lcy5pbmRleE9mKHNlZ25hbWUpO1xyXG5cdHJldHVybiAoaT4tMSk/c2VnT2Zmc2V0c1tpXTowO1xyXG59XHJcbnZhciBmaWxlT2Zmc2V0PWZ1bmN0aW9uKGZuKSB7XHJcblx0dmFyIGVuZ2luZT10aGlzO1xyXG5cdHZhciBmaWxlbmFtZXM9ZW5naW5lLmdldChcImZpbGVuYW1lc1wiKTtcclxuXHR2YXIgb2Zmc2V0cz1lbmdpbmUuZ2V0KFwiZmlsZW9mZnNldHNcIik7XHJcblx0dmFyIGk9ZmlsZW5hbWVzLmluZGV4T2YoZm4pO1xyXG5cdGlmIChpPT0tMSkgcmV0dXJuIG51bGw7XHJcblx0cmV0dXJuIHtzdGFydDogb2Zmc2V0c1tpXSwgZW5kOm9mZnNldHNbaSsxXX07XHJcbn1cclxuXHJcbnZhciBmb2xkZXJPZmZzZXQ9ZnVuY3Rpb24oZm9sZGVyKSB7XHJcblx0dmFyIGVuZ2luZT10aGlzO1xyXG5cdHZhciBzdGFydD0wLGVuZD0wO1xyXG5cdHZhciBmaWxlbmFtZXM9ZW5naW5lLmdldChcImZpbGVuYW1lc1wiKTtcclxuXHR2YXIgb2Zmc2V0cz1lbmdpbmUuZ2V0KFwiZmlsZW9mZnNldHNcIik7XHJcblx0Zm9yICh2YXIgaT0wO2k8ZmlsZW5hbWVzLmxlbmd0aDtpKyspIHtcclxuXHRcdGlmIChmaWxlbmFtZXNbaV0uc3Vic3RyaW5nKDAsZm9sZGVyLmxlbmd0aCk9PWZvbGRlcikge1xyXG5cdFx0XHRpZiAoIXN0YXJ0KSBzdGFydD1vZmZzZXRzW2ldO1xyXG5cdFx0XHRlbmQ9b2Zmc2V0c1tpXTtcclxuXHRcdH0gZWxzZSBpZiAoc3RhcnQpIGJyZWFrO1xyXG5cdH1cclxuXHRyZXR1cm4ge3N0YXJ0OnN0YXJ0LGVuZDplbmR9O1xyXG59XHJcblxyXG4gLy9UT0RPIGRlbGV0ZSBkaXJlY3RseSBmcm9tIGtkYiBpbnN0YW5jZVxyXG4gLy9rZGIuZnJlZSgpO1xyXG52YXIgY2xvc2VMb2NhbD1mdW5jdGlvbihrZGJpZCkge1xyXG5cdHZhciBlbmdpbmU9bG9jYWxQb29sW2tkYmlkXTtcclxuXHRpZiAoZW5naW5lKSB7XHJcblx0XHRlbmdpbmUua2RiLmZyZWUoKTtcclxuXHRcdGRlbGV0ZSBsb2NhbFBvb2xba2RiaWRdO1xyXG5cdH1cclxufVxyXG52YXIgY2xvc2U9ZnVuY3Rpb24oa2RiaWQpIHtcclxuXHR2YXIgZW5naW5lPXBvb2xba2RiaWRdO1xyXG5cdGlmIChlbmdpbmUpIHtcclxuXHRcdGVuZ2luZS5rZGIuZnJlZSgpO1xyXG5cdFx0ZGVsZXRlIHBvb2xba2RiaWRdO1xyXG5cdH1cclxufVxyXG5cclxudmFyIGdldExvY2FsVHJpZXM9ZnVuY3Rpb24oa2RiZm4pIHtcclxuXHRpZiAoIWtkYmxpc3RlZCkge1xyXG5cdFx0a2Ricz1yZXF1aXJlKFwiLi9saXN0a2RiXCIpKCk7XHJcblx0XHRrZGJsaXN0ZWQ9dHJ1ZTtcclxuXHR9XHJcblxyXG5cdHZhciBrZGJpZD1rZGJmbi5yZXBsYWNlKCcua2RiJywnJyk7XHJcblx0dmFyIHRyaWVzPSBbXCIuL1wiK2tkYmlkK1wiLmtkYlwiXHJcblx0ICAgICAgICAgICAsXCIuLi9cIitrZGJpZCtcIi5rZGJcIlxyXG5cdF07XHJcblxyXG5cdGZvciAodmFyIGk9MDtpPGtkYnMubGVuZ3RoO2krKykge1xyXG5cdFx0aWYgKGtkYnNbaV1bMF09PWtkYmlkKSB7XHJcblx0XHRcdHRyaWVzLnB1c2goa2Ric1tpXVsxXSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdHJldHVybiB0cmllcztcclxufVxyXG52YXIgb3BlbkxvY2FsS3NhbmFnYXA9ZnVuY3Rpb24oa2RiaWQsb3B0cyxjYixjb250ZXh0KSB7XHJcblx0dmFyIGtkYmZuPWtkYmlkO1xyXG5cdHZhciB0cmllcz1nZXRMb2NhbFRyaWVzKGtkYmZuKTtcclxuXHJcblx0Zm9yICh2YXIgaT0wO2k8dHJpZXMubGVuZ3RoO2krKykge1xyXG5cdFx0aWYgKGZzLmV4aXN0c1N5bmModHJpZXNbaV0pKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coXCJrZGIgcGF0aDogXCIrbm9kZVJlcXVpcmUoJ3BhdGgnKS5yZXNvbHZlKHRyaWVzW2ldKSk7XHJcblx0XHRcdHZhciBrZGI9bmV3IEtkYi5vcGVuKHRyaWVzW2ldLGZ1bmN0aW9uKGVycixrZGIpe1xyXG5cdFx0XHRcdGlmIChlcnIpIHtcclxuXHRcdFx0XHRcdGNiLmFwcGx5KGNvbnRleHQsW2Vycl0pO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRjcmVhdGVMb2NhbEVuZ2luZShrZGIsb3B0cyxmdW5jdGlvbihlbmdpbmUpe1xyXG5cdFx0XHRcdFx0XHRsb2NhbFBvb2xba2RiaWRdPWVuZ2luZTtcclxuXHRcdFx0XHRcdFx0Y2IuYXBwbHkoY29udGV4dHx8ZW5naW5lLmNvbnRleHQsWzAsZW5naW5lXSk7XHJcblx0XHRcdFx0XHR9LGNvbnRleHQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSk7XHJcblx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRpZiAoY2IpIGNiLmFwcGx5KGNvbnRleHQsW2tkYmlkK1wiIG5vdCBmb3VuZFwiXSk7XHJcblx0cmV0dXJuIG51bGw7XHJcblxyXG59XHJcbnZhciBvcGVuTG9jYWxOb2RlPWZ1bmN0aW9uKGtkYmlkLG9wdHMsY2IsY29udGV4dCkge1xyXG5cdHZhciBmcz1yZXF1aXJlKCdmcycpO1xyXG5cdHZhciB0cmllcz1nZXRMb2NhbFRyaWVzKGtkYmlkKTtcclxuXHJcblx0Zm9yICh2YXIgaT0wO2k8dHJpZXMubGVuZ3RoO2krKykge1xyXG5cdFx0aWYgKGZzLmV4aXN0c1N5bmModHJpZXNbaV0pKSB7XHJcblxyXG5cdFx0XHRuZXcgS2RiLm9wZW4odHJpZXNbaV0sZnVuY3Rpb24oZXJyLGtkYil7XHJcblx0XHRcdFx0aWYgKGVycikge1xyXG5cdFx0XHRcdFx0Y2IuYXBwbHkoY29udGV4dHx8ZW5naW5lLmNvbnRlbnQsW2Vycl0pO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRjcmVhdGVMb2NhbEVuZ2luZShrZGIsb3B0cyxmdW5jdGlvbihlbmdpbmUpe1xyXG5cdFx0XHRcdFx0XHRcdGxvY2FsUG9vbFtrZGJpZF09ZW5naW5lO1xyXG5cdFx0XHRcdFx0XHRcdGNiLmFwcGx5KGNvbnRleHR8fGVuZ2luZS5jb250ZXh0LFswLGVuZ2luZV0pO1xyXG5cdFx0XHRcdFx0fSxjb250ZXh0KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH1cclxuXHR9XHJcblx0aWYgKGNiKSBjYi5hcHBseShjb250ZXh0LFtrZGJpZCtcIiBub3QgZm91bmRcIl0pO1xyXG5cdHJldHVybiBudWxsO1xyXG59XHJcblxyXG52YXIgb3BlbkxvY2FsSHRtbDU9ZnVuY3Rpb24oa2RiaWQsb3B0cyxjYixjb250ZXh0KSB7XHRcclxuXHR2YXIgZW5naW5lPWxvY2FsUG9vbFtrZGJpZF07XHJcblx0dmFyIGtkYmZuPWtkYmlkO1xyXG5cdGlmIChrZGJmbi5pbmRleE9mKFwiLmtkYlwiKT09LTEpIGtkYmZuKz1cIi5rZGJcIjtcclxuXHRuZXcgS2RiLm9wZW4oa2RiZm4sZnVuY3Rpb24oZXJyLGhhbmRsZSl7XHJcblx0XHRpZiAoZXJyKSB7XHJcblx0XHRcdGNiLmFwcGx5KGNvbnRleHQsW2Vycl0pO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y3JlYXRlTG9jYWxFbmdpbmUoaGFuZGxlLG9wdHMsZnVuY3Rpb24oZW5naW5lKXtcclxuXHRcdFx0XHRsb2NhbFBvb2xba2RiaWRdPWVuZ2luZTtcclxuXHRcdFx0XHRjYi5hcHBseShjb250ZXh0fHxlbmdpbmUuY29udGV4dCxbMCxlbmdpbmVdKTtcclxuXHRcdFx0fSxjb250ZXh0KTtcclxuXHRcdH1cclxuXHR9KTtcclxufVxyXG4vL29taXQgY2IgZm9yIHN5bmNyb25pemUgb3BlblxyXG52YXIgb3BlbkxvY2FsPWZ1bmN0aW9uKGtkYmlkLG9wdHMsY2IsY29udGV4dCkgIHtcclxuXHRpZiAodHlwZW9mIG9wdHM9PVwiZnVuY3Rpb25cIikgeyAvL25vIG9wdHNcclxuXHRcdGlmICh0eXBlb2YgY2I9PVwib2JqZWN0XCIpIGNvbnRleHQ9Y2I7XHJcblx0XHRjYj1vcHRzO1xyXG5cdFx0b3B0cz17fTtcclxuXHR9XHJcblxyXG5cdHZhciBlbmdpbmU9bG9jYWxQb29sW2tkYmlkXTtcclxuXHRpZiAoZW5naW5lKSB7XHJcblx0XHRpZiAoY2IpIGNiLmFwcGx5KGNvbnRleHR8fGVuZ2luZS5jb250ZXh0LFswLGVuZ2luZV0pO1xyXG5cdFx0cmV0dXJuIGVuZ2luZTtcclxuXHR9XHJcblxyXG5cdHZhciBwbGF0Zm9ybT1yZXF1aXJlKFwiLi9wbGF0Zm9ybVwiKS5nZXRQbGF0Zm9ybSgpO1xyXG5cdGlmIChwbGF0Zm9ybT09XCJub2RlLXdlYmtpdFwiIHx8IHBsYXRmb3JtPT1cIm5vZGVcIikge1xyXG5cdFx0b3BlbkxvY2FsTm9kZShrZGJpZCxvcHRzLGNiLGNvbnRleHQpO1xyXG5cdH0gZWxzZSBpZiAocGxhdGZvcm09PVwiaHRtbDVcIiB8fCBwbGF0Zm9ybT09XCJjaHJvbWVcIil7XHJcblx0XHRvcGVuTG9jYWxIdG1sNShrZGJpZCxvcHRzLGNiLGNvbnRleHQpO1x0XHRcclxuXHR9IGVsc2Uge1xyXG5cdFx0b3BlbkxvY2FsS3NhbmFnYXAoa2RiaWQsb3B0cyxjYixjb250ZXh0KTtcdFxyXG5cdH1cclxufVxyXG52YXIgc2V0UGF0aD1mdW5jdGlvbihwYXRoKSB7XHJcblx0YXBwcGF0aD1wYXRoO1xyXG5cdGNvbnNvbGUubG9nKFwic2V0IHBhdGhcIixwYXRoKVxyXG59XHJcblxyXG52YXIgZW51bUtkYj1mdW5jdGlvbihjYixjb250ZXh0KXtcclxuXHRyZXR1cm4ga2Ricy5tYXAoZnVuY3Rpb24oayl7cmV0dXJuIGtbMF19KTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHM9e29wZW46b3BlbkxvY2FsLHNldFBhdGg6c2V0UGF0aCwgY2xvc2U6Y2xvc2VMb2NhbCwgZW51bUtkYjplbnVtS2RifTsiLCIvKiByZXR1cm4gYXJyYXkgb2YgZGJpZCBhbmQgYWJzb2x1dGUgcGF0aCovXHJcbnZhciBsaXN0a2RiX2h0bWw1PWZ1bmN0aW9uKCkge1xyXG5cdHRocm93IFwibm90IGltcGxlbWVudCB5ZXRcIjtcclxuXHRyZXF1aXJlKFwia3NhbmEtanNvbnJvbVwiKS5odG1sNWZzLnJlYWRkaXIoZnVuY3Rpb24oa2Ricyl7XHJcblx0XHRcdGNiLmFwcGx5KHRoaXMsW2tkYnNdKTtcclxuXHR9LGNvbnRleHR8fHRoaXMpO1x0XHRcclxuXHJcbn1cclxuXHJcbnZhciBsaXN0a2RiX25vZGU9ZnVuY3Rpb24oKXtcclxuXHR2YXIgZnM9cmVxdWlyZShcImZzXCIpO1xyXG5cdHZhciBwYXRoPXJlcXVpcmUoXCJwYXRoXCIpXHJcblx0dmFyIHBhcmVudD1wYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSxcIi4uXCIpO1xyXG5cdHZhciBmaWxlcz1mcy5yZWFkZGlyU3luYyhwYXJlbnQpO1xyXG5cdHZhciBvdXRwdXQ9W107XHJcblx0ZmlsZXMubWFwKGZ1bmN0aW9uKGYpe1xyXG5cdFx0dmFyIHN1YmRpcj1wYXJlbnQrcGF0aC5zZXArZjtcclxuXHRcdHZhciBzdGF0PWZzLnN0YXRTeW5jKHN1YmRpciApO1xyXG5cdFx0aWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xyXG5cdFx0XHR2YXIgc3ViZmlsZXM9ZnMucmVhZGRpclN5bmMoc3ViZGlyKTtcclxuXHRcdFx0Zm9yICh2YXIgaT0wO2k8c3ViZmlsZXMubGVuZ3RoO2krKykge1xyXG5cdFx0XHRcdHZhciBmaWxlPXN1YmZpbGVzW2ldO1xyXG5cdFx0XHRcdHZhciBpZHg9ZmlsZS5pbmRleE9mKFwiLmtkYlwiKTtcclxuXHRcdFx0XHRpZiAoaWR4Pi0xJiZpZHg9PWZpbGUubGVuZ3RoLTQpIHtcclxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKFsgZmlsZS5zdWJzdHIoMCxmaWxlLmxlbmd0aC00KSwgc3ViZGlyK3BhdGguc2VwK2ZpbGVdKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KVxyXG5cdHJldHVybiBvdXRwdXQ7XHJcbn1cclxuXHJcbnZhciBsaXN0a2RiPWZ1bmN0aW9uKCkge1xyXG5cdHZhciBwbGF0Zm9ybT1yZXF1aXJlKFwiLi9wbGF0Zm9ybVwiKS5nZXRQbGF0Zm9ybSgpO1xyXG5cdHZhciBmaWxlcz1bXTtcclxuXHRpZiAocGxhdGZvcm09PVwibm9kZVwiIHx8IHBsYXRmb3JtPT1cIm5vZGUtd2Via2l0XCIpIHtcclxuXHRcdGZpbGVzPWxpc3RrZGJfbm9kZSgpO1xyXG5cdH0gZWxzZSB7XHJcblx0XHR0aHJvdyBcIm5vdCBpbXBsZW1lbnQgeWV0XCI7XHJcblx0fVxyXG5cdHJldHVybiBmaWxlcztcclxufVxyXG5tb2R1bGUuZXhwb3J0cz1saXN0a2RiOyIsInZhciBnZXRQbGF0Zm9ybT1mdW5jdGlvbigpIHtcclxuXHRpZiAodHlwZW9mIGtzYW5hZ2FwPT1cInVuZGVmaW5lZFwiKSB7XHJcblx0XHRwbGF0Zm9ybT1cIm5vZGVcIjtcclxuXHR9IGVsc2Uge1xyXG5cdFx0cGxhdGZvcm09a3NhbmFnYXAucGxhdGZvcm07XHJcblx0fVxyXG5cdHJldHVybiBwbGF0Zm9ybTtcclxufVxyXG5tb2R1bGUuZXhwb3J0cz17Z2V0UGxhdGZvcm06Z2V0UGxhdGZvcm19OyIsIlxyXG4vKiBlbXVsYXRlIGZpbGVzeXN0ZW0gb24gaHRtbDUgYnJvd3NlciAqL1xyXG4vKiBlbXVsYXRlIGZpbGVzeXN0ZW0gb24gaHRtbDUgYnJvd3NlciAqL1xyXG52YXIgcmVhZD1mdW5jdGlvbihoYW5kbGUsYnVmZmVyLG9mZnNldCxsZW5ndGgscG9zaXRpb24sY2IpIHsvL2J1ZmZlciBhbmQgb2Zmc2V0IGlzIG5vdCB1c2VkXHJcblx0dmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG5cdHhoci5vcGVuKCdHRVQnLCBoYW5kbGUudXJsICwgdHJ1ZSk7XHJcblx0dmFyIHJhbmdlPVtwb3NpdGlvbixsZW5ndGgrcG9zaXRpb24tMV07XHJcblx0eGhyLnNldFJlcXVlc3RIZWFkZXIoJ1JhbmdlJywgJ2J5dGVzPScrcmFuZ2VbMF0rJy0nK3JhbmdlWzFdKTtcclxuXHR4aHIucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcclxuXHR4aHIuc2VuZCgpO1xyXG5cdHhoci5vbmxvYWQgPSBmdW5jdGlvbihlKSB7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0XHRjYigwLHRoYXQucmVzcG9uc2UuYnl0ZUxlbmd0aCx0aGF0LnJlc3BvbnNlKTtcclxuXHRcdH0sMCk7XHJcblx0fTsgXHJcbn1cclxudmFyIGNsb3NlPWZ1bmN0aW9uKGhhbmRsZSkge31cclxudmFyIGZzdGF0U3luYz1mdW5jdGlvbihoYW5kbGUpIHtcclxuXHR0aHJvdyBcIm5vdCBpbXBsZW1lbnQgeWV0XCI7XHJcbn1cclxudmFyIGZzdGF0PWZ1bmN0aW9uKGhhbmRsZSxjYikge1xyXG5cdHRocm93IFwibm90IGltcGxlbWVudCB5ZXRcIjtcclxufVxyXG52YXIgX29wZW49ZnVuY3Rpb24oZm5fdXJsLGNiKSB7XHJcblx0XHR2YXIgaGFuZGxlPXt9O1xyXG5cdFx0aWYgKGZuX3VybC5pbmRleE9mKFwiZmlsZXN5c3RlbTpcIik9PTApe1xyXG5cdFx0XHRoYW5kbGUudXJsPWZuX3VybDtcclxuXHRcdFx0aGFuZGxlLmZuPWZuX3VybC5zdWJzdHIoIGZuX3VybC5sYXN0SW5kZXhPZihcIi9cIikrMSk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRoYW5kbGUuZm49Zm5fdXJsO1xyXG5cdFx0XHR2YXIgdXJsPUFQSS5maWxlcy5maWx0ZXIoZnVuY3Rpb24oZil7IHJldHVybiAoZlswXT09Zm5fdXJsKX0pO1xyXG5cdFx0XHRpZiAodXJsLmxlbmd0aCkgaGFuZGxlLnVybD11cmxbMF1bMV07XHJcblx0XHRcdGVsc2UgY2IobnVsbCk7XHJcblx0XHR9XHJcblx0XHRjYihoYW5kbGUpO1xyXG59XHJcbnZhciBvcGVuPWZ1bmN0aW9uKGZuX3VybCxjYikge1xyXG5cdFx0aWYgKCFBUEkuaW5pdGlhbGl6ZWQpIHtpbml0KDEwMjQqMTAyNCxmdW5jdGlvbigpe1xyXG5cdFx0XHRfb3Blbi5hcHBseSh0aGlzLFtmbl91cmwsY2JdKTtcclxuXHRcdH0sdGhpcyl9IGVsc2UgX29wZW4uYXBwbHkodGhpcyxbZm5fdXJsLGNiXSk7XHJcbn1cclxudmFyIGxvYWQ9ZnVuY3Rpb24oZmlsZW5hbWUsbW9kZSxjYikge1xyXG5cdG9wZW4oZmlsZW5hbWUsbW9kZSxjYix0cnVlKTtcclxufVxyXG5mdW5jdGlvbiBlcnJvckhhbmRsZXIoZSkge1xyXG5cdGNvbnNvbGUuZXJyb3IoJ0Vycm9yOiAnICtlLm5hbWUrIFwiIFwiK2UubWVzc2FnZSk7XHJcbn1cclxudmFyIHJlYWRkaXI9ZnVuY3Rpb24oY2IsY29udGV4dCkge1xyXG5cdCB2YXIgZGlyUmVhZGVyID0gQVBJLmZzLnJvb3QuY3JlYXRlUmVhZGVyKCk7XHJcblx0IHZhciBvdXQ9W10sdGhhdD10aGlzO1xyXG5cdFx0ZGlyUmVhZGVyLnJlYWRFbnRyaWVzKGZ1bmN0aW9uKGVudHJpZXMpIHtcclxuXHRcdFx0aWYgKGVudHJpZXMubGVuZ3RoKSB7XHJcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIGVudHJ5OyBlbnRyeSA9IGVudHJpZXNbaV07ICsraSkge1xyXG5cdFx0XHRcdFx0aWYgKGVudHJ5LmlzRmlsZSkge1xyXG5cdFx0XHRcdFx0XHRvdXQucHVzaChbZW50cnkubmFtZSxlbnRyeS50b1VSTCA/IGVudHJ5LnRvVVJMKCkgOiBlbnRyeS50b1VSSSgpXSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdEFQSS5maWxlcz1vdXQ7XHJcblx0XHRcdGlmIChjYikgY2IuYXBwbHkoY29udGV4dCxbb3V0XSk7XHJcblx0XHR9LCBmdW5jdGlvbigpe1xyXG5cdFx0XHRpZiAoY2IpIGNiLmFwcGx5KGNvbnRleHQsW251bGxdKTtcclxuXHRcdH0pO1xyXG59XHJcbnZhciBpbml0ZnM9ZnVuY3Rpb24oZ3JhbnRlZEJ5dGVzLGNiLGNvbnRleHQpIHtcclxuXHR3ZWJraXRSZXF1ZXN0RmlsZVN5c3RlbShQRVJTSVNURU5ULCBncmFudGVkQnl0ZXMsICBmdW5jdGlvbihmcykge1xyXG5cdFx0QVBJLmZzPWZzO1xyXG5cdFx0QVBJLnF1b3RhPWdyYW50ZWRCeXRlcztcclxuXHRcdHJlYWRkaXIoZnVuY3Rpb24oKXtcclxuXHRcdFx0QVBJLmluaXRpYWxpemVkPXRydWU7XHJcblx0XHRcdGNiLmFwcGx5KGNvbnRleHQsW2dyYW50ZWRCeXRlcyxmc10pO1xyXG5cdFx0fSxjb250ZXh0KTtcclxuXHR9LCBlcnJvckhhbmRsZXIpO1xyXG59XHJcbnZhciBpbml0PWZ1bmN0aW9uKHF1b3RhLGNiLGNvbnRleHQpIHtcclxuXHRuYXZpZ2F0b3Iud2Via2l0UGVyc2lzdGVudFN0b3JhZ2UucmVxdWVzdFF1b3RhKHF1b3RhLCBcclxuXHRcdFx0ZnVuY3Rpb24oZ3JhbnRlZEJ5dGVzKSB7XHJcblx0XHRcdFx0aW5pdGZzKGdyYW50ZWRCeXRlcyxjYixjb250ZXh0KTtcclxuXHRcdH0sIGVycm9ySGFuZGxlciBcclxuXHQpO1xyXG59XHJcbnZhciBBUEk9e1xyXG5cdHJlYWQ6cmVhZFxyXG5cdCxyZWFkZGlyOnJlYWRkaXJcclxuXHQsb3BlbjpvcGVuXHJcblx0LGNsb3NlOmNsb3NlXHJcblx0LGZzdGF0U3luYzpmc3RhdFN5bmNcclxuXHQsZnN0YXQ6ZnN0YXRcclxufVxyXG5tb2R1bGUuZXhwb3J0cz1BUEk7IiwibW9kdWxlLmV4cG9ydHM9e1xyXG5cdG9wZW46cmVxdWlyZShcIi4va2RiXCIpXHJcbn1cclxuIiwiLypcclxuXHRLREIgdmVyc2lvbiAzLjAgR1BMXHJcblx0eWFwY2hlYWhzaGVuQGdtYWlsLmNvbVxyXG5cdDIwMTMvMTIvMjhcclxuXHRhc3luY3Jvbml6ZSB2ZXJzaW9uIG9mIHlhZGJcclxuXHJcbiAgcmVtb3ZlIGRlcGVuZGVuY3kgb2YgUSwgdGhhbmtzIHRvXHJcbiAgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy80MjM0NjE5L2hvdy10by1hdm9pZC1sb25nLW5lc3Rpbmctb2YtYXN5bmNocm9ub3VzLWZ1bmN0aW9ucy1pbi1ub2RlLWpzXHJcblxyXG4gIDIwMTUvMS8yXHJcbiAgbW92ZWQgdG8ga3NhbmFmb3JnZS9rc2FuYS1qc29ucm9tXHJcbiAgYWRkIGVyciBpbiBjYWxsYmFjayBmb3Igbm9kZS5qcyBjb21wbGlhbnRcclxuKi9cclxudmFyIEtmcz1udWxsO1xyXG5cclxuaWYgKHR5cGVvZiBrc2FuYWdhcD09XCJ1bmRlZmluZWRcIikge1xyXG5cdEtmcz1yZXF1aXJlKCcuL2tkYmZzJyk7XHRcdFx0XHJcbn0gZWxzZSB7XHJcblx0aWYgKGtzYW5hZ2FwLnBsYXRmb3JtPT1cImlvc1wiKSB7XHJcblx0XHRLZnM9cmVxdWlyZShcIi4va2RiZnNfaW9zXCIpO1xyXG5cdH0gZWxzZSBpZiAoa3NhbmFnYXAucGxhdGZvcm09PVwibm9kZS13ZWJraXRcIikge1xyXG5cdFx0S2ZzPXJlcXVpcmUoXCIuL2tkYmZzXCIpO1xyXG5cdH0gZWxzZSBpZiAoa3NhbmFnYXAucGxhdGZvcm09PVwiY2hyb21lXCIpIHtcclxuXHRcdEtmcz1yZXF1aXJlKFwiLi9rZGJmc1wiKTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0S2ZzPXJlcXVpcmUoXCIuL2tkYmZzX2FuZHJvaWRcIik7XHJcblx0fVxyXG5cdFx0XHJcbn1cclxuXHJcblxyXG52YXIgRFQ9e1xyXG5cdHVpbnQ4OicxJywgLy91bnNpZ25lZCAxIGJ5dGUgaW50ZWdlclxyXG5cdGludDMyOic0JywgLy8gc2lnbmVkIDQgYnl0ZXMgaW50ZWdlclxyXG5cdHV0Zjg6JzgnLCAgXHJcblx0dWNzMjonMicsXHJcblx0Ym9vbDonXicsIFxyXG5cdGJsb2I6JyYnLFxyXG5cdHV0ZjhhcnI6JyonLCAvL3NoaWZ0IG9mIDhcclxuXHR1Y3MyYXJyOidAJywgLy9zaGlmdCBvZiAyXHJcblx0dWludDhhcnI6JyEnLCAvL3NoaWZ0IG9mIDFcclxuXHRpbnQzMmFycjonJCcsIC8vc2hpZnQgb2YgNFxyXG5cdHZpbnQ6J2AnLFxyXG5cdHBpbnQ6J34nLFx0XHJcblxyXG5cdGFycmF5OidcXHUwMDFiJyxcclxuXHRvYmplY3Q6J1xcdTAwMWEnIFxyXG5cdC8veWRiIHN0YXJ0IHdpdGggb2JqZWN0IHNpZ25hdHVyZSxcclxuXHQvL3R5cGUgYSB5ZGIgaW4gY29tbWFuZCBwcm9tcHQgc2hvd3Mgbm90aGluZ1xyXG59XHJcbnZhciB2ZXJib3NlPTAsIHJlYWRMb2c9ZnVuY3Rpb24oKXt9O1xyXG52YXIgX3JlYWRMb2c9ZnVuY3Rpb24ocmVhZHR5cGUsYnl0ZXMpIHtcclxuXHRjb25zb2xlLmxvZyhyZWFkdHlwZSxieXRlcyxcImJ5dGVzXCIpO1xyXG59XHJcbmlmICh2ZXJib3NlKSByZWFkTG9nPV9yZWFkTG9nO1xyXG52YXIgc3Ryc2VwPVwiXFx1ZmZmZlwiO1xyXG52YXIgQ3JlYXRlPWZ1bmN0aW9uKHBhdGgsb3B0cyxjYikge1xyXG5cdC8qIGxvYWR4eHggZnVuY3Rpb25zIG1vdmUgZmlsZSBwb2ludGVyICovXHJcblx0Ly8gbG9hZCB2YXJpYWJsZSBsZW5ndGggaW50XHJcblx0aWYgKHR5cGVvZiBvcHRzPT1cImZ1bmN0aW9uXCIpIHtcclxuXHRcdGNiPW9wdHM7XHJcblx0XHRvcHRzPXt9O1xyXG5cdH1cclxuXHJcblx0XHJcblx0dmFyIGxvYWRWSW50ID1mdW5jdGlvbihvcHRzLGJsb2Nrc2l6ZSxjb3VudCxjYikge1xyXG5cdFx0Ly9pZiAoY291bnQ9PTApIHJldHVybiBbXTtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblxyXG5cdFx0dGhpcy5mcy5yZWFkQnVmX3BhY2tlZGludChvcHRzLmN1cixibG9ja3NpemUsY291bnQsdHJ1ZSxmdW5jdGlvbihvKXtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZyhcInZpbnRcIik7XHJcblx0XHRcdG9wdHMuY3VyKz1vLmFkdjtcclxuXHRcdFx0Y2IuYXBwbHkodGhhdCxbby5kYXRhXSk7XHJcblx0XHR9KTtcclxuXHR9XHJcblx0dmFyIGxvYWRWSW50MT1mdW5jdGlvbihvcHRzLGNiKSB7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0bG9hZFZJbnQuYXBwbHkodGhpcyxbb3B0cyw2LDEsZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdC8vY29uc29sZS5sb2coXCJ2aW50MVwiKTtcclxuXHRcdFx0Y2IuYXBwbHkodGhhdCxbZGF0YVswXV0pO1xyXG5cdFx0fV0pXHJcblx0fVxyXG5cdC8vZm9yIHBvc3RpbmdzXHJcblx0dmFyIGxvYWRQSW50ID1mdW5jdGlvbihvcHRzLGJsb2Nrc2l6ZSxjb3VudCxjYikge1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHRoaXMuZnMucmVhZEJ1Zl9wYWNrZWRpbnQob3B0cy5jdXIsYmxvY2tzaXplLGNvdW50LGZhbHNlLGZ1bmN0aW9uKG8pe1xyXG5cdFx0XHQvL2NvbnNvbGUubG9nKFwicGludFwiKTtcclxuXHRcdFx0b3B0cy5jdXIrPW8uYWR2O1xyXG5cdFx0XHRjYi5hcHBseSh0aGF0LFtvLmRhdGFdKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHQvLyBpdGVtIGNhbiBiZSBhbnkgdHlwZSAodmFyaWFibGUgbGVuZ3RoKVxyXG5cdC8vIG1heGltdW0gc2l6ZSBvZiBhcnJheSBpcyAxVEIgMl40MFxyXG5cdC8vIHN0cnVjdHVyZTpcclxuXHQvLyBzaWduYXR1cmUsNSBieXRlcyBvZmZzZXQsIHBheWxvYWQsIGl0ZW1sZW5ndGhzXHJcblx0dmFyIGdldEFycmF5TGVuZ3RoPWZ1bmN0aW9uKG9wdHMsY2IpIHtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHR2YXIgZGF0YW9mZnNldD0wO1xyXG5cclxuXHRcdHRoaXMuZnMucmVhZFVJOChvcHRzLmN1cixmdW5jdGlvbihsZW4pe1xyXG5cdFx0XHR2YXIgbGVuZ3Rob2Zmc2V0PWxlbio0Mjk0OTY3Mjk2O1xyXG5cdFx0XHRvcHRzLmN1cisrO1xyXG5cdFx0XHR0aGF0LmZzLnJlYWRVSTMyKG9wdHMuY3VyLGZ1bmN0aW9uKGxlbil7XHJcblx0XHRcdFx0b3B0cy5jdXIrPTQ7XHJcblx0XHRcdFx0ZGF0YW9mZnNldD1vcHRzLmN1cjsgLy9rZWVwIHRoaXNcclxuXHRcdFx0XHRsZW5ndGhvZmZzZXQrPWxlbjtcclxuXHRcdFx0XHRvcHRzLmN1cis9bGVuZ3Rob2Zmc2V0O1xyXG5cclxuXHRcdFx0XHRsb2FkVkludDEuYXBwbHkodGhhdCxbb3B0cyxmdW5jdGlvbihjb3VudCl7XHJcblx0XHRcdFx0XHRsb2FkVkludC5hcHBseSh0aGF0LFtvcHRzLGNvdW50KjYsY291bnQsZnVuY3Rpb24oc3ope1x0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRjYih7Y291bnQ6Y291bnQsc3o6c3osb2Zmc2V0OmRhdGFvZmZzZXR9KTtcclxuXHRcdFx0XHRcdH1dKTtcclxuXHRcdFx0XHR9XSk7XHJcblx0XHRcdFx0XHJcblx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHR2YXIgbG9hZEFycmF5ID0gZnVuY3Rpb24ob3B0cyxibG9ja3NpemUsY2IpIHtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHRnZXRBcnJheUxlbmd0aC5hcHBseSh0aGlzLFtvcHRzLGZ1bmN0aW9uKEwpe1xyXG5cdFx0XHRcdHZhciBvPVtdO1xyXG5cdFx0XHRcdHZhciBlbmRjdXI9b3B0cy5jdXI7XHJcblx0XHRcdFx0b3B0cy5jdXI9TC5vZmZzZXQ7XHJcblxyXG5cdFx0XHRcdGlmIChvcHRzLmxhenkpIHsgXHJcblx0XHRcdFx0XHRcdHZhciBvZmZzZXQ9TC5vZmZzZXQ7XHJcblx0XHRcdFx0XHRcdEwuc3oubWFwKGZ1bmN0aW9uKHN6KXtcclxuXHRcdFx0XHRcdFx0XHRvW28ubGVuZ3RoXT1zdHJzZXArb2Zmc2V0LnRvU3RyaW5nKDE2KVxyXG5cdFx0XHRcdFx0XHRcdFx0ICAgK3N0cnNlcCtzei50b1N0cmluZygxNik7XHJcblx0XHRcdFx0XHRcdFx0b2Zmc2V0Kz1zejtcclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dmFyIHRhc2txdWV1ZT1bXTtcclxuXHRcdFx0XHRcdGZvciAodmFyIGk9MDtpPEwuY291bnQ7aSsrKSB7XHJcblx0XHRcdFx0XHRcdHRhc2txdWV1ZS5wdXNoKFxyXG5cdFx0XHRcdFx0XHRcdChmdW5jdGlvbihzeil7XHJcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gKFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIGRhdGE9PSdvYmplY3QnICYmIGRhdGEuX19lbXB0eSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0IC8vbm90IHB1c2hpbmcgdGhlIGZpcnN0IGNhbGxcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XHRlbHNlIG8ucHVzaChkYXRhKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRvcHRzLmJsb2Nrc2l6ZT1zejtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRsb2FkLmFwcGx5KHRoYXQsW29wdHMsIHRhc2txdWV1ZS5zaGlmdCgpXSk7XHJcblx0XHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHRcdFx0fSkoTC5zeltpXSlcclxuXHRcdFx0XHRcdFx0KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vbGFzdCBjYWxsIHRvIGNoaWxkIGxvYWRcclxuXHRcdFx0XHRcdHRhc2txdWV1ZS5wdXNoKGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0XHRcdFx0XHRvLnB1c2goZGF0YSk7XHJcblx0XHRcdFx0XHRcdG9wdHMuY3VyPWVuZGN1cjtcclxuXHRcdFx0XHRcdFx0Y2IuYXBwbHkodGhhdCxbb10pO1xyXG5cdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiAob3B0cy5sYXp5KSBjYi5hcHBseSh0aGF0LFtvXSk7XHJcblx0XHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0XHR0YXNrcXVldWUuc2hpZnQoKSh7X19lbXB0eTp0cnVlfSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRdKVxyXG5cdH1cdFx0XHJcblx0Ly8gaXRlbSBjYW4gYmUgYW55IHR5cGUgKHZhcmlhYmxlIGxlbmd0aClcclxuXHQvLyBzdXBwb3J0IGxhenkgbG9hZFxyXG5cdC8vIHN0cnVjdHVyZTpcclxuXHQvLyBzaWduYXR1cmUsNSBieXRlcyBvZmZzZXQsIHBheWxvYWQsIGl0ZW1sZW5ndGhzLCBcclxuXHQvLyAgICAgICAgICAgICAgICAgICAgc3RyaW5nYXJyYXlfc2lnbmF0dXJlLCBrZXlzXHJcblx0dmFyIGxvYWRPYmplY3QgPSBmdW5jdGlvbihvcHRzLGJsb2Nrc2l6ZSxjYikge1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHZhciBzdGFydD1vcHRzLmN1cjtcclxuXHRcdGdldEFycmF5TGVuZ3RoLmFwcGx5KHRoaXMsW29wdHMsZnVuY3Rpb24oTCkge1xyXG5cdFx0XHRvcHRzLmJsb2Nrc2l6ZT1ibG9ja3NpemUtb3B0cy5jdXIrc3RhcnQ7XHJcblx0XHRcdGxvYWQuYXBwbHkodGhhdCxbb3B0cyxmdW5jdGlvbihrZXlzKXsgLy9sb2FkIHRoZSBrZXlzXHJcblx0XHRcdFx0aWYgKG9wdHMua2V5cykgeyAvL2NhbGxlciBhc2sgZm9yIGtleXNcclxuXHRcdFx0XHRcdGtleXMubWFwKGZ1bmN0aW9uKGspIHsgb3B0cy5rZXlzLnB1c2goayl9KTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHZhciBvPXt9O1xyXG5cdFx0XHRcdHZhciBlbmRjdXI9b3B0cy5jdXI7XHJcblx0XHRcdFx0b3B0cy5jdXI9TC5vZmZzZXQ7XHJcblx0XHRcdFx0aWYgKG9wdHMubGF6eSkgeyBcclxuXHRcdFx0XHRcdHZhciBvZmZzZXQ9TC5vZmZzZXQ7XHJcblx0XHRcdFx0XHRmb3IgKHZhciBpPTA7aTxMLnN6Lmxlbmd0aDtpKyspIHtcclxuXHRcdFx0XHRcdFx0Ly9wcmVmaXggd2l0aCBhIFxcMCwgaW1wb3NzaWJsZSBmb3Igbm9ybWFsIHN0cmluZ1xyXG5cdFx0XHRcdFx0XHRvW2tleXNbaV1dPXN0cnNlcCtvZmZzZXQudG9TdHJpbmcoMTYpXHJcblx0XHRcdFx0XHRcdFx0ICAgK3N0cnNlcCtMLnN6W2ldLnRvU3RyaW5nKDE2KTtcclxuXHRcdFx0XHRcdFx0b2Zmc2V0Kz1MLnN6W2ldO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR2YXIgdGFza3F1ZXVlPVtdO1xyXG5cdFx0XHRcdFx0Zm9yICh2YXIgaT0wO2k8TC5jb3VudDtpKyspIHtcclxuXHRcdFx0XHRcdFx0dGFza3F1ZXVlLnB1c2goXHJcblx0XHRcdFx0XHRcdFx0KGZ1bmN0aW9uKHN6LGtleSl7XHJcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gKFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIGRhdGE9PSdvYmplY3QnICYmIGRhdGEuX19lbXB0eSkge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ly9ub3Qgc2F2aW5nIHRoZSBmaXJzdCBjYWxsO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRvW2tleV09ZGF0YTsgXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG9wdHMuYmxvY2tzaXplPXN6O1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmICh2ZXJib3NlKSByZWFkTG9nKFwia2V5XCIsa2V5KTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRsb2FkLmFwcGx5KHRoYXQsW29wdHMsIHRhc2txdWV1ZS5zaGlmdCgpXSk7XHJcblx0XHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHRcdFx0fSkoTC5zeltpXSxrZXlzW2ktMV0pXHJcblxyXG5cdFx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly9sYXN0IGNhbGwgdG8gY2hpbGQgbG9hZFxyXG5cdFx0XHRcdFx0dGFza3F1ZXVlLnB1c2goZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdFx0XHRcdG9ba2V5c1trZXlzLmxlbmd0aC0xXV09ZGF0YTtcclxuXHRcdFx0XHRcdFx0b3B0cy5jdXI9ZW5kY3VyO1xyXG5cdFx0XHRcdFx0XHRjYi5hcHBseSh0aGF0LFtvXSk7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0aWYgKG9wdHMubGF6eSkgY2IuYXBwbHkodGhhdCxbb10pO1xyXG5cdFx0XHRcdGVsc2Uge1xyXG5cdFx0XHRcdFx0dGFza3F1ZXVlLnNoaWZ0KCkoe19fZW1wdHk6dHJ1ZX0pO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fV0pO1xyXG5cdFx0fV0pO1xyXG5cdH1cclxuXHJcblx0Ly9pdGVtIGlzIHNhbWUga25vd24gdHlwZVxyXG5cdHZhciBsb2FkU3RyaW5nQXJyYXk9ZnVuY3Rpb24ob3B0cyxibG9ja3NpemUsZW5jb2RpbmcsY2IpIHtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHR0aGlzLmZzLnJlYWRTdHJpbmdBcnJheShvcHRzLmN1cixibG9ja3NpemUsZW5jb2RpbmcsZnVuY3Rpb24obyl7XHJcblx0XHRcdG9wdHMuY3VyKz1ibG9ja3NpemU7XHJcblx0XHRcdGNiLmFwcGx5KHRoYXQsW29dKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHR2YXIgbG9hZEludGVnZXJBcnJheT1mdW5jdGlvbihvcHRzLGJsb2Nrc2l6ZSx1bml0c2l6ZSxjYikge1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdGxvYWRWSW50MS5hcHBseSh0aGlzLFtvcHRzLGZ1bmN0aW9uKGNvdW50KXtcclxuXHRcdFx0dmFyIG89dGhhdC5mcy5yZWFkRml4ZWRBcnJheShvcHRzLmN1cixjb3VudCx1bml0c2l6ZSxmdW5jdGlvbihvKXtcclxuXHRcdFx0XHRvcHRzLmN1cis9Y291bnQqdW5pdHNpemU7XHJcblx0XHRcdFx0Y2IuYXBwbHkodGhhdCxbb10pO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1dKTtcclxuXHR9XHJcblx0dmFyIGxvYWRCbG9iPWZ1bmN0aW9uKGJsb2Nrc2l6ZSxjYikge1xyXG5cdFx0dmFyIG89dGhpcy5mcy5yZWFkQnVmKHRoaXMuY3VyLGJsb2Nrc2l6ZSk7XHJcblx0XHR0aGlzLmN1cis9YmxvY2tzaXplO1xyXG5cdFx0cmV0dXJuIG87XHJcblx0fVx0XHJcblx0dmFyIGxvYWRieXNpZ25hdHVyZT1mdW5jdGlvbihvcHRzLHNpZ25hdHVyZSxjYikge1xyXG5cdFx0ICB2YXIgYmxvY2tzaXplPW9wdHMuYmxvY2tzaXplfHx0aGlzLmZzLnNpemU7IFxyXG5cdFx0XHRvcHRzLmN1cis9dGhpcy5mcy5zaWduYXR1cmVfc2l6ZTtcclxuXHRcdFx0dmFyIGRhdGFzaXplPWJsb2Nrc2l6ZS10aGlzLmZzLnNpZ25hdHVyZV9zaXplO1xyXG5cdFx0XHQvL2Jhc2ljIHR5cGVzXHJcblx0XHRcdGlmIChzaWduYXR1cmU9PT1EVC5pbnQzMikge1xyXG5cdFx0XHRcdG9wdHMuY3VyKz00O1xyXG5cdFx0XHRcdHRoaXMuZnMucmVhZEkzMihvcHRzLmN1ci00LGNiKTtcclxuXHRcdFx0fSBlbHNlIGlmIChzaWduYXR1cmU9PT1EVC51aW50OCkge1xyXG5cdFx0XHRcdG9wdHMuY3VyKys7XHJcblx0XHRcdFx0dGhpcy5mcy5yZWFkVUk4KG9wdHMuY3VyLTEsY2IpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKHNpZ25hdHVyZT09PURULnV0ZjgpIHtcclxuXHRcdFx0XHR2YXIgYz1vcHRzLmN1cjtvcHRzLmN1cis9ZGF0YXNpemU7XHJcblx0XHRcdFx0dGhpcy5mcy5yZWFkU3RyaW5nKGMsZGF0YXNpemUsJ3V0ZjgnLGNiKTtcclxuXHRcdFx0fSBlbHNlIGlmIChzaWduYXR1cmU9PT1EVC51Y3MyKSB7XHJcblx0XHRcdFx0dmFyIGM9b3B0cy5jdXI7b3B0cy5jdXIrPWRhdGFzaXplO1xyXG5cdFx0XHRcdHRoaXMuZnMucmVhZFN0cmluZyhjLGRhdGFzaXplLCd1Y3MyJyxjYik7XHRcclxuXHRcdFx0fSBlbHNlIGlmIChzaWduYXR1cmU9PT1EVC5ib29sKSB7XHJcblx0XHRcdFx0b3B0cy5jdXIrKztcclxuXHRcdFx0XHR0aGlzLmZzLnJlYWRVSTgob3B0cy5jdXItMSxmdW5jdGlvbihkYXRhKXtjYighIWRhdGEpfSk7XHJcblx0XHRcdH0gZWxzZSBpZiAoc2lnbmF0dXJlPT09RFQuYmxvYikge1xyXG5cdFx0XHRcdGxvYWRCbG9iKGRhdGFzaXplLGNiKTtcclxuXHRcdFx0fVxyXG5cdFx0XHQvL3ZhcmlhYmxlIGxlbmd0aCBpbnRlZ2Vyc1xyXG5cdFx0XHRlbHNlIGlmIChzaWduYXR1cmU9PT1EVC52aW50KSB7XHJcblx0XHRcdFx0bG9hZFZJbnQuYXBwbHkodGhpcyxbb3B0cyxkYXRhc2l6ZSxkYXRhc2l6ZSxjYl0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKHNpZ25hdHVyZT09PURULnBpbnQpIHtcclxuXHRcdFx0XHRsb2FkUEludC5hcHBseSh0aGlzLFtvcHRzLGRhdGFzaXplLGRhdGFzaXplLGNiXSk7XHJcblx0XHRcdH1cclxuXHRcdFx0Ly9zaW1wbGUgYXJyYXlcclxuXHRcdFx0ZWxzZSBpZiAoc2lnbmF0dXJlPT09RFQudXRmOGFycikge1xyXG5cdFx0XHRcdGxvYWRTdHJpbmdBcnJheS5hcHBseSh0aGlzLFtvcHRzLGRhdGFzaXplLCd1dGY4JyxjYl0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKHNpZ25hdHVyZT09PURULnVjczJhcnIpIHtcclxuXHRcdFx0XHRsb2FkU3RyaW5nQXJyYXkuYXBwbHkodGhpcyxbb3B0cyxkYXRhc2l6ZSwndWNzMicsY2JdKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmIChzaWduYXR1cmU9PT1EVC51aW50OGFycikge1xyXG5cdFx0XHRcdGxvYWRJbnRlZ2VyQXJyYXkuYXBwbHkodGhpcyxbb3B0cyxkYXRhc2l6ZSwxLGNiXSk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoc2lnbmF0dXJlPT09RFQuaW50MzJhcnIpIHtcclxuXHRcdFx0XHRsb2FkSW50ZWdlckFycmF5LmFwcGx5KHRoaXMsW29wdHMsZGF0YXNpemUsNCxjYl0pO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vbmVzdGVkIHN0cnVjdHVyZVxyXG5cdFx0XHRlbHNlIGlmIChzaWduYXR1cmU9PT1EVC5hcnJheSkge1xyXG5cdFx0XHRcdGxvYWRBcnJheS5hcHBseSh0aGlzLFtvcHRzLGRhdGFzaXplLGNiXSk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoc2lnbmF0dXJlPT09RFQub2JqZWN0KSB7XHJcblx0XHRcdFx0bG9hZE9iamVjdC5hcHBseSh0aGlzLFtvcHRzLGRhdGFzaXplLGNiXSk7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSB7XHJcblx0XHRcdFx0Y29uc29sZS5lcnJvcigndW5zdXBwb3J0ZWQgdHlwZScsc2lnbmF0dXJlLG9wdHMpXHJcblx0XHRcdFx0Y2IuYXBwbHkodGhpcyxbbnVsbF0pOy8vbWFrZSBzdXJlIGl0IHJldHVyblxyXG5cdFx0XHRcdC8vdGhyb3cgJ3Vuc3VwcG9ydGVkIHR5cGUgJytzaWduYXR1cmU7XHJcblx0XHRcdH1cclxuXHR9XHJcblxyXG5cdHZhciBsb2FkPWZ1bmN0aW9uKG9wdHMsY2IpIHtcclxuXHRcdG9wdHM9b3B0c3x8e307IC8vIHRoaXMgd2lsbCBzZXJ2ZWQgYXMgY29udGV4dCBmb3IgZW50aXJlIGxvYWQgcHJvY2VkdXJlXHJcblx0XHRvcHRzLmN1cj1vcHRzLmN1cnx8MDtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHR0aGlzLmZzLnJlYWRTaWduYXR1cmUob3B0cy5jdXIsIGZ1bmN0aW9uKHNpZ25hdHVyZSl7XHJcblx0XHRcdGxvYWRieXNpZ25hdHVyZS5hcHBseSh0aGF0LFtvcHRzLHNpZ25hdHVyZSxjYl0pXHJcblx0XHR9KTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHR2YXIgQ0FDSEU9bnVsbDtcclxuXHR2YXIgS0VZPXt9O1xyXG5cdHZhciBBRERSRVNTPXt9O1xyXG5cdHZhciByZXNldD1mdW5jdGlvbihjYikge1xyXG5cdFx0aWYgKCFDQUNIRSkge1xyXG5cdFx0XHRsb2FkLmFwcGx5KHRoaXMsW3tjdXI6MCxsYXp5OnRydWV9LGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0XHRcdENBQ0hFPWRhdGE7XHJcblx0XHRcdFx0Y2IuY2FsbCh0aGlzKTtcclxuXHRcdFx0fV0pO1x0XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjYi5jYWxsKHRoaXMpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIGV4aXN0cz1mdW5jdGlvbihwYXRoLGNiKSB7XHJcblx0XHRpZiAocGF0aC5sZW5ndGg9PTApIHJldHVybiB0cnVlO1xyXG5cdFx0dmFyIGtleT1wYXRoLnBvcCgpO1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdGdldC5hcHBseSh0aGlzLFtwYXRoLGZhbHNlLGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0XHRpZiAoIXBhdGguam9pbihzdHJzZXApKSByZXR1cm4gKCEhS0VZW2tleV0pO1xyXG5cdFx0XHR2YXIga2V5cz1LRVlbcGF0aC5qb2luKHN0cnNlcCldO1xyXG5cdFx0XHRwYXRoLnB1c2goa2V5KTsvL3B1dCBpdCBiYWNrXHJcblx0XHRcdGlmIChrZXlzKSBjYi5hcHBseSh0aGF0LFtrZXlzLmluZGV4T2Yoa2V5KT4tMV0pO1xyXG5cdFx0XHRlbHNlIGNiLmFwcGx5KHRoYXQsW2ZhbHNlXSk7XHJcblx0XHR9XSk7XHJcblx0fVxyXG5cclxuXHR2YXIgZ2V0U3luYz1mdW5jdGlvbihwYXRoKSB7XHJcblx0XHRpZiAoIUNBQ0hFKSByZXR1cm4gdW5kZWZpbmVkO1x0XHJcblx0XHR2YXIgbz1DQUNIRTtcclxuXHRcdGZvciAodmFyIGk9MDtpPHBhdGgubGVuZ3RoO2krKykge1xyXG5cdFx0XHR2YXIgcj1vW3BhdGhbaV1dO1xyXG5cdFx0XHRpZiAodHlwZW9mIHI9PVwidW5kZWZpbmVkXCIpIHJldHVybiBudWxsO1xyXG5cdFx0XHRvPXI7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gbztcclxuXHR9XHJcblx0dmFyIGdldD1mdW5jdGlvbihwYXRoLG9wdHMsY2IpIHtcclxuXHRcdGlmICh0eXBlb2YgcGF0aD09J3VuZGVmaW5lZCcpIHBhdGg9W107XHJcblx0XHRpZiAodHlwZW9mIHBhdGg9PVwic3RyaW5nXCIpIHBhdGg9W3BhdGhdO1xyXG5cdFx0Ly9vcHRzLnJlY3Vyc2l2ZT0hIW9wdHMucmVjdXJzaXZlO1xyXG5cdFx0aWYgKHR5cGVvZiBvcHRzPT1cImZ1bmN0aW9uXCIpIHtcclxuXHRcdFx0Y2I9b3B0cztub2RlXHJcblx0XHRcdG9wdHM9e307XHJcblx0XHR9XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0aWYgKHR5cGVvZiBjYiE9J2Z1bmN0aW9uJykgcmV0dXJuIGdldFN5bmMocGF0aCk7XHJcblxyXG5cdFx0cmVzZXQuYXBwbHkodGhpcyxbZnVuY3Rpb24oKXtcclxuXHRcdFx0dmFyIG89Q0FDSEU7XHJcblx0XHRcdGlmIChwYXRoLmxlbmd0aD09MCkge1xyXG5cdFx0XHRcdGlmIChvcHRzLmFkZHJlc3MpIHtcclxuXHRcdFx0XHRcdGNiKFswLHRoYXQuZnMuc2l6ZV0pO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRjYihbT2JqZWN0LmtleXMoQ0FDSEUpXSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fSBcclxuXHRcdFx0XHJcblx0XHRcdHZhciBwYXRobm93PVwiXCIsdGFza3F1ZXVlPVtdLG5ld29wdHM9e30scj1udWxsO1xyXG5cdFx0XHR2YXIgbGFzdGtleT1cIlwiO1xyXG5cclxuXHRcdFx0Zm9yICh2YXIgaT0wO2k8cGF0aC5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdFx0dmFyIHRhc2s9KGZ1bmN0aW9uKGtleSxrKXtcclxuXHJcblx0XHRcdFx0XHRyZXR1cm4gKGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0XHRcdFx0XHRpZiAoISh0eXBlb2YgZGF0YT09J29iamVjdCcgJiYgZGF0YS5fX2VtcHR5KSkge1xyXG5cdFx0XHRcdFx0XHRcdGlmICh0eXBlb2Ygb1tsYXN0a2V5XT09J3N0cmluZycgJiYgb1tsYXN0a2V5XVswXT09c3Ryc2VwKSBvW2xhc3RrZXldPXt9O1xyXG5cdFx0XHRcdFx0XHRcdG9bbGFzdGtleV09ZGF0YTsgXHJcblx0XHRcdFx0XHRcdFx0bz1vW2xhc3RrZXldO1xyXG5cdFx0XHRcdFx0XHRcdHI9ZGF0YVtrZXldO1xyXG5cdFx0XHRcdFx0XHRcdEtFWVtwYXRobm93XT1vcHRzLmtleXM7XHRcdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdGRhdGE9b1trZXldO1xyXG5cdFx0XHRcdFx0XHRcdHI9ZGF0YTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiByPT09XCJ1bmRlZmluZWRcIikge1xyXG5cdFx0XHRcdFx0XHRcdHRhc2txdWV1ZT1udWxsO1xyXG5cdFx0XHRcdFx0XHRcdGNiLmFwcGx5KHRoYXQsW3JdKTsgLy9yZXR1cm4gZW1wdHkgdmFsdWVcclxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcdFx0XHRcdFx0XHRcdFxyXG5cdFx0XHRcdFx0XHRcdGlmIChwYXJzZUludChrKSkgcGF0aG5vdys9c3Ryc2VwO1xyXG5cdFx0XHRcdFx0XHRcdHBhdGhub3crPWtleTtcclxuXHRcdFx0XHRcdFx0XHRpZiAodHlwZW9mIHI9PSdzdHJpbmcnICYmIHJbMF09PXN0cnNlcCkgeyAvL29mZnNldCBvZiBkYXRhIHRvIGJlIGxvYWRlZFxyXG5cdFx0XHRcdFx0XHRcdFx0dmFyIHA9ci5zdWJzdHJpbmcoMSkuc3BsaXQoc3Ryc2VwKS5tYXAoZnVuY3Rpb24oaXRlbSl7cmV0dXJuIHBhcnNlSW50KGl0ZW0sMTYpfSk7XHJcblx0XHRcdFx0XHRcdFx0XHR2YXIgY3VyPXBbMF0sc3o9cFsxXTtcclxuXHRcdFx0XHRcdFx0XHRcdG5ld29wdHMubGF6eT0hb3B0cy5yZWN1cnNpdmUgfHwgKGs8cGF0aC5sZW5ndGgtMSkgO1xyXG5cdFx0XHRcdFx0XHRcdFx0bmV3b3B0cy5ibG9ja3NpemU9c3o7bmV3b3B0cy5jdXI9Y3VyLG5ld29wdHMua2V5cz1bXTtcclxuXHRcdFx0XHRcdFx0XHRcdGxhc3RrZXk9a2V5OyAvL2xvYWQgaXMgc3luYyBpbiBhbmRyb2lkXHJcblx0XHRcdFx0XHRcdFx0XHRpZiAob3B0cy5hZGRyZXNzICYmIHRhc2txdWV1ZS5sZW5ndGg9PTEpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0QUREUkVTU1twYXRobm93XT1bY3VyLHN6XTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0dGFza3F1ZXVlLnNoaWZ0KCkobnVsbCxBRERSRVNTW3BhdGhub3ddKTtcclxuXHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGxvYWQuYXBwbHkodGhhdCxbbmV3b3B0cywgdGFza3F1ZXVlLnNoaWZ0KCldKTtcclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdFx0aWYgKG9wdHMuYWRkcmVzcyAmJiB0YXNrcXVldWUubGVuZ3RoPT0xKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdHRhc2txdWV1ZS5zaGlmdCgpKG51bGwsQUREUkVTU1twYXRobm93XSk7XHJcblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHR0YXNrcXVldWUuc2hpZnQoKS5hcHBseSh0aGF0LFtyXSk7XHJcblx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0KHBhdGhbaV0saSk7XHJcblx0XHRcdFx0XHJcblx0XHRcdFx0dGFza3F1ZXVlLnB1c2godGFzayk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmICh0YXNrcXVldWUubGVuZ3RoPT0wKSB7XHJcblx0XHRcdFx0Y2IuYXBwbHkodGhhdCxbb10pO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdC8vbGFzdCBjYWxsIHRvIGNoaWxkIGxvYWRcclxuXHRcdFx0XHR0YXNrcXVldWUucHVzaChmdW5jdGlvbihkYXRhLGN1cnN6KXtcclxuXHRcdFx0XHRcdGlmIChvcHRzLmFkZHJlc3MpIHtcclxuXHRcdFx0XHRcdFx0Y2IuYXBwbHkodGhhdCxbY3Vyc3pdKTtcclxuXHRcdFx0XHRcdH0gZWxzZXtcclxuXHRcdFx0XHRcdFx0dmFyIGtleT1wYXRoW3BhdGgubGVuZ3RoLTFdO1xyXG5cdFx0XHRcdFx0XHRvW2tleV09ZGF0YTsgS0VZW3BhdGhub3ddPW9wdHMua2V5cztcclxuXHRcdFx0XHRcdFx0Y2IuYXBwbHkodGhhdCxbZGF0YV0pO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdHRhc2txdWV1ZS5zaGlmdCgpKHtfX2VtcHR5OnRydWV9KTtcdFx0XHRcclxuXHRcdFx0fVxyXG5cclxuXHRcdH1dKTsgLy9yZXNldFxyXG5cdH1cclxuXHQvLyBnZXQgYWxsIGtleXMgaW4gZ2l2ZW4gcGF0aFxyXG5cdHZhciBnZXRrZXlzPWZ1bmN0aW9uKHBhdGgsY2IpIHtcclxuXHRcdGlmICghcGF0aCkgcGF0aD1bXVxyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHJcblx0XHRnZXQuYXBwbHkodGhpcyxbcGF0aCxmYWxzZSxmdW5jdGlvbigpe1xyXG5cdFx0XHRpZiAocGF0aCAmJiBwYXRoLmxlbmd0aCkge1xyXG5cdFx0XHRcdGNiLmFwcGx5KHRoYXQsW0tFWVtwYXRoLmpvaW4oc3Ryc2VwKV1dKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRjYi5hcHBseSh0aGF0LFtPYmplY3Qua2V5cyhDQUNIRSldKTsgXHJcblx0XHRcdFx0Ly90b3AgbGV2ZWwsIG5vcm1hbGx5IGl0IGlzIHZlcnkgc21hbGxcclxuXHRcdFx0fVxyXG5cdFx0fV0pO1xyXG5cdH1cclxuXHJcblx0dmFyIHNldHVwYXBpPWZ1bmN0aW9uKCkge1xyXG5cdFx0dGhpcy5sb2FkPWxvYWQ7XHJcbi8vXHRcdHRoaXMuY3VyPTA7XHJcblx0XHR0aGlzLmNhY2hlPWZ1bmN0aW9uKCkge3JldHVybiBDQUNIRX07XHJcblx0XHR0aGlzLmtleT1mdW5jdGlvbigpIHtyZXR1cm4gS0VZfTtcclxuXHRcdHRoaXMuZnJlZT1mdW5jdGlvbigpIHtcclxuXHRcdFx0Q0FDSEU9bnVsbDtcclxuXHRcdFx0S0VZPW51bGw7XHJcblx0XHRcdHRoaXMuZnMuZnJlZSgpO1xyXG5cdFx0fVxyXG5cdFx0dGhpcy5zZXRDYWNoZT1mdW5jdGlvbihjKSB7Q0FDSEU9Y307XHJcblx0XHR0aGlzLmtleXM9Z2V0a2V5cztcclxuXHRcdHRoaXMuZ2V0PWdldDsgICAvLyBnZXQgYSBmaWVsZCwgbG9hZCBpZiBuZWVkZWRcclxuXHRcdHRoaXMuZXhpc3RzPWV4aXN0cztcclxuXHRcdHRoaXMuRFQ9RFQ7XHJcblx0XHRcclxuXHRcdC8vaW5zdGFsbCB0aGUgc3luYyB2ZXJzaW9uIGZvciBub2RlXHJcblx0XHQvL2lmICh0eXBlb2YgcHJvY2VzcyE9XCJ1bmRlZmluZWRcIikgcmVxdWlyZShcIi4va2RiX3N5bmNcIikodGhpcyk7XHJcblx0XHQvL2lmIChjYikgc2V0VGltZW91dChjYi5iaW5kKHRoaXMpLDApO1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHZhciBlcnI9MDtcclxuXHRcdGlmIChjYikge1xyXG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0Y2IoZXJyLHRoYXQpO1x0XHJcblx0XHRcdH0sMCk7XHJcblx0XHR9XHJcblx0fVxyXG5cdHZhciB0aGF0PXRoaXM7XHJcblx0dmFyIGtmcz1uZXcgS2ZzKHBhdGgsb3B0cyxmdW5jdGlvbihlcnIpe1xyXG5cdFx0aWYgKGVycikge1xyXG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0Y2IoZXJyLDApO1xyXG5cdFx0XHR9LDApO1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoYXQuc2l6ZT10aGlzLnNpemU7XHJcblx0XHRcdHNldHVwYXBpLmNhbGwodGhhdCk7XHRcdFx0XHJcblx0XHR9XHJcblx0fSk7XHJcblx0dGhpcy5mcz1rZnM7XHJcblx0cmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbkNyZWF0ZS5kYXRhdHlwZXM9RFQ7XHJcblxyXG5pZiAobW9kdWxlKSBtb2R1bGUuZXhwb3J0cz1DcmVhdGU7XHJcbi8vcmV0dXJuIENyZWF0ZTtcclxuIiwiLyogbm9kZS5qcyBhbmQgaHRtbDUgZmlsZSBzeXN0ZW0gYWJzdHJhY3Rpb24gbGF5ZXIqL1xyXG50cnkge1xyXG5cdHZhciBmcz1yZXF1aXJlKFwiZnNcIik7XHJcblx0dmFyIEJ1ZmZlcj1yZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcjtcclxufSBjYXRjaCAoZSkge1xyXG5cdHZhciBmcz1yZXF1aXJlKCcuL2h0bWw1cmVhZCcpO1xyXG5cdHZhciBCdWZmZXI9ZnVuY3Rpb24oKXsgcmV0dXJuIFwiXCJ9O1xyXG5cdHZhciBodG1sNWZzPXRydWU7IFx0XHJcbn1cclxudmFyIHNpZ25hdHVyZV9zaXplPTE7XHJcbnZhciB2ZXJib3NlPTAsIHJlYWRMb2c9ZnVuY3Rpb24oKXt9O1xyXG52YXIgX3JlYWRMb2c9ZnVuY3Rpb24ocmVhZHR5cGUsYnl0ZXMpIHtcclxuXHRjb25zb2xlLmxvZyhyZWFkdHlwZSxieXRlcyxcImJ5dGVzXCIpO1xyXG59XHJcbmlmICh2ZXJib3NlKSByZWFkTG9nPV9yZWFkTG9nO1xyXG5cclxudmFyIHVucGFja19pbnQgPSBmdW5jdGlvbiAoYXIsIGNvdW50ICwgcmVzZXQpIHtcclxuICAgY291bnQ9Y291bnR8fGFyLmxlbmd0aDtcclxuICB2YXIgciA9IFtdLCBpID0gMCwgdiA9IDA7XHJcbiAgZG8ge1xyXG5cdHZhciBzaGlmdCA9IDA7XHJcblx0ZG8ge1xyXG5cdCAgdiArPSAoKGFyW2ldICYgMHg3RikgPDwgc2hpZnQpO1xyXG5cdCAgc2hpZnQgKz0gNztcdCAgXHJcblx0fSB3aGlsZSAoYXJbKytpXSAmIDB4ODApO1xyXG5cdHIucHVzaCh2KTsgaWYgKHJlc2V0KSB2PTA7XHJcblx0Y291bnQtLTtcclxuICB9IHdoaWxlIChpPGFyLmxlbmd0aCAmJiBjb3VudCk7XHJcbiAgcmV0dXJuIHtkYXRhOnIsIGFkdjppIH07XHJcbn1cclxudmFyIE9wZW49ZnVuY3Rpb24ocGF0aCxvcHRzLGNiKSB7XHJcblx0b3B0cz1vcHRzfHx7fTtcclxuXHJcblx0dmFyIHJlYWRTaWduYXR1cmU9ZnVuY3Rpb24ocG9zLGNiKSB7XHJcblx0XHR2YXIgYnVmPW5ldyBCdWZmZXIoc2lnbmF0dXJlX3NpemUpO1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdGZzLnJlYWQodGhpcy5oYW5kbGUsYnVmLDAsc2lnbmF0dXJlX3NpemUscG9zLGZ1bmN0aW9uKGVycixsZW4sYnVmZmVyKXtcclxuXHRcdFx0aWYgKGh0bWw1ZnMpIHZhciBzaWduYXR1cmU9U3RyaW5nLmZyb21DaGFyQ29kZSgobmV3IFVpbnQ4QXJyYXkoYnVmZmVyKSlbMF0pXHJcblx0XHRcdGVsc2UgdmFyIHNpZ25hdHVyZT1idWZmZXIudG9TdHJpbmcoJ3V0ZjgnLDAsc2lnbmF0dXJlX3NpemUpO1xyXG5cdFx0XHRjYi5hcHBseSh0aGF0LFtzaWduYXR1cmVdKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0Ly90aGlzIGlzIHF1aXRlIHNsb3dcclxuXHQvL3dhaXQgZm9yIFN0cmluZ1ZpZXcgK0FycmF5QnVmZmVyIHRvIHNvbHZlIHRoZSBwcm9ibGVtXHJcblx0Ly9odHRwczovL2dyb3Vwcy5nb29nbGUuY29tL2EvY2hyb21pdW0ub3JnL2ZvcnVtLyMhdG9waWMvYmxpbmstZGV2L3lsZ2lOWV9aU1YwXHJcblx0Ly9pZiB0aGUgc3RyaW5nIGlzIGFsd2F5cyB1Y3MyXHJcblx0Ly9jYW4gdXNlIFVpbnQxNiB0byByZWFkIGl0LlxyXG5cdC8vaHR0cDovL3VwZGF0ZXMuaHRtbDVyb2Nrcy5jb20vMjAxMi8wNi9Ib3ctdG8tY29udmVydC1BcnJheUJ1ZmZlci10by1hbmQtZnJvbS1TdHJpbmdcclxuXHR2YXIgZGVjb2RldXRmOCA9IGZ1bmN0aW9uICh1dGZ0ZXh0KSB7XHJcblx0XHR2YXIgc3RyaW5nID0gXCJcIjtcclxuXHRcdHZhciBpID0gMDtcclxuXHRcdHZhciBjPTAsYzEgPSAwLCBjMiA9IDAgLCBjMz0wO1xyXG5cdFx0Zm9yICh2YXIgaT0wO2k8dXRmdGV4dC5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdGlmICh1dGZ0ZXh0LmNoYXJDb2RlQXQoaSk+MTI3KSBicmVhaztcclxuXHRcdH1cclxuXHRcdGlmIChpPj11dGZ0ZXh0Lmxlbmd0aCkgcmV0dXJuIHV0ZnRleHQ7XHJcblxyXG5cdFx0d2hpbGUgKCBpIDwgdXRmdGV4dC5sZW5ndGggKSB7XHJcblx0XHRcdGMgPSB1dGZ0ZXh0LmNoYXJDb2RlQXQoaSk7XHJcblx0XHRcdGlmIChjIDwgMTI4KSB7XHJcblx0XHRcdFx0c3RyaW5nICs9IHV0ZnRleHRbaV07XHJcblx0XHRcdFx0aSsrO1xyXG5cdFx0XHR9IGVsc2UgaWYoKGMgPiAxOTEpICYmIChjIDwgMjI0KSkge1xyXG5cdFx0XHRcdGMyID0gdXRmdGV4dC5jaGFyQ29kZUF0KGkrMSk7XHJcblx0XHRcdFx0c3RyaW5nICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjICYgMzEpIDw8IDYpIHwgKGMyICYgNjMpKTtcclxuXHRcdFx0XHRpICs9IDI7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0YzIgPSB1dGZ0ZXh0LmNoYXJDb2RlQXQoaSsxKTtcclxuXHRcdFx0XHRjMyA9IHV0ZnRleHQuY2hhckNvZGVBdChpKzIpO1xyXG5cdFx0XHRcdHN0cmluZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYyAmIDE1KSA8PCAxMikgfCAoKGMyICYgNjMpIDw8IDYpIHwgKGMzICYgNjMpKTtcclxuXHRcdFx0XHRpICs9IDM7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBzdHJpbmc7XHJcblx0fVxyXG5cclxuXHR2YXIgcmVhZFN0cmluZz0gZnVuY3Rpb24ocG9zLGJsb2Nrc2l6ZSxlbmNvZGluZyxjYikge1xyXG5cdFx0ZW5jb2Rpbmc9ZW5jb2Rpbmd8fCd1dGY4JztcclxuXHRcdHZhciBidWZmZXI9bmV3IEJ1ZmZlcihibG9ja3NpemUpO1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdGZzLnJlYWQodGhpcy5oYW5kbGUsYnVmZmVyLDAsYmxvY2tzaXplLHBvcyxmdW5jdGlvbihlcnIsbGVuLGJ1ZmZlcil7XHJcblx0XHRcdHJlYWRMb2coXCJzdHJpbmdcIixsZW4pO1xyXG5cdFx0XHRpZiAoaHRtbDVmcykge1xyXG5cdFx0XHRcdGlmIChlbmNvZGluZz09J3V0ZjgnKSB7XHJcblx0XHRcdFx0XHR2YXIgc3RyPWRlY29kZXV0ZjgoU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBuZXcgVWludDhBcnJheShidWZmZXIpKSlcclxuXHRcdFx0XHR9IGVsc2UgeyAvL3VjczIgaXMgMyB0aW1lcyBmYXN0ZXJcclxuXHRcdFx0XHRcdHZhciBzdHI9U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLCBuZXcgVWludDE2QXJyYXkoYnVmZmVyKSlcdFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRjYi5hcHBseSh0aGF0LFtzdHJdKTtcclxuXHRcdFx0fSBcclxuXHRcdFx0ZWxzZSBjYi5hcHBseSh0aGF0LFtidWZmZXIudG9TdHJpbmcoZW5jb2RpbmcpXSk7XHRcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0Ly93b3JrIGFyb3VuZCBmb3IgY2hyb21lIGZyb21DaGFyQ29kZSBjYW5ub3QgYWNjZXB0IGh1Z2UgYXJyYXlcclxuXHQvL2h0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD01NjU4OFxyXG5cdHZhciBidWYyc3RyaW5nYXJyPWZ1bmN0aW9uKGJ1ZixlbmMpIHtcclxuXHRcdGlmIChlbmM9PVwidXRmOFwiKSBcdHZhciBhcnI9bmV3IFVpbnQ4QXJyYXkoYnVmKTtcclxuXHRcdGVsc2UgdmFyIGFycj1uZXcgVWludDE2QXJyYXkoYnVmKTtcclxuXHRcdHZhciBpPTAsY29kZXM9W10sb3V0PVtdLHM9XCJcIjtcclxuXHRcdHdoaWxlIChpPGFyci5sZW5ndGgpIHtcclxuXHRcdFx0aWYgKGFycltpXSkge1xyXG5cdFx0XHRcdGNvZGVzW2NvZGVzLmxlbmd0aF09YXJyW2ldO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHM9U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLGNvZGVzKTtcclxuXHRcdFx0XHRpZiAoZW5jPT1cInV0ZjhcIikgb3V0W291dC5sZW5ndGhdPWRlY29kZXV0Zjgocyk7XHJcblx0XHRcdFx0ZWxzZSBvdXRbb3V0Lmxlbmd0aF09cztcclxuXHRcdFx0XHRjb2Rlcz1bXTtcdFx0XHRcdFxyXG5cdFx0XHR9XHJcblx0XHRcdGkrKztcclxuXHRcdH1cclxuXHRcdFxyXG5cdFx0cz1TdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsY29kZXMpO1xyXG5cdFx0aWYgKGVuYz09XCJ1dGY4XCIpIG91dFtvdXQubGVuZ3RoXT1kZWNvZGV1dGY4KHMpO1xyXG5cdFx0ZWxzZSBvdXRbb3V0Lmxlbmd0aF09cztcclxuXHJcblx0XHRyZXR1cm4gb3V0O1xyXG5cdH1cclxuXHR2YXIgcmVhZFN0cmluZ0FycmF5ID0gZnVuY3Rpb24ocG9zLGJsb2Nrc2l6ZSxlbmNvZGluZyxjYikge1xyXG5cdFx0dmFyIHRoYXQ9dGhpcyxvdXQ9bnVsbDtcclxuXHRcdGlmIChibG9ja3NpemU9PTApIHJldHVybiBbXTtcclxuXHRcdGVuY29kaW5nPWVuY29kaW5nfHwndXRmOCc7XHJcblx0XHR2YXIgYnVmZmVyPW5ldyBCdWZmZXIoYmxvY2tzaXplKTtcclxuXHRcdGZzLnJlYWQodGhpcy5oYW5kbGUsYnVmZmVyLDAsYmxvY2tzaXplLHBvcyxmdW5jdGlvbihlcnIsbGVuLGJ1ZmZlcil7XHJcblx0XHRcdGlmIChodG1sNWZzKSB7XHJcblx0XHRcdFx0cmVhZExvZyhcInN0cmluZ0FycmF5XCIsYnVmZmVyLmJ5dGVMZW5ndGgpO1xyXG5cclxuXHRcdFx0XHRpZiAoZW5jb2Rpbmc9PSd1dGY4Jykge1xyXG5cdFx0XHRcdFx0b3V0PWJ1ZjJzdHJpbmdhcnIoYnVmZmVyLFwidXRmOFwiKTtcclxuXHRcdFx0XHR9IGVsc2UgeyAvL3VjczIgaXMgMyB0aW1lcyBmYXN0ZXJcclxuXHRcdFx0XHRcdG91dD1idWYyc3RyaW5nYXJyKGJ1ZmZlcixcInVjczJcIik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJlYWRMb2coXCJzdHJpbmdBcnJheVwiLGJ1ZmZlci5sZW5ndGgpO1xyXG5cdFx0XHRcdG91dD1idWZmZXIudG9TdHJpbmcoZW5jb2RpbmcpLnNwbGl0KCdcXDAnKTtcclxuXHRcdFx0fSBcdFxyXG5cdFx0XHRjYi5hcHBseSh0aGF0LFtvdXRdKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHR2YXIgcmVhZFVJMzI9ZnVuY3Rpb24ocG9zLGNiKSB7XHJcblx0XHR2YXIgYnVmZmVyPW5ldyBCdWZmZXIoNCk7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0ZnMucmVhZCh0aGlzLmhhbmRsZSxidWZmZXIsMCw0LHBvcyxmdW5jdGlvbihlcnIsbGVuLGJ1ZmZlcil7XHJcblx0XHRcdHJlYWRMb2coXCJ1aTMyXCIsbGVuKTtcclxuXHRcdFx0aWYgKGh0bWw1ZnMpe1xyXG5cdFx0XHRcdC8vdj0obmV3IFVpbnQzMkFycmF5KGJ1ZmZlcikpWzBdO1xyXG5cdFx0XHRcdHZhciB2PW5ldyBEYXRhVmlldyhidWZmZXIpLmdldFVpbnQzMigwLCBmYWxzZSlcclxuXHRcdFx0XHRjYih2KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGNiLmFwcGx5KHRoYXQsW2J1ZmZlci5yZWFkSW50MzJCRSgwKV0pO1x0XHJcblx0XHR9KTtcdFx0XHJcblx0fVxyXG5cclxuXHR2YXIgcmVhZEkzMj1mdW5jdGlvbihwb3MsY2IpIHtcclxuXHRcdHZhciBidWZmZXI9bmV3IEJ1ZmZlcig0KTtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHRmcy5yZWFkKHRoaXMuaGFuZGxlLGJ1ZmZlciwwLDQscG9zLGZ1bmN0aW9uKGVycixsZW4sYnVmZmVyKXtcclxuXHRcdFx0cmVhZExvZyhcImkzMlwiLGxlbik7XHJcblx0XHRcdGlmIChodG1sNWZzKXtcclxuXHRcdFx0XHR2YXIgdj1uZXcgRGF0YVZpZXcoYnVmZmVyKS5nZXRJbnQzMigwLCBmYWxzZSlcclxuXHRcdFx0XHRjYih2KTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlICBcdGNiLmFwcGx5KHRoYXQsW2J1ZmZlci5yZWFkSW50MzJCRSgwKV0pO1x0XHJcblx0XHR9KTtcclxuXHR9XHJcblx0dmFyIHJlYWRVSTg9ZnVuY3Rpb24ocG9zLGNiKSB7XHJcblx0XHR2YXIgYnVmZmVyPW5ldyBCdWZmZXIoMSk7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cclxuXHRcdGZzLnJlYWQodGhpcy5oYW5kbGUsYnVmZmVyLDAsMSxwb3MsZnVuY3Rpb24oZXJyLGxlbixidWZmZXIpe1xyXG5cdFx0XHRyZWFkTG9nKFwidWk4XCIsbGVuKTtcclxuXHRcdFx0aWYgKGh0bWw1ZnMpY2IoIChuZXcgVWludDhBcnJheShidWZmZXIpKVswXSkgO1xyXG5cdFx0XHRlbHNlICBcdFx0XHRjYi5hcHBseSh0aGF0LFtidWZmZXIucmVhZFVJbnQ4KDApXSk7XHRcclxuXHRcdFx0XHJcblx0XHR9KTtcclxuXHR9XHJcblx0dmFyIHJlYWRCdWY9ZnVuY3Rpb24ocG9zLGJsb2Nrc2l6ZSxjYikge1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHZhciBidWY9bmV3IEJ1ZmZlcihibG9ja3NpemUpO1xyXG5cdFx0ZnMucmVhZCh0aGlzLmhhbmRsZSxidWYsMCxibG9ja3NpemUscG9zLGZ1bmN0aW9uKGVycixsZW4sYnVmZmVyKXtcclxuXHRcdFx0cmVhZExvZyhcImJ1ZlwiLGxlbik7XHJcblx0XHRcdHZhciBidWZmPW5ldyBVaW50OEFycmF5KGJ1ZmZlcilcclxuXHRcdFx0Y2IuYXBwbHkodGhhdCxbYnVmZl0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cdHZhciByZWFkQnVmX3BhY2tlZGludD1mdW5jdGlvbihwb3MsYmxvY2tzaXplLGNvdW50LHJlc2V0LGNiKSB7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0cmVhZEJ1Zi5hcHBseSh0aGlzLFtwb3MsYmxvY2tzaXplLGZ1bmN0aW9uKGJ1ZmZlcil7XHJcblx0XHRcdGNiLmFwcGx5KHRoYXQsW3VucGFja19pbnQoYnVmZmVyLGNvdW50LHJlc2V0KV0pO1x0XHJcblx0XHR9XSk7XHJcblx0XHRcclxuXHR9XHJcblx0dmFyIHJlYWRGaXhlZEFycmF5X2h0bWw1ZnM9ZnVuY3Rpb24ocG9zLGNvdW50LHVuaXRzaXplLGNiKSB7XHJcblx0XHR2YXIgZnVuYz1udWxsO1xyXG5cdFx0aWYgKHVuaXRzaXplPT09MSkge1xyXG5cdFx0XHRmdW5jPSdnZXRVaW50OCc7Ly9VaW50OEFycmF5O1xyXG5cdFx0fSBlbHNlIGlmICh1bml0c2l6ZT09PTIpIHtcclxuXHRcdFx0ZnVuYz0nZ2V0VWludDE2JzsvL1VpbnQxNkFycmF5O1xyXG5cdFx0fSBlbHNlIGlmICh1bml0c2l6ZT09PTQpIHtcclxuXHRcdFx0ZnVuYz0nZ2V0VWludDMyJzsvL1VpbnQzMkFycmF5O1xyXG5cdFx0fSBlbHNlIHRocm93ICd1bnN1cHBvcnRlZCBpbnRlZ2VyIHNpemUnO1xyXG5cclxuXHRcdGZzLnJlYWQodGhpcy5oYW5kbGUsbnVsbCwwLHVuaXRzaXplKmNvdW50LHBvcyxmdW5jdGlvbihlcnIsbGVuLGJ1ZmZlcil7XHJcblx0XHRcdHJlYWRMb2coXCJmaXggYXJyYXlcIixsZW4pO1xyXG5cdFx0XHR2YXIgb3V0PVtdO1xyXG5cdFx0XHRpZiAodW5pdHNpemU9PTEpIHtcclxuXHRcdFx0XHRvdXQ9bmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxlbiAvIHVuaXRzaXplOyBpKyspIHsgLy9lbmRpYW4gcHJvYmxlbVxyXG5cdFx0XHRcdC8vXHRvdXQucHVzaCggZnVuYyhidWZmZXIsaSp1bml0c2l6ZSkpO1xyXG5cdFx0XHRcdFx0b3V0LnB1c2goIHY9bmV3IERhdGFWaWV3KGJ1ZmZlcilbZnVuY10oaSxmYWxzZSkgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNiLmFwcGx5KHRoYXQsW291dF0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cdC8vIHNpZ25hdHVyZSwgaXRlbWNvdW50LCBwYXlsb2FkXHJcblx0dmFyIHJlYWRGaXhlZEFycmF5ID0gZnVuY3Rpb24ocG9zICxjb3VudCwgdW5pdHNpemUsY2IpIHtcclxuXHRcdHZhciBmdW5jPW51bGw7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0XHJcblx0XHRpZiAodW5pdHNpemUqIGNvdW50PnRoaXMuc2l6ZSAmJiB0aGlzLnNpemUpICB7XHJcblx0XHRcdGNvbnNvbGUubG9nKFwiYXJyYXkgc2l6ZSBleGNlZWQgZmlsZSBzaXplXCIsdGhpcy5zaXplKVxyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR9XHJcblx0XHRcclxuXHRcdGlmIChodG1sNWZzKSByZXR1cm4gcmVhZEZpeGVkQXJyYXlfaHRtbDVmcy5hcHBseSh0aGlzLFtwb3MsY291bnQsdW5pdHNpemUsY2JdKTtcclxuXHJcblx0XHR2YXIgaXRlbXM9bmV3IEJ1ZmZlciggdW5pdHNpemUqIGNvdW50KTtcclxuXHRcdGlmICh1bml0c2l6ZT09PTEpIHtcclxuXHRcdFx0ZnVuYz1pdGVtcy5yZWFkVUludDg7XHJcblx0XHR9IGVsc2UgaWYgKHVuaXRzaXplPT09Mikge1xyXG5cdFx0XHRmdW5jPWl0ZW1zLnJlYWRVSW50MTZCRTtcclxuXHRcdH0gZWxzZSBpZiAodW5pdHNpemU9PT00KSB7XHJcblx0XHRcdGZ1bmM9aXRlbXMucmVhZFVJbnQzMkJFO1xyXG5cdFx0fSBlbHNlIHRocm93ICd1bnN1cHBvcnRlZCBpbnRlZ2VyIHNpemUnO1xyXG5cdFx0Ly9jb25zb2xlLmxvZygnaXRlbWNvdW50JyxpdGVtY291bnQsJ2J1ZmZlcicsYnVmZmVyKTtcclxuXHJcblx0XHRmcy5yZWFkKHRoaXMuaGFuZGxlLGl0ZW1zLDAsdW5pdHNpemUqY291bnQscG9zLGZ1bmN0aW9uKGVycixsZW4sYnVmZmVyKXtcclxuXHRcdFx0cmVhZExvZyhcImZpeCBhcnJheVwiLGxlbik7XHJcblx0XHRcdHZhciBvdXQ9W107XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoIC8gdW5pdHNpemU7IGkrKykge1xyXG5cdFx0XHRcdG91dC5wdXNoKCBmdW5jLmFwcGx5KGl0ZW1zLFtpKnVuaXRzaXplXSkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNiLmFwcGx5KHRoYXQsW291dF0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHR2YXIgZnJlZT1mdW5jdGlvbigpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ2Nsb3NpbmcgJyxoYW5kbGUpO1xyXG5cdFx0ZnMuY2xvc2VTeW5jKHRoaXMuaGFuZGxlKTtcclxuXHR9XHJcblx0dmFyIHNldHVwYXBpPWZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHRoaXMucmVhZFNpZ25hdHVyZT1yZWFkU2lnbmF0dXJlO1xyXG5cdFx0dGhpcy5yZWFkSTMyPXJlYWRJMzI7XHJcblx0XHR0aGlzLnJlYWRVSTMyPXJlYWRVSTMyO1xyXG5cdFx0dGhpcy5yZWFkVUk4PXJlYWRVSTg7XHJcblx0XHR0aGlzLnJlYWRCdWY9cmVhZEJ1ZjtcclxuXHRcdHRoaXMucmVhZEJ1Zl9wYWNrZWRpbnQ9cmVhZEJ1Zl9wYWNrZWRpbnQ7XHJcblx0XHR0aGlzLnJlYWRGaXhlZEFycmF5PXJlYWRGaXhlZEFycmF5O1xyXG5cdFx0dGhpcy5yZWFkU3RyaW5nPXJlYWRTdHJpbmc7XHJcblx0XHR0aGlzLnJlYWRTdHJpbmdBcnJheT1yZWFkU3RyaW5nQXJyYXk7XHJcblx0XHR0aGlzLnNpZ25hdHVyZV9zaXplPXNpZ25hdHVyZV9zaXplO1xyXG5cdFx0dGhpcy5mcmVlPWZyZWU7XHJcblx0XHRpZiAoaHRtbDVmcykge1xyXG5cdFx0XHR2YXIgZm49cGF0aDtcclxuXHRcdFx0aWYgKHBhdGguaW5kZXhPZihcImZpbGVzeXN0ZW06XCIpPT0wKSBmbj1wYXRoLnN1YnN0cihwYXRoLmxhc3RJbmRleE9mKFwiL1wiKSk7XHJcblx0XHRcdGZzLmZzLnJvb3QuZ2V0RmlsZShmbix7fSxmdW5jdGlvbihlbnRyeSl7XHJcblx0XHRcdCAgZW50cnkuZ2V0TWV0YWRhdGEoZnVuY3Rpb24obWV0YWRhdGEpIHsgXHJcblx0XHRcdFx0dGhhdC5zaXplPW1ldGFkYXRhLnNpemU7XHJcblx0XHRcdFx0aWYgKGNiKSBzZXRUaW1lb3V0KGNiLmJpbmQodGhhdCksMCk7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dmFyIHN0YXQ9ZnMuZnN0YXRTeW5jKHRoaXMuaGFuZGxlKTtcclxuXHRcdFx0dGhpcy5zdGF0PXN0YXQ7XHJcblx0XHRcdHRoaXMuc2l6ZT1zdGF0LnNpemU7XHRcdFxyXG5cdFx0XHRpZiAoY2IpXHRzZXRUaW1lb3V0KGNiLmJpbmQodGhpcywwKSwwKTtcdFxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIHRoYXQ9dGhpcztcclxuXHRpZiAoaHRtbDVmcykge1xyXG5cdFx0ZnMub3BlbihwYXRoLGZ1bmN0aW9uKGgpe1xyXG5cdFx0XHRpZiAoIWgpIHtcclxuXHRcdFx0XHRpZiAoY2IpXHRzZXRUaW1lb3V0KGNiLmJpbmQobnVsbCxcImZpbGUgbm90IGZvdW5kOlwiK3BhdGgpLDApO1x0XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhhdC5oYW5kbGU9aDtcclxuXHRcdFx0XHR0aGF0Lmh0bWw1ZnM9dHJ1ZTtcclxuXHRcdFx0XHRzZXR1cGFwaS5jYWxsKHRoYXQpO1xyXG5cdFx0XHRcdHRoYXQub3BlbmVkPXRydWU7XHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHR9IGVsc2Uge1xyXG5cdFx0aWYgKGZzLmV4aXN0c1N5bmMocGF0aCkpe1xyXG5cdFx0XHR0aGlzLmhhbmRsZT1mcy5vcGVuU3luYyhwYXRoLCdyJyk7Ly8sZnVuY3Rpb24oZXJyLGhhbmRsZSl7XHJcblx0XHRcdHRoaXMub3BlbmVkPXRydWU7XHJcblx0XHRcdHNldHVwYXBpLmNhbGwodGhpcyk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRpZiAoY2IpXHRzZXRUaW1lb3V0KGNiLmJpbmQobnVsbCxcImZpbGUgbm90IGZvdW5kOlwiK3BhdGgpLDApO1x0XHJcblx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4gdGhpcztcclxufVxyXG5tb2R1bGUuZXhwb3J0cz1PcGVuOyIsIi8qXHJcbiAgSkFWQSBjYW4gb25seSByZXR1cm4gTnVtYmVyIGFuZCBTdHJpbmdcclxuXHRhcnJheSBhbmQgYnVmZmVyIHJldHVybiBpbiBzdHJpbmcgZm9ybWF0XHJcblx0bmVlZCBKU09OLnBhcnNlXHJcbiovXHJcbnZhciB2ZXJib3NlPTA7XHJcblxyXG52YXIgcmVhZFNpZ25hdHVyZT1mdW5jdGlvbihwb3MsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1ZyhcInJlYWQgc2lnbmF0dXJlXCIpO1xyXG5cdHZhciBzaWduYXR1cmU9a2ZzLnJlYWRVVEY4U3RyaW5nKHRoaXMuaGFuZGxlLHBvcywxKTtcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1ZyhzaWduYXR1cmUsc2lnbmF0dXJlLmNoYXJDb2RlQXQoMCkpO1xyXG5cdGNiLmFwcGx5KHRoaXMsW3NpZ25hdHVyZV0pO1xyXG59XHJcbnZhciByZWFkSTMyPWZ1bmN0aW9uKHBvcyxjYikge1xyXG5cdGlmICh2ZXJib3NlKSBjb25zb2xlLmRlYnVnKFwicmVhZCBpMzIgYXQgXCIrcG9zKTtcclxuXHR2YXIgaTMyPWtmcy5yZWFkSW50MzIodGhpcy5oYW5kbGUscG9zKTtcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1ZyhpMzIpO1xyXG5cdGNiLmFwcGx5KHRoaXMsW2kzMl0pO1x0XHJcbn1cclxudmFyIHJlYWRVSTMyPWZ1bmN0aW9uKHBvcyxjYikge1xyXG5cdGlmICh2ZXJib3NlKSBjb25zb2xlLmRlYnVnKFwicmVhZCB1aTMyIGF0IFwiK3Bvcyk7XHJcblx0dmFyIHVpMzI9a2ZzLnJlYWRVSW50MzIodGhpcy5oYW5kbGUscG9zKTtcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1Zyh1aTMyKTtcclxuXHRjYi5hcHBseSh0aGlzLFt1aTMyXSk7XHJcbn1cclxudmFyIHJlYWRVSTg9ZnVuY3Rpb24ocG9zLGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoXCJyZWFkIHVpOCBhdCBcIitwb3MpOyBcclxuXHR2YXIgdWk4PWtmcy5yZWFkVUludDgodGhpcy5oYW5kbGUscG9zKTtcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1Zyh1aTgpO1xyXG5cdGNiLmFwcGx5KHRoaXMsW3VpOF0pO1xyXG59XHJcbnZhciByZWFkQnVmPWZ1bmN0aW9uKHBvcyxibG9ja3NpemUsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1ZyhcInJlYWQgYnVmZmVyIGF0IFwiK3BvcysgXCIgYmxvY2tzaXplIFwiK2Jsb2Nrc2l6ZSk7XHJcblx0dmFyIGJ1Zj1rZnMucmVhZEJ1Zih0aGlzLmhhbmRsZSxwb3MsYmxvY2tzaXplKTtcclxuXHR2YXIgYnVmZj1KU09OLnBhcnNlKGJ1Zik7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoXCJidWZmZXIgbGVuZ3RoXCIrYnVmZi5sZW5ndGgpO1xyXG5cdGNiLmFwcGx5KHRoaXMsW2J1ZmZdKTtcdFxyXG59XHJcbnZhciByZWFkQnVmX3BhY2tlZGludD1mdW5jdGlvbihwb3MsYmxvY2tzaXplLGNvdW50LHJlc2V0LGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoXCJyZWFkIHBhY2tlZCBpbnQgYXQgXCIrcG9zK1wiIGJsb2Nrc2l6ZSBcIitibG9ja3NpemUrXCIgY291bnQgXCIrY291bnQpO1xyXG5cdHZhciBidWY9a2ZzLnJlYWRCdWZfcGFja2VkaW50KHRoaXMuaGFuZGxlLHBvcyxibG9ja3NpemUsY291bnQscmVzZXQpO1xyXG5cdHZhciBhZHY9cGFyc2VJbnQoYnVmKTtcclxuXHR2YXIgYnVmZj1KU09OLnBhcnNlKGJ1Zi5zdWJzdHIoYnVmLmluZGV4T2YoXCJbXCIpKSk7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoXCJwYWNrZWRJbnQgbGVuZ3RoIFwiK2J1ZmYubGVuZ3RoK1wiIGZpcnN0IGl0ZW09XCIrYnVmZlswXSk7XHJcblx0Y2IuYXBwbHkodGhpcyxbe2RhdGE6YnVmZixhZHY6YWR2fV0pO1x0XHJcbn1cclxuXHJcblxyXG52YXIgcmVhZFN0cmluZz0gZnVuY3Rpb24ocG9zLGJsb2Nrc2l6ZSxlbmNvZGluZyxjYikge1xyXG5cdGlmICh2ZXJib3NlKSBjb25zb2xlLmRlYnVnKFwicmVhZHN0cmluZyBhdCBcIitwb3MrXCIgYmxvY2tzaXplIFwiICtibG9ja3NpemUrXCIgZW5jOlwiK2VuY29kaW5nKTtcclxuXHRpZiAoZW5jb2Rpbmc9PVwidWNzMlwiKSB7XHJcblx0XHR2YXIgc3RyPWtmcy5yZWFkVUxFMTZTdHJpbmcodGhpcy5oYW5kbGUscG9zLGJsb2Nrc2l6ZSk7XHJcblx0fSBlbHNlIHtcclxuXHRcdHZhciBzdHI9a2ZzLnJlYWRVVEY4U3RyaW5nKHRoaXMuaGFuZGxlLHBvcyxibG9ja3NpemUpO1x0XHJcblx0fVx0IFxyXG5cdGlmICh2ZXJib3NlKSBjb25zb2xlLmRlYnVnKHN0cik7XHJcblx0Y2IuYXBwbHkodGhpcyxbc3RyXSk7XHRcclxufVxyXG5cclxudmFyIHJlYWRGaXhlZEFycmF5ID0gZnVuY3Rpb24ocG9zICxjb3VudCwgdW5pdHNpemUsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1ZyhcInJlYWQgZml4ZWQgYXJyYXkgYXQgXCIrcG9zK1wiIGNvdW50IFwiK2NvdW50K1wiIHVuaXRzaXplIFwiK3VuaXRzaXplKTsgXHJcblx0dmFyIGJ1Zj1rZnMucmVhZEZpeGVkQXJyYXkodGhpcy5oYW5kbGUscG9zLGNvdW50LHVuaXRzaXplKTtcclxuXHR2YXIgYnVmZj1KU09OLnBhcnNlKGJ1Zik7XHJcblx0aWYgKHZlcmJvc2UpIGNvbnNvbGUuZGVidWcoXCJhcnJheSBsZW5ndGhcIitidWZmLmxlbmd0aCk7XHJcblx0Y2IuYXBwbHkodGhpcyxbYnVmZl0pO1x0XHJcbn1cclxudmFyIHJlYWRTdHJpbmdBcnJheSA9IGZ1bmN0aW9uKHBvcyxibG9ja3NpemUsZW5jb2RpbmcsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5sb2coXCJyZWFkIFN0cmluZyBhcnJheSBhdCBcIitwb3MrXCIgYmxvY2tzaXplIFwiK2Jsb2Nrc2l6ZSArXCIgZW5jIFwiK2VuY29kaW5nKTsgXHJcblx0ZW5jb2RpbmcgPSBlbmNvZGluZ3x8XCJ1dGY4XCI7XHJcblx0dmFyIGJ1Zj1rZnMucmVhZFN0cmluZ0FycmF5KHRoaXMuaGFuZGxlLHBvcyxibG9ja3NpemUsZW5jb2RpbmcpO1xyXG5cdC8vdmFyIGJ1ZmY9SlNPTi5wYXJzZShidWYpO1xyXG5cdGlmICh2ZXJib3NlKSBjb25zb2xlLmRlYnVnKFwicmVhZCBzdHJpbmcgYXJyYXlcIik7XHJcblx0dmFyIGJ1ZmY9YnVmLnNwbGl0KFwiXFx1ZmZmZlwiKTsgLy9jYW5ub3QgcmV0dXJuIHN0cmluZyB3aXRoIDBcclxuXHRpZiAodmVyYm9zZSkgY29uc29sZS5kZWJ1ZyhcImFycmF5IGxlbmd0aFwiK2J1ZmYubGVuZ3RoKTtcclxuXHRjYi5hcHBseSh0aGlzLFtidWZmXSk7XHRcclxufVxyXG52YXIgbWVyZ2VQb3N0aW5ncz1mdW5jdGlvbihwb3NpdGlvbnMsY2IpIHtcclxuXHR2YXIgYnVmPWtmcy5tZXJnZVBvc3RpbmdzKHRoaXMuaGFuZGxlLEpTT04uc3RyaW5naWZ5KHBvc2l0aW9ucykpO1xyXG5cdGlmICghYnVmIHx8IGJ1Zi5sZW5ndGg9PTApIHJldHVybiBbXTtcclxuXHRlbHNlIHJldHVybiBKU09OLnBhcnNlKGJ1Zik7XHJcbn1cclxuXHJcbnZhciBmcmVlPWZ1bmN0aW9uKCkge1xyXG5cdC8vY29uc29sZS5sb2coJ2Nsb3NpbmcgJyxoYW5kbGUpO1xyXG5cdGtmcy5jbG9zZSh0aGlzLmhhbmRsZSk7XHJcbn1cclxudmFyIE9wZW49ZnVuY3Rpb24ocGF0aCxvcHRzLGNiKSB7XHJcblx0b3B0cz1vcHRzfHx7fTtcclxuXHR2YXIgc2lnbmF0dXJlX3NpemU9MTtcclxuXHR2YXIgc2V0dXBhcGk9ZnVuY3Rpb24oKSB7IFxyXG5cdFx0dGhpcy5yZWFkU2lnbmF0dXJlPXJlYWRTaWduYXR1cmU7XHJcblx0XHR0aGlzLnJlYWRJMzI9cmVhZEkzMjtcclxuXHRcdHRoaXMucmVhZFVJMzI9cmVhZFVJMzI7XHJcblx0XHR0aGlzLnJlYWRVSTg9cmVhZFVJODtcclxuXHRcdHRoaXMucmVhZEJ1Zj1yZWFkQnVmO1xyXG5cdFx0dGhpcy5yZWFkQnVmX3BhY2tlZGludD1yZWFkQnVmX3BhY2tlZGludDtcclxuXHRcdHRoaXMucmVhZEZpeGVkQXJyYXk9cmVhZEZpeGVkQXJyYXk7XHJcblx0XHR0aGlzLnJlYWRTdHJpbmc9cmVhZFN0cmluZztcclxuXHRcdHRoaXMucmVhZFN0cmluZ0FycmF5PXJlYWRTdHJpbmdBcnJheTtcclxuXHRcdHRoaXMuc2lnbmF0dXJlX3NpemU9c2lnbmF0dXJlX3NpemU7XHJcblx0XHR0aGlzLm1lcmdlUG9zdGluZ3M9bWVyZ2VQb3N0aW5ncztcclxuXHRcdHRoaXMuZnJlZT1mcmVlO1xyXG5cdFx0dGhpcy5zaXplPWtmcy5nZXRGaWxlU2l6ZSh0aGlzLmhhbmRsZSk7XHJcblx0XHRpZiAodmVyYm9zZSkgY29uc29sZS5sb2coXCJmaWxlc2l6ZSAgXCIrdGhpcy5zaXplKTtcclxuXHRcdGlmIChjYilcdGNiLmNhbGwodGhpcyk7XHJcblx0fVxyXG5cclxuXHR0aGlzLmhhbmRsZT1rZnMub3BlbihwYXRoKTtcclxuXHR0aGlzLm9wZW5lZD10cnVlO1xyXG5cdHNldHVwYXBpLmNhbGwodGhpcyk7XHJcblx0cmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzPU9wZW47IiwiLypcclxuICBKU0NvbnRleHQgY2FuIHJldHVybiBhbGwgSmF2YXNjcmlwdCB0eXBlcy5cclxuKi9cclxudmFyIHZlcmJvc2U9MTtcclxuXHJcbnZhciByZWFkU2lnbmF0dXJlPWZ1bmN0aW9uKHBvcyxjYikge1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKFwicmVhZCBzaWduYXR1cmUgYXQgXCIrcG9zKTtcclxuXHR2YXIgc2lnbmF0dXJlPWtmcy5yZWFkVVRGOFN0cmluZyh0aGlzLmhhbmRsZSxwb3MsMSk7XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coc2lnbmF0dXJlK1wiIFwiK3NpZ25hdHVyZS5jaGFyQ29kZUF0KDApKTtcclxuXHRjYi5hcHBseSh0aGlzLFtzaWduYXR1cmVdKTtcclxufVxyXG52YXIgcmVhZEkzMj1mdW5jdGlvbihwb3MsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcInJlYWQgaTMyIGF0IFwiK3Bvcyk7XHJcblx0dmFyIGkzMj1rZnMucmVhZEludDMyKHRoaXMuaGFuZGxlLHBvcyk7XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coaTMyKTtcclxuXHRjYi5hcHBseSh0aGlzLFtpMzJdKTtcdFxyXG59XHJcbnZhciByZWFkVUkzMj1mdW5jdGlvbihwb3MsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcInJlYWQgdWkzMiBhdCBcIitwb3MpO1xyXG5cdHZhciB1aTMyPWtmcy5yZWFkVUludDMyKHRoaXMuaGFuZGxlLHBvcyk7XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2codWkzMik7XHJcblx0Y2IuYXBwbHkodGhpcyxbdWkzMl0pO1xyXG59XHJcbnZhciByZWFkVUk4PWZ1bmN0aW9uKHBvcyxjYikge1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKFwicmVhZCB1aTggYXQgXCIrcG9zKTsgXHJcblx0dmFyIHVpOD1rZnMucmVhZFVJbnQ4KHRoaXMuaGFuZGxlLHBvcyk7XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2codWk4KTtcclxuXHRjYi5hcHBseSh0aGlzLFt1aThdKTtcclxufVxyXG52YXIgcmVhZEJ1Zj1mdW5jdGlvbihwb3MsYmxvY2tzaXplLGNiKSB7XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coXCJyZWFkIGJ1ZmZlciBhdCBcIitwb3MpO1xyXG5cdHZhciBidWY9a2ZzLnJlYWRCdWYodGhpcy5oYW5kbGUscG9zLGJsb2Nrc2l6ZSk7XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coXCJidWZmZXIgbGVuZ3RoXCIrYnVmLmxlbmd0aCk7XHJcblx0Y2IuYXBwbHkodGhpcyxbYnVmXSk7XHRcclxufVxyXG52YXIgcmVhZEJ1Zl9wYWNrZWRpbnQ9ZnVuY3Rpb24ocG9zLGJsb2Nrc2l6ZSxjb3VudCxyZXNldCxjYikge1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKFwicmVhZCBwYWNrZWQgaW50IGZhc3QsIGJsb2Nrc2l6ZSBcIitibG9ja3NpemUrXCIgYXQgXCIrcG9zKTt2YXIgdD1uZXcgRGF0ZSgpO1xyXG5cdHZhciBidWY9a2ZzLnJlYWRCdWZfcGFja2VkaW50KHRoaXMuaGFuZGxlLHBvcyxibG9ja3NpemUsY291bnQscmVzZXQpO1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKFwicmV0dXJuIGZyb20gcGFja2VkaW50LCB0aW1lXCIgKyAobmV3IERhdGUoKS10KSk7XHJcblx0aWYgKHR5cGVvZiBidWYuZGF0YT09XCJzdHJpbmdcIikge1xyXG5cdFx0YnVmLmRhdGE9ZXZhbChcIltcIitidWYuZGF0YS5zdWJzdHIoMCxidWYuZGF0YS5sZW5ndGgtMSkrXCJdXCIpO1xyXG5cdH1cclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcInVucGFja2VkIGxlbmd0aFwiK2J1Zi5kYXRhLmxlbmd0aCtcIiB0aW1lXCIgKyAobmV3IERhdGUoKS10KSApO1xyXG5cdGNiLmFwcGx5KHRoaXMsW2J1Zl0pO1xyXG59XHJcblxyXG5cclxudmFyIHJlYWRTdHJpbmc9IGZ1bmN0aW9uKHBvcyxibG9ja3NpemUsZW5jb2RpbmcsY2IpIHtcclxuXHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coXCJyZWFkc3RyaW5nIGF0IFwiK3BvcytcIiBibG9ja3NpemUgXCIrYmxvY2tzaXplK1wiIFwiK2VuY29kaW5nKTt2YXIgdD1uZXcgRGF0ZSgpO1xyXG5cdGlmIChlbmNvZGluZz09XCJ1Y3MyXCIpIHtcclxuXHRcdHZhciBzdHI9a2ZzLnJlYWRVTEUxNlN0cmluZyh0aGlzLmhhbmRsZSxwb3MsYmxvY2tzaXplKTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0dmFyIHN0cj1rZnMucmVhZFVURjhTdHJpbmcodGhpcy5oYW5kbGUscG9zLGJsb2Nrc2l6ZSk7XHRcclxuXHR9XHJcblx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coc3RyK1wiIHRpbWVcIisobmV3IERhdGUoKS10KSk7XHJcblx0Y2IuYXBwbHkodGhpcyxbc3RyXSk7XHRcclxufVxyXG5cclxudmFyIHJlYWRGaXhlZEFycmF5ID0gZnVuY3Rpb24ocG9zICxjb3VudCwgdW5pdHNpemUsY2IpIHtcclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcInJlYWQgZml4ZWQgYXJyYXkgYXQgXCIrcG9zKTsgdmFyIHQ9bmV3IERhdGUoKTtcclxuXHR2YXIgYnVmPWtmcy5yZWFkRml4ZWRBcnJheSh0aGlzLmhhbmRsZSxwb3MsY291bnQsdW5pdHNpemUpO1xyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKFwiYXJyYXkgbGVuZ3RoIFwiK2J1Zi5sZW5ndGgrXCIgdGltZVwiKyhuZXcgRGF0ZSgpLXQpKTtcclxuXHRjYi5hcHBseSh0aGlzLFtidWZdKTtcdFxyXG59XHJcbnZhciByZWFkU3RyaW5nQXJyYXkgPSBmdW5jdGlvbihwb3MsYmxvY2tzaXplLGVuY29kaW5nLGNiKSB7XHJcblx0Ly9pZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcInJlYWQgU3RyaW5nIGFycmF5IFwiK2Jsb2Nrc2l6ZSArXCIgXCIrZW5jb2RpbmcpOyBcclxuXHRlbmNvZGluZyA9IGVuY29kaW5nfHxcInV0ZjhcIjtcclxuXHRpZiAodmVyYm9zZSkgIGtzYW5hZ2FwLmxvZyhcInJlYWQgc3RyaW5nIGFycmF5IGF0IFwiK3Bvcyk7dmFyIHQ9bmV3IERhdGUoKTtcclxuXHR2YXIgYnVmPWtmcy5yZWFkU3RyaW5nQXJyYXkodGhpcy5oYW5kbGUscG9zLGJsb2Nrc2l6ZSxlbmNvZGluZyk7XHJcblx0aWYgKHR5cGVvZiBidWY9PVwic3RyaW5nXCIpIGJ1Zj1idWYuc3BsaXQoXCJcXDBcIik7XHJcblx0Ly92YXIgYnVmZj1KU09OLnBhcnNlKGJ1Zik7XHJcblx0Ly92YXIgYnVmZj1idWYuc3BsaXQoXCJcXHVmZmZmXCIpOyAvL2Nhbm5vdCByZXR1cm4gc3RyaW5nIHdpdGggMFxyXG5cdGlmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKFwic3RyaW5nIGFycmF5IGxlbmd0aFwiK2J1Zi5sZW5ndGgrXCIgdGltZVwiKyhuZXcgRGF0ZSgpLXQpKTtcclxuXHRjYi5hcHBseSh0aGlzLFtidWZdKTtcclxufVxyXG5cclxudmFyIG1lcmdlUG9zdGluZ3M9ZnVuY3Rpb24ocG9zaXRpb25zKSB7XHJcblx0dmFyIGJ1Zj1rZnMubWVyZ2VQb3N0aW5ncyh0aGlzLmhhbmRsZSxwb3NpdGlvbnMpO1xyXG5cdGlmICh0eXBlb2YgYnVmPT1cInN0cmluZ1wiKSB7XHJcblx0XHRidWY9ZXZhbChcIltcIitidWYuc3Vic3RyKDAsYnVmLmxlbmd0aC0xKStcIl1cIik7XHJcblx0fVxyXG5cdHJldHVybiBidWY7XHJcbn1cclxudmFyIGZyZWU9ZnVuY3Rpb24oKSB7XHJcblx0Ly8vL2lmICh2ZXJib3NlKSAga3NhbmFnYXAubG9nKCdjbG9zaW5nICcsaGFuZGxlKTtcclxuXHRrZnMuY2xvc2UodGhpcy5oYW5kbGUpO1xyXG59XHJcbnZhciBPcGVuPWZ1bmN0aW9uKHBhdGgsb3B0cyxjYikge1xyXG5cdG9wdHM9b3B0c3x8e307XHJcblx0dmFyIHNpZ25hdHVyZV9zaXplPTE7XHJcblx0dmFyIHNldHVwYXBpPWZ1bmN0aW9uKCkgeyBcclxuXHRcdHRoaXMucmVhZFNpZ25hdHVyZT1yZWFkU2lnbmF0dXJlO1xyXG5cdFx0dGhpcy5yZWFkSTMyPXJlYWRJMzI7XHJcblx0XHR0aGlzLnJlYWRVSTMyPXJlYWRVSTMyO1xyXG5cdFx0dGhpcy5yZWFkVUk4PXJlYWRVSTg7XHJcblx0XHR0aGlzLnJlYWRCdWY9cmVhZEJ1ZjtcclxuXHRcdHRoaXMucmVhZEJ1Zl9wYWNrZWRpbnQ9cmVhZEJ1Zl9wYWNrZWRpbnQ7XHJcblx0XHR0aGlzLnJlYWRGaXhlZEFycmF5PXJlYWRGaXhlZEFycmF5O1xyXG5cdFx0dGhpcy5yZWFkU3RyaW5nPXJlYWRTdHJpbmc7XHJcblx0XHR0aGlzLnJlYWRTdHJpbmdBcnJheT1yZWFkU3RyaW5nQXJyYXk7XHJcblx0XHR0aGlzLnNpZ25hdHVyZV9zaXplPXNpZ25hdHVyZV9zaXplO1xyXG5cdFx0dGhpcy5tZXJnZVBvc3RpbmdzPW1lcmdlUG9zdGluZ3M7XHJcblx0XHR0aGlzLmZyZWU9ZnJlZTtcclxuXHRcdHRoaXMuc2l6ZT1rZnMuZ2V0RmlsZVNpemUodGhpcy5oYW5kbGUpO1xyXG5cdFx0aWYgKHZlcmJvc2UpICBrc2FuYWdhcC5sb2coXCJmaWxlc2l6ZSAgXCIrdGhpcy5zaXplKTtcclxuXHRcdGlmIChjYilcdGNiLmNhbGwodGhpcyk7XHJcblx0fVxyXG5cclxuXHR0aGlzLmhhbmRsZT1rZnMub3BlbihwYXRoKTtcclxuXHR0aGlzLm9wZW5lZD10cnVlO1xyXG5cdHNldHVwYXBpLmNhbGwodGhpcyk7XHJcblx0cmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzPU9wZW47IiwiLypcclxuICBUT0RPXHJcbiAgYW5kIG5vdFxyXG5cclxuKi9cclxuXHJcbi8vIGh0dHA6Ly9qc2ZpZGRsZS5uZXQvbmVvc3dmL2FYeld3L1xyXG52YXIgcGxpc3Q9cmVxdWlyZSgnLi9wbGlzdCcpO1xyXG5mdW5jdGlvbiBpbnRlcnNlY3QoSSwgSikge1xyXG4gIHZhciBpID0gaiA9IDA7XHJcbiAgdmFyIHJlc3VsdCA9IFtdO1xyXG5cclxuICB3aGlsZSggaSA8IEkubGVuZ3RoICYmIGogPCBKLmxlbmd0aCApe1xyXG4gICAgIGlmICAgICAgKElbaV0gPCBKW2pdKSBpKys7IFxyXG4gICAgIGVsc2UgaWYgKElbaV0gPiBKW2pdKSBqKys7IFxyXG4gICAgIGVsc2Uge1xyXG4gICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdPWxbaV07XHJcbiAgICAgICBpKys7aisrO1xyXG4gICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuLyogcmV0dXJuIGFsbCBpdGVtcyBpbiBJIGJ1dCBub3QgaW4gSiAqL1xyXG5mdW5jdGlvbiBzdWJ0cmFjdChJLCBKKSB7XHJcbiAgdmFyIGkgPSBqID0gMDtcclxuICB2YXIgcmVzdWx0ID0gW107XHJcblxyXG4gIHdoaWxlKCBpIDwgSS5sZW5ndGggJiYgaiA8IEoubGVuZ3RoICl7XHJcbiAgICBpZiAoSVtpXT09SltqXSkge1xyXG4gICAgICBpKys7aisrO1xyXG4gICAgfSBlbHNlIGlmIChJW2ldPEpbal0pIHtcclxuICAgICAgd2hpbGUgKElbaV08SltqXSkgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdPSBJW2krK107XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB3aGlsZShKW2pdPElbaV0pIGorKztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmIChqPT1KLmxlbmd0aCkge1xyXG4gICAgd2hpbGUgKGk8SS5sZW5ndGgpIHJlc3VsdFtyZXN1bHQubGVuZ3RoXT1JW2krK107XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG52YXIgdW5pb249ZnVuY3Rpb24oYSxiKSB7XHJcblx0aWYgKCFhIHx8ICFhLmxlbmd0aCkgcmV0dXJuIGI7XHJcblx0aWYgKCFiIHx8ICFiLmxlbmd0aCkgcmV0dXJuIGE7XHJcbiAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICB2YXIgYWkgPSAwO1xyXG4gICAgdmFyIGJpID0gMDtcclxuICAgIHdoaWxlICh0cnVlKSB7XHJcbiAgICAgICAgaWYgKCBhaSA8IGEubGVuZ3RoICYmIGJpIDwgYi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgaWYgKGFbYWldIDwgYltiaV0pIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXT1hW2FpXTtcclxuICAgICAgICAgICAgICAgIGFpKys7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYVthaV0gPiBiW2JpXSkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdPWJbYmldO1xyXG4gICAgICAgICAgICAgICAgYmkrKztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXT1hW2FpXTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXT1iW2JpXTtcclxuICAgICAgICAgICAgICAgIGFpKys7XHJcbiAgICAgICAgICAgICAgICBiaSsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChhaSA8IGEubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgYS5zbGljZShhaSwgYS5sZW5ndGgpKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfSBlbHNlIGlmIChiaSA8IGIubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoLmFwcGx5KHJlc3VsdCwgYi5zbGljZShiaSwgYi5sZW5ndGgpKTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG52YXIgT1BFUkFUSU9OPXsnaW5jbHVkZSc6aW50ZXJzZWN0LCAndW5pb24nOnVuaW9uLCAnZXhjbHVkZSc6c3VidHJhY3R9O1xyXG5cclxudmFyIGJvb2xTZWFyY2g9ZnVuY3Rpb24ob3B0cykge1xyXG4gIG9wdHM9b3B0c3x8e307XHJcbiAgb3BzPW9wdHMub3B8fHRoaXMub3B0cy5vcDtcclxuICB0aGlzLmRvY3M9W107XHJcblx0aWYgKCF0aGlzLnBocmFzZXMubGVuZ3RoKSByZXR1cm47XHJcblx0dmFyIHI9dGhpcy5waHJhc2VzWzBdLmRvY3M7XHJcbiAgLyogaWdub3JlIG9wZXJhdG9yIG9mIGZpcnN0IHBocmFzZSAqL1xyXG5cdGZvciAodmFyIGk9MTtpPHRoaXMucGhyYXNlcy5sZW5ndGg7aSsrKSB7XHJcblx0XHR2YXIgb3A9IG9wc1tpXSB8fCAndW5pb24nO1xyXG5cdFx0cj1PUEVSQVRJT05bb3BdKHIsdGhpcy5waHJhc2VzW2ldLmRvY3MpO1xyXG5cdH1cclxuXHR0aGlzLmRvY3M9cGxpc3QudW5pcXVlKHIpO1xyXG5cdHJldHVybiB0aGlzO1xyXG59XHJcbm1vZHVsZS5leHBvcnRzPXtzZWFyY2g6Ym9vbFNlYXJjaH0iLCJ2YXIgcGxpc3Q9cmVxdWlyZShcIi4vcGxpc3RcIik7XHJcblxyXG52YXIgZ2V0UGhyYXNlV2lkdGhzPWZ1bmN0aW9uIChRLHBocmFzZWlkLHZwb3NzKSB7XHJcblx0dmFyIHJlcz1bXTtcclxuXHRmb3IgKHZhciBpIGluIHZwb3NzKSB7XHJcblx0XHRyZXMucHVzaChnZXRQaHJhc2VXaWR0aChRLHBocmFzZWlkLHZwb3NzW2ldKSk7XHJcblx0fVxyXG5cdHJldHVybiByZXM7XHJcbn1cclxudmFyIGdldFBocmFzZVdpZHRoPWZ1bmN0aW9uIChRLHBocmFzZWlkLHZwb3MpIHtcclxuXHR2YXIgUD1RLnBocmFzZXNbcGhyYXNlaWRdO1xyXG5cdHZhciB3aWR0aD0wLHZhcndpZHRoPWZhbHNlO1xyXG5cdGlmIChQLndpZHRoKSByZXR1cm4gUC53aWR0aDsgLy8gbm8gd2lsZGNhcmRcclxuXHRpZiAoUC50ZXJtaWQubGVuZ3RoPDIpIHJldHVybiBQLnRlcm1sZW5ndGhbMF07XHJcblx0dmFyIGxhc3R0ZXJtcG9zdGluZz1RLnRlcm1zW1AudGVybWlkW1AudGVybWlkLmxlbmd0aC0xXV0ucG9zdGluZztcclxuXHJcblx0Zm9yICh2YXIgaSBpbiBQLnRlcm1pZCkge1xyXG5cdFx0dmFyIFQ9US50ZXJtc1tQLnRlcm1pZFtpXV07XHJcblx0XHRpZiAoVC5vcD09J3dpbGRjYXJkJykge1xyXG5cdFx0XHR3aWR0aCs9VC53aWR0aDtcclxuXHRcdFx0aWYgKFQud2lsZGNhcmQ9PScqJykgdmFyd2lkdGg9dHJ1ZTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHdpZHRoKz1QLnRlcm1sZW5ndGhbaV07XHJcblx0XHR9XHJcblx0fVxyXG5cdGlmICh2YXJ3aWR0aCkgeyAvL3dpZHRoIG1pZ2h0IGJlIHNtYWxsZXIgZHVlIHRvICogd2lsZGNhcmRcclxuXHRcdHZhciBhdD1wbGlzdC5pbmRleE9mU29ydGVkKGxhc3R0ZXJtcG9zdGluZyx2cG9zKTtcclxuXHRcdHZhciBlbmRwb3M9bGFzdHRlcm1wb3N0aW5nW2F0XTtcclxuXHRcdGlmIChlbmRwb3MtdnBvczx3aWR0aCkgd2lkdGg9ZW5kcG9zLXZwb3MrMTtcclxuXHR9XHJcblxyXG5cdHJldHVybiB3aWR0aDtcclxufVxyXG4vKiByZXR1cm4gW3Zwb3MsIHBocmFzZWlkLCBwaHJhc2V3aWR0aCwgb3B0aW9uYWxfdGFnbmFtZV0gYnkgc2xvdCByYW5nZSovXHJcbnZhciBoaXRJblJhbmdlPWZ1bmN0aW9uKFEsc3RhcnR2cG9zLGVuZHZwb3MpIHtcclxuXHR2YXIgcmVzPVtdO1xyXG5cdGlmICghUSB8fCAhUS5yYXdyZXN1bHQgfHwgIVEucmF3cmVzdWx0Lmxlbmd0aCkgcmV0dXJuIHJlcztcclxuXHRmb3IgKHZhciBpPTA7aTxRLnBocmFzZXMubGVuZ3RoO2krKykge1xyXG5cdFx0dmFyIFA9US5waHJhc2VzW2ldO1xyXG5cdFx0aWYgKCFQLnBvc3RpbmcpIGNvbnRpbnVlO1xyXG5cdFx0dmFyIHM9cGxpc3QuaW5kZXhPZlNvcnRlZChQLnBvc3Rpbmcsc3RhcnR2cG9zKTtcclxuXHRcdHZhciBlPXBsaXN0LmluZGV4T2ZTb3J0ZWQoUC5wb3N0aW5nLGVuZHZwb3MpO1xyXG5cdFx0dmFyIHI9UC5wb3N0aW5nLnNsaWNlKHMsZSsxKTtcclxuXHRcdHZhciB3aWR0aD1nZXRQaHJhc2VXaWR0aHMoUSxpLHIpO1xyXG5cclxuXHRcdHJlcz1yZXMuY29uY2F0KHIubWFwKGZ1bmN0aW9uKHZwb3MsaWR4KXsgcmV0dXJuIFt2cG9zLHdpZHRoW2lkeF0saV0gfSkpO1xyXG5cdH1cclxuXHQvLyBvcmRlciBieSB2cG9zLCBpZiB2cG9zIGlzIHRoZSBzYW1lLCBsYXJnZXIgd2lkdGggY29tZSBmaXJzdC5cclxuXHQvLyBzbyB0aGUgb3V0cHV0IHdpbGwgYmVcclxuXHQvLyA8dGFnMT48dGFnMj5vbmU8L3RhZzI+dHdvPC90YWcxPlxyXG5cdC8vVE9ETywgbWlnaHQgY2F1c2Ugb3ZlcmxhcCBpZiBzYW1lIHZwb3MgYW5kIHNhbWUgd2lkdGhcclxuXHQvL25lZWQgdG8gY2hlY2sgdGFnIG5hbWVcclxuXHRyZXMuc29ydChmdW5jdGlvbihhLGIpe3JldHVybiBhWzBdPT1iWzBdPyBiWzFdLWFbMV0gOmFbMF0tYlswXX0pO1xyXG5cclxuXHRyZXR1cm4gcmVzO1xyXG59XHJcblxyXG52YXIgdGFnc0luUmFuZ2U9ZnVuY3Rpb24oUSxyZW5kZXJUYWdzLHN0YXJ0dnBvcyxlbmR2cG9zKSB7XHJcblx0dmFyIHJlcz1bXTtcclxuXHRpZiAodHlwZW9mIHJlbmRlclRhZ3M9PVwic3RyaW5nXCIpIHJlbmRlclRhZ3M9W3JlbmRlclRhZ3NdO1xyXG5cclxuXHRyZW5kZXJUYWdzLm1hcChmdW5jdGlvbih0YWcpe1xyXG5cdFx0dmFyIHN0YXJ0cz1RLmVuZ2luZS5nZXQoW1wiZmllbGRzXCIsdGFnK1wiX3N0YXJ0XCJdKTtcclxuXHRcdHZhciBlbmRzPVEuZW5naW5lLmdldChbXCJmaWVsZHNcIix0YWcrXCJfZW5kXCJdKTtcclxuXHRcdGlmICghc3RhcnRzKSByZXR1cm47XHJcblxyXG5cdFx0dmFyIHM9cGxpc3QuaW5kZXhPZlNvcnRlZChzdGFydHMsc3RhcnR2cG9zKTtcclxuXHRcdHZhciBlPXM7XHJcblx0XHR3aGlsZSAoZTxzdGFydHMubGVuZ3RoICYmIHN0YXJ0c1tlXTxlbmR2cG9zKSBlKys7XHJcblx0XHR2YXIgb3BlbnRhZ3M9c3RhcnRzLnNsaWNlKHMsZSk7XHJcblxyXG5cdFx0cz1wbGlzdC5pbmRleE9mU29ydGVkKGVuZHMsc3RhcnR2cG9zKTtcclxuXHRcdGU9cztcclxuXHRcdHdoaWxlIChlPGVuZHMubGVuZ3RoICYmIGVuZHNbZV08ZW5kdnBvcykgZSsrO1xyXG5cdFx0dmFyIGNsb3NldGFncz1lbmRzLnNsaWNlKHMsZSk7XHJcblxyXG5cdFx0b3BlbnRhZ3MubWFwKGZ1bmN0aW9uKHN0YXJ0LGlkeCkge1xyXG5cdFx0XHRyZXMucHVzaChbc3RhcnQsY2xvc2V0YWdzW2lkeF0tc3RhcnQsdGFnXSk7XHJcblx0XHR9KVxyXG5cdH0pO1xyXG5cdC8vIG9yZGVyIGJ5IHZwb3MsIGlmIHZwb3MgaXMgdGhlIHNhbWUsIGxhcmdlciB3aWR0aCBjb21lIGZpcnN0LlxyXG5cdHJlcy5zb3J0KGZ1bmN0aW9uKGEsYil7cmV0dXJuIGFbMF09PWJbMF0/IGJbMV0tYVsxXSA6YVswXS1iWzBdfSk7XHJcblxyXG5cdHJldHVybiByZXM7XHJcbn1cclxuXHJcbi8qXHJcbmdpdmVuIGEgdnBvcyByYW5nZSBzdGFydCwgZmlsZSwgY29udmVydCB0byBmaWxlc3RhcnQsIGZpbGVlbmRcclxuICAgZmlsZXN0YXJ0IDogc3RhcnRpbmcgZmlsZVxyXG4gICBzdGFydCAgIDogdnBvcyBzdGFydFxyXG4gICBzaG93ZmlsZTogaG93IG1hbnkgZmlsZXMgdG8gZGlzcGxheVxyXG4gICBzaG93cGFnZTogaG93IG1hbnkgcGFnZXMgdG8gZGlzcGxheVxyXG5cclxub3V0cHV0OlxyXG4gICBhcnJheSBvZiBmaWxlaWQgd2l0aCBoaXRzXHJcbiovXHJcbnZhciBnZXRGaWxlV2l0aEhpdHM9ZnVuY3Rpb24oZW5naW5lLFEscmFuZ2UpIHtcclxuXHR2YXIgZmlsZU9mZnNldHM9ZW5naW5lLmdldChcImZpbGVvZmZzZXRzXCIpO1xyXG5cdHZhciBvdXQ9W10sZmlsZWNvdW50PTEwMDtcclxuXHR2YXIgc3RhcnQ9MCAsIGVuZD1RLmJ5RmlsZS5sZW5ndGg7XHJcblx0US5leGNlcnB0T3ZlcmZsb3c9ZmFsc2U7XHJcblx0aWYgKHJhbmdlLnN0YXJ0KSB7XHJcblx0XHR2YXIgZmlyc3Q9cmFuZ2Uuc3RhcnQgO1xyXG5cdFx0dmFyIGxhc3Q9cmFuZ2UuZW5kO1xyXG5cdFx0aWYgKCFsYXN0KSBsYXN0PU51bWJlci5NQVhfU0FGRV9JTlRFR0VSO1xyXG5cdFx0Zm9yICh2YXIgaT0wO2k8ZmlsZU9mZnNldHMubGVuZ3RoO2krKykge1xyXG5cdFx0XHQvL2lmIChmaWxlT2Zmc2V0c1tpXT5maXJzdCkgYnJlYWs7XHJcblx0XHRcdGlmIChmaWxlT2Zmc2V0c1tpXT5sYXN0KSB7XHJcblx0XHRcdFx0ZW5kPWk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGZpbGVPZmZzZXRzW2ldPGZpcnN0KSBzdGFydD1pO1xyXG5cdFx0fVx0XHRcclxuXHR9IGVsc2Uge1xyXG5cdFx0c3RhcnQ9cmFuZ2UuZmlsZXN0YXJ0IHx8IDA7XHJcblx0XHRpZiAocmFuZ2UubWF4ZmlsZSkge1xyXG5cdFx0XHRmaWxlY291bnQ9cmFuZ2UubWF4ZmlsZTtcclxuXHRcdH0gZWxzZSBpZiAocmFuZ2Uuc2hvd3NlZykge1xyXG5cdFx0XHR0aHJvdyBcIm5vdCBpbXBsZW1lbnQgeWV0XCJcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhciBmaWxlV2l0aEhpdHM9W10sdG90YWxoaXQ9MDtcclxuXHRyYW5nZS5tYXhoaXQ9cmFuZ2UubWF4aGl0fHwxMDAwO1xyXG5cclxuXHRmb3IgKHZhciBpPXN0YXJ0O2k8ZW5kO2krKykge1xyXG5cdFx0aWYoUS5ieUZpbGVbaV0ubGVuZ3RoPjApIHtcclxuXHRcdFx0dG90YWxoaXQrPVEuYnlGaWxlW2ldLmxlbmd0aDtcclxuXHRcdFx0ZmlsZVdpdGhIaXRzLnB1c2goaSk7XHJcblx0XHRcdHJhbmdlLm5leHRGaWxlU3RhcnQ9aTtcclxuXHRcdFx0aWYgKGZpbGVXaXRoSGl0cy5sZW5ndGg+PWZpbGVjb3VudCkge1xyXG5cdFx0XHRcdFEuZXhjZXJwdE92ZXJmbG93PXRydWU7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKHRvdGFsaGl0PnJhbmdlLm1heGhpdCkge1xyXG5cdFx0XHRcdFEuZXhjZXJwdE92ZXJmbG93PXRydWU7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0aWYgKGk+PWVuZCkgeyAvL25vIG1vcmUgZmlsZVxyXG5cdFx0US5leGNlcnB0U3RvcD10cnVlO1xyXG5cdH1cclxuXHRyZXR1cm4gZmlsZVdpdGhIaXRzO1xyXG59XHJcbnZhciByZXN1bHRsaXN0PWZ1bmN0aW9uKGVuZ2luZSxRLG9wdHMsY2IpIHtcclxuXHR2YXIgb3V0cHV0PVtdO1xyXG5cdGlmICghUS5yYXdyZXN1bHQgfHwgIVEucmF3cmVzdWx0Lmxlbmd0aCkge1xyXG5cdFx0Y2Iob3V0cHV0KTtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblxyXG5cdGlmIChvcHRzLnJhbmdlKSB7XHJcblx0XHRpZiAob3B0cy5yYW5nZS5tYXhoaXQgJiYgIW9wdHMucmFuZ2UubWF4ZmlsZSkge1xyXG5cdFx0XHRvcHRzLnJhbmdlLm1heGZpbGU9b3B0cy5yYW5nZS5tYXhoaXQ7XHJcblx0XHRcdG9wdHMucmFuZ2UubWF4c2VnPW9wdHMucmFuZ2UubWF4aGl0O1xyXG5cdFx0fVxyXG5cdFx0aWYgKCFvcHRzLnJhbmdlLm1heHNlZykgb3B0cy5yYW5nZS5tYXhzZWc9MTAwO1xyXG5cdFx0aWYgKCFvcHRzLnJhbmdlLmVuZCkge1xyXG5cdFx0XHRvcHRzLnJhbmdlLmVuZD1OdW1iZXIuTUFYX1NBRkVfSU5URUdFUjtcclxuXHRcdH1cclxuXHR9XHJcblx0dmFyIGZpbGVXaXRoSGl0cz1nZXRGaWxlV2l0aEhpdHMoZW5naW5lLFEsb3B0cy5yYW5nZSk7XHJcblx0aWYgKCFmaWxlV2l0aEhpdHMubGVuZ3RoKSB7XHJcblx0XHRjYihvdXRwdXQpO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHJcblx0dmFyIG91dHB1dD1bXSxmaWxlcz1bXTsvL3RlbXBvcmFyeSBob2xkZXIgZm9yIHNlZ25hbWVzXHJcblx0Zm9yICh2YXIgaT0wO2k8ZmlsZVdpdGhIaXRzLmxlbmd0aDtpKyspIHtcclxuXHRcdHZhciBuZmlsZT1maWxlV2l0aEhpdHNbaV07XHJcblx0XHR2YXIgc2Vnb2Zmc2V0cz1lbmdpbmUuZ2V0RmlsZVNlZ09mZnNldHMobmZpbGUpO1xyXG5cdFx0dmFyIHNlZ25hbWVzPWVuZ2luZS5nZXRGaWxlU2VnTmFtZXMobmZpbGUpO1xyXG5cdFx0ZmlsZXNbbmZpbGVdPXtzZWdvZmZzZXRzOnNlZ29mZnNldHN9O1xyXG5cdFx0dmFyIHNlZ3dpdGhoaXQ9cGxpc3QuZ3JvdXBieXBvc3RpbmcyKFEuYnlGaWxlWyBuZmlsZSBdLCAgc2Vnb2Zmc2V0cyk7XHJcblx0XHQvL2lmIChzZWdvZmZzZXRzWzBdPT0xKVxyXG5cdFx0Ly9zZWd3aXRoaGl0LnNoaWZ0KCk7IC8vdGhlIGZpcnN0IGl0ZW0gaXMgbm90IHVzZWQgKDB+US5ieUZpbGVbMF0gKVxyXG5cclxuXHRcdGZvciAodmFyIGo9MDsgajxzZWd3aXRoaGl0Lmxlbmd0aDtqKyspIHtcclxuXHRcdFx0aWYgKCFzZWd3aXRoaGl0W2pdLmxlbmd0aCkgY29udGludWU7XHJcblx0XHRcdC8vdmFyIG9mZnNldHM9c2Vnd2l0aGhpdFtqXS5tYXAoZnVuY3Rpb24ocCl7cmV0dXJuIHAtIGZpbGVPZmZzZXRzW2ldfSk7XHJcblx0XHRcdGlmIChzZWdvZmZzZXRzW2pdPm9wdHMucmFuZ2UuZW5kKSBicmVhaztcclxuXHRcdFx0b3V0cHV0LnB1c2goICB7ZmlsZTogbmZpbGUsIHNlZzpqLCAgc2VnbmFtZTpzZWduYW1lc1tqXX0pO1xyXG5cdFx0XHRpZiAob3V0cHV0Lmxlbmd0aD5vcHRzLnJhbmdlLm1heHNlZykgYnJlYWs7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR2YXIgc2VncGF0aHM9b3V0cHV0Lm1hcChmdW5jdGlvbihwKXtcclxuXHRcdHJldHVybiBbXCJmaWxlY29udGVudHNcIixwLmZpbGUscC5zZWddO1xyXG5cdH0pO1xyXG5cdC8vcHJlcGFyZSB0aGUgdGV4dFxyXG5cdGVuZ2luZS5nZXQoc2VncGF0aHMsZnVuY3Rpb24oc2Vncyl7XHJcblx0XHR2YXIgc2VxPTA7XHJcblx0XHRpZiAoc2VncykgZm9yICh2YXIgaT0wO2k8c2Vncy5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdHZhciBzdGFydHZwb3M9ZmlsZXNbb3V0cHV0W2ldLmZpbGVdLnNlZ29mZnNldHNbb3V0cHV0W2ldLnNlZy0xXSB8fDA7XHJcblx0XHRcdHZhciBlbmR2cG9zPWZpbGVzW291dHB1dFtpXS5maWxlXS5zZWdvZmZzZXRzW291dHB1dFtpXS5zZWddO1xyXG5cdFx0XHR2YXIgaGw9e307XHJcblxyXG5cdFx0XHRpZiAob3B0cy5yYW5nZSAmJiBvcHRzLnJhbmdlLnN0YXJ0ICApIHtcclxuXHRcdFx0XHRpZiAoIHN0YXJ0dnBvczxvcHRzLnJhbmdlLnN0YXJ0KSBzdGFydHZwb3M9b3B0cy5yYW5nZS5zdGFydDtcclxuXHRcdFx0Ly9cdGlmIChlbmR2cG9zPm9wdHMucmFuZ2UuZW5kKSBlbmR2cG9zPW9wdHMucmFuZ2UuZW5kO1xyXG5cdFx0XHR9XHJcblx0XHRcdFxyXG5cdFx0XHRpZiAob3B0cy5ub2hpZ2hsaWdodCkge1xyXG5cdFx0XHRcdGhsLnRleHQ9c2Vnc1tpXTtcclxuXHRcdFx0XHRobC5oaXRzPWhpdEluUmFuZ2UoUSxzdGFydHZwb3MsZW5kdnBvcyk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dmFyIG89e25vY3JsZjp0cnVlLG5vc3Bhbjp0cnVlLFxyXG5cdFx0XHRcdFx0dGV4dDpzZWdzW2ldLHN0YXJ0dnBvczpzdGFydHZwb3MsIGVuZHZwb3M6IGVuZHZwb3MsIFxyXG5cdFx0XHRcdFx0UTpRLGZ1bGx0ZXh0Om9wdHMuZnVsbHRleHR9O1xyXG5cdFx0XHRcdGhsPWhpZ2hsaWdodChRLG8pO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChobC50ZXh0KSB7XHJcblx0XHRcdFx0b3V0cHV0W2ldLnRleHQ9aGwudGV4dDtcclxuXHRcdFx0XHRvdXRwdXRbaV0uaGl0cz1obC5oaXRzO1xyXG5cdFx0XHRcdG91dHB1dFtpXS5zZXE9c2VxO1xyXG5cdFx0XHRcdHNlcSs9aGwuaGl0cy5sZW5ndGg7XHJcblxyXG5cdFx0XHRcdG91dHB1dFtpXS5zdGFydD1zdGFydHZwb3M7XHRcdFx0XHRcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRvdXRwdXRbaV09bnVsbDsgLy9yZW1vdmUgaXRlbSB2cG9zIGxlc3MgdGhhbiBvcHRzLnJhbmdlLnN0YXJ0XHJcblx0XHRcdH1cclxuXHRcdH0gXHJcblx0XHRvdXRwdXQ9b3V0cHV0LmZpbHRlcihmdW5jdGlvbihvKXtyZXR1cm4gbyE9bnVsbH0pO1xyXG5cdFx0Y2Iob3V0cHV0KTtcclxuXHR9KTtcclxufVxyXG52YXIgaW5qZWN0VGFnPWZ1bmN0aW9uKFEsb3B0cyl7XHJcblx0dmFyIGhpdHM9b3B0cy5oaXRzO1xyXG5cdHZhciB0YWdzPW9wdHMudGFncztcclxuXHRpZiAoIXRhZ3MpIHRhZ3M9W107XHJcblx0dmFyIGhpdGNsYXNzPW9wdHMuaGl0Y2xhc3N8fCdobCc7XHJcblx0dmFyIG91dHB1dD0nJyxPPVtdLGo9MCxrPTA7XHJcblx0dmFyIHN1cnJvdW5kPW9wdHMuc3Vycm91bmR8fDU7XHJcblxyXG5cdHZhciB0b2tlbnM9US50b2tlbml6ZShvcHRzLnRleHQpLnRva2VucztcclxuXHR2YXIgdnBvcz1vcHRzLnZwb3M7XHJcblx0dmFyIGk9MCxwcmV2aW5yYW5nZT0hIW9wdHMuZnVsbHRleHQgLGlucmFuZ2U9ISFvcHRzLmZ1bGx0ZXh0O1xyXG5cdHZhciBoaXRzdGFydD0wLGhpdGVuZD0wLHRhZ3N0YXJ0PTAsdGFnZW5kPTAsdGFnY2xhc3M9XCJcIjtcclxuXHR3aGlsZSAoaTx0b2tlbnMubGVuZ3RoKSB7XHJcblx0XHR2YXIgc2tpcD1RLmlzU2tpcCh0b2tlbnNbaV0pO1xyXG5cdFx0dmFyIGhhc2hpdD1mYWxzZTtcclxuXHRcdGlucmFuZ2U9b3B0cy5mdWxsdGV4dCB8fCAoajxoaXRzLmxlbmd0aCAmJiB2cG9zK3N1cnJvdW5kPj1oaXRzW2pdWzBdIHx8XHJcblx0XHRcdFx0KGo+MCAmJiBqPD1oaXRzLmxlbmd0aCAmJiAgaGl0c1tqLTFdWzBdK3N1cnJvdW5kKjI+PXZwb3MpKTtcdFxyXG5cclxuXHRcdGlmIChwcmV2aW5yYW5nZSE9aW5yYW5nZSkge1xyXG5cdFx0XHRvdXRwdXQrPW9wdHMuYWJyaWRnZXx8XCIuLi5cIjtcclxuXHRcdH1cclxuXHRcdHByZXZpbnJhbmdlPWlucmFuZ2U7XHJcblx0XHR2YXIgdG9rZW49dG9rZW5zW2ldO1xyXG5cdFx0aWYgKG9wdHMubm9jcmxmICYmIHRva2VuPT1cIlxcblwiKSB0b2tlbj1cIlwiO1xyXG5cclxuXHRcdGlmIChpbnJhbmdlICYmIGk8dG9rZW5zLmxlbmd0aCkge1xyXG5cdFx0XHRpZiAoc2tpcCkge1xyXG5cdFx0XHRcdG91dHB1dCs9dG9rZW47XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dmFyIGNsYXNzZXM9XCJcIjtcdFxyXG5cclxuXHRcdFx0XHQvL2NoZWNrIGhpdFxyXG5cdFx0XHRcdGlmIChqPGhpdHMubGVuZ3RoICYmIHZwb3M9PWhpdHNbal1bMF0pIHtcclxuXHRcdFx0XHRcdHZhciBucGhyYXNlPWhpdHNbal1bMl0gJSAxMCwgd2lkdGg9aGl0c1tqXVsxXTtcclxuXHRcdFx0XHRcdGhpdHN0YXJ0PWhpdHNbal1bMF07XHJcblx0XHRcdFx0XHRoaXRlbmQ9aGl0c3RhcnQrd2lkdGg7XHJcblx0XHRcdFx0XHRqKys7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHQvL2NoZWNrIHRhZ1xyXG5cdFx0XHRcdGlmIChrPHRhZ3MubGVuZ3RoICYmIHZwb3M9PXRhZ3Nba11bMF0pIHtcclxuXHRcdFx0XHRcdHZhciB3aWR0aD10YWdzW2tdWzFdO1xyXG5cdFx0XHRcdFx0dGFnc3RhcnQ9dGFnc1trXVswXTtcclxuXHRcdFx0XHRcdHRhZ2VuZD10YWdzdGFydCt3aWR0aDtcclxuXHRcdFx0XHRcdHRhZ2NsYXNzPXRhZ3Nba11bMl07XHJcblx0XHRcdFx0XHRrKys7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiAodnBvcz49aGl0c3RhcnQgJiYgdnBvczxoaXRlbmQpIGNsYXNzZXM9aGl0Y2xhc3MrXCIgXCIraGl0Y2xhc3MrbnBocmFzZTtcclxuXHRcdFx0XHRpZiAodnBvcz49dGFnc3RhcnQgJiYgdnBvczx0YWdlbmQpIGNsYXNzZXMrPVwiIFwiK3RhZ2NsYXNzO1xyXG5cclxuXHRcdFx0XHRpZiAoY2xhc3NlcyB8fCAhb3B0cy5ub3NwYW4pIHtcclxuXHRcdFx0XHRcdG91dHB1dCs9JzxzcGFuIHZwb3M9XCInK3Zwb3MrJ1wiJztcclxuXHRcdFx0XHRcdGlmIChjbGFzc2VzKSBjbGFzc2VzPScgY2xhc3M9XCInK2NsYXNzZXMrJ1wiJztcclxuXHRcdFx0XHRcdG91dHB1dCs9Y2xhc3NlcysnPic7XHJcblx0XHRcdFx0XHRvdXRwdXQrPXRva2VuKyc8L3NwYW4+JztcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0b3V0cHV0Kz10b2tlbjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGlmICghc2tpcCkgdnBvcysrO1xyXG5cdFx0aSsrOyBcclxuXHR9XHJcblxyXG5cdE8ucHVzaChvdXRwdXQpO1xyXG5cdG91dHB1dD1cIlwiO1xyXG5cclxuXHRyZXR1cm4gTy5qb2luKFwiXCIpO1xyXG59XHJcbnZhciBoaWdobGlnaHQ9ZnVuY3Rpb24oUSxvcHRzKSB7XHJcblx0aWYgKCFvcHRzLnRleHQpIHJldHVybiB7dGV4dDpcIlwiLGhpdHM6W119O1xyXG5cdHZhciBvcHQ9e3RleHQ6b3B0cy50ZXh0LFxyXG5cdFx0aGl0czpudWxsLGFicmlkZ2U6b3B0cy5hYnJpZGdlLHZwb3M6b3B0cy5zdGFydHZwb3MsXHJcblx0XHRmdWxsdGV4dDpvcHRzLmZ1bGx0ZXh0LHJlbmRlclRhZ3M6b3B0cy5yZW5kZXJUYWdzLG5vc3BhbjpvcHRzLm5vc3Bhbixub2NybGY6b3B0cy5ub2NybGYsXHJcblx0fTtcclxuXHJcblx0b3B0LmhpdHM9aGl0SW5SYW5nZShvcHRzLlEsb3B0cy5zdGFydHZwb3Msb3B0cy5lbmR2cG9zKTtcclxuXHRyZXR1cm4ge3RleHQ6aW5qZWN0VGFnKFEsb3B0KSxoaXRzOm9wdC5oaXRzfTtcclxufVxyXG5cclxudmFyIGdldFNlZz1mdW5jdGlvbihlbmdpbmUsZmlsZWlkLHNlZ2lkLGNiKSB7XHJcblx0dmFyIGZpbGVPZmZzZXRzPWVuZ2luZS5nZXQoXCJmaWxlb2Zmc2V0c1wiKTtcclxuXHR2YXIgc2VncGF0aHM9W1wiZmlsZWNvbnRlbnRzXCIsZmlsZWlkLHNlZ2lkXTtcclxuXHR2YXIgc2VnbmFtZXM9ZW5naW5lLmdldEZpbGVTZWdOYW1lcyhmaWxlaWQpO1xyXG5cclxuXHRlbmdpbmUuZ2V0KHNlZ3BhdGhzLGZ1bmN0aW9uKHRleHQpe1xyXG5cdFx0Y2IuYXBwbHkoZW5naW5lLmNvbnRleHQsW3t0ZXh0OnRleHQsZmlsZTpmaWxlaWQsc2VnOnNlZ2lkLHNlZ25hbWU6c2VnbmFtZXNbc2VnaWRdfV0pO1xyXG5cdH0pO1xyXG59XHJcblxyXG52YXIgZ2V0U2VnU3luYz1mdW5jdGlvbihlbmdpbmUsZmlsZWlkLHNlZ2lkKSB7XHJcblx0dmFyIGZpbGVPZmZzZXRzPWVuZ2luZS5nZXQoXCJmaWxlb2Zmc2V0c1wiKTtcclxuXHR2YXIgc2VncGF0aHM9W1wiZmlsZWNvbnRlbnRzXCIsZmlsZWlkLHNlZ2lkXTtcclxuXHR2YXIgc2VnbmFtZXM9ZW5naW5lLmdldEZpbGVTZWdOYW1lcyhmaWxlaWQpO1xyXG5cclxuXHR2YXIgdGV4dD1lbmdpbmUuZ2V0KHNlZ3BhdGhzKTtcclxuXHRyZXR1cm4ge3RleHQ6dGV4dCxmaWxlOmZpbGVpZCxzZWc6c2VnaWQsc2VnbmFtZTpzZWduYW1lc1tzZWdpZF19O1xyXG59XHJcblxyXG52YXIgZ2V0UmFuZ2U9ZnVuY3Rpb24oZW5naW5lLHN0YXJ0LGVuZCxjYikge1xyXG5cdHZhciBmaWxlb2Zmc2V0cz1lbmdpbmUuZ2V0KFwiZmlsZW9mZnNldHNcIik7XHJcblx0Ly92YXIgcGFnZXBhdGhzPVtcImZpbGVDb250ZW50c1wiLF07XHJcblx0Ly9maW5kIGZpcnN0IHBhZ2UgYW5kIGxhc3QgcGFnZVxyXG5cdC8vY3JlYXRlIGdldCBwYXRoc1xyXG5cclxufVxyXG5cclxudmFyIGdldEZpbGU9ZnVuY3Rpb24oZW5naW5lLGZpbGVpZCxjYikge1xyXG5cdHZhciBmaWxlbmFtZT1lbmdpbmUuZ2V0KFwiZmlsZW5hbWVzXCIpW2ZpbGVpZF07XHJcblx0dmFyIHNlZ25hbWVzPWVuZ2luZS5nZXRGaWxlU2VnTmFtZXMoZmlsZWlkKTtcclxuXHR2YXIgZmlsZXN0YXJ0PWVuZ2luZS5nZXQoXCJmaWxlb2Zmc2V0c1wiKVtmaWxlaWRdO1xyXG5cdHZhciBvZmZzZXRzPWVuZ2luZS5nZXRGaWxlU2VnT2Zmc2V0cyhmaWxlaWQpO1xyXG5cdHZhciBwYz0wO1xyXG5cdGVuZ2luZS5nZXQoW1wiZmlsZUNvbnRlbnRzXCIsZmlsZWlkXSx0cnVlLGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0dmFyIHRleHQ9ZGF0YS5tYXAoZnVuY3Rpb24odCxpZHgpIHtcclxuXHRcdFx0aWYgKGlkeD09MCkgcmV0dXJuIFwiXCI7IFxyXG5cdFx0XHR2YXIgcGI9JzxwYiBuPVwiJytzZWduYW1lc1tpZHhdKydcIj48L3BiPic7XHJcblx0XHRcdHJldHVybiBwYit0O1xyXG5cdFx0fSk7XHJcblx0XHRjYih7dGV4dHM6ZGF0YSx0ZXh0OnRleHQuam9pbihcIlwiKSxzZWduYW1lczpzZWduYW1lcyxmaWxlc3RhcnQ6ZmlsZXN0YXJ0LG9mZnNldHM6b2Zmc2V0cyxmaWxlOmZpbGVpZCxmaWxlbmFtZTpmaWxlbmFtZX0pOyAvL2ZvcmNlIGRpZmZlcmVudCB0b2tlblxyXG5cdH0pO1xyXG59XHJcblxyXG52YXIgaGlnaGxpZ2h0UmFuZ2U9ZnVuY3Rpb24oUSxzdGFydHZwb3MsZW5kdnBvcyxvcHRzLGNiKXtcclxuXHQvL25vdCBpbXBsZW1lbnQgeWV0XHJcbn1cclxuXHJcbnZhciBoaWdobGlnaHRGaWxlPWZ1bmN0aW9uKFEsZmlsZWlkLG9wdHMsY2IpIHtcclxuXHRpZiAodHlwZW9mIG9wdHM9PVwiZnVuY3Rpb25cIikge1xyXG5cdFx0Y2I9b3B0cztcclxuXHR9XHJcblxyXG5cdGlmICghUSB8fCAhUS5lbmdpbmUpIHJldHVybiBjYihudWxsKTtcclxuXHJcblx0dmFyIHNlZ29mZnNldHM9US5lbmdpbmUuZ2V0RmlsZVNlZ09mZnNldHMoZmlsZWlkKTtcclxuXHR2YXIgb3V0cHV0PVtdO1x0XHJcblx0Ly9jb25zb2xlLmxvZyhzdGFydHZwb3MsZW5kdnBvcylcclxuXHRRLmVuZ2luZS5nZXQoW1wiZmlsZUNvbnRlbnRzXCIsZmlsZWlkXSx0cnVlLGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0aWYgKCFkYXRhKSB7XHJcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJ3cm9uZyBmaWxlIGlkXCIsZmlsZWlkKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGZvciAodmFyIGk9MDtpPGRhdGEubGVuZ3RoLTE7aSsrICl7XHJcblx0XHRcdFx0dmFyIHN0YXJ0dnBvcz1zZWdvZmZzZXRzW2ldO1xyXG5cdFx0XHRcdHZhciBlbmR2cG9zPXNlZ29mZnNldHNbaSsxXTtcclxuXHRcdFx0XHR2YXIgc2VnbmFtZXM9US5lbmdpbmUuZ2V0RmlsZVNlZ05hbWVzKGZpbGVpZCk7XHJcblx0XHRcdFx0dmFyIHNlZz1nZXRTZWdTeW5jKFEuZW5naW5lLCBmaWxlaWQsaSsxKTtcclxuXHRcdFx0XHRcdHZhciBvcHQ9e3RleHQ6c2VnLnRleHQsaGl0czpudWxsLHRhZzonaGwnLHZwb3M6c3RhcnR2cG9zLFxyXG5cdFx0XHRcdFx0ZnVsbHRleHQ6dHJ1ZSxub3NwYW46b3B0cy5ub3NwYW4sbm9jcmxmOm9wdHMubm9jcmxmfTtcclxuXHRcdFx0XHR2YXIgc2VnbmFtZT1zZWduYW1lc1tpKzFdO1xyXG5cdFx0XHRcdG9wdC5oaXRzPWhpdEluUmFuZ2UoUSxzdGFydHZwb3MsZW5kdnBvcyk7XHJcblx0XHRcdFx0dmFyIHBiPSc8cGIgbj1cIicrc2VnbmFtZSsnXCI+PC9wYj4nO1xyXG5cdFx0XHRcdHZhciB3aXRodGFnPWluamVjdFRhZyhRLG9wdCk7XHJcblx0XHRcdFx0b3V0cHV0LnB1c2gocGIrd2l0aHRhZyk7XHJcblx0XHRcdH1cdFx0XHRcclxuXHRcdH1cclxuXHJcblx0XHRjYi5hcHBseShRLmVuZ2luZS5jb250ZXh0LFt7dGV4dDpvdXRwdXQuam9pbihcIlwiKSxmaWxlOmZpbGVpZH1dKTtcclxuXHR9KVxyXG59XHJcbnZhciBoaWdobGlnaHRTZWc9ZnVuY3Rpb24oUSxmaWxlaWQsc2VnaWQsb3B0cyxjYikge1xyXG5cdGlmICh0eXBlb2Ygb3B0cz09XCJmdW5jdGlvblwiKSB7XHJcblx0XHRjYj1vcHRzO1xyXG5cdH1cclxuXHJcblx0aWYgKCFRIHx8ICFRLmVuZ2luZSkgcmV0dXJuIGNiKG51bGwpO1xyXG5cdHZhciBzZWdvZmZzZXRzPVEuZW5naW5lLmdldEZpbGVTZWdPZmZzZXRzKGZpbGVpZCk7XHJcblx0dmFyIHN0YXJ0dnBvcz1zZWdvZmZzZXRzW3NlZ2lkLTFdO1xyXG5cdHZhciBlbmR2cG9zPXNlZ29mZnNldHNbc2VnaWRdO1xyXG5cdHZhciBzZWduYW1lcz1RLmVuZ2luZS5nZXRGaWxlU2VnTmFtZXMoZmlsZWlkKTtcclxuXHJcblx0dGhpcy5nZXRTZWcoUS5lbmdpbmUsZmlsZWlkLHNlZ2lkLGZ1bmN0aW9uKHJlcyl7XHJcblx0XHR2YXIgb3B0PXt0ZXh0OnJlcy50ZXh0LGhpdHM6bnVsbCx2cG9zOnN0YXJ0dnBvcyxmdWxsdGV4dDp0cnVlLFxyXG5cdFx0XHRub3NwYW46b3B0cy5ub3NwYW4sbm9jcmxmOm9wdHMubm9jcmxmfTtcclxuXHRcdG9wdC5oaXRzPWhpdEluUmFuZ2UoUSxzdGFydHZwb3MsZW5kdnBvcyk7XHJcblx0XHRpZiAob3B0cy5yZW5kZXJUYWdzKSB7XHJcblx0XHRcdG9wdC50YWdzPXRhZ3NJblJhbmdlKFEsb3B0cy5yZW5kZXJUYWdzLHN0YXJ0dnBvcyxlbmR2cG9zKTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgc2VnbmFtZT1zZWduYW1lc1tzZWdpZF07XHJcblx0XHRjYi5hcHBseShRLmVuZ2luZS5jb250ZXh0LFt7dGV4dDppbmplY3RUYWcoUSxvcHQpLHNlZzpzZWdpZCxmaWxlOmZpbGVpZCxoaXRzOm9wdC5oaXRzLHNlZ25hbWU6c2VnbmFtZX1dKTtcclxuXHR9KTtcclxufVxyXG5tb2R1bGUuZXhwb3J0cz17cmVzdWx0bGlzdDpyZXN1bHRsaXN0LCBcclxuXHRoaXRJblJhbmdlOmhpdEluUmFuZ2UsIFxyXG5cdGhpZ2hsaWdodFNlZzpoaWdobGlnaHRTZWcsXHJcblx0Z2V0U2VnOmdldFNlZyxcclxuXHRoaWdobGlnaHRGaWxlOmhpZ2hsaWdodEZpbGUsXHJcblx0Z2V0RmlsZTpnZXRGaWxlXHJcblx0Ly9oaWdobGlnaHRSYW5nZTpoaWdobGlnaHRSYW5nZSxcclxuICAvL2dldFJhbmdlOmdldFJhbmdlLFxyXG59OyIsIi8qXHJcbiAgS3NhbmEgU2VhcmNoIEVuZ2luZS5cclxuXHJcbiAgbmVlZCBhIEtERSBpbnN0YW5jZSB0byBiZSBmdW5jdGlvbmFsXHJcbiAgXHJcbiovXHJcbnZhciBic2VhcmNoPXJlcXVpcmUoXCIuL2JzZWFyY2hcIik7XHJcbnZhciBkb3NlYXJjaD1yZXF1aXJlKFwiLi9zZWFyY2hcIik7XHJcblxyXG52YXIgcHJlcGFyZUVuZ2luZUZvclNlYXJjaD1mdW5jdGlvbihlbmdpbmUsY2Ipe1xyXG5cdGlmIChlbmdpbmUuYW5hbHl6ZXIpcmV0dXJuO1xyXG5cdHZhciBhbmFseXplcj1yZXF1aXJlKFwia3NhbmEtYW5hbHl6ZXJcIik7XHJcblx0dmFyIGNvbmZpZz1lbmdpbmUuZ2V0KFwibWV0YVwiKS5jb25maWc7XHJcblx0ZW5naW5lLmFuYWx5emVyPWFuYWx5emVyLmdldEFQSShjb25maWcpO1xyXG5cdGVuZ2luZS5nZXQoW1tcInRva2Vuc1wiXSxbXCJwb3N0aW5nc2xlbmd0aFwiXV0sZnVuY3Rpb24oKXtcclxuXHRcdGNiKCk7XHJcblx0fSk7XHJcbn1cclxuXHJcbnZhciBfc2VhcmNoPWZ1bmN0aW9uKGVuZ2luZSxxLG9wdHMsY2IsY29udGV4dCkge1xyXG5cdGlmICh0eXBlb2YgZW5naW5lPT1cInN0cmluZ1wiKSB7Ly9icm93c2VyIG9ubHlcclxuXHRcdHZhciBrZGU9cmVxdWlyZShcImtzYW5hLWRhdGFiYXNlXCIpO1xyXG5cdFx0aWYgKHR5cGVvZiBvcHRzPT1cImZ1bmN0aW9uXCIpIHsgLy91c2VyIGRpZG4ndCBzdXBwbHkgb3B0aW9uc1xyXG5cdFx0XHRpZiAodHlwZW9mIGNiPT1cIm9iamVjdFwiKWNvbnRleHQ9Y2I7XHJcblx0XHRcdGNiPW9wdHM7XHJcblx0XHRcdG9wdHM9e307XHJcblx0XHR9XHJcblx0XHRvcHRzLnE9cTtcclxuXHRcdG9wdHMuZGJpZD1lbmdpbmU7XHJcblx0XHRrZGUub3BlbihvcHRzLmRiaWQsZnVuY3Rpb24oZXJyLGRiKXtcclxuXHRcdFx0aWYgKGVycikge1xyXG5cdFx0XHRcdGNiKGVycik7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNvbnNvbGUubG9nKFwib3BlbmVkXCIsb3B0cy5kYmlkKVxyXG5cdFx0XHRwcmVwYXJlRW5naW5lRm9yU2VhcmNoKGRiLGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0cmV0dXJuIGRvc2VhcmNoKGRiLHEsb3B0cyxjYik7XHRcclxuXHRcdFx0fSk7XHJcblx0XHR9LGNvbnRleHQpO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRwcmVwYXJlRW5naW5lRm9yU2VhcmNoKGVuZ2luZSxmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gZG9zZWFyY2goZW5naW5lLHEsb3B0cyxjYik7XHRcclxuXHRcdH0pO1xyXG5cdH1cclxufVxyXG5cclxudmFyIF9oaWdobGlnaHRTZWc9ZnVuY3Rpb24oZW5naW5lLGZpbGVpZCxzZWdpZCxvcHRzLGNiKXtcclxuXHRpZiAoIW9wdHMucSkgb3B0cy5xPVwiXCI7IFxyXG5cdF9zZWFyY2goZW5naW5lLG9wdHMucSxvcHRzLGZ1bmN0aW9uKFEpe1xyXG5cdFx0YXBpLmV4Y2VycHQuaGlnaGxpZ2h0U2VnKFEsZmlsZWlkLHNlZ2lkLG9wdHMsY2IpO1xyXG5cdH0pO1x0XHJcbn1cclxudmFyIF9oaWdobGlnaHRSYW5nZT1mdW5jdGlvbihlbmdpbmUsc3RhcnQsZW5kLG9wdHMsY2Ipe1xyXG5cclxuXHRpZiAob3B0cy5xKSB7XHJcblx0XHRfc2VhcmNoKGVuZ2luZSxvcHRzLnEsb3B0cyxmdW5jdGlvbihRKXtcclxuXHRcdFx0YXBpLmV4Y2VycHQuaGlnaGxpZ2h0UmFuZ2UoUSxzdGFydCxlbmQsb3B0cyxjYik7XHJcblx0XHR9KTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0cHJlcGFyZUVuZ2luZUZvclNlYXJjaChlbmdpbmUsZnVuY3Rpb24oKXtcclxuXHRcdFx0YXBpLmV4Y2VycHQuZ2V0UmFuZ2UoZW5naW5lLHN0YXJ0LGVuZCxjYik7XHJcblx0XHR9KTtcclxuXHR9XHJcbn1cclxudmFyIF9oaWdobGlnaHRGaWxlPWZ1bmN0aW9uKGVuZ2luZSxmaWxlaWQsb3B0cyxjYil7XHJcblx0aWYgKCFvcHRzLnEpIG9wdHMucT1cIlwiOyBcclxuXHRfc2VhcmNoKGVuZ2luZSxvcHRzLnEsb3B0cyxmdW5jdGlvbihRKXtcclxuXHRcdGFwaS5leGNlcnB0LmhpZ2hsaWdodEZpbGUoUSxmaWxlaWQsb3B0cyxjYik7XHJcblx0fSk7XHJcblx0LypcclxuXHR9IGVsc2Uge1xyXG5cdFx0YXBpLmV4Y2VycHQuZ2V0RmlsZShlbmdpbmUsZmlsZWlkLGZ1bmN0aW9uKGRhdGEpIHtcclxuXHRcdFx0Y2IuYXBwbHkoZW5naW5lLmNvbnRleHQsW2RhdGFdKTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHQqL1xyXG59XHJcblxyXG52YXIgdnBvczJmaWxlc2VnPWZ1bmN0aW9uKGVuZ2luZSx2cG9zKSB7XHJcbiAgICB2YXIgc2Vnb2Zmc2V0cz1lbmdpbmUuZ2V0KFwic2Vnb2Zmc2V0c1wiKTtcclxuICAgIHZhciBmaWxlb2Zmc2V0cz1lbmdpbmUuZ2V0KFtcImZpbGVvZmZzZXRzXCJdKTtcclxuICAgIHZhciBzZWduYW1lcz1lbmdpbmUuZ2V0KFwic2VnbmFtZXNcIik7XHJcbiAgICB2YXIgZmlsZWlkPWJzZWFyY2goZmlsZW9mZnNldHMsdnBvcysxLHRydWUpO1xyXG4gICAgZmlsZWlkLS07XHJcbiAgICB2YXIgc2VnaWQ9YnNlYXJjaChzZWdvZmZzZXRzLHZwb3MrMSx0cnVlKTtcclxuXHR2YXIgcmFuZ2U9ZW5naW5lLmdldEZpbGVSYW5nZShmaWxlaWQpO1xyXG5cdHNlZ2lkLT1yYW5nZS5zdGFydDtcclxuICAgIHJldHVybiB7ZmlsZTpmaWxlaWQsc2VnOnNlZ2lkfTtcclxufVxyXG52YXIgYXBpPXtcclxuXHRzZWFyY2g6X3NlYXJjaFxyXG4vL1x0LGNvbmNvcmRhbmNlOnJlcXVpcmUoXCIuL2NvbmNvcmRhbmNlXCIpXHJcbi8vXHQscmVnZXg6cmVxdWlyZShcIi4vcmVnZXhcIilcclxuXHQsaGlnaGxpZ2h0U2VnOl9oaWdobGlnaHRTZWdcclxuXHQsaGlnaGxpZ2h0RmlsZTpfaGlnaGxpZ2h0RmlsZVxyXG4vL1x0LGhpZ2hsaWdodFJhbmdlOl9oaWdobGlnaHRSYW5nZVxyXG5cdCxleGNlcnB0OnJlcXVpcmUoXCIuL2V4Y2VycHRcIilcclxuXHQsdnBvczJmaWxlc2VnOnZwb3MyZmlsZXNlZ1xyXG59XHJcbm1vZHVsZS5leHBvcnRzPWFwaTsiLCJcclxudmFyIHVucGFjayA9IGZ1bmN0aW9uIChhcikgeyAvLyB1bnBhY2sgdmFyaWFibGUgbGVuZ3RoIGludGVnZXIgbGlzdFxyXG4gIHZhciByID0gW10sXHJcbiAgaSA9IDAsXHJcbiAgdiA9IDA7XHJcbiAgZG8ge1xyXG5cdHZhciBzaGlmdCA9IDA7XHJcblx0ZG8ge1xyXG5cdCAgdiArPSAoKGFyW2ldICYgMHg3RikgPDwgc2hpZnQpO1xyXG5cdCAgc2hpZnQgKz0gNztcclxuXHR9IHdoaWxlIChhclsrK2ldICYgMHg4MCk7XHJcblx0cltyLmxlbmd0aF09djtcclxuICB9IHdoaWxlIChpIDwgYXIubGVuZ3RoKTtcclxuICByZXR1cm4gcjtcclxufVxyXG5cclxuLypcclxuICAgYXJyOiAgWzEsMSwxLDEsMSwxLDEsMSwxXVxyXG4gICBsZXZlbHM6IFswLDEsMSwyLDIsMCwxLDJdXHJcbiAgIG91dHB1dDogWzUsMSwzLDEsMSwzLDEsMV1cclxuKi9cclxuXHJcbnZhciBncm91cHN1bT1mdW5jdGlvbihhcnIsbGV2ZWxzKSB7XHJcbiAgaWYgKGFyci5sZW5ndGghPWxldmVscy5sZW5ndGgrMSkgcmV0dXJuIG51bGw7XHJcbiAgdmFyIHN0YWNrPVtdO1xyXG4gIHZhciBvdXRwdXQ9bmV3IEFycmF5KGxldmVscy5sZW5ndGgpO1xyXG4gIGZvciAodmFyIGk9MDtpPGxldmVscy5sZW5ndGg7aSsrKSBvdXRwdXRbaV09MDtcclxuICBmb3IgKHZhciBpPTE7aTxhcnIubGVuZ3RoO2krKykgeyAvL2ZpcnN0IG9uZSBvdXQgb2YgdG9jIHNjb3BlLCBpZ25vcmVkXHJcbiAgICBpZiAoc3RhY2subGVuZ3RoPmxldmVsc1tpLTFdKSB7XHJcbiAgICAgIHdoaWxlIChzdGFjay5sZW5ndGg+bGV2ZWxzW2ktMV0pIHN0YWNrLnBvcCgpO1xyXG4gICAgfVxyXG4gICAgc3RhY2sucHVzaChpLTEpO1xyXG4gICAgZm9yICh2YXIgaj0wO2o8c3RhY2subGVuZ3RoO2orKykge1xyXG4gICAgICBvdXRwdXRbc3RhY2tbal1dKz1hcnJbaV07XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBvdXRwdXQ7XHJcbn1cclxuLyogYXJyPSAxICwgMiAsIDMgLDQgLDUsNiw3IC8vdG9rZW4gcG9zdGluZ1xyXG4gIHBvc3Rpbmc9IDMgLCA1ICAvL3RhZyBwb3N0aW5nXHJcbiAgb3V0ID0gMyAsIDIsIDJcclxuKi9cclxudmFyIGNvdW50Ynlwb3N0aW5nID0gZnVuY3Rpb24gKGFyciwgcG9zdGluZykge1xyXG4gIGlmICghcG9zdGluZy5sZW5ndGgpIHJldHVybiBbYXJyLmxlbmd0aF07XHJcbiAgdmFyIG91dD1bXTtcclxuICBmb3IgKHZhciBpPTA7aTxwb3N0aW5nLmxlbmd0aDtpKyspIG91dFtpXT0wO1xyXG4gIG91dFtwb3N0aW5nLmxlbmd0aF09MDtcclxuICB2YXIgcD0wLGk9MCxsYXN0aT0wO1xyXG4gIHdoaWxlIChpPGFyci5sZW5ndGggJiYgcDxwb3N0aW5nLmxlbmd0aCkge1xyXG4gICAgaWYgKGFycltpXTw9cG9zdGluZ1twXSkge1xyXG4gICAgICB3aGlsZSAocDxwb3N0aW5nLmxlbmd0aCAmJiBpPGFyci5sZW5ndGggJiYgYXJyW2ldPD1wb3N0aW5nW3BdKSB7XHJcbiAgICAgICAgb3V0W3BdKys7XHJcbiAgICAgICAgaSsrO1xyXG4gICAgICB9ICAgICAgXHJcbiAgICB9IFxyXG4gICAgcCsrO1xyXG4gIH1cclxuICBvdXRbcG9zdGluZy5sZW5ndGhdID0gYXJyLmxlbmd0aC1pOyAvL3JlbWFpbmluZ1xyXG4gIHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbnZhciBncm91cGJ5cG9zdGluZz1mdW5jdGlvbihhcnIsZ3Bvc3RpbmcpIHsgLy9yZWxhdGl2ZSB2cG9zXHJcbiAgaWYgKCFncG9zdGluZy5sZW5ndGgpIHJldHVybiBbYXJyLmxlbmd0aF07XHJcbiAgdmFyIG91dD1bXTtcclxuICBmb3IgKHZhciBpPTA7aTw9Z3Bvc3RpbmcubGVuZ3RoO2krKykgb3V0W2ldPVtdO1xyXG4gIFxyXG4gIHZhciBwPTAsaT0wLGxhc3RpPTA7XHJcbiAgd2hpbGUgKGk8YXJyLmxlbmd0aCAmJiBwPGdwb3N0aW5nLmxlbmd0aCkge1xyXG4gICAgaWYgKGFycltpXTxncG9zdGluZ1twXSkge1xyXG4gICAgICB3aGlsZSAocDxncG9zdGluZy5sZW5ndGggJiYgaTxhcnIubGVuZ3RoICYmIGFycltpXTxncG9zdGluZ1twXSkge1xyXG4gICAgICAgIHZhciBzdGFydD0wO1xyXG4gICAgICAgIGlmIChwPjApIHN0YXJ0PWdwb3N0aW5nW3AtMV07XHJcbiAgICAgICAgb3V0W3BdLnB1c2goYXJyW2krK10tc3RhcnQpOyAgLy8gcmVsYXRpdmVcclxuICAgICAgfSAgICAgIFxyXG4gICAgfSBcclxuICAgIHArKztcclxuICB9XHJcbiAgLy9yZW1haW5pbmdcclxuICB3aGlsZShpPGFyci5sZW5ndGgpIG91dFtvdXQubGVuZ3RoLTFdLnB1c2goYXJyW2krK10tZ3Bvc3RpbmdbZ3Bvc3RpbmcubGVuZ3RoLTFdKTtcclxuICByZXR1cm4gb3V0O1xyXG59XHJcbnZhciBncm91cGJ5cG9zdGluZzI9ZnVuY3Rpb24oYXJyLGdwb3N0aW5nKSB7IC8vYWJzb2x1dGUgdnBvc1xyXG4gIGlmICghYXJyIHx8ICFhcnIubGVuZ3RoKSByZXR1cm4gW107XHJcbiAgaWYgKCFncG9zdGluZy5sZW5ndGgpIHJldHVybiBbYXJyLmxlbmd0aF07XHJcbiAgdmFyIG91dD1bXTtcclxuICBmb3IgKHZhciBpPTA7aTw9Z3Bvc3RpbmcubGVuZ3RoO2krKykgb3V0W2ldPVtdO1xyXG4gIFxyXG4gIHZhciBwPTAsaT0wLGxhc3RpPTA7XHJcbiAgd2hpbGUgKGk8YXJyLmxlbmd0aCAmJiBwPGdwb3N0aW5nLmxlbmd0aCkge1xyXG4gICAgaWYgKGFycltpXTxncG9zdGluZ1twXSkge1xyXG4gICAgICB3aGlsZSAocDxncG9zdGluZy5sZW5ndGggJiYgaTxhcnIubGVuZ3RoICYmIGFycltpXTxncG9zdGluZ1twXSkge1xyXG4gICAgICAgIHZhciBzdGFydD0wO1xyXG4gICAgICAgIGlmIChwPjApIHN0YXJ0PWdwb3N0aW5nW3AtMV07IC8vYWJzb2x1dGVcclxuICAgICAgICBvdXRbcF0ucHVzaChhcnJbaSsrXSk7XHJcbiAgICAgIH0gICAgICBcclxuICAgIH0gXHJcbiAgICBwKys7XHJcbiAgfVxyXG4gIC8vcmVtYWluaW5nXHJcbiAgd2hpbGUoaTxhcnIubGVuZ3RoKSBvdXRbb3V0Lmxlbmd0aC0xXS5wdXNoKGFycltpKytdLWdwb3N0aW5nW2dwb3N0aW5nLmxlbmd0aC0xXSk7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG52YXIgZ3JvdXBieWJsb2NrMiA9IGZ1bmN0aW9uKGFyLCBudG9rZW4sc2xvdHNoaWZ0LG9wdHMpIHtcclxuICBpZiAoIWFyLmxlbmd0aCkgcmV0dXJuIFt7fSx7fV07XHJcbiAgXHJcbiAgc2xvdHNoaWZ0ID0gc2xvdHNoaWZ0IHx8IDE2O1xyXG4gIHZhciBnID0gTWF0aC5wb3coMixzbG90c2hpZnQpO1xyXG4gIHZhciBpID0gMDtcclxuICB2YXIgciA9IHt9LCBudG9rZW5zPXt9O1xyXG4gIHZhciBncm91cGNvdW50PTA7XHJcbiAgZG8ge1xyXG4gICAgdmFyIGdyb3VwID0gTWF0aC5mbG9vcihhcltpXSAvIGcpIDtcclxuICAgIGlmICghcltncm91cF0pIHtcclxuICAgICAgcltncm91cF0gPSBbXTtcclxuICAgICAgbnRva2Vuc1tncm91cF09W107XHJcbiAgICAgIGdyb3VwY291bnQrKztcclxuICAgIH1cclxuICAgIHJbZ3JvdXBdLnB1c2goYXJbaV0gJSBnKTtcclxuICAgIG50b2tlbnNbZ3JvdXBdLnB1c2gobnRva2VuW2ldKTtcclxuICAgIGkrKztcclxuICB9IHdoaWxlIChpIDwgYXIubGVuZ3RoKTtcclxuICBpZiAob3B0cykgb3B0cy5ncm91cGNvdW50PWdyb3VwY291bnQ7XHJcbiAgcmV0dXJuIFtyLG50b2tlbnNdO1xyXG59XHJcbnZhciBncm91cGJ5c2xvdCA9IGZ1bmN0aW9uIChhciwgc2xvdHNoaWZ0LCBvcHRzKSB7XHJcbiAgaWYgKCFhci5sZW5ndGgpXHJcblx0cmV0dXJuIHt9O1xyXG4gIFxyXG4gIHNsb3RzaGlmdCA9IHNsb3RzaGlmdCB8fCAxNjtcclxuICB2YXIgZyA9IE1hdGgucG93KDIsc2xvdHNoaWZ0KTtcclxuICB2YXIgaSA9IDA7XHJcbiAgdmFyIHIgPSB7fTtcclxuICB2YXIgZ3JvdXBjb3VudD0wO1xyXG4gIGRvIHtcclxuXHR2YXIgZ3JvdXAgPSBNYXRoLmZsb29yKGFyW2ldIC8gZykgO1xyXG5cdGlmICghcltncm91cF0pIHtcclxuXHQgIHJbZ3JvdXBdID0gW107XHJcblx0ICBncm91cGNvdW50Kys7XHJcblx0fVxyXG5cdHJbZ3JvdXBdLnB1c2goYXJbaV0gJSBnKTtcclxuXHRpKys7XHJcbiAgfSB3aGlsZSAoaSA8IGFyLmxlbmd0aCk7XHJcbiAgaWYgKG9wdHMpIG9wdHMuZ3JvdXBjb3VudD1ncm91cGNvdW50O1xyXG4gIHJldHVybiByO1xyXG59XHJcbi8qXHJcbnZhciBpZGVudGl0eSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gIHJldHVybiB2YWx1ZTtcclxufTtcclxudmFyIHNvcnRlZEluZGV4ID0gZnVuY3Rpb24gKGFycmF5LCBvYmosIGl0ZXJhdG9yKSB7IC8vdGFrZW4gZnJvbSB1bmRlcnNjb3JlXHJcbiAgaXRlcmF0b3IgfHwgKGl0ZXJhdG9yID0gaWRlbnRpdHkpO1xyXG4gIHZhciBsb3cgPSAwLFxyXG4gIGhpZ2ggPSBhcnJheS5sZW5ndGg7XHJcbiAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcclxuXHR2YXIgbWlkID0gKGxvdyArIGhpZ2gpID4+IDE7XHJcblx0aXRlcmF0b3IoYXJyYXlbbWlkXSkgPCBpdGVyYXRvcihvYmopID8gbG93ID0gbWlkICsgMSA6IGhpZ2ggPSBtaWQ7XHJcbiAgfVxyXG4gIHJldHVybiBsb3c7XHJcbn07Ki9cclxuXHJcbnZhciBpbmRleE9mU29ydGVkID0gZnVuY3Rpb24gKGFycmF5LCBvYmopIHsgXHJcbiAgdmFyIGxvdyA9IDAsXHJcbiAgaGlnaCA9IGFycmF5Lmxlbmd0aC0xO1xyXG4gIHdoaWxlIChsb3cgPCBoaWdoKSB7XHJcbiAgICB2YXIgbWlkID0gKGxvdyArIGhpZ2gpID4+IDE7XHJcbiAgICBhcnJheVttaWRdIDwgb2JqID8gbG93ID0gbWlkICsgMSA6IGhpZ2ggPSBtaWQ7XHJcbiAgfVxyXG4gIHJldHVybiBsb3c7XHJcbn07XHJcbnZhciBwbGhlYWQ9ZnVuY3Rpb24ocGwsIHBsdGFnLCBvcHRzKSB7XHJcbiAgb3B0cz1vcHRzfHx7fTtcclxuICBvcHRzLm1heD1vcHRzLm1heHx8MTtcclxuICB2YXIgb3V0PVtdO1xyXG4gIGlmIChwbHRhZy5sZW5ndGg8cGwubGVuZ3RoKSB7XHJcbiAgICBmb3IgKHZhciBpPTA7aTxwbHRhZy5sZW5ndGg7aSsrKSB7XHJcbiAgICAgICBrID0gaW5kZXhPZlNvcnRlZChwbCwgcGx0YWdbaV0pO1xyXG4gICAgICAgaWYgKGs+LTEgJiYgazxwbC5sZW5ndGgpIHtcclxuICAgICAgICBpZiAocGxba109PXBsdGFnW2ldKSB7XHJcbiAgICAgICAgICBvdXRbb3V0Lmxlbmd0aF09cGx0YWdbaV07XHJcbiAgICAgICAgICBpZiAob3V0Lmxlbmd0aD49b3B0cy5tYXgpIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICBmb3IgKHZhciBpPTA7aTxwbC5sZW5ndGg7aSsrKSB7XHJcbiAgICAgICBrID0gaW5kZXhPZlNvcnRlZChwbHRhZywgcGxbaV0pO1xyXG4gICAgICAgaWYgKGs+LTEgJiYgazxwbHRhZy5sZW5ndGgpIHtcclxuICAgICAgICBpZiAocGx0YWdba109PXBsW2ldKSB7XHJcbiAgICAgICAgICBvdXRbb3V0Lmxlbmd0aF09cGx0YWdba107XHJcbiAgICAgICAgICBpZiAob3V0Lmxlbmd0aD49b3B0cy5tYXgpIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gb3V0O1xyXG59XHJcbi8qXHJcbiBwbDIgb2NjdXIgYWZ0ZXIgcGwxLCBcclxuIHBsMj49cGwxK21pbmRpc1xyXG4gcGwyPD1wbDErbWF4ZGlzXHJcbiovXHJcbnZhciBwbGZvbGxvdzIgPSBmdW5jdGlvbiAocGwxLCBwbDIsIG1pbmRpcywgbWF4ZGlzKSB7XHJcbiAgdmFyIHIgPSBbXSxpPTA7XHJcbiAgdmFyIHN3YXAgPSAwO1xyXG4gIFxyXG4gIHdoaWxlIChpPHBsMS5sZW5ndGgpe1xyXG4gICAgdmFyIGsgPSBpbmRleE9mU29ydGVkKHBsMiwgcGwxW2ldICsgbWluZGlzKTtcclxuICAgIHZhciB0ID0gKHBsMltrXSA+PSAocGwxW2ldICttaW5kaXMpICYmIHBsMltrXTw9KHBsMVtpXSttYXhkaXMpKSA/IGsgOiAtMTtcclxuICAgIGlmICh0ID4gLTEpIHtcclxuICAgICAgcltyLmxlbmd0aF09cGwxW2ldO1xyXG4gICAgICBpKys7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAoaz49cGwyLmxlbmd0aCkgYnJlYWs7XHJcbiAgICAgIHZhciBrMj1pbmRleE9mU29ydGVkIChwbDEscGwyW2tdLW1heGRpcyk7XHJcbiAgICAgIGlmIChrMj5pKSB7XHJcbiAgICAgICAgdmFyIHQgPSAocGwyW2tdID49IChwbDFbaV0gK21pbmRpcykgJiYgcGwyW2tdPD0ocGwxW2ldK21heGRpcykpID8gayA6IC0xO1xyXG4gICAgICAgIGlmICh0Pi0xKSByW3IubGVuZ3RoXT1wbDFbazJdO1xyXG4gICAgICAgIGk9azI7XHJcbiAgICAgIH0gZWxzZSBicmVhaztcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHI7XHJcbn1cclxuXHJcbnZhciBwbG5vdGZvbGxvdzIgPSBmdW5jdGlvbiAocGwxLCBwbDIsIG1pbmRpcywgbWF4ZGlzKSB7XHJcbiAgdmFyIHIgPSBbXSxpPTA7XHJcbiAgXHJcbiAgd2hpbGUgKGk8cGwxLmxlbmd0aCl7XHJcbiAgICB2YXIgayA9IGluZGV4T2ZTb3J0ZWQocGwyLCBwbDFbaV0gKyBtaW5kaXMpO1xyXG4gICAgdmFyIHQgPSAocGwyW2tdID49IChwbDFbaV0gK21pbmRpcykgJiYgcGwyW2tdPD0ocGwxW2ldK21heGRpcykpID8gayA6IC0xO1xyXG4gICAgaWYgKHQgPiAtMSkge1xyXG4gICAgICBpKys7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAoaz49cGwyLmxlbmd0aCkge1xyXG4gICAgICAgIHI9ci5jb25jYXQocGwxLnNsaWNlKGkpKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgazI9aW5kZXhPZlNvcnRlZCAocGwxLHBsMltrXS1tYXhkaXMpO1xyXG4gICAgICAgIGlmIChrMj5pKSB7XHJcbiAgICAgICAgICByPXIuY29uY2F0KHBsMS5zbGljZShpLGsyKSk7XHJcbiAgICAgICAgICBpPWsyO1xyXG4gICAgICAgIH0gZWxzZSBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gcjtcclxufVxyXG4vKiB0aGlzIGlzIGluY29ycmVjdCAqL1xyXG52YXIgcGxmb2xsb3cgPSBmdW5jdGlvbiAocGwxLCBwbDIsIGRpc3RhbmNlKSB7XHJcbiAgdmFyIHIgPSBbXSxpPTA7XHJcblxyXG4gIHdoaWxlIChpPHBsMS5sZW5ndGgpe1xyXG4gICAgdmFyIGsgPSBpbmRleE9mU29ydGVkKHBsMiwgcGwxW2ldICsgZGlzdGFuY2UpO1xyXG4gICAgdmFyIHQgPSAocGwyW2tdID09PSAocGwxW2ldICsgZGlzdGFuY2UpKSA/IGsgOiAtMTtcclxuICAgIGlmICh0ID4gLTEpIHtcclxuICAgICAgci5wdXNoKHBsMVtpXSk7XHJcbiAgICAgIGkrKztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmIChrPj1wbDIubGVuZ3RoKSBicmVhaztcclxuICAgICAgdmFyIGsyPWluZGV4T2ZTb3J0ZWQgKHBsMSxwbDJba10tZGlzdGFuY2UpO1xyXG4gICAgICBpZiAoazI+aSkge1xyXG4gICAgICAgIHQgPSAocGwyW2tdID09PSAocGwxW2syXSArIGRpc3RhbmNlKSkgPyBrIDogLTE7XHJcbiAgICAgICAgaWYgKHQ+LTEpIHtcclxuICAgICAgICAgICByLnB1c2gocGwxW2syXSk7XHJcbiAgICAgICAgICAgazIrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgaT1rMjtcclxuICAgICAgfSBlbHNlIGJyZWFrO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gcjtcclxufVxyXG52YXIgcGxub3Rmb2xsb3cgPSBmdW5jdGlvbiAocGwxLCBwbDIsIGRpc3RhbmNlKSB7XHJcbiAgdmFyIHIgPSBbXTtcclxuICB2YXIgciA9IFtdLGk9MDtcclxuICB2YXIgc3dhcCA9IDA7XHJcbiAgXHJcbiAgd2hpbGUgKGk8cGwxLmxlbmd0aCl7XHJcbiAgICB2YXIgayA9IGluZGV4T2ZTb3J0ZWQocGwyLCBwbDFbaV0gKyBkaXN0YW5jZSk7XHJcbiAgICB2YXIgdCA9IChwbDJba10gPT09IChwbDFbaV0gKyBkaXN0YW5jZSkpID8gayA6IC0xO1xyXG4gICAgaWYgKHQgPiAtMSkgeyBcclxuICAgICAgaSsrO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKGs+PXBsMi5sZW5ndGgpIHtcclxuICAgICAgICByPXIuY29uY2F0KHBsMS5zbGljZShpKSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdmFyIGsyPWluZGV4T2ZTb3J0ZWQgKHBsMSxwbDJba10tZGlzdGFuY2UpO1xyXG4gICAgICAgIGlmIChrMj5pKSB7XHJcbiAgICAgICAgICByPXIuY29uY2F0KHBsMS5zbGljZShpLGsyKSk7XHJcbiAgICAgICAgICBpPWsyO1xyXG4gICAgICAgIH0gZWxzZSBicmVhaztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gcjtcclxufVxyXG52YXIgcGxhbmQgPSBmdW5jdGlvbiAocGwxLCBwbDIsIGRpc3RhbmNlKSB7XHJcbiAgdmFyIHIgPSBbXTtcclxuICB2YXIgc3dhcCA9IDA7XHJcbiAgXHJcbiAgaWYgKHBsMS5sZW5ndGggPiBwbDIubGVuZ3RoKSB7IC8vc3dhcCBmb3IgZmFzdGVyIGNvbXBhcmVcclxuICAgIHZhciB0ID0gcGwyO1xyXG4gICAgcGwyID0gcGwxO1xyXG4gICAgcGwxID0gdDtcclxuICAgIHN3YXAgPSBkaXN0YW5jZTtcclxuICAgIGRpc3RhbmNlID0gLWRpc3RhbmNlO1xyXG4gIH1cclxuICBmb3IgKHZhciBpID0gMDsgaSA8IHBsMS5sZW5ndGg7IGkrKykge1xyXG4gICAgdmFyIGsgPSBpbmRleE9mU29ydGVkKHBsMiwgcGwxW2ldICsgZGlzdGFuY2UpO1xyXG4gICAgdmFyIHQgPSAocGwyW2tdID09PSAocGwxW2ldICsgZGlzdGFuY2UpKSA/IGsgOiAtMTtcclxuICAgIGlmICh0ID4gLTEpIHtcclxuICAgICAgci5wdXNoKHBsMVtpXSAtIHN3YXApO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gcjtcclxufVxyXG52YXIgY29tYmluZT1mdW5jdGlvbiAocG9zdGluZ3MpIHtcclxuICB2YXIgb3V0PVtdO1xyXG4gIGZvciAodmFyIGkgaW4gcG9zdGluZ3MpIHtcclxuICAgIG91dD1vdXQuY29uY2F0KHBvc3RpbmdzW2ldKTtcclxuICB9XHJcbiAgb3V0LnNvcnQoZnVuY3Rpb24oYSxiKXtyZXR1cm4gYS1ifSk7XHJcbiAgcmV0dXJuIG91dDtcclxufVxyXG5cclxudmFyIHVuaXF1ZSA9IGZ1bmN0aW9uKGFyKXtcclxuICAgaWYgKCFhciB8fCAhYXIubGVuZ3RoKSByZXR1cm4gW107XHJcbiAgIHZhciB1ID0ge30sIGEgPSBbXTtcclxuICAgZm9yKHZhciBpID0gMCwgbCA9IGFyLmxlbmd0aDsgaSA8IGw7ICsraSl7XHJcbiAgICBpZih1Lmhhc093blByb3BlcnR5KGFyW2ldKSkgY29udGludWU7XHJcbiAgICBhLnB1c2goYXJbaV0pO1xyXG4gICAgdVthcltpXV0gPSAxO1xyXG4gICB9XHJcbiAgIHJldHVybiBhO1xyXG59XHJcblxyXG5cclxuXHJcbnZhciBwbHBocmFzZSA9IGZ1bmN0aW9uIChwb3N0aW5ncyxvcHMpIHtcclxuICB2YXIgciA9IFtdO1xyXG4gIGZvciAodmFyIGk9MDtpPHBvc3RpbmdzLmxlbmd0aDtpKyspIHtcclxuICBcdGlmICghcG9zdGluZ3NbaV0pICByZXR1cm4gW107XHJcbiAgXHRpZiAoMCA9PT0gaSkge1xyXG4gIFx0ICByID0gcG9zdGluZ3NbMF07XHJcbiAgXHR9IGVsc2Uge1xyXG4gICAgICBpZiAob3BzW2ldPT0nYW5kbm90Jykge1xyXG4gICAgICAgIHIgPSBwbG5vdGZvbGxvdyhyLCBwb3N0aW5nc1tpXSwgaSk7ICBcclxuICAgICAgfWVsc2Uge1xyXG4gICAgICAgIHIgPSBwbGFuZChyLCBwb3N0aW5nc1tpXSwgaSk7ICBcclxuICAgICAgfVxyXG4gIFx0fVxyXG4gIH1cclxuICBcclxuICByZXR1cm4gcjtcclxufVxyXG4vL3JldHVybiBhbiBhcnJheSBvZiBncm91cCBoYXZpbmcgYW55IG9mIHBsIGl0ZW1cclxudmFyIG1hdGNoUG9zdGluZz1mdW5jdGlvbihwbCxndXBsLHN0YXJ0LGVuZCkge1xyXG4gIHN0YXJ0PXN0YXJ0fHwwO1xyXG4gIGVuZD1lbmR8fC0xO1xyXG4gIGlmIChlbmQ9PS0xKSBlbmQ9TWF0aC5wb3coMiwgNTMpOyAvLyBtYXggaW50ZWdlciB2YWx1ZVxyXG5cclxuICB2YXIgY291bnQ9MCwgaSA9IGo9IDAsICByZXN1bHQgPSBbXSAsdj0wO1xyXG4gIHZhciBkb2NzPVtdLCBmcmVxPVtdO1xyXG4gIGlmICghcGwpIHJldHVybiB7ZG9jczpbXSxmcmVxOltdfTtcclxuICB3aGlsZSggaSA8IHBsLmxlbmd0aCAmJiBqIDwgZ3VwbC5sZW5ndGggKXtcclxuICAgICBpZiAocGxbaV0gPCBndXBsW2pdICl7IFxyXG4gICAgICAgY291bnQrKztcclxuICAgICAgIHY9cGxbaV07XHJcbiAgICAgICBpKys7IFxyXG4gICAgIH0gZWxzZSB7XHJcbiAgICAgICBpZiAoY291bnQpIHtcclxuICAgICAgICBpZiAodj49c3RhcnQgJiYgdjxlbmQpIHtcclxuICAgICAgICAgIGRvY3MucHVzaChqKTtcclxuICAgICAgICAgIGZyZXEucHVzaChjb3VudCk7ICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgIH1cclxuICAgICAgIGorKztcclxuICAgICAgIGNvdW50PTA7XHJcbiAgICAgfVxyXG4gIH1cclxuICBpZiAoY291bnQgJiYgajxndXBsLmxlbmd0aCAmJiB2Pj1zdGFydCAmJiB2PGVuZCkge1xyXG4gICAgZG9jcy5wdXNoKGopO1xyXG4gICAgZnJlcS5wdXNoKGNvdW50KTtcclxuICAgIGNvdW50PTA7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgd2hpbGUgKGo9PWd1cGwubGVuZ3RoICYmIGk8cGwubGVuZ3RoICYmIHBsW2ldID49IGd1cGxbZ3VwbC5sZW5ndGgtMV0pIHtcclxuICAgICAgaSsrO1xyXG4gICAgICBjb3VudCsrO1xyXG4gICAgfVxyXG4gICAgaWYgKHY+PXN0YXJ0ICYmIHY8ZW5kKSB7XHJcbiAgICAgIGRvY3MucHVzaChqKTtcclxuICAgICAgZnJlcS5wdXNoKGNvdW50KTsgICAgICBcclxuICAgIH1cclxuICB9IFxyXG4gIHJldHVybiB7ZG9jczpkb2NzLGZyZXE6ZnJlcX07XHJcbn1cclxuXHJcbnZhciB0cmltPWZ1bmN0aW9uKGFycixzdGFydCxlbmQpIHtcclxuICB2YXIgcz1pbmRleE9mU29ydGVkKGFycixzdGFydCk7XHJcbiAgdmFyIGU9aW5kZXhPZlNvcnRlZChhcnIsZW5kKTtcclxuICByZXR1cm4gYXJyLnNsaWNlKHMsZSsxKTtcclxufVxyXG52YXIgcGxpc3Q9e307XHJcbnBsaXN0LnVucGFjaz11bnBhY2s7XHJcbnBsaXN0LnBscGhyYXNlPXBscGhyYXNlO1xyXG5wbGlzdC5wbGhlYWQ9cGxoZWFkO1xyXG5wbGlzdC5wbGZvbGxvdzI9cGxmb2xsb3cyO1xyXG5wbGlzdC5wbG5vdGZvbGxvdzI9cGxub3Rmb2xsb3cyO1xyXG5wbGlzdC5wbGZvbGxvdz1wbGZvbGxvdztcclxucGxpc3QucGxub3Rmb2xsb3c9cGxub3Rmb2xsb3c7XHJcbnBsaXN0LnVuaXF1ZT11bmlxdWU7XHJcbnBsaXN0LmluZGV4T2ZTb3J0ZWQ9aW5kZXhPZlNvcnRlZDtcclxucGxpc3QubWF0Y2hQb3N0aW5nPW1hdGNoUG9zdGluZztcclxucGxpc3QudHJpbT10cmltO1xyXG5cclxucGxpc3QuZ3JvdXBieXNsb3Q9Z3JvdXBieXNsb3Q7XHJcbnBsaXN0Lmdyb3VwYnlibG9jazI9Z3JvdXBieWJsb2NrMjtcclxucGxpc3QuY291bnRieXBvc3Rpbmc9Y291bnRieXBvc3Rpbmc7XHJcbnBsaXN0Lmdyb3VwYnlwb3N0aW5nPWdyb3VwYnlwb3N0aW5nO1xyXG5wbGlzdC5ncm91cGJ5cG9zdGluZzI9Z3JvdXBieXBvc3RpbmcyO1xyXG5wbGlzdC5ncm91cHN1bT1ncm91cHN1bTtcclxucGxpc3QuY29tYmluZT1jb21iaW5lO1xyXG5tb2R1bGUuZXhwb3J0cz1wbGlzdDsiLCIvKlxyXG52YXIgZG9zZWFyY2gyPWZ1bmN0aW9uKGVuZ2luZSxvcHRzLGNiLGNvbnRleHQpIHtcclxuXHRvcHRzXHJcblx0XHRuZmlsZSxucGFnZSAgLy9yZXR1cm4gYSBoaWdobGlnaHRlZCBwYWdlXHJcblx0XHRuZmlsZSxbcGFnZXNdIC8vcmV0dXJuIGhpZ2hsaWdodGVkIHBhZ2VzIFxyXG5cdFx0bmZpbGUgICAgICAgIC8vcmV0dXJuIGVudGlyZSBoaWdobGlnaHRlZCBmaWxlXHJcblx0XHRhYnNfbnBhZ2VcclxuXHRcdFthYnNfcGFnZXNdICAvL3JldHVybiBzZXQgb2YgaGlnaGxpZ2h0ZWQgcGFnZXMgKG1heSBjcm9zcyBmaWxlKVxyXG5cclxuXHRcdGZpbGVuYW1lLCBwYWdlbmFtZVxyXG5cdFx0ZmlsZW5hbWUsW3BhZ2VuYW1lc11cclxuXHJcblx0XHRleGNlcnB0ICAgICAgLy9cclxuXHQgICAgc29ydEJ5ICAgICAgIC8vZGVmYXVsdCBuYXR1cmFsLCBzb3J0YnkgYnkgdnNtIHJhbmtpbmdcclxuXHJcblx0Ly9yZXR1cm4gZXJyLGFycmF5X29mX3N0cmluZyAsUSAgKFEgY29udGFpbnMgbG93IGxldmVsIHNlYXJjaCByZXN1bHQpXHJcbn1cclxuXHJcbiovXHJcbi8qIFRPRE8gc29ydGVkIHRva2VucyAqL1xyXG52YXIgcGxpc3Q9cmVxdWlyZShcIi4vcGxpc3RcIik7XHJcbnZhciBib29sc2VhcmNoPXJlcXVpcmUoXCIuL2Jvb2xzZWFyY2hcIik7XHJcbnZhciBleGNlcnB0PXJlcXVpcmUoXCIuL2V4Y2VycHRcIik7XHJcbnZhciBwYXJzZVRlcm0gPSBmdW5jdGlvbihlbmdpbmUscmF3LG9wdHMpIHtcclxuXHRpZiAoIXJhdykgcmV0dXJuO1xyXG5cdHZhciByZXM9e3JhdzpyYXcsdmFyaWFudHM6W10sdGVybTonJyxvcDonJ307XHJcblx0dmFyIHRlcm09cmF3LCBvcD0wO1xyXG5cdHZhciBmaXJzdGNoYXI9dGVybVswXTtcclxuXHR2YXIgdGVybXJlZ2V4PVwiXCI7XHJcblx0aWYgKGZpcnN0Y2hhcj09Jy0nKSB7XHJcblx0XHR0ZXJtPXRlcm0uc3Vic3RyaW5nKDEpO1xyXG5cdFx0Zmlyc3RjaGFyPXRlcm1bMF07XHJcblx0XHRyZXMuZXhjbHVkZT10cnVlOyAvL2V4Y2x1ZGVcclxuXHR9XHJcblx0dGVybT10ZXJtLnRyaW0oKTtcclxuXHR2YXIgbGFzdGNoYXI9dGVybVt0ZXJtLmxlbmd0aC0xXTtcclxuXHR0ZXJtPWVuZ2luZS5hbmFseXplci5ub3JtYWxpemUodGVybSk7XHJcblx0XHJcblx0aWYgKHRlcm0uaW5kZXhPZihcIiVcIik+LTEpIHtcclxuXHRcdHZhciB0ZXJtcmVnZXg9XCJeXCIrdGVybS5yZXBsYWNlKC8lKy9nLFwiLitcIikrXCIkXCI7XHJcblx0XHRpZiAoZmlyc3RjaGFyPT1cIiVcIikgXHR0ZXJtcmVnZXg9XCIuK1wiK3Rlcm1yZWdleC5zdWJzdHIoMSk7XHJcblx0XHRpZiAobGFzdGNoYXI9PVwiJVwiKSBcdHRlcm1yZWdleD10ZXJtcmVnZXguc3Vic3RyKDAsdGVybXJlZ2V4Lmxlbmd0aC0xKStcIi4rXCI7XHJcblx0fVxyXG5cclxuXHRpZiAodGVybXJlZ2V4KSB7XHJcblx0XHRyZXMudmFyaWFudHM9ZXhwYW5kVGVybShlbmdpbmUsdGVybXJlZ2V4KTtcclxuXHR9XHJcblxyXG5cdHJlcy5rZXk9dGVybTtcclxuXHRyZXR1cm4gcmVzO1xyXG59XHJcbnZhciBleHBhbmRUZXJtPWZ1bmN0aW9uKGVuZ2luZSxyZWdleCkge1xyXG5cdHZhciByPW5ldyBSZWdFeHAocmVnZXgpO1xyXG5cdHZhciB0b2tlbnM9ZW5naW5lLmdldChcInRva2Vuc1wiKTtcclxuXHR2YXIgcG9zdGluZ3NMZW5ndGg9ZW5naW5lLmdldChcInBvc3RpbmdzbGVuZ3RoXCIpO1xyXG5cdGlmICghcG9zdGluZ3NMZW5ndGgpIHBvc3RpbmdzTGVuZ3RoPVtdO1xyXG5cdHZhciBvdXQ9W107XHJcblx0Zm9yICh2YXIgaT0wO2k8dG9rZW5zLmxlbmd0aDtpKyspIHtcclxuXHRcdHZhciBtPXRva2Vuc1tpXS5tYXRjaChyKTtcclxuXHRcdGlmIChtKSB7XHJcblx0XHRcdG91dC5wdXNoKFttWzBdLHBvc3RpbmdzTGVuZ3RoW2ldfHwxXSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdG91dC5zb3J0KGZ1bmN0aW9uKGEsYil7cmV0dXJuIGJbMV0tYVsxXX0pO1xyXG5cdHJldHVybiBvdXQ7XHJcbn1cclxudmFyIGlzV2lsZGNhcmQ9ZnVuY3Rpb24ocmF3KSB7XHJcblx0cmV0dXJuICEhcmF3Lm1hdGNoKC9bXFwqXFw/XS8pO1xyXG59XHJcblxyXG52YXIgaXNPclRlcm09ZnVuY3Rpb24odGVybSkge1xyXG5cdHRlcm09dGVybS50cmltKCk7XHJcblx0cmV0dXJuICh0ZXJtW3Rlcm0ubGVuZ3RoLTFdPT09JywnKTtcclxufVxyXG52YXIgb3J0ZXJtPWZ1bmN0aW9uKGVuZ2luZSx0ZXJtLGtleSkge1xyXG5cdFx0dmFyIHQ9e3RleHQ6a2V5fTtcclxuXHRcdGlmIChlbmdpbmUuYW5hbHl6ZXIuc2ltcGxpZmllZFRva2VuKSB7XHJcblx0XHRcdHQuc2ltcGxpZmllZD1lbmdpbmUuYW5hbHl6ZXIuc2ltcGxpZmllZFRva2VuKGtleSk7XHJcblx0XHR9XHJcblx0XHR0ZXJtLnZhcmlhbnRzLnB1c2godCk7XHJcbn1cclxudmFyIG9yVGVybXM9ZnVuY3Rpb24oZW5naW5lLHRva2Vucyxub3cpIHtcclxuXHR2YXIgcmF3PXRva2Vuc1tub3ddO1xyXG5cdHZhciB0ZXJtPXBhcnNlVGVybShlbmdpbmUscmF3KTtcclxuXHRpZiAoIXRlcm0pIHJldHVybjtcclxuXHRvcnRlcm0oZW5naW5lLHRlcm0sdGVybS5rZXkpO1xyXG5cdHdoaWxlIChpc09yVGVybShyYXcpKSAge1xyXG5cdFx0cmF3PXRva2Vuc1srK25vd107XHJcblx0XHR2YXIgdGVybTI9cGFyc2VUZXJtKGVuZ2luZSxyYXcpO1xyXG5cdFx0b3J0ZXJtKGVuZ2luZSx0ZXJtLHRlcm0yLmtleSk7XHJcblx0XHRmb3IgKHZhciBpIGluIHRlcm0yLnZhcmlhbnRzKXtcclxuXHRcdFx0dGVybS52YXJpYW50c1tpXT10ZXJtMi52YXJpYW50c1tpXTtcclxuXHRcdH1cclxuXHRcdHRlcm0ua2V5Kz0nLCcrdGVybTIua2V5O1xyXG5cdH1cclxuXHRyZXR1cm4gdGVybTtcclxufVxyXG5cclxudmFyIGdldE9wZXJhdG9yPWZ1bmN0aW9uKHJhdykge1xyXG5cdHZhciBvcD0nJztcclxuXHRpZiAocmF3WzBdPT0nKycpIG9wPSdpbmNsdWRlJztcclxuXHRpZiAocmF3WzBdPT0nLScpIG9wPSdleGNsdWRlJztcclxuXHRyZXR1cm4gb3A7XHJcbn1cclxudmFyIHBhcnNlUGhyYXNlPWZ1bmN0aW9uKHEpIHtcclxuXHR2YXIgbWF0Y2g9cS5tYXRjaCgvKFwiLis/XCJ8Jy4rPyd8XFxTKykvZylcclxuXHRtYXRjaD1tYXRjaC5tYXAoZnVuY3Rpb24oc3RyKXtcclxuXHRcdHZhciBuPXN0ci5sZW5ndGgsIGg9c3RyLmNoYXJBdCgwKSwgdD1zdHIuY2hhckF0KG4tMSlcclxuXHRcdGlmIChoPT09dCYmKGg9PT0nXCInfGg9PT1cIidcIikpIHN0cj1zdHIuc3Vic3RyKDEsbi0yKVxyXG5cdFx0cmV0dXJuIHN0cjtcclxuXHR9KVxyXG5cdHJldHVybiBtYXRjaDtcclxufVxyXG52YXIgdGliZXRhbk51bWJlcj17XHJcblx0XCJcXHUwZjIwXCI6XCIwXCIsXCJcXHUwZjIxXCI6XCIxXCIsXCJcXHUwZjIyXCI6XCIyXCIsXHRcIlxcdTBmMjNcIjpcIjNcIixcdFwiXFx1MGYyNFwiOlwiNFwiLFxyXG5cdFwiXFx1MGYyNVwiOlwiNVwiLFwiXFx1MGYyNlwiOlwiNlwiLFwiXFx1MGYyN1wiOlwiN1wiLFwiXFx1MGYyOFwiOlwiOFwiLFwiXFx1MGYyOVwiOlwiOVwiXHJcbn1cclxudmFyIHBhcnNlTnVtYmVyPWZ1bmN0aW9uKHJhdykge1xyXG5cdHZhciBuPXBhcnNlSW50KHJhdywxMCk7XHJcblx0aWYgKGlzTmFOKG4pKXtcclxuXHRcdHZhciBjb252ZXJ0ZWQ9W107XHJcblx0XHRmb3IgKHZhciBpPTA7aTxyYXcubGVuZ3RoO2krKykge1xyXG5cdFx0XHR2YXIgbm49dGliZXRhbk51bWJlcltyYXdbaV1dO1xyXG5cdFx0XHRpZiAodHlwZW9mIG5uICE9XCJ1bmRlZmluZWRcIikgY29udmVydGVkW2ldPW5uO1xyXG5cdFx0XHRlbHNlIGJyZWFrO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHBhcnNlSW50KGNvbnZlcnRlZCwxMCk7XHJcblx0fSBlbHNlIHtcclxuXHRcdHJldHVybiBuO1xyXG5cdH1cclxufVxyXG52YXIgcGFyc2VXaWxkY2FyZD1mdW5jdGlvbihyYXcpIHtcclxuXHR2YXIgbj1wYXJzZU51bWJlcihyYXcpIHx8IDE7XHJcblx0dmFyIHFjb3VudD1yYXcuc3BsaXQoJz8nKS5sZW5ndGgtMTtcclxuXHR2YXIgc2NvdW50PXJhdy5zcGxpdCgnKicpLmxlbmd0aC0xO1xyXG5cdHZhciB0eXBlPScnO1xyXG5cdGlmIChxY291bnQpIHR5cGU9Jz8nO1xyXG5cdGVsc2UgaWYgKHNjb3VudCkgdHlwZT0nKic7XHJcblx0cmV0dXJuIHt3aWxkY2FyZDp0eXBlLCB3aWR0aDogbiAsIG9wOid3aWxkY2FyZCd9O1xyXG59XHJcblxyXG52YXIgbmV3UGhyYXNlPWZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiB7dGVybWlkOltdLHBvc3Rpbmc6W10scmF3OicnLHRlcm1sZW5ndGg6W119O1xyXG59IFxyXG52YXIgcGFyc2VRdWVyeT1mdW5jdGlvbihxLHNlcCkge1xyXG5cdGlmIChzZXAgJiYgcS5pbmRleE9mKHNlcCk+LTEpIHtcclxuXHRcdHZhciBtYXRjaD1xLnNwbGl0KHNlcCk7XHJcblx0fSBlbHNlIHtcclxuXHRcdHZhciBtYXRjaD1xLm1hdGNoKC8oXCIuKz9cInwnLis/J3xcXFMrKS9nKVxyXG5cdFx0bWF0Y2g9bWF0Y2gubWFwKGZ1bmN0aW9uKHN0cil7XHJcblx0XHRcdHZhciBuPXN0ci5sZW5ndGgsIGg9c3RyLmNoYXJBdCgwKSwgdD1zdHIuY2hhckF0KG4tMSlcclxuXHRcdFx0aWYgKGg9PT10JiYoaD09PSdcIid8aD09PVwiJ1wiKSkgc3RyPXN0ci5zdWJzdHIoMSxuLTIpXHJcblx0XHRcdHJldHVybiBzdHJcclxuXHRcdH0pXHJcblx0XHQvL2NvbnNvbGUubG9nKGlucHV0LCc9PT4nLG1hdGNoKVx0XHRcclxuXHR9XHJcblx0cmV0dXJuIG1hdGNoO1xyXG59XHJcbnZhciBsb2FkUGhyYXNlPWZ1bmN0aW9uKHBocmFzZSkge1xyXG5cdC8qIHJlbW92ZSBsZWFkaW5nIGFuZCBlbmRpbmcgd2lsZGNhcmQgKi9cclxuXHR2YXIgUT10aGlzO1xyXG5cdHZhciBjYWNoZT1RLmVuZ2luZS5wb3N0aW5nQ2FjaGU7XHJcblx0aWYgKGNhY2hlW3BocmFzZS5rZXldKSB7XHJcblx0XHRwaHJhc2UucG9zdGluZz1jYWNoZVtwaHJhc2Uua2V5XTtcclxuXHRcdHJldHVybiBRO1xyXG5cdH1cclxuXHRpZiAocGhyYXNlLnRlcm1pZC5sZW5ndGg9PTEpIHtcclxuXHRcdGlmICghUS50ZXJtcy5sZW5ndGgpe1xyXG5cdFx0XHRwaHJhc2UucG9zdGluZz1bXTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGNhY2hlW3BocmFzZS5rZXldPXBocmFzZS5wb3N0aW5nPVEudGVybXNbcGhyYXNlLnRlcm1pZFswXV0ucG9zdGluZztcdFxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIFE7XHJcblx0fVxyXG5cclxuXHR2YXIgaT0wLCByPVtdLGRpcz0wO1xyXG5cdHdoaWxlKGk8cGhyYXNlLnRlcm1pZC5sZW5ndGgpIHtcclxuXHQgIHZhciBUPVEudGVybXNbcGhyYXNlLnRlcm1pZFtpXV07XHJcblx0XHRpZiAoMCA9PT0gaSkge1xyXG5cdFx0XHRyID0gVC5wb3N0aW5nO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdCAgICBpZiAoVC5vcD09J3dpbGRjYXJkJykge1xyXG5cdFx0ICAgIFx0VD1RLnRlcm1zW3BocmFzZS50ZXJtaWRbaSsrXV07XHJcblx0XHQgICAgXHR2YXIgd2lkdGg9VC53aWR0aDtcclxuXHRcdCAgICBcdHZhciB3aWxkY2FyZD1ULndpbGRjYXJkO1xyXG5cdFx0ICAgIFx0VD1RLnRlcm1zW3BocmFzZS50ZXJtaWRbaV1dO1xyXG5cdFx0ICAgIFx0dmFyIG1pbmRpcz1kaXM7XHJcblx0XHQgICAgXHRpZiAod2lsZGNhcmQ9PSc/JykgbWluZGlzPWRpcyt3aWR0aDtcclxuXHRcdCAgICBcdGlmIChULmV4Y2x1ZGUpIHIgPSBwbGlzdC5wbG5vdGZvbGxvdzIociwgVC5wb3N0aW5nLCBtaW5kaXMsIGRpcyt3aWR0aCk7XHJcblx0XHQgICAgXHRlbHNlIHIgPSBwbGlzdC5wbGZvbGxvdzIociwgVC5wb3N0aW5nLCBtaW5kaXMsIGRpcyt3aWR0aCk7XHRcdCAgICBcdFxyXG5cdFx0ICAgIFx0ZGlzKz0od2lkdGgtMSk7XHJcblx0XHQgICAgfWVsc2Uge1xyXG5cdFx0ICAgIFx0aWYgKFQucG9zdGluZykge1xyXG5cdFx0ICAgIFx0XHRpZiAoVC5leGNsdWRlKSByID0gcGxpc3QucGxub3Rmb2xsb3cociwgVC5wb3N0aW5nLCBkaXMpO1xyXG5cdFx0ICAgIFx0XHRlbHNlIHIgPSBwbGlzdC5wbGZvbGxvdyhyLCBULnBvc3RpbmcsIGRpcyk7XHJcblx0XHQgICAgXHR9XHJcblx0XHQgICAgfVxyXG5cdFx0fVxyXG5cdFx0ZGlzICs9IHBocmFzZS50ZXJtbGVuZ3RoW2ldO1xyXG5cdFx0aSsrO1xyXG5cdFx0aWYgKCFyKSByZXR1cm4gUTtcclxuICB9XHJcbiAgcGhyYXNlLnBvc3Rpbmc9cjtcclxuICBjYWNoZVtwaHJhc2Uua2V5XT1yO1xyXG4gIHJldHVybiBRO1xyXG59XHJcbnZhciB0cmltU3BhY2U9ZnVuY3Rpb24oZW5naW5lLHF1ZXJ5KSB7XHJcblx0aWYgKCFxdWVyeSkgcmV0dXJuIFwiXCI7XHJcblx0dmFyIGk9MDtcclxuXHR2YXIgaXNTa2lwPWVuZ2luZS5hbmFseXplci5pc1NraXA7XHJcblx0d2hpbGUgKGlzU2tpcChxdWVyeVtpXSkgJiYgaTxxdWVyeS5sZW5ndGgpIGkrKztcclxuXHRyZXR1cm4gcXVlcnkuc3Vic3RyaW5nKGkpO1xyXG59XHJcbnZhciBnZXRTZWdXaXRoSGl0PWZ1bmN0aW9uKGZpbGVpZCxvZmZzZXRzKSB7XHJcblx0dmFyIFE9dGhpcyxlbmdpbmU9US5lbmdpbmU7XHJcblx0dmFyIHNlZ1dpdGhIaXQ9cGxpc3QuZ3JvdXBieXBvc3RpbmcyKFEuYnlGaWxlW2ZpbGVpZCBdLCBvZmZzZXRzKTtcclxuXHRpZiAoc2VnV2l0aEhpdC5sZW5ndGgpIHNlZ1dpdGhIaXQuc2hpZnQoKTsgLy90aGUgZmlyc3QgaXRlbSBpcyBub3QgdXNlZCAoMH5RLmJ5RmlsZVswXSApXHJcblx0dmFyIG91dD1bXTtcclxuXHRzZWdXaXRoSGl0Lm1hcChmdW5jdGlvbihwLGlkeCl7aWYgKHAubGVuZ3RoKSBvdXQucHVzaChpZHgpfSk7XHJcblx0cmV0dXJuIG91dDtcclxufVxyXG52YXIgc2VnV2l0aEhpdD1mdW5jdGlvbihmaWxlaWQpIHtcclxuXHR2YXIgUT10aGlzLGVuZ2luZT1RLmVuZ2luZTtcclxuXHR2YXIgb2Zmc2V0cz1lbmdpbmUuZ2V0RmlsZVNlZ09mZnNldHMoZmlsZWlkKTtcclxuXHRyZXR1cm4gZ2V0U2VnV2l0aEhpdC5hcHBseSh0aGlzLFtmaWxlaWQsb2Zmc2V0c10pO1xyXG59XHJcbnZhciBpc1NpbXBsZVBocmFzZT1mdW5jdGlvbihwaHJhc2UpIHtcclxuXHR2YXIgbT1waHJhc2UubWF0Y2goL1tcXD8lXl0vKTtcclxuXHRyZXR1cm4gIW07XHJcbn1cclxuXHJcbi8vIOeZvOiPqeaPkOW/gyAgID09PiDnmbzoj6kgIOaPkOW/gyAgICAgICAyIDIgICBcclxuLy8g6I+p5o+Q5b+DICAgICA9PT4g6I+p5o+QICDmj5Dlv4MgICAgICAgMSAyXHJcbi8vIOWKq+WKqyAgICAgICA9PT4g5YqrICAgIOWKqyAgICAgICAgIDEgMSAgIC8vIGludmFsaWRcclxuLy8g5Zug57ej5omA55Sf6YGTICA9PT4g5Zug57ejICDmiYDnlJ8gICDpgZMgICAyIDIgMVxyXG52YXIgc3BsaXRQaHJhc2U9ZnVuY3Rpb24oZW5naW5lLHNpbXBsZXBocmFzZSxiaWdyYW0pIHtcclxuXHR2YXIgYmlncmFtPWJpZ3JhbXx8ZW5naW5lLmdldChcIm1ldGFcIikuYmlncmFtfHxbXTtcclxuXHR2YXIgdG9rZW5zPWVuZ2luZS5hbmFseXplci50b2tlbml6ZShzaW1wbGVwaHJhc2UpLnRva2VucztcclxuXHR2YXIgbG9hZHRva2Vucz1bXSxsZW5ndGhzPVtdLGo9MCxsYXN0YmlncmFtcG9zPS0xO1xyXG5cdHdoaWxlIChqKzE8dG9rZW5zLmxlbmd0aCkge1xyXG5cdFx0dmFyIHRva2VuPWVuZ2luZS5hbmFseXplci5ub3JtYWxpemUodG9rZW5zW2pdKTtcclxuXHRcdHZhciBuZXh0dG9rZW49ZW5naW5lLmFuYWx5emVyLm5vcm1hbGl6ZSh0b2tlbnNbaisxXSk7XHJcblx0XHR2YXIgYmk9dG9rZW4rbmV4dHRva2VuO1xyXG5cdFx0dmFyIGk9cGxpc3QuaW5kZXhPZlNvcnRlZChiaWdyYW0sYmkpO1xyXG5cdFx0aWYgKGJpZ3JhbVtpXT09YmkpIHtcclxuXHRcdFx0bG9hZHRva2Vucy5wdXNoKGJpKTtcclxuXHRcdFx0aWYgKGorMzx0b2tlbnMubGVuZ3RoKSB7XHJcblx0XHRcdFx0bGFzdGJpZ3JhbXBvcz1qO1xyXG5cdFx0XHRcdGorKztcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRpZiAoaisyPT10b2tlbnMubGVuZ3RoKXsgXHJcblx0XHRcdFx0XHRpZiAobGFzdGJpZ3JhbXBvcysxPT1qICkge1xyXG5cdFx0XHRcdFx0XHRsZW5ndGhzW2xlbmd0aHMubGVuZ3RoLTFdLS07XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRsYXN0YmlncmFtcG9zPWo7XHJcblx0XHRcdFx0XHRqKys7XHJcblx0XHRcdFx0fWVsc2Uge1xyXG5cdFx0XHRcdFx0bGFzdGJpZ3JhbXBvcz1qO1x0XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGxlbmd0aHMucHVzaCgyKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGlmICghYmlncmFtIHx8IGxhc3RiaWdyYW1wb3M9PS0xIHx8IGxhc3RiaWdyYW1wb3MrMSE9aikge1xyXG5cdFx0XHRcdGxvYWR0b2tlbnMucHVzaCh0b2tlbik7XHJcblx0XHRcdFx0bGVuZ3Rocy5wdXNoKDEpO1x0XHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdGorKztcclxuXHR9XHJcblxyXG5cdHdoaWxlIChqPHRva2Vucy5sZW5ndGgpIHtcclxuXHRcdHZhciB0b2tlbj1lbmdpbmUuYW5hbHl6ZXIubm9ybWFsaXplKHRva2Vuc1tqXSk7XHJcblx0XHRsb2FkdG9rZW5zLnB1c2godG9rZW4pO1xyXG5cdFx0bGVuZ3Rocy5wdXNoKDEpO1xyXG5cdFx0aisrO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHt0b2tlbnM6bG9hZHRva2VucywgbGVuZ3RoczogbGVuZ3RocyAsIHRva2VubGVuZ3RoOiB0b2tlbnMubGVuZ3RofTtcclxufVxyXG4vKiBob3N0IGhhcyBmYXN0IG5hdGl2ZSBmdW5jdGlvbiAqL1xyXG52YXIgZmFzdFBocmFzZT1mdW5jdGlvbihlbmdpbmUscGhyYXNlKSB7XHJcblx0dmFyIHBocmFzZV90ZXJtPW5ld1BocmFzZSgpO1xyXG5cdC8vdmFyIHRva2Vucz1lbmdpbmUuYW5hbHl6ZXIudG9rZW5pemUocGhyYXNlKS50b2tlbnM7XHJcblx0dmFyIHNwbGl0dGVkPXNwbGl0UGhyYXNlKGVuZ2luZSxwaHJhc2UpO1xyXG5cclxuXHR2YXIgcGF0aHM9cG9zdGluZ1BhdGhGcm9tVG9rZW5zKGVuZ2luZSxzcGxpdHRlZC50b2tlbnMpO1xyXG4vL2NyZWF0ZSB3aWxkY2FyZFxyXG5cclxuXHRwaHJhc2VfdGVybS53aWR0aD1zcGxpdHRlZC50b2tlbmxlbmd0aDsgLy9mb3IgZXhjZXJwdC5qcyB0byBnZXRQaHJhc2VXaWR0aFxyXG5cclxuXHRlbmdpbmUuZ2V0KHBhdGhzLHthZGRyZXNzOnRydWV9LGZ1bmN0aW9uKHBvc3RpbmdBZGRyZXNzKXsgLy90aGlzIGlzIHN5bmNcclxuXHRcdHBocmFzZV90ZXJtLmtleT1waHJhc2U7XHJcblx0XHR2YXIgcG9zdGluZ0FkZHJlc3NXaXRoV2lsZGNhcmQ9W107XHJcblx0XHRmb3IgKHZhciBpPTA7aTxwb3N0aW5nQWRkcmVzcy5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdHBvc3RpbmdBZGRyZXNzV2l0aFdpbGRjYXJkLnB1c2gocG9zdGluZ0FkZHJlc3NbaV0pO1xyXG5cdFx0XHRpZiAoc3BsaXR0ZWQubGVuZ3Roc1tpXT4xKSB7XHJcblx0XHRcdFx0cG9zdGluZ0FkZHJlc3NXaXRoV2lsZGNhcmQucHVzaChbc3BsaXR0ZWQubGVuZ3Roc1tpXSwwXSk7IC8vd2lsZGNhcmQgaGFzIGJsb2Nrc2l6ZT09MCBcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZW5naW5lLnBvc3RpbmdDYWNoZVtwaHJhc2VdPWVuZ2luZS5tZXJnZVBvc3RpbmdzKHBvc3RpbmdBZGRyZXNzV2l0aFdpbGRjYXJkKTtcclxuXHR9KTtcclxuXHRyZXR1cm4gcGhyYXNlX3Rlcm07XHJcblx0Ly8gcHV0IHBvc3RpbmcgaW50byBjYWNoZVtwaHJhc2Uua2V5XVxyXG59XHJcbnZhciBzbG93UGhyYXNlPWZ1bmN0aW9uKGVuZ2luZSx0ZXJtcyxwaHJhc2UpIHtcclxuXHR2YXIgaj0wLHRva2Vucz1lbmdpbmUuYW5hbHl6ZXIudG9rZW5pemUocGhyYXNlKS50b2tlbnM7XHJcblx0dmFyIHBocmFzZV90ZXJtPW5ld1BocmFzZSgpO1xyXG5cdHZhciB0ZXJtaWQ9MDtcclxuXHR3aGlsZSAoajx0b2tlbnMubGVuZ3RoKSB7XHJcblx0XHR2YXIgcmF3PXRva2Vuc1tqXSwgdGVybWxlbmd0aD0xO1xyXG5cdFx0aWYgKGlzV2lsZGNhcmQocmF3KSkge1xyXG5cdFx0XHRpZiAocGhyYXNlX3Rlcm0udGVybWlkLmxlbmd0aD09MCkgIHsgLy9za2lwIGxlYWRpbmcgd2lsZCBjYXJkXHJcblx0XHRcdFx0aisrXHJcblx0XHRcdFx0Y29udGludWU7XHJcblx0XHRcdH1cclxuXHRcdFx0dGVybXMucHVzaChwYXJzZVdpbGRjYXJkKHJhdykpO1xyXG5cdFx0XHR0ZXJtaWQ9dGVybXMubGVuZ3RoLTE7XHJcblx0XHRcdHBocmFzZV90ZXJtLnRlcm1pZC5wdXNoKHRlcm1pZCk7XHJcblx0XHRcdHBocmFzZV90ZXJtLnRlcm1sZW5ndGgucHVzaCh0ZXJtbGVuZ3RoKTtcclxuXHRcdH0gZWxzZSBpZiAoaXNPclRlcm0ocmF3KSl7XHJcblx0XHRcdHZhciB0ZXJtPW9yVGVybXMuYXBwbHkodGhpcyxbdG9rZW5zLGpdKTtcclxuXHRcdFx0aWYgKHRlcm0pIHtcclxuXHRcdFx0XHR0ZXJtcy5wdXNoKHRlcm0pO1xyXG5cdFx0XHRcdHRlcm1pZD10ZXJtcy5sZW5ndGgtMTtcclxuXHRcdFx0XHRqKz10ZXJtLmtleS5zcGxpdCgnLCcpLmxlbmd0aC0xO1x0XHRcdFx0XHRcclxuXHRcdFx0fVxyXG5cdFx0XHRqKys7XHJcblx0XHRcdHBocmFzZV90ZXJtLnRlcm1pZC5wdXNoKHRlcm1pZCk7XHJcblx0XHRcdHBocmFzZV90ZXJtLnRlcm1sZW5ndGgucHVzaCh0ZXJtbGVuZ3RoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHZhciBwaHJhc2U9XCJcIjtcclxuXHRcdFx0d2hpbGUgKGo8dG9rZW5zLmxlbmd0aCkge1xyXG5cdFx0XHRcdGlmICghKGlzV2lsZGNhcmQodG9rZW5zW2pdKSB8fCBpc09yVGVybSh0b2tlbnNbal0pKSkge1xyXG5cdFx0XHRcdFx0cGhyYXNlKz10b2tlbnNbal07XHJcblx0XHRcdFx0XHRqKys7XHJcblx0XHRcdFx0fSBlbHNlIGJyZWFrO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgc3BsaXR0ZWQ9c3BsaXRQaHJhc2UoZW5naW5lLHBocmFzZSk7XHJcblx0XHRcdGZvciAodmFyIGk9MDtpPHNwbGl0dGVkLnRva2Vucy5sZW5ndGg7aSsrKSB7XHJcblxyXG5cdFx0XHRcdHZhciB0ZXJtPXBhcnNlVGVybShlbmdpbmUsc3BsaXR0ZWQudG9rZW5zW2ldKTtcclxuXHRcdFx0XHR2YXIgdGVybWlkeD10ZXJtcy5tYXAoZnVuY3Rpb24oYSl7cmV0dXJuIGEua2V5fSkuaW5kZXhPZih0ZXJtLmtleSk7XHJcblx0XHRcdFx0aWYgKHRlcm1pZHg9PS0xKSB7XHJcblx0XHRcdFx0XHR0ZXJtcy5wdXNoKHRlcm0pO1xyXG5cdFx0XHRcdFx0dGVybWlkPXRlcm1zLmxlbmd0aC0xO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR0ZXJtaWQ9dGVybWlkeDtcclxuXHRcdFx0XHR9XHRcdFx0XHRcclxuXHRcdFx0XHRwaHJhc2VfdGVybS50ZXJtaWQucHVzaCh0ZXJtaWQpO1xyXG5cdFx0XHRcdHBocmFzZV90ZXJtLnRlcm1sZW5ndGgucHVzaChzcGxpdHRlZC5sZW5ndGhzW2ldKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0aisrO1xyXG5cdH1cclxuXHRwaHJhc2VfdGVybS5rZXk9cGhyYXNlO1xyXG5cdC8vcmVtb3ZlIGVuZGluZyB3aWxkY2FyZFxyXG5cdHZhciBQPXBocmFzZV90ZXJtICwgVD1udWxsO1xyXG5cdGRvIHtcclxuXHRcdFQ9dGVybXNbUC50ZXJtaWRbUC50ZXJtaWQubGVuZ3RoLTFdXTtcclxuXHRcdGlmICghVCkgYnJlYWs7XHJcblx0XHRpZiAoVC53aWxkY2FyZCkgUC50ZXJtaWQucG9wKCk7IGVsc2UgYnJlYWs7XHJcblx0fSB3aGlsZShUKTtcdFx0XHJcblx0cmV0dXJuIHBocmFzZV90ZXJtO1xyXG59XHJcbnZhciBuZXdRdWVyeSA9ZnVuY3Rpb24oZW5naW5lLHF1ZXJ5LG9wdHMpIHtcclxuXHQvL2lmICghcXVlcnkpIHJldHVybjtcclxuXHRvcHRzPW9wdHN8fHt9O1xyXG5cdHF1ZXJ5PXRyaW1TcGFjZShlbmdpbmUscXVlcnkpO1xyXG5cclxuXHR2YXIgcGhyYXNlcz1xdWVyeSxwaHJhc2VzPVtdO1xyXG5cdGlmICh0eXBlb2YgcXVlcnk9PSdzdHJpbmcnICYmIHF1ZXJ5KSB7XHJcblx0XHRwaHJhc2VzPXBhcnNlUXVlcnkocXVlcnksb3B0cy5waHJhc2Vfc2VwIHx8IFwiXCIpO1xyXG5cdH1cclxuXHRcclxuXHR2YXIgcGhyYXNlX3Rlcm1zPVtdLCB0ZXJtcz1bXSx2YXJpYW50cz1bXSxvcGVyYXRvcnM9W107XHJcblx0dmFyIHBjPTA7Ly9waHJhc2UgY291bnRcclxuXHRmb3IgICh2YXIgaT0wO2k8cGhyYXNlcy5sZW5ndGg7aSsrKSB7XHJcblx0XHR2YXIgb3A9Z2V0T3BlcmF0b3IocGhyYXNlc1twY10pO1xyXG5cdFx0aWYgKG9wKSBwaHJhc2VzW3BjXT1waHJhc2VzW3BjXS5zdWJzdHJpbmcoMSk7XHJcblxyXG5cdFx0LyogYXV0byBhZGQgKyBmb3IgbmF0dXJhbCBvcmRlciA/Ki9cclxuXHRcdC8vaWYgKCFvcHRzLnJhbmsgJiYgb3AhPSdleGNsdWRlJyAmJmkpIG9wPSdpbmNsdWRlJztcclxuXHRcdG9wZXJhdG9ycy5wdXNoKG9wKTtcclxuXHJcblx0XHRpZiAoaXNTaW1wbGVQaHJhc2UocGhyYXNlc1twY10pICYmIGVuZ2luZS5tZXJnZVBvc3RpbmdzICkge1xyXG5cdFx0XHR2YXIgcGhyYXNlX3Rlcm09ZmFzdFBocmFzZShlbmdpbmUscGhyYXNlc1twY10pO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dmFyIHBocmFzZV90ZXJtPXNsb3dQaHJhc2UoZW5naW5lLHRlcm1zLHBocmFzZXNbcGNdKTtcclxuXHRcdH1cclxuXHRcdHBocmFzZV90ZXJtcy5wdXNoKHBocmFzZV90ZXJtKTtcclxuXHJcblx0XHRpZiAoIWVuZ2luZS5tZXJnZVBvc3RpbmdzICYmIHBocmFzZV90ZXJtc1twY10udGVybWlkLmxlbmd0aD09MCkge1xyXG5cdFx0XHRwaHJhc2VfdGVybXMucG9wKCk7XHJcblx0XHR9IGVsc2UgcGMrKztcclxuXHR9XHJcblx0b3B0cy5vcD1vcGVyYXRvcnM7XHJcblxyXG5cdHZhciBRPXtkYm5hbWU6ZW5naW5lLmRibmFtZSxlbmdpbmU6ZW5naW5lLG9wdHM6b3B0cyxxdWVyeTpxdWVyeSxcclxuXHRcdHBocmFzZXM6cGhyYXNlX3Rlcm1zLHRlcm1zOnRlcm1zXHJcblx0fTtcclxuXHRRLnRva2VuaXplPWZ1bmN0aW9uKCkge3JldHVybiBlbmdpbmUuYW5hbHl6ZXIudG9rZW5pemUuYXBwbHkoZW5naW5lLGFyZ3VtZW50cyk7fVxyXG5cdFEuaXNTa2lwPWZ1bmN0aW9uKCkge3JldHVybiBlbmdpbmUuYW5hbHl6ZXIuaXNTa2lwLmFwcGx5KGVuZ2luZSxhcmd1bWVudHMpO31cclxuXHRRLm5vcm1hbGl6ZT1mdW5jdGlvbigpIHtyZXR1cm4gZW5naW5lLmFuYWx5emVyLm5vcm1hbGl6ZS5hcHBseShlbmdpbmUsYXJndW1lbnRzKTt9XHJcblx0US5zZWdXaXRoSGl0PXNlZ1dpdGhIaXQ7XHJcblxyXG5cdC8vUS5nZXRSYW5nZT1mdW5jdGlvbigpIHtyZXR1cm4gdGhhdC5nZXRSYW5nZS5hcHBseSh0aGF0LGFyZ3VtZW50cyl9O1xyXG5cdC8vQVBJLnF1ZXJ5aWQ9J1EnKyhNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMTAwMDAwMDApKS50b1N0cmluZygxNik7XHJcblx0cmV0dXJuIFE7XHJcbn1cclxudmFyIHBvc3RpbmdQYXRoRnJvbVRva2Vucz1mdW5jdGlvbihlbmdpbmUsdG9rZW5zKSB7XHJcblx0dmFyIGFsbHRva2Vucz1lbmdpbmUuZ2V0KFwidG9rZW5zXCIpO1xyXG5cclxuXHR2YXIgdG9rZW5JZHM9dG9rZW5zLm1hcChmdW5jdGlvbih0KXsgcmV0dXJuIDErYWxsdG9rZW5zLmluZGV4T2YodCl9KTtcclxuXHR2YXIgcG9zdGluZ2lkPVtdO1xyXG5cdGZvciAodmFyIGk9MDtpPHRva2VuSWRzLmxlbmd0aDtpKyspIHtcclxuXHRcdHBvc3RpbmdpZC5wdXNoKCB0b2tlbklkc1tpXSk7IC8vIHRva2VuSWQ9PTAgLCBlbXB0eSB0b2tlblxyXG5cdH1cclxuXHRyZXR1cm4gcG9zdGluZ2lkLm1hcChmdW5jdGlvbih0KXtyZXR1cm4gW1wicG9zdGluZ3NcIix0XX0pO1xyXG59XHJcbnZhciBsb2FkUG9zdGluZ3M9ZnVuY3Rpb24oZW5naW5lLHRva2VucyxjYikge1xyXG5cdHZhciB0b2xvYWR0b2tlbnM9dG9rZW5zLmZpbHRlcihmdW5jdGlvbih0KXtcclxuXHRcdHJldHVybiAhZW5naW5lLnBvc3RpbmdDYWNoZVt0LmtleV07IC8vYWxyZWFkeSBpbiBjYWNoZVxyXG5cdH0pO1xyXG5cdGlmICh0b2xvYWR0b2tlbnMubGVuZ3RoPT0wKSB7XHJcblx0XHRjYigpO1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHR2YXIgcG9zdGluZ1BhdGhzPXBvc3RpbmdQYXRoRnJvbVRva2VucyhlbmdpbmUsdG9rZW5zLm1hcChmdW5jdGlvbih0KXtyZXR1cm4gdC5rZXl9KSk7XHJcblx0ZW5naW5lLmdldChwb3N0aW5nUGF0aHMsZnVuY3Rpb24ocG9zdGluZ3Mpe1xyXG5cdFx0cG9zdGluZ3MubWFwKGZ1bmN0aW9uKHAsaSkgeyB0b2tlbnNbaV0ucG9zdGluZz1wIH0pO1xyXG5cdFx0aWYgKGNiKSBjYigpO1xyXG5cdH0pO1xyXG59XHJcbnZhciBncm91cEJ5PWZ1bmN0aW9uKFEscG9zdGluZykge1xyXG5cdHBocmFzZXMuZm9yRWFjaChmdW5jdGlvbihQKXtcclxuXHRcdHZhciBrZXk9UC5rZXk7XHJcblx0XHR2YXIgZG9jZnJlcT1kb2NmcmVxY2FjaGVba2V5XTtcclxuXHRcdGlmICghZG9jZnJlcSkgZG9jZnJlcT1kb2NmcmVxY2FjaGVba2V5XT17fTtcclxuXHRcdGlmICghZG9jZnJlcVt0aGF0Lmdyb3VwdW5pdF0pIHtcclxuXHRcdFx0ZG9jZnJlcVt0aGF0Lmdyb3VwdW5pdF09e2RvY2xpc3Q6bnVsbCxmcmVxOm51bGx9O1xyXG5cdFx0fVx0XHRcclxuXHRcdGlmIChQLnBvc3RpbmcpIHtcclxuXHRcdFx0dmFyIHJlcz1tYXRjaFBvc3RpbmcoZW5naW5lLFAucG9zdGluZyk7XHJcblx0XHRcdFAuZnJlcT1yZXMuZnJlcTtcclxuXHRcdFx0UC5kb2NzPXJlcy5kb2NzO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0UC5kb2NzPVtdO1xyXG5cdFx0XHRQLmZyZXE9W107XHJcblx0XHR9XHJcblx0XHRkb2NmcmVxW3RoYXQuZ3JvdXB1bml0XT17ZG9jbGlzdDpQLmRvY3MsZnJlcTpQLmZyZXF9O1xyXG5cdH0pO1xyXG5cdHJldHVybiB0aGlzO1xyXG59XHJcbnZhciBncm91cEJ5Rm9sZGVyPWZ1bmN0aW9uKGVuZ2luZSxmaWxlaGl0cykge1xyXG5cdHZhciBmaWxlcz1lbmdpbmUuZ2V0KFwiZmlsZW5hbWVzXCIpO1xyXG5cdHZhciBwcmV2Zm9sZGVyPVwiXCIsaGl0cz0wLG91dD1bXTtcclxuXHRmb3IgKHZhciBpPTA7aTxmaWxlaGl0cy5sZW5ndGg7aSsrKSB7XHJcblx0XHR2YXIgZm49ZmlsZXNbaV07XHJcblx0XHR2YXIgZm9sZGVyPWZuLnN1YnN0cmluZygwLGZuLmluZGV4T2YoJy8nKSk7XHJcblx0XHRpZiAocHJldmZvbGRlciAmJiBwcmV2Zm9sZGVyIT1mb2xkZXIpIHtcclxuXHRcdFx0b3V0LnB1c2goaGl0cyk7XHJcblx0XHRcdGhpdHM9MDtcclxuXHRcdH1cclxuXHRcdGhpdHMrPWZpbGVoaXRzW2ldLmxlbmd0aDtcclxuXHRcdHByZXZmb2xkZXI9Zm9sZGVyO1xyXG5cdH1cclxuXHRvdXQucHVzaChoaXRzKTtcclxuXHRyZXR1cm4gb3V0O1xyXG59XHJcbnZhciBwaHJhc2VfaW50ZXJzZWN0PWZ1bmN0aW9uKGVuZ2luZSxRKSB7XHJcblx0dmFyIGludGVyc2VjdGVkPW51bGw7XHJcblx0dmFyIGZpbGVvZmZzZXRzPVEuZW5naW5lLmdldChcImZpbGVvZmZzZXRzXCIpO1xyXG5cdHZhciBlbXB0eT1bXSxlbXB0eWNvdW50PTAsaGFzaGl0PTA7XHJcblx0Zm9yICh2YXIgaT0wO2k8US5waHJhc2VzLmxlbmd0aDtpKyspIHtcclxuXHRcdHZhciBieWZpbGU9cGxpc3QuZ3JvdXBieXBvc3RpbmcyKFEucGhyYXNlc1tpXS5wb3N0aW5nLGZpbGVvZmZzZXRzKTtcclxuXHRcdGlmIChieWZpbGUubGVuZ3RoKSBieWZpbGUuc2hpZnQoKTtcclxuXHRcdGlmIChieWZpbGUubGVuZ3RoKSBieWZpbGUucG9wKCk7XHJcblx0XHRieWZpbGUucG9wKCk7XHJcblx0XHRpZiAoaW50ZXJzZWN0ZWQ9PW51bGwpIHtcclxuXHRcdFx0aW50ZXJzZWN0ZWQ9YnlmaWxlO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Zm9yICh2YXIgaj0wO2o8YnlmaWxlLmxlbmd0aDtqKyspIHtcclxuXHRcdFx0XHRpZiAoIShieWZpbGVbal0ubGVuZ3RoICYmIGludGVyc2VjdGVkW2pdLmxlbmd0aCkpIHtcclxuXHRcdFx0XHRcdGludGVyc2VjdGVkW2pdPWVtcHR5OyAvL3JldXNlIGVtcHR5IGFycmF5XHJcblx0XHRcdFx0XHRlbXB0eWNvdW50Kys7XHJcblx0XHRcdFx0fSBlbHNlIGhhc2hpdCsrO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRRLmJ5RmlsZT1pbnRlcnNlY3RlZDtcclxuXHRRLmJ5Rm9sZGVyPWdyb3VwQnlGb2xkZXIoZW5naW5lLFEuYnlGaWxlKTtcclxuXHR2YXIgb3V0PVtdO1xyXG5cdC8vY2FsY3VsYXRlIG5ldyByYXdwb3N0aW5nXHJcblx0Zm9yICh2YXIgaT0wO2k8US5ieUZpbGUubGVuZ3RoO2krKykge1xyXG5cdFx0aWYgKFEuYnlGaWxlW2ldLmxlbmd0aCkgb3V0PW91dC5jb25jYXQoUS5ieUZpbGVbaV0pO1xyXG5cdH1cclxuXHRRLnJhd3Jlc3VsdD1vdXQ7XHJcblx0Y291bnRGb2xkZXJGaWxlKFEpO1xyXG59XHJcbnZhciBjb3VudEZvbGRlckZpbGU9ZnVuY3Rpb24oUSkge1xyXG5cdFEuZmlsZVdpdGhIaXRDb3VudD0wO1xyXG5cdFEuYnlGaWxlLm1hcChmdW5jdGlvbihmKXtpZiAoZi5sZW5ndGgpIFEuZmlsZVdpdGhIaXRDb3VudCsrfSk7XHJcblx0XHRcdFxyXG5cdFEuZm9sZGVyV2l0aEhpdENvdW50PTA7XHJcblx0US5ieUZvbGRlci5tYXAoZnVuY3Rpb24oZil7aWYgKGYpIFEuZm9sZGVyV2l0aEhpdENvdW50Kyt9KTtcclxufVxyXG5cclxudmFyIG1haW49ZnVuY3Rpb24oZW5naW5lLHEsb3B0cyxjYil7XHJcblx0dmFyIHN0YXJ0dGltZT1uZXcgRGF0ZSgpO1xyXG5cdHZhciBtZXRhPWVuZ2luZS5nZXQoXCJtZXRhXCIpO1xyXG5cdGlmIChtZXRhLm5vcm1hbGl6ZSAmJiBlbmdpbmUuYW5hbHl6ZXIuc2V0Tm9ybWFsaXplVGFibGUpIHtcclxuXHRcdG1ldGEubm9ybWFsaXplT2JqPWVuZ2luZS5hbmFseXplci5zZXROb3JtYWxpemVUYWJsZShtZXRhLm5vcm1hbGl6ZSxtZXRhLm5vcm1hbGl6ZU9iaik7XHJcblx0fVxyXG5cdGlmICh0eXBlb2Ygb3B0cz09XCJmdW5jdGlvblwiKSBjYj1vcHRzO1xyXG5cdG9wdHM9b3B0c3x8e307XHJcblx0dmFyIFE9ZW5naW5lLnF1ZXJ5Q2FjaGVbcV07XHJcblx0aWYgKCFRKSBRPW5ld1F1ZXJ5KGVuZ2luZSxxLG9wdHMpOyBcclxuXHRpZiAoIVEpIHtcclxuXHRcdGVuZ2luZS5zZWFyY2h0aW1lPW5ldyBEYXRlKCktc3RhcnR0aW1lO1xyXG5cdFx0ZW5naW5lLnRvdGFsdGltZT1lbmdpbmUuc2VhcmNodGltZTtcclxuXHRcdGlmIChlbmdpbmUuY29udGV4dCkgY2IuYXBwbHkoZW5naW5lLmNvbnRleHQsW1wiZW1wdHkgcmVzdWx0XCIse3Jhd3Jlc3VsdDpbXX1dKTtcclxuXHRcdGVsc2UgY2IoXCJlbXB0eSByZXN1bHRcIix7cmF3cmVzdWx0OltdfSk7XHJcblx0XHRyZXR1cm47XHJcblx0fTtcclxuXHRlbmdpbmUucXVlcnlDYWNoZVtxXT1RO1xyXG5cdGlmIChRLnBocmFzZXMubGVuZ3RoKSB7XHJcblx0XHRsb2FkUG9zdGluZ3MoZW5naW5lLFEudGVybXMsZnVuY3Rpb24oKXtcclxuXHRcdFx0aWYgKCFRLnBocmFzZXNbMF0ucG9zdGluZykge1xyXG5cdFx0XHRcdGVuZ2luZS5zZWFyY2h0aW1lPW5ldyBEYXRlKCktc3RhcnR0aW1lO1xyXG5cdFx0XHRcdGVuZ2luZS50b3RhbHRpbWU9ZW5naW5lLnNlYXJjaHRpbWVcclxuXHJcblx0XHRcdFx0Y2IuYXBwbHkoZW5naW5lLmNvbnRleHQsW1wibm8gc3VjaCBwb3N0aW5nXCIse3Jhd3Jlc3VsdDpbXX1dKTtcclxuXHRcdFx0XHRyZXR1cm47XHRcdFx0XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHRcdGlmICghUS5waHJhc2VzWzBdLnBvc3RpbmcubGVuZ3RoKSB7IC8vXHJcblx0XHRcdFx0US5waHJhc2VzLmZvckVhY2gobG9hZFBocmFzZS5iaW5kKFEpKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAoUS5waHJhc2VzLmxlbmd0aD09MSkge1xyXG5cdFx0XHRcdFEucmF3cmVzdWx0PVEucGhyYXNlc1swXS5wb3N0aW5nO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHBocmFzZV9pbnRlcnNlY3QoZW5naW5lLFEpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHZhciBmaWxlb2Zmc2V0cz1RLmVuZ2luZS5nZXQoXCJmaWxlb2Zmc2V0c1wiKTtcclxuXHRcdFx0Ly9jb25zb2xlLmxvZyhcInNlYXJjaCBvcHRzIFwiK0pTT04uc3RyaW5naWZ5KG9wdHMpKTtcclxuXHJcblx0XHRcdGlmICghUS5ieUZpbGUgJiYgUS5yYXdyZXN1bHQgJiYgIW9wdHMubm9ncm91cCkge1xyXG5cdFx0XHRcdFEuYnlGaWxlPXBsaXN0Lmdyb3VwYnlwb3N0aW5nMihRLnJhd3Jlc3VsdCwgZmlsZW9mZnNldHMpO1xyXG5cdFx0XHRcdFEuYnlGaWxlLnNoaWZ0KCk7US5ieUZpbGUucG9wKCk7XHJcblx0XHRcdFx0US5ieUZvbGRlcj1ncm91cEJ5Rm9sZGVyKGVuZ2luZSxRLmJ5RmlsZSk7XHJcblxyXG5cdFx0XHRcdGNvdW50Rm9sZGVyRmlsZShRKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKG9wdHMucmFuZ2UpIHtcclxuXHRcdFx0XHRlbmdpbmUuc2VhcmNodGltZT1uZXcgRGF0ZSgpLXN0YXJ0dGltZTtcclxuXHRcdFx0XHRleGNlcnB0LnJlc3VsdGxpc3QoZW5naW5lLFEsb3B0cyxmdW5jdGlvbihkYXRhKSB7IFxyXG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhcImV4Y2VycHQgb2tcIik7XHJcblx0XHRcdFx0XHRRLmV4Y2VycHQ9ZGF0YTtcclxuXHRcdFx0XHRcdGVuZ2luZS50b3RhbHRpbWU9bmV3IERhdGUoKS1zdGFydHRpbWU7XHJcblx0XHRcdFx0XHRjYi5hcHBseShlbmdpbmUuY29udGV4dCxbMCxRXSk7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0ZW5naW5lLnNlYXJjaHRpbWU9bmV3IERhdGUoKS1zdGFydHRpbWU7XHJcblx0XHRcdFx0ZW5naW5lLnRvdGFsdGltZT1uZXcgRGF0ZSgpLXN0YXJ0dGltZTtcclxuXHRcdFx0XHRjYi5hcHBseShlbmdpbmUuY29udGV4dCxbMCxRXSk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cdH0gZWxzZSB7IC8vZW1wdHkgc2VhcmNoXHJcblx0XHRlbmdpbmUuc2VhcmNodGltZT1uZXcgRGF0ZSgpLXN0YXJ0dGltZTtcclxuXHRcdGVuZ2luZS50b3RhbHRpbWU9bmV3IERhdGUoKS1zdGFydHRpbWU7XHJcblx0XHRjYi5hcHBseShlbmdpbmUuY29udGV4dCxbMCxRXSk7XHJcblx0fTtcclxufVxyXG5cclxubWFpbi5zcGxpdFBocmFzZT1zcGxpdFBocmFzZTsgLy9qdXN0IGZvciBkZWJ1Z1xyXG5tb2R1bGUuZXhwb3J0cz1tYWluOyIsIm1vZHVsZS5leHBvcnRzPXtcclxuICBtYWluOnJlcXVpcmUoXCIuL21haW5cIiksXHJcbiAgcmVzdWx0bGlzdDpyZXF1aXJlKFwiLi9yZXN1bHRsaXN0XCIpLFxyXG4gIHNob3d0ZXh0OnJlcXVpcmUoXCIuL3Nob3d0ZXh0XCIpXHJcbn0iLCIvL3ZhciBib290c3RyYXA9cmVxdWlyZShcImJvb3RzdHJhcFwiKTsgXHJcbnZhciBrZGU9cmVxdWlyZSgna3NhbmEtZGF0YWJhc2UnKTsgIC8vIEtzYW5hIERhdGFiYXNlIEVuZ2luZVxyXG52YXIga3NlPXJlcXVpcmUoJ2tzYW5hLXNlYXJjaCcpOyAvLyBLc2FuYSBTZWFyY2ggRW5naW5lIChydW4gYXQgY2xpZW50IHNpZGUpXHJcbnZhciBTdGFja3RvYz1yZXF1aXJlKFwiLi9zdGFja3RvY2NvbXBvbmVudFwiKTtcclxudmFyIFN3aXBlPXJlcXVpcmUoXCIuL3N3aXBlY29tcG9uZW50XCIpO1xyXG52YXIgRmlsZWluc3RhbGxlcj1yZXF1aXJlKFwia3NhbmEyMDE1LXdlYnJ1bnRpbWVcIikuZmlsZWluc3RhbGxlcjtcclxudmFyIEU9UmVhY3QuY3JlYXRlRWxlbWVudDtcclxudmFyIERlZmF1bHRtYWluTWl4aW4gPSB7XHJcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7cmVzOntleGNlcnB0OltdfSxkYjpudWxsICwgbXNnOlwiY2xpY2sgR08gYnV0dG9uIHRvIHNlYXJjaFwifTtcclxuICB9LFxyXG4gIHN3aXBldGFyZ2V0czpbXSxcclxuICBhY3Rpb246ZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgYXJncz1BcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xyXG4gICAgdmFyIHR5cGU9YXJncy5zaGlmdCgpO1xyXG5cclxuICAgIGlmICghdGhpcy5oYW5kbGVycykgcmV0dXJuO1xyXG4gICAgaWYgKCF0aGlzLmhhbmRsZXJzW3R5cGVdKSByZXR1cm47XHJcbiAgICB0aGlzLmhhbmRsZXJzW3R5cGVdLmFwcGx5KHRoaXMsYXJncyk7XHJcbiAgfSwgXHJcbiAgbmV3VG9maW5kOmZ1bmN0aW9uKHRmKSB7XHJcbiAgICBpZiAoIWxvY2FsU3RvcmFnZSkgcmV0dXJuO1xyXG4gICAgdmFyIGhpc3Rvcnl0b2ZpbmQ9SlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImhpc3Rvcnl0b2ZpbmRcIil8fFwiW11cIik7XHJcbiAgICB2YXIgaT1oaXN0b3J5dG9maW5kLmluZGV4T2YodGYpO1xyXG4gICAgaWYgKGk+LTEpIGhpc3Rvcnl0b2ZpbmQuc3BsaWNlKGksMSk7XHJcbiAgICBoaXN0b3J5dG9maW5kLnB1c2godGYpO1xyXG4gICAgd2hpbGUoaGlzdG9yeXRvZmluZC5sZW5ndGg+NSkge1xyXG4gICAgICBoaXN0b3J5dG9maW5kLnNoaWZ0KCk7XHJcbiAgICB9XHJcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImhpc3Rvcnl0b2ZpbmRcIixKU09OLnN0cmluZ2lmeShoaXN0b3J5dG9maW5kKSk7XHJcbiAgICByZXR1cm4gaGlzdG9yeXRvZmluZDtcclxuICB9LFxyXG4gIHNlYXJjaDpmdW5jdGlvbih0b2ZpbmQsc3RhcnQsZW5kKSB7XHJcbiAgICB2YXIgdD1uZXcgRGF0ZSgpO1xyXG4gICAgaWYgKHRoaXMuc3RhdGUucSE9dG9maW5kKSB7XHJcbiAgICAgIHRoaXMubmV3VG9maW5kKHRvZmluZCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnNldFN0YXRlKHtxOnRvZmluZCxtc2c6XCJTZWFyY2hpbmdcIn0pO1xyXG4gICAgdmFyIHRoYXQ9dGhpcztcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAga3NlLnNlYXJjaCh0aGF0LnN0YXRlLmRiLHRvZmluZCx7cmFuZ2U6e3N0YXJ0OnN0YXJ0LGVuZDplbmQsbWF4aGl0OjI1fX0sZnVuY3Rpb24oZXJyLGRhdGEpeyAvL2NhbGwgc2VhcmNoIGVuZ2luZVxyXG4gICAgICAgIHRoYXQuc2V0U3RhdGUoe3JlczpkYXRhLG1zZzoobmV3IERhdGUoKS10KStcIm1zXCJ9KTtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKGRhdGEpIDsgLy8gd2F0Y2ggdGhlIHJlc3VsdCBmcm9tIHNlYXJjaCBlbmdpbmVcclxuICAgICAgfSk7XHJcbiAgICB9LDApO1xyXG4gIH0sXHJcbiAgZG9zZWFyY2g6ZnVuY3Rpb24oZSxyZWFjdGlkLHN0YXJ0X2VuZCkge1xyXG4gICAgdmFyIHN0YXJ0PXN0YXJ0X2VuZCx0b2NoaXQ9MDtcclxuICAgIHZhciBlbmQ9dGhpcy5zdGF0ZS5kYi5nZXQoXCJtZXRhXCIpLnZzaXplO1xyXG4gICAgaWYgKHR5cGVvZiBzdGFydF9lbmQ9PVwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgc3RhcnQ9MDtcclxuICAgIH1lbHNlIGlmICh0eXBlb2Ygc3RhcnRfZW5kIT1cIm51bWJlclwiICYmIHR5cGVvZiBzdGFydF9lbmRbMF09PVwibnVtYmVyXCIpIHtcclxuICAgICAgc3RhcnQ9c3RhcnRfZW5kWzBdO1xyXG4gICAgICBlbmQ9c3RhcnRfZW5kWzFdO1xyXG4gICAgICB0b2NoaXQ9c3RhcnRfZW5kWzJdO1xyXG4gICAgfVxyXG4gICAgdmFyIHRvZmluZD10aGlzLnJlZnMudG9maW5kLmdldERPTU5vZGUoKS52YWx1ZTtcclxuICAgIGlmIChlKSB0b2ZpbmQ9ZS50YXJnZXQuaW5uZXJIVE1MO1xyXG4gICAgaWYgKHRvZmluZD09XCJHT1wiKSB0b2ZpbmQ9dGhpcy5yZWZzLnRvZmluZC5nZXRET01Ob2RlKCkudmFsdWU7XHJcbiAgICB0aGlzLnNlYXJjaCh0b2ZpbmQsc3RhcnQsZW5kKTtcclxuICB9LFxyXG4gIGtleXByZXNzOmZ1bmN0aW9uKGUpIHtcclxuICAgIGlmIChlLmtleT09XCJFbnRlclwiKSB0aGlzLmRvc2VhcmNoKCk7XHJcbiAgfSxcclxuICByZW5kZXJFeHRyYUlucHV0OmZ1bmN0aW9uKCkge1xyXG4gICAgaWYgKHRoaXMudG9maW5kRXh0cmEpIHtcclxuICAgICAgdmFyIGhpc3Rvcnl0b2ZpbmQ9W107XHJcbiAgICAgIGlmIChsb2NhbFN0b3JhZ2UpIHtcclxuICAgICAgICBoaXN0b3J5dG9maW5kPUpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJoaXN0b3J5dG9maW5kXCIpfHxcIltdXCIpOyAgXHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXMudG9maW5kRXh0cmEoaGlzdG9yeXRvZmluZCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHJldHVybiBudWxsO1xyXG4gIH0sXHJcbiAgcmVuZGVyaW5wdXRzOmZ1bmN0aW9uKCkgeyAgLy8gaW5wdXQgaW50ZXJmYWNlIGZvciBzZWFyY2hcclxuICAgIGlmICh0aGlzLnN0YXRlLmRiKSB7XHJcbiAgICAgIHJldHVybiAoICAgIFxyXG4gICAgICAgIEUoXCJkaXZcIiwgbnVsbCwgXHJcbiAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcImNlbnRlcmVkIGlucHV0c1wifSwgRShcImlucHV0XCIsIHtzaXplOiBcIjhcIiwgb25LZXlQcmVzczogdGhpcy5rZXlwcmVzcywgcmVmOiBcInRvZmluZFwiLCBkZWZhdWx0VmFsdWU6IHRoaXMuZGVmYXVsdFRvZmluZHx8XCJcIn0pLCBcclxuICAgICAgICBFKFwiYnV0dG9uXCIsIHtyZWY6IFwiYnRuc2VhcmNoXCIsIG9uQ2xpY2s6IHRoaXMuZG9zZWFyY2h9LCBcIkdPXCIpLCBcclxuICAgICAgICB0aGlzLnJlbmRlckV4dHJhSW5wdXQoKVxyXG4gICAgICAgICksIFxyXG4gICAgICAgIHRoaXMuc3RhdGUuZGIuc2VhcmNodGltZT9NYXRoLmZsb29yKHRoaXMuc3RhdGUuZGIuc2VhcmNodGltZSkrXCIgbXNcIjpcIlwiLCBcclxuICAgICAgICB0aGlzLnJlbmRlclJlc3VsdExpc3QoKVxyXG4gICAgICAgIClcclxuICAgICAgICApICAgICAgICAgIFxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIEUoXCJzcGFuXCIsIG51bGwsIFwibG9hZGluZyBkYXRhYmFzZS4uLi5cIilcclxuICAgIH1cclxuICB9LCBcclxuICByZW5kZXJSZXN1bHRMaXN0OmZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIFJlc3VsdExpc3RDb21wb25lbnQ9cmVxdWlyZShcIi4vcmVzdWx0bGlzdFwiKTtcclxuICAgIGlmICh0aGlzLnJlc3VsdExpc3RDb21wb25lbnQpIHtcclxuICAgICAgUmVzdWx0TGlzdENvbXBvbmVudD10aGlzLnJlc3VsdExpc3RDb21wb25lbnQ7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gRShSZXN1bHRMaXN0Q29tcG9uZW50LCB7Z290b3NlZzogdGhpcy5nb3Rvc2VnLCBcclxuICAgIGFjdGlvbjogdGhpcy5hY3Rpb24sIHJlczogdGhpcy5zdGF0ZS5yZXN9KVxyXG4gIH0sXHJcbiAgZ2VuVG9jOmZ1bmN0aW9uKHRleHRzLGRlcHRocyx2b2Zmcykge1xyXG5cclxuICAgIHZhciBvdXQ9W3tkZXB0aDowLHRleHQ6a3NhbmEuanMudGl0bGV9XTtcclxuICAgIGlmICh0ZXh0cykgZm9yICh2YXIgaT0wO2k8dGV4dHMubGVuZ3RoO2krKykge1xyXG4gICAgICBvdXQucHVzaCh7dGV4dDp0ZXh0c1tpXSxkZXB0aDpkZXB0aHNbaV0sIHZvZmY6dm9mZnNbaV19KTtcclxuICAgIH1cclxuICAgIHJldHVybiBvdXQ7IFxyXG4gIH0sICAgICBcclxuICBzaG93U2VnOmZ1bmN0aW9uKGYscCxoaWRlUmVzdWx0bGlzdCkge1xyXG4gICAgdmFyIHRoYXQ9dGhpcztcclxuICAgIGtzZS5oaWdobGlnaHRTZWcodGhpcy5zdGF0ZS5kYixmLHAse3E6dGhpcy5zdGF0ZS5xLHJlbmRlclRhZ3M6dGhpcy5yZW5kZXJUYWdzfSxmdW5jdGlvbihkYXRhKXtcclxuICAgICAgdGhhdC5zZXRTdGF0ZSh7Ym9keXRleHQ6ZGF0YX0pO1xyXG4gICAgICBpZiAoaGlkZVJlc3VsdGxpc3QpIHRoYXQuc2V0U3RhdGUoe3Jlczp7ZXhjZXJwdDpbXX19KTtcclxuICAgIH0pO1xyXG4gIH0sXHJcbiAgZ290b3NlZzpmdW5jdGlvbih2cG9zKSB7XHJcbiAgICB2YXIgcmVzPWtzZS52cG9zMmZpbGVzZWcodGhpcy5zdGF0ZS5kYix2cG9zKTtcclxuICAgIHRoaXMuc2hvd1NlZyhyZXMuZmlsZSxyZXMuc2VnKTtcclxuICAgIHRoaXMuc2xpZGVUZXh0KCk7XHJcbiAgfSxcclxuICBuZXh0c2VnOmZ1bmN0aW9uKCkge1xyXG4gICAgaWYoIXRoaXMuc3RhdGUuYm9keXRleHQpcmV0dXJuO1xyXG4gICAgdmFyIHNlZz10aGlzLnN0YXRlLmJvZHl0ZXh0LnNlZysxO1xyXG4gICAgdGhpcy5zaG93U2VnKHRoaXMuc3RhdGUuYm9keXRleHQuZmlsZSxzZWcpO1xyXG4gIH0sXHJcbiAgcHJldnNlZzpmdW5jdGlvbigpIHtcclxuICAgIGlmKCF0aGlzLnN0YXRlLmJvZHl0ZXh0KXJldHVybjtcclxuICAgIHZhciBzZWc9dGhpcy5zdGF0ZS5ib2R5dGV4dC5zZWctMTtcclxuICAgIGlmIChzZWc8MCkgc2VnPTA7XHJcbiAgICB0aGlzLnNob3dTZWcodGhpcy5zdGF0ZS5ib2R5dGV4dC5maWxlLHNlZyk7XHJcbiAgfSxcclxuICBzZXRTZWc6ZnVuY3Rpb24obmV3c2VnbmFtZSxmaWxlKSB7XHJcbiAgICBmaWxlPWZpbGV8fHRoaXMuc3RhdGUuYm9keXRleHQuZmlsZTtcclxuICAgIHZhciBzZWduYW1lcz10aGlzLnN0YXRlLmRiLmdldEZpbGVTZWdOYW1lcyhmaWxlKTtcclxuICAgIHZhciBwPXNlZ25hbWVzLmluZGV4T2YobmV3c2VnbmFtZSk7XHJcbiAgICBpZiAocD4tMSkgdGhpcy5zaG93U2VnKGZpbGUscCk7XHJcbiAgfSxcclxuICBmaWxlc2VnMnZwb3M6ZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgb2Zmc2V0cz10aGlzLnN0YXRlLmRiLmdldEZpbGVTZWdPZmZzZXRzKHRoaXMuc3RhdGUuYm9keXRleHQuZmlsZSk7XHJcbiAgICByZXR1cm4gb2Zmc2V0c1t0aGlzLnN0YXRlLmJvZHl0ZXh0LnNlZ107XHJcbiAgfSxcclxuICBzaG93VGV4dDpmdW5jdGlvbihuKSB7XHJcbiAgICB2YXIgcmVzPWtzZS52cG9zMmZpbGVzZWcodGhpcy5zdGF0ZS5kYix0aGlzLnN0YXRlLnRvY1tuXS52b2ZmKTtcclxuICAgIHRoaXMuc2hvd1NlZyhyZXMuZmlsZSxyZXMuc2VnKTtcclxuICAgIHRoaXMuc2xpZGVUZXh0KCk7XHJcbiAgfSxcclxuICBvblJlYWR5OmZ1bmN0aW9uKHVzYWdlLHF1b3RhKSB7XHJcbiAgICB2YXIgaGVhZD10aGlzLnRvY1RhZ3x8XCJoZWFkXCI7XHJcbiAgICBpZiAoIXRoaXMuc3RhdGUuZGIpIGtkZS5vcGVuKHRoaXMuZGJpZCxmdW5jdGlvbihlcnIsZGIpe1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe2RiOmRifSk7XHJcblxyXG4gICAgICAgIHZhciBwcmVsb2FkdGFncz1bW1wiZmllbGRzXCIsaGVhZF0sW1wiZmllbGRzXCIsaGVhZCtcIl9kZXB0aFwiXSxcclxuICAgICAgICAgIFtcImZpZWxkc1wiLGhlYWQrXCJfdm9mZlwiXV07XHJcbiAgICAgICAgaWYgKHRoaXMucmVuZGVyVGFncykge1xyXG4gICAgICAgICAgdGhpcy5yZW5kZXJUYWdzLm1hcChmdW5jdGlvbih0YWcpe1xyXG4gICAgICAgICAgICBwcmVsb2FkdGFncy5wdXNoKFtcImZpZWxkc1wiLHRhZytcIl9zdGFydFwiXSk7XHJcbiAgICAgICAgICAgIHByZWxvYWR0YWdzLnB1c2goW1wiZmllbGRzXCIsdGFnK1wiX2VuZFwiXSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZGIuZ2V0KFtwcmVsb2FkdGFnc10sZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICB2YXIgaGVhZHM9ZGIuZ2V0KFtcImZpZWxkc1wiLGhlYWRdKTtcclxuICAgICAgICAgIHZhciBkZXB0aHM9ZGIuZ2V0KFtcImZpZWxkc1wiLGhlYWQrXCJfZGVwdGhcIl0pO1xyXG4gICAgICAgICAgdmFyIHZvZmZzPWRiLmdldChbXCJmaWVsZHNcIixoZWFkK1wiX3ZvZmZcIl0pO1xyXG4gICAgICAgICAgdmFyIHRvYz10aGlzLmdlblRvYyhoZWFkcyxkZXB0aHMsdm9mZnMpOy8vLHRvYzp0b2NcclxuICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3RvYzp0b2N9KTtcclxuICAgICAgIH0pO1xyXG4gICAgfSx0aGlzKTsgICAgICBcclxuICAgIHRoaXMuc2V0U3RhdGUoe2RpYWxvZzpmYWxzZSxxdW90YTpxdW90YSx1c2FnZTp1c2FnZX0pO1xyXG4gIH0sXHJcbiAgZ2V0UmVxdWlyZV9rZGI6ZnVuY3Rpb24oKSB7Ly9yZXR1cm4gYW4gYXJyYXkgb2YgcmVxdWlyZSBkYiBmcm9tIGtzYW5hLmpzXHJcbiAgICB2YXIgcmVxdWlyZWQ9W107XHJcbiAgICBrc2FuYS5qcy5maWxlcy5tYXAoZnVuY3Rpb24oZil7XHJcbiAgICAgIGlmIChmLmluZGV4T2YoXCIua2RiXCIpPT1mLmxlbmd0aC00KSB7XHJcbiAgICAgICAgdmFyIHNsYXNoPWYubGFzdEluZGV4T2YoXCIvXCIpO1xyXG4gICAgICAgIGlmIChzbGFzaD4tMSkge1xyXG4gICAgICAgICAgdmFyIGRiaWQ9Zi5zdWJzdHJpbmcoc2xhc2grMSxmLmxlbmd0aC00KTtcclxuICAgICAgICAgIHJlcXVpcmVkLnB1c2goe3VybDpmLGRiaWQ6ZGJpZCxmaWxlbmFtZTpkYmlkK1wiLmtkYlwifSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHZhciBkYmlkPWYuc3Vic3RyaW5nKDAsZi5sZW5ndGgtNCk7XHJcbiAgICAgICAgICByZXF1aXJlZC5wdXNoKHt1cmw6a3NhbmEuanMuYmFzZXVybCtmLGRiaWQ6ZGJpZCxmaWxlbmFtZTpmfSk7XHJcbiAgICAgICAgfSAgICAgICAgXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHJlcXVpcmVkO1xyXG4gIH0sXHJcbiAgb3BlbkZpbGVpbnN0YWxsZXI6ZnVuY3Rpb24oYXV0b2Nsb3NlKSB7XHJcbiAgICB2YXIgcmVxdWlyZV9rZGI9dGhpcy5nZXRSZXF1aXJlX2tkYigpLm1hcChmdW5jdGlvbihkYil7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgdXJsOndpbmRvdy5sb2NhdGlvbi5vcmlnaW4rd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lK2RiLmRiaWQrXCIua2RiXCIsXHJcbiAgICAgICAgZGJkYjpkYi5kYmlkLFxyXG4gICAgICAgIGZpbGVuYW1lOmRiLmZpbGVuYW1lXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICByZXR1cm4gRShGaWxlaW5zdGFsbGVyLCB7cXVvdGE6IFwiNTEyTVwiLCBhdXRvY2xvc2U6IGF1dG9jbG9zZSwgbmVlZGVkOiByZXF1aXJlX2tkYiwgXHJcbiAgICAgICAgICAgICAgICAgICAgIG9uUmVhZHk6IHRoaXMub25SZWFkeX0pXHJcbiAgfSxcclxuICBmaWRpYWxvZzpmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5zZXRTdGF0ZSh7ZGlhbG9nOnRydWV9KTtcclxuICB9LCBcclxuICBzaG93RXhjZXJwdDpmdW5jdGlvbihuKSB7XHJcbiAgICB2YXIgdm9mZj10aGlzLnN0YXRlLnRvY1tuXS52b2ZmO1xyXG4gICAgdmFyIGVuZD10aGlzLnN0YXRlLnRvY1tuXS5lbmQ7XHJcbiAgICB2YXIgaGl0PXRoaXMuc3RhdGUudG9jW25dLmhpdDtcclxuICAgIHRoaXMuZG9zZWFyY2gobnVsbCxudWxsLFt2b2ZmLGVuZCxoaXRdKTtcclxuICAgIHRoaXMuc2xpZGVTZWFyY2goKTtcclxuICB9LFxyXG4gIHN5bmNUb2M6ZnVuY3Rpb24odm9mZikge1xyXG4gICAgdGhpcy5zZXRTdGF0ZSh7Z29Wb2ZmOnZvZmZ8fHRoaXMuZmlsZXNlZzJ2cG9zKCl9KTtcclxuICAgIHRoaXMuc2xpZGVUb2MoKTtcclxuICB9LFxyXG4gIHNsaWRlU2VhcmNoOmZ1bmN0aW9uKCkge1xyXG4gICAgJChcImJvZHlcIikuc2Nyb2xsVG9wKDApO1xyXG4gICAgaWYgKHRoaXMucmVmcy5Td2lwZSkgdGhpcy5yZWZzLlN3aXBlLnN3aXBlLnNsaWRlKDIpO1xyXG4gIH0sXHJcbiAgc2xpZGVUb2M6ZnVuY3Rpb24oKSB7XHJcbiAgICAkKFwiYm9keVwiKS5zY3JvbGxUb3AoMCk7XHJcbiAgICBpZiAodGhpcy5yZWZzLlN3aXBlKSB0aGlzLnJlZnMuU3dpcGUuc3dpcGUuc2xpZGUoMCk7XHJcbiAgfSxcclxuICBzbGlkZVRleHQ6ZnVuY3Rpb24oKSB7XHJcbiAgICBpZiAodGhpcy5yZWZzLlN3aXBlKSB7XHJcbiAgICAgICQoXCJib2R5XCIpLnNjcm9sbFRvcCgwKTtcclxuICAgICAgdGhpcy5yZWZzLlN3aXBlLnN3aXBlLnNsaWRlKDEpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgb25Td2lwZVN0YXJ0OmZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgaWYgKHRhcmdldCAmJiB0aGlzLnN3aXBhYmxlKHRhcmdldCkpIHtcclxuICAgICAgdGhpcy5zd2lwZXRhcmdldHMucHVzaChbdGFyZ2V0LHRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kXSk7XHJcbiAgICAgIHRhcmdldC5zdHlsZS5iYWNrZ3JvdW5kPVwieWVsbG93XCI7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5zd2lwZXRpbWVyKSBjbGVhclRpbWVvdXQodGhpcy5zd2lwZXRpbWVyKTtcclxuICAgIHZhciB0aGF0PXRoaXM7XHJcbiAgICB0aGlzLnN3aXBldGltZXI9c2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICBpZighdGhhdC5zd2lwZXRhcmdldHMubGVuZ3RoKSByZXR1cm47XHJcbiAgICAgIHRoYXQuc3dpcGV0YXJnZXRzLm1hcChmdW5jdGlvbih0KXtcclxuICAgICAgICB0WzBdLnN0eWxlLmJhY2tncm91bmQ9dFsxXTtcclxuICAgICAgfSk7XHJcbiAgICAgIHRoYXQuc3dpcGV0YXJnZXRzPVtdO1xyXG4gICAgfSwzMDAwKTtcclxuICB9LFxyXG4gIHN3aXBhYmxlOmZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgd2hpbGUgKHRhcmdldCAmJiB0YXJnZXQuZGF0YXNldCAmJiBcclxuICAgICAgdHlwZW9mIHRhcmdldC5kYXRhc2V0Lm49PVwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIHRhcmdldC5kYXRhc2V0LnZwb3M9PVwidW5kZWZpbmVkXCIgKSB7XHJcbiAgICAgIHRhcmdldD10YXJnZXQucGFyZW50Tm9kZTtcclxuICAgIH1cclxuICAgIGlmICh0YXJnZXQgJiYgdGFyZ2V0LmRhdGFzZXQpIHJldHVybiB0cnVlO1xyXG4gIH0sXHJcbiAgdHJ5VG9jTm9kZTpmdW5jdGlvbihpbmRleCx0YXJnZXQpe1xyXG4gICAgd2hpbGUgKHRhcmdldCAmJiB0YXJnZXQuZGF0YXNldCAmJiB0eXBlb2YgdGFyZ2V0LmRhdGFzZXQubj09XCJ1bmRlZmluZWRcIikge1xyXG4gICAgICB0YXJnZXQ9dGFyZ2V0LnBhcmVudE5vZGU7XHJcbiAgICB9XHJcbiAgICBpZiAodGFyZ2V0ICYmIHRhcmdldC5kYXRhc2V0JiZ0YXJnZXQuZGF0YXNldC5uKSB7XHJcbiAgICAgIGlmIChpbmRleD09Mikgey8vZmlsdGVyIHNlYXJjaCByZXN1bHRcclxuICAgICAgICB0aGlzLnNob3dFeGNlcnB0KHRhcmdldC5kYXRhc2V0Lm4pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciB2b2ZmPXRoaXMuc3RhdGUudG9jW3RhcmdldC5kYXRhc2V0Lm5dLnZvZmY7XHJcbiAgICAgICAgdGhpcy5nb3Rvc2VnKHZvZmYpOyAgXHJcbiAgICAgIH0gICAgXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgdHJ5UmVzdWx0SXRlbTpmdW5jdGlvbihpbmRleCx0YXJnZXQpIHtcclxuICAgIHdoaWxlICh0YXJnZXQgJiYgdGFyZ2V0LmRhdGFzZXQgJiYgdHlwZW9mIHRhcmdldC5kYXRhc2V0LnZwb3M9PVwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGFyZ2V0PXRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgfVxyXG4gICAgaWYgKHRhcmdldCAmJiB0YXJnZXQuZGF0YXNldCYmdGFyZ2V0LmRhdGFzZXQudnBvcykge1xyXG4gICAgICB2YXIgdnBvcz1wYXJzZUludCh0YXJnZXQuZGF0YXNldC52cG9zKTtcclxuICAgICAgaWYgKGluZGV4PT0xKSB7XHJcbiAgICAgICAgdGhpcy5nb3Rvc2VnKHZwb3MpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgLy8gdGhpcy5zeW5jVG9jKHZwb3MpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgb25Td2lwZUVuZDpmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgIGlmICh0aGlzLnN3aXBldGFyZ2V0cy5sZW5ndGgpIHtcclxuICAgICAgdGhpcy5zd2lwZXRhcmdldHNbMF1bMF0uc3R5bGUuYmFja2dyb3VuZD10aGlzLnN3aXBldGFyZ2V0c1swXVsxXTtcclxuICAgICAgdGhpcy5zd2lwZXRhcmdldHMuc2hpZnQoKTtcclxuICAgIH1cclxuICB9LFxyXG4gIG9uVHJhbnNpdGlvbkVuZDpmdW5jdGlvbihpbmRleCxzbGlkZSx0YXJnZXQpIHtcclxuICAgIGlmICghdGhpcy50cnlSZXN1bHRJdGVtKGluZGV4LHRhcmdldCkpIHRoaXMudHJ5VG9jTm9kZShpbmRleCx0YXJnZXQpO1xyXG4gIH0sXHJcbiAgcmVuZGVyU2xpZGVCdXR0b25zOmZ1bmN0aW9uKCkge1xyXG4gICAgaWYgKGtzYW5hLnBsYXRmb3JtIT1cImlvc1wiICYmIGtzYW5hLnBsYXRmb3JtIT1cImFuZHJvaWRcIikge1xyXG4gICAgICByZXR1cm4gRShcImRpdlwiLCBudWxsLCBcclxuICAgICAgICAgICAgICAgIEUoXCJidXR0b25cIiwge29uQ2xpY2s6IHRoaXMuc2xpZGVUb2N9LCBcIlRvY1wiKSwgXHJcbiAgICAgICAgICAgICAgICBFKFwiYnV0dG9uXCIsIHtvbkNsaWNrOiB0aGlzLnNsaWRlVGV4dH0sIFwiVGV4dFwiKSwgXHJcbiAgICAgICAgICAgICAgICBFKFwiYnV0dG9uXCIsIHtvbkNsaWNrOiB0aGlzLnNsaWRlU2VhcmNofSwgXCJTZWFyY2hcIilcclxuICAgICAgICAgICAgICApXHJcbiAgICB9XHJcbiAgfSxcclxuICByZW5kZXJTdGFja3RvYzpmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAgRShTdGFja3RvYywge3Nob3dUZXh0OiB0aGlzLnNob3dUZXh0LCBcclxuICAgICAgICAgICAgc2hvd0V4Y2VycHQ6IHRoaXMuc2hvd0V4Y2VycHQsIGhpdHM6IHRoaXMuc3RhdGUucmVzLnJhd3Jlc3VsdCwgXHJcbiAgICAgICAgICAgIGFjdGlvbjogdGhpcy5hY3Rpb24sIFxyXG4gICAgICAgICAgICBkYXRhOiB0aGlzLnN0YXRlLnRvYywgZ29Wb2ZmOiB0aGlzLnN0YXRlLmdvVm9mZiwgXHJcbiAgICAgICAgICAgIHNob3dUZXh0T25MZWFmTm9kZU9ubHk6IHRydWV9KVxyXG4gIH0sXHJcbiAgcmVuZGVyU2hvd3RleHQ6ZnVuY3Rpb24odGV4dCxzZWduYW1lKSB7XHJcbiAgICB2YXIgU2hvd1RleHRDb21wb25lbnQ9cmVxdWlyZShcIi4vc2hvd3RleHRcIik7XHJcbiAgICBpZiAodGhpcy5zaG93VGV4dENvbXBvbmVudCkge1xyXG4gICAgICBTaG93VGV4dENvbXBvbmVudD10aGlzLnNob3dUZXh0Q29tcG9uZW50O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIEUoU2hvd1RleHRDb21wb25lbnQsIHtzZWduYW1lOiBzZWduYW1lLCB0ZXh0OiB0ZXh0LCBcclxuICAgICAgZGljdGlvbmFyaWVzOiB0aGlzLmRpY3Rpb25hcmllcywgXHJcbiAgICAgIGFjdGlvbjogdGhpcy5hY3Rpb24sIFxyXG4gICAgICBuZXh0c2VnOiB0aGlzLm5leHRzZWcsIHNldHNlZzogdGhpcy5zZXRzZWcsIHByZXZzZWc6IHRoaXMucHJldnNlZywgc3luY1RvYzogdGhpcy5zeW5jVG9jfSlcclxuICB9LFxyXG4gIHJlbmRlck1vYmlsZTpmdW5jdGlvbih0ZXh0LHNlZ25hbWUpIHtcclxuICAgICByZXR1cm4gKFxyXG4gICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibWFpblwifSwgXHJcbiAgICAgICAgRShTd2lwZSwge3JlZjogXCJTd2lwZVwiLCBjb250aW51b3VzOiB0cnVlLCBcclxuICAgICAgICAgICAgICAgdHJhbnNpdGlvbkVuZDogdGhpcy5vblRyYW5zaXRpb25FbmQsIFxyXG4gICAgICAgICAgICAgICBzd2lwZVN0YXJ0OiB0aGlzLm9uU3dpcGVTdGFydCwgc3dpcGVFbmQ6IHRoaXMub25Td2lwZUVuZH0sIFxyXG4gICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJzd2lwZWRpdlwifSwgXHJcbiAgICAgICAgICB0aGlzLnJlbmRlclN0YWNrdG9jKClcclxuICAgICAgICApLCBcclxuICAgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwic3dpcGVkaXZcIn0sIFxyXG4gICAgICAgICAgdGhpcy5yZW5kZXJTaG93dGV4dCh0ZXh0LHNlZ25hbWUpXHJcbiAgICAgICAgKSwgXHJcbiAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcInN3aXBlZGl2XCJ9LCBcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJpbnB1dHMoKVxyXG4gICAgICAgIClcclxuICAgICAgICApXHJcbiAgICAgIClcclxuICAgICAgKTtcclxuICB9LFxyXG4gIHJlbmRlclBDOmZ1bmN0aW9uKHRleHQsc2VnbmFtZSkge1xyXG4gICAgcmV0dXJuIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtYWluXCJ9LCBcclxuICAgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwiY29sLW1kLTNcIn0sIFxyXG4gICAgICAgICAgdGhpcy5yZW5kZXJTdGFja3RvYygpXHJcbiAgICAgICAgKSwgXHJcbiAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcImNvbC1tZC00XCJ9LCBcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJpbnB1dHMoKVxyXG4gICAgICAgICksIFxyXG4gICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJjb2wtbWQtNVwifSwgXHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyU2hvd3RleHQodGV4dCxzZWduYW1lKVxyXG4gICAgICAgIClcclxuICAgICAgKVxyXG4gIH0sXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHsgIC8vbWFpbiByZW5kZXIgcm91dGluZVxyXG4gICAgaWYgKCF0aGlzLnN0YXRlLnF1b3RhKSB7IC8vIGluc3RhbGwgcmVxdWlyZWQgZGJcclxuICAgICAgICByZXR1cm4gdGhpcy5vcGVuRmlsZWluc3RhbGxlcih0cnVlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHZhciB0ZXh0PVwiXCI7XHJcbiAgICAgIHZhciBzZWduYW1lPVwiXCI7XHJcbiAgICAgIGlmICh0aGlzLnN0YXRlLmJvZHl0ZXh0KSB7XHJcbiAgICAgICAgdGV4dD10aGlzLnN0YXRlLmJvZHl0ZXh0LnRleHQ7XHJcbiAgICAgICAgc2VnbmFtZT10aGlzLnN0YXRlLmJvZHl0ZXh0LnNlZ25hbWU7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGtzYW5hZ2FwLnBsYXRmb3JtPT1cImNocm9tZVwiIHx8IGtzYW5hZ2FwLnBsYXRmb3JtPT1cIm5vZGUtd2Via2l0XCIpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZW5kZXJQQyh0ZXh0LHNlZ25hbWUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlbmRlck1vYmlsZSh0ZXh0LHNlZ25hbWUpO1xyXG4gICAgICB9XHJcbiAgfVxyXG4gIH0gXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzPURlZmF1bHRtYWluTWl4aW47IiwidmFyIFJlc3VsdGxpc3Q9UmVhY3QuY3JlYXRlQ2xhc3MoeyAgLy9zaG91bGQgc2VhcmNoIHJlc3VsdFxyXG4gIHNob3c6ZnVuY3Rpb24oKSB7ICBcclxuICAgIHJldHVybiB0aGlzLnByb3BzLnJlcy5leGNlcnB0Lm1hcChmdW5jdGlvbihyLGkpeyAvLyBleGNlcnB0IGlzIGFuIGFycmF5IFxyXG4gICAgICBpZiAoISByKSByZXR1cm4gbnVsbDtcclxuICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge1wiZGF0YS12cG9zXCI6IHIuaGl0c1swXVswXX0sIFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiYVwiLCB7aHJlZjogXCIjXCIsIG9uQ2xpY2s6IHRoaXMuZ290b3BhZ2UsIGNsYXNzTmFtZTogXCJzb3VyY2VwYWdlXCJ9LCByLnBhZ2VuYW1lKSwgXCIpXCIsIFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwic3BhblwiLCB7Y2xhc3NOYW1lOiBcInJlc3VsdGl0ZW1cIiwgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw6IHtfX2h0bWw6ci50ZXh0fX0pXHJcbiAgICAgIClcclxuICAgIH0sdGhpcyk7XHJcbiAgfSxcclxuICBnb3RvcGFnZTpmdW5jdGlvbihlKSB7XHJcbiAgICB2YXIgdnBvcz1wYXJzZUludChlLnRhcmdldC5wYXJlbnROb2RlLmRhdGFzZXRbJ3Zwb3MnXSk7XHJcbiAgICB0aGlzLnByb3BzLmdvdG9wYWdlKHZwb3MpO1xyXG4gIH0sXHJcbiAgcmVuZGVyOmZ1bmN0aW9uKCkgeyBcclxuICAgIGlmICh0aGlzLnByb3BzLnJlcykgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgbnVsbCwgdGhpcy5zaG93KCkpO1xyXG4gICAgZWxzZSByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCBudWxsLCBcIk5vdCBGb3VuZFwiKTtcclxuICB9IFxyXG59KTsgXHJcblxyXG5tb2R1bGUuZXhwb3J0cz1SZXN1bHRsaXN0OyIsIi8vdmFyIERpY3Rpb25hcnk9cmVxdWlyZShcImtzYW5hMjAxNS1kaWN0aW9uYXJ5LXVpXCIpO1xyXG52YXIgQ29udHJvbHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7c2VnbmFtZTp0aGlzLnByb3BzLnNlZ25hbWV9O1xyXG4gIH0sXHJcbiAgdXBkYXRlVmFsdWU6ZnVuY3Rpb24oZSl7XHJcbiAgICBpZiAoZS5rZXkhPVwiRW50ZXJcIikgcmV0dXJuO1xyXG4gICAgdmFyIG5ld3NlZ25hbWU9dGhpcy5yZWZzLnNlZ25hbWUuZ2V0RE9NTm9kZSgpLnZhbHVlO1xyXG4gICAgdGhpcy5wcm9wcy5zZXRzZWcobmV3c2VnbmFtZSk7XHJcbiAgfSwgIFxyXG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZTpmdW5jdGlvbihuZXh0UHJvcHMsbmV4dFN0YXRlKSB7XHJcbiAgICB0aGlzLnJlZnMuc2VnbmFtZS5nZXRET01Ob2RlKCkudmFsdWU9bmV4dFByb3BzLnNlZ25hbWU7XHJcbiAgICBuZXh0U3RhdGUuc2VnbmFtZT1uZXh0UHJvcHMuc2VnbmFtZTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0sXHJcbiAgZ290b1RvYzpmdW5jdGlvbigpIHtcclxuICAgIHRoaXMucHJvcHMuc3luY1RvYygpOyBcclxuICB9LFxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7ICAgXHJcbiAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHtjbGFzc05hbWU6IFwiaW5wdXRzXCJ9LCBcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiLCB7b25DbGljazogdGhpcy5nb3RvVG9jfSwgXCJUT0NcIiksIFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwic3BhblwiLCBudWxsLCBcIl9fX1wiKSwgXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIiwge29uQ2xpY2s6IHRoaXMucHJvcHMucHJldn0sIFwiIFxcdTI1YzAgXCIpLCBcclxuICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiLCB7c2l6ZTogXCI4XCIsIHR5cGU6IFwidGV4dFwiLCByZWY6IFwic2VnbmFtZVwiLCBvbktleVVwOiB0aGlzLnVwZGF0ZVZhbHVlfSksIFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIsIHtvbkNsaWNrOiB0aGlzLnByb3BzLm5leHR9LCBcIiBcXHUyNWI2IFwiKVxyXG4gICAgICApXHJcbiAgfSAgXHJcbn0pO1xyXG52YXIgYWRkYnI9ZnVuY3Rpb24odCkge1xyXG4gIHJldHVybiB0LnNwbGl0KFwiXFxuXCIpLm1hcChmdW5jdGlvbihsaW5lKXtyZXR1cm4gbGluZStcIiA8YnIvPlwifSkuam9pbihcIlxcblwiKTtcclxufTtcclxuXHJcbnZhciBTaG93dGV4dCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtkaWN0dG9maW5kOlwiXCJ9O1xyXG4gIH0sXHJcbiAgdG91Y2hkaXN0YW5jZTpmdW5jdGlvbihzdGFydCxlbmQpIHtcclxuICAgIHZhciBkeD1lbmRbMF0tc3RhcnRbMF07XHJcbiAgICB2YXIgZHk9ZW5kWzFdLXN0YXJ0WzFdO1xyXG4gICAgcmV0dXJuIE1hdGguc3FydChkeCpkeCtkeSpkeSk7XHJcbiAgfSxcclxuICB0b3VjaHN0YXJ0OmZ1bmN0aW9uKGUpIHtcclxuICAgIHRoaXMudG91Y2hpbmc9ZS50YXJnZXQ7XHJcbiAgICB0aGlzLnRvdWNocG9zPVtlLnRhcmdldFRvdWNoZXNbMF0ucGFnZVgsZS50YXJnZXRUb3VjaGVzWzBdLnBhZ2VZXTtcclxuICB9LFxyXG4gIHRvdWNoZW5kOmZ1bmN0aW9uKGUpe1xyXG4gICAgdmFyIHRvdWNoaW5nPXRoaXMudG91Y2hpbmc7XHJcbiAgICB0aGlzLnRvdWNoaW5nPW51bGw7XHJcbiAgICBpZiAoZS50YXJnZXQhPXRvdWNoaW5nKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciB0b3VjaHBvcz1bZS5jaGFuZ2VkVG91Y2hlc1swXS5wYWdlWCxlLmNoYW5nZWRUb3VjaGVzWzBdLnBhZ2VZXTtcclxuICAgIHZhciBkaXN0PXRoaXMudG91Y2hkaXN0YW5jZSh0aGlzLnRvdWNocG9zLHRvdWNocG9zKTtcclxuICAgIGlmIChkaXN0PDUpIHRoaXMuY2hlY2tVbmRlclRhcChlKTtcclxuICB9LFxyXG4gIGNoZWNrVW5kZXJUYXA6ZnVuY3Rpb24oZSkge1xyXG4gICAgdmFyIHNwYW49ZS50YXJnZXQ7XHJcbiAgICB0aGlzLnByb3BzLmFjdGlvbihcInNob3d0ZXh0Lm9udGFwXCIsZSk7XHJcbiAgICBpZiAoc3Bhbi5ub2RlTmFtZSE9XCJTUEFOXCIgfHwgc3Bhbi5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdFswXSE9XCJib2R5dGV4dFwiKSByZXR1cm47XHJcbiAgICBpZiAodGhpcy5wcm9wcy5kaWN0aW9uYXJpZXMgJiYgdGhpcy5wcm9wcy5kaWN0aW9uYXJpZXMubGVuZ3RoKSB7XHJcbiAgICAgIHRoaXMuc2V0U3RhdGUoe2RpY3R0b2ZpbmQ6c3Bhbn0pO1xyXG4gICAgfVxyXG4gIH0sXHJcbi8vICAgICAgICAgIDxEaWN0aW9uYXJ5IGRpY3Rpb25hcmllcz17dGhpcy5wcm9wcy5kaWN0aW9uYXJpZXN9ICB0b2ZpbmQ9e3RoaXMuc3RhdGUuZGljdHRvZmluZH0vPlxyXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgcG49dGhpcy5wcm9wcy5zZWduYW1lO1xyXG4gICAgcmV0dXJuICggXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgbnVsbCwgXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChDb250cm9scywge3NlZ25hbWU6IHRoaXMucHJvcHMuc2VnbmFtZSwgbmV4dDogdGhpcy5wcm9wcy5uZXh0c2VnLCBcclxuICAgICAgICBwcmV2OiB0aGlzLnByb3BzLnByZXZzZWcsIHNldHNlZzogdGhpcy5wcm9wcy5zZXRzZWcsIFxyXG4gICAgICAgIHN5bmNUb2M6IHRoaXMucHJvcHMuc3luY1RvY30pLCBcclxuXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7b25Ub3VjaFN0YXJ0OiB0aGlzLnRvdWNoc3RhcnQsIFxyXG4gICAgICAgICAgICAgb25Ub3VjaEVuZDogdGhpcy50b3VjaGVuZCwgXHJcbiAgICAgICAgICAgICBvbkNsaWNrOiB0aGlzLmNoZWNrVW5kZXJUYXAsIFxyXG4gICAgICAgICAgICAgY2xhc3NOYW1lOiBcImJvZHl0ZXh0XCIsIFxyXG4gICAgICAgICAgICAgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw6IHtfX2h0bWw6YWRkYnIodGhpcy5wcm9wcy50ZXh0fHxcIlwiKX19KVxyXG4gICAgICApXHJcbiAgICApO1xyXG4gIH1cclxufSk7XHJcbm1vZHVsZS5leHBvcnRzPVNob3d0ZXh0OyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xyXG52YXIgRT1SZWFjdC5jcmVhdGVFbGVtZW50O1xyXG52YXIgdHJpbUhpdD1mdW5jdGlvbihoaXQpIHtcclxuICBpZiAoaGl0Pjk5OSkgeyBcclxuICAgIHJldHVybiAoTWF0aC5mbG9vcihoaXQvMTAwMCkpLnRvU3RyaW5nKCkrXCJLK1wiO1xyXG4gIH0gZWxzZSByZXR1cm4gaGl0LnRvU3RyaW5nKCk7XHJcbn1cclxudmFyIHRyaW1UZXh0PWZ1bmN0aW9uKHRleHQsb3B0cykge1xyXG4gICAgaWYgKG9wdHMubWF4aXRlbWxlbmd0aCAmJiB0ZXh0Lmxlbmd0aD5vcHRzLm1heGl0ZW1sZW5ndGgpIHtcclxuICAgICAgdmFyIHN0b3BBdD1vcHRzLnN0b3BBdHx8XCJcIjtcclxuICAgICAgaWYgKHN0b3BBdCkge1xyXG4gICAgICAgIHZhciBhdD1vcHRzLm1heGl0ZW1sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGF0PjEwKSB7XHJcbiAgICAgICAgICBpZiAodGV4dC5jaGFyQXQoYXQpPT1zdG9wQXQpIHJldHVybiB0ZXh0LnN1YnN0cigwLGF0KStcIi4uLlwiO1xyXG4gICAgICAgICAgYXQtLTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIHRleHQuc3Vic3RyKDAsb3B0cy5tYXhpdGVtbGVuZ3RoKStcIi4uLlwiO1xyXG4gICAgICB9XHJcbiAgICB9IFxyXG4gICAgcmV0dXJuIHRleHQ7XHJcbn1cclxudmFyIHJlbmRlckRlcHRoPWZ1bmN0aW9uKGRlcHRoLG9wdHMsbm9kZXR5cGUpIHtcclxuICB2YXIgb3V0PVtdO1xyXG4gIGlmIChvcHRzLnRvY3N0eWxlPT1cInZlcnRpY2FsX2xpbmVcIikge1xyXG4gICAgZm9yICh2YXIgaT0wO2k8ZGVwdGg7aSsrKSB7XHJcbiAgICAgIGlmIChpPT1kZXB0aC0xKSB7XHJcbiAgICAgICAgb3V0LnB1c2goRShcImltZ1wiLCB7c3JjOiBvcHRzLnRvY2Jhcl9zdGFydH0pKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBvdXQucHVzaChFKFwiaW1nXCIsIHtzcmM6IG9wdHMudG9jYmFyfSkpOyAgXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBvdXQ7ICAgIFxyXG4gIH0gZWxzZSB7XHJcbiAgICBpZiAoZGVwdGgpIHJldHVybiBFKFwic3BhblwiLCBudWxsLCBkZXB0aCwgXCIuXCIpXHJcbiAgICBlbHNlIHJldHVybiBudWxsO1xyXG4gIH1cclxuICByZXR1cm4gbnVsbDtcclxufTtcclxuXHJcbnZhciBBbmNlc3RvcnM9UmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG4gIGdvYmFjazpmdW5jdGlvbihlKSB7XHJcbiAgICB2YXIgbj1lLnRhcmdldC5kYXRhc2V0W1wiblwiXTsgIFxyXG4gICAgaWYgKHR5cGVvZiBuPT1cInVuZGVmaW5lZFwiKSBuPWUudGFyZ2V0LnBhcmVudE5vZGUuZGF0YXNldFtcIm5cIl07XHJcbiAgICB0aGlzLnByb3BzLnNldEN1cnJlbnQobik7IFxyXG4gIH0sXHJcbiAgc2hvd0V4Y2VycHQ6ZnVuY3Rpb24oZSkge1xyXG4gICAgdmFyIG49cGFyc2VJbnQoZS50YXJnZXQucGFyZW50Tm9kZS5kYXRhc2V0W1wiblwiXSk7XHJcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgdGhpcy5wcm9wcy5zaG93RXhjZXJwdChuKTtcclxuICB9LCBcclxuICBzaG93SGl0OmZ1bmN0aW9uKGhpdCkge1xyXG4gICAgaWYgKGhpdCkgIHJldHVybiBFKFwiYVwiLCB7aHJlZjogXCIjXCIsIG9uQ2xpY2s6IHRoaXMuc2hvd0V4Y2VycHQsIGNsYXNzTmFtZTogXCJwdWxsLXJpZ2h0IGJhZGdlIGhpdGJhZGdlXCJ9LCB0cmltSGl0KGhpdCkpXHJcbiAgICBlbHNlIHJldHVybiBFKFwic3BhblwiLCBudWxsKTtcclxuICB9LFxyXG4gIHJlbmRlckFuY2VzdG9yOmZ1bmN0aW9uKG4saWR4KSB7XHJcbiAgICB2YXIgaGl0PXRoaXMucHJvcHMudG9jW25dLmhpdDtcclxuICAgIHZhciB0ZXh0PXRoaXMucHJvcHMudG9jW25dLnRleHQudHJpbSgpO1xyXG4gICAgdGV4dD10cmltVGV4dCh0ZXh0LHRoaXMucHJvcHMub3B0cyk7XHJcbiAgICBpZiAodGhpcy5wcm9wcy50ZXh0Q29udmVydGVyKSB0ZXh0PXRoaXMucHJvcHMudGV4dENvbnZlcnRlcih0ZXh0KTtcclxuICAgIHJldHVybiBFKFwiZGl2XCIsIHtrZXk6IFwiYVwiK24sIGNsYXNzTmFtZTogXCJub2RlIHBhcmVudFwiLCBcImRhdGEtblwiOiBuLCBvbkNsaWNrOiB0aGlzLmdvYmFja30sIHJlbmRlckRlcHRoKGlkeCx0aGlzLnByb3BzLm9wdHMsXCJhbmNlc3RvclwiKSxcclxuICAgICAgICAgICAgICBFKFwiYVwiLCB7Y2xhc3NOYW1lOiBcInRleHRcIiwgaHJlZjogXCIjXCJ9LCB0ZXh0KSwgdGhpcy5zaG93SGl0KGhpdCkpXHJcbiAgfSxcclxuICByZW5kZXI6ZnVuY3Rpb24oKSB7XHJcbiAgICBpZiAoIXRoaXMucHJvcHMuZGF0YSB8fCAhdGhpcy5wcm9wcy5kYXRhLmxlbmd0aCkgcmV0dXJuIEUoXCJkaXZcIixudWxsKTtcclxuICAgIHJldHVybiBFKFwiZGl2XCIsIG51bGwsIHRoaXMucHJvcHMuZGF0YS5tYXAodGhpcy5yZW5kZXJBbmNlc3RvcikpXHJcbiAgfSBcclxufSk7IFxyXG52YXIgQ2hpbGRyZW49UmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG4gIGdldEluaXRpYWxTdGF0ZTpmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7c2VsZWN0ZWQ6MH07XHJcbiAgfSxcclxuICBzaG91bGRDb21wb25lbnRVcGRhdGU6ZnVuY3Rpb24obmV4dFByb3BzLG5leHRTdGF0ZSkge1xyXG4gICAgaWYgKG5leHRQcm9wcy5kYXRhLmpvaW4oKSE9dGhpcy5wcm9wcy5kYXRhLmpvaW4oKSApIHtcclxuICAgICAgbmV4dFN0YXRlLnNlbGVjdGVkPXBhcnNlSW50KG5leHRQcm9wcy5kYXRhWzBdKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0sXHJcbiAgb3BlbjpmdW5jdGlvbihlKSB7XHJcbiAgICB2YXIgbj1lLnRhcmdldC5wYXJlbnROb2RlLmRhdGFzZXRbXCJuXCJdO1xyXG4gICAgaWYgKHR5cGVvZiBuIT09XCJ1bmRlZmluZWRcIikgdGhpcy5wcm9wcy5zZXRDdXJyZW50KHBhcnNlSW50KG4pKTtcclxuICB9LCBcclxuICBzaG93SGl0OmZ1bmN0aW9uKGhpdCkge1xyXG4gICAgaWYgKGhpdCkgIHJldHVybiBFKFwiYVwiLCB7aHJlZjogXCIjXCIsIG9uQ2xpY2s6IHRoaXMuc2hvd0V4Y2VycHQsIFxyXG4gICAgICBjbGFzc05hbWU6IFwicHVsbC1yaWdodCBiYWRnZSBoaXRiYWRnZVwifSwgdHJpbUhpdChoaXQpKVxyXG4gICAgZWxzZSByZXR1cm4gRShcInNwYW5cIixudWxsKTtcclxuICB9LFxyXG4gIHNob3dFeGNlcnB0OmZ1bmN0aW9uKGUpIHtcclxuICAgIHZhciBuPXBhcnNlSW50KGUudGFyZ2V0LnBhcmVudE5vZGUuZGF0YXNldFtcIm5cIl0pO1xyXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIHRoaXMucHJvcHMuaGl0Q2xpY2sobik7XHJcbiAgfSwgXHJcbiAgbm9kZUNsaWNrZWQ6ZnVuY3Rpb24oZSkge1xyXG4gICAgdmFyIHRhcmdldD1lLnRhcmdldDtcclxuICAgIHdoaWxlICh0YXJnZXQgJiYgdHlwZW9mIHRhcmdldC5kYXRhc2V0Lm49PVwidW5kZWZpbmVkXCIpdGFyZ2V0PXRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgaWYgKCF0YXJnZXQpIHJldHVybjtcclxuICAgIHZhciBuPXBhcnNlSW50KHRhcmdldC5kYXRhc2V0Lm4pO1xyXG4gICAgdmFyIGNoaWxkPXRoaXMucHJvcHMudG9jW25dO1xyXG4gICAgaWYgKHRoaXMucHJvcHMuc2hvd1RleHRPbkxlYWZOb2RlT25seSkge1xyXG4gICAgICBpZiAoY2hpbGQuaGFzQ2hpbGQpIHtcclxuICAgICAgICB0aGlzLm9wZW4oZSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zaG93VGV4dChlKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKG49PXRoaXMuc3RhdGUuc2VsZWN0ZWQpIHtcclxuICAgICAgICBpZiAoY2hpbGQuaGFzQ2hpbGQpIHRoaXMub3BlbihlKTtcclxuICAgICAgICBlbHNlIHRoaXMuc2hvd1RleHQoZSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5zaG93VGV4dChlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWQ6bn0pO1xyXG4gIH0sXHJcbiAgcmVuZGVyQ2hpbGQ6ZnVuY3Rpb24obikge1xyXG4gICAgdmFyIGNoaWxkPXRoaXMucHJvcHMudG9jW25dO1xyXG4gICAgdmFyIGhpdD10aGlzLnByb3BzLnRvY1tuXS5oaXQ7XHJcbiAgICB2YXIgY2xhc3Nlcz1cIm5vZGUgY2hpbGRcIixoYXNjaGlsZD1mYWxzZTsgIFxyXG4gICAgLy9pZiAoY2hpbGQuZXh0cmEpIGV4dHJhPVwiPGV4dHJhPlwiK2NoaWxkLmV4dHJhK1wiPC9leHRyYT5cIjtcclxuICAgIGlmICghY2hpbGQuaGFzQ2hpbGQpIGNsYXNzZXMrPVwiIG5vY2hpbGRcIjtcclxuICAgIGVsc2UgaGFzY2hpbGQ9dHJ1ZTtcclxuICAgIHZhciBzZWxlY3RlZD10aGlzLnN0YXRlLnNlbGVjdGVkO1xyXG4gICAgaWYgKHRoaXMucHJvcHMuc2hvd1RleHRPbkxlYWZOb2RlT25seSkge1xyXG4gICAgICBzZWxlY3RlZD1uO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjbGFzc2VzPVwiYnRuIGJ0bi1saW5rXCI7XHJcbiAgICBpZiAobj09c2VsZWN0ZWQpIHtcclxuICAgICAgaWYgKGhhc2NoaWxkKSBjbGFzc2VzPVwiYnRuIGJ0bi1kZWZhdWx0IGV4cGFuZGFibGVcIjtcclxuICAgICAgZWxzZSBjbGFzc2VzPVwiYnRuIGJ0bi1saW5rIGxpbmstc2VsZWN0ZWRcIjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdGV4dD10aGlzLnByb3BzLnRvY1tuXS50ZXh0LnRyaW0oKTtcclxuICAgIHZhciBkZXB0aD10aGlzLnByb3BzLnRvY1tuXS5kZXB0aDtcclxuICAgIHRleHQ9dHJpbVRleHQodGV4dCx0aGlzLnByb3BzLm9wdHMpXHJcbiAgICBpZiAodGhpcy5wcm9wcy50ZXh0Q29udmVydGVyKSB0ZXh0PXRoaXMucHJvcHMudGV4dENvbnZlcnRlcih0ZXh0KTtcclxuICAgIHJldHVybiBFKFwiZGl2XCIsIHtrZXk6IFwiY2hpbGRcIituLCBcImRhdGEtblwiOiBufSwgcmVuZGVyRGVwdGgoZGVwdGgsdGhpcy5wcm9wcy5vcHRzLFwiY2hpbGRcIiksIFxyXG4gICAgICAgICAgIEUoXCJhXCIsIHtcImRhdGEtblwiOiBuLCBjbGFzc05hbWU6IGNsYXNzZXMgK1wiIHRvY2l0ZW0gdGV4dFwiLCBvbkNsaWNrOiB0aGlzLm5vZGVDbGlja2VkfSwgdGV4dCtcIiBcIiksIHRoaXMuc2hvd0hpdChoaXQpXHJcbiAgICAgICAgICAgKVxyXG4gIH0sXHJcbiAgc2hvd1RleHQ6ZnVuY3Rpb24oZSkgeyBcclxuICAgIHZhciB0YXJnZXQ9ZS50YXJnZXQ7XHJcbiAgICB2YXIgbj1lLnRhcmdldC5kYXRhc2V0Lm47XHJcbiAgICB3aGlsZSAodGFyZ2V0ICYmIHR5cGVvZiB0YXJnZXQuZGF0YXNldC5uPT1cInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRhcmdldD10YXJnZXQucGFyZW50Tm9kZTtcclxuICAgIH1cclxuICAgIGlmICh0YXJnZXQgJiYgdGFyZ2V0LmRhdGFzZXQubiAmJiB0aGlzLnByb3BzLnNob3dUZXh0KSB7XHJcbiAgICAgIHRoaXMucHJvcHMuc2hvd1RleHQocGFyc2VJbnQodGFyZ2V0LmRhdGFzZXQubikpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgcmVuZGVyOmZ1bmN0aW9uKCkge1xyXG4gICAgaWYgKCF0aGlzLnByb3BzLmRhdGEgfHwgIXRoaXMucHJvcHMuZGF0YS5sZW5ndGgpIHJldHVybiBFKFwiZGl2XCIsIG51bGwpO1xyXG4gICAgcmV0dXJuIEUoXCJkaXZcIiwgbnVsbCwgdGhpcy5wcm9wcy5kYXRhLm1hcCh0aGlzLnJlbmRlckNoaWxkKSlcclxuICB9XHJcbn0pOyBcclxuXHJcbnZhciBzdGFja3RvYyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHtiYXI6IFwid29ybGRcIix0b2NSZWFkeTpmYWxzZSxjdXI6MH07Ly80MDNcclxuICB9LFxyXG4gIGJ1aWxkdG9jOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHRvYz10aGlzLnByb3BzLmRhdGE7XHJcbiAgICAgIGlmICghdG9jIHx8ICF0b2MubGVuZ3RoKSByZXR1cm47ICBcclxuICAgICAgdmFyIGRlcHRocz1bXTtcclxuICAgICAgdmFyIHByZXY9MDtcclxuICAgICAgZm9yICh2YXIgaT0wO2k8dG9jLmxlbmd0aDtpKyspIHtcclxuICAgICAgICB2YXIgZGVwdGg9dG9jW2ldLmRlcHRoO1xyXG4gICAgICAgIGlmIChwcmV2PmRlcHRoKSB7IC8vbGluayB0byBwcmV2IHNpYmxpbmdcclxuICAgICAgICAgIGlmIChkZXB0aHNbZGVwdGhdKSB0b2NbZGVwdGhzW2RlcHRoXV0ubmV4dCA9IGk7XHJcbiAgICAgICAgICBmb3IgKHZhciBqPWRlcHRoO2o8cHJldjtqKyspIGRlcHRoc1tqXT0wO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaTx0b2MubGVuZ3RoLTEgJiYgdG9jW2krMV0uZGVwdGg+ZGVwdGgpIHtcclxuICAgICAgICAgIHRvY1tpXS5oYXNDaGlsZD10cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkZXB0aHNbZGVwdGhdPWk7XHJcbiAgICAgICAgcHJldj1kZXB0aDtcclxuICAgICAgfSBcclxuICB9LCBcclxuICBlbnVtQW5jZXN0b3JzOmZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHRvYz10aGlzLnByb3BzLmRhdGE7XHJcbiAgICBpZiAoIXRvYyB8fCAhdG9jLmxlbmd0aCkgcmV0dXJuO1xyXG4gICAgdmFyIGN1cj10aGlzLnN0YXRlLmN1cjtcclxuICAgIGlmIChjdXI9PTApIHJldHVybiBbXTtcclxuICAgIHZhciBuPWN1ci0xO1xyXG4gICAgdmFyIGRlcHRoPXRvY1tjdXJdLmRlcHRoIC0gMTtcclxuICAgIHZhciBwYXJlbnRzPVtdO1xyXG4gICAgd2hpbGUgKG4+PTAgJiYgZGVwdGg+MCkge1xyXG4gICAgICBpZiAodG9jW25dLmRlcHRoPT1kZXB0aCkge1xyXG4gICAgICAgIHBhcmVudHMudW5zaGlmdChuKTtcclxuICAgICAgICBkZXB0aC0tO1xyXG4gICAgICB9XHJcbiAgICAgIG4tLTtcclxuICAgIH1cclxuICAgIHBhcmVudHMudW5zaGlmdCgwKTsgLy9maXJzdCBhbmNlc3RvciBpcyByb290IG5vZGVcclxuICAgIHJldHVybiBwYXJlbnRzO1xyXG4gIH0sXHJcbiAgZW51bUNoaWxkcmVuIDogZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgY3VyPXRoaXMuc3RhdGUuY3VyO1xyXG4gICAgdmFyIHRvYz10aGlzLnByb3BzLmRhdGE7XHJcblxyXG4gICAgdmFyIGNoaWxkcmVuPVtdO1xyXG4gICAgaWYgKCF0b2MgfHwgIXRvYy5sZW5ndGggfHwgdG9jLmxlbmd0aD09MSkgcmV0dXJuIGNoaWxkcmVuO1xyXG5cclxuICAgIGlmICh0b2NbY3VyKzFdLmRlcHRoIT0gMSt0b2NbY3VyXS5kZXB0aCkgcmV0dXJuIGNoaWxkcmVuOyAgLy8gbm8gY2hpbGRyZW4gbm9kZVxyXG4gICAgdmFyIG49Y3VyKzE7XHJcbiAgICB2YXIgY2hpbGQ9dG9jW25dO1xyXG4gICAgd2hpbGUgKGNoaWxkKSB7XHJcbiAgICAgIGNoaWxkcmVuLnB1c2gobik7XHJcbiAgICAgIHZhciBuZXh0PXRvY1tuKzFdO1xyXG4gICAgICBpZiAoIW5leHQpIGJyZWFrO1xyXG4gICAgICBpZiAobmV4dC5kZXB0aD09Y2hpbGQuZGVwdGgpIHtcclxuICAgICAgICBuKys7XHJcbiAgICAgIH0gZWxzZSBpZiAobmV4dC5kZXB0aD5jaGlsZC5kZXB0aCkge1xyXG4gICAgICAgIG49Y2hpbGQubmV4dDtcclxuICAgICAgfSBlbHNlIGJyZWFrO1xyXG4gICAgICBpZiAobikgY2hpbGQ9dG9jW25dO2Vsc2UgYnJlYWs7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNoaWxkcmVuO1xyXG4gIH0sXHJcbiAgcmVidWlsZFRvYzpmdW5jdGlvbigpIHtcclxuICAgIGlmICghdGhpcy5zdGF0ZS50b2NSZWFkeSAmJiB0aGlzLnByb3BzLmRhdGEpIHtcclxuICAgICAgdGhpcy5idWlsZHRvYygpO1xyXG4gICAgICB0aGlzLnNldFN0YXRlKHt0b2NSZWFkeTp0cnVlfSk7XHJcbiAgICB9XHJcbiAgfSxcclxuICBjb21wb25lbnREaWRNb3VudDpmdW5jdGlvbigpIHtcclxuICAgIHRoaXMucmVidWlsZFRvYygpO1xyXG4gIH0sXHJcbiAgY29tcG9uZW50RGlkVXBkYXRlOmZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5yZWJ1aWxkVG9jKCk7XHJcbiAgfSwgICBcclxuICBzZXRDdXJyZW50OmZ1bmN0aW9uKG4pIHtcclxuICAgIG49cGFyc2VJbnQobik7XHJcbiAgICB0aGlzLnNldFN0YXRlKHtjdXI6bn0pO1xyXG4gICAgdmFyIGNoaWxkPXRoaXMucHJvcHMuZGF0YVtuXTtcclxuICAgIGlmICghKGNoaWxkLmhhc0NoaWxkICYmIHRoaXMucHJvcHMuc2hvd1RleHRPbkxlYWZOb2RlT25seSkpIHtcclxuICAgICAgdGhpcy5wcm9wcy5zaG93VGV4dChuKTtcclxuICAgIH1cclxuICB9LFxyXG4gIGZpbmRCeVZvZmY6ZnVuY3Rpb24odm9mZikge1xyXG4gICAgZm9yICh2YXIgaT0wO2k8dGhpcy5wcm9wcy5kYXRhLmxlbmd0aDtpKyspIHtcclxuICAgICAgdmFyIHQ9dGhpcy5wcm9wcy5kYXRhW2ldO1xyXG4gICAgICBpZiAodC52b2ZmPnZvZmYpIHJldHVybiBpLTE7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gMDsgLy9yZXR1cm4gcm9vdCBub2RlXHJcbiAgfSxcclxuICBzaG91bGRDb21wb25lbnRVcGRhdGU6ZnVuY3Rpb24obmV4dFByb3BzLG5leHRTdGF0ZSkge1xyXG4gICAgaWYgKG5leHRQcm9wcy5nb1ZvZmYmJm5leHRQcm9wcy5nb1ZvZmYgIT10aGlzLnByb3BzLmdvVm9mZikge1xyXG4gICAgICBuZXh0U3RhdGUuY3VyPXRoaXMuZmluZEJ5Vm9mZihuZXh0UHJvcHMuZ29Wb2ZmKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0sXHJcbiAgZmlsbEhpdDpmdW5jdGlvbihub2RlSWRzKSB7XHJcbiAgICBpZiAodHlwZW9mIG5vZGVJZHM9PVwidW5kZWZpbmVkXCIpIHJldHVybjtcclxuICAgIGlmICh0eXBlb2Ygbm9kZUlkcz09XCJudW1iZXJcIikgbm9kZUlkcz1bbm9kZUlkc107XHJcbiAgICB2YXIgdG9jPXRoaXMucHJvcHMuZGF0YTtcclxuICAgIHZhciBoaXRzPXRoaXMucHJvcHMuaGl0cztcclxuICAgIGlmICh0b2MubGVuZ3RoPDIpIHJldHVybjtcclxuICAgIHZhciBnZXRSYW5nZT1mdW5jdGlvbihuKSB7XHJcbiAgICAgIGlmIChuKzE+PXRvYy5sZW5ndGgpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKFwiZXhjZWVkIHRvYyBsZW5ndGhcIixuKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgdmFyIGRlcHRoPXRvY1tuXS5kZXB0aCAsIG5leHRkZXB0aD10b2NbbisxXS5kZXB0aDtcclxuICAgICAgaWYgKG49PXRvYy5sZW5ndGgtMSB8fCBuPT0wKSB7XHJcbiAgICAgICAgICB0b2Nbbl0uZW5kPU1hdGgucG93KDIsIDQ4KTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgfSBlbHNlICBpZiAobmV4dGRlcHRoPmRlcHRoKXtcclxuICAgICAgICBpZiAodG9jW25dLm5leHQpIHtcclxuICAgICAgICAgIHRvY1tuXS5lbmQ9IHRvY1t0b2Nbbl0ubmV4dF0udm9mZjsgIFxyXG4gICAgICAgIH0gZWxzZSB7IC8vbGFzdCBzaWJsaW5nXHJcbiAgICAgICAgICB2YXIgbmV4dD1uKzE7XHJcbiAgICAgICAgICB3aGlsZSAobmV4dDx0b2MubGVuZ3RoICYmIHRvY1tuZXh0XS5kZXB0aD5kZXB0aCkgbmV4dCsrO1xyXG4gICAgICAgICAgaWYgKG5leHQ9PXRvYy5sZW5ndGgpIHRvY1tuXS5lbmQ9TWF0aC5wb3coMiw0OCk7XHJcbiAgICAgICAgICBlbHNlIHRvY1tuXS5lbmQ9dG9jW25leHRdLnZvZmY7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2UgeyAvL3NhbWUgbGV2ZWwgb3IgZW5kIG9mIHNpYmxpbmdcclxuICAgICAgICB0b2Nbbl0uZW5kPXRvY1tuKzFdLnZvZmY7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBnZXRIaXQ9ZnVuY3Rpb24obikge1xyXG4gICAgICB2YXIgc3RhcnQ9dG9jW25dLnZvZmY7XHJcbiAgICAgIHZhciBlbmQ9dG9jW25dLmVuZDtcclxuICAgICAgaWYgKG49PTApIHtcclxuICAgICAgICB0b2NbMF0uaGl0PWhpdHMubGVuZ3RoO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciBoaXQ9MDtcclxuICAgICAgICBmb3IgKHZhciBpPTA7aTxoaXRzLmxlbmd0aDtpKyspIHtcclxuICAgICAgICAgIGlmIChoaXRzW2ldPj1zdGFydCAmJiBoaXRzW2ldPGVuZCkgaGl0Kys7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRvY1tuXS5oaXQ9aGl0O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBub2RlSWRzLmZvckVhY2goZnVuY3Rpb24obil7Z2V0UmFuZ2Uobil9KTtcclxuICAgIG5vZGVJZHMuZm9yRWFjaChmdW5jdGlvbihuKXtnZXRIaXQobil9KTtcclxuICB9LFxyXG4gIGZpbGxIaXRzOmZ1bmN0aW9uKGFuY2VzdG9ycyxjaGlsZHJlbikge1xyXG4gICAgICB0aGlzLmZpbGxIaXQoYW5jZXN0b3JzKTtcclxuICAgICAgdGhpcy5maWxsSGl0KGNoaWxkcmVuKTtcclxuICAgICAgdGhpcy5maWxsSGl0KHRoaXMuc3RhdGUuY3VyKTtcclxuICB9LFxyXG4gIGhpdENsaWNrOmZ1bmN0aW9uKG4pIHtcclxuICAgIGlmICh0aGlzLnByb3BzLnNob3dFeGNlcnB0KSAgdGhpcy5wcm9wcy5zaG93RXhjZXJwdChuKTtcclxuICB9LFxyXG4gIG9uSGl0Q2xpY2s6ZnVuY3Rpb24oZSkge1xyXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIHRoaXMuaGl0Q2xpY2sodGhpcy5zdGF0ZS5jdXIpO1xyXG4gIH0sXHJcbiAgc2hvd0hpdDpmdW5jdGlvbihoaXQpIHtcclxuICAgIGlmIChoaXQpICByZXR1cm4gRShcImFcIiwge2hyZWY6IFwiI1wiLCBvbkNsaWNrOiB0aGlzLm9uSGl0Q2xpY2ssIGNsYXNzTmFtZTogXCJwdWxsLXJpZ2h0IGJhZGdlIGhpdGJhZGdlXCJ9LCB0cmltSGl0KGhpdCkpXHJcbiAgICBlbHNlIHJldHVybiBFKFwic3BhblwiLG51bGwpO1xyXG4gIH0sXHJcbiAgc2hvd1RleHQ6ZnVuY3Rpb24oZSkge1xyXG4gICAgdmFyIHRhcmdldD1lLnRhcmdldDtcclxuICAgIHZhciBuPWUudGFyZ2V0LmRhdGFzZXQubjtcclxuICAgIHdoaWxlICh0YXJnZXQgJiYgdHlwZW9mIHRhcmdldC5kYXRhc2V0Lm49PVwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgdGFyZ2V0PXRhcmdldC5wYXJlbnROb2RlO1xyXG4gICAgfVxyXG4gICAgaWYgKHRhcmdldCAmJiB0YXJnZXQuZGF0YXNldC5uICYmIHRoaXMucHJvcHMuc2hvd1RleHQpIHtcclxuICAgICAgdGhpcy5wcm9wcy5zaG93VGV4dChwYXJzZUludCh0YXJnZXQuZGF0YXNldC5uKSk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIGlmICghdGhpcy5wcm9wcy5kYXRhIHx8ICF0aGlzLnByb3BzLmRhdGEubGVuZ3RoKSByZXR1cm4gRShcImRpdlwiLG51bGwpO1xyXG4gICAgdmFyIGRlcHRoPXRoaXMucHJvcHMuZGF0YVt0aGlzLnN0YXRlLmN1cl0uZGVwdGgrMTtcclxuICAgIHZhciBhbmNlc3RvcnM9dGhpcy5lbnVtQW5jZXN0b3JzKCk7XHJcbiAgICB2YXIgY2hpbGRyZW49dGhpcy5lbnVtQ2hpbGRyZW4oKTtcclxuICAgIHZhciBvcHRzPXRoaXMucHJvcHMub3B0c3x8e307XHJcbiAgICB2YXIgY3VycmVudD10aGlzLnByb3BzLmRhdGFbdGhpcy5zdGF0ZS5jdXJdO1xyXG4gICAgaWYgKHRoaXMucHJvcHMuaGl0cyAmJiB0aGlzLnByb3BzLmhpdHMubGVuZ3RoKSB7XHJcbiAgICAgIHRoaXMuZmlsbEhpdHMoYW5jZXN0b3JzLGNoaWxkcmVuKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdGV4dD1jdXJyZW50LnRleHQudHJpbSgpO1xyXG4gICAgdGV4dD10cmltVGV4dCh0ZXh0LG9wdHMpO1xyXG4gICAgaWYgKHRoaXMucHJvcHMudGV4dENvbnZlcnRlcikgdGV4dD10aGlzLnByb3BzLnRleHRDb252ZXJ0ZXIodGV4dCk7XHJcbiAgICByZXR1cm4gKCBcclxuICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcInN0YWNrdG9jXCJ9LCBcclxuICAgICAgICBFKEFuY2VzdG9ycywge29wdHM6IG9wdHMsIHRleHRDb252ZXJ0ZXI6IHRoaXMucHJvcHMudGV4dENvbnZlcnRlciwgc2hvd0V4Y2VycHQ6IHRoaXMuaGl0Q2xpY2ssIHNldEN1cnJlbnQ6IHRoaXMuc2V0Q3VycmVudCwgdG9jOiB0aGlzLnByb3BzLmRhdGEsIGRhdGE6IGFuY2VzdG9yc30pLCBcclxuICAgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibm9kZSBjdXJyZW50XCJ9LCByZW5kZXJEZXB0aChkZXB0aC0xLG9wdHMsXCJjdXJyZW50XCIpLCBFKFwiYVwiLCB7aHJlZjogXCIjXCIsIG9uQ2xpY2s6IHRoaXMuc2hvd1RleHQsIFwiZGF0YS1uXCI6IHRoaXMuc3RhdGUuY3VyfSwgRShcInNwYW5cIiwge2NsYXNzTmFtZTogXCJ0ZXh0XCJ9LCB0ZXh0KSksIHRoaXMuc2hvd0hpdChjdXJyZW50LmhpdCkpLCBcclxuICAgICAgICBFKENoaWxkcmVuLCB7b3B0czogb3B0cywgdGV4dENvbnZlcnRlcjogdGhpcy5wcm9wcy50ZXh0Q29udmVydGVyLCBzaG93VGV4dE9uTGVhZk5vZGVPbmx5OiB0aGlzLnByb3BzLnNob3dUZXh0T25MZWFmTm9kZU9ubHksIFxyXG4gICAgICAgICAgICAgICAgICBzaG93VGV4dDogdGhpcy5wcm9wcy5zaG93VGV4dCwgaGl0Q2xpY2s6IHRoaXMuaGl0Q2xpY2ssIHNldEN1cnJlbnQ6IHRoaXMuc2V0Q3VycmVudCwgdG9jOiB0aGlzLnByb3BzLmRhdGEsIGRhdGE6IGNoaWxkcmVufSlcclxuICAgICAgKVxyXG4gICAgKTsgXHJcbiAgfVxyXG59KTtcclxubW9kdWxlLmV4cG9ydHM9c3RhY2t0b2M7IiwiLypcclxuICogU3dpcGUgMi4wXHJcbiAqXHJcbiAqIEJyYWQgQmlyZHNhbGxcclxuICogQ29weXJpZ2h0IDIwMTMsIE1JVCBMaWNlbnNlXHJcbiAqXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIFN3aXBlKGNvbnRhaW5lciwgb3B0aW9ucykge1xyXG5cclxuICBcInVzZSBzdHJpY3RcIjtcclxuXHJcbiAgLy8gdXRpbGl0aWVzXHJcbiAgdmFyIG5vb3AgPSBmdW5jdGlvbigpIHt9OyAvLyBzaW1wbGUgbm8gb3BlcmF0aW9uIGZ1bmN0aW9uXHJcbiAgdmFyIG9mZmxvYWRGbiA9IGZ1bmN0aW9uKGZuKSB7IHNldFRpbWVvdXQoZm4gfHwgbm9vcCwgMCkgfTsgLy8gb2ZmbG9hZCBhIGZ1bmN0aW9ucyBleGVjdXRpb25cclxuXHJcbiAgLy8gY2hlY2sgYnJvd3NlciBjYXBhYmlsaXRpZXNcclxuICB2YXIgYnJvd3NlciA9IHtcclxuICAgIGFkZEV2ZW50TGlzdGVuZXI6ICEhd2luZG93LmFkZEV2ZW50TGlzdGVuZXIsXHJcbiAgICB0b3VjaDogKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdykgfHwgd2luZG93LkRvY3VtZW50VG91Y2ggJiYgZG9jdW1lbnQgaW5zdGFuY2VvZiBEb2N1bWVudFRvdWNoLFxyXG4gICAgdHJhbnNpdGlvbnM6IChmdW5jdGlvbih0ZW1wKSB7XHJcbiAgICAgIHZhciBwcm9wcyA9IFsndHJhbnNpdGlvblByb3BlcnR5JywgJ1dlYmtpdFRyYW5zaXRpb24nLCAnTW96VHJhbnNpdGlvbicsICdPVHJhbnNpdGlvbicsICdtc1RyYW5zaXRpb24nXTtcclxuICAgICAgZm9yICggdmFyIGkgaW4gcHJvcHMgKSBpZiAodGVtcC5zdHlsZVsgcHJvcHNbaV0gXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSkoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3dpcGUnKSlcclxuICB9O1xyXG5cclxuICAvLyBxdWl0IGlmIG5vIHJvb3QgZWxlbWVudFxyXG4gIGlmICghY29udGFpbmVyKSByZXR1cm47XHJcbiAgdmFyIGVsZW1lbnQgPSBjb250YWluZXIuY2hpbGRyZW5bMF07XHJcbiAgdmFyIHNsaWRlcywgc2xpZGVQb3MsIHdpZHRoLCBsZW5ndGg7XHJcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgdmFyIGluZGV4ID0gcGFyc2VJbnQob3B0aW9ucy5zdGFydFNsaWRlLCAxMCkgfHwgMDtcclxuICB2YXIgc3BlZWQgPSBvcHRpb25zLnNwZWVkIHx8IDMwMDtcclxuICBvcHRpb25zLmNvbnRpbnVvdXMgPSBvcHRpb25zLmNvbnRpbnVvdXMgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuY29udGludW91cyA6IHRydWU7XHJcblxyXG4gIHZhciB0YXJnZXQ9bnVsbDsgLy95YXAgdG8ga2VlcCB0aGUgZG9tbm9kZSBmaXJlcyB0aGUgc3dpcGVcclxuICBmdW5jdGlvbiBzZXR1cCgpIHtcclxuXHJcbiAgICAvLyBjYWNoZSBzbGlkZXNcclxuICAgIHNsaWRlcyA9IGVsZW1lbnQuY2hpbGRyZW47XHJcbiAgICBsZW5ndGggPSBzbGlkZXMubGVuZ3RoO1xyXG5cclxuICAgIC8vIHNldCBjb250aW51b3VzIHRvIGZhbHNlIGlmIG9ubHkgb25lIHNsaWRlXHJcbiAgICBpZiAoc2xpZGVzLmxlbmd0aCA8IDIpIG9wdGlvbnMuY29udGludW91cyA9IGZhbHNlO1xyXG5cclxuICAgIC8vc3BlY2lhbCBjYXNlIGlmIHR3byBzbGlkZXNcclxuICAgIGlmIChicm93c2VyLnRyYW5zaXRpb25zICYmIG9wdGlvbnMuY29udGludW91cyAmJiBzbGlkZXMubGVuZ3RoIDwgMykge1xyXG4gICAgICBlbGVtZW50LmFwcGVuZENoaWxkKHNsaWRlc1swXS5jbG9uZU5vZGUodHJ1ZSkpO1xyXG4gICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGVsZW1lbnQuY2hpbGRyZW5bMV0uY2xvbmVOb2RlKHRydWUpKTtcclxuICAgICAgc2xpZGVzID0gZWxlbWVudC5jaGlsZHJlbjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBjcmVhdGUgYW4gYXJyYXkgdG8gc3RvcmUgY3VycmVudCBwb3NpdGlvbnMgb2YgZWFjaCBzbGlkZVxyXG4gICAgc2xpZGVQb3MgPSBuZXcgQXJyYXkoc2xpZGVzLmxlbmd0aCk7XHJcblxyXG4gICAgLy8gZGV0ZXJtaW5lIHdpZHRoIG9mIGVhY2ggc2xpZGVcclxuICAgIHdpZHRoID0gY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoIHx8IGNvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuXHJcbiAgICBlbGVtZW50LnN0eWxlLndpZHRoID0gKHNsaWRlcy5sZW5ndGggKiB3aWR0aCkgKyAncHgnO1xyXG5cclxuICAgIC8vIHN0YWNrIGVsZW1lbnRzXHJcbiAgICB2YXIgcG9zID0gc2xpZGVzLmxlbmd0aDtcclxuICAgIHdoaWxlKHBvcy0tKSB7XHJcblxyXG4gICAgICB2YXIgc2xpZGUgPSBzbGlkZXNbcG9zXTtcclxuXHJcbiAgICAgIHNsaWRlLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xyXG4gICAgICBzbGlkZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtaW5kZXgnLCBwb3MpO1xyXG5cclxuICAgICAgaWYgKGJyb3dzZXIudHJhbnNpdGlvbnMpIHtcclxuICAgICAgICBzbGlkZS5zdHlsZS5sZWZ0ID0gKHBvcyAqIC13aWR0aCkgKyAncHgnO1xyXG4gICAgICAgIG1vdmUocG9zLCBpbmRleCA+IHBvcyA/IC13aWR0aCA6IChpbmRleCA8IHBvcyA/IHdpZHRoIDogMCksIDApO1xyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8vIHJlcG9zaXRpb24gZWxlbWVudHMgYmVmb3JlIGFuZCBhZnRlciBpbmRleFxyXG4gICAgaWYgKG9wdGlvbnMuY29udGludW91cyAmJiBicm93c2VyLnRyYW5zaXRpb25zKSB7XHJcbiAgICAgIG1vdmUoY2lyY2xlKGluZGV4LTEpLCAtd2lkdGgsIDApO1xyXG4gICAgICBtb3ZlKGNpcmNsZShpbmRleCsxKSwgd2lkdGgsIDApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghYnJvd3Nlci50cmFuc2l0aW9ucykgZWxlbWVudC5zdHlsZS5sZWZ0ID0gKGluZGV4ICogLXdpZHRoKSArICdweCc7XHJcblxyXG4gICAgY29udGFpbmVyLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XHJcblxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gcHJldigpIHtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5jb250aW51b3VzKSBzbGlkZShpbmRleC0xKTtcclxuICAgIGVsc2UgaWYgKGluZGV4KSBzbGlkZShpbmRleC0xKTtcclxuXHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBuZXh0KCkge1xyXG5cclxuICAgIGlmIChvcHRpb25zLmNvbnRpbnVvdXMpIHNsaWRlKGluZGV4KzEpO1xyXG4gICAgZWxzZSBpZiAoaW5kZXggPCBzbGlkZXMubGVuZ3RoIC0gMSkgc2xpZGUoaW5kZXgrMSk7XHJcblxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY2lyY2xlKGluZGV4KSB7XHJcblxyXG4gICAgLy8gYSBzaW1wbGUgcG9zaXRpdmUgbW9kdWxvIHVzaW5nIHNsaWRlcy5sZW5ndGhcclxuICAgIHJldHVybiAoc2xpZGVzLmxlbmd0aCArIChpbmRleCAlIHNsaWRlcy5sZW5ndGgpKSAlIHNsaWRlcy5sZW5ndGg7XHJcblxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gc2xpZGUodG8sIHNsaWRlU3BlZWQpIHtcclxuXHJcbiAgICAvLyBkbyBub3RoaW5nIGlmIGFscmVhZHkgb24gcmVxdWVzdGVkIHNsaWRlXHJcbiAgICBpZiAoaW5kZXggPT0gdG8pIHJldHVybjtcclxuXHJcbiAgICBpZiAoYnJvd3Nlci50cmFuc2l0aW9ucykge1xyXG5cclxuICAgICAgdmFyIGRpcmVjdGlvbiA9IE1hdGguYWJzKGluZGV4LXRvKSAvIChpbmRleC10byk7IC8vIDE6IGJhY2t3YXJkLCAtMTogZm9yd2FyZFxyXG5cclxuICAgICAgLy8gZ2V0IHRoZSBhY3R1YWwgcG9zaXRpb24gb2YgdGhlIHNsaWRlXHJcbiAgICAgIGlmIChvcHRpb25zLmNvbnRpbnVvdXMpIHtcclxuICAgICAgICB2YXIgbmF0dXJhbF9kaXJlY3Rpb24gPSBkaXJlY3Rpb247XHJcbiAgICAgICAgZGlyZWN0aW9uID0gLXNsaWRlUG9zW2NpcmNsZSh0byldIC8gd2lkdGg7XHJcblxyXG4gICAgICAgIC8vIGlmIGdvaW5nIGZvcndhcmQgYnV0IHRvIDwgaW5kZXgsIHVzZSB0byA9IHNsaWRlcy5sZW5ndGggKyB0b1xyXG4gICAgICAgIC8vIGlmIGdvaW5nIGJhY2t3YXJkIGJ1dCB0byA+IGluZGV4LCB1c2UgdG8gPSAtc2xpZGVzLmxlbmd0aCArIHRvXHJcbiAgICAgICAgaWYgKGRpcmVjdGlvbiAhPT0gbmF0dXJhbF9kaXJlY3Rpb24pIHRvID0gIC1kaXJlY3Rpb24gKiBzbGlkZXMubGVuZ3RoICsgdG87XHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgZGlmZiA9IE1hdGguYWJzKGluZGV4LXRvKSAtIDE7XHJcblxyXG4gICAgICAvLyBtb3ZlIGFsbCB0aGUgc2xpZGVzIGJldHdlZW4gaW5kZXggYW5kIHRvIGluIHRoZSByaWdodCBkaXJlY3Rpb25cclxuICAgICAgd2hpbGUgKGRpZmYtLSkgbW92ZSggY2lyY2xlKCh0byA+IGluZGV4ID8gdG8gOiBpbmRleCkgLSBkaWZmIC0gMSksIHdpZHRoICogZGlyZWN0aW9uLCAwKTtcclxuXHJcbiAgICAgIHRvID0gY2lyY2xlKHRvKTtcclxuXHJcbiAgICAgIG1vdmUoaW5kZXgsIHdpZHRoICogZGlyZWN0aW9uLCBzbGlkZVNwZWVkIHx8IHNwZWVkKTtcclxuICAgICAgbW92ZSh0bywgMCwgc2xpZGVTcGVlZCB8fCBzcGVlZCk7XHJcblxyXG4gICAgICBpZiAob3B0aW9ucy5jb250aW51b3VzKSBtb3ZlKGNpcmNsZSh0byAtIGRpcmVjdGlvbiksIC0od2lkdGggKiBkaXJlY3Rpb24pLCAwKTsgLy8gd2UgbmVlZCB0byBnZXQgdGhlIG5leHQgaW4gcGxhY2VcclxuXHJcbiAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgdG8gPSBjaXJjbGUodG8pO1xyXG4gICAgICBhbmltYXRlKGluZGV4ICogLXdpZHRoLCB0byAqIC13aWR0aCwgc2xpZGVTcGVlZCB8fCBzcGVlZCk7XHJcbiAgICAgIC8vbm8gZmFsbGJhY2sgZm9yIGEgY2lyY3VsYXIgY29udGludW91cyBpZiB0aGUgYnJvd3NlciBkb2VzIG5vdCBhY2NlcHQgdHJhbnNpdGlvbnNcclxuICAgIH1cclxuXHJcbiAgICBpbmRleCA9IHRvO1xyXG4gICAgb2ZmbG9hZEZuKG9wdGlvbnMuY2FsbGJhY2sgJiYgb3B0aW9ucy5jYWxsYmFjayhpbmRleCwgc2xpZGVzW2luZGV4XSwgdGFyZ2V0KSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBtb3ZlKGluZGV4LCBkaXN0LCBzcGVlZCkge1xyXG5cclxuICAgIHRyYW5zbGF0ZShpbmRleCwgZGlzdCwgc3BlZWQpO1xyXG4gICAgc2xpZGVQb3NbaW5kZXhdID0gZGlzdDtcclxuXHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB0cmFuc2xhdGUoaW5kZXgsIGRpc3QsIHNwZWVkKSB7XHJcblxyXG4gICAgdmFyIHNsaWRlID0gc2xpZGVzW2luZGV4XTtcclxuICAgIHZhciBzdHlsZSA9IHNsaWRlICYmIHNsaWRlLnN0eWxlO1xyXG5cclxuICAgIGlmICghc3R5bGUpIHJldHVybjtcclxuXHJcbiAgICBzdHlsZS53ZWJraXRUcmFuc2l0aW9uRHVyYXRpb24gPVxyXG4gICAgc3R5bGUuTW96VHJhbnNpdGlvbkR1cmF0aW9uID1cclxuICAgIHN0eWxlLm1zVHJhbnNpdGlvbkR1cmF0aW9uID1cclxuICAgIHN0eWxlLk9UcmFuc2l0aW9uRHVyYXRpb24gPVxyXG4gICAgc3R5bGUudHJhbnNpdGlvbkR1cmF0aW9uID0gc3BlZWQgKyAnbXMnO1xyXG5cclxuICAgIHN0eWxlLndlYmtpdFRyYW5zZm9ybSA9ICd0cmFuc2xhdGUoJyArIGRpc3QgKyAncHgsMCknICsgJ3RyYW5zbGF0ZVooMCknO1xyXG4gICAgc3R5bGUubXNUcmFuc2Zvcm0gPVxyXG4gICAgc3R5bGUuTW96VHJhbnNmb3JtID1cclxuICAgIHN0eWxlLk9UcmFuc2Zvcm0gPSAndHJhbnNsYXRlWCgnICsgZGlzdCArICdweCknO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gYW5pbWF0ZShmcm9tLCB0bywgc3BlZWQpIHtcclxuICAgIC8vIGlmIG5vdCBhbiBhbmltYXRpb24sIGp1c3QgcmVwb3NpdGlvblxyXG4gICAgaWYgKCFzcGVlZCkge1xyXG4gICAgICBlbGVtZW50LnN0eWxlLmxlZnQgPSB0byArICdweCc7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBzdGFydCA9ICtuZXcgRGF0ZTtcclxuICAgIHZhciB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgdGltZUVsYXAgPSArbmV3IERhdGUgLSBzdGFydDtcclxuICAgICAgaWYgKHRpbWVFbGFwID4gc3BlZWQpIHtcclxuICAgICAgICBlbGVtZW50LnN0eWxlLmxlZnQgPSB0byArICdweCc7XHJcbiAgICAgICAgaWYgKGRlbGF5KSBiZWdpbigpO1xyXG4gICAgICAgIG9wdGlvbnMudHJhbnNpdGlvbkVuZCAmJiBvcHRpb25zLnRyYW5zaXRpb25FbmQuY2FsbChldmVudCwgaW5kZXgsIHNsaWRlc1tpbmRleF0sIHRhcmdldCk7XHJcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGVsZW1lbnQuc3R5bGUubGVmdCA9ICgoICh0byAtIGZyb20pICogKE1hdGguZmxvb3IoKHRpbWVFbGFwIC8gc3BlZWQpICogMTAwKSAvIDEwMCkgKSArIGZyb20pICsgJ3B4JztcclxuICAgIH0sIDQpO1xyXG4gIH1cclxuXHJcbiAgLy8gc2V0dXAgYXV0byBzbGlkZXNob3dcclxuICB2YXIgZGVsYXkgPSBvcHRpb25zLmF1dG8gfHwgMDtcclxuICB2YXIgaW50ZXJ2YWw7XHJcblxyXG4gIGZ1bmN0aW9uIGJlZ2luKCkge1xyXG4gICAgaW50ZXJ2YWwgPSBzZXRUaW1lb3V0KG5leHQsIGRlbGF5KTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHN0b3AoKSB7XHJcbiAgICBkZWxheSA9IDA7XHJcbiAgICBjbGVhclRpbWVvdXQoaW50ZXJ2YWwpO1xyXG4gIH1cclxuXHJcbiAgLy8gc2V0dXAgaW5pdGlhbCB2YXJzXHJcbiAgdmFyIHN0YXJ0ID0ge307XHJcbiAgdmFyIGRlbHRhID0ge307XHJcbiAgdmFyIGlzU2Nyb2xsaW5nO1xyXG5cclxuICAvLyBzZXR1cCBldmVudCBjYXB0dXJpbmdcclxuICB2YXIgZXZlbnRzID0ge1xyXG4gICAgaGFuZGxlRXZlbnQ6IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgIHN3aXRjaCAoZXZlbnQudHlwZSkge1xyXG4gICAgICAgIGNhc2UgJ3RvdWNoc3RhcnQnOiB0aGlzLnN0YXJ0KGV2ZW50KTsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAndG91Y2htb3ZlJzogdGhpcy5tb3ZlKGV2ZW50KTsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAndG91Y2hlbmQnOiBvZmZsb2FkRm4odGhpcy5lbmQoZXZlbnQpKTsgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnd2Via2l0VHJhbnNpdGlvbkVuZCc6XHJcbiAgICAgICAgY2FzZSAnbXNUcmFuc2l0aW9uRW5kJzpcclxuICAgICAgICBjYXNlICdvVHJhbnNpdGlvbkVuZCc6XHJcbiAgICAgICAgY2FzZSAnb3RyYW5zaXRpb25lbmQnOlxyXG4gICAgICAgIGNhc2UgJ3RyYW5zaXRpb25lbmQnOiBvZmZsb2FkRm4odGhpcy50cmFuc2l0aW9uRW5kKGV2ZW50KSk7IGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ3Jlc2l6ZSc6IG9mZmxvYWRGbihzZXR1cCk7IGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChvcHRpb25zLnN0b3BQcm9wYWdhdGlvbikgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICB9LFxyXG4gICAgc3RhcnQ6IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgIHRhcmdldD1ldmVudC50YXJnZXQ7Ly95YXAgc2F2ZSB0aGUgZXZlbnQgdGFyZ2V0XHJcbiAgICAgIHZhciB0b3VjaGVzID0gZXZlbnQudG91Y2hlc1swXTtcclxuICAgICAgLy8gbWVhc3VyZSBzdGFydCB2YWx1ZXNcclxuICAgICAgc3RhcnQgPSB7XHJcbiAgICAgICAgLy8gZ2V0IGluaXRpYWwgdG91Y2ggY29vcmRzXHJcbiAgICAgICAgeDogdG91Y2hlcy5wYWdlWCxcclxuICAgICAgICB5OiB0b3VjaGVzLnBhZ2VZLFxyXG4gICAgICAgIC8vIHN0b3JlIHRpbWUgdG8gZGV0ZXJtaW5lIHRvdWNoIGR1cmF0aW9uXHJcbiAgICAgICAgdGltZTogK25ldyBEYXRlXHJcbiAgICAgIH07XHJcbiAgICAgIC8vIHVzZWQgZm9yIHRlc3RpbmcgZmlyc3QgbW92ZSBldmVudFxyXG4gICAgICBpc1Njcm9sbGluZyA9IHVuZGVmaW5lZDtcclxuICAgICAgLy8gcmVzZXQgZGVsdGEgYW5kIGVuZCBtZWFzdXJlbWVudHNcclxuICAgICAgZGVsdGEgPSB7fTtcclxuICAgICAgLy8gYXR0YWNoIHRvdWNobW92ZSBhbmQgdG91Y2hlbmQgbGlzdGVuZXJzXHJcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcywgZmFsc2UpO1xyXG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcywgZmFsc2UpO1xyXG4gICAgICBpZiAob3B0aW9ucy5zd2lwZVN0YXJ0KSBvcHRpb25zLnN3aXBlU3RhcnQodGFyZ2V0KTtcclxuXHJcbiAgICB9LFxyXG4gICAgbW92ZTogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgLy8gZW5zdXJlIHN3aXBpbmcgd2l0aCBvbmUgdG91Y2ggYW5kIG5vdCBwaW5jaGluZ1xyXG4gICAgICBpZiAoIGV2ZW50LnRvdWNoZXMubGVuZ3RoID4gMSB8fCBldmVudC5zY2FsZSAmJiBldmVudC5zY2FsZSAhPT0gMSkgcmV0dXJuO1xyXG4gICAgICBpZiAob3B0aW9ucy5kaXNhYmxlU2Nyb2xsKSBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgdmFyIHRvdWNoZXMgPSBldmVudC50b3VjaGVzWzBdO1xyXG4gICAgICAvLyBtZWFzdXJlIGNoYW5nZSBpbiB4IGFuZCB5XHJcbiAgICAgIGRlbHRhID0ge1xyXG4gICAgICAgIHg6IHRvdWNoZXMucGFnZVggLSBzdGFydC54LFxyXG4gICAgICAgIHk6IHRvdWNoZXMucGFnZVkgLSBzdGFydC55XHJcbiAgICAgIH1cclxuICAgICAgLy8gZGV0ZXJtaW5lIGlmIHNjcm9sbGluZyB0ZXN0IGhhcyBydW4gLSBvbmUgdGltZSB0ZXN0XHJcbiAgICAgIGlmICggdHlwZW9mIGlzU2Nyb2xsaW5nID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgaXNTY3JvbGxpbmcgPSAhISggaXNTY3JvbGxpbmcgfHwgTWF0aC5hYnMoZGVsdGEueCkgPCBNYXRoLmFicyhkZWx0YS55KSApO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIGlmIHVzZXIgaXMgbm90IHRyeWluZyB0byBzY3JvbGwgdmVydGljYWxseVxyXG4gICAgICBpZiAoIWlzU2Nyb2xsaW5nKSB7XHJcbiAgICAgICAgLy8gcHJldmVudCBuYXRpdmUgc2Nyb2xsaW5nXHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAvLyBzdG9wIHNsaWRlc2hvd1xyXG4gICAgICAgIHN0b3AoKTtcclxuICAgICAgICAvLyBpbmNyZWFzZSByZXNpc3RhbmNlIGlmIGZpcnN0IG9yIGxhc3Qgc2xpZGVcclxuICAgICAgICBpZiAob3B0aW9ucy5jb250aW51b3VzKSB7IC8vIHdlIGRvbid0IGFkZCByZXNpc3RhbmNlIGF0IHRoZSBlbmRcclxuICAgICAgICAgIHRyYW5zbGF0ZShjaXJjbGUoaW5kZXgtMSksIGRlbHRhLnggKyBzbGlkZVBvc1tjaXJjbGUoaW5kZXgtMSldLCAwKTtcclxuICAgICAgICAgIHRyYW5zbGF0ZShpbmRleCwgZGVsdGEueCArIHNsaWRlUG9zW2luZGV4XSwgMCk7XHJcbiAgICAgICAgICB0cmFuc2xhdGUoY2lyY2xlKGluZGV4KzEpLCBkZWx0YS54ICsgc2xpZGVQb3NbY2lyY2xlKGluZGV4KzEpXSwgMCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGRlbHRhLnggPVxyXG4gICAgICAgICAgICBkZWx0YS54IC9cclxuICAgICAgICAgICAgICAoICghaW5kZXggJiYgZGVsdGEueCA+IDAgICAgICAgICAgICAgICAvLyBpZiBmaXJzdCBzbGlkZSBhbmQgc2xpZGluZyBsZWZ0XHJcbiAgICAgICAgICAgICAgICB8fCBpbmRleCA9PSBzbGlkZXMubGVuZ3RoIC0gMSAgICAgICAgLy8gb3IgaWYgbGFzdCBzbGlkZSBhbmQgc2xpZGluZyByaWdodFxyXG4gICAgICAgICAgICAgICAgJiYgZGVsdGEueCA8IDAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFuZCBpZiBzbGlkaW5nIGF0IGFsbFxyXG4gICAgICAgICAgICAgICkgP1xyXG4gICAgICAgICAgICAgICggTWF0aC5hYnMoZGVsdGEueCkgLyB3aWR0aCArIDEgKSAgICAgIC8vIGRldGVybWluZSByZXNpc3RhbmNlIGxldmVsXHJcbiAgICAgICAgICAgICAgOiAxICk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm8gcmVzaXN0YW5jZSBpZiBmYWxzZVxyXG5cclxuICAgICAgICAgIC8vIHRyYW5zbGF0ZSAxOjFcclxuICAgICAgICAgIHRyYW5zbGF0ZShpbmRleC0xLCBkZWx0YS54ICsgc2xpZGVQb3NbaW5kZXgtMV0sIDApO1xyXG4gICAgICAgICAgdHJhbnNsYXRlKGluZGV4LCBkZWx0YS54ICsgc2xpZGVQb3NbaW5kZXhdLCAwKTtcclxuICAgICAgICAgIHRyYW5zbGF0ZShpbmRleCsxLCBkZWx0YS54ICsgc2xpZGVQb3NbaW5kZXgrMV0sIDApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAob3B0aW9ucy5zd2lwZUVuZCkgb3B0aW9ucy5zd2lwZUVuZCh0YXJnZXQpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgZW5kOiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAvLyBtZWFzdXJlIGR1cmF0aW9uXHJcbiAgICAgIHZhciBkdXJhdGlvbiA9ICtuZXcgRGF0ZSAtIHN0YXJ0LnRpbWU7XHJcbiAgICAgIC8vIGRldGVybWluZSBpZiBzbGlkZSBhdHRlbXB0IHRyaWdnZXJzIG5leHQvcHJldiBzbGlkZVxyXG4gICAgICB2YXIgaXNWYWxpZFNsaWRlID1cclxuICAgICAgICAgICAgTnVtYmVyKGR1cmF0aW9uKSA8IDI1MCAgICAgICAgICAgICAgIC8vIGlmIHNsaWRlIGR1cmF0aW9uIGlzIGxlc3MgdGhhbiAyNTBtc1xyXG4gICAgICAgICAgICAmJiBNYXRoLmFicyhkZWx0YS54KSA+IDIwICAgICAgICAgICAgLy8gYW5kIGlmIHNsaWRlIGFtdCBpcyBncmVhdGVyIHRoYW4gMjBweFxyXG4gICAgICAgICAgICB8fCBNYXRoLmFicyhkZWx0YS54KSA+IHdpZHRoLzI7ICAgICAgLy8gb3IgaWYgc2xpZGUgYW10IGlzIGdyZWF0ZXIgdGhhbiBoYWxmIHRoZSB3aWR0aFxyXG5cclxuICAgICAgLy8gZGV0ZXJtaW5lIGlmIHNsaWRlIGF0dGVtcHQgaXMgcGFzdCBzdGFydCBhbmQgZW5kXHJcbiAgICAgIHZhciBpc1Bhc3RCb3VuZHMgPVxyXG4gICAgICAgICAgICAhaW5kZXggJiYgZGVsdGEueCA+IDAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgZmlyc3Qgc2xpZGUgYW5kIHNsaWRlIGFtdCBpcyBncmVhdGVyIHRoYW4gMFxyXG4gICAgICAgICAgICB8fCBpbmRleCA9PSBzbGlkZXMubGVuZ3RoIC0gMSAmJiBkZWx0YS54IDwgMDsgICAgLy8gb3IgaWYgbGFzdCBzbGlkZSBhbmQgc2xpZGUgYW10IGlzIGxlc3MgdGhhbiAwXHJcblxyXG4gICAgICBpZiAob3B0aW9ucy5jb250aW51b3VzKSBpc1Bhc3RCb3VuZHMgPSBmYWxzZTtcclxuICAgICAgLy8gZGV0ZXJtaW5lIGRpcmVjdGlvbiBvZiBzd2lwZSAodHJ1ZTpyaWdodCwgZmFsc2U6bGVmdClcclxuICAgICAgdmFyIGRpcmVjdGlvbiA9IGRlbHRhLnggPCAwO1xyXG4gICAgICAvLyBpZiBub3Qgc2Nyb2xsaW5nIHZlcnRpY2FsbHlcclxuICAgICAgaWYgKCFpc1Njcm9sbGluZykge1xyXG4gICAgICAgIGlmIChpc1ZhbGlkU2xpZGUgJiYgIWlzUGFzdEJvdW5kcykge1xyXG4gICAgICAgICAgaWYgKGRpcmVjdGlvbikge1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jb250aW51b3VzKSB7IC8vIHdlIG5lZWQgdG8gZ2V0IHRoZSBuZXh0IGluIHRoaXMgZGlyZWN0aW9uIGluIHBsYWNlXHJcbiAgICAgICAgICAgICAgbW92ZShjaXJjbGUoaW5kZXgtMSksIC13aWR0aCwgMCk7XHJcbiAgICAgICAgICAgICAgbW92ZShjaXJjbGUoaW5kZXgrMiksIHdpZHRoLCAwKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBtb3ZlKGluZGV4LTEsIC13aWR0aCwgMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbW92ZShpbmRleCwgc2xpZGVQb3NbaW5kZXhdLXdpZHRoLCBzcGVlZCk7XHJcbiAgICAgICAgICAgIG1vdmUoY2lyY2xlKGluZGV4KzEpLCBzbGlkZVBvc1tjaXJjbGUoaW5kZXgrMSldLXdpZHRoLCBzcGVlZCk7XHJcbiAgICAgICAgICAgIGluZGV4ID0gY2lyY2xlKGluZGV4KzEpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY29udGludW91cykgeyAvLyB3ZSBuZWVkIHRvIGdldCB0aGUgbmV4dCBpbiB0aGlzIGRpcmVjdGlvbiBpbiBwbGFjZVxyXG4gICAgICAgICAgICAgIG1vdmUoY2lyY2xlKGluZGV4KzEpLCB3aWR0aCwgMCk7XHJcbiAgICAgICAgICAgICAgbW92ZShjaXJjbGUoaW5kZXgtMiksIC13aWR0aCwgMCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgbW92ZShpbmRleCsxLCB3aWR0aCwgMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbW92ZShpbmRleCwgc2xpZGVQb3NbaW5kZXhdK3dpZHRoLCBzcGVlZCk7XHJcbiAgICAgICAgICAgIG1vdmUoY2lyY2xlKGluZGV4LTEpLCBzbGlkZVBvc1tjaXJjbGUoaW5kZXgtMSldK3dpZHRoLCBzcGVlZCk7XHJcbiAgICAgICAgICAgIGluZGV4ID0gY2lyY2xlKGluZGV4LTEpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgb3B0aW9ucy5jYWxsYmFjayAmJiBvcHRpb25zLmNhbGxiYWNrKGluZGV4LCBzbGlkZXNbaW5kZXhdLCB0YXJnZXQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAob3B0aW9ucy5jb250aW51b3VzKSB7XHJcbiAgICAgICAgICAgIG1vdmUoY2lyY2xlKGluZGV4LTEpLCAtd2lkdGgsIHNwZWVkKTtcclxuICAgICAgICAgICAgbW92ZShpbmRleCwgMCwgc3BlZWQpO1xyXG4gICAgICAgICAgICBtb3ZlKGNpcmNsZShpbmRleCsxKSwgd2lkdGgsIHNwZWVkKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIG1vdmUoaW5kZXgtMSwgLXdpZHRoLCBzcGVlZCk7XHJcbiAgICAgICAgICAgIG1vdmUoaW5kZXgsIDAsIHNwZWVkKTtcclxuICAgICAgICAgICAgbW92ZShpbmRleCsxLCB3aWR0aCwgc3BlZWQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBpZiAob3B0aW9ucy5zd2lwZUVuZCkgb3B0aW9ucy5zd2lwZUVuZCh0YXJnZXQpO1xyXG4gICAgICAvLyBraWxsIHRvdWNobW92ZSBhbmQgdG91Y2hlbmQgZXZlbnQgbGlzdGVuZXJzIHVudGlsIHRvdWNoc3RhcnQgY2FsbGVkIGFnYWluXHJcbiAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgZXZlbnRzLCBmYWxzZSlcclxuICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIGV2ZW50cywgZmFsc2UpXHJcbiAgICB9LFxyXG4gICAgdHJhbnNpdGlvbkVuZDogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgaWYgKHBhcnNlSW50KGV2ZW50LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtaW5kZXgnKSwgMTApID09IGluZGV4KSB7XHJcbiAgICAgICAgaWYgKGRlbGF5KSBiZWdpbigpO1xyXG4gICAgICAgIG9wdGlvbnMudHJhbnNpdGlvbkVuZCAmJiBvcHRpb25zLnRyYW5zaXRpb25FbmQuY2FsbChldmVudCwgaW5kZXgsIHNsaWRlc1tpbmRleF0sdGFyZ2V0KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICAvLyB0cmlnZ2VyIHNldHVwXHJcbiAgc2V0dXAoKTtcclxuICAvLyBzdGFydCBhdXRvIHNsaWRlc2hvdyBpZiBhcHBsaWNhYmxlXHJcbiAgaWYgKGRlbGF5KSBiZWdpbigpO1xyXG4gIC8vIGFkZCBldmVudCBsaXN0ZW5lcnNcclxuICBpZiAoYnJvd3Nlci5hZGRFdmVudExpc3RlbmVyKSB7XHJcbiAgICAvLyBzZXQgdG91Y2hzdGFydCBldmVudCBvbiBlbGVtZW50XHJcbiAgICBpZiAoYnJvd3Nlci50b3VjaCkgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgZXZlbnRzLCBmYWxzZSk7XHJcblxyXG4gICAgaWYgKGJyb3dzZXIudHJhbnNpdGlvbnMpIHtcclxuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRUcmFuc2l0aW9uRW5kJywgZXZlbnRzLCBmYWxzZSk7XHJcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbXNUcmFuc2l0aW9uRW5kJywgZXZlbnRzLCBmYWxzZSk7XHJcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignb1RyYW5zaXRpb25FbmQnLCBldmVudHMsIGZhbHNlKTtcclxuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdvdHJhbnNpdGlvbmVuZCcsIGV2ZW50cywgZmFsc2UpO1xyXG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBldmVudHMsIGZhbHNlKTtcclxuICAgIH1cclxuICAgIC8vIHNldCByZXNpemUgZXZlbnQgb24gd2luZG93XHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgZXZlbnRzLCBmYWxzZSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHdpbmRvdy5vbnJlc2l6ZSA9IGZ1bmN0aW9uICgpIHsgc2V0dXAoKSB9OyAvLyB0byBwbGF5IG5pY2Ugd2l0aCBvbGQgSUVcclxuICB9XHJcbiAgLy8gZXhwb3NlIHRoZSBTd2lwZSBBUElcclxuICByZXR1cm4ge1xyXG4gICAgc2V0dXA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBzZXR1cCgpO1xyXG4gICAgfSxcclxuICAgIHNsaWRlOiBmdW5jdGlvbih0bywgc3BlZWQpIHtcclxuICAgICAgLy8gY2FuY2VsIHNsaWRlc2hvd1xyXG4gICAgICBzdG9wKCk7XHJcbiAgICAgIHNsaWRlKHRvLCBzcGVlZCk7XHJcbiAgICB9LFxyXG4gICAgcHJldjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8vIGNhbmNlbCBzbGlkZXNob3dcclxuICAgICAgc3RvcCgpO1xyXG4gICAgICBwcmV2KCk7XHJcbiAgICB9LFxyXG4gICAgbmV4dDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8vIGNhbmNlbCBzbGlkZXNob3dcclxuICAgICAgc3RvcCgpO1xyXG4gICAgICBuZXh0KCk7XHJcbiAgICB9LFxyXG4gICAgc3RvcDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8vIGNhbmNlbCBzbGlkZXNob3dcclxuICAgICAgc3RvcCgpO1xyXG4gICAgfSxcclxuICAgIGdldFBvczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8vIHJldHVybiBjdXJyZW50IGluZGV4IHBvc2l0aW9uXHJcbiAgICAgIHJldHVybiBpbmRleDtcclxuICAgIH0sXHJcbiAgICBnZXROdW1TbGlkZXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvLyByZXR1cm4gdG90YWwgbnVtYmVyIG9mIHNsaWRlc1xyXG4gICAgICByZXR1cm4gbGVuZ3RoO1xyXG4gICAgfSxcclxuICAgIGtpbGw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvLyBjYW5jZWwgc2xpZGVzaG93XHJcbiAgICAgIHN0b3AoKTtcclxuICAgICAgLy8gcmVzZXQgZWxlbWVudFxyXG4gICAgICBlbGVtZW50LnN0eWxlLndpZHRoID0gJyc7XHJcbiAgICAgIGVsZW1lbnQuc3R5bGUubGVmdCA9ICcnO1xyXG4gICAgICAvLyByZXNldCBzbGlkZXNcclxuICAgICAgdmFyIHBvcyA9IHNsaWRlcy5sZW5ndGg7XHJcbiAgICAgIHdoaWxlKHBvcy0tKSB7XHJcbiAgICAgICAgdmFyIHNsaWRlID0gc2xpZGVzW3Bvc107XHJcbiAgICAgICAgc2xpZGUuc3R5bGUud2lkdGggPSAnJztcclxuICAgICAgICBzbGlkZS5zdHlsZS5sZWZ0ID0gJyc7XHJcbiAgICAgICAgaWYgKGJyb3dzZXIudHJhbnNpdGlvbnMpIHRyYW5zbGF0ZShwb3MsIDAsIDApO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIHJlbW92ZWQgZXZlbnQgbGlzdGVuZXJzXHJcbiAgICAgIGlmIChicm93c2VyLmFkZEV2ZW50TGlzdGVuZXIpIHtcclxuICAgICAgICAvLyByZW1vdmUgY3VycmVudCBldmVudCBsaXN0ZW5lcnNcclxuICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBldmVudHMsIGZhbHNlKTtcclxuICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3dlYmtpdFRyYW5zaXRpb25FbmQnLCBldmVudHMsIGZhbHNlKTtcclxuICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21zVHJhbnNpdGlvbkVuZCcsIGV2ZW50cywgZmFsc2UpO1xyXG4gICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignb1RyYW5zaXRpb25FbmQnLCBldmVudHMsIGZhbHNlKTtcclxuICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ290cmFuc2l0aW9uZW5kJywgZXZlbnRzLCBmYWxzZSk7XHJcbiAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgZXZlbnRzLCBmYWxzZSk7XHJcbiAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGV2ZW50cywgZmFsc2UpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHdpbmRvdy5vbnJlc2l6ZSA9IG51bGw7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcbiAgfVxyXG59IiwiLy90YWtlbiBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9qZWQvcmVhY3Qtc3dpcGVcclxudmFyIFN3aXBlPXJlcXVpcmUoXCIuL3N3aXBlXCIpO1xyXG52YXIgc3R5bGVzID0ge1xyXG4gIGNvbnRhaW5lcjoge1xyXG4gICAgb3ZlcmZsb3c6IFwiaGlkZGVuXCIsXHJcbiAgICB2aXNpYmlsaXR5OiBcImhpZGRlblwiLFxyXG4gICAgcG9zaXRpb246IFwicmVsYXRpdmVcIlxyXG4gIH0sXHJcbiAgd3JhcHBlcjoge1xyXG4gICAgb3ZlcmZsb3c6IFwiaGlkZGVuXCIsXHJcbiAgICBwb3NpdGlvbjogXCJyZWxhdGl2ZVwiXHJcbiAgfSxcclxuICBjaGlsZDoge1xyXG4gICAgZmxvYXQ6IFwibGVmdFwiLFxyXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxyXG4gICAgcG9zaXRpb246IFwicmVsYXRpdmVcIlxyXG4gIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcbiAgZGlzcGxheU5hbWU6IFwiU3dpcGVcIixcclxuICAvLyBodHRwczovL2dpdGh1Yi5jb20vdGhlYmlyZC9Td2lwZSNjb25maWctb3B0aW9uc1xyXG4gIHByb3BUeXBlczoge1xyXG4gICAgc3RhcnRTbGlkZSAgICAgIDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcclxuICAgIHNwZWVkICAgICAgICAgICA6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXHJcbiAgICBhdXRvICAgICAgICAgICAgOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxyXG4gICAgY29udGludW91cyAgICAgIDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXHJcbiAgICBkaXNhYmxlU2Nyb2xsICAgOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcclxuICAgIHN0b3BQcm9wYWdhdGlvbiA6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxyXG4gICAgY2FsbGJhY2sgICAgICAgIDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXHJcbiAgICB0cmFuc2l0aW9uRW5kICAgOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcclxuICAgIHN3aXBlU3RhcnQgICAgICA6IFJlYWN0LlByb3BUeXBlcy5mdW5jLCAvL2J5IHlhcFxyXG4gICAgc3dpcGVFbmQgICAgICAgIDogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcclxuICB9LFxyXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuc3dpcGUgPSBTd2lwZSh0aGlzLmdldERPTU5vZGUoKSwgdGhpcy5wcm9wcyk7XHJcbiAgfSxcclxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnN3aXBlLmtpbGwoKTtcclxuICAgIGRlbGV0ZSB0aGlzLnN3aXBlO1xyXG4gIH0sXHJcbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBjb250YWluZXIgPSBSZWFjdC5ET00uZGl2KHRoaXMucHJvcHMsXHJcbiAgICAgIFJlYWN0LkRPTS5kaXYoe3N0eWxlOiBzdHlsZXMud3JhcHBlcn0sXHJcbiAgICAgICAgUmVhY3QuQ2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgICByZXR1cm4gUmVhY3QuYWRkb25zLmNsb25lV2l0aFByb3BzKGNoaWxkLCB7c3R5bGU6IHN0eWxlcy5jaGlsZH0pXHJcbiAgICAgICAgfSlcclxuICAgICAgKVxyXG4gICAgKVxyXG4gICAgcmV0dXJuIFJlYWN0LmFkZG9ucy5jbG9uZVdpdGhQcm9wcyhjb250YWluZXIsIHtzdHlsZTogc3R5bGVzLmNvbnRhaW5lcn0pXHJcbiAgfVxyXG59KTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuLypcclxuY29udmVydCB0byBwdXJlIGpzXHJcbnNhdmUgLWcgcmVhY3RpZnlcclxuKi9cclxudmFyIEU9UmVhY3QuY3JlYXRlRWxlbWVudDtcclxuXHJcbnZhciBoYXNrc2FuYWdhcD0odHlwZW9mIGtzYW5hZ2FwIT1cInVuZGVmaW5lZFwiKTtcclxuaWYgKGhhc2tzYW5hZ2FwICYmICh0eXBlb2YgY29uc29sZT09XCJ1bmRlZmluZWRcIiB8fCB0eXBlb2YgY29uc29sZS5sb2c9PVwidW5kZWZpbmVkXCIpKSB7XHJcblx0XHR3aW5kb3cuY29uc29sZT17bG9nOmtzYW5hZ2FwLmxvZyxlcnJvcjprc2FuYWdhcC5lcnJvcixkZWJ1Zzprc2FuYWdhcC5kZWJ1Zyx3YXJuOmtzYW5hZ2FwLndhcm59O1xyXG5cdFx0Y29uc29sZS5sb2coXCJpbnN0YWxsIGNvbnNvbGUgb3V0cHV0IGZ1bmNpdG9uXCIpO1xyXG59XHJcblxyXG52YXIgY2hlY2tmcz1mdW5jdGlvbigpIHtcclxuXHRyZXR1cm4gKG5hdmlnYXRvciAmJiBuYXZpZ2F0b3Iud2Via2l0UGVyc2lzdGVudFN0b3JhZ2UpIHx8IGhhc2tzYW5hZ2FwO1xyXG59XHJcbnZhciBmZWF0dXJlY2hlY2tzPXtcclxuXHRcImZzXCI6Y2hlY2tmc1xyXG59XHJcbnZhciBjaGVja2Jyb3dzZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcblx0Z2V0SW5pdGlhbFN0YXRlOmZ1bmN0aW9uKCkge1xyXG5cclxuXHRcdHZhciBtaXNzaW5nRmVhdHVyZXM9dGhpcy5nZXRNaXNzaW5nRmVhdHVyZXMoKTtcclxuXHRcdHJldHVybiB7cmVhZHk6ZmFsc2UsIG1pc3Npbmc6bWlzc2luZ0ZlYXR1cmVzfTtcclxuXHR9LFxyXG5cdGdldE1pc3NpbmdGZWF0dXJlczpmdW5jdGlvbigpIHtcclxuXHRcdHZhciBmZWF0dXJlPXRoaXMucHJvcHMuZmVhdHVyZS5zcGxpdChcIixcIik7XHJcblx0XHR2YXIgc3RhdHVzPVtdO1xyXG5cdFx0ZmVhdHVyZS5tYXAoZnVuY3Rpb24oZil7XHJcblx0XHRcdHZhciBjaGVja2VyPWZlYXR1cmVjaGVja3NbZl07XHJcblx0XHRcdGlmIChjaGVja2VyKSBjaGVja2VyPWNoZWNrZXIoKTtcclxuXHRcdFx0c3RhdHVzLnB1c2goW2YsY2hlY2tlcl0pO1xyXG5cdFx0fSk7XHJcblx0XHRyZXR1cm4gc3RhdHVzLmZpbHRlcihmdW5jdGlvbihmKXtyZXR1cm4gIWZbMV19KTtcclxuXHR9LFxyXG5cdGRvd25sb2FkYnJvd3NlcjpmdW5jdGlvbigpIHtcclxuXHRcdHdpbmRvdy5sb2NhdGlvbj1cImh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vY2hyb21lL1wiXHJcblx0fSxcclxuXHRyZW5kZXJNaXNzaW5nOmZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIHNob3dNaXNzaW5nPWZ1bmN0aW9uKG0pIHtcclxuXHRcdFx0cmV0dXJuIEUoXCJkaXZcIiwgbnVsbCwgbSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gKFxyXG5cdFx0IEUoXCJkaXZcIiwge3JlZjogXCJkaWFsb2cxXCIsIGNsYXNzTmFtZTogXCJtb2RhbCBmYWRlXCIsIFwiZGF0YS1iYWNrZHJvcFwiOiBcInN0YXRpY1wifSwgXHJcblx0XHQgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWRpYWxvZ1wifSwgXHJcblx0XHQgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtY29udGVudFwifSwgXHJcblx0XHQgICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1oZWFkZXJcIn0sIFxyXG5cdFx0ICAgICAgICAgIEUoXCJidXR0b25cIiwge3R5cGU6IFwiYnV0dG9uXCIsIGNsYXNzTmFtZTogXCJjbG9zZVwiLCBcImRhdGEtZGlzbWlzc1wiOiBcIm1vZGFsXCIsIFwiYXJpYS1oaWRkZW5cIjogXCJ0cnVlXCJ9LCBcIsOXXCIpLCBcclxuXHRcdCAgICAgICAgICBFKFwiaDRcIiwge2NsYXNzTmFtZTogXCJtb2RhbC10aXRsZVwifSwgXCJCcm93c2VyIENoZWNrXCIpXHJcblx0XHQgICAgICAgICksIFxyXG5cdFx0ICAgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtYm9keVwifSwgXHJcblx0XHQgICAgICAgICAgRShcInBcIiwgbnVsbCwgXCJTb3JyeSBidXQgdGhlIGZvbGxvd2luZyBmZWF0dXJlIGlzIG1pc3NpbmdcIiksIFxyXG5cdFx0ICAgICAgICAgIHRoaXMuc3RhdGUubWlzc2luZy5tYXAoc2hvd01pc3NpbmcpXHJcblx0XHQgICAgICAgICksIFxyXG5cdFx0ICAgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtZm9vdGVyXCJ9LCBcclxuXHRcdCAgICAgICAgICBFKFwiYnV0dG9uXCIsIHtvbkNsaWNrOiB0aGlzLmRvd25sb2FkYnJvd3NlciwgdHlwZTogXCJidXR0b25cIiwgY2xhc3NOYW1lOiBcImJ0biBidG4tcHJpbWFyeVwifSwgXCJEb3dubG9hZCBHb29nbGUgQ2hyb21lXCIpXHJcblx0XHQgICAgICAgIClcclxuXHRcdCAgICAgIClcclxuXHRcdCAgICApXHJcblx0XHQgIClcclxuXHRcdCApO1xyXG5cdH0sXHJcblx0cmVuZGVyUmVhZHk6ZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gRShcInNwYW5cIiwgbnVsbCwgXCJicm93c2VyIG9rXCIpXHJcblx0fSxcclxuXHRyZW5kZXI6ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiAgKHRoaXMuc3RhdGUubWlzc2luZy5sZW5ndGgpP3RoaXMucmVuZGVyTWlzc2luZygpOnRoaXMucmVuZGVyUmVhZHkoKTtcclxuXHR9LFxyXG5cdGNvbXBvbmVudERpZE1vdW50OmZ1bmN0aW9uKCkge1xyXG5cdFx0aWYgKCF0aGlzLnN0YXRlLm1pc3NpbmcubGVuZ3RoKSB7XHJcblx0XHRcdHRoaXMucHJvcHMub25SZWFkeSgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0JCh0aGlzLnJlZnMuZGlhbG9nMS5nZXRET01Ob2RlKCkpLm1vZGFsKCdzaG93Jyk7XHJcblx0XHR9XHJcblx0fVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzPWNoZWNrYnJvd3NlcjsiLCJcclxudmFyIHVzZXJDYW5jZWw9ZmFsc2U7XHJcbnZhciBmaWxlcz1bXTtcclxudmFyIHRvdGFsRG93bmxvYWRCeXRlPTA7XHJcbnZhciB0YXJnZXRQYXRoPVwiXCI7XHJcbnZhciB0ZW1wUGF0aD1cIlwiO1xyXG52YXIgbmZpbGU9MDtcclxudmFyIGJhc2V1cmw9XCJcIjtcclxudmFyIHJlc3VsdD1cIlwiO1xyXG52YXIgZG93bmxvYWRpbmc9ZmFsc2U7XHJcbnZhciBzdGFydERvd25sb2FkPWZ1bmN0aW9uKGRiaWQsX2Jhc2V1cmwsX2ZpbGVzKSB7IC8vcmV0dXJuIGRvd25sb2FkIGlkXHJcblx0dmFyIGZzICAgICA9IHJlcXVpcmUoXCJmc1wiKTtcclxuXHR2YXIgcGF0aCAgID0gcmVxdWlyZShcInBhdGhcIik7XHJcblxyXG5cdFxyXG5cdGZpbGVzPV9maWxlcy5zcGxpdChcIlxcdWZmZmZcIik7XHJcblx0aWYgKGRvd25sb2FkaW5nKSByZXR1cm4gZmFsc2U7IC8vb25seSBvbmUgc2Vzc2lvblxyXG5cdHVzZXJDYW5jZWw9ZmFsc2U7XHJcblx0dG90YWxEb3dubG9hZEJ5dGU9MDtcclxuXHRuZXh0RmlsZSgpO1xyXG5cdGRvd25sb2FkaW5nPXRydWU7XHJcblx0YmFzZXVybD1fYmFzZXVybDtcclxuXHRpZiAoYmFzZXVybFtiYXNldXJsLmxlbmd0aC0xXSE9Jy8nKWJhc2V1cmwrPScvJztcclxuXHR0YXJnZXRQYXRoPWtzYW5hZ2FwLnJvb3RQYXRoK2RiaWQrJy8nO1xyXG5cdHRlbXBQYXRoPWtzYW5hZ2FwLnJvb3RQYXRoK1wiLnRtcC9cIjtcclxuXHRyZXN1bHQ9XCJcIjtcclxuXHRyZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxudmFyIG5leHRGaWxlPWZ1bmN0aW9uKCkge1xyXG5cdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdGlmIChuZmlsZT09ZmlsZXMubGVuZ3RoKSB7XHJcblx0XHRcdG5maWxlKys7XHJcblx0XHRcdGVuZERvd25sb2FkKCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRkb3dubG9hZEZpbGUobmZpbGUrKyk7XHRcclxuXHRcdH1cclxuXHR9LDEwMCk7XHJcbn1cclxuXHJcbnZhciBkb3dubG9hZEZpbGU9ZnVuY3Rpb24obmZpbGUpIHtcclxuXHR2YXIgdXJsPWJhc2V1cmwrZmlsZXNbbmZpbGVdO1xyXG5cdHZhciB0bXBmaWxlbmFtZT10ZW1wUGF0aCtmaWxlc1tuZmlsZV07XHJcblx0dmFyIG1rZGlycCA9IHJlcXVpcmUoXCIuL21rZGlycFwiKTtcclxuXHR2YXIgZnMgICAgID0gcmVxdWlyZShcImZzXCIpO1xyXG5cdHZhciBodHRwICAgPSByZXF1aXJlKFwiaHR0cFwiKTtcclxuXHJcblx0bWtkaXJwLnN5bmMocGF0aC5kaXJuYW1lKHRtcGZpbGVuYW1lKSk7XHJcblx0dmFyIHdyaXRlU3RyZWFtID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0odG1wZmlsZW5hbWUpO1xyXG5cdHZhciBkYXRhbGVuZ3RoPTA7XHJcblx0dmFyIHJlcXVlc3QgPSBodHRwLmdldCh1cmwsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcblx0XHRyZXNwb25zZS5vbignZGF0YScsZnVuY3Rpb24oY2h1bmspe1xyXG5cdFx0XHR3cml0ZVN0cmVhbS53cml0ZShjaHVuayk7XHJcblx0XHRcdHRvdGFsRG93bmxvYWRCeXRlKz1jaHVuay5sZW5ndGg7XHJcblx0XHRcdGlmICh1c2VyQ2FuY2VsKSB7XHJcblx0XHRcdFx0d3JpdGVTdHJlYW0uZW5kKCk7XHJcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpe25leHRGaWxlKCk7fSwxMDApO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHRcdHJlc3BvbnNlLm9uKFwiZW5kXCIsZnVuY3Rpb24oKSB7XHJcblx0XHRcdHdyaXRlU3RyZWFtLmVuZCgpO1xyXG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7bmV4dEZpbGUoKTt9LDEwMCk7XHJcblx0XHR9KTtcclxuXHR9KTtcclxufVxyXG5cclxudmFyIGNhbmNlbERvd25sb2FkPWZ1bmN0aW9uKCkge1xyXG5cdHVzZXJDYW5jZWw9dHJ1ZTtcclxuXHRlbmREb3dubG9hZCgpO1xyXG59XHJcbnZhciB2ZXJpZnk9ZnVuY3Rpb24oKSB7XHJcblx0cmV0dXJuIHRydWU7XHJcbn1cclxudmFyIGVuZERvd25sb2FkPWZ1bmN0aW9uKCkge1xyXG5cdG5maWxlPWZpbGVzLmxlbmd0aCsxOy8vc3RvcFxyXG5cdHJlc3VsdD1cImNhbmNlbGxlZFwiO1xyXG5cdGRvd25sb2FkaW5nPWZhbHNlO1xyXG5cdGlmICh1c2VyQ2FuY2VsKSByZXR1cm47XHJcblx0dmFyIGZzICAgICA9IHJlcXVpcmUoXCJmc1wiKTtcclxuXHR2YXIgbWtkaXJwID0gcmVxdWlyZShcIi4vbWtkaXJwXCIpO1xyXG5cclxuXHRmb3IgKHZhciBpPTA7aTxmaWxlcy5sZW5ndGg7aSsrKSB7XHJcblx0XHR2YXIgdGFyZ2V0ZmlsZW5hbWU9dGFyZ2V0UGF0aCtmaWxlc1tpXTtcclxuXHRcdHZhciB0bXBmaWxlbmFtZSAgID10ZW1wUGF0aCtmaWxlc1tpXTtcclxuXHRcdG1rZGlycC5zeW5jKHBhdGguZGlybmFtZSh0YXJnZXRmaWxlbmFtZSkpO1xyXG5cdFx0ZnMucmVuYW1lU3luYyh0bXBmaWxlbmFtZSx0YXJnZXRmaWxlbmFtZSk7XHJcblx0fVxyXG5cdGlmICh2ZXJpZnkoKSkge1xyXG5cdFx0cmVzdWx0PVwic3VjY2Vzc1wiO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRyZXN1bHQ9XCJlcnJvclwiO1xyXG5cdH1cclxufVxyXG5cclxudmFyIGRvd25sb2FkZWRCeXRlPWZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiB0b3RhbERvd25sb2FkQnl0ZTtcclxufVxyXG52YXIgZG9uZURvd25sb2FkPWZ1bmN0aW9uKCkge1xyXG5cdGlmIChuZmlsZT5maWxlcy5sZW5ndGgpIHJldHVybiByZXN1bHQ7XHJcblx0ZWxzZSByZXR1cm4gXCJcIjtcclxufVxyXG52YXIgZG93bmxvYWRpbmdGaWxlPWZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiBuZmlsZS0xO1xyXG59XHJcblxyXG52YXIgZG93bmxvYWRlcj17c3RhcnREb3dubG9hZDpzdGFydERvd25sb2FkLCBkb3dubG9hZGVkQnl0ZTpkb3dubG9hZGVkQnl0ZSxcclxuXHRkb3dubG9hZGluZ0ZpbGU6ZG93bmxvYWRpbmdGaWxlLCBjYW5jZWxEb3dubG9hZDpjYW5jZWxEb3dubG9hZCxkb25lRG93bmxvYWQ6ZG9uZURvd25sb2FkfTtcclxubW9kdWxlLmV4cG9ydHM9ZG93bmxvYWRlcjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cclxuXHJcbi8qIHRvZG8gLCBvcHRpb25hbCBrZGIgKi9cclxuXHJcbnZhciBIdG1sRlM9cmVxdWlyZShcIi4vaHRtbGZzXCIpO1xyXG52YXIgaHRtbDVmcz1yZXF1aXJlKFwiLi9odG1sNWZzXCIpO1xyXG52YXIgQ2hlY2tCcm93c2VyPXJlcXVpcmUoXCIuL2NoZWNrYnJvd3NlclwiKTtcclxudmFyIEU9UmVhY3QuY3JlYXRlRWxlbWVudDtcclxuICBcclxuXHJcbnZhciBGaWxlTGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuXHRnZXRJbml0aWFsU3RhdGU6ZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4ge2Rvd25sb2FkaW5nOmZhbHNlLHByb2dyZXNzOjB9O1xyXG5cdH0sXHJcblx0dXBkYXRhYmxlOmZ1bmN0aW9uKGYpIHtcclxuICAgICAgICB2YXIgY2xhc3Nlcz1cImJ0biBidG4td2FybmluZ1wiO1xyXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmRvd25sb2FkaW5nKSBjbGFzc2VzKz1cIiBkaXNhYmxlZFwiO1xyXG5cdFx0aWYgKGYuaGFzVXBkYXRlKSByZXR1cm4gICBFKFwiYnV0dG9uXCIsIHtjbGFzc05hbWU6IGNsYXNzZXMsIFxyXG5cdFx0XHRcImRhdGEtZmlsZW5hbWVcIjogZi5maWxlbmFtZSwgXCJkYXRhLXVybFwiOiBmLnVybCwgXHJcblx0ICAgICAgICAgICAgb25DbGljazogdGhpcy5kb3dubG9hZFxyXG5cdCAgICAgICB9LCBcIlVwZGF0ZVwiKVxyXG5cdFx0ZWxzZSByZXR1cm4gbnVsbDtcclxuXHR9LFxyXG5cdHNob3dMb2NhbDpmdW5jdGlvbihmKSB7XHJcbiAgICAgICAgdmFyIGNsYXNzZXM9XCJidG4gYnRuLWRhbmdlclwiO1xyXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmRvd25sb2FkaW5nKSBjbGFzc2VzKz1cIiBkaXNhYmxlZFwiO1xyXG5cdCAgcmV0dXJuIEUoXCJ0clwiLCBudWxsLCBFKFwidGRcIiwgbnVsbCwgZi5maWxlbmFtZSksIFxyXG5cdCAgICAgIEUoXCJ0ZFwiLCBudWxsKSwgXHJcblx0ICAgICAgRShcInRkXCIsIHtjbGFzc05hbWU6IFwicHVsbC1yaWdodFwifSwgXHJcblx0ICAgICAgdGhpcy51cGRhdGFibGUoZiksIEUoXCJidXR0b25cIiwge2NsYXNzTmFtZTogY2xhc3NlcywgXHJcblx0ICAgICAgICAgICAgICAgb25DbGljazogdGhpcy5kZWxldGVGaWxlLCBcImRhdGEtZmlsZW5hbWVcIjogZi5maWxlbmFtZX0sIFwiRGVsZXRlXCIpXHJcblx0ICAgICAgICBcclxuXHQgICAgICApXHJcblx0ICApXHJcblx0fSwgIFxyXG5cdHNob3dSZW1vdGU6ZnVuY3Rpb24oZikgeyBcclxuXHQgIHZhciBjbGFzc2VzPVwiYnRuIGJ0bi13YXJuaW5nXCI7XHJcblx0ICBpZiAodGhpcy5zdGF0ZS5kb3dubG9hZGluZykgY2xhc3Nlcys9XCIgZGlzYWJsZWRcIjtcclxuXHQgIHJldHVybiAoRShcInRyXCIsIHtcImRhdGEtaWRcIjogZi5maWxlbmFtZX0sIEUoXCJ0ZFwiLCBudWxsLCBcclxuXHQgICAgICBmLmZpbGVuYW1lKSwgXHJcblx0ICAgICAgRShcInRkXCIsIG51bGwsIGYuZGVzYyksIFxyXG5cdCAgICAgIEUoXCJ0ZFwiLCBudWxsLCBcclxuXHQgICAgICBFKFwic3BhblwiLCB7XCJkYXRhLWZpbGVuYW1lXCI6IGYuZmlsZW5hbWUsIFwiZGF0YS11cmxcIjogZi51cmwsIFxyXG5cdCAgICAgICAgICAgIGNsYXNzTmFtZTogY2xhc3NlcywgXHJcblx0ICAgICAgICAgICAgb25DbGljazogdGhpcy5kb3dubG9hZH0sIFwiRG93bmxvYWRcIilcclxuXHQgICAgICApXHJcblx0ICApKTtcclxuXHR9LFxyXG5cdHNob3dGaWxlOmZ1bmN0aW9uKGYpIHtcclxuXHQvL1x0cmV0dXJuIDxzcGFuIGRhdGEtaWQ9e2YuZmlsZW5hbWV9PntmLnVybH08L3NwYW4+XHJcblx0XHRyZXR1cm4gKGYucmVhZHkpP3RoaXMuc2hvd0xvY2FsKGYpOnRoaXMuc2hvd1JlbW90ZShmKTtcclxuXHR9LFxyXG5cdHJlbG9hZERpcjpmdW5jdGlvbigpIHtcclxuXHRcdHRoaXMucHJvcHMuYWN0aW9uKFwicmVsb2FkXCIpO1xyXG5cdH0sXHJcblx0ZG93bmxvYWQ6ZnVuY3Rpb24oZSkge1xyXG5cdFx0dmFyIHVybD1lLnRhcmdldC5kYXRhc2V0W1widXJsXCJdO1xyXG5cdFx0dmFyIGZpbGVuYW1lPWUudGFyZ2V0LmRhdGFzZXRbXCJmaWxlbmFtZVwiXTtcclxuXHRcdHRoaXMuc2V0U3RhdGUoe2Rvd25sb2FkaW5nOnRydWUscHJvZ3Jlc3M6MCx1cmw6dXJsfSk7XHJcblx0XHR0aGlzLnVzZXJicmVhaz1mYWxzZTtcclxuXHRcdGh0bWw1ZnMuZG93bmxvYWQodXJsLGZpbGVuYW1lLGZ1bmN0aW9uKCl7XHJcblx0XHRcdHRoaXMucmVsb2FkRGlyKCk7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe2Rvd25sb2FkaW5nOmZhbHNlLHByb2dyZXNzOjF9KTtcclxuXHRcdFx0fSxmdW5jdGlvbihwcm9ncmVzcyx0b3RhbCl7XHJcblx0XHRcdFx0aWYgKHByb2dyZXNzPT0wKSB7XHJcblx0XHRcdFx0XHR0aGlzLnNldFN0YXRlKHttZXNzYWdlOlwidG90YWwgXCIrdG90YWx9KVxyXG5cdFx0XHQgXHR9XHJcblx0XHRcdCBcdHRoaXMuc2V0U3RhdGUoe3Byb2dyZXNzOnByb2dyZXNzfSk7XHJcblx0XHRcdCBcdC8vaWYgdXNlciBwcmVzcyBhYm9ydCByZXR1cm4gdHJ1ZVxyXG5cdFx0XHQgXHRyZXR1cm4gdGhpcy51c2VyYnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdCx0aGlzKTtcclxuXHR9LFxyXG5cdGRlbGV0ZUZpbGU6ZnVuY3Rpb24oIGUpIHtcclxuXHRcdHZhciBmaWxlbmFtZT1lLnRhcmdldC5hdHRyaWJ1dGVzW1wiZGF0YS1maWxlbmFtZVwiXS52YWx1ZTtcclxuXHRcdHRoaXMucHJvcHMuYWN0aW9uKFwiZGVsZXRlXCIsZmlsZW5hbWUpO1xyXG5cdH0sXHJcblx0YWxsRmlsZXNSZWFkeTpmdW5jdGlvbihlKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5wcm9wcy5maWxlcy5ldmVyeShmdW5jdGlvbihmKXsgcmV0dXJuIGYucmVhZHl9KTtcclxuXHR9LFxyXG5cdGRpc21pc3M6ZnVuY3Rpb24oKSB7XHJcblx0XHQkKHRoaXMucmVmcy5kaWFsb2cxLmdldERPTU5vZGUoKSkubW9kYWwoJ2hpZGUnKTtcclxuXHRcdHRoaXMucHJvcHMuYWN0aW9uKFwiZGlzbWlzc1wiKTtcclxuXHR9LFxyXG5cdGFib3J0ZG93bmxvYWQ6ZnVuY3Rpb24oKSB7XHJcblx0XHR0aGlzLnVzZXJicmVhaz10cnVlO1xyXG5cdH0sXHJcblx0c2hvd1Byb2dyZXNzOmZ1bmN0aW9uKCkge1xyXG5cdCAgICAgaWYgKHRoaXMuc3RhdGUuZG93bmxvYWRpbmcpIHtcclxuXHQgICAgICB2YXIgcHJvZ3Jlc3M9TWF0aC5yb3VuZCh0aGlzLnN0YXRlLnByb2dyZXNzKjEwMCk7XHJcblx0ICAgICAgcmV0dXJuIChcclxuXHQgICAgICBcdEUoXCJkaXZcIiwgbnVsbCwgXHJcblx0ICAgICAgXHRcIkRvd25sb2FkaW5nIGZyb20gXCIsIHRoaXMuc3RhdGUudXJsLCBcclxuXHQgICAgICBFKFwiZGl2XCIsIHtrZXk6IFwicHJvZ3Jlc3NcIiwgY2xhc3NOYW1lOiBcInByb2dyZXNzIGNvbC1tZC04XCJ9LCBcclxuXHQgICAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcInByb2dyZXNzLWJhclwiLCByb2xlOiBcInByb2dyZXNzYmFyXCIsIFxyXG5cdCAgICAgICAgICAgICAgXCJhcmlhLXZhbHVlbm93XCI6IHByb2dyZXNzLCBcImFyaWEtdmFsdWVtaW5cIjogXCIwXCIsIFxyXG5cdCAgICAgICAgICAgICAgXCJhcmlhLXZhbHVlbWF4XCI6IFwiMTAwXCIsIHN0eWxlOiB7d2lkdGg6IHByb2dyZXNzK1wiJVwifX0sIFxyXG5cdCAgICAgICAgICAgIHByb2dyZXNzLCBcIiVcIlxyXG5cdCAgICAgICAgICApXHJcblx0ICAgICAgICApLCBcclxuXHQgICAgICAgIEUoXCJidXR0b25cIiwge29uQ2xpY2s6IHRoaXMuYWJvcnRkb3dubG9hZCwgXHJcblx0ICAgICAgICBcdGNsYXNzTmFtZTogXCJidG4gYnRuLWRhbmdlciBjb2wtbWQtNFwifSwgXCJBYm9ydFwiKVxyXG5cdCAgICAgICAgKVxyXG5cdCAgICAgICAgKTtcclxuXHQgICAgICB9IGVsc2Uge1xyXG5cdCAgICAgIFx0XHRpZiAoIHRoaXMuYWxsRmlsZXNSZWFkeSgpICkge1xyXG5cdCAgICAgIFx0XHRcdHJldHVybiBFKFwiYnV0dG9uXCIsIHtvbkNsaWNrOiB0aGlzLmRpc21pc3MsIGNsYXNzTmFtZTogXCJidG4gYnRuLXN1Y2Nlc3NcIn0sIFwiT2tcIilcclxuXHQgICAgICBcdFx0fSBlbHNlIHJldHVybiBudWxsO1xyXG5cdCAgICAgIFx0XHRcclxuXHQgICAgICB9XHJcblx0fSxcclxuXHRzaG93VXNhZ2U6ZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgcGVyY2VudD10aGlzLnByb3BzLnJlbWFpblBlcmNlbnQ7XHJcbiAgICAgICAgICAgcmV0dXJuIChFKFwiZGl2XCIsIG51bGwsIEUoXCJzcGFuXCIsIHtjbGFzc05hbWU6IFwicHVsbC1sZWZ0XCJ9LCBcIlVzYWdlOlwiKSwgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcInByb2dyZXNzXCJ9LCBcclxuXHRcdCAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcInByb2dyZXNzLWJhciBwcm9ncmVzcy1iYXItc3VjY2VzcyBwcm9ncmVzcy1iYXItc3RyaXBlZFwiLCByb2xlOiBcInByb2dyZXNzYmFyXCIsIHN0eWxlOiB7d2lkdGg6IHBlcmNlbnQrXCIlXCJ9fSwgXHJcblx0XHQgICAgXHRwZXJjZW50K1wiJVwiXHJcblx0XHQgIClcclxuXHRcdCkpKTtcclxuXHR9LFxyXG5cdHJlbmRlcjpmdW5jdGlvbigpIHtcclxuXHQgIFx0cmV0dXJuIChcclxuXHRcdEUoXCJkaXZcIiwge3JlZjogXCJkaWFsb2cxXCIsIGNsYXNzTmFtZTogXCJtb2RhbCBmYWRlXCIsIFwiZGF0YS1iYWNrZHJvcFwiOiBcInN0YXRpY1wifSwgXHJcblx0XHQgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWRpYWxvZ1wifSwgXHJcblx0XHQgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtY29udGVudFwifSwgXHJcblx0XHQgICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1oZWFkZXJcIn0sIFxyXG5cdFx0ICAgICAgICAgIEUoXCJoNFwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLXRpdGxlXCJ9LCBcIkZpbGUgSW5zdGFsbGVyXCIpXHJcblx0XHQgICAgICAgICksIFxyXG5cdFx0ICAgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtYm9keVwifSwgXHJcblx0XHQgICAgICAgIFx0RShcInRhYmxlXCIsIHtjbGFzc05hbWU6IFwidGFibGVcIn0sIFxyXG5cdFx0ICAgICAgICBcdEUoXCJ0Ym9keVwiLCBudWxsLCBcclxuXHRcdCAgICAgICAgICBcdHRoaXMucHJvcHMuZmlsZXMubWFwKHRoaXMuc2hvd0ZpbGUpXHJcblx0XHQgICAgICAgICAgXHQpXHJcblx0XHQgICAgICAgICAgKVxyXG5cdFx0ICAgICAgICApLCBcclxuXHRcdCAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWZvb3RlclwifSwgXHJcblx0XHQgICAgICAgIFx0dGhpcy5zaG93VXNhZ2UoKSwgXHJcblx0XHQgICAgICAgICAgIHRoaXMuc2hvd1Byb2dyZXNzKClcclxuXHRcdCAgICAgICAgKVxyXG5cdFx0ICAgICAgKVxyXG5cdFx0ICAgIClcclxuXHRcdCAgKVxyXG5cdFx0KTtcclxuXHR9LFx0XHJcblx0Y29tcG9uZW50RGlkTW91bnQ6ZnVuY3Rpb24oKSB7XHJcblx0XHQkKHRoaXMucmVmcy5kaWFsb2cxLmdldERPTU5vZGUoKSkubW9kYWwoJ3Nob3cnKTtcclxuXHR9XHJcbn0pO1xyXG4vKlRPRE8ga2RiIGNoZWNrIHZlcnNpb24qL1xyXG52YXIgRmlsZW1hbmFnZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcblx0Z2V0SW5pdGlhbFN0YXRlOmZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIHF1b3RhPXRoaXMuZ2V0UXVvdGEoKTtcclxuXHRcdHJldHVybiB7YnJvd3NlclJlYWR5OmZhbHNlLG5vdXBkYXRlOnRydWUsXHRyZXF1ZXN0UXVvdGE6cXVvdGEscmVtYWluOjB9O1xyXG5cdH0sXHJcblx0Z2V0UXVvdGE6ZnVuY3Rpb24oKSB7XHJcblx0XHR2YXIgcT10aGlzLnByb3BzLnF1b3RhfHxcIjEyOE1cIjtcclxuXHRcdHZhciB1bml0PXFbcS5sZW5ndGgtMV07XHJcblx0XHR2YXIgdGltZXM9MTtcclxuXHRcdGlmICh1bml0PT1cIk1cIikgdGltZXM9MTAyNCoxMDI0O1xyXG5cdFx0ZWxzZSBpZiAodW5pdD1cIktcIikgdGltZXM9MTAyNDtcclxuXHRcdHJldHVybiBwYXJzZUludChxKSAqIHRpbWVzO1xyXG5cdH0sXHJcblx0bWlzc2luZ0tkYjpmdW5jdGlvbigpIHtcclxuXHRcdGlmIChrc2FuYWdhcC5wbGF0Zm9ybSE9XCJjaHJvbWVcIikgcmV0dXJuIFtdO1xyXG5cdFx0dmFyIG1pc3Npbmc9dGhpcy5wcm9wcy5uZWVkZWQuZmlsdGVyKGZ1bmN0aW9uKGtkYil7XHJcblx0XHRcdGZvciAodmFyIGkgaW4gaHRtbDVmcy5maWxlcykge1xyXG5cdFx0XHRcdGlmIChodG1sNWZzLmZpbGVzW2ldWzBdPT1rZGIuZmlsZW5hbWUpIHJldHVybiBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0sdGhpcyk7XHJcblx0XHRyZXR1cm4gbWlzc2luZztcclxuXHR9LFxyXG5cdGdldFJlbW90ZVVybDpmdW5jdGlvbihmbikge1xyXG5cdFx0dmFyIGY9dGhpcy5wcm9wcy5uZWVkZWQuZmlsdGVyKGZ1bmN0aW9uKGYpe3JldHVybiBmLmZpbGVuYW1lPT1mbn0pO1xyXG5cdFx0aWYgKGYubGVuZ3RoICkgcmV0dXJuIGZbMF0udXJsO1xyXG5cdH0sXHJcblx0Z2VuRmlsZUxpc3Q6ZnVuY3Rpb24oZXhpc3RpbmcsbWlzc2luZyl7XHJcblx0XHR2YXIgb3V0PVtdO1xyXG5cdFx0Zm9yICh2YXIgaSBpbiBleGlzdGluZykge1xyXG5cdFx0XHR2YXIgdXJsPXRoaXMuZ2V0UmVtb3RlVXJsKGV4aXN0aW5nW2ldWzBdKTtcclxuXHRcdFx0b3V0LnB1c2goe2ZpbGVuYW1lOmV4aXN0aW5nW2ldWzBdLCB1cmwgOnVybCwgcmVhZHk6dHJ1ZSB9KTtcclxuXHRcdH1cclxuXHRcdGZvciAodmFyIGkgaW4gbWlzc2luZykge1xyXG5cdFx0XHRvdXQucHVzaChtaXNzaW5nW2ldKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBvdXQ7XHJcblx0fSxcclxuXHRyZWxvYWQ6ZnVuY3Rpb24oKSB7XHJcblx0XHRodG1sNWZzLnJlYWRkaXIoZnVuY3Rpb24oZmlsZXMpe1xyXG4gIFx0XHRcdHRoaXMuc2V0U3RhdGUoe2ZpbGVzOnRoaXMuZ2VuRmlsZUxpc3QoZmlsZXMsdGhpcy5taXNzaW5nS2RiKCkpfSk7XHJcbiAgXHRcdH0sdGhpcyk7XHJcblx0IH0sXHJcblx0ZGVsZXRlRmlsZTpmdW5jdGlvbihmbikge1xyXG5cdCAgaHRtbDVmcy5ybShmbixmdW5jdGlvbigpe1xyXG5cdCAgXHR0aGlzLnJlbG9hZCgpO1xyXG5cdCAgfSx0aGlzKTtcclxuXHR9LFxyXG5cdG9uUXVvdGVPazpmdW5jdGlvbihxdW90YSx1c2FnZSkge1xyXG5cdFx0aWYgKGtzYW5hZ2FwLnBsYXRmb3JtIT1cImNocm9tZVwiKSB7XHJcblx0XHRcdC8vY29uc29sZS5sb2coXCJvbnF1b3Rlb2tcIik7XHJcblx0XHRcdHRoaXMuc2V0U3RhdGUoe25vdXBkYXRlOnRydWUsbWlzc2luZzpbXSxmaWxlczpbXSxhdXRvY2xvc2U6dHJ1ZVxyXG5cdFx0XHRcdCxxdW90YTpxdW90YSxyZW1haW46cXVvdGEtdXNhZ2UsdXNhZ2U6dXNhZ2V9KTtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cdFx0Ly9jb25zb2xlLmxvZyhcInF1b3RlIG9rXCIpO1xyXG5cdFx0dmFyIGZpbGVzPXRoaXMuZ2VuRmlsZUxpc3QoaHRtbDVmcy5maWxlcyx0aGlzLm1pc3NpbmdLZGIoKSk7XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0dGhhdC5jaGVja0lmVXBkYXRlKGZpbGVzLGZ1bmN0aW9uKGhhc3VwZGF0ZSkge1xyXG5cdFx0XHR2YXIgbWlzc2luZz10aGlzLm1pc3NpbmdLZGIoKTtcclxuXHRcdFx0dmFyIGF1dG9jbG9zZT10aGlzLnByb3BzLmF1dG9jbG9zZTtcclxuXHRcdFx0aWYgKG1pc3NpbmcubGVuZ3RoKSBhdXRvY2xvc2U9ZmFsc2U7XHJcblx0XHRcdHRoYXQuc2V0U3RhdGUoe2F1dG9jbG9zZTphdXRvY2xvc2UsXHJcblx0XHRcdFx0cXVvdGE6cXVvdGEsdXNhZ2U6dXNhZ2UsZmlsZXM6ZmlsZXMsXHJcblx0XHRcdFx0bWlzc2luZzptaXNzaW5nLFxyXG5cdFx0XHRcdG5vdXBkYXRlOiFoYXN1cGRhdGUsXHJcblx0XHRcdFx0cmVtYWluOnF1b3RhLXVzYWdlfSk7XHJcblx0XHR9KTtcclxuXHR9LCAgXHJcblx0b25Ccm93c2VyT2s6ZnVuY3Rpb24oKSB7XHJcblx0ICB0aGlzLnRvdGFsRG93bmxvYWRTaXplKCk7XHJcblx0fSwgXHJcblx0ZGlzbWlzczpmdW5jdGlvbigpIHtcclxuXHRcdHRoaXMucHJvcHMub25SZWFkeSh0aGlzLnN0YXRlLnVzYWdlLHRoaXMuc3RhdGUucXVvdGEpO1xyXG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0XHR2YXIgbW9kYWxpbj0kKFwiLm1vZGFsLmluXCIpO1xyXG5cdFx0XHRpZiAobW9kYWxpbi5tb2RhbCkgbW9kYWxpbi5tb2RhbCgnaGlkZScpO1xyXG5cdFx0fSw1MDApO1xyXG5cdH0sIFxyXG5cdHRvdGFsRG93bmxvYWRTaXplOmZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIGZpbGVzPXRoaXMubWlzc2luZ0tkYigpO1xyXG5cdFx0dmFyIHRhc2txdWV1ZT1bXSx0b3RhbHNpemU9MDtcclxuXHRcdGZvciAodmFyIGk9MDtpPGZpbGVzLmxlbmd0aDtpKyspIHtcclxuXHRcdFx0dGFza3F1ZXVlLnB1c2goXHJcblx0XHRcdFx0KGZ1bmN0aW9uKGlkeCl7XHJcblx0XHRcdFx0XHRyZXR1cm4gKGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0XHRcdFx0XHRpZiAoISh0eXBlb2YgZGF0YT09J29iamVjdCcgJiYgZGF0YS5fX2VtcHR5KSkgdG90YWxzaXplKz1kYXRhO1xyXG5cdFx0XHRcdFx0XHRodG1sNWZzLmdldERvd25sb2FkU2l6ZShmaWxlc1tpZHhdLnVybCx0YXNrcXVldWUuc2hpZnQoKSk7XHJcblx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHR9KShpKVxyXG5cdFx0XHQpO1xyXG5cdFx0fVxyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHRhc2txdWV1ZS5wdXNoKGZ1bmN0aW9uKGRhdGEpe1x0XHJcblx0XHRcdHRvdGFsc2l6ZSs9ZGF0YTtcclxuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpe3RoYXQuc2V0U3RhdGUoe3JlcXVpcmVTcGFjZTp0b3RhbHNpemUsYnJvd3NlclJlYWR5OnRydWV9KX0sMCk7XHJcblx0XHR9KTtcclxuXHRcdHRhc2txdWV1ZS5zaGlmdCgpKHtfX2VtcHR5OnRydWV9KTtcclxuXHR9LFxyXG5cdGNoZWNrSWZVcGRhdGU6ZnVuY3Rpb24oZmlsZXMsY2IpIHtcclxuXHRcdHZhciB0YXNrcXVldWU9W107XHJcblx0XHRmb3IgKHZhciBpPTA7aTxmaWxlcy5sZW5ndGg7aSsrKSB7XHJcblx0XHRcdHRhc2txdWV1ZS5wdXNoKFxyXG5cdFx0XHRcdChmdW5jdGlvbihpZHgpe1xyXG5cdFx0XHRcdFx0cmV0dXJuIChmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0XHRcdFx0aWYgKCEodHlwZW9mIGRhdGE9PSdvYmplY3QnICYmIGRhdGEuX19lbXB0eSkpIGZpbGVzW2lkeC0xXS5oYXNVcGRhdGU9ZGF0YTtcclxuXHRcdFx0XHRcdFx0aHRtbDVmcy5jaGVja1VwZGF0ZShmaWxlc1tpZHhdLnVybCxmaWxlc1tpZHhdLmZpbGVuYW1lLHRhc2txdWV1ZS5zaGlmdCgpKTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdH0pKGkpXHJcblx0XHRcdCk7XHJcblx0XHR9XHJcblx0XHR2YXIgdGhhdD10aGlzO1xyXG5cdFx0dGFza3F1ZXVlLnB1c2goZnVuY3Rpb24oZGF0YSl7XHRcclxuXHRcdFx0ZmlsZXNbZmlsZXMubGVuZ3RoLTFdLmhhc1VwZGF0ZT1kYXRhO1xyXG5cdFx0XHR2YXIgaGFzdXBkYXRlPWZpbGVzLnNvbWUoZnVuY3Rpb24oZil7cmV0dXJuIGYuaGFzVXBkYXRlfSk7XHJcblx0XHRcdGlmIChjYikgY2IuYXBwbHkodGhhdCxbaGFzdXBkYXRlXSk7XHJcblx0XHR9KTtcclxuXHRcdHRhc2txdWV1ZS5zaGlmdCgpKHtfX2VtcHR5OnRydWV9KTtcclxuXHR9LFxyXG5cdHJlbmRlcjpmdW5jdGlvbigpe1xyXG4gICAgXHRcdGlmICghdGhpcy5zdGF0ZS5icm93c2VyUmVhZHkpIHsgICBcclxuICAgICAgXHRcdFx0cmV0dXJuIEUoQ2hlY2tCcm93c2VyLCB7ZmVhdHVyZTogXCJmc1wiLCBvblJlYWR5OiB0aGlzLm9uQnJvd3Nlck9rfSlcclxuICAgIFx0XHR9IGlmICghdGhpcy5zdGF0ZS5xdW90YSB8fCB0aGlzLnN0YXRlLnJlbWFpbjx0aGlzLnN0YXRlLnJlcXVpcmVTcGFjZSkgeyAgXHJcbiAgICBcdFx0XHR2YXIgcXVvdGE9dGhpcy5zdGF0ZS5yZXF1ZXN0UXVvdGE7XHJcbiAgICBcdFx0XHRpZiAodGhpcy5zdGF0ZS51c2FnZSt0aGlzLnN0YXRlLnJlcXVpcmVTcGFjZT5xdW90YSkge1xyXG4gICAgXHRcdFx0XHRxdW90YT0odGhpcy5zdGF0ZS51c2FnZSt0aGlzLnN0YXRlLnJlcXVpcmVTcGFjZSkqMS41O1xyXG4gICAgXHRcdFx0fVxyXG4gICAgICBcdFx0XHRyZXR1cm4gRShIdG1sRlMsIHtxdW90YTogcXVvdGEsIGF1dG9jbG9zZTogXCJ0cnVlXCIsIG9uUmVhZHk6IHRoaXMub25RdW90ZU9rfSlcclxuICAgICAgXHRcdH0gZWxzZSB7XHJcblx0XHRcdGlmICghdGhpcy5zdGF0ZS5ub3VwZGF0ZSB8fCB0aGlzLm1pc3NpbmdLZGIoKS5sZW5ndGggfHwgIXRoaXMuc3RhdGUuYXV0b2Nsb3NlKSB7XHJcblx0XHRcdFx0dmFyIHJlbWFpbj1NYXRoLnJvdW5kKCh0aGlzLnN0YXRlLnVzYWdlL3RoaXMuc3RhdGUucXVvdGEpKjEwMCk7XHRcdFx0XHRcclxuXHRcdFx0XHRyZXR1cm4gRShGaWxlTGlzdCwge2FjdGlvbjogdGhpcy5hY3Rpb24sIGZpbGVzOiB0aGlzLnN0YXRlLmZpbGVzLCByZW1haW5QZXJjZW50OiByZW1haW59KVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHNldFRpbWVvdXQoIHRoaXMuZGlzbWlzcyAsMCk7XHJcblx0XHRcdFx0cmV0dXJuIEUoXCJzcGFuXCIsIG51bGwsIFwiU3VjY2Vzc1wiKTtcclxuXHRcdFx0fVxyXG4gICAgICBcdFx0fVxyXG5cdH0sXHJcblx0YWN0aW9uOmZ1bmN0aW9uKCkge1xyXG5cdCAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xyXG5cdCAgdmFyIHR5cGU9YXJncy5zaGlmdCgpO1xyXG5cdCAgdmFyIHJlcz1udWxsLCB0aGF0PXRoaXM7XHJcblx0ICBpZiAodHlwZT09XCJkZWxldGVcIikge1xyXG5cdCAgICB0aGlzLmRlbGV0ZUZpbGUoYXJnc1swXSk7XHJcblx0ICB9ICBlbHNlIGlmICh0eXBlPT1cInJlbG9hZFwiKSB7XHJcblx0ICBcdHRoaXMucmVsb2FkKCk7XHJcblx0ICB9IGVsc2UgaWYgKHR5cGU9PVwiZGlzbWlzc1wiKSB7XHJcblx0ICBcdHRoaXMuZGlzbWlzcygpO1xyXG5cdCAgfVxyXG5cdH1cclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cz1GaWxlbWFuYWdlcjsiLCIvKiBlbXVsYXRlIGZpbGVzeXN0ZW0gb24gaHRtbDUgYnJvd3NlciAqL1xyXG52YXIgZ2V0X2hlYWQ9ZnVuY3Rpb24odXJsLGZpZWxkLGNiKXtcclxuXHR2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcblx0eGhyLm9wZW4oXCJIRUFEXCIsIHVybCwgdHJ1ZSk7XHJcblx0eGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRpZiAodGhpcy5yZWFkeVN0YXRlID09IHRoaXMuRE9ORSkge1xyXG5cdFx0XHRcdGNiKHhoci5nZXRSZXNwb25zZUhlYWRlcihmaWVsZCkpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGlmICh0aGlzLnN0YXR1cyE9PTIwMCYmdGhpcy5zdGF0dXMhPT0yMDYpIHtcclxuXHRcdFx0XHRcdGNiKFwiXCIpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBcclxuXHR9O1xyXG5cdHhoci5zZW5kKCk7XHRcclxufVxyXG52YXIgZ2V0X2RhdGU9ZnVuY3Rpb24odXJsLGNiKSB7XHJcblx0Z2V0X2hlYWQodXJsLFwiTGFzdC1Nb2RpZmllZFwiLGZ1bmN0aW9uKHZhbHVlKXtcclxuXHRcdGNiKHZhbHVlKTtcclxuXHR9KTtcclxufVxyXG52YXIgZ2V0X3NpemU9ZnVuY3Rpb24odXJsLCBjYikge1xyXG5cdGdldF9oZWFkKHVybCxcIkNvbnRlbnQtTGVuZ3RoXCIsZnVuY3Rpb24odmFsdWUpe1xyXG5cdFx0Y2IocGFyc2VJbnQodmFsdWUpKTtcclxuXHR9KTtcclxufTtcclxudmFyIGNoZWNrVXBkYXRlPWZ1bmN0aW9uKHVybCxmbixjYikge1xyXG5cdGlmICghdXJsKSB7XHJcblx0XHRjYihmYWxzZSk7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cdGdldF9kYXRlKHVybCxmdW5jdGlvbihkKXtcclxuXHRcdEFQSS5mcy5yb290LmdldEZpbGUoZm4sIHtjcmVhdGU6IGZhbHNlLCBleGNsdXNpdmU6IGZhbHNlfSwgZnVuY3Rpb24oZmlsZUVudHJ5KSB7XHJcblx0XHRcdGZpbGVFbnRyeS5nZXRNZXRhZGF0YShmdW5jdGlvbihtZXRhZGF0YSl7XHJcblx0XHRcdFx0dmFyIGxvY2FsRGF0ZT1EYXRlLnBhcnNlKG1ldGFkYXRhLm1vZGlmaWNhdGlvblRpbWUpO1xyXG5cdFx0XHRcdHZhciB1cmxEYXRlPURhdGUucGFyc2UoZCk7XHJcblx0XHRcdFx0Y2IodXJsRGF0ZT5sb2NhbERhdGUpO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0sZnVuY3Rpb24oKXtcclxuXHRcdFx0Y2IoZmFsc2UpO1xyXG5cdFx0fSk7XHJcblx0fSk7XHJcbn1cclxudmFyIGRvd25sb2FkPWZ1bmN0aW9uKHVybCxmbixjYixzdGF0dXNjYixjb250ZXh0KSB7XHJcblx0IHZhciB0b3RhbHNpemU9MCxiYXRjaGVzPW51bGwsd3JpdHRlbj0wO1xyXG5cdCB2YXIgZmlsZUVudHJ5PTAsIGZpbGVXcml0ZXI9MDtcclxuXHQgdmFyIGNyZWF0ZUJhdGNoZXM9ZnVuY3Rpb24oc2l6ZSkge1xyXG5cdFx0dmFyIGJ5dGVzPTEwMjQqMTAyNCwgb3V0PVtdO1xyXG5cdFx0dmFyIGI9TWF0aC5mbG9vcihzaXplIC8gYnl0ZXMpO1xyXG5cdFx0dmFyIGxhc3Q9c2l6ZSAlYnl0ZXM7XHJcblx0XHRmb3IgKHZhciBpPTA7aTw9YjtpKyspIHtcclxuXHRcdFx0b3V0LnB1c2goaSpieXRlcyk7XHJcblx0XHR9XHJcblx0XHRvdXQucHVzaChiKmJ5dGVzK2xhc3QpO1xyXG5cdFx0cmV0dXJuIG91dDtcclxuXHQgfVxyXG5cdCB2YXIgZmluaXNoPWZ1bmN0aW9uKCkge1xyXG5cdFx0IHJtKGZuLGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0ZmlsZUVudHJ5Lm1vdmVUbyhmaWxlRW50cnkuZmlsZXN5c3RlbS5yb290LCBmbixmdW5jdGlvbigpe1xyXG5cdFx0XHRcdFx0c2V0VGltZW91dCggY2IuYmluZChjb250ZXh0LGZhbHNlKSAsIDApIDsgXHJcblx0XHRcdFx0fSxmdW5jdGlvbihlKXtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiZmFpbGVkXCIsZSlcclxuXHRcdFx0XHR9KTtcclxuXHRcdCB9LHRoaXMpOyBcclxuXHQgfTtcclxuXHRcdHZhciB0ZW1wZm49XCJ0ZW1wLmtkYlwiO1xyXG5cdFx0dmFyIGJhdGNoPWZ1bmN0aW9uKGIpIHtcclxuXHRcdHZhciBhYm9ydD1mYWxzZTtcclxuXHRcdHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuXHRcdHZhciByZXF1ZXN0dXJsPXVybCtcIj9cIitNYXRoLnJhbmRvbSgpO1xyXG5cdFx0eGhyLm9wZW4oJ2dldCcsIHJlcXVlc3R1cmwsIHRydWUpO1xyXG5cdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoJ1JhbmdlJywgJ2J5dGVzPScrYmF0Y2hlc1tiXSsnLScrKGJhdGNoZXNbYisxXS0xKSk7XHJcblx0XHR4aHIucmVzcG9uc2VUeXBlID0gJ2Jsb2InOyAgICBcclxuXHRcdHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XHJcblx0XHRcdHZhciBibG9iPXRoaXMucmVzcG9uc2U7XHJcblx0XHRcdGZpbGVFbnRyeS5jcmVhdGVXcml0ZXIoZnVuY3Rpb24oZmlsZVdyaXRlcikge1xyXG5cdFx0XHRcdGZpbGVXcml0ZXIuc2VlayhmaWxlV3JpdGVyLmxlbmd0aCk7XHJcblx0XHRcdFx0ZmlsZVdyaXRlci53cml0ZShibG9iKTtcclxuXHRcdFx0XHR3cml0dGVuKz1ibG9iLnNpemU7XHJcblx0XHRcdFx0ZmlsZVdyaXRlci5vbndyaXRlZW5kID0gZnVuY3Rpb24oZSkge1xyXG5cdFx0XHRcdFx0aWYgKHN0YXR1c2NiKSB7XHJcblx0XHRcdFx0XHRcdGFib3J0PXN0YXR1c2NiLmFwcGx5KGNvbnRleHQsWyBmaWxlV3JpdGVyLmxlbmd0aCAvIHRvdGFsc2l6ZSx0b3RhbHNpemUgXSk7XHJcblx0XHRcdFx0XHRcdGlmIChhYm9ydCkgc2V0VGltZW91dCggY2IuYmluZChjb250ZXh0LGZhbHNlKSAsIDApIDtcclxuXHRcdFx0XHQgXHR9XHJcblx0XHRcdFx0XHRiKys7XHJcblx0XHRcdFx0XHRpZiAoIWFib3J0KSB7XHJcblx0XHRcdFx0XHRcdGlmIChiPGJhdGNoZXMubGVuZ3RoLTEpIHNldFRpbWVvdXQoYmF0Y2guYmluZChjb250ZXh0LGIpLDApO1xyXG5cdFx0XHRcdFx0XHRlbHNlICAgICAgICAgICAgICAgICAgICBmaW5pc2goKTtcclxuXHRcdFx0XHQgXHR9XHJcblx0XHRcdCBcdH07XHJcblx0XHRcdH0sIGNvbnNvbGUuZXJyb3IpO1xyXG5cdFx0fSxmYWxzZSk7XHJcblx0XHR4aHIuc2VuZCgpO1xyXG5cdH1cclxuXHJcblx0Z2V0X3NpemUodXJsLGZ1bmN0aW9uKHNpemUpe1xyXG5cdFx0dG90YWxzaXplPXNpemU7XHJcblx0XHRpZiAoIXNpemUpIHtcclxuXHRcdFx0aWYgKGNiKSBjYi5hcHBseShjb250ZXh0LFtmYWxzZV0pO1xyXG5cdFx0fSBlbHNlIHsvL3JlYWR5IHRvIGRvd25sb2FkXHJcblx0XHRcdHJtKHRlbXBmbixmdW5jdGlvbigpe1xyXG5cdFx0XHRcdCBiYXRjaGVzPWNyZWF0ZUJhdGNoZXMoc2l6ZSk7XHJcblx0XHRcdFx0IGlmIChzdGF0dXNjYikgc3RhdHVzY2IuYXBwbHkoY29udGV4dCxbIDAsIHRvdGFsc2l6ZSBdKTtcclxuXHRcdFx0XHQgQVBJLmZzLnJvb3QuZ2V0RmlsZSh0ZW1wZm4sIHtjcmVhdGU6IDEsIGV4Y2x1c2l2ZTogZmFsc2V9LCBmdW5jdGlvbihfZmlsZUVudHJ5KSB7XHJcblx0XHRcdFx0XHRcdFx0ZmlsZUVudHJ5PV9maWxlRW50cnk7XHJcblx0XHRcdFx0XHRcdGJhdGNoKDApO1xyXG5cdFx0XHRcdCB9KTtcclxuXHRcdFx0fSx0aGlzKTtcclxuXHRcdH1cclxuXHR9KTtcclxufVxyXG5cclxudmFyIHJlYWRGaWxlPWZ1bmN0aW9uKGZpbGVuYW1lLGNiLGNvbnRleHQpIHtcclxuXHRBUEkuZnMucm9vdC5nZXRGaWxlKGZpbGVuYW1lLCBmdW5jdGlvbihmaWxlRW50cnkpIHtcclxuXHRcdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcblx0XHRcdHJlYWRlci5vbmxvYWRlbmQgPSBmdW5jdGlvbihlKSB7XHJcblx0XHRcdFx0XHRpZiAoY2IpIGNiLmFwcGx5KGNiLFt0aGlzLnJlc3VsdF0pO1xyXG5cdFx0XHRcdH07ICAgICAgICAgICAgXHJcblx0fSwgY29uc29sZS5lcnJvcik7XHJcbn1cclxudmFyIHdyaXRlRmlsZT1mdW5jdGlvbihmaWxlbmFtZSxidWYsY2IsY29udGV4dCl7XHJcblx0QVBJLmZzLnJvb3QuZ2V0RmlsZShmaWxlbmFtZSwge2NyZWF0ZTogdHJ1ZSwgZXhjbHVzaXZlOiB0cnVlfSwgZnVuY3Rpb24oZmlsZUVudHJ5KSB7XHJcblx0XHRcdGZpbGVFbnRyeS5jcmVhdGVXcml0ZXIoZnVuY3Rpb24oZmlsZVdyaXRlcikge1xyXG5cdFx0XHRcdGZpbGVXcml0ZXIud3JpdGUoYnVmKTtcclxuXHRcdFx0XHRmaWxlV3JpdGVyLm9ud3JpdGVlbmQgPSBmdW5jdGlvbihlKSB7XHJcblx0XHRcdFx0XHRpZiAoY2IpIGNiLmFwcGx5KGNiLFtidWYuYnl0ZUxlbmd0aF0pO1xyXG5cdFx0XHRcdH07ICAgICAgICAgICAgXHJcblx0XHRcdH0sIGNvbnNvbGUuZXJyb3IpO1xyXG5cdH0sIGNvbnNvbGUuZXJyb3IpO1xyXG59XHJcblxyXG52YXIgcmVhZGRpcj1mdW5jdGlvbihjYixjb250ZXh0KSB7XHJcblx0dmFyIGRpclJlYWRlciA9IEFQSS5mcy5yb290LmNyZWF0ZVJlYWRlcigpO1xyXG5cdHZhciBvdXQ9W10sdGhhdD10aGlzO1xyXG5cdGRpclJlYWRlci5yZWFkRW50cmllcyhmdW5jdGlvbihlbnRyaWVzKSB7XHJcblx0XHRpZiAoZW50cmllcy5sZW5ndGgpIHtcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDAsIGVudHJ5OyBlbnRyeSA9IGVudHJpZXNbaV07ICsraSkge1xyXG5cdFx0XHRcdGlmIChlbnRyeS5pc0ZpbGUpIHtcclxuXHRcdFx0XHRcdG91dC5wdXNoKFtlbnRyeS5uYW1lLGVudHJ5LnRvVVJMID8gZW50cnkudG9VUkwoKSA6IGVudHJ5LnRvVVJJKCldKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdEFQSS5maWxlcz1vdXQ7XHJcblx0XHRpZiAoY2IpIGNiLmFwcGx5KGNvbnRleHQsW291dF0pO1xyXG5cdH0sIGZ1bmN0aW9uKCl7XHJcblx0XHRpZiAoY2IpIGNiLmFwcGx5KGNvbnRleHQsW251bGxdKTtcclxuXHR9KTtcclxufVxyXG52YXIgZ2V0RmlsZVVSTD1mdW5jdGlvbihmaWxlbmFtZSkge1xyXG5cdGlmICghQVBJLmZpbGVzICkgcmV0dXJuIG51bGw7XHJcblx0dmFyIGZpbGU9IEFQSS5maWxlcy5maWx0ZXIoZnVuY3Rpb24oZil7cmV0dXJuIGZbMF09PWZpbGVuYW1lfSk7XHJcblx0aWYgKGZpbGUubGVuZ3RoKSByZXR1cm4gZmlsZVswXVsxXTtcclxufVxyXG52YXIgcm09ZnVuY3Rpb24oZmlsZW5hbWUsY2IsY29udGV4dCkge1xyXG5cdHZhciB1cmw9Z2V0RmlsZVVSTChmaWxlbmFtZSk7XHJcblx0aWYgKHVybCkgcm1VUkwodXJsLGNiLGNvbnRleHQpO1xyXG5cdGVsc2UgaWYgKGNiKSBjYi5hcHBseShjb250ZXh0LFtmYWxzZV0pO1xyXG59XHJcblxyXG52YXIgcm1VUkw9ZnVuY3Rpb24oZmlsZW5hbWUsY2IsY29udGV4dCkge1xyXG5cdHdlYmtpdFJlc29sdmVMb2NhbEZpbGVTeXN0ZW1VUkwoZmlsZW5hbWUsIGZ1bmN0aW9uKGZpbGVFbnRyeSkge1xyXG5cdFx0ZmlsZUVudHJ5LnJlbW92ZShmdW5jdGlvbigpIHtcclxuXHRcdFx0aWYgKGNiKSBjYi5hcHBseShjb250ZXh0LFt0cnVlXSk7XHJcblx0XHR9LCBjb25zb2xlLmVycm9yKTtcclxuXHR9LCAgZnVuY3Rpb24oZSl7XHJcblx0XHRpZiAoY2IpIGNiLmFwcGx5KGNvbnRleHQsW2ZhbHNlXSk7Ly9ubyBzdWNoIGZpbGVcclxuXHR9KTtcclxufVxyXG5mdW5jdGlvbiBlcnJvckhhbmRsZXIoZSkge1xyXG5cdGNvbnNvbGUuZXJyb3IoJ0Vycm9yOiAnICtlLm5hbWUrIFwiIFwiK2UubWVzc2FnZSk7XHJcbn1cclxudmFyIGluaXRmcz1mdW5jdGlvbihncmFudGVkQnl0ZXMsY2IsY29udGV4dCkge1xyXG5cdHdlYmtpdFJlcXVlc3RGaWxlU3lzdGVtKFBFUlNJU1RFTlQsIGdyYW50ZWRCeXRlcywgIGZ1bmN0aW9uKGZzKSB7XHJcblx0XHRBUEkuZnM9ZnM7XHJcblx0XHRBUEkucXVvdGE9Z3JhbnRlZEJ5dGVzO1xyXG5cdFx0cmVhZGRpcihmdW5jdGlvbigpe1xyXG5cdFx0XHRBUEkuaW5pdGlhbGl6ZWQ9dHJ1ZTtcclxuXHRcdFx0Y2IuYXBwbHkoY29udGV4dCxbZ3JhbnRlZEJ5dGVzLGZzXSk7XHJcblx0XHR9LGNvbnRleHQpO1xyXG5cdH0sIGVycm9ySGFuZGxlcik7XHJcbn1cclxudmFyIGluaXQ9ZnVuY3Rpb24ocXVvdGEsY2IsY29udGV4dCkge1xyXG5cdG5hdmlnYXRvci53ZWJraXRQZXJzaXN0ZW50U3RvcmFnZS5yZXF1ZXN0UXVvdGEocXVvdGEsIFxyXG5cdFx0XHRmdW5jdGlvbihncmFudGVkQnl0ZXMpIHtcclxuXHRcdFx0XHRpbml0ZnMoZ3JhbnRlZEJ5dGVzLGNiLGNvbnRleHQpO1xyXG5cdFx0fSwgZXJyb3JIYW5kbGVyXHJcblx0KTtcclxufVxyXG52YXIgcXVlcnlRdW90YT1mdW5jdGlvbihjYixjb250ZXh0KSB7XHJcblx0dmFyIHRoYXQ9dGhpcztcclxuXHRuYXZpZ2F0b3Iud2Via2l0UGVyc2lzdGVudFN0b3JhZ2UucXVlcnlVc2FnZUFuZFF1b3RhKCBcclxuXHQgZnVuY3Rpb24odXNhZ2UscXVvdGEpe1xyXG5cdFx0XHRpbml0ZnMocXVvdGEsZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRjYi5hcHBseShjb250ZXh0LFt1c2FnZSxxdW90YV0pO1xyXG5cdFx0XHR9LGNvbnRleHQpO1xyXG5cdH0pO1xyXG59XHJcbnZhciBBUEk9e1xyXG5cdGluaXQ6aW5pdFxyXG5cdCxyZWFkZGlyOnJlYWRkaXJcclxuXHQsY2hlY2tVcGRhdGU6Y2hlY2tVcGRhdGVcclxuXHQscm06cm1cclxuXHQscm1VUkw6cm1VUkxcclxuXHQsZ2V0RmlsZVVSTDpnZXRGaWxlVVJMXHJcblx0LHdyaXRlRmlsZTp3cml0ZUZpbGVcclxuXHQscmVhZEZpbGU6cmVhZEZpbGVcclxuXHQsZG93bmxvYWQ6ZG93bmxvYWRcclxuXHQsZ2V0X2hlYWQ6Z2V0X2hlYWRcclxuXHQsZ2V0X2RhdGU6Z2V0X2RhdGVcclxuXHQsZ2V0X3NpemU6Z2V0X3NpemVcclxuXHQsZ2V0RG93bmxvYWRTaXplOmdldF9zaXplXHJcblx0LHF1ZXJ5UXVvdGE6cXVlcnlRdW90YVxyXG59XHJcbm1vZHVsZS5leHBvcnRzPUFQSTsiLCJ2YXIgaHRtbDVmcz1yZXF1aXJlKFwiLi9odG1sNWZzXCIpO1xyXG52YXIgRT1SZWFjdC5jcmVhdGVFbGVtZW50O1xyXG5cclxudmFyIGh0bWxmcyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuXHRnZXRJbml0aWFsU3RhdGU6ZnVuY3Rpb24oKSB7IFxyXG5cdFx0cmV0dXJuIHtyZWFkeTpmYWxzZSwgcXVvdGE6MCx1c2FnZTowLEluaXRpYWxpemVkOmZhbHNlLGF1dG9jbG9zZTp0aGlzLnByb3BzLmF1dG9jbG9zZX07XHJcblx0fSxcclxuXHRpbml0RmlsZXN5c3RlbTpmdW5jdGlvbigpIHtcclxuXHRcdHZhciBxdW90YT10aGlzLnByb3BzLnF1b3RhfHwxMDI0KjEwMjQqMTI4OyAvLyBkZWZhdWx0IDEyOE1CXHJcblx0XHRxdW90YT1wYXJzZUludChxdW90YSk7XHJcblx0XHRodG1sNWZzLmluaXQocXVvdGEsZnVuY3Rpb24ocSl7XHJcblx0XHRcdHRoaXMuZGlhbG9nPWZhbHNlO1xyXG5cdFx0XHQkKHRoaXMucmVmcy5kaWFsb2cxLmdldERPTU5vZGUoKSkubW9kYWwoJ2hpZGUnKTtcclxuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7cXVvdGE6cSxhdXRvY2xvc2U6dHJ1ZX0pO1xyXG5cdFx0fSx0aGlzKTtcclxuXHR9LFxyXG5cdHdlbGNvbWU6ZnVuY3Rpb24oKSB7XHJcblx0XHRyZXR1cm4gKFxyXG5cdFx0RShcImRpdlwiLCB7cmVmOiBcImRpYWxvZzFcIiwgY2xhc3NOYW1lOiBcIm1vZGFsIGZhZGVcIiwgaWQ6IFwibXlNb2RhbFwiLCBcImRhdGEtYmFja2Ryb3BcIjogXCJzdGF0aWNcIn0sIFxyXG5cdFx0ICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1kaWFsb2dcIn0sIFxyXG5cdFx0ICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWNvbnRlbnRcIn0sIFxyXG5cdFx0ICAgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtaGVhZGVyXCJ9LCBcclxuXHRcdCAgICAgICAgICBFKFwiaDRcIiwge2NsYXNzTmFtZTogXCJtb2RhbC10aXRsZVwifSwgXCJXZWxjb21lXCIpXHJcblx0XHQgICAgICAgICksIFxyXG5cdFx0ICAgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtYm9keVwifSwgXHJcblx0XHQgICAgICAgICAgXCJCcm93c2VyIHdpbGwgYXNrIGZvciB5b3VyIGNvbmZpcm1hdGlvbi5cIlxyXG5cdFx0ICAgICAgICApLCBcclxuXHRcdCAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWZvb3RlclwifSwgXHJcblx0XHQgICAgICAgICAgRShcImJ1dHRvblwiLCB7b25DbGljazogdGhpcy5pbml0RmlsZXN5c3RlbSwgdHlwZTogXCJidXR0b25cIiwgXHJcblx0XHQgICAgICAgICAgICBjbGFzc05hbWU6IFwiYnRuIGJ0bi1wcmltYXJ5XCJ9LCBcIkluaXRpYWxpemUgRmlsZSBTeXN0ZW1cIilcclxuXHRcdCAgICAgICAgKVxyXG5cdFx0ICAgICAgKVxyXG5cdFx0ICAgIClcclxuXHRcdCAgKVxyXG5cdFx0ICk7XHJcblx0fSxcclxuXHRyZW5kZXJEZWZhdWx0OmZ1bmN0aW9uKCl7XHJcblx0XHR2YXIgdXNlZD1NYXRoLmZsb29yKHRoaXMuc3RhdGUudXNhZ2UvdGhpcy5zdGF0ZS5xdW90YSAqMTAwKTtcclxuXHRcdHZhciBtb3JlPWZ1bmN0aW9uKCkge1xyXG5cdFx0XHRpZiAodXNlZD41MCkgcmV0dXJuIEUoXCJidXR0b25cIiwge3R5cGU6IFwiYnV0dG9uXCIsIGNsYXNzTmFtZTogXCJidG4gYnRuLXByaW1hcnlcIn0sIFwiQWxsb2NhdGUgTW9yZVwiKTtcclxuXHRcdFx0ZWxzZSBudWxsO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIChcclxuXHRcdEUoXCJkaXZcIiwge3JlZjogXCJkaWFsb2cxXCIsIGNsYXNzTmFtZTogXCJtb2RhbCBmYWRlXCIsIGlkOiBcIm15TW9kYWxcIiwgXCJkYXRhLWJhY2tkcm9wXCI6IFwic3RhdGljXCJ9LCBcclxuXHRcdCAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtZGlhbG9nXCJ9LCBcclxuXHRcdCAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJtb2RhbC1jb250ZW50XCJ9LCBcclxuXHRcdCAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWhlYWRlclwifSwgXHJcblx0XHQgICAgICAgICAgRShcImg0XCIsIHtjbGFzc05hbWU6IFwibW9kYWwtdGl0bGVcIn0sIFwiU2FuZGJveCBGaWxlIFN5c3RlbVwiKVxyXG5cdFx0ICAgICAgICApLCBcclxuXHRcdCAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWJvZHlcIn0sIFxyXG5cdFx0ICAgICAgICAgIEUoXCJkaXZcIiwge2NsYXNzTmFtZTogXCJwcm9ncmVzc1wifSwgXHJcblx0XHQgICAgICAgICAgICBFKFwiZGl2XCIsIHtjbGFzc05hbWU6IFwicHJvZ3Jlc3MtYmFyXCIsIHJvbGU6IFwicHJvZ3Jlc3NiYXJcIiwgc3R5bGU6IHt3aWR0aDogdXNlZCtcIiVcIn19LCBcclxuXHRcdCAgICAgICAgICAgICAgIHVzZWQsIFwiJVwiXHJcblx0XHQgICAgICAgICAgICApXHJcblx0XHQgICAgICAgICAgKSwgXHJcblx0XHQgICAgICAgICAgRShcInNwYW5cIiwgbnVsbCwgdGhpcy5zdGF0ZS5xdW90YSwgXCIgdG90YWwgLCBcIiwgdGhpcy5zdGF0ZS51c2FnZSwgXCIgaW4gdXNlZFwiKVxyXG5cdFx0ICAgICAgICApLCBcclxuXHRcdCAgICAgICAgRShcImRpdlwiLCB7Y2xhc3NOYW1lOiBcIm1vZGFsLWZvb3RlclwifSwgXHJcblx0XHQgICAgICAgICAgRShcImJ1dHRvblwiLCB7b25DbGljazogdGhpcy5kaXNtaXNzLCB0eXBlOiBcImJ1dHRvblwiLCBjbGFzc05hbWU6IFwiYnRuIGJ0bi1kZWZhdWx0XCIsIFwiZGF0YS1kaXNtaXNzXCI6IFwibW9kYWxcIn0sIFwiQ2xvc2VcIiksIFxyXG5cdFx0ICAgICAgICAgIG1vcmUoKVxyXG5cdFx0ICAgICAgICApXHJcblx0XHQgICAgICApXHJcblx0XHQgICAgKVxyXG5cdFx0ICApXHJcblx0XHQgICk7XHJcblx0fSxcclxuXHRkaXNtaXNzOmZ1bmN0aW9uKCkge1xyXG5cdFx0dmFyIHRoYXQ9dGhpcztcclxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0dGhhdC5wcm9wcy5vblJlYWR5KHRoYXQuc3RhdGUucXVvdGEsdGhhdC5zdGF0ZS51c2FnZSk7XHRcclxuXHRcdH0sMCk7XHJcblx0fSxcclxuXHRxdWVyeVF1b3RhOmZ1bmN0aW9uKCkge1xyXG5cdFx0aWYgKGtzYW5hZ2FwLnBsYXRmb3JtPT1cImNocm9tZVwiKSB7XHJcblx0XHRcdGh0bWw1ZnMucXVlcnlRdW90YShmdW5jdGlvbih1c2FnZSxxdW90YSl7XHJcblx0XHRcdFx0dGhpcy5zZXRTdGF0ZSh7dXNhZ2U6dXNhZ2UscXVvdGE6cXVvdGEsaW5pdGlhbGl6ZWQ6dHJ1ZX0pO1xyXG5cdFx0XHR9LHRoaXMpO1x0XHRcdFxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7dXNhZ2U6MzMzLHF1b3RhOjEwMDAqMTAwMCoxMDI0LGluaXRpYWxpemVkOnRydWUsYXV0b2Nsb3NlOnRydWV9KTtcclxuXHRcdH1cclxuXHR9LFxyXG5cdHJlbmRlcjpmdW5jdGlvbigpIHtcclxuXHRcdHZhciB0aGF0PXRoaXM7XHJcblx0XHRpZiAoIXRoaXMuc3RhdGUucXVvdGEgfHwgdGhpcy5zdGF0ZS5xdW90YTx0aGlzLnByb3BzLnF1b3RhKSB7XHJcblx0XHRcdGlmICh0aGlzLnN0YXRlLmluaXRpYWxpemVkKSB7XHJcblx0XHRcdFx0dGhpcy5kaWFsb2c9dHJ1ZTtcclxuXHRcdFx0XHRyZXR1cm4gdGhpcy53ZWxjb21lKCk7XHRcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gRShcInNwYW5cIiwgbnVsbCwgXCJjaGVja2luZyBxdW90YVwiKTtcclxuXHRcdFx0fVx0XHRcdFxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYgKCF0aGlzLnN0YXRlLmF1dG9jbG9zZSkge1xyXG5cdFx0XHRcdHRoaXMuZGlhbG9nPXRydWU7XHJcblx0XHRcdFx0cmV0dXJuIHRoaXMucmVuZGVyRGVmYXVsdCgpOyBcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLmRpc21pc3MoKTtcclxuXHRcdFx0dGhpcy5kaWFsb2c9ZmFsc2U7XHJcblx0XHRcdHJldHVybiBudWxsO1xyXG5cdFx0fVxyXG5cdH0sXHJcblx0Y29tcG9uZW50RGlkTW91bnQ6ZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAoIXRoaXMuc3RhdGUucXVvdGEpIHtcclxuXHRcdFx0dGhpcy5xdWVyeVF1b3RhKCk7XHJcblxyXG5cdFx0fTtcclxuXHR9LFxyXG5cdGNvbXBvbmVudERpZFVwZGF0ZTpmdW5jdGlvbigpIHtcclxuXHRcdGlmICh0aGlzLmRpYWxvZykgJCh0aGlzLnJlZnMuZGlhbG9nMS5nZXRET01Ob2RlKCkpLm1vZGFsKCdzaG93Jyk7XHJcblx0fVxyXG59KTtcclxuXHJcbm1vZHVsZS5leHBvcnRzPWh0bWxmczsiLCJ2YXIga3NhbmE9e1wicGxhdGZvcm1cIjpcInJlbW90ZVwifTtcclxuaWYgKHR5cGVvZiB3aW5kb3chPVwidW5kZWZpbmVkXCIpIHtcclxuXHR3aW5kb3cua3NhbmE9a3NhbmE7XHJcblx0aWYgKHR5cGVvZiBrc2FuYWdhcD09XCJ1bmRlZmluZWRcIikge1xyXG5cdFx0d2luZG93LmtzYW5hZ2FwPXJlcXVpcmUoXCIuL2tzYW5hZ2FwXCIpOyAvL2NvbXBhdGlibGUgbGF5ZXIgd2l0aCBtb2JpbGVcclxuXHR9XHJcbn1cclxuaWYgKHR5cGVvZiBwcm9jZXNzICE9XCJ1bmRlZmluZWRcIikge1xyXG5cdGlmIChwcm9jZXNzLnZlcnNpb25zICYmIHByb2Nlc3MudmVyc2lvbnNbXCJub2RlLXdlYmtpdFwiXSkge1xyXG4gIFx0XHRpZiAodHlwZW9mIG5vZGVSZXF1aXJlIT1cInVuZGVmaW5lZFwiKSBrc2FuYS5yZXF1aXJlPW5vZGVSZXF1aXJlO1xyXG4gIFx0XHRrc2FuYS5wbGF0Zm9ybT1cIm5vZGUtd2Via2l0XCI7XHJcbiAgXHRcdHdpbmRvdy5rc2FuYWdhcC5wbGF0Zm9ybT1cIm5vZGUtd2Via2l0XCI7XHJcblx0XHR2YXIga3NhbmFqcz1yZXF1aXJlKFwiZnNcIikucmVhZEZpbGVTeW5jKFwia3NhbmEuanNcIixcInV0ZjhcIikudHJpbSgpO1xyXG5cdFx0a3NhbmEuanM9SlNPTi5wYXJzZShrc2FuYWpzLnN1YnN0cmluZygxNCxrc2FuYWpzLmxlbmd0aC0xKSk7XHJcblx0XHR3aW5kb3cua2ZzPXJlcXVpcmUoXCIuL2tmc1wiKTtcclxuICBcdH1cclxufSBlbHNlIGlmICh0eXBlb2YgY2hyb21lIT1cInVuZGVmaW5lZFwiKXsvL30gJiYgY2hyb21lLmZpbGVTeXN0ZW0pe1xyXG4vL1x0d2luZG93LmtzYW5hZ2FwPXJlcXVpcmUoXCIuL2tzYW5hZ2FwXCIpOyAvL2NvbXBhdGlibGUgbGF5ZXIgd2l0aCBtb2JpbGVcclxuXHR3aW5kb3cua3NhbmFnYXAucGxhdGZvcm09XCJjaHJvbWVcIjtcclxuXHR3aW5kb3cua2ZzPXJlcXVpcmUoXCIuL2tmc19odG1sNVwiKTtcclxuXHRyZXF1aXJlKFwiLi9saXZlcmVsb2FkXCIpKCk7XHJcblx0a3NhbmEucGxhdGZvcm09XCJjaHJvbWVcIjtcclxufSBlbHNlIHtcclxuXHRpZiAodHlwZW9mIGtzYW5hZ2FwIT1cInVuZGVmaW5lZFwiICYmIHR5cGVvZiBmcyE9XCJ1bmRlZmluZWRcIikgey8vbW9iaWxlXHJcblx0XHR2YXIga3NhbmFqcz1mcy5yZWFkRmlsZVN5bmMoXCJrc2FuYS5qc1wiLFwidXRmOFwiKS50cmltKCk7IC8vYW5kcm9pZCBleHRyYSBcXG4gYXQgdGhlIGVuZFxyXG5cdFx0a3NhbmEuanM9SlNPTi5wYXJzZShrc2FuYWpzLnN1YnN0cmluZygxNCxrc2FuYWpzLmxlbmd0aC0xKSk7XHJcblx0XHRrc2FuYS5wbGF0Zm9ybT1rc2FuYWdhcC5wbGF0Zm9ybTtcclxuXHRcdGlmICh0eXBlb2Yga3NhbmFnYXAuYW5kcm9pZCAhPVwidW5kZWZpbmVkXCIpIHtcclxuXHRcdFx0a3NhbmEucGxhdGZvcm09XCJhbmRyb2lkXCI7XHJcblx0XHR9XHJcblx0fVxyXG59XHJcbnZhciB0aW1lcj1udWxsO1xyXG52YXIgYm9vdD1mdW5jdGlvbihhcHBJZCxjYikge1xyXG5cdGtzYW5hLmFwcElkPWFwcElkO1xyXG5cdGlmIChrc2FuYWdhcC5wbGF0Zm9ybT09XCJjaHJvbWVcIikgeyAvL25lZWQgdG8gd2FpdCBmb3IganNvbnAga3NhbmEuanNcclxuXHRcdHRpbWVyPXNldEludGVydmFsKGZ1bmN0aW9uKCl7XHJcblx0XHRcdGlmIChrc2FuYS5yZWFkeSl7XHJcblx0XHRcdFx0Y2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcblx0XHRcdFx0aWYgKGtzYW5hLmpzICYmIGtzYW5hLmpzLmZpbGVzICYmIGtzYW5hLmpzLmZpbGVzLmxlbmd0aCkge1xyXG5cdFx0XHRcdFx0cmVxdWlyZShcIi4vaW5zdGFsbGtkYlwiKShrc2FuYS5qcyxjYik7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGNiKCk7XHRcdFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fSwzMDApO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRjYigpO1xyXG5cdH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHM9e2Jvb3Q6Ym9vdFxyXG5cdCxodG1sZnM6cmVxdWlyZShcIi4vaHRtbGZzXCIpXHJcblx0LGh0bWw1ZnM6cmVxdWlyZShcIi4vaHRtbDVmc1wiKVxyXG5cdCxsaXZldXBkYXRlOnJlcXVpcmUoXCIuL2xpdmV1cGRhdGVcIilcclxuXHQsZmlsZWluc3RhbGxlcjpyZXF1aXJlKFwiLi9maWxlaW5zdGFsbGVyXCIpXHJcblx0LGRvd25sb2FkZXI6cmVxdWlyZShcIi4vZG93bmxvYWRlclwiKVxyXG5cdCxpbnN0YWxsa2RiOnJlcXVpcmUoXCIuL2luc3RhbGxrZGJcIilcclxufTsiLCJ2YXIgRmlsZWluc3RhbGxlcj1yZXF1aXJlKFwiLi9maWxlaW5zdGFsbGVyXCIpO1xyXG5cclxudmFyIGdldFJlcXVpcmVfa2RiPWZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHJlcXVpcmVkPVtdO1xyXG4gICAga3NhbmEuanMuZmlsZXMubWFwKGZ1bmN0aW9uKGYpe1xyXG4gICAgICBpZiAoZi5pbmRleE9mKFwiLmtkYlwiKT09Zi5sZW5ndGgtNCkge1xyXG4gICAgICAgIHZhciBzbGFzaD1mLmxhc3RJbmRleE9mKFwiL1wiKTtcclxuICAgICAgICBpZiAoc2xhc2g+LTEpIHtcclxuICAgICAgICAgIHZhciBkYmlkPWYuc3Vic3RyaW5nKHNsYXNoKzEsZi5sZW5ndGgtNCk7XHJcbiAgICAgICAgICByZXF1aXJlZC5wdXNoKHt1cmw6ZixkYmlkOmRiaWQsZmlsZW5hbWU6ZGJpZCtcIi5rZGJcIn0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB2YXIgZGJpZD1mLnN1YnN0cmluZygwLGYubGVuZ3RoLTQpO1xyXG4gICAgICAgICAgcmVxdWlyZWQucHVzaCh7dXJsOmtzYW5hLmpzLmJhc2V1cmwrZixkYmlkOmRiaWQsZmlsZW5hbWU6Zn0pO1xyXG4gICAgICAgIH0gICAgICAgIFxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiByZXF1aXJlZDtcclxufVxyXG52YXIgY2FsbGJhY2s9bnVsbDtcclxudmFyIG9uUmVhZHk9ZnVuY3Rpb24oKSB7XHJcblx0Y2FsbGJhY2soKTtcclxufVxyXG52YXIgb3BlbkZpbGVpbnN0YWxsZXI9ZnVuY3Rpb24oa2VlcCkge1xyXG5cdHZhciByZXF1aXJlX2tkYj1nZXRSZXF1aXJlX2tkYigpLm1hcChmdW5jdGlvbihkYil7XHJcblx0ICByZXR1cm4ge1xyXG5cdCAgICB1cmw6d2luZG93LmxvY2F0aW9uLm9yaWdpbit3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUrZGIuZGJpZCtcIi5rZGJcIixcclxuXHQgICAgZGJkYjpkYi5kYmlkLFxyXG5cdCAgICBmaWxlbmFtZTpkYi5maWxlbmFtZVxyXG5cdCAgfVxyXG5cdH0pXHJcblx0cmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmlsZWluc3RhbGxlciwge3F1b3RhOiBcIjUxMk1cIiwgYXV0b2Nsb3NlOiAha2VlcCwgbmVlZGVkOiByZXF1aXJlX2tkYiwgXHJcblx0ICAgICAgICAgICAgICAgICBvblJlYWR5OiBvblJlYWR5fSk7XHJcbn1cclxudmFyIGluc3RhbGxrZGI9ZnVuY3Rpb24oa3NhbmFqcyxjYixjb250ZXh0KSB7XHJcblx0Y29uc29sZS5sb2coa3NhbmFqcy5maWxlcyk7XHJcblx0UmVhY3QucmVuZGVyKG9wZW5GaWxlaW5zdGFsbGVyKCksZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYWluXCIpKTtcclxuXHRjYWxsYmFjaz1jYjtcclxufVxyXG5tb2R1bGUuZXhwb3J0cz1pbnN0YWxsa2RiOyIsIi8vU2ltdWxhdGUgZmVhdHVyZSBpbiBrc2FuYWdhcFxyXG4vKiBcclxuICBydW5zIG9uIG5vZGUtd2Via2l0IG9ubHlcclxuKi9cclxuXHJcbnZhciByZWFkRGlyPWZ1bmN0aW9uKHBhdGgpIHsgLy9zaW11bGF0ZSBLc2FuYWdhcCBmdW5jdGlvblxyXG5cdHZhciBmcz1ub2RlUmVxdWlyZShcImZzXCIpO1xyXG5cdHBhdGg9cGF0aHx8XCIuLlwiO1xyXG5cdHZhciBkaXJzPVtdO1xyXG5cdGlmIChwYXRoWzBdPT1cIi5cIikge1xyXG5cdFx0aWYgKHBhdGg9PVwiLlwiKSBkaXJzPWZzLnJlYWRkaXJTeW5jKFwiLlwiKTtcclxuXHRcdGVsc2Uge1xyXG5cdFx0XHRkaXJzPWZzLnJlYWRkaXJTeW5jKFwiLi5cIik7XHJcblx0XHR9XHJcblx0fSBlbHNlIHtcclxuXHRcdGRpcnM9ZnMucmVhZGRpclN5bmMocGF0aCk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gZGlycy5qb2luKFwiXFx1ZmZmZlwiKTtcclxufVxyXG52YXIgbGlzdEFwcHM9ZnVuY3Rpb24oKSB7XHJcblx0dmFyIGZzPW5vZGVSZXF1aXJlKFwiZnNcIik7XHJcblx0dmFyIGtzYW5hanNmaWxlPWZ1bmN0aW9uKGQpIHtyZXR1cm4gXCIuLi9cIitkK1wiL2tzYW5hLmpzXCJ9O1xyXG5cdHZhciBkaXJzPWZzLnJlYWRkaXJTeW5jKFwiLi5cIikuZmlsdGVyKGZ1bmN0aW9uKGQpe1xyXG5cdFx0XHRcdHJldHVybiBmcy5zdGF0U3luYyhcIi4uL1wiK2QpLmlzRGlyZWN0b3J5KCkgJiYgZFswXSE9XCIuXCJcclxuXHRcdFx0XHQgICAmJiBmcy5leGlzdHNTeW5jKGtzYW5hanNmaWxlKGQpKTtcclxuXHR9KTtcclxuXHRcclxuXHR2YXIgb3V0PWRpcnMubWFwKGZ1bmN0aW9uKGQpe1xyXG5cdFx0dmFyIGNvbnRlbnQ9ZnMucmVhZEZpbGVTeW5jKGtzYW5hanNmaWxlKGQpLFwidXRmOFwiKTtcclxuICBcdGNvbnRlbnQ9Y29udGVudC5yZXBsYWNlKFwifSlcIixcIn1cIik7XHJcbiAgXHRjb250ZW50PWNvbnRlbnQucmVwbGFjZShcImpzb25wX2hhbmRsZXIoXCIsXCJcIik7XHJcblx0XHR2YXIgb2JqPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xyXG5cdFx0b2JqLmRiaWQ9ZDtcclxuXHRcdG9iai5wYXRoPWQ7XHJcblx0XHRyZXR1cm4gb2JqO1xyXG5cdH0pXHJcblx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KG91dCk7XHJcbn1cclxuXHJcblxyXG5cclxudmFyIGtmcz17cmVhZERpcjpyZWFkRGlyLGxpc3RBcHBzOmxpc3RBcHBzfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzPWtmczsiLCJ2YXIgcmVhZERpcj1mdW5jdGlvbigpe1xyXG5cdHJldHVybiBbXTtcclxufVxyXG52YXIgbGlzdEFwcHM9ZnVuY3Rpb24oKXtcclxuXHRyZXR1cm4gW107XHJcbn1cclxubW9kdWxlLmV4cG9ydHM9e3JlYWREaXI6cmVhZERpcixsaXN0QXBwczpsaXN0QXBwc307IiwidmFyIGFwcG5hbWU9XCJpbnN0YWxsZXJcIjtcclxudmFyIHN3aXRjaEFwcD1mdW5jdGlvbihwYXRoKSB7XHJcblx0dmFyIGZzPXJlcXVpcmUoXCJmc1wiKTtcclxuXHRwYXRoPVwiLi4vXCIrcGF0aDtcclxuXHRhcHBuYW1lPXBhdGg7XHJcblx0ZG9jdW1lbnQubG9jYXRpb24uaHJlZj0gcGF0aCtcIi9pbmRleC5odG1sXCI7IFxyXG5cdHByb2Nlc3MuY2hkaXIocGF0aCk7XHJcbn1cclxudmFyIGRvd25sb2FkZXI9e307XHJcbnZhciByb290UGF0aD1cIlwiO1xyXG5cclxudmFyIGRlbGV0ZUFwcD1mdW5jdGlvbihhcHApIHtcclxuXHRjb25zb2xlLmVycm9yKFwibm90IGFsbG93IG9uIFBDLCBkbyBpdCBpbiBGaWxlIEV4cGxvcmVyLyBGaW5kZXJcIik7XHJcbn1cclxudmFyIHVzZXJuYW1lPWZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiBcIlwiO1xyXG59XHJcbnZhciB1c2VyZW1haWw9ZnVuY3Rpb24oKSB7XHJcblx0cmV0dXJuIFwiXCJcclxufVxyXG52YXIgcnVudGltZV92ZXJzaW9uPWZ1bmN0aW9uKCkge1xyXG5cdHJldHVybiBcIjEuNFwiO1xyXG59XHJcblxyXG4vL2NvcHkgZnJvbSBsaXZldXBkYXRlXHJcbnZhciBqc29ucD1mdW5jdGlvbih1cmwsZGJpZCxjYWxsYmFjayxjb250ZXh0KSB7XHJcbiAgdmFyIHNjcmlwdD1kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImpzb25wMlwiKTtcclxuICBpZiAoc2NyaXB0KSB7XHJcbiAgICBzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xyXG4gIH1cclxuICB3aW5kb3cuanNvbnBfaGFuZGxlcj1mdW5jdGlvbihkYXRhKSB7XHJcbiAgICBpZiAodHlwZW9mIGRhdGE9PVwib2JqZWN0XCIpIHtcclxuICAgICAgZGF0YS5kYmlkPWRiaWQ7XHJcbiAgICAgIGNhbGxiYWNrLmFwcGx5KGNvbnRleHQsW2RhdGFdKTsgICAgXHJcbiAgICB9ICBcclxuICB9XHJcbiAgd2luZG93Lmpzb25wX2Vycm9yX2hhbmRsZXI9ZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKFwidXJsIHVucmVhY2hhYmxlXCIsdXJsKTtcclxuICAgIGNhbGxiYWNrLmFwcGx5KGNvbnRleHQsW251bGxdKTtcclxuICB9XHJcbiAgc2NyaXB0PWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xyXG4gIHNjcmlwdC5zZXRBdHRyaWJ1dGUoJ2lkJywgXCJqc29ucDJcIik7XHJcbiAgc2NyaXB0LnNldEF0dHJpYnV0ZSgnb25lcnJvcicsIFwianNvbnBfZXJyb3JfaGFuZGxlcigpXCIpO1xyXG4gIHVybD11cmwrJz8nKyhuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XHJcbiAgc2NyaXB0LnNldEF0dHJpYnV0ZSgnc3JjJywgdXJsKTtcclxuICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKHNjcmlwdCk7IFxyXG59XHJcblxyXG52YXIga3NhbmFnYXA9e1xyXG5cdHBsYXRmb3JtOlwibm9kZS13ZWJraXRcIixcclxuXHRzdGFydERvd25sb2FkOmRvd25sb2FkZXIuc3RhcnREb3dubG9hZCxcclxuXHRkb3dubG9hZGVkQnl0ZTpkb3dubG9hZGVyLmRvd25sb2FkZWRCeXRlLFxyXG5cdGRvd25sb2FkaW5nRmlsZTpkb3dubG9hZGVyLmRvd25sb2FkaW5nRmlsZSxcclxuXHRjYW5jZWxEb3dubG9hZDpkb3dubG9hZGVyLmNhbmNlbERvd25sb2FkLFxyXG5cdGRvbmVEb3dubG9hZDpkb3dubG9hZGVyLmRvbmVEb3dubG9hZCxcclxuXHRzd2l0Y2hBcHA6c3dpdGNoQXBwLFxyXG5cdHJvb3RQYXRoOnJvb3RQYXRoLFxyXG5cdGRlbGV0ZUFwcDogZGVsZXRlQXBwLFxyXG5cdHVzZXJuYW1lOnVzZXJuYW1lLCAvL25vdCBzdXBwb3J0IG9uIFBDXHJcblx0dXNlcmVtYWlsOnVzZXJuYW1lLFxyXG5cdHJ1bnRpbWVfdmVyc2lvbjpydW50aW1lX3ZlcnNpb24sXHJcblx0XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgcHJvY2VzcyE9XCJ1bmRlZmluZWRcIikge1xyXG5cdHZhciBrc2FuYWpzPXJlcXVpcmUoXCJmc1wiKS5yZWFkRmlsZVN5bmMoXCIuL2tzYW5hLmpzXCIsXCJ1dGY4XCIpLnRyaW0oKTtcclxuXHRkb3dubG9hZGVyPXJlcXVpcmUoXCIuL2Rvd25sb2FkZXJcIik7XHJcblx0Y29uc29sZS5sb2coa3NhbmFqcyk7XHJcblx0Ly9rc2FuYS5qcz1KU09OLnBhcnNlKGtzYW5hanMuc3Vic3RyaW5nKDE0LGtzYW5hanMubGVuZ3RoLTEpKTtcclxuXHRyb290UGF0aD1wcm9jZXNzLmN3ZCgpO1xyXG5cdHJvb3RQYXRoPXJlcXVpcmUoXCJwYXRoXCIpLnJlc29sdmUocm9vdFBhdGgsXCIuLlwiKS5yZXBsYWNlKC9cXFxcL2csXCIvXCIpKycvJztcclxuXHRrc2FuYS5yZWFkeT10cnVlO1xyXG59IGVsc2V7XHJcblx0dmFyIHVybD13aW5kb3cubG9jYXRpb24ub3JpZ2luK3dpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKFwiaW5kZXguaHRtbFwiLFwiXCIpK1wia3NhbmEuanNcIjtcclxuXHRqc29ucCh1cmwsYXBwbmFtZSxmdW5jdGlvbihkYXRhKXtcclxuXHRcdGtzYW5hLmpzPWRhdGE7XHJcblx0XHRrc2FuYS5yZWFkeT10cnVlO1xyXG5cdH0pO1xyXG59XHJcbm1vZHVsZS5leHBvcnRzPWtzYW5hZ2FwOyIsInZhciBzdGFydGVkPWZhbHNlO1xyXG52YXIgdGltZXI9bnVsbDtcclxudmFyIGJ1bmRsZWRhdGU9bnVsbDtcclxudmFyIGdldF9kYXRlPXJlcXVpcmUoXCIuL2h0bWw1ZnNcIikuZ2V0X2RhdGU7XHJcbnZhciBjaGVja0lmQnVuZGxlVXBkYXRlZD1mdW5jdGlvbigpIHtcclxuXHRnZXRfZGF0ZShcImJ1bmRsZS5qc1wiLGZ1bmN0aW9uKGRhdGUpe1xyXG5cdFx0aWYgKGJ1bmRsZWRhdGUgJiZidW5kbGVkYXRlIT1kYXRlKXtcclxuXHRcdFx0bG9jYXRpb24ucmVsb2FkKCk7XHJcblx0XHR9XHJcblx0XHRidW5kbGVkYXRlPWRhdGU7XHJcblx0fSk7XHJcbn1cclxudmFyIGxpdmVyZWxvYWQ9ZnVuY3Rpb24oKSB7XHJcblx0aWYgKHN0YXJ0ZWQpIHJldHVybjtcclxuXHJcblx0dGltZXIxPXNldEludGVydmFsKGZ1bmN0aW9uKCl7XHJcblx0XHRjaGVja0lmQnVuZGxlVXBkYXRlZCgpO1xyXG5cdH0sMjAwMCk7XHJcblx0c3RhcnRlZD10cnVlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cz1saXZlcmVsb2FkOyIsIlxyXG52YXIganNvbnA9ZnVuY3Rpb24odXJsLGRiaWQsY2FsbGJhY2ssY29udGV4dCkge1xyXG4gIHZhciBzY3JpcHQ9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJqc29ucFwiKTtcclxuICBpZiAoc2NyaXB0KSB7XHJcbiAgICBzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xyXG4gIH1cclxuICB3aW5kb3cuanNvbnBfaGFuZGxlcj1mdW5jdGlvbihkYXRhKSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKFwicmVjZWl2ZSBmcm9tIGtzYW5hLmpzXCIsZGF0YSk7XHJcbiAgICBpZiAodHlwZW9mIGRhdGE9PVwib2JqZWN0XCIpIHtcclxuICAgICAgaWYgKHR5cGVvZiBkYXRhLmRiaWQ9PVwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICBkYXRhLmRiaWQ9ZGJpZDtcclxuICAgICAgfVxyXG4gICAgICBjYWxsYmFjay5hcHBseShjb250ZXh0LFtkYXRhXSk7XHJcbiAgICB9ICBcclxuICB9XHJcblxyXG4gIHdpbmRvdy5qc29ucF9lcnJvcl9oYW5kbGVyPWZ1bmN0aW9uKCkge1xyXG4gICAgY29uc29sZS5lcnJvcihcInVybCB1bnJlYWNoYWJsZVwiLHVybCk7XHJcbiAgICBjYWxsYmFjay5hcHBseShjb250ZXh0LFtudWxsXSk7XHJcbiAgfVxyXG5cclxuICBzY3JpcHQ9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XHJcbiAgc2NyaXB0LnNldEF0dHJpYnV0ZSgnaWQnLCBcImpzb25wXCIpO1xyXG4gIHNjcmlwdC5zZXRBdHRyaWJ1dGUoJ29uZXJyb3InLCBcImpzb25wX2Vycm9yX2hhbmRsZXIoKVwiKTtcclxuICB1cmw9dXJsKyc/JysobmV3IERhdGUoKS5nZXRUaW1lKCkpO1xyXG4gIHNjcmlwdC5zZXRBdHRyaWJ1dGUoJ3NyYycsIHVybCk7XHJcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChzY3JpcHQpOyBcclxufVxyXG52YXIgcnVudGltZV92ZXJzaW9uX29rPWZ1bmN0aW9uKG1pbnJ1bnRpbWUpIHtcclxuICBpZiAoIW1pbnJ1bnRpbWUpIHJldHVybiB0cnVlOy8vbm90IG1lbnRpb25lZC5cclxuICB2YXIgbWluPXBhcnNlRmxvYXQobWlucnVudGltZSk7XHJcbiAgdmFyIHJ1bnRpbWU9cGFyc2VGbG9hdCgga3NhbmFnYXAucnVudGltZV92ZXJzaW9uKCl8fFwiMS4wXCIpO1xyXG4gIGlmIChtaW4+cnVudGltZSkgcmV0dXJuIGZhbHNlO1xyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG52YXIgbmVlZFRvVXBkYXRlPWZ1bmN0aW9uKGZyb21qc29uLHRvanNvbikge1xyXG4gIHZhciBuZWVkVXBkYXRlcz1bXTtcclxuICBmb3IgKHZhciBpPTA7aTxmcm9tanNvbi5sZW5ndGg7aSsrKSB7IFxyXG4gICAgdmFyIHRvPXRvanNvbltpXTtcclxuICAgIHZhciBmcm9tPWZyb21qc29uW2ldO1xyXG4gICAgdmFyIG5ld2ZpbGVzPVtdLG5ld2ZpbGVzaXplcz1bXSxyZW1vdmVkPVtdO1xyXG4gICAgXHJcbiAgICBpZiAoIXRvKSBjb250aW51ZTsgLy9jYW5ub3QgcmVhY2ggaG9zdFxyXG4gICAgaWYgKCFydW50aW1lX3ZlcnNpb25fb2sodG8ubWlucnVudGltZSkpIHtcclxuICAgICAgY29uc29sZS53YXJuKFwicnVudGltZSB0b28gb2xkLCBuZWVkIFwiK3RvLm1pbnJ1bnRpbWUpO1xyXG4gICAgICBjb250aW51ZTsgXHJcbiAgICB9XHJcbiAgICBpZiAoIWZyb20uZmlsZWRhdGVzKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybihcIm1pc3NpbmcgZmlsZWRhdGVzIGluIGtzYW5hLmpzIG9mIFwiK2Zyb20uZGJpZCk7XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG4gICAgZnJvbS5maWxlZGF0ZXMubWFwKGZ1bmN0aW9uKGYsaWR4KXtcclxuICAgICAgdmFyIG5ld2lkeD10by5maWxlcy5pbmRleE9mKCBmcm9tLmZpbGVzW2lkeF0pO1xyXG4gICAgICBpZiAobmV3aWR4PT0tMSkge1xyXG4gICAgICAgIC8vZmlsZSByZW1vdmVkIGluIG5ldyB2ZXJzaW9uXHJcbiAgICAgICAgcmVtb3ZlZC5wdXNoKGZyb20uZmlsZXNbaWR4XSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdmFyIGZyb21kYXRlPURhdGUucGFyc2UoZik7XHJcbiAgICAgICAgdmFyIHRvZGF0ZT1EYXRlLnBhcnNlKHRvLmZpbGVkYXRlc1tuZXdpZHhdKTtcclxuICAgICAgICBpZiAoZnJvbWRhdGU8dG9kYXRlKSB7XHJcbiAgICAgICAgICBuZXdmaWxlcy5wdXNoKCB0by5maWxlc1tuZXdpZHhdICk7XHJcbiAgICAgICAgICBuZXdmaWxlc2l6ZXMucHVzaCh0by5maWxlc2l6ZXNbbmV3aWR4XSk7XHJcbiAgICAgICAgfSAgICAgICAgXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgaWYgKG5ld2ZpbGVzLmxlbmd0aCkge1xyXG4gICAgICBmcm9tLm5ld2ZpbGVzPW5ld2ZpbGVzO1xyXG4gICAgICBmcm9tLm5ld2ZpbGVzaXplcz1uZXdmaWxlc2l6ZXM7XHJcbiAgICAgIGZyb20ucmVtb3ZlZD1yZW1vdmVkO1xyXG4gICAgICBuZWVkVXBkYXRlcy5wdXNoKGZyb20pO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gbmVlZFVwZGF0ZXM7XHJcbn1cclxudmFyIGdldFVwZGF0YWJsZXM9ZnVuY3Rpb24oYXBwcyxjYixjb250ZXh0KSB7XHJcbiAgZ2V0UmVtb3RlSnNvbihhcHBzLGZ1bmN0aW9uKGpzb25zKXtcclxuICAgIHZhciBoYXNVcGRhdGVzPW5lZWRUb1VwZGF0ZShhcHBzLGpzb25zKTtcclxuICAgIGNiLmFwcGx5KGNvbnRleHQsW2hhc1VwZGF0ZXNdKTtcclxuICB9LGNvbnRleHQpO1xyXG59XHJcbnZhciBnZXRSZW1vdGVKc29uPWZ1bmN0aW9uKGFwcHMsY2IsY29udGV4dCkge1xyXG4gIHZhciB0YXNrcXVldWU9W10sb3V0cHV0PVtdO1xyXG4gIHZhciBtYWtlY2I9ZnVuY3Rpb24oYXBwKXtcclxuICAgIHJldHVybiBmdW5jdGlvbihkYXRhKXtcclxuICAgICAgICBpZiAoIShkYXRhICYmIHR5cGVvZiBkYXRhID09J29iamVjdCcgJiYgZGF0YS5fX2VtcHR5KSkgb3V0cHV0LnB1c2goZGF0YSk7XHJcbiAgICAgICAgaWYgKCFhcHAuYmFzZXVybCkge1xyXG4gICAgICAgICAgdGFza3F1ZXVlLnNoaWZ0KHtfX2VtcHR5OnRydWV9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdmFyIHVybD1hcHAuYmFzZXVybCtcIi9rc2FuYS5qc1wiOyAgICBcclxuICAgICAgICAgIGNvbnNvbGUubG9nKHVybCk7XHJcbiAgICAgICAgICBqc29ucCggdXJsICxhcHAuZGJpZCx0YXNrcXVldWUuc2hpZnQoKSwgY29udGV4dCk7ICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gIH07XHJcbiAgYXBwcy5mb3JFYWNoKGZ1bmN0aW9uKGFwcCl7dGFza3F1ZXVlLnB1c2gobWFrZWNiKGFwcCkpfSk7XHJcblxyXG4gIHRhc2txdWV1ZS5wdXNoKGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgb3V0cHV0LnB1c2goZGF0YSk7XHJcbiAgICBjYi5hcHBseShjb250ZXh0LFtvdXRwdXRdKTtcclxuICB9KTtcclxuXHJcbiAgdGFza3F1ZXVlLnNoaWZ0KCkoe19fZW1wdHk6dHJ1ZX0pOyAvL3J1biB0aGUgdGFza1xyXG59XHJcbnZhciBodW1hbkZpbGVTaXplPWZ1bmN0aW9uKGJ5dGVzLCBzaSkge1xyXG4gICAgdmFyIHRocmVzaCA9IHNpID8gMTAwMCA6IDEwMjQ7XHJcbiAgICBpZihieXRlcyA8IHRocmVzaCkgcmV0dXJuIGJ5dGVzICsgJyBCJztcclxuICAgIHZhciB1bml0cyA9IHNpID8gWydrQicsJ01CJywnR0InLCdUQicsJ1BCJywnRUInLCdaQicsJ1lCJ10gOiBbJ0tpQicsJ01pQicsJ0dpQicsJ1RpQicsJ1BpQicsJ0VpQicsJ1ppQicsJ1lpQiddO1xyXG4gICAgdmFyIHUgPSAtMTtcclxuICAgIGRvIHtcclxuICAgICAgICBieXRlcyAvPSB0aHJlc2g7XHJcbiAgICAgICAgKyt1O1xyXG4gICAgfSB3aGlsZShieXRlcyA+PSB0aHJlc2gpO1xyXG4gICAgcmV0dXJuIGJ5dGVzLnRvRml4ZWQoMSkrJyAnK3VuaXRzW3VdO1xyXG59O1xyXG5cclxudmFyIHN0YXJ0PWZ1bmN0aW9uKGtzYW5hanMsY2IsY29udGV4dCl7XHJcbiAgdmFyIGZpbGVzPWtzYW5hanMubmV3ZmlsZXN8fGtzYW5hanMuZmlsZXM7XHJcbiAgdmFyIGJhc2V1cmw9a3NhbmFqcy5iYXNldXJsfHwgXCJodHRwOi8vMTI3LjAuMC4xOjgwODAvXCIra3NhbmFqcy5kYmlkK1wiL1wiO1xyXG4gIHZhciBzdGFydGVkPWtzYW5hZ2FwLnN0YXJ0RG93bmxvYWQoa3NhbmFqcy5kYmlkLGJhc2V1cmwsZmlsZXMuam9pbihcIlxcdWZmZmZcIikpO1xyXG4gIGNiLmFwcGx5KGNvbnRleHQsW3N0YXJ0ZWRdKTtcclxufVxyXG52YXIgc3RhdHVzPWZ1bmN0aW9uKCl7XHJcbiAgdmFyIG5maWxlPWtzYW5hZ2FwLmRvd25sb2FkaW5nRmlsZSgpO1xyXG4gIHZhciBkb3dubG9hZGVkQnl0ZT1rc2FuYWdhcC5kb3dubG9hZGVkQnl0ZSgpO1xyXG4gIHZhciBkb25lPWtzYW5hZ2FwLmRvbmVEb3dubG9hZCgpO1xyXG4gIHJldHVybiB7bmZpbGU6bmZpbGUsZG93bmxvYWRlZEJ5dGU6ZG93bmxvYWRlZEJ5dGUsIGRvbmU6ZG9uZX07XHJcbn1cclxuXHJcbnZhciBjYW5jZWw9ZnVuY3Rpb24oKXtcclxuICByZXR1cm4ga3NhbmFnYXAuY2FuY2VsRG93bmxvYWQoKTtcclxufVxyXG5cclxudmFyIGxpdmV1cGRhdGU9eyBodW1hbkZpbGVTaXplOiBodW1hbkZpbGVTaXplLCBcclxuICBuZWVkVG9VcGRhdGU6IG5lZWRUb1VwZGF0ZSAsIGpzb25wOmpzb25wLCBcclxuICBnZXRVcGRhdGFibGVzOmdldFVwZGF0YWJsZXMsXHJcbiAgc3RhcnQ6c3RhcnQsXHJcbiAgY2FuY2VsOmNhbmNlbCxcclxuICBzdGF0dXM6c3RhdHVzXHJcbiAgfTtcclxubW9kdWxlLmV4cG9ydHM9bGl2ZXVwZGF0ZTsiLCJmdW5jdGlvbiBta2RpclAgKHAsIG1vZGUsIGYsIG1hZGUpIHtcclxuICAgICB2YXIgcGF0aCA9IG5vZGVSZXF1aXJlKCdwYXRoJyk7XHJcbiAgICAgdmFyIGZzID0gbm9kZVJlcXVpcmUoJ2ZzJyk7XHJcblx0XHJcbiAgICBpZiAodHlwZW9mIG1vZGUgPT09ICdmdW5jdGlvbicgfHwgbW9kZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgZiA9IG1vZGU7XHJcbiAgICAgICAgbW9kZSA9IDB4MUZGICYgKH5wcm9jZXNzLnVtYXNrKCkpO1xyXG4gICAgfVxyXG4gICAgaWYgKCFtYWRlKSBtYWRlID0gbnVsbDtcclxuXHJcbiAgICB2YXIgY2IgPSBmIHx8IGZ1bmN0aW9uICgpIHt9O1xyXG4gICAgaWYgKHR5cGVvZiBtb2RlID09PSAnc3RyaW5nJykgbW9kZSA9IHBhcnNlSW50KG1vZGUsIDgpO1xyXG4gICAgcCA9IHBhdGgucmVzb2x2ZShwKTtcclxuXHJcbiAgICBmcy5ta2RpcihwLCBtb2RlLCBmdW5jdGlvbiAoZXIpIHtcclxuICAgICAgICBpZiAoIWVyKSB7XHJcbiAgICAgICAgICAgIG1hZGUgPSBtYWRlIHx8IHA7XHJcbiAgICAgICAgICAgIHJldHVybiBjYihudWxsLCBtYWRlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3dpdGNoIChlci5jb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ0VOT0VOVCc6XHJcbiAgICAgICAgICAgICAgICBta2RpclAocGF0aC5kaXJuYW1lKHApLCBtb2RlLCBmdW5jdGlvbiAoZXIsIG1hZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXIpIGNiKGVyLCBtYWRlKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIG1rZGlyUChwLCBtb2RlLCBjYiwgbWFkZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgLy8gSW4gdGhlIGNhc2Ugb2YgYW55IG90aGVyIGVycm9yLCBqdXN0IHNlZSBpZiB0aGVyZSdzIGEgZGlyXHJcbiAgICAgICAgICAgIC8vIHRoZXJlIGFscmVhZHkuICBJZiBzbywgdGhlbiBob29yYXkhICBJZiBub3QsIHRoZW4gc29tZXRoaW5nXHJcbiAgICAgICAgICAgIC8vIGlzIGJvcmtlZC5cclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGZzLnN0YXQocCwgZnVuY3Rpb24gKGVyMiwgc3RhdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBzdGF0IGZhaWxzLCB0aGVuIHRoYXQncyBzdXBlciB3ZWlyZC5cclxuICAgICAgICAgICAgICAgICAgICAvLyBsZXQgdGhlIG9yaWdpbmFsIGVycm9yIGJlIHRoZSBmYWlsdXJlIHJlYXNvbi5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXIyIHx8ICFzdGF0LmlzRGlyZWN0b3J5KCkpIGNiKGVyLCBtYWRlKVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgY2IobnVsbCwgbWFkZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5ta2RpclAuc3luYyA9IGZ1bmN0aW9uIHN5bmMgKHAsIG1vZGUsIG1hZGUpIHtcclxuICAgIHZhciBwYXRoID0gbm9kZVJlcXVpcmUoJ3BhdGgnKTtcclxuICAgIHZhciBmcyA9IG5vZGVSZXF1aXJlKCdmcycpO1xyXG4gICAgaWYgKG1vZGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIG1vZGUgPSAweDFGRiAmICh+cHJvY2Vzcy51bWFzaygpKTtcclxuICAgIH1cclxuICAgIGlmICghbWFkZSkgbWFkZSA9IG51bGw7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBtb2RlID09PSAnc3RyaW5nJykgbW9kZSA9IHBhcnNlSW50KG1vZGUsIDgpO1xyXG4gICAgcCA9IHBhdGgucmVzb2x2ZShwKTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIGZzLm1rZGlyU3luYyhwLCBtb2RlKTtcclxuICAgICAgICBtYWRlID0gbWFkZSB8fCBwO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGVycjApIHtcclxuICAgICAgICBzd2l0Y2ggKGVycjAuY29kZSkge1xyXG4gICAgICAgICAgICBjYXNlICdFTk9FTlQnIDpcclxuICAgICAgICAgICAgICAgIG1hZGUgPSBzeW5jKHBhdGguZGlybmFtZShwKSwgbW9kZSwgbWFkZSk7XHJcbiAgICAgICAgICAgICAgICBzeW5jKHAsIG1vZGUsIG1hZGUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAvLyBJbiB0aGUgY2FzZSBvZiBhbnkgb3RoZXIgZXJyb3IsIGp1c3Qgc2VlIGlmIHRoZXJlJ3MgYSBkaXJcclxuICAgICAgICAgICAgLy8gdGhlcmUgYWxyZWFkeS4gIElmIHNvLCB0aGVuIGhvb3JheSEgIElmIG5vdCwgdGhlbiBzb21ldGhpbmdcclxuICAgICAgICAgICAgLy8gaXMgYm9ya2VkLlxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgdmFyIHN0YXQ7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXQgPSBmcy5zdGF0U3luYyhwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnIxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghc3RhdC5pc0RpcmVjdG9yeSgpKSB0aHJvdyBlcnIwO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBtYWRlO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBta2RpclAubWtkaXJwID0gbWtkaXJQLm1rZGlyUCA9IG1rZGlyUDtcclxuIl19
