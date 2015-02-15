// vim: ts=2 sw=2

(function () {
  d3.timeline = function() {
    var DISPLAY_TYPES = ["circle", "rect"];

    var hover = function () {},
        mouseover = function () {},
        mouseout = function () {},
        click = function () {},
        scroll = function () {},
        orient = "bottom",
        width = null,
        height = null,
        tickFormat = {
          format: d3.time.format("%Y"),
          tickTime: d3.time.years,
          tickInterval: 5,
          tickSize: 10 },
        colorCycle = d3.scale.category20(),
        colorPropertyName = null,
        display = "rect",
        
        ending = 0,
        beginning = 0,
        
        stacked = false,
        rotateTicks = false
        
        itemMargin = 5,
        showTodayLine = false,
        showTodayFormat = {marginTop: 25, marginBottom: 0, width: 1, color: colorCycle},
        showBorderLine = false,
        showBorderFormat = {marginTop: 25, marginBottom: 0, width: 1, color: colorCycle};

        //margin = {left: 20, right:20, top: 20, bottom:20};
        itemHeight = 20;

    function timeline (gParent) {
      var g = gParent.append("g").attr("class","allthedates");
      var gParentSize = gParent[0][0].getBoundingClientRect();

      var gParentItem = d3.select(gParent[0][0]);

      var yAxisMapping = {},
        maxStack = 1,
        minTime = 946684800000,
        maxTime = 1420070400000;

      width = $("#topBox").width() - 50


      // check how many stacks we're gonna need
      // do this here so that we can draw the axis before the graph
      if (ending === 0 && beginning === 0) {
        g.each(function (d, i) {
          d.forEach(function (datum, index) {

            // figure out beginning and ending times 
            if (ending === 0 && beginning === 0){
              datum.times.forEach(function (time, i) {
                if (time.starting_time < minTime || (minTime === 0))
                  minTime = time.starting_time;
                if (time.ending_time > maxTime)
                  maxTime = time.ending_time;
              });
            }
          });
        });

       
        beginning = minTime;
        ending = maxTime;
        //console.log(ending)
      }
      // Only one date on TL
      if(beginning == ending){ beginning = beginning - 157784630000; ending = ending + 157784630000 }
      // No date on TL
      if(beginning == 946684800000 && ending == 1420070400000 ){ beginning = 946684800000; ending = 1451606400000 }
      
      scaleFactor = (1/(ending - beginning)) * (width - margin.left - margin.right);

      // draw the axis
      var xScale = d3.time.scale()
        .domain([beginning, ending])
        .range([margin.left, width - margin.right]);

      var xAxis = d3.svg.axis()
        .scale(xScale)
        //.orient(orient)
        //.tickFormat(tickFormat.format)
        .ticks(15)
        .tickSize(15);

      g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + 0 +","+(margin.top + (itemHeight + itemMargin) * maxStack)+")")
        .call(xAxis);

      // draw the chart
      g
      .append("g")
      .each(function(d, i) {
        d.forEach( function(datum, index){
          var datum = datum
          var typ = datum.typ;
          var data = datum.times;
          var hasLabel = (typeof(datum.label) != "undefined");
          var hasId = (typeof(datum.id) != "undefined");
          var hasCount = (datum.count != 1); // Appears twice OR MORE!
          var isDate = !isNaN(datum.times[0].starting_time);
          var duration = datum.typ=="duration";
          var docNr = datum.docNr;

          g.selectAll("svg").select("g.allthedates").data(data).enter().append("path")
              // Path
              .attr("d", function(){
                // line
                if(duration){
                  //var newPath = getLinePath(datum,beginning,scaleFactor)
                  return getLinePath(datum,beginning,scaleFactor)
                }
                //circle
                else{ return getCirclePath(datum,beginning,scaleFactor) }
              })
              .attr("stroke-width", function(){
                if(duration) return 4
                else return 2
                })
              .attr("stroke", function(){
                if(duration){ return "rgb("+colorDate[0]+")" }
                else{ return "#fff"}
                })
              .attr("fill", function(){
                if(docNr==-1){ return "#999" }
                else{
                  if(isDate){ return "rgb("+colorDate[0]+")"; }
                  else{ return "rgba("+colorDate[0]+",0.5)"; }
                  }
                })
              /* Only Click Event right now
              .on("mousemove", function (d, i) { hover(d, index, datum); })
              .on("mouseover", function (d, i) { mouseover(d, i, datum); })
              .on("mouseout", function (d, i) { mouseout(d, i, datum); })
              */
              .on("click", function (d, i) { click(d, index, datum); })
              //.on("brush", function (d, i) { brush(d, index, datum); })
              .attr("class" , function(){
                if(datum.sentNr){
                  if(duration) return "timelineItem timelineItem_sent_"+datum.sentNr+" duration"
                  else return "timelineItem timelineItem_sent_"+datum.sentNr+" date"
                }
                else{ return "timelineItem date" }
               
              })
              .attr("id", function (d, i) {
                if (hasId){ return "timelineItem_"+datum.id; }
                else{ return "timelineItem_"+index; }
              });
          //}


          function getStackPosition(d, i) {
            if (stacked) {
              return margin.top + (itemHeight + itemMargin) * yAxisMapping[index];
            }
            return margin.top;
          }
          
        });
      });

      if (width > gParentSize.width) {
        var move = function() {
          var x = Math.min(0, Math.max(gParentSize.width - width, d3.event.translate[0]));
          zoom.translate([x, 0]);
          g.attr("transform", "translate(" + x + ",0)");
          scroll(x*scaleFactor, xScale);
        };

        var zoom = d3.behavior.zoom().x(xScale).on("zoom", move);

        gParent
          .attr("class", "scrollable")
          .call(zoom);
      }

      if (rotateTicks) {
        g.selectAll("text")
          .attr("transform", function(d) {
            return "rotate(" + rotateTicks + ")translate("
              + (this.getBBox().width / 2 + 10) + "," // TODO: change this 10
              + this.getBBox().height / 2 + ")";
          });
      }

      var gSize = g[0][0].getBoundingClientRect();
      setHeight();

      if (showBorderLine) {
        g.each(function (d, i) {
          d.forEach(function (datum) {
            var times = datum.times;
            times.forEach(function (time) {
              appendLine(xScale(time.starting_time), showBorderFormat);
              appendLine(xScale(time.ending_time), showBorderFormat);
            });
          });
        });
      }

      if (showTodayLine) {
        var todayLine = xScale(new Date());
        appendLine(todayLine, showTodayFormat);
      }

      function getXTextPos(d, i) {
        return margin.left + (d.starting_time - beginning) * scaleFactor - itemHeight;
      }

      function setHeight() {
        if (!height && !gParentItem.attr("height")) {
          if (itemHeight) {
            // set height based off of item height
            height = gSize.height + gSize.top - gParentSize.top;
            // set bounding rectangle height
            d3.select(gParent[0][0]).attr("height", height);
          } else {
            throw "height of the timeline is not set";
          }
        } else {
          if (!height) {
            height = gParentItem.attr("height");
          } else {
            gParentItem.attr("height", height);
          }
        }
      }

      function appendLine(lineScale, lineFormat) {
        gParent.append("svg:line")
          .attr("x1", lineScale)
          .attr("y1", lineFormat.marginTop)
          .attr("x2", lineScale)
          .attr("y2", height - lineFormat.marginBottom)
          .style("stroke", lineFormat.color)//"rgb(6,120,155)")
          .style("stroke-width", lineFormat.width);
      }

    }

    // SETTINGS

    timeline.margin = function (p) {
      if (!arguments.length) return margin;
      margin = p;
      return timeline;
    };

    timeline.orient = function (orientation) {
      if (!arguments.length) return orient;
      orient = orientation;
      return timeline;
    };

    timeline.itemHeight = function (h) {
      if (!arguments.length) return itemHeight;
      itemHeight = h;
      return timeline;
    };

    timeline.itemMargin = function (h) {
      if (!arguments.length) return itemMargin;
      itemMargin = h;
      return timeline;
    };

    timeline.height = function (h) {
      if (!arguments.length) return height;
      height = h;
      return timeline;
    };

    timeline.width = function (w) {
      if (!arguments.length) return width;
      width = w;
      return timeline;
    };

    timeline.display = function (displayType) {
      if (!arguments.length || (DISPLAY_TYPES.indexOf(displayType) == -1)) return display;
      display = displayType;
      return timeline;
    };

    timeline.tickFormat = function (format) {
      if (!arguments.length) return tickFormat;
      tickFormat = format;
      return timeline;
    };

    timeline.hover = function (hoverFunc) {
      if (!arguments.length) return hover;
      hover = hoverFunc;
      return timeline;
    };

    timeline.mouseover = function (mouseoverFunc) {
      if (!arguments.length) return mouseoverFunc;
      mouseover = mouseoverFunc;
      return timeline;
    };

    timeline.mouseout = function (mouseoverFunc) {
      if (!arguments.length) return mouseoverFunc;
      mouseout = mouseoverFunc;
      return timeline;
    };

    timeline.click = function (clickFunc) {
      if (!arguments.length) return click;
      click = clickFunc;
      return timeline;
    };

    // NEW BRUSHING
    

    timeline.scroll = function (scrollFunc) {
      if (!arguments.length) return scroll;
      scroll = scrollFunc;
      return timeline;
    };

    timeline.colors = function (colorFormat) {
      if (!arguments.length) return colorCycle;
      colorCycle = colorFormat;
      return timeline;
    };

    timeline.beginning = function (b) {
      if (!arguments.length) return beginning;
      beginning = b;
      return timeline;
    };

    timeline.ending = function (e) {
      if (!arguments.length) return ending;
      ending = e;
      return timeline;
    };

    timeline.rotateTicks = function (degrees) {
      rotateTicks = degrees;
      return timeline;
    };

    timeline.stack = function () {
      stacked = !stacked;
      return timeline;
    };

    timeline.showBorderLine = function () {
        showBorderLine = !showBorderLine;
        return timeline;
    };

    timeline.showBorderFormat = function(borderFormat) {
      if (!arguments.length) return showBorderFormat;
      showBorderFormat = borderFormat;
      return timeline;
    };

    timeline.showToday = function () {
      showTodayLine = !showTodayLine;
      return timeline;
    };

    timeline.showTodayFormat = function(todayFormat) {
      if (!arguments.length) return showTodayFormat;
      showTodayFormat = todayFormat;
      return timeline;
    };

    timeline.colorProperty = function(colorProp) {
      if (!arguments.length) return colorPropertyName;
      colorPropertyName = colorProp;
      return timeline;
    };


    return timeline;
  };
})();
