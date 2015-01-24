var circleSize = 20;

var zoomfactor = 2;

var beginning = 0;
var scaleFactor;
var itemHeight = 20;
var margin = { left: 75, right:25, top: 100, bottom:20 };

var numberTimexes = 0;
var timexes = [];
var currId, currNr, currSent, myTl, dct;
var sidbarVisible = true;
var currDatum = "";
var star = "M 180.000 200.000 L 200.000 214.641 L 197.321 190.000 L 220.000 180.000 L 197.321 170.000 L 200.000 145.359 L 180.000 160.000 L 160.000 145.359 L 162.679 170.000 L 140.000 180.000 L 162.679 190.000 L 160.000 214.641 z"
var shifted = false;
var docNr = -1;

var colorDate = [
  "166,206,227",
  "178,223,138",
  "251,154,153",
  "253,191,111",
  "202,178,214",
  "255,255,153",
  "31,120,180",
  "51,160,44",
  "227,26,28",
  "255,127,0",
  "106,61,154",
  "177,89,40"
  ];


$(document).on('keyup keydown', function(e){
  shifted = e.shiftKey;
  if(shifted){ $('#leftBox, #timeline').addClass("nouserselect") }
  else{ $('#leftBox, #timeline').removeClass("nouserselect") }
  });

function getDCT(file){ return file.match(/<DATE_TIME>([^<]*)<\/DATE_TIME>/)[1] }

function orderArray(t){
  // Order
  var sortedT = t.sort(function(a, b){
    var a = a.val, b = b.val;
    if(a < b) return -1;
    if(a > b) return 1;
    return 0;
  });

  return sortedT;
}

function checkIfDate(val){
    var isDate = !isNaN(val) || val == "XXXX"
    if(isDate){ var thisTitle = prettifyDate(val) }
    else{ var thisTitle = prettifyDate(val.split(" - ")[0])+" - "+prettifyDate(val.split(" - ")[1]) ; }
    return thisTitle;
}

function checkDuplicates(t){
  // Check for duplicates and increase count if there are any
  var prevDate = 0;
  var prevCount = 1;
  var durCount = 0;

  for(var i = 0; i < t.length; i++){
    if(t[i].typ == "duration" && t[i].visible){ t[i].count = ++durCount; }
    if(prevDate == t[i].val){
      if(t[i-1].visible==true){ t[i].count = ++prevCount; }
      else{ t[i].count = prevCount; }
    }
    prevDate = t[i].val;
    prevCount= t[i].count;
  }
  return t;
}

function checkDuplicatesWithoutOrdering(t){
//console.log(t)
  var valArray = [];

  for(var i = 0; i < t.length; i++){
    var startCount = 1;
    valArray[i] = { val : t[i].val, visible : t[i].visible, indexNr : i , count : startCount }; // i because we need to keep track of its original position
    
  }

  var orderedArray = orderArray(valArray);
  var duplicateArray = checkDuplicates(orderedArray);

  var countDurations = 1;

  for(var i = 0; i < t.length; i++){
    var thisIndex = duplicateArray[i].indexNr;
    if(t[thisIndex].typ=="duration"&&t[thisIndex].visible){
      t[thisIndex].count = countDurations;
      countDurations++
    }
    else{
      var count = duplicateArray[i].count;
      t[thisIndex].count = count;
      }

  }
  return t;
}

function checkDateLength(d){
  var l = d.length;
  var date;
  // TODO Include Modality here
  if(l==12){ date = new Date(d.substr(0,4) , d.substr(4,2) , d.substr(6,2) , d.substr(8,2) , d.substr(10,2)).getTime(); }
  else if(l==8){ date = new Date(d.substr(0,4) , d.substr(4,2) , d.substr(6,2)).getTime(); }
  else if(l==6){ date = new Date(d.substr(0,4) , d.substr(4,2)).getTime() }
  else if(l==4){ date = new Date(d).getTime() }
  
  //return [date,modality]
  return date
}

