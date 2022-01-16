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
  var chartHeightOne = 300;
  var chartHeightTwo = 400;
  var monthNameFormat = d3.timeFormat("%b");
  var dateFormat = d3.timeFormat("%Y-%m-%d");
  var monthYear = d3.timeFormat("%b %Y");
  var yearFormat = d3.timeFormat("%Y");
  var monthFormat = d3.timeFormat("%m");
  var monYrFormat = d3.timeFormat("%Y %m");
  var dayFormat = d3.timeFormat("%d");
  var dollarFormat = d3.format("$,.2f");
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
    const theDate = d.fieldData.ShippedDate;
    const tempDate = new Date(theDate);

    d.date = tempDate;
    d.month = monthFormat(tempDate);
    d.monthName = monthNameFormat(tempDate);
    d.monYr = monYrFormat(tempDate);
    d.day = dayFormat(tempDate);
    d.year = yearFormat(tempDate);
    d.IsOnTime = d.fieldData.OnTime
      ? "On Time"
      : d.fieldData.OnTime === 0
      ? "Late"
      : "Fred";
    d.onTime = d.IsOnTime === "On Time";
  });

  var facts = crossfilter(data);
  function onTimeAdd(i, d) {
    if (d.IsOnTime === "On Time") {
      ++i.OnTime;
    } else if (d.IsOnTime === "Late") {
      ++i.Late;
    }
    return i;
  }
  function onTimeRemove(i, d) {
    if (d.IsOnTime === "On Time") {
      --i["On Time"];
    } else if (d.IsOnTime === "Late") {
      --i["Late"];
    }
    return i;
  }

  function onTimeInitial(i, d) {
    return {
      Late: 0,
      OnTime: 0,
    };
  }

  //         lastDate = d3.max(facts, function(x) { return x['End Date']; });
  var clipPadding = 30;
  var dateDimension = facts.dimension(function (d) {
    return d.date;
  });
  var dateGroup = dateDimension.group().reduceSum(function (d) {
    return d.fieldData.LeadTime;
  });
  print_filter(dateGroup);
  var monthYearDim = facts.dimension(function (d) {
    return d.year + " " + d.monthName;
  });
  var monthYearGroup = monthYearDim.group();
  var yearDimension = facts.dimension(function (d) {
    return d.year;
  });
  var yearGroup = yearDimension.group();
  var yearDimensionStatus = facts.dimension(function (d) {
    return d.month;
  });
  var yearGroupStatus = yearDimensionStatus.group();
  var monthDimension = facts.dimension(function (d) {
    return d.month;
  });

  var monthDimension = facts.dimension(function (d) {
    return d.month;
  });
  var monthGroup = monthDimension.group();
  const onTimeGroupOverTime = yearDimensionStatus
    .group()
    .reduce(onTimeAdd, onTimeRemove, onTimeInitial);
  const onTimeDim = facts.dimension(function (d) {
    return d.IsOnTime;
  });
  const onTimeGroup = onTimeDim.group();

  var estimateDim = facts.dimension(function (d) {
    return d.fieldData.Estimate;
  });

  var currentColor = "orange";
  var previousColor = "green";
  var estimateGroup = filterEstimates(estimateDim.group());
  var onTimeCompChart = dc.compositeChart("#onTimeChart");
  var onTimeCompChartLate = dc.lineChart(onTimeCompChart);
  var onTimeCompChartOnTime = dc.lineChart(onTimeCompChart);
  const overTime = dc.lineChart("#overTime");

  overTime
    // .width(1300)
    .height(500)
    .dimension(dateDimension)
    .group(dateGroup)
    .x(d3.scaleTime().domain([new Date(2019, 0, 1), new Date(2021, 12, 31)]))
    .xUnits(d3.timeMonths)
    .renderHorizontalGridLines(true)
    .renderVerticalGridLines(true)
    .brushOn(false)
    .yAxisLabel("Lead Time (Days)")
    .xAxisLabel("Date")
    .legend(dc.legend().x(80).y(20).itemHeight(13).gap(5));
  onTimeCompChartOnTime
    .colors(currentColor)
    .group(onTimeGroupOverTime, "On Time")
    .curve(d3.curveMonotoneX)
    .renderLabel(false)
    .valueAccessor(function (d) {
      return d.value.OnTime;
    });

  onTimeCompChartLate
    .colors(previousColor)
    .curve(d3.curveMonotoneX)
    .renderLabel(false)
    .group(onTimeGroupOverTime, "Late")
    .valueAccessor(function (d) {
      return d.value.Late;
    });

  onTimeCompChart
    .height(350)
    .renderHorizontalGridLines(true)
    .renderVerticalGridLines(true)
    .x(d3.scaleOrdinal())
    .xUnits(dc.units.ordinal)
    .legend(dc.legend().x(50).y(20).itemHeight(20).gap(5).horizontal(true))
    .dimension(yearDimensionStatus)
    .group(yearGroupStatus)
    .elasticX(true)
    .elasticY(true)
    ._rangeBandPadding(1)
    .renderlet(function (chart) {
      // rotate x-axis labels
      chart
        .selectAll("g.x text")
        .attr("transform", "translate(-10,10) rotate(315)");
    })
    .brushOn(false)
    .title(function (d) {
      var obj = "On Time: " + d.value.OnTime + "\n" + "Late: " + d.value.Late;
      return obj;
    })
    .compose([onTimeCompChartOnTime, onTimeCompChartLate]);

  //Disc Type Dimension
  var onTimePieChart = dc
    .pieChart("#onTimePieChart")
    .height(350)
    .dimension(onTimeDim)
    .label(function (d) {
      return d.key + ": " + d.value;
    })
    .group(onTimeGroup);

  //Year Dimension
  var barChartYear = dc
    .barChart("#years")
    .height(chartHeightOne)
    .dimension(yearDimension)
    .group(yearGroup)
    .renderLabel(true)
    .x(d3.scaleBand())
    .xUnits(dc.units.ordinal)
    .renderLabel(true)
    .renderHorizontalGridLines(true)
    .elasticY(true)
    .title(function (d) {
      return d.key + " " + d.value;
    });

  //Month Dimension
  var barChartMon = dc
    .barChart("#months")
    .height(chartHeightOne)
    .dimension(monthDimension)
    .group(monthGroup)
    .x(d3.scaleBand())
    .xUnits(dc.units.ordinal)
    .renderLabel(true)
    .renderHorizontalGridLines(true)
    .elasticY(true)
    .clipPadding(100)
    .colorAccessor(function (d, i) {
      return i;
    })
    .elasticX(true);

  barChartMon.margins().top = 30;
  barChartYear.margins().top = 30;
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
