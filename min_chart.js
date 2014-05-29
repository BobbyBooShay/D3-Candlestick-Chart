
function init() {

    var w = 600;
    var h = 400;

    var window_width = 20;
    var svg = d3.select("body").append("svg").attr("width", w).attr("height", h);
    
    var x_scale = d3.scale.ordinal()
    .domain(d3.range(olhc_list.length))
    .rangeRoundBands([0, w], 0.1);
    
    var y_scale = d3.scale.linear()
    .domain([d3.min(olhc_list, function(d){ 
        return d['l']; 
    }), d3.max(olhc_list, function(d){ 
        return d['h']; 
    })])
    .range([50, h-50]);
    
    
             

    svg.selectAll("rect")
    .data(olhc_list)
    .enter()
    .append("rect")
    .attr("x", function(d, i) {
        return x_scale(i);
    })
    .attr("y", function(d, i) {
        return Math.ceil(h-y_scale(d['l']));
    })
    .attr("width", x_scale.rangeBand())
    .attr("height", function(d) {
        return y_scale(d['h'])-y_scale(d['l']);
    })
    .attr("fill", function(d) {
        if(d['o'] <= d['c'])
            return "rgb(76, 214, 15)";
        else
            return "red";
    })
    .attr("style", function(d) {
        return "" + d['l'] + "," + d['h'] ;
    });
    /*
    svg.selectAll("line")
    .data(olhc_list)
    .enter()
    .append("line")
    .attr("x1", function(d, i) {
        return i*10+5;
    })
    .attr("y1", function(d, i) {
        return 0;
    })
    .attr("x2", function(d, i) {
        return i*10+5;
    })
    .attr("y2", function(d) {
        return 100;
    })
    .attr("style", function(d) {
        if(d['o'] <= d['c'])
            return "stroke:lightgreen;stroke-width:1";
        else
            return "stroke:red;stroke-width:1";
    });
    */
    console.log('init');

}

function refresh() {
    init();

}