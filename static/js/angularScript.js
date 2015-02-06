var app = angular.module('tlApp', []);

app
.controller('MainCtrl', function($scope, $http, $sce, CreateArray, CreateTimeline, DateHandling, DateExporting) {
	
	$scope.docNr = -1;
	//$scope.tempFiles = ["england","usa","canada","denmark"]
	$scope.tempFiles = ["iceland", "journalism", "london", "nasa", "newspapers", "nlp" ,"ubc","policy"]
	$scope.fileNames = []
	//$scope.fileNames[$scope.docNr] = "today"
	$scope.myfile;
	$scope.files = [];
	$scope.timexes = [];
	$scope.currIndex = 0;
	$scope.tlWidth = $("#rightBox").width() - 50;
	$scope.severalSelected = false;
	$scope.editDate = false;
	$scope.singleSents = []
	$scope.dateInfo = []
	$scope.colorDate = colorDate;

	if (localStorage.getItem("savedData") === null) { $scope.prevData = false }
	else{ $scope.prevData = localStorage.getItem("savedData") }
	
	$scope.tlDescr = ["My pretty timeline", "Please give me a short desciption"]

	// Building TL without any dates on it
	CreateTimeline.buildTl($scope)

	// PYTHON CALL
	$scope.getTimexes = function(){
		var myData = preprocessing()

		thisData = { 'myData' : myData }
		$(".loading").fadeIn(300)
		$.ajax({
		    type: "POST",
		    data: JSON.stringify(thisData, null, '\t'),
		    url: "/dothenlp",
		    contentType: 'application/json;charset=UTF-8',
		    success: function(data){
		        $(".loading").fadeOut(300)
		        //console.log(data)
		        closeInput()
			  $scope.addDocument(data.result,"fromInput")
		    }
		})
	}

	$scope.showDateInfo = function(txObject){ return CreateTimeline.showDateInfo(txObject) }

	$scope.makeSelection = function(sentNr,d,origin){ $scope = DateHandling.makeSelection($scope, sentNr, d, origin) }
      
      $scope.clickList = function(d){
      	var sentNr = d.sentNr;
      	$scope.makeSelection(sentNr,d,"fromList")
	}

      $scope.clickingSent = function(s){
      	var d = $.grep($scope.timexes, function(tx){ return tx.sentNr == s });
	     	$scope.makeSelection(s,d,"fromSent")
      	}

      $scope.clickingCircle = function(d){
      	var sentNr = d.sentNr;
		$scope.makeSelection(sentNr,d,"fromCircle");
      }

      //$scope.highlightCircle = function(arr,origin){ return CreateTimeline.highlightCircle(arr,origin) }
      $scope.highlightSent = function(d,docNr){ CreateTimeline.highlightSent(d,docNr) }
      $scope.scrollToSent = function(id,sent,docNr,v){ CreateTimeline.scrollToSent(id,sent,docNr,v) }

      $scope.updateD3Tl = function(tx,m,fct,nr){ CreateTimeline.updateD3Tl(tx,m,fct,nr); }

	$scope.checkThisDate = function(){
		
		var updatedDate = DateHandling.checkThisDate($scope.dateInfo[0].dateArray);
		if(updatedDate){
			$scope.editDate = false;
			var currIndex = $scope.currIndex;
			$scope.timexes[currIndex].val = updatedDate;
			$scope.timexes[currIndex].title = updatedDate;
			$scope.dateInfo[0].title = checkIfDate(updatedDate);
			var dateVals = dateConversion(updatedDate)
			$scope.timexes[currIndex].times[0].starting_time = dateVals.startVal;
			$scope.timexes[currIndex].times[0].ending_time = dateVals.endVal;
			$scope.updateD3Tl($scope.timexes, "move")
		}
	}

	$scope.addTime = function(dir){
		if(dir == "start"){
			$scope.dateInfo[0].dateArray[3]='0000'
			if($scope.dateInfo[0].dateArray[2]=='xx' || $scope.dateInfo[0].dateArray[2]=='00'){
				$scope.dateInfo[0].dateArray[2]='01'
			}
			if($scope.dateInfo[0].dateArray[1]=='xx' || $scope.dateInfo[0].dateArray[1]=='00'){
				$scope.dateInfo[0].dateArray[1]='01'
			}
		}
		else{
			$scope.dateInfo[0].dateArray[7]='0000'
			if($scope.dateInfo[0].dateArray[6]=='xx' || $scope.dateInfo[0].dateArray[6]=='00'){
				$scope.dateInfo[0].dateArray[6]='01'
			}
			if($scope.dateInfo[0].dateArray[5]=='xx' || $scope.dateInfo[0].dateArray[5]=='00'){
				$scope.dateInfo[0].dateArray[5]='01'
			}
		}
	}

	$scope.addDay = function(dir){
		if(dir == "start"){
			$scope.dateInfo[0].dateArray[2]='01'
			if($scope.dateInfo[0].dateArray[1]=='xx' || $scope.dateInfo[0].dateArray[1]=='00'){
				$scope.dateInfo[0].dateArray[1]='01'
			}
		}
		else{
			$scope.dateInfo[0].dateArray[6]='01'
			if($scope.dateInfo[0].dateArray[5]=='xx' || $scope.dateInfo[0].dateArray[5]=='00'){
				$scope.dateInfo[0].dateArray[5]='01'
			}
		}
	}
	$scope.addMonth = function(dir){
		if(dir == "start") $scope.dateInfo[0].dateArray[1]='01'
		else $scope.dateInfo[0].dateArray[5]='01'
	}

	$scope.enableEdit = function(el) {
		if(el=="t"){
			$scope.editDate = true;
			$scope.dateInfo[0].dateArray = DateHandling.checkSize($scope.timexes[$scope.currIndex].val)
		} else{ $scope.editDate = false; }

		if(el=="d"){ $scope.editSubtitle = true; var thisid = "#displaySubtitle input"}
		else if(el=="c"){ $scope.editContent = true; }
		else if(el=="ms"){ $scope.editMediaSource = true; var thisid = "#mediaSource input"  }
		else if(el=="mcr"){ $scope.editMediaCredit = true; var thisid = "#mediaCredit input"}
		else if(el=="mca"){ $scope.editMediaCaption = true; var thisid = "#mediaCaption input"}

		//TODO: tabbing through input fields
		if(thisid) setTimeout( function(){ $(thisid).select() } , 50 )
	}
	$scope.disableEdit = function(el) {
		if(el=="d"){
			$scope.editSubtitle = false;
			if($scope.dateInfo.length>0){
				$scope.timexes[$scope.currIndex].sub = $scope.dateInfo[0].subtitle;
			}
		}
		else if(el=="c"){
			$scope.editContent = false;
			if($scope.dateInfo.length>0){ $scope.timexes[$scope.currIndex].sent = $scope.dateInfo[0].sent; }
		}
		else if(el=="ms"){
			$scope.editMediaSource = false;
			if($scope.dateInfo.length>0){
				// If date has Media source --> Indicate that it has Media
				var newSource = $scope.dateInfo[0].medium["source"];
				if(newSource == ""){ newSource = "Enter URL"; $scope.dateInfo[0].medium["source"] = newSource }
				if (newSource != "Enter URL" && newSource != "x"){
					
					$scope.timexes[$scope.currIndex].hasMedia = true;
					$('#mediaIndicator').addClass("hasMedia")
				}
				$scope.timexes[$scope.currIndex].mediaSource = newSource; }

		}
		else if(el=="mcr"){
			$scope.editMediaCredit = false;
			if($scope.dateInfo[0].medium["credit"].length > 0){ $scope.timexes[$scope.currIndex].mediaCredit = $scope.dateInfo[0].medium["credit"]; }
			else{ $scope.dateInfo[0].medium["credit"] = "Credit" }
		}
		else if(el=="mca"){
			$scope.editMediaCaption = false;
			if($scope.dateInfo[0].medium["caption"].length > 0){ $scope.timexes[$scope.currIndex].mediaCaption = $scope.dateInfo[0].medium["caption"]; }
			else{ $scope.dateInfo[0].medium["caption"] = "Caption" }
		}
		return $scope;
	}

	$scope.highlightTimex = function(text, search) {
		if (!search) { return $sce.trustAsHtml(text); }
		// It's called 3 times... WHY?
    		return $sce.trustAsHtml(text.replace(new RegExp(search, 'gi'), '<span class="hltx">$&</span>'));
	};

	// TOOLS
	$scope.deleteDate = function(nr){ $scope.timexes = DateHandling.deleteDate($scope,nr) }
	$scope.recoverDate = function(){ $scope.timexes = DateHandling.recoverDate($scope) }
	$scope.addDate = function(){ $scope = DateHandling.addDate($scope,CreateTimeline) }
	$scope.mergeDates = function(){ $scope = DateHandling.mergeDates($scope) }
	$scope.changeUnit = function(unit){ $scope = DateHandling.changeUnit($scope,unit) }
	$scope.switchView = function(v){ DateHandling.switchView(v) }
	$scope.hideDoc = function(v){
		$scope.timexes = DateHandling.hideDoc(v,$scope.timexes);
		$scope.updateD3Tl($scope.timexes,"delete")
	}

	$scope.addDocument = function(val,source){
		$scope.docNr++
		docNr++
		closeInput($scope.selectedFile)
		function processInput(data){
        		$scope.myfile = data;
			$scope.files.push(data);
			dct = getDCT(data);
			
			var nrIds = $scope.timexes.length
			var nrSents = 0;
			if(docNr > 0){ $scope.singleSents.forEach( function(s){ nrSents = nrSents+s.length; }) }

			$scope.timexes = CreateArray.makeArray($scope.timexes,data,nrIds,nrSents)
			$scope.singleSents[$scope.docNr] = CreateArray.recreateText(data, $sce, nrSents,nrIds);
			$scope.updateD3Tl($scope.timexes,"newDoc",$scope.clickingCircle)

			// Adjust DOM
			$("#button_"+docNr).css("background-color", "rgb("+colorDate[docNr]+")")
			
			
			setTimeout( function(){
				var pT = $("#docSwitcher").height() + 10
				$("#leftBox .sidebar").css("padding-top", pT )
			} , 500 )

			if(source=="fromInput"){ $scope.$apply($scope) }
        	}

		// Handmade Input
		if(source=="fromInput"){
			$scope.fileNames[$scope.docNr] = docNr+": "+val.match(/<TITLE>([^<]*)<\/TITLE>/)[1];
			processInput(val)
		}
		// Document Uploaded
		else{
			val = $scope.selectedFile;
			$scope.uploadDoc=false;
			$scope.fileNames[$scope.docNr] = val;
			var indexOfFileInArray = $scope.tempFiles.indexOf(val);
			$scope.tempFiles.splice(indexOfFileInArray, 1);
			// UPLOAD FILE
			$http
			.get("static/data/" + $scope.fileNames[$scope.docNr]+".txt")
			.success(function(data, status, headers, config) {
		          	if (data && status === 200) { processInput(data) }
		          	else{ console.log("Couldn't read data"); }
	        	});
		}
        	
	}

	$scope.loadData = function(source){ $scope = DateExporting.loadData(source,$scope,$sce,CreateArray,CreateTimeline) }
	$scope.saveState = function(auto){ DateExporting.saveState($scope, auto) }
	$scope.exportAsJson = function(){ $scope.dataAsJson = DateExporting.exportAsJson($scope.timexes,$scope.fileNames,$scope.tlDescr) }
	
	$scope.arrowKey = function(dir,btn){
		if($scope.dateSelected){
			
			var listLength = $('#listData li').length
			var currListEl = parseInt($("#listEl_" + $scope.currIndex).index()) + 1
			var newEl = $("#listData li:nth-child("+ (parseInt(currListEl)+1) +")").attr("id")


			if(dir=="next"){
				if(currListEl==listLength){ var newIndex = 1 }
				else{ var newIndex = parseInt(currListEl)+1 }
				var newListEl = $("#listData li:nth-child("+ newIndex +")").attr("id").split("_")[1]
				
				// If not visible go one further
				while (!$scope.timexes[newListEl].visible) {
					if(newIndex==listLength){ newIndex = 1 }
					else{ newIndex++ }
					newListEl = $("#listData li:nth-child("+ newIndex +")").attr("id").split("_")[1]
				}
			}
			else if(dir=="prev"){
				if(currListEl==1){ var newIndex = listLength }
				else{ var newIndex = parseInt(currListEl)-1 }
				var newListEl = $("#listData li:nth-child("+ newIndex +")").attr("id").split("_")[1]
				// If not visible go one further
				while (!$scope.timexes[newListEl].visible) {
					if(newIndex==1){ newIndex = listLength }
					else{ newIndex-- }
					newListEl = $("#listData li:nth-child("+ newIndex +")").attr("id").split("_")[1]
				}
			}
			if(btn){ var origin = "arrowBtn"}
			else{ var origin = "arrowKey"}
			$scope.makeSelection($scope.timexes[newListEl].sentNr, $scope.timexes[newListEl], origin)
		}
		
	}

	$(window).bind( "resize" , function() {
		if(this.id) clearTimeout(this.id);
		this.id = setTimeout($scope.updateD3Tl($scope.timexes, "resize"), 500);
	});


	window.setInterval(function(){
  		// TODO: Only autosave when there were changes??
  		// Or when window is in focus
  		$scope.saveState($scope, "autosave")
	}, 60000);
})

