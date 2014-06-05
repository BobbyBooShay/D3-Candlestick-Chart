var margin = {top: 20, right: 10, bottom: 20, left: 10},
    axis_width = 30,
    volume_height = 150,
    volume_padding = 20,
    outer_width = 600,
    outer_height = 350,
    width = outer_width - margin.left - margin.right,
    height = outer_height - margin.top - margin.bottom;

var red = "rgb(224,31,38)";
green = "rgb(76, 214, 15)"

var show_text = false;
show_bound = true;

var window_size = 29;
var background_color = "white";

var group;

function limit_dataset(window_size, offset_from_back) {
    return _.first(_.last(olhc_list, window_size + offset_from_back), window_size);
}

function refresh(offset) {
    var dataset = limit_dataset(window_size, offset);
    console.log(dataset);

    var svg = d3.select("body").append("svg").attr("width", outer_width).attr("height", outer_height + volume_height);

    update_olhc(svg, dataset);
    update_volume(svg, dataset);
    drag(svg);
 
    console.log('init');
}


function update(offset) {
    var dataset = limit_dataset(window_size, offset);
    group.data(dataset);
    
    var svg = d3.select("body").append("svg").attr("width", outer_width).attr("height", outer_height + volume_height);
    update_olhc(svg, dataset);
    update_volume(svg, dataset);
    
    console.log('updated');
}

function drag(svg)
{
    var drag = d3.behavior.drag()
    .on("dragstart", dragstarted)
    .on("drag", dragged)
    .on("dragend", dragended);
    
    svg.call(drag);
}

var drag_start_x;
function dragstarted(d, i) {
    var point = d3.mouse(this), p = {x: point[0], y: point[1] };
    drag_start_x = p.x;
    d3.event.sourceEvent.stopPropagation();
    
    d3.select(this).classed("dragging", true);
}

function dragged(d, i) {
    var point = d3.mouse(this), p = {x: point[0], y: point[1] };
    if(drag_start_x > p.x)
    {
        
        console.log('inc');
    }
    else
    {
        update(1);
        //getOLHCPeriod(oldest_timestamp-10000, oldest_timestamp, 0);
        console.log('dec');
    }

}

function dragended(d, i) {
    var point = d3.mouse(this), p = {x: point[0], y: point[1] };
    
    
    
    d3.select(this).classed("dragging", false);
}

function o(d) { return Number(d['o']); }
function l(d) { return Number(d['l']); }
function h(d) { return Number(d['h']); }
function c(d) { return Number(d['c']); }
function v(d) { return Number(d['v']); }