function dateConversion(d,mod){
  var date;
  var newD;
  var isnum = /^\d+$/.test(d);
  // DATE
  if(isnum){
    date = checkDateLength(d)
    newD = { typ : "date" , startVal : date, endVal : date }
  }
  // SPECIAL CASES
  else if(d=="PRESENT_REF"){
    var present = new Date(dct).getTime();
    newD = { typ : "date" , startVal : present, endVal : present }
  }

  // DURATIONS
  else{
    var typ = "duration"
    // Duration with XXXX TO XXXX
    if(d.indexOf("TO")>0){
      var startDate = d.substr(0,4)
      var start = new Date(startDate).getTime()
      if(d.length==10){ var endDate = d.substr(6,4) } /* XXXX - XXXX */ 
      else{ var endDate = d.substr(0,2) + d.substr(6,2) } /* XXXX - XX */
      var end = new Date(endDate).getTime()
    }
    // Duration e.g. 1980DECADE
    else if(d.indexOf("DECADE")>0){

      // TODO: CHECK FOR MOD (if "mid" etc)

      var startDate = d.substr(0,4);
      var start = new Date(startDate).getTime();
      if(mod=="MID"){ var delta = 5; }
      else{ var delta = 10 }
      var endDate = (parseInt(d.substr(0,4))+delta).toString();
      var end = new Date(endDate).getTime();
      }
    // Duration e.g. 19CENTURY
    else if(d.indexOf("CENTURY")>0){
      var startDate = d.substr(0,2)+"00"
      var start = new Date(startDate).getTime();
      if(mod=="MID"){ var delta = 50; }
      else{ var delta = 100 }
      var endDate = (parseInt(d.substr(0,2)+"00")+delta).toString()
      var end = new Date(endDate).getTime();
    }
    // Already transformed
    else if(d.indexOf(" - ")>0){
      var startDate = d.split(" - ")[0]
      var endDate = d.split(" - ")[1]
      var start = checkDateLength(startDate);
      var end = checkDateLength(endDate);

    }
    
    else{ var typ = "neither"; }

      newD = {
        typ : typ ,
        startVal : start,
        endVal : end,
        startDate : startDate,
        endDate : endDate }
    }
  return newD;
}

function prettifyDate(d){
  var l = d.length;
  MM = ["January", "February","March","April","May","June","July","August","September","October","November", "December"];
  var prettyD;

  if(l==12){ prettyD = d.substr(6,2) + " " + MM[parseInt(d.substr(4,2))-1] + " " + d.substr(0,4) + ", "+d.substr(8,2)+":"+d.substr(10,2); }
  else if(l==8){ prettyD = d.substr(6,2) + " " + MM[parseInt(d.substr(4,2))-1] + " " + d.substr(0,4); }
  else if(l==6){ prettyD = MM[parseInt(d.substr(4,2))-1] + " " + d.substr(0,4); }
  else if(l==4){ prettyD = d }
  return prettyD;
}

///////////////////////////// TOOLBOXES


var clickList = function(id){
  d3.selectAll("circle").classed("selected",false);
  var thisId = id.split("_")[1];
  $("#listEl_"+currId).removeClass("highlighted")
  $("#"+id).toggleClass("highlighted")
  d3.select("#timelineItem_"+thisId).classed("selected",true);

  currId = thisId;
}

function getCirclePath(datum,beginning,scaleFactor){
  var cx = parseInt(getXPos(datum,beginning,scaleFactor));

  if(isNaN(cx) && datum.val != "1970"){ cx = 150
    console.log("datum: "+datum.val+" beg: "+beginning+", sF: "+scaleFactor)
    }
  var cy = parseInt(getYPos(datum));
  //console.log(datum.id + ": " +cy)
  
  if(datum.visible){ var r = itemHeight/2; }
  else{ var r = 0; }
  var path = "M "+cx+" "+cy+" m -"+r+", 0 a "+r+","+r+" 0 1,0 "+(r*2)+",0 a "+r+", "+r+" 0 1, 0 -"+(r*2)+",0"
  return path
}

function getXPos(d,beg,scale) {
  var isDate = !isNaN(d.times[0].starting_time);
  if(isDate) var newXPos = margin.left + (d.times[0].starting_time - beg) * scale;
  else var newXPos = margin.left + (d.count-1) * (itemHeight+10)
  return newXPos;
  }

function getYPos(d) {
    var isDate = !isNaN(d.times[0].starting_time);
    var pos = margin.top + itemHeight + 4;
    var hasCount = (d.count != 1);
    if(isDate){
      if(hasCount){ return pos - ((d.count-1)*itemHeight+2) }
      else{ return pos }  
    }
    else{ return 270 }
}

