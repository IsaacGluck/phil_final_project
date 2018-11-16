// Setup Canvas
var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d');

// Constants
const CLICK_RADIUS = 10;

// Run time vars
var overall_started = false,
    all_lines_length = 0,
    drawing_up = true,
    first_line = true,
    error = '',
    all_lines = [];

// Onscreen Buttons
var start_button = document.getElementById('start'),
    stop_button = document.getElementById('stop'),
    clear_button = document.getElementById('clear');

// Allow Drawing
start_button.onclick = function() {
  overall_started = true;
}

// Reset
stop_button.onclick = function() {
  reset();
}

// Clear
clear_button.onclick = function() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  reset();
}

function reset() {
  overall_started = false;
  tool.started = false;
  all_lines = [];
  all_lines_length = 0;
  drawing_up = true;
  first_line = true;
  error = '';
}

// Main program function
function runProgram() {
  canvas.addEventListener('mousedown', canvas_event_handler, false);
	canvas.addEventListener('mousemove', canvas_event_handler, false);
	canvas.addEventListener('mouseup',	 canvas_event_handler, false);

  // Define the tool to draw the worldlines
  tool = new worldline_draw_tool();
}

// get general canvas events
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

// Draw world lines
function worldline_draw_tool() {
	var tool = this;
	this.started = false;

	this.mousedown = function (event) {
      mic = mouse_in_circle(event.world_line_x, event.world_line_y);
			if (overall_started && mic) {
        tool.started = true;
        tool.x0 = (first_line) ? (event.world_line_x) : (all_lines[all_lines.length - 1].x2);
  		  tool.y0 = (first_line) ? (event.world_line_y) : (all_lines[all_lines.length - 1].y2);
      }
	};

	this.mousemove = function (event) {
		if (overall_started && tool.started) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      draw_lines();
      draw_line_helper(tool.x0, tool.y0, event.world_line_x, event.world_line_y);
		}
	};

	this.mouseup = function (event) {
		if (overall_started && tool.started) {
      new_line = {
        x1: tool.x0,
        y1: tool.y0,
        x2: event.world_line_x,
        y2: event.world_line_y,
      };
      new_line.length = get_line_length(new_line.x2, new_line.x1, new_line.y2, new_line.y1);
      new_line.slope = get_line_slope(new_line.x2, new_line.x1, new_line.y2, new_line.y1);
      all_lines_length += new_line.length;

      if (first_line) {
        drawing_up = (new_line.y2 > new_line.y1) ? false : true; // counter intuitive bc of canvas weirdness
      }

      cntt = true;
      if (!first_line) {
        cntt = check_no_time_travel(all_lines[all_lines.length - 1].y2, new_line.y2);
      }

      if (cntt) {
        all_lines.push(new_line);
      } else {
        console.log('time travelll')
        context.clearRect(0, 0, canvas.width, canvas.height);
        draw_lines();
      }

      first_line = false;
      tool.mousemove(event);
			tool.started = false;
		}
	};
}

function draw_lines() {
  if (tool.started) {
    for (var line in all_lines) {
      draw_line_helper(all_lines[line].x1, all_lines[line].y1, all_lines[line].x2, all_lines[line].y2);
    }
    if (!first_line) {
      draw_circle_helper(all_lines[all_lines.length - 1].x2, all_lines[all_lines.length - 1].y2, CLICK_RADIUS);
    }
  }
}

function draw_circle_helper(x, y, r) {
  context.beginPath();
  context.arc(x, y, r, 0, 2 * Math.PI, false);
  context.stroke();
}

function draw_line_helper(x1, y1, x2, y2) {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}

function get_line_length(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2))
}

function get_line_slope(x1, y1, x2, y2) {
  return (y2 - y1) / (x2 - x1);
}

function mouse_in_circle(mouseX, mouseY) {
  if (all_lines.length == 0) {
    return true;
  }

  last_x = all_lines[all_lines.length - 1].x2;
  last_y = all_lines[all_lines.length - 1].y2;

  if (get_line_length(mouseX, mouseY, last_x, last_y) > CLICK_RADIUS) {
    return false;
  }

  return true;

}

function check_no_time_travel(y1, y2) {
  if (first_line) {
    return true;
  }
  if (drawing_up) {
    if (y1 < y2) {
      return false;
    }
  } else {
    if (y1 > y2) {
      return false;
    }
  }
  return true;
}

runProgram()