// DIRECTIVES
.directive ('unfocus', function() {
	return {
		restrict: 'A',
		link: function (scope, element, attribs) {

			element[0].focus()
			//setTimeout( function(){ element.select() },100)
			//console.log(element[0])
			element.bind("blur", function() { scope.$apply(attribs["unfocus"]);});
			
		} 
    
} })


// SERVICES
.service('SplitSents' , function(){

	this.splitthem = function(d){
		var sents = d.split("<SENTENCES>")[1]
		sents = sents.split("</SENTENCES>")[0]
		//sents = sents.split("', '");
		sents = sents.split(/[\"\'],.?[\"\']/);
		return sents;
	}
})
app.service('CreateTimeline' , function(){

this.buildTl = function($scope){

  	d3.select("body").on("keydown", function() {
	  	var key = d3.event.keyCode
	  	if (!$("input, textarea").is(":focus")) {
	      	if(key == 39 || key == 40){ $scope.arrowKey("next") }
	      	else if(key == 37 || key == 38){ $scope.arrowKey("prev") }
	  	}
	});

  	var chart = d3.timeline();
  	chart
	// !!! ticks have to be adjusted to input data
	.itemHeight(circleSize)
	.margin({ left: margin.left, right:margin.right, top: margin.top, bottom:margin.bottom })
	.tickFormat({
		//format: d3.time.format("%Y"),
		tickTime: d3.time.years,  // !!!
		tickInterval: 5,          // !!!
		tickSize: 10
	})
	//.mouseover(function(i){ })
	//.mouseout(function(i){ })
	.click(function (d, i, datum) { $scope.clickingCircle(datum) })


	myTl = d3.select("#timeline")
		.html("") // to remove Waiting Gif
		.append("svg")
		.attr("width", $scope.tlWidth)
		.attr("height", 300)
		.datum($scope.timexes)
		.call(chart)
		//.call(brush);


	$scope.scaleFactor = scaleFactor;
	if($scope.timexes.length!=0){
		$scope.dateInfo = [{
		typ : $scope.timexes[$scope.currIndex].typ,
		val : $scope.timexes[$scope.currIndex].val,
		title : checkIfDate($scope.timexes[$scope.currIndex].val),
		titleDur : $scope.timexes[$scope.currIndex].title,
		subtitle : $scope.timexes[$scope.currIndex].sub,
		sent : $scope.timexes[$scope.currIndex].sent,
		dateArray : [],
		currSent : -1,
		currId : 0
		}]
	}
		
	$scope.chart = chart;

	return $scope;
  }


this.showDateInfo = function(datum){
  	
  	var dateInfo = {}

  	if(datum.typ=="date"){
	  	dateInfo.val = datum.val;
	  	dateInfo.title = checkIfDate(datum.val);
  	}
  	else{
  		dateInfo.val = datum.title;
  		dateInfo.title = checkIfDate(datum.title);	
	}

	dateInfo.subtitle = datum.sub;
	dateInfo.sent = datum.sent;
	dateInfo.typ = datum.typ;
	dateInfo.timex = datum.timex;	

	dateInfo.medium = []
	dateInfo.medium["source"] = datum.mediaSource;
	dateInfo.medium["credit"] = datum.mediaCredit;
	dateInfo.medium["caption"] = datum.mediaCaption;
	dateInfo.medium["hasMedia"] = datum.hasMedia;
	
	// Save current values
	dateInfo.currId = datum.id;
	dateInfo.currSent = datum.sentNr;
  	
  	return dateInfo
  }

/*this.highlightCircle = function(arr,origin){
  	if(arr.length==0){
  		d3.selectAll(".timelineItem").classed("selected",false);
  		var dateSelected = false;
  	}
  	else{
	  	if(origin=="fromSent"){
	  		d3.selectAll(".timelineItem").classed("selected",false);
	  		arr.forEach(function(datum,i){
	  			console.log(i)
	  			var thisSent = datum.currSent;
	  			d3.selectAll(".timelineItem_sent_"+thisSent).classed("selected",true);
	  			})
	  		var dateSelected = true;
	  	}
	  	else{

		  	if(arr.length==1 && d3.select("#timelineItem_"+arr[0].currId).classed("selected")){
		  		d3.select("#timelineItem_"+arr[0].currId).classed("selected",false)
		  		var dateSelected = false;
		  	}
			else{
		  		d3.selectAll(".timelineItem").classed("selected",false);
		  		arr.forEach(function(datum,i){
		  			console.log("From where: "+i)
		  			var thisId = datum.currId;
		  			d3.select("#timelineItem_"+thisId).classed("selected",true);
		  			})
		  		
		  		var dateSelected = true;
		  	}
		}
	}
	return dateSelected
  }*/

this.highlightSent = function(arr,docNr){
  	$(".timex").removeClass("highlighted");
  	
  	if(arr.length>0){
  		arr.forEach(function(datum){
  			var s = datum.currSent;
  			$("#timeSent_"+s).addClass("highlighted");
  		})
  	}
  }

this.scrollToSent = function(thisid,sent,thisDocNr,view){
  	if(view=="text"){ var thisDiv = "#txtData_"+thisDocNr; var thisEl = "#timeSent_"+sent }
    	else{ var thisDiv = "#listData"; var thisEl = "#listEl_"+thisid }
    	var h = $(thisDiv).height() / 2;
    	var topPos = $(thisDiv).scrollTop() + parseInt($(thisEl).offset().top) - h; 
    	$(thisDiv).animate({ scrollTop: topPos }, 300);
  }

this.updateD3Tl = function(tx, action, clickFct, nr){
	// Check for duplicates, but don't reorder, because that would mess up D3 elements
	var d = checkDuplicatesWithoutOrdering(tx);

	if(action == "loadData"){ d3.select("svg").select("g").selectAll(".timelineItem").remove() }

	if(action=="add" || action == "merge" || action=="newDoc" || action=="loadData"){
		if(action=="merge"){ var newpath = $("#timelineItem_"+nr).attr("d"); }
		else{ var newpath = "M 0, 0 m -30, 0 a 30,30 0 1,0 60,0 a 30,30 0 1,0 -60,0" }

		var timexElements = d3.select("svg").select("g").selectAll(".timelineItem").data(d).enter();
		timexElements
		//d3.select("svg").select("g").selectAll("circle").data(d).enter()
		.append('path')
		.attr("d", newpath )
		.attr("class" , function(d){

			if(action=="newDoc" || action=="loadData"){
				var classes = " timelineItem_sent_"+d.sentNr }
			else{ var classes = ""}

			if(d.typ=="duration"){ return "timelineItem duration" + classes }
			else{ return "timelineItem date"+classes }
		})
		.attr("id", function(d){ return "timelineItem_"+ d.id })
		.attr("fill" , function(d){ return getColor(d) })
		.attr("stroke" , function(d){
			if(d.typ=="duration"){ return getColor(d) }
			else{  return "#fff" }
		})
		.attr("stroke-width" , function(d){
			if(d.typ=="duration"){ return 4 }
			else{  return 2 }
		})
		.on("click", function (d) { clickFct(d) })
		
	}
	
	// RESCALING AXIS
	var minTime = 1451606400000;
	var maxTime = -90000000000000; // Because 0 = 1970
	d.forEach(function (time, i) {
		if(time.visible){
			var sT = time.times[0].starting_time;
			if (!isNaN(sT) && sT < minTime){ minTime = time.times[0].starting_time; }
			var eT = time.times[0].ending_time;
			if (!isNaN(eT) && eT > maxTime) maxTime = time.times[0].ending_time;
            }
	});
	var beginning = minTime;
	var ending = maxTime;
	// If only one date on TL, readjust beginning and ending
	if(beginning == ending){
		beginning = beginning - 157784630000
		ending = ending + 157784630000
	}
	// If no date on timeline, show 2000 till today
	if((beginning == "XXXX" || beginning == 946684800000) && ending == -90000000000000 ){
		beginning = 946684800000
		ending = 1451606400000
	}
	
	var width = $("#rightBox").width() - 50;
	
	var xScale = d3.time.scale()
			.domain([beginning, ending])
			.range([margin.left, width - margin.right]);	
	

	// ZOOMIN IN & SCROLLING ?????
	/*if (zoomfactor != 1) {
		console.log(zoomfactor)
        var move = function() {
          var x = Math.min(0, Math.max(width - width*zoomfactor, d3.event.translate[0]));
          zoom.translate([x, 0]);
          d3.select("#timeline")
          .attr("transform", "translate(" + x + ",0)")
          scroll(x*scaleFactor, xScale);
        };

        var zoom = d3.behavior.zoom().x(xScale).on("zoom", move);

        d3.select("#timeline")
          .attr("class", "scrollable")
          .call(zoom);
      }*/
      var xAxis = d3.svg.axis().scale(xScale).ticks(15).tickSize(15)
	d3.select("svg").selectAll("g.axis").call(xAxis);

      // READJUSTING PATHS
      if(beginning == 0) beginning = 1
      if(ending == 0) ending = 1

      //console.log("Beg: "+beginning+", End: "+ending)

      scaleFactor = (1/(ending - beginning)) * (width - margin.left - margin.right)
  	//d.forEach( function(datum, index){
	var paths = d3.select("svg").selectAll(".timelineItem").data(d).transition();

	paths.attr("d", function(d){
		// line
		if(d.typ=="duration"){ return getLinePath(d,beginning,scaleFactor) }
		//circle
		else{ return getCirclePath(d,beginning,scaleFactor) }
		})
		.attr("stroke-width" , function(d){
			if(d.visible){
				if(d.typ=="duration"){ return 4 }
				else{  return 2 }
			}
			else{ return 0 }
		})

	/* In case there will be any difference between move and delete */
	if(action=="resize"){ d3.select("#timeline").select("svg").attr("width", $("#rightBox").width() - 50) }

	else if(action=="move" || action == "unitChange"){
		paths
		.attr("stroke" , function(d){
			if(d.typ=="duration"){ return getColor(d) }
			else{  return "#fff" }
		})
		.attr("stroke-width" , function(d){
			if(d.typ=="duration"){ return 4 }
			else{  return 2 }
		})
	}
	else if(action=="recover"){ }

	return d;
  }

})

app.service('CreateArray', function(SplitSents){
  
  this.makeArray = function(timexes,file,nrIds,nrSents){
  	var sents = SplitSents.splitthem(file)
  	var number = nrIds;

	// Look into each sentence to see if there are TIMEX2s
	for(var s = 0; s<sents.length; s++){
		var thisS = sents[s];
		if(s==0){ thisS = thisS.split("['")[1] }
		if(s==(sents.length-1)){ thisS = thisS.split("']")[0] }
		// If there is a timex in the sentence:
		if(thisS.indexOf("TIMEX2") >= 0){
	      	// How many Timexes?
	      	var nTimexes = thisS.split("</TIMEX2>");

	        	// CREATE DATA OBJECT
	        	var txsCount = nTimexes.length;
	        	
			// For all timexes inside one sentence
	        	for(var n=0; n<txsCount-1; n++){

	            	// Get: ID, Timex, Surrounding Sentence, Value, Mod, Count (=1)
	            	var x = nTimexes[n]
	            	var thistempex = x.split(/\<TIMEX2.*?\>/)[1].replace("&#039;","'");
	            	// Check if VAL
	            	if(x.indexOf("VAL") >= 0){ var thisVal = x.match(/VAL=\"([^<]*)\"/)[1] }
	            	else{ var thisVal = x.split(">")[1]; }

	            	// Check if MOD
	            	if(x.indexOf("MOD") >= 0){ var thisMod = x.match(/MOD=\"([^\"]*)\"/)[1] }
	            	else{ var thisMod = ""; }

	            	
				// Check if Time is transformable
				var d = dateConversion(thisVal,thisMod)

				// Sentence withough TIMEX2 Tags
				thisS = thisS.replace(/<TIMEX2( [^>]*)>/g , "")
					.replace(/<TIMEX2>/g , "")
					.replace(/<\/TIMEX2>/g , "")
					.replace(/&quot;/g , "\"")
					.replace(/\<br\>/g , " ")
					.replace("&#039;" , "'")

				var sentNr = s + nrSents;
				// Only add when transformable
				if(d.typ=="date"){
					if(thisVal=="PRESENT_REF"){ thisVal = dct.substr(0,4)+dct.substr(5,2)+dct.substr(8,2) }

					timexes[number] = {
					id : number , docNr : docNr , timex : thistempex , typ : "date",
					sent : thisS , sub : "Title", sentNr : sentNr , val : thisVal ,
					title : prettifyDate(thisVal), mod : thisMod , count : 1 ,
					times : [{starting_time : d.startVal , ending_time : d.startVal}],
					mediaSource : "Enter URL" , mediaCredit : "Credit" , mediaCaption : "Caption" , hasMedia : false ,
					visible : true
					};
				
				}
				// If Value is DURATION
				else if(d.typ=="duration"){
					var temporarySolution = "XXXX"
					var durTitle = d.startDate +" - "+d.endDate;
					timexes[number] = {
					id : number , docNr : docNr , timex : thistempex , typ : "duration",
					sent : thisS , sub : "I am a time period" , sentNr : sentNr , val : durTitle ,
					title : durTitle , mod : thisMod , count : 1 ,
					times : [{starting_time : d.startVal , ending_time : d.endVal}],
					mediaSource : "Enter URL" , mediaCredit : "Credit" , mediaCaption : "Caption" , hasMedia : false ,
					visible : true
					};
				}
				// If Value is no date
				else{
					var temporarySolution = "XXXX"
					var subt = "I am not properly defined yet"
					timexes[number] = {
					id : number , docNr : docNr , timex : thistempex , typ : "neither",
					sent : thisS , sub : subt, sentNr : sentNr , val : temporarySolution ,
					title : "0000" , mod : thisMod , count : 1 ,
					times : [{starting_time : temporarySolution , ending_time : temporarySolution}],
					mediaSource : "Enter URL" , mediaCredit : "Credit" , mediaCaption : "Caption" , hasMedia : false ,
					visible : true
					};
				}
			number++;
			}
		}
	}
	timexes = checkDuplicatesWithoutOrdering(timexes);
	//checkDuplicates(timexes);
	//$("#view_switch button").on("click" , function(){ $(".sidebar").toggleClass("activetab"); })
	return timexes;
  }

  this.recreateText = function(file,$sce,nrSents,nrIds){
  	var sents = SplitSents.splitthem(file)
  	
  	var txSents = [];

  	var thisNewSent = ""
  	var thisId = nrIds;
  	for(var s = 0; s<sents.length; s++){
		
		var thisS = sents[s];
		//thisS = thisS.replace(/\\n/g , " <br> ")
		// For first and last sent - remove [' or ']
		if(s==0){ thisS = thisS.split("['")[1] }
		if(s==(sents.length-1)){ thisS = thisS.split("']")[0] }
		var sentNr = s + nrSents;

		// If one ore more Timexes in Sentence
		if(thisS.indexOf("TIMEX2") >= 0){
			var nTimexes = thisS.split("</TIMEX2>");
			var txSent = ""
		  	for(var n = 0; n<nTimexes.length; n++){
		  		if(n!=(nTimexes.length-1)){
			            txSent += nTimexes[n].replace(/<TIMEX2([ ]*[^>]*)>/g , "<span id='tx_"+thisId+"' class='tx txSent_"+sentNr+"'>")
			            txSent += "</span>"

			      	thisId++;
			      	}
		      	else{ txSent += nTimexes[n] }
			
		      }
			txSents[s] = { sent : $sce.trustAsHtml(txSent) , tx : "Tx" , sentNr : sentNr , id : thisId }
		}
		// No Timex in Sentence
		else{ txSents[s] = { sent : $sce.trustAsHtml(thisS), tx : "NoTx" , sentNr : sentNr } }
	}
	//console.log("Now we have "+sentNr+" sentences")
	return txSents;
  }
});

app.service('DateHandling', function(){
	

	this.checkSize = function(d){
		var dateL = d.length;
		var thisVal = d;
		var dateArray = []
		
		if(isNaN(d) && d!="XXXX"){
			var startVal = d.split(" - ")[0]
			var endVal = d.split(" - ")[1]
			dateL = startVal.length;
			thisVal = startVal;
		}
		// Date
		if(dateL>=4){ dateArray[0] = thisVal.substr(0,4); }
  		else{ dateArray[0] = "xxxx"; }

  		if(dateL>=6){ dateArray[1] = thisVal.substr(4,2); }
  		else{ dateArray[1] = "xx"; }

		if(dateL>=8){ dateArray[2] = thisVal.substr(6,2); }
  		else{ dateArray[2] = "xx"; }

  		if(dateL>=12){ dateArray[3] = thisVal.substr(8,4); }
  		else{ dateArray[3] = "xxxx"; }
		
		// Add values for end date if Duration
		if(isNaN(d) && d!="XXXX"){
			dateL = endVal.length;
			thisVal = endVal;
			if(dateL>=4){ dateArray[4] = thisVal.substr(0,4); }
	  		else{ dateArray[4] = "xxxx"; }

	  		if(dateL>=6){ dateArray[5] = thisVal.substr(4,2); }
	  		else{ dateArray[5] = "xx"; }

			if(dateL>=8){ dateArray[6] = thisVal.substr(6,2); }
	  		else{ dateArray[6] = "xx"; }

	  		if(dateL>=12){ dateArray[7] = thisVal.substr(8,4); }
	  		else{ dateArray[7] = "xxxx"; }
		}
		return dateArray;
  		
	}

	this.checkThisDate = function(arr){
		// Check if input correct
		if( arr[0].length<4 || (arr[3].length<4 && arr[3].length!=0) ||
			(arr.length>4 &&
			(arr[4].length<4 || (arr[7].length<4 && arr[7].length!=0) ||
			arr[0] > arr[4]))){
			// Year has less than 4 digits
			if(arr[0].length<4){ alert("A Year has 4 digits please") }
			// Time is given in the wrong format
			if(arr[3].length<4 && arr[3].length!=0){
				alert("Please write the time in the format HHMM") }	
		
			if(arr.length>4){
				if(arr[4].length<4){ alert("A Year has 4 digits please") }
				if(arr[7].length<4 && arr[7].length!=0){
					alert("Please write the time in the format HHMM") }
				// Start year is bigger than end date
				if(arr[0] > arr[4]){ alert("Please enter the dates in a chronological order.") }	
			}
			return false;
		
		}

		else{
			// Improve Input if inexplicit
			if(arr[1].length==1){ arr[1] = "0" + arr[1] }
			if(arr[1]>12){ alert("We only have 12 month in a year."); arr[1] = "12" }
			if(arr[2].length==1){ arr[2] = "0" + arr[2] }
			if(arr[2]>31){ alert("Pretty sure a month can't have more than 31 days."); arr[2] = "01" }
			if(arr[3].substr(0,2)>23){ alert("Sorrey, but that is no valid time."); arr[3] = "23" + arr[3].substr(2,2) }
			if(arr[3].substr(2,2)>59){ alert("Can we please write existing times?"); arr[3] = arr[3].substr(0,2) + "59" }

			if(arr.length>4){
				if(arr[5].length==1){ arr[5] = "0" + arr[5] }
				if(arr[5]>12){ alert("We only have 12 month in a year."); arr[5] = "12" }
				if(arr[6].length==1){ arr[6] = "0" + arr[6] }
				if(arr[6]>31){ alert("Pretty sure a month can't have more than 31 days."); arr[6] = "01" }
				if(arr[7].substr(0,2)>23){ alert("Sorrey, but that is no valid time."); arr[7] = "23" + arr[7].substr(2,2) }
				if(arr[7].substr(2,2)>59){ alert("Can we please write existing times?"); arr[7] = arr[7].substr(0,2) + "59" }
			}
			// DATE
			var updatedDate = "";
			if(arr[0]!="xxxx") updatedDate += arr[0]
			if(arr[1]!="xx") updatedDate += arr[1]
			if(arr[2]!="xx") updatedDate += arr[2]
			if(arr[3]!="xxxx") updatedDate += arr[3]
			
			// DURATION
			if(arr.length>4){
				updatedDate += " - "
				if(arr[4]!="xxxx") updatedDate += arr[4]
				if(arr[5]!="xx") updatedDate += arr[5]
				if(arr[6]!="xx") updatedDate += arr[6]
				if(arr[7]!="xxxx") updatedDate += arr[7]
			}
			return updatedDate;
		}
	}

	this.makeSelection = function($scope, sentNr, d, origin){
		$scope.editDate = false;
		$scope.addMedia = false;
		
		if(sentNr===false){ sentNr = -1 }

		// If coming from Sentence selection, take first timex from sentence as new index
		if(origin=="fromSent"){
			var numberNewElement = d.length
			$scope.currIndex = $scope.timexes.indexOf(d[0]);
			}
		else{
			var numberNewElement = 1
			$scope.currIndex = $scope.timexes.indexOf(d);
		}

		// Should not be needed - but DOM not updating after Media Input change...
		if(!$scope.timexes[$scope.currIndex].hasMedia) $('#mediaIndicator').removeClass("hasMedia")

		for(var i=0; i<numberNewElement;i++){
			if(origin=="fromSent"){ var thisD = d[i]; }
			else{ var thisD = d; }
			
			var newDate = $scope.showDateInfo(thisD);
			
			if(shifted){
				var newId = newDate.currId;
				// Check if ID already in Array - if not add it
				var elExists = $.grep($scope.dateInfo, function(el){ return el.currId == newId; });

				if(elExists.length==0){ $scope.dateInfo.push(newDate); }
				else{
					var posInArray = $scope.dateInfo.indexOf(elExists[0])
					$scope.dateInfo.splice(posInArray, 1) }
	      		}
	      	else{
	      		if($scope.dateInfo[0] && $scope.dateInfo[0].currId == newDate.currId){ $scope.dateInfo = []; }
	      		else{
	      			if(i==0){ $scope.dateInfo = []; }
	      			$scope.dateInfo.push(newDate);
	      		}
	      		//console.log(newDate)
	      		//console.log($scope.dateInfo[0])
	      	}
      	}
      	if($scope.dateInfo.length>1){ $scope.severalSelected = true; }
      	else{ $scope.severalSelected = false; }

         // Highlighting Sentence (if path is connected to a sentence)
      	if(sentNr!=-1){
      		// If in List-View
      		if($("#listData").hasClass("activetab")){
      			var thisId = newDate.currId
      			var thisDocNr = $scope.timexes[newDate.currId].docNr;
      			var view = "list"
      		}
      		// If in wrong doc-view - switch View to selected Doc
      		else{
      			var thisDocNr = $scope.timexes[newDate.currId].docNr
      			var activeDoc = $(".activetab").attr("id").split("_")[1]
      			if(thisDocNr!=activeDoc){ $scope.switchView(thisDocNr); }
      			var thisId = newDate.currId
      			var view = "text"
      		}
      		$scope.highlightSent($scope.dateInfo,thisDocNr);
      		$scope.scrollToSent(thisId,sentNr,thisDocNr,view)	
      	}
      	// if manually added Date
      	else{ if(!shifted) $(".timex").removeClass("highlighted"); }

         // Highlighting List
		$(".listEl").removeClass("highlighted")
		$scope.dateInfo.forEach( function(d){ $("#listEl_"+d.currId).addClass("highlighted") })

	   // Highlighting Circle
	   	d3.selectAll(".timelineItem").classed("selected", false).classed("selectedSec", false)
		$scope.dateInfo.forEach( function(d,i){
			// First Selection is primar selection
			if(i==0){ d3.select("#timelineItem_"+d.currId).classed("selected" , true) }
			else{ d3.select("#timelineItem_"+d.currId).classed("selectedSec" , true) }
		}) 
		if($scope.dateInfo.length!=0){ $scope.dateSelected = true }
		else{ $scope.dateSelected = false }
		
		if(origin=="fromCircle" || origin=="arrowKey") $scope.$apply( $scope.dateSelected ); // apply needed, because Click on Circle is no ng-click
      	
      	// ARROW KEYS
      	//if($scope.dateSelected){ $(document).on("keydown" , arrowKeys ) }
      	//else{ $(document).off("keydown" , arrowKeys ) }

      	return $scope;
	}

	this.deleteDate = function($scope,nr){
		
		$scope.dateSelected = false;

		if(nr=="one"){
			var thisIndex = $scope.dateInfo[0].currId
			d3.select("#timelineItem_"+$scope.dateInfo[0].currId).classed("selected",false);
			$scope.timexes[thisIndex].visible = false;
		}
		else{
			$scope.dateInfo.forEach( function(el){
				var thisIndex = el.currId
				d3.select("#timelineItem_"+el.currId).classed("selected",false).classed("selectedSec",false);
				//$(".timex, .listEl").removeClass("highlighted");
				$scope.timexes[thisIndex].visible = false;
			})	
		}
		$(".timex, .listEl").removeClass("highlighted");
		$scope.updateD3Tl($scope.timexes, "delete");
		$scope.severalSelected = false;

		return $scope.timexes;
		
	}

	this.recoverDate = function($scope){
		d3.select("#timelineItem_"+$scope.dateInfo[0].currId).transition(1000).attr("r",(itemHeight/2));
		$scope.dateSelected = true;
		var thisIndex = $scope.currIndex;
		$scope.timexes[thisIndex].visible = true;
		$scope.updateD3Tl($scope.timexes, "recover");
		return $scope.timexes;
	}

	this.addDate = function($scope,CreateTimeline){
		var number = $scope.timexes.length;

		var currDoc = -1;
		var aT = $(".activetab").attr("id")
		if(aT){
			aT = aT.split("_")[1]
			if(aT!="list"){ currDoc = aT }
			console.log(currDoc)
		}
		

		var newDate = {
			id : number , timex : "manually added" , docNr : currDoc,
			sent : "manually added" , sub : "Optional Title", sentNr : -1 , typ : "date", 
			val : "XXXX" , title : "0000", mod : "" , count : 1 ,
			mediaSource : "Enter URL" , mediaCredit : "Credit" , mediaCaption : "Caption" , hasMedia : false ,
			times : [{ starting_time : "XXXX" , ending_time : "XXXX"}], visible : true
			}
		$scope.timexes.push(newDate);
		$scope.currIndex = number;
		
		d3.selectAll(".timelineItem").classed("selected", false).classed("selectedSec",false)
		$scope.updateD3Tl($scope.timexes, "add", $scope.clickingCircle);
		$scope.dateInfo = [];
		$scope.dateInfo.push({ currId : number });
		$scope.dateInfo[0] = $scope.showDateInfo($scope.timexes[number]);
			

		$scope.dateSelected = true;
		setTimeout( function(){
			d3.select("#timelineItem_"+$scope.dateInfo[0].currId).classed("selected",true)
		},300)

		return $scope;
	}

	this.addFreeformText = function(){
		// Open up Form

	}

	this.mergeDates = function($scope){
		var number = $scope.timexes.length;
		var dateInfo = $scope.dateInfo
		
		// Make first element the new value
		var newId = dateInfo[0].currId
		var newSent = "";
		var newSentNr, newDocNr;
		var newSubtitle = "";
		var newTyp = dateInfo[0].typ;
		if(newTyp=="neither"){ var newTitle = "XXXX"; }
		else{ var newTitle = dateInfo[0].val; }
		
		dateInfo.forEach( function(el, index){
			var thisId = el.currId;
			if(index==0){
				newSubtitle = el.subtitle;
				newDocNr = $scope.timexes[thisId].docNr;
				newSentNr = $scope.timexes[thisId].sentNr;
			}
			newSent += el.sent + "\n\n";
			
			$scope.timexes[thisId].visible = false;
		})

		var d = dateConversion(newTitle)
		var newDate = {
			id : newId , docNr : newDocNr , timex : "merged Date" ,
			sent : newSent , sub : newSubtitle, sentNr : newSentNr , typ : newTyp, 
			val : newTitle , title : newTitle, mod : "" , count : 1 ,
			times : [{ starting_time : d.startVal , ending_time : d.endVal}], visible : true
			}
			
		$scope.timexes[newId] = newDate;
		//console.log($scope.timexes)
		$scope.dateInfo = [];
		$scope.currIndex = newId;
		
		$scope.updateD3Tl($scope.timexes, "merge", $scope.clickingCircle, newId);
		$scope.dateSelected = true;

		$scope.makeSelection(newSentNr,$scope.timexes[newId],"fromMerging")
		$scope.severalSelected = false;

		return $scope;
	}

	this.changeUnit = function($scope,unit){

		if(unit=="toDate"){
			var newTyp = "date"
			$scope.dateInfo[0].dateArray.pop()
			$scope.dateInfo[0].dateArray.pop()
			$scope.dateInfo[0].dateArray.pop()
			$scope.dateInfo[0].dateArray.pop()
		}
		else{
			var newTyp = "duration"
			$scope.dateInfo[0].dateArray[4] = (parseInt($scope.dateInfo[0].dateArray[0]) + 1).toString();
			$scope.dateInfo[0].dateArray[5]='xx'
			$scope.dateInfo[0].dateArray[6]='xx'
			$scope.dateInfo[0].dateArray[7]='xxxx'
			
		}

		$scope.dateInfo[0].typ=newTyp
		var thisIndex = $scope.currIndex
		
		var updatedDate = this.checkThisDate($scope.dateInfo[0].dateArray)
		$scope.timexes[thisIndex].typ = newTyp
		$scope.timexes[thisIndex].val = updatedDate;
		$scope.timexes[thisIndex].title = updatedDate;
		$scope.timexes[thisIndex].title = updatedDate;
		
		var newDate = dateConversion(updatedDate)
		$scope.timexes[thisIndex].times[0].starting_time = newDate.startVal;
		$scope.timexes[thisIndex].times[0].ending_time = newDate.endVal;

		$scope.updateD3Tl($scope.timexes,"unitChange")

		return $scope;
	}

	this.switchView = function(v){

	$(".docView").removeClass("activetab")
	$(".docBtn").removeClass("activeBtn")
	$("#button_"+v).addClass("activeBtn")

	if(v=="list"){ $("#listData").addClass("activetab");  }
	else{ $("#txtData_"+v).addClass("activetab") }

	}

	this.hideDoc = function(v,tx){

		// If document is already inactive - reactivate it
		if($("#button_"+v).hasClass("inactive")){
			$("#button_"+v).removeClass("inactive")
			tx.forEach( function(el){
				if(el.docNr == v){ el.visible = true; }
			})
		}
		// If document is active - deactivate it
		else{
			$("#button_"+v).addClass("inactive")
			tx.forEach( function(el){
				if(el.docNr == v){ el.visible = false; }
			})
		}
		
		return tx;
	}
});

app.filter('iif', function () {
   return function(input, trueValue, falseValue) {
        return input ? trueValue : falseValue;
   };
})

app.service('DateExporting', function(){

	this.exportAsJson = function(txs,filenames,tlDescr){
		var dateEls = []

		txs.forEach( function(el){
			// Include all elements that are visible and ON the timeline
			if(el.visible && el.title!="0000"){
				
				//var sD = new Date(el.times[0].starting_time)
				var d = el.title
				var sD = d.split(" - ")[0]
				//console.log("start date split length: "+sD.length)
				if(sD.length==4){ var startDate = sD }
				else if(sD.length==6){ var startDate = sD.substr(0,4)+","+sD.substr(4,2) }
				else if(sD.length==8){ var startDate = sD.substr(0,4)+","+sD.substr(4,2)+","+sD.substr(6,2) }
				else if(sD.length>8){ var startDate = sD.substr(0,4)+","+sD.substr(4,2)+","+sD.substr(6,2)+","+sD.substr(8,2)+","+sD.substr(10) }

				// duration
				if(el.typ=="duration"){
					var eD = d.split(" - ")[1]
					if(eD.length==4){ var endDate = eD }
					else if(eD.length==6){ var endDate = eD.substr(0,4)+","+eD.substr(4,2) }
					else if(eD.length==8){ var endDate = eD.substr(0,4)+","+eD.substr(4,2)+","+eD.substr(6,2) }
					else if(eD.length>8){ var endDate = eD.substr(0,4)+","+eD.substr(4,2)+","+eD.substr(6,2)+","+eD.substr(8,2)+","+eD.substr(10) }
				}
				else{ endDate = "" }
				//console.log("Start: "+startDate+", End: "+endDate)
				

				// Media
				if(el.hasMedia){
					var mS = el.mediaSource
					if(el.mediaCredit!= "Credit"){ var mCr = el.mediaCredit }
					else{ var mCr = " " }

					if(el.mediaCaption!= "Caption"){ var mCa = el.mediaCaption }
					else{ var mCa = " " }

					var thisMedia = {
						"media": mS,
                    			"credit": mCr,
                    			"caption": mCa
                    		}
				}
				else{ var thisMedia = {} }

/* We need to know modality of the date - year / year,month / year,month,day etc.*/
				dateEls.push({
					"startDate" : startDate ,
					"endDate" : endDate ,
					"headline" : el.sub ,
					"text" : el.sent,
					"tag" : filenames[el.docNr],
					"asset" : thisMedia
					})
			}
			
		})
		//console.log(dateEls)
		var tlObject = {
			"timeline": {
				"headline" : tlDescr[0] ,
				"type" : "default" ,
				"text" : tlDescr[1] ,
				"asset" : { },
				"date" : dateEls
				}
			}
		// Write data to local storage
		//console.log(tlObject)
		localStorage.setItem('myTlData', JSON.stringify(tlObject));

		return tlObject;
	}

	this.saveState = function($scope, auto){
		
		var savedData = {
			tlDescr : $scope.tlDescr,
			timexes : $scope.timexes,
			files : $scope.files,
			fileNames : $scope.fileNames
		}

		var saveData = JSON.stringify(savedData)
		localStorage.setItem('savedData', saveData);
		$("#saved").fadeIn(300 , function(){ setTimeout( function(){ $("#saved").fadeOut(300) },2000)})
		
		if(!auto){ download($scope.tlDescr[0]+".tl", saveData) }
		//alert("The current state of the timeline \""+ $scope.tlDescr[0] + "\" was saved.")
	}
	this.triggerUploading = function(){ $("#uploadFile").click() }

	this.loadData = function(source,$scope,$sce,CreateArray,CreateTimeline){
		
		
		if($scope.timexes.length!=0){
			var okgo = confirm("Are you sure you want to continue? All dates will be overwritten.")
		} else { var okgo = true }
		var fromStorage;

		var translateData = function(){
			$scope.timexes = [];
			//$scope.updateD3Tl($scope.timexes,"empty")
			//console.log("empty: "+$scope.timexes)
			$scope.timexes = fromStorage.timexes
			$scope.tlDescr = fromStorage.tlDescr
			var nrSents = 0
			var nrIds = 0
			$scope.fileNames = fromStorage.fileNames
			var thisFiles = fromStorage.files
			thisFiles.forEach( function(file,i){
				$scope.singleSents[i] = CreateArray.recreateText(file, $sce, nrSents,nrIds)
				
				if(i!=thisFiles.length-1){
					nrSents += $scope.singleSents[i].length;
					nrIds = $.grep($scope.timexes, function(el){ return el.docNr == i; }).length;	
				}
			})
			
			$scope.updateD3Tl($scope.timexes,"loadData",$scope.clickingCircle)
			$scope.docNr = $scope.fileNames.length - 1
			docNr = $scope.fileNames.length - 1
			
			// Remove files that are already in
			$scope.fileNames.forEach( function(file){
				var indexOfFileInArray = $scope.tempFiles.indexOf(file);
				if(indexOfFileInArray>-1){
					$scope.tempFiles.splice(indexOfFileInArray, 1);
				}	
			})

			if(source != "localStorage"){
				$scope.$apply($scope.singleSents)
				$scope.$apply($scope.uploadData)
			}


			
		}

		if(okgo){
			if(source == "localStorage"){
				fromStorage = JSON.parse(localStorage.getItem('savedData'))
				translateData()
				}
			else{
				var f = source.files[0]
				var filename = f.name;
				// Check if File has correct ending (*.tl)
				if(filename.indexOf(".tl")==(filename.length-3)){
					var reader = new FileReader();
					reader.onload = function(f) {
						var text = f.target.result
						if(text.indexOf('{"tlDescr"') === 0){ fromStorage = JSON.parse(text); translateData() }
						else{ alert("This doesn't seem to be a file that was created with this Timeline Editor") }	
					};
					reader.onerror = function(f) { console.error("File could not be read! Code " + f.target.error.code); };

					reader.readAsText(f);
				}
				else{ alert("Please upload a file that was created with this Timeline-Generator."); }
				
			}	
		}
		$scope.uploadData=false;
		
		return $scope
	}
})


