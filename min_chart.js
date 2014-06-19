var margin = {top: 20, right: 10, bottom: 20, left: 10},
    axis_width = 30,
    volume_height = 150,
    volume_padding = 20,
    outer_width = 600,
    outer_height = 350,
    width = outer_width - margin.left - margin.right,
    height = outer_height - margin.top - margin.bottom;
var min_max_font_size = "5";

var red = "rgb(224,31,38)";
green = "rgb(76, 214, 15)"
var background_color = "white";

var show_text = false;
show_bound = true;



var unit_width = 0;
var window_size = 30;

var svg = d3.select("body").append("svg").attr("width", outer_width).attr("height", outer_height + volume_height);
var olhc = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var volume = svg.append("g").attr("transform", "translate(" + margin.left + "," + (height + margin.top + 5) + ")");

if(show_bound)
{
    olhc.append("rect")
    .attr("class", "outer")
    .attr("width", width)
    .attr("height", height)
    .attr("style", "fill:" + background_color);
}
if(show_bound)
{
    var volume_rect = volume.append("rect")
    .attr("class", "outer")
    .attr("width", width)
    .attr("height", volume_height)
    .attr("style", "fill:" + background_color);    
}


function init()
{
    var dataset = limit_dataset(window_size, 0);
    update_olhc(dataset);
    update_volume(dataset);    
    mouse();
}


function limit_dataset(window_size, offset_from_back) {
    return _.first(_.last(olhc_list, window_size + offset_from_back), window_size);
}

var move_offset = 0;

function refresh(offset) {
    move_offset += offset;

    if(move_offset < 0)
        move_offset = 0;
    if(move_offset > olhc_list.length - window_size)
        move_offset = olhc_list.length - window_size;
    
    

    var dataset = limit_dataset(window_size * (last_zoom_scale), move_offset);        

    update_olhc(dataset);
    update_volume(dataset);
}

var drag_start_x;
var last_zoom_scale = 1;
function mouse()
{
    var drag = d3.behavior.drag()
    .on("dragstart", function() {
        d3.event.sourceEvent.stopPropagation(); // silence other listeners
        var point = d3.mouse(this), p = {x: point[0], y: point[1] };
        drag_start_x = p.x; })
    .on("drag", function(){ 
        var point = d3.mouse(this), p = {x: point[0], y: point[1] };
        var move_amount = Math.abs(drag_start_x - p.x);
        var move_size = Math.ceil(move_amount / unit_width);

        if(move_amount > unit_width)
        {
            if(drag_start_x > p.x)
                refresh(-1);
            else
                refresh(1);

            drag_start_x = p.x;
        }
    });

    
    var zoom = d3.behavior.zoom()
    .scaleExtent([1,4])
    .on("zoom", function(){
        var scale = d3.event.scale;
        console.log('zoom ' + scale);
        
        
        if(last_zoom_scale != scale)
            refresh(0);
        
        
        
        last_zoom_scale = scale;
    });

    svg.call(drag);
    svg.call(zoom);

}

function o(d) { return Number(d['o']); }
function l(d) { return Number(d['l']); }
function h(d) { return Number(d['h']); }
function c(d) { return Number(d['c']); }
function v(d) { return Number(d['v']); }