function update_olhc(svg, dataset)
{
    var olhc = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var height_max = d3.max(dataset, function(d) {
        return h(d) - l(d);
    });
    var min = d3.min(dataset, function(d){ 
        return l(d); 
    });
    var max = d3.max(dataset, function(d){ 
        return h(d); 
    });

    var x_scale = d3.scale.ordinal()
    .domain(d3.range(dataset.length))
    .rangeRoundBands([0, width - axis_width], 0.1);

    var y_scale = d3.scale.linear()
    .domain([min - min/100, max + max/100])
    .range([height, 0]);


    if(show_bound)
    {
        var inner_rect = olhc.append("rect")
        .attr("class", "outer")
        .attr("width", width)
        .attr("height", height)
        .attr("style", "fill:" + background_color);

    }


    var price_axis = d3.svg.axis().scale(y_scale).orient("left");
    olhc.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + width + ",0)")
    .call(price_axis);


    group = olhc.append("g").selectAll("g")
    .data(dataset)
    .enter()
    .append("g");
    
    

    //line
    group.append("line")
    .attr("x1", function(d, i) {
        return x_scale(i) + x_scale.rangeBand()/2;
    })
    .attr("x2", function(d, i) {
        return x_scale(i) + x_scale.rangeBand()/2;
    })
    .attr("y1", function(d, i) {
        return y_scale(l(d));
    })
    .attr("y2", function(d, i) {
        //min, max 출력
        if(h(d) == max)
        {
            var x = x_scale(i) + x_scale.rangeBand()/2;
            var y = y_scale(l(d)) + (y_scale(h(d)) - y_scale(l(d))) - 15;
            add_max(d3.select(this.parentNode), max, x, y);
        }
        else if(l(d) == min)
        {
            var x = x_scale(i) + x_scale.rangeBand()/2;
            var y = y_scale(l(d)) + 15;
            add_min(d3.select(this.parentNode), min, x, y);
        }

        return (y_scale(l(d))) + (y_scale(h(d)) - y_scale(l(d)));
    })
    .attr("style", function(d) {
        if(o(d) <= c(d))
            return "stroke:" + green + ";stroke-width:0.5";
        else
            return "stroke:" + red + ";stroke-width:0.5";

    });

    if(show_text)
    {
        group.append("text")
        .attr("x", function(d, i){ return x_scale(i) + x_scale.rangeBand()/2; })
        .attr("y", function(d, i){ return y_scale(l(d)); })
        .text(function(d,i){ return l(d); })
        .attr("font-size", "5");

        group.append("text")
        .attr("x", function(d, i){ return x_scale(i) + x_scale.rangeBand()/2; })
        .attr("y", function(d, i){ return (y_scale(l(d))) + (y_scale(h(d)) - y_scale(l(d))); })
        .text(function(d,i){ return h(d); })
        .attr("font-size", "5");

    }

    //rect
    group.append("rect")
    .attr("x", function(d, i) {
        return x_scale(i);
    })
    .attr("width", x_scale.rangeBand())

    .attr("y", function(d, i) {
        return y_scale(Math.max(c(d), o(d)));
    })
    .attr("height", function(d) {
        return Math.abs(y_scale(o(d))-y_scale(c(d)));
    })
    .attr("style", function(d) {
        if(o(d) <= c(d))
        {
            return "fill:" + background_color + ";stroke:" + green + ";stroke-width:1";    
        }
        else
        {
            return "fill:" + red;    
        }
    });


    if(show_text)
    {
        group.append("text")
        .attr("x", function(d, i){ return x_scale(i); })
        .attr("y", function(d, i){ return y_scale(Math.max(c(d), o(d))); })
        .text(function(d,i){ return Math.max(c(d), o(d)); })
        .attr("font-size", "7");

        group.append("text")
        .attr("x", function(d, i){ return x_scale(i); })
        .attr("y", function(d, i){ return y_scale(Math.max(c(d), o(d))) + Math.abs(y_scale(o(d))-y_scale(c(d))); })
        .text(function(d,i){ return Math.min(c(d), o(d)); })
        .attr("font-size", "10");    
    }


}
function update_volume(svg, dataset)
{
    //volume
    var volume = svg.append("g").attr("transform", "translate(" + margin.left + "," + (height + margin.top + 5) + ")");

    if(show_bound)
    {
        var volume_rect = volume.append("rect")
        .attr("class", "outer")
        .attr("width", width)
        .attr("height", volume_height)
        .attr("style", "fill:" + background_color);    
    }


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
    volume.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + width + ",0)")
    .call(volume_axis);

    var group = volume.append("g").selectAll("g")
    .data(dataset)
    .enter()
    .append("g");
    
    

    //rect
    group.append("rect")
    .attr("x", function(d, i) {
        return x_scale(i);
    })
    .attr("width", x_scale.rangeBand())

    .attr("y", function(d, i) {
        if(i >= dataset.length-1)
        {

            var node = d3.select(this.parentNode);
            node.append("line")
            .attr("x1", function(d) {
                return x_scale(i);
            })
            .attr("x2", function(d) {
                return x_scale(i) + width - x_scale(i) - v(d).toString().width();
            })
            .attr("y1", function(d) {
                return y_scale(v(d));
            })
            .attr("y2", function(d) {
                return y_scale(v(d));
            })
            .attr("style", function(d) {
                return "stroke:black;stroke-width:1";
            });


        }
        
        return y_scale(v(d));
    })
    .attr("height", function(d) {
        return volume_height - y_scale(v(d));
    })
    .attr("style", function(d) {
        if(o(d) <= c(d))
        {
            return "fill:" + green + ";volume:" + v(d);    
        }
        else
        {
            return "fill:" + red + ";volume:" + v(d);    
        }
    });

    if(show_text)
    {
        group.append("text")
        .attr("x", function(d, i){ return x_scale(i); })
        .attr("y", function(d, i){ return y_scale(v(d)); })
        .text(function(d,i){ return v(d); })
        .attr("font-size", "7");    
    }

}
function to_localtime(timestamp)
{
    var date = new Date(timestamp * 1000);
    return (date.toLocaleDateString() + " " + date.toLocaleTimeString());

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
    .attr("font-size", "5")
    .attr("text-anchor", "middle")
    .attr("x", x)
    .attr("y", y);
}

String.prototype.width = function(font) {
    var f = font || '5px arial',
        o = $('<div>' + this + '</div>')
    .css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': f})
    .appendTo($('body')),
        w = o.width();

    o.remove();

    return w;
}
