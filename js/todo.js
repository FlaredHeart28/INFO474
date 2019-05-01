(function() {

  let allYearsData = "no data"
  let svgContainer = "";
  let dropBox = "";
  let dots = "";
  let currYear = 1960;

  window.onload = function() {
    dropBox = d3.select("body").append("select")
      .attr("name", "year-list")
      .style("display", "block")
      .style('margin', "auto")
      .on("change", onChange);

    svgContainer = d3.select("body")
      .append('svg')
      .attr('width', 500)
      .attr('height', 500)
      .style('display', "block")
      .style('margin', "auto");
    
    d3.csv("data/dataEveryYear.csv")
      .then((data) => {
        addToDropDown(data);
        makeScatterPlot(data);
      });
  }


  function addToDropDown(data) {
    let years = data.filter((row) => row['location'] =='AUS');

    let options = dropBox.selectAll("option")
    .data(years)
    .enter()
      .append("option");
    options.text((d) => {return d.time;})
      .attr("value", (d) => {return d.time;});
  }

  function onChange() {
    currYear = dropBox.property("value")
    console.log(currYear);
    dots
      .style("display", (d) => {
        if (d.time != currYear) {
          return "none";
        } else {
          return "inline";
        }
      })
  }

  function makeScatterPlot(csvData) {
    allYearsData = csvData;
    let fertility_rate_data = allYearsData.map((row) => parseInt(row.fertility_rate));
    let life_expectancy_data = allYearsData.map((row) => parseInt(row.life_expectancy));

    let minMaxData = findMinMax(fertility_rate_data, life_expectancy_data);

    let scaleAndMapFuncs = drawAxes(minMaxData, "fertility_rate", "life_expectancy");

    plotData(scaleAndMapFuncs);

    makeLabels();
  }

  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([50, 450]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  function plotData(mapFunctions) {
    let popData = allYearsData.map((row) => +row["pop_mlns"]);
    let popMinMax = d3.extent(popData);

    let pop_map_func = d3.scaleLinear()
      .domain([popMinMax[0], popMinMax[1]])
      .range([3, 30]);

    let xMap = mapFunctions.x;
    let yMap = mapFunctions.y;

    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


    dots = svgContainer.selectAll(".dot")
      .data(allYearsData)
      .enter()
      .append("circle")
        .attr("class", (d) => d.time)
        .attr("cx", xMap)
        .attr("cy", yMap)
        .attr("r", (d) =>   pop_map_func(d["pop_mlns"]))
        .attr("fill", "steelblue")
        .style("display", (d) => {
          if (d.time != currYear) {
            return "none";
          } else {
            return "inline";
          }
        })
        //adding tooltip
        .on("mouseover", (d) => {
          div.transition()
            .duration(200)
            .style("opacity", .9);
          div.html(d.location + "<br/>" + numberWithCommas(d["pop_mlns"]*1000000))
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
            dots.transition()
              .attr("cx", xMap)
              .attr("cy", yMap)
              .attr("r", (d) => pop_map_func(d["pop_mlns"]));
        });
  }

  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 100)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text("Countries by Life Expectancy and Fertility Rate");

    svgContainer.append('text')
      .attr('x', 130)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Fertility Rates (Avg Children per Woman)');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy (years)');
  }

})();
