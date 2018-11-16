// Setup Canvas
var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d');

var overall_started = false;

var start_button = document.getElementById('start'),
    stop_button = document.getElementById('stop');

start_button.onclick = function() {overall_started = true;};
stop_button.onclick = function() {overall_started = false;};

// Main program function
function runProgram() {
  canvas.addEventListener('mousedown', canvas_event_handler, false);
	canvas.addEventListener('mousemove', canvas_event_handler, false);
	canvas.addEventListener('mouseup',	 canvas_event_handler, false);

  // Define the tool to draw the worldlines
  tool = new worldline_draw_tool();
}


function canvas_event_handler(event) {
	if (event.offsetX || event.offsetX == 0) {
		event.world_line_x = event.offsetX;
		event.world_line_y = event.offsetY;
  }

	var func = tool[event.type];
	if (func) {
		func(event);
	}
}

function worldline_draw_tool() {
	var tool = this;
	this.started = false;

	this.mousedown = function (event) {
			if (overall_started) {
        tool.started = true;
        tool.x0 = event.world_line_x;
  		  tool.y0 = event.world_line_y;
      }
	};

	this.mousemove = function (event) {
		if (overall_started && tool.started) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.beginPath();
      context.moveTo(tool.x0, tool.y0);
			context.lineTo(event.world_line_x, event.world_line_y);
			context.stroke();
      context.closePath();
		}
	};

	this.mouseup = function (event) {
		if (overall_started && tool.started) {
			// tool.mousemove(event);
			tool.started = false;
		}
	};
}


runProgram()
