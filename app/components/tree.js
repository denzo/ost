import Component from '@glimmer/component';
// import { tree } from "d3-hierarchy";
import * as d3 from "d3";
import { linkHorizontal } from 'd3-shape'
import { action } from '@ember/object';

export default class TreeComponent extends Component {

  // tree = tree().size(500, 500);

  treeData = [
    {
      "name": "Revenue",
      "parent": "null",
      "children": [
        {
          "name": "Acquisition",
          "parent": "Revenue",
          "children": [
            {
              "name": "Son of A",
              "parent": "Level 2: A",
              "children": [
                {
                  "name": "Son of A",
                  "parent": "Level 2: A"
                },
                {
                  "name": "Daughter of A",
                  "parent": "Level 2: A"
                }
              ]
            },
            {
              "name": "Daughter of A",
              "parent": "Level 2: A"
            }
          ]
        },
        {
          "name": "Level 2: B",
          "parent": "Top Level"
        }
      ]
    }
  ];

  @action
  startD3(element) {
    // Set the dimensions and margins of the diagram
    var margin = {top: 20, right: 90, bottom: 30, left: 90},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    // declares a tree layout and assigns the size
    this.treeLayout = d3.tree().size([height, width]);

    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select("body").append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate("+ margin.left + "," + margin.top + ")");

    this.svg = svg;

    // Assigns parent, children, height, depth
    const root = d3.hierarchy(this.treeData[0], function(d) {
      return d.children;
    });
    root.x0 = height / 2;
    root.y0 = 0;

    this.root = root;

    // Collapse after the second level
    root.children.forEach((child) => {
      this.collapse
    });

    this.updateInteractive(root);
  }
  
  updateInteractive(source) {
    var i = 0;
    const duration = 750;

    // Assigns the x and y position for the nodes
    var treeData = this.treeLayout(this.root);

    const svg = this.svg;

    // Compute the new tree layout.
    const nodes = treeData.descendants();
    const links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function(d){ d.y = d.depth * 90});

