//Here we're importing items we'll need. You can add other imports here.
import "./style.css";
import "regenerator-runtime/runtime.js";
import "bootstrap/dist/css/bootstrap.min.css";

import * as dc from "dc";
import * as d3 from "d3";
import crossfilter from "crossfilter2";
// import { tempData } from "./data";
function print_filter(filter) {
  var f = eval(filter);
  if (typeof f.length != "undefined") {
  } else {
  }
  if (typeof f.top != "undefined") {
    f = f.top(Infinity);
  } else {
  }
  if (typeof f.dimension != "undefined") {
    f = f
      .dimension(function (d) {
        return "";
      })
      .top(Infinity);
  } else {
  }
  console.log(
    filter +
      "(" +
      f.length +
      ") = " +
      JSON.stringify(f)
        .replace("[", "[\n\t")
        .replace(/}\,/g, "},\n\t")
        .replace("]", "\n]")
  );
}
function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}
window.loadChart = (arr) => {
  var data = JSON.parse(arr);
  console.log(data);
  var chartHeightOne = 300;
  var chartHeightTwo = 400;
  var monthNameFormat = d3.timeFormat("%b");
  var dateFormat = d3.timeFormat("%Y-%m-%d");
  var percentFormat = d3.format(".0%");
  var monthYear = d3.timeFormat("%b %y");
  var yearFormat = d3.timeFormat("%Y");
  var monthFormat = d3.timeFormat("%m");
  var monYrFormat = d3.timeFormat("%Y %m");
  var dayFormat = d3.timeFormat("%d");
  var dollarFormat = d3.format("$,.2f");
  var decimalFormat = d3.format(".2f");
  var today = new Date();
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  var fullFormat = d3.timeFormat("%Y-%m-%d");
  function filterEstimates(source_group) {
    return {
      all: function () {
        return source_group.all().filter(function (d) {
          return d.value != 0; // if integers only
        });
      },
    };
  }
  data.forEach(function (d) {
    const theDate = d.fieldData.Date;
    const tempDate = new Date(theDate);

    d.date = tempDate;
    console.log(d.date);
    d.month = monthFormat(tempDate);
    d.monthName = monthNameFormat(tempDate);
    d.monYr = monYrFormat(tempDate);
    d.day = dayFormat(tempDate);
    d.year = yearFormat(tempDate);
  });

  var facts = crossfilter(data);

  //         lastDate = d3.max(facts, function(x) { return x['End Date']; });
  var clipPadding = 30;
  var dateDimension = facts.dimension(function (d) {
    return d.date;
  });
  var dateTotalGroup = dateDimension.group().reduceSum(function (d) {
    return d.fieldData.Total;
  });
  var dateOnTimeGroup = dateDimension.group().reduceSum(function (d) {
    return d.fieldData.TotalOnTime;
  });
  var dateLateGroup = dateDimension.group().reduceSum(function (d) {
    return d.fieldData.TotalLate;
  });
  const datePercentGroup = dateDimension.group().reduceSum(function (d) {
    return (d.fieldData.TotalOnTime / d.fieldData.Total) * 100;
  });

  print_filter(datePercentGroup);
  var currentColor = "orange";
  var previousColor = "green";
  // var estimateGroup = filterEstimates(estimateDim.group());
  var deliveriesOverTime = dc.compositeChart("#deliveriesOverTime");
  var onTimeCompChartLate = dc.lineChart(deliveriesOverTime);
  var onTimeCompChartOnTime = dc.lineChart(deliveriesOverTime);
  var onTimeCompChartPercent = dc.lineChart("#percentChart");
  // const overTime = dc.lineChart("#overTime");

  // overTime
  //   // .width(1300)
  //   .height(500)
  //   .dimension(dateDimension)
  //   .group(dateGroup)
  //   .x(d3.scaleTime().domain([new Date(2019, 0, 1), new Date(2021, 12, 31)]))
  //   .xUnits(d3.timeMonths)
  //   .renderHorizontalGridLines(true)
  //   .renderVerticalGridLines(true)
  //   .brushOn(false)
  //   .yAxisLabel("Lead Time (Days)")
  //   .xAxisLabel("Date")
  //   .legend(dc.legend().x(80).y(20).itemHeight(13).gap(5));
  onTimeCompChartOnTime
    .colors(currentColor)
    .group(dateOnTimeGroup, "On Time")
    .title(function (d) {
      return monthYear(d.key) + " " + d.value;
    })

    .curve(d3.curveMonotoneX)
    .renderLabel(false);

  onTimeCompChartLate
    .colors(previousColor)
    .curve(d3.curveMonotoneX)
    .renderLabel(false)
    .title(function (d) {
      return monthYear(d.key) + " " + d.value;
    })

    .group(dateLateGroup, "Late");

  onTimeCompChartPercent
    .colors("red")
    .curve(d3.curveMonotoneX)
    // .labels(true)
    .label(function (d) {
      return d.value;
    })
    .renderLabel(false)
    .title(function (d) {
      return monthYear(d.key) + " " + d3.format(".0f")(d.value) + "%";
    })
    .yAxisLabel("Percentage")
    .height(300)
    .renderHorizontalGridLines(true)
    .renderVerticalGridLines(true)
    .x(d3.scaleTime())
    .xUnits(d3.timeWeeks)
    // .legend(dc.legend().x(50).y(20).itemHeight(20).gap(5).horizontal(true))
    .dimension(dateDimension)
    .elasticX(true)
    .brushOn(false)

    .elasticY(true)
    ._rangeBandPadding(1)
    .group(datePercentGroup, "Percent On Time");

  deliveriesOverTime
    .yAxisLabel("Totals")
    .height(300)
    .renderHorizontalGridLines(true)
    .renderVerticalGridLines(true)
    .x(d3.scaleTime())
    .xUnits(d3.timeWeeks)
    .legend(dc.legend().x(50).y(20).itemHeight(20).gap(5).horizontal(true))
    .dimension(dateDimension)
    .group(dateTotalGroup)
    .elasticX(true)
    .elasticY(true)
    ._rangeBandPadding(1)
    // .renderlet(function (chart) {
    //   // rotate x-axis labels
    //   chart
    //     .selectAll("g.x text")
    //     .attr("transform", "translate(-10,10) rotate(315)");
    // })
    .brushOn(false)
    // .title(function (d) {
    //   var obj = monthYear(d.key) + " " + d.value;
    //   return obj;
    // })
    .shareTitle(false)
    .compose([onTimeCompChartOnTime, onTimeCompChartLate]);

  //Disc Type Dimension
  // var onTimePieChart = dc
  //   .pieChart("#onTimePieChart")
  //   .height(350)
  //   .dimension(onTimeDim)
  //   .label(function (d) {
  //     return d.key + ": " + d.value;
  //   })
  //   .group(onTimeGroup);

  // //Year Dimension
  // var barChartYear = dc
  //   .barChart("#years")
  //   .height(chartHeightOne)
  //   .dimension(yearDimension)
  //   .group(yearGroup)
  //   .renderLabel(true)
  //   .x(d3.scaleBand())
  //   .xUnits(dc.units.ordinal)
  //   .renderLabel(true)
  //   .renderHorizontalGridLines(true)
  //   .elasticY(true)
  //   .title(function (d) {
  //     return d.key + " " + d.value;
  //   });

  // //Month Dimension
  // var barChartMon = dc
  //   .barChart("#months")
  //   .height(chartHeightOne)
  //   .dimension(monthDimension)
  //   .group(monthGroup)
  //   .x(d3.scaleBand())
  //   .xUnits(dc.units.ordinal)
  //   .renderLabel(true)
  //   .renderHorizontalGridLines(true)
  //   .elasticY(true)
  //   .clipPadding(100)
  //   .colorAccessor(function (d, i) {
  //     return i;
  //   })
  //   .elasticX(true);
  onTimeCompChartPercent.xAxis().tickFormat(function (d) {
    return monthYear(d);
  });

  onTimeCompChartPercent
    .yAxis()
    .tickFormat(function (d) {
      return percentFormat(d / 100);
    })
    .ticks(d3.timeMonth.every(2));

  deliveriesOverTime
    .xAxis()
    .tickFormat(function (d) {
      return monthYear(d);
    })
    .ticks(d3.timeMonth.every(1));

  dc.renderAll();

  function getFilters() {
    dc.chartRegistry.list().forEach(function (e) {
      var f = e.filters();
      if (f.length > 0) {
        console.log(e.root());
      }
    });
  }
};