function update_olhc(dataset)
{


    var height_max = d3.max(dataset, function(d) { return h(d) - l(d); });
    var min = d3.min(dataset, function(d){  return l(d); });
    var max = d3.max(dataset, function(d){  return h(d); });

    var x_scale = d3.scale.ordinal().domain(d3.range(dataset.length)).rangeRoundBands([0, width - axis_width], 0.1);
    var y_scale = d3.scale.linear().domain([min - min/250, max + max/250]).range([height, 0]);

    //스크롤을 위한 단위너비값 저장
    unit_width = x_scale.rangeBand();

    var price_axis = d3.svg.axis().scale(y_scale).orient("left");

    //add axix
    olhc.selectAll("g.axis").remove();
    olhc.append("g").attr("class", "axis").attr("transform", "translate(" + width + ",0)").call(price_axis);

    //line
    olhc.selectAll("g.olhc").remove();
    olhc_group = olhc.selectAll("g.olhc").data(dataset).enter();

    olhc_group.append("g").attr("class", "olhc").append("line")
    .attr("style", function(d) { return (o(d) <= c(d)?"stroke:" + green + ";stroke-width:0.5":"stroke:" + red + ";stroke-width:0.5"); })
    .attr("x1", function(d, i) { return x_scale(i) + x_scale.rangeBand()/2; })
    .attr("x2", function(d, i) { return x_scale(i) + x_scale.rangeBand()/2; })
    .attr("y1", function(d, i) { return y_scale(l(d)); })
    .attr("y2", function(d, i) {
        //min, max 출력
        if(h(d) == max)
            add_max(d3.select(this.parentNode), max, x_scale(i) + x_scale.rangeBand()/2, y_scale(l(d)) + (y_scale(h(d)) - y_scale(l(d))) - 15);
        else if(l(d) == min)
            add_min(d3.select(this.parentNode), min, x_scale(i) + x_scale.rangeBand()/2, y_scale(l(d)) + 15);

        return (y_scale(l(d))) + (y_scale(h(d)) - y_scale(l(d)));
    });


    if(show_text)
    {
        olhc_group.append("text")
        .attr("x", function(d, i){ return x_scale(i) + x_scale.rangeBand()/2; })
        .attr("y", function(d, i){ return y_scale(l(d)); })
        .text(function(d,i){ return l(d); })
        .attr("font-size", "5");

        olhc_group.append("text")
        .attr("x", function(d, i){ return x_scale(i) + x_scale.rangeBand()/2; })
        .attr("y", function(d, i){ return (y_scale(l(d))) + (y_scale(h(d)) - y_scale(l(d))); })
        .text(function(d,i){ return h(d); })
        .attr("font-size", "5");

    }

    //rect
    olhc_group.append("g").attr("class", "olhc").append("rect")
    .attr("x", function(d, i) { return x_scale(i); })
    .attr("width", x_scale.rangeBand())
    .attr("y", function(d, i) { return y_scale(Math.max(c(d), o(d))); })
    .attr("height", function(d) { return Math.abs(y_scale(o(d))-y_scale(c(d))); })
    .attr("style", function(d) { return (o(d) <= c(d)?"fill:" + background_color + ";stroke:" + green + ";stroke-width:1":"fill:" + red); });


    if(show_text)
    {
        olhc_group.append("text")
        .attr("x", function(d, i){ return x_scale(i); })
        .attr("y", function(d, i){ return y_scale(Math.max(c(d), o(d))); })
        .text(function(d,i){ return Math.max(c(d), o(d)); })
        .attr("font-size", "7");

        olhc_group.append("text")
        .attr("x", function(d, i){ return x_scale(i); })
        .attr("y", function(d, i){ return y_scale(Math.max(c(d), o(d))) + Math.abs(y_scale(o(d))-y_scale(c(d))); })
        .text(function(d,i){ return Math.min(c(d), o(d)); })
        .attr("font-size", "10");    
    }


}
function update_volume(dataset)
{
    //volume
    var max_dataset = d3.max(dataset, function(d){ 
        return Number(v(d)); 
    });
    var max_volume = Math.ceil(max_dataset/50)*50;

    var x_scale = d3.scale.ordinal()
    .domain(d3.range(dataset.length))
    .rangeRoundBands([0, width - axis_width], 0.1);

    var y_scale = d3.scale.linear()
    .domain([0, max_volume])
    .range([volume_height, 0]);

    var ticks = [max_volume/2, max_volume];
    ticks.push(Number(_.last(dataset)['v']));

    var volume_axis = d3.svg.axis().scale(y_scale).orient("left").tickValues(ticks).tickFormat(d3.format(",.0f"));

    //add axis
    volume.selectAll("g.axis").remove();
    volume.append("g").attr("class", "axis").attr("transform", "translate(" + width + ",0)").call(volume_axis);

    //rect
    volume.selectAll("g.volume").remove();
    volume_group = volume.selectAll("g.volume").data(dataset);

    volume_group.enter().append("g").attr("class", "volume").append("rect")
    .attr("x", function(d, i) { return x_scale(i); })
    .attr("width", x_scale.rangeBand())
    .attr("y", function(d, i) {
        //draw last volume
        if(i >= dataset.length-1) {
            var node = d3.select(this.parentNode).append("line")
            .attr("x1", function(d) { return x_scale(i); })
            .attr("x2", function(d) { return x_scale(i) + width - x_scale(i) - v(d).toString().width(); })
            .attr("y1", function(d) { return y_scale(v(d)); })
            .attr("y2", function(d) { return y_scale(v(d)); })
            .attr("style", function(d) { return "stroke:black;stroke-width:1"; });
        }
        return y_scale(v(d));
    })
    .attr("height", function(d) { return volume_height - y_scale(v(d)); })
    .attr("style", function(d) { return (o(d) <= c(d)?"fill:" + green + ";":"fill:" + red + ";"); });

    if(show_text)
    {
        group.append("text")
        .attr("x", function(d, i){ return x_scale(i); })
        .attr("y", function(d, i){ return y_scale(v(d)); })
        .text(function(d,i){ return v(d); })
        .attr("font-size", "7");    
    }
}














//min max

function add_max(node, value, x, y) {
    var text = add_text(node, x, y);

    text.append("tspan")
    .attr("x", x).attr("dy", 0)
    .text(value);

    text.append("tspan")
    .attr("x", x).attr("dy", 10)
    .text("↓");
}

function add_min(node, value, x, y) {
    var text = add_text(node, x, y);

    text.append("tspan")
    .attr("x", x).attr("dy", 0)
    .text("↑");

    text.append("tspan")
    .attr("x", x).attr("dy", 10)
    .text(value);


}

function add_text(node, x, y) {
    return node.append("text")            
    .attr("font-size", min_max_font_size)
    .attr("text-anchor", "middle")
    .attr("x", x)
    .attr("y", y);
}

//util

String.prototype.width = function(font) {
    var f = font || min_max_font_size + 'px arial',
        o = $('<div>' + this + '</div>')
    .css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': f})
    .appendTo($('body')),
        w = o.width();

    o.remove();

    return w;
}