    // Update the nodes...
    var node = svg.selectAll('g.node')
      .data(nodes, function(d) {return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter()
      .append('g')
      .attr('class', 'node')
      .attr("transform", function(d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on('click', (d, node) => {
        this.onClick(node);
      });

    // Add Circle for the nodes
    nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('r', 1e-6)
      .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
      });

    // Add labels for the nodes
    nodeEnter.append('text')
      .attr("dy", ".35em")
      .attr("x", function(d) {
          return d.children || d._children ? -13 : 13;
      })
      .attr("text-anchor", function(d) {
          return d.children || d._children ? "end" : "start";
      })
      .text(function(d) { return d.data.name; });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
      .duration(duration)
      .attr("transform", function(d) { 
        return "translate(" + d.y + "," + d.x + ")";
      });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
      .attr('r', 10)
      .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
      })
      .attr('cursor', 'pointer');

    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
          return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
      .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
      .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = svg.selectAll('path.link')
      .data(links, function(d) { return d.id; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
      .attr("class", "link")
      .attr('d', function(d){
        var o = {x: source.x0, y: source.y0}
        return diagonal(o, o)
      });

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
      .duration(duration)
      .attr('d', function(d){ return diagonal(d, d.parent) });

    // Remove any exiting links
    var linkExit = link.exit().transition()
      .duration(duration)
      .attr('d', function(d) {
        var o = {x: source.x, y: source.y}
        return diagonal(o, o)
      })
      .remove();

    // Store the old positions for transition.
    nodes.forEach(function(d){
      d.x0 = d.x;
      d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {
      return `M ${s.y} ${s.x}
              C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`;
    }

    
  }

  // Toggle children on click.
  onClick(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    this.updateInteractive(d);
  }

  // Collapse the node and all it's children
  collapse(d) {
    if(d.children) {
      d._children = d.children
      d._children.forEach(d => {
        this.collapse(d);
      });
      d.children = null
    }
  }


  // works
  updateNew(source) {
    var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = 960 - margin.right - margin.left,
    height = 500 - margin.top - margin.bottom;

    var linkGen = d3.linkHorizontal();

    var treemap = d3.tree().size([height, width]);

    //  assigns the data to a hierarchy using parent-child relationships
    var nodes = d3.hierarchy(this.treeData[0], function(d) {
        return d.children;
      });

    // maps the node data to the tree layout
    nodes = treemap(nodes);

    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
      
    var g = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // adds the links between the nodes
    var link = g.selectAll(".link")
      .data(nodes.descendants().slice(1))
      .enter().append("path")
      .attr("class", "link")
      .attr("d", function(d) {
        return "M" + d.y + "," + d.x
          + "C" + (d.y + d.parent.y) / 2 + "," + d.x
          + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
          + " " + d.parent.y + "," + d.parent.x;
      });

    // adds each node as a group
    var node = g.selectAll(".node")
      .data(nodes.descendants())
      .enter().append("g")
      .attr("class", function(d) { 
        return "node" + 
          (d.children ? " node--internal" : " node--leaf"); })
      .attr("transform", function(d) { 
        return "translate(" + d.y + "," + d.x + ")"; });

    // adds the circle to the node
    node.append("circle")
      .attr("r", 10);

    // adds the text to the node
    node.append("text")
      .attr("dy", ".35em")
      .attr("x", function(d) { return d.children ? -13 : 13; })
      .style("text-anchor", function(d) { 
        return d.children ? "end" : "start"; })
      .text(function(d) { return d.data.name; });
  }
    
    
  update() {
    var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = 960 - margin.right - margin.left,
    height = 500 - margin.top - margin.bottom;
    
    const duration = 750;
      
    const source = this.treeData[0];
    source.x0 = height / 2;
    source.y0 = 0;

    const root = d3.hierarchy(this.treeData[0]);
    const tree = d3.tree().size(width, height);

    const oh = tree(root);

    let uid = 0;

    function click(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(d);
    }

    
    // Compute the new tree layout.
    var nodes = oh.descendants().reverse(),
    links = oh.links(nodes);
    
    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 180; });
    
    var svg = d3.select("#ost").append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.selectAll("path")
      .data(nodes)
      .join("path")
      .attr("d", linkHorizontal())
      .attr("fill", "none")
      .attr("stroke", "black");

    

    // // Update the nodes…
    // var node = svg.selectAll("g.node")
    //   .data(nodes, function(d) { 
    //     return d.id || (d.id = ++uid);
    //   });
  
    // // Enter any new nodes at the parent's previous position.
    // var nodeEnter = node.enter().append("g")
    //   .attr("class", "node")
    //   .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
    //   .on("click", click);
  
    // nodeEnter.append("circle")
    //   .attr("r", 1e-6)
    //   .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
  
    // nodeEnter.append("text")
    //   .attr("x", function(d) { return d.children || d._children ? -13 : 13; })
    //   .attr("dy", ".35em")
    //   .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
    //   .text(function(d) { return d.name; })
    //   .style("fill-opacity", 1e-6);
  
    // // Transition nodes to their new position.
    // var nodeUpdate = node.transition()
    //   .duration(duration)
    //   .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
  
    // nodeUpdate.select("circle")
    //   .attr("r", 10)
    //   .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
  
    // nodeUpdate.select("text")
    //   .style("fill-opacity", 1);
  
    // // Transition exiting nodes to the parent's new position.
    // var nodeExit = node.exit().transition()
    //   .duration(duration)
    //   .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
    //   .remove();
  
    // nodeExit.select("circle")
    //   .attr("r", 1e-6);
  
    // nodeExit.select("text")
    //   .style("fill-opacity", 1e-6);

    // // var link = d3.linkHorizontal()
    // //   .x(function(d) {
    // //     return d.x;
    // //   })
    // //   .y(function(d) {
    // //     return d.y;
    // //   });
  
    // // Update the links…
    // var link = svg.selectAll("path.link").data(links, function(d) { return d.target.id; });
  
    // // Enter any new links at the parent's previous position.
    // link.enter().insert("path", "g")
    //   .attr("class", "link")
    //   .attr("d", function(d) {
    //     return linkHorizontal();

    //     // result.source(d => {
    //     //   debugger
    //     // })
    //     // result.target(d => {
    //     //   debugger
    //     // });
    //     // return result;
    //     // .x(function(d) {
    //     //   return d.x;
    //     // })
    //     // .y(function(d) {
    //     //   return d.y;
    //     // });
    //   });

      // // var o = {x: source.x0, y: source.y0};
      // // return diagonal({source: o, target: o});
      // });
  
    // Transition links to their new position.
    // link.transition()
    //   .duration(duration)
    //   .attr("d", diagonal);
  
    // Transition exiting nodes to the parent's new position.
    // link.exit().transition()
    //   .duration(duration)
    //   .attr("d", function(d) {
    //   var o = {x: source.x, y: source.y};
    //   return diagonal({source: o, target: o});
    //   })
    //   .remove();
  
    // Stash the old positions for transition.
    // nodes.forEach(function(d) {
    //   d.x0 = d.x;
    //   d.y0 = d.y;
    // });
  }
  

}