function getLinePath(datum,beginning,scaleFactor){

  var cxStart = parseInt(getXPos(datum,beginning,scaleFactor));
  var cxEnd = margin.left + (datum.times[0].ending_time - beginning) * scaleFactor;
  
  var length = cxEnd - cxStart
  
  var yPos = 155 + datum.count*5
  //console.log(datum.count)
  var path = "M "+ cxStart +" "+yPos+" l "+ length +" 0"
  //console.log("End: "+datum.times[0].ending_time+", Start: "+cxStart+", Path: "+path)
  return path
}

/*function getIndex(timexes,el){
  var thisObj = $.grep(timexes, function(tx){ return tx.id == el.currId; })[0]
  var thisIndex = timexes.indexOf(thisObj)
  return thisIndex;
}*/

function getColor(d){
  var isDate = !isNaN(d.times[0].starting_time);
  var dN = d.docNr
  if(dN!=-1){
    if(isDate){ return "rgb("+colorDate[dN]+")"; }
    else{ return "rgba("+colorDate[dN]+",0.8)"; }
  }
  // Vague or undefined dates
  else{
    var currActiveBtn = $(".activeBtn").attr("id")
    if(!currActiveBtn || currActiveBtn=="button_list"){ return "#999" }
    if(currActiveBtn){ return "rgb("+colorDate[currActiveBtn.split("_")[1]]+")"}
    }
}


// Check Date Input
function validate(event,el) {

  var key = window.event ? event.keyCode : event.which;

  if(event.key == "Enter" || key == 13){
    //console.log("Enter!");
    if(el=="sub"){ $("#displaySubtitle input").blur() }
    else{ $("#check").trigger('click')}
  }

  if(!el){
    if (event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 46 ||
        event.keyCode == 37 || event.keyCode == 39 || event.keyCode == 88) {
        
        return true;
    }
    else if ( key < 48 || key > 57 ) {
        return false;
    }
    else return true;
  }
};

function download(filename, text) {
    var link = document.createElement('a');
    var textFileAsBlob = new Blob([text], {type:'text/plain'});

    link.download = filename;
    link.innerHTML = "Download File";
 
    link.href = window.URL.createObjectURL(textFileAsBlob);
    link.onclick = destroyClickedElement;
    link.style.display = "none";
    document.body.appendChild(link);
    
    link.click();

    /*pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    pom.click();*/
  }
function destroyClickedElement(event) { document.body.removeChild(event.target); }
function triggerUpload(){ $('#uploadFile').click() }

function openInput(){
    $("#inputOverlay").fadeIn(300);
    $(document).on("keydown" , exitOverlay )
}

function exitOverlay(e){ if(e.keyCode == 27){ closeInput() } }

function closeInput(){
  $(document).off("keydown",exitOverlay)
  $("#inputOverlay").fadeOut(300);
  $('#inputOverlay input[name="title"]').val("")
  $('#inputOverlay input[name="date"]').val("")
  $('#inputOverlay textarea[name="content"]').val("")
  $('#inputOverlay input[name="source"]').val("")
}

/* PYTHON AJAX REQUEST */
function preprocessing(){
  var title = $('#inputOverlay input[name="title"]').val().replace(/[^\x00-\x7F]/g, "");
  var doc = $('#inputOverlay input[name="date"]').val();

    // If no DCT given - use today
    if(!doc){
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!
        var yyyy = today.getFullYear();

        if(dd<10) { dd='0'+dd }
        if(mm<10) { mm='0'+mm }

        today = yyyy+'-'+mm+'-'+dd;
        doc = today;
    }

  var content = $('#inputOverlay textarea[name="content"]').val()
            .replace("&", "and")
            .replace(/–/g, "-")
            .replace(/’/g, " APOSTROPHE ")
            .replace(/"/g, " QUOTE ")
            .replace(/[^\x00-\x7F]/g, "");
  // What to do with the source??
  
  var jsonout = "<?xml version=\"1.0\" ?>\n<DOC>\n<BODY>"+
    "\n<TITLE>"+title+"</TITLE>"+
    "\n<DATE_TIME>"+doc+"</DATE_TIME>"+
    "\n<TEXT>\n\n"+content+"\n\n</TEXT>\n"+
    "</BODY>\n</DOC>"

    return jsonout
  }
