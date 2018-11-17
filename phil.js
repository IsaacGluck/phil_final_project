// Setup Canvas
var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d');

// Constants
const CLICK_RADIUS = 10;
const SPEED_OF_LIGHT = 299792458; // m/s
const DEFAULT_PERCENT_SPEED_OF_LIGHT = 50;
const DEFAULT_WORLDLINE_LENGTH = 0;

// Run time vars
var overall_started = false,
    all_lines_length = 0,
    drawing_up = true,
    first_line = true,
    error = '',
    percent_speed_of_light = DEFAULT_PERCENT_SPEED_OF_LIGHT,
    worldline_length = DEFAULT_WORLDLINE_LENGTH,
    all_lines = [];

// Onscreen Buttons
var start_button = document.getElementById('start'),
    stop_button = document.getElementById('stop'),
    clear_button = document.getElementById('clear');

// Allow Drawing
start_button.onclick = function() {
  overall_started = true;
  draw_reference_line();
}

// Reset
stop_button.onclick = function() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  draw_reference_line();
  for (var line in all_lines) {
    draw_line_helper(all_lines[line].x1, all_lines[line].y1, all_lines[line].x2, all_lines[line].y2);
  }
  reset();
}

// Clear
clear_button.onclick = function() {
  reset();
  context.clearRect(0, 0, canvas.width, canvas.height);
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
      mic  = check_mouse_in_circle(event.world_line_x, event.world_line_y);
      cgtr = check_greater_than_ref(event.world_line_x, event.world_line_y);
			if (overall_started && mic && cgtr) {
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

    check_cursor_style(event.world_line_x, event.world_line_y);
	};

	this.mouseup = function (event) {
		if (overall_started && tool.started) {
      new_line = {
        x1: tool.x0,
        y1: tool.y0,
        x2: event.world_line_x,
        y2: event.world_line_y,
      };
      new_line.length = get_line_length(new_line.x1, new_line.y1, new_line.x2, new_line.y2);
      new_line.slope = get_line_slope(new_line.x1, new_line.y1, new_line.x2, new_line.y2);

      if (first_line) {
        drawing_up = (new_line.y2 > new_line.y1) ? false : true; // counter intuitive bc of canvas weirdness
      }

      cgtr = check_greater_than_ref(new_line.x2, new_line.y2);
      cntt = true;
      if (!first_line) {
        cntt = check_no_time_travel(all_lines[all_lines.length - 1].y2, new_line.y2); // If there isn't time travel
      }

      if (cntt && cgtr) {
        all_lines.push(new_line);
        first_line = false;
        all_lines_length += new_line.length;
        set_worldline_length_text(all_lines_length);
      }

      // Order is important
      context.clearRect(0, 0, canvas.width, canvas.height);
      draw_lines();
      tool.started = false;
		}

    check_cursor_style(event.world_line_x, event.world_line_y);
	};
}

function draw_reference_line() {
  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "12px sans-serif";
  context.rotate(-Math.PI/2);
  context.fillText("Reference Worldline (400)", -80, 10);
  context.restore();

  context.beginPath();
  context.moveTo(20, 10);
  context.lineTo(20, 410);
  context.stroke();
  // context.closePath();
}

function draw_lines() {
  draw_reference_line();
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

function check_mouse_in_circle(mouseX, mouseY) {
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

function check_greater_than_ref(x, y) {
  if (x < 20 || y < 10 || y > 410) {
    return false;
  }
  return true;
}

function check_cursor_style(x, y) {
  if (overall_started && check_mouse_in_circle(x, y) && check_greater_than_ref(x, y)) {
    document.body.style.cursor = 'crosshair';
  } else {
    document.body.style.cursor = 'default';
  }
}

function on_speed_submit(event) {
  console.log('name', event.target.elements[0].name);
  console.log('value', event.target.elements[0].value);
  set_speed_text(event.target.elements[0].value);
}

function set_speed_text(percent) {
  percent_speed_of_light = percent;
  document.getElementById('percent-speed-of-light').innerHTML = percent_speed_of_light + '% the Speed of Light';
  document.getElementById('real-speed-of-light').innerHTML = (SPEED_OF_LIGHT / (percent_speed_of_light / 100)) + ' m/s';
}

function set_worldline_length_text(l) {
  document.getElementById('worldline-length').innerHTML = l;
}

runProgram();



// Cosmetics
var total_width = document.getElementById('speed-form').offsetWidth
var button_width = document.getElementById('speed-submit').offsetWidth
document.getElementById('speed-input').style.width = '' + (total_width - button_width) + 'px'

set_speed_text(percent_speed_of_light);
set_worldline_length_text(worldline_length);
