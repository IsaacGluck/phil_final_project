// Setup Canvas
var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d');

// Constants
const CLICK_RADIUS = 10;
const SPEED_OF_LIGHT = 299792458; // m/s
const DEFAULT_REFERENCE_TIME_PASSED_TEXT = "Reference Time Passed: ";
const DEFAULT_WORLDLINE_TIME_PASSED_TEXT = "Wordline Time Passed: ";

// Run time vars
var overall_started = false,
    pick_line = false,
    first_line = true,
    all_lines = [];

// Onscreen Buttons
var start_button = document.getElementById('start'),
    stop_button = document.getElementById('stop'),
    clear_button = document.getElementById('clear');

// Allow Drawing
start_button.onclick = function() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  reset();
  overall_started = true;
  draw_reference_line();
}

// Finish
stop_button.onclick = function() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  draw_reference_line();
  for (var line in all_lines) {
    draw_line_helper(all_lines[line].x1, all_lines[line].y1, all_lines[line].x2, all_lines[line].y2);
  }
  calculate_output();
  tool.started = false;
  overall_started = false;
  pick_line = true;
  underline_green();
}

// Clear
clear_button.onclick = function() {
  reset();
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function reset() {
  overall_started = false;
  pick_line = false;
  tool.started = false;
  all_lines = [];
  first_line = true;
  set_reference_total_time_passed_text(DEFAULT_REFERENCE_TIME_PASSED_TEXT, DEFAULT_WORLDLINE_TIME_PASSED_TEXT);
  set_reference_selected_time_passed_text(DEFAULT_REFERENCE_TIME_PASSED_TEXT, DEFAULT_WORLDLINE_TIME_PASSED_TEXT);
  remove_underlines();
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

        if (first_line) {
          draw_light_cone_helper(event.world_line_x, event.world_line_y);
          draw_circle_helper(tool.x0, tool.y0, CLICK_RADIUS);
        }
      }

      if (pick_line) {
        check_for_picked_line(event.world_line_x, event.world_line_y);
        underline_yellow();
      }
	};

	this.mousemove = function (event) {
		if (overall_started && tool.started) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      draw_lines();
      draw_line_helper(tool.x0, tool.y0, event.world_line_x, event.world_line_y);

      if (first_line) {
        draw_light_cone_helper(tool.x0, tool.y0);
        draw_circle_helper(tool.x0, tool.y0, CLICK_RADIUS);
      }

		} else if (overall_started && !tool.started && first_line && check_greater_than_ref(event.world_line_x, event.world_line_y)) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      draw_reference_line();
      draw_light_cone_helper(event.world_line_x, event.world_line_y);
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
      new_line.actual_length = get_line_length(new_line.x1, new_line.y1, new_line.x2, new_line.y2);
      new_line.slope = get_line_slope(new_line.x1, new_line.y1, new_line.x2, new_line.y2);
      new_line.angle = get_line_angle(new_line.x1, new_line.y1, new_line.x2, new_line.y2);
      new_line.speed_along_worldline_meters = get_speed_along_worldline(get_line_angle(new_line.x1, new_line.y1, new_line.x2, new_line.y2))
      new_line.time_change = new_line.y1 - new_line.y2; // IN YEARS
      new_line.actual_space_change = new_line.x2 - new_line.x1; // IN METERS
      new_line.space_change_meters = new_line.speed_along_worldline_meters * (new_line.time_change * (365 * 24 * 60 * 60)); // IN METERS
      new_line.space_change_light_years = new_line.space_change_meters * 1.0570008340247 * Math.pow(10, -16);
      new_line.spacetime_interval = calculate_spacetime_interval(new_line.time_change, new_line.space_change_light_years);
      new_line.time_change_according_to_reference = calculate_time_change_according_to_reference(new_line.spacetime_interval);

      cgtr = check_greater_than_ref(new_line.x2, new_line.y2);
      cilc = check_in_light_cone(new_line.slope);
      cntt = true; // If there isn't time travel
      if (first_line) {
        cntt = check_no_time_travel(new_line.y1, new_line.y2);
      } else {
        cntt = check_no_time_travel(all_lines[all_lines.length - 1].y2, new_line.y2);
      }

      if (cntt && cgtr && cilc) {
        all_lines.push(new_line);
        first_line = false;
        // set_worldline_length_text(all_lines_length);
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
  context.fillText("Reference Worldline (400 years)", -100, 10);
  context.restore();

  context.beginPath();
  context.moveTo(20, 10);
  context.lineTo(20, 410);
  context.stroke();
  // context.closePath();
}

function draw_lines(override) {
  draw_reference_line();
  if (tool.started || override) {
    for (var line in all_lines) {
      draw_line_helper(all_lines[line].x1, all_lines[line].y1, all_lines[line].x2, all_lines[line].y2, all_lines[line].color);
    }
    if (!override && !first_line) {
      draw_circle_helper(all_lines[all_lines.length - 1].x2, all_lines[all_lines.length - 1].y2, CLICK_RADIUS);
      draw_light_cone_helper(all_lines[all_lines.length - 1].x2, all_lines[all_lines.length - 1].y2);
    }
  }
}

function draw_light_cone_helper(x, y) {
  yellow_color = '#f1c40f';
  end_right_x = 500;
  end_right_y = (x - end_right_x) + y;
  draw_line_helper(x, y, end_right_x, end_right_y, yellow_color);

  end_left_x = 20;
  end_left_y = (end_left_x - x) + y
  draw_line_helper(x, y, end_left_x, end_left_y, yellow_color);
}

function draw_circle_helper(x, y, r) {
  context.beginPath();
  context.arc(x, y, r, 0, 2 * Math.PI, false);
  context.stroke();
}

function draw_line_helper(x1, y1, x2, y2, color) {
  if (color) {
    context.strokeStyle=color;
  }
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  context.strokeStyle='#000000';
}

function get_line_length(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2))
}

function get_line_slope(x1, y1, x2, y2) {
  return (y1 - y2) / (x2 - x1);
}

function get_line_angle(x1, y1, x2, y2) {
  return Math.atan2((y1 - y2), (x2 - x1)) * (180 / Math.PI);
}

function get_speed_along_worldline(angle) {
  if (angle >= 45 && angle <= 90) {
    // y = (-SOL/45)x + 2(SOL)
    return ((-1 * angle * (SPEED_OF_LIGHT / 45)) + (2 * SPEED_OF_LIGHT));
  } else if (angle > 90 && angle <= 135) {
    // y = (SOL/45)x - 2(SOL)
    return ((angle * (SPEED_OF_LIGHT / 45)) - (2 * SPEED_OF_LIGHT));
  }
  return null;
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
  if (y1 < y2) {
    return false;
  }
  return true;
}

function check_in_light_cone(slope) {
  if (slope >= 1 || slope <= -1) {
    return true;
  }
  return false;
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

function calculate_distance_point_line(x, y, line) {
  dx = line.x2 - line.x1;
  dy = line.y2 - line.y1;
  d = Math.abs((dy * x) - (dx * y) - (line.x1 * line.y2) + (line.x2 * line.y1)) / Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  return d;
}

function is_point_on_line(x, y, line) {
  dist_point1 = get_line_length(line.x1, line.y1, x, y);
  dist_point2 = get_line_length(line.x2, line.y2, x, y);
  line_length = line.actual_length;
  difference = Math.abs(line_length - (dist_point1 + dist_point2));
  if (difference < 1) {
    return true;
  }
  return false;
}

function calculate_spacetime_interval(delta_t, delta_x_light_years) {
  delta_t2 = (-1 * Math.pow(delta_t, 2));
  delta_x2 = Math.pow(delta_x_light_years, 2);
  return delta_t2 + delta_x2;
}

function calculate_time_change_according_to_reference(spacetime_interval) {
  return Math.sqrt(-1 * spacetime_interval);
}

function calculate_output() {
  total_time_passed_according_to_reference = 0;
  total_time_passed_for_reference = 0;
  for (var l in all_lines) {
    line = all_lines[l];
    console.log(line);
    total_time_passed_according_to_reference += line.time_change_according_to_reference;
    total_time_passed_for_reference += line.time_change;
  }

  ref_text = DEFAULT_REFERENCE_TIME_PASSED_TEXT + Math.round(total_time_passed_according_to_reference) + ' years';
  wl_text = DEFAULT_WORLDLINE_TIME_PASSED_TEXT + Math.round(total_time_passed_for_reference) + ' years';
  set_reference_total_time_passed_text(ref_text, wl_text);
}

function check_for_picked_line(x, y) {
  for (var l in all_lines) {
    line = all_lines[l];
    if (is_point_on_line(x, y, line)) {
        line.color = '#f1c40f';
        ref_text = DEFAULT_REFERENCE_TIME_PASSED_TEXT + Math.round(line.time_change) + ' years';
        wl_text = DEFAULT_WORLDLINE_TIME_PASSED_TEXT + Math.round(line.time_change_according_to_reference) + ' years';
        set_reference_selected_time_passed_text(ref_text, wl_text);
    } else {
      line.color = '#000000';
    }
  }
  draw_lines(true);
}

runProgram();



function set_reference_total_time_passed_text(ref_text, wl_text) {
  document.getElementById('total-time-reference').innerHTML = ref_text;
  document.getElementById('total-time-worldline').innerHTML = wl_text;
}

function set_reference_selected_time_passed_text(ref_text, wl_text) {
  document.getElementById('selected-time-reference').innerHTML = ref_text;
  document.getElementById('selected-time-worldline').innerHTML = wl_text;
}

function underline_green(){
  document.getElementById('to-green').classList.add('underline-green');
}

function underline_yellow(){
  document.getElementById('to-yellow').classList.add('underline-yellow');
}

function remove_underlines() {
  document.getElementById('to-green').classList.remove('underline-green');
  document.getElementById('to-yellow').classList.remove('underline-yellow');
}



// function set_worldline_length_text(l) {
//   document.getElementById('worldline-length').innerHTML = l;
// }

// Cosmetics
// var total_width = document.getElementById('speed-form').offsetWidth
// var button_width = document.getElementById('speed-submit').offsetWidth
// document.getElementById('speed-input').style.width = '' + (total_width - button_width) + 'px'

// set_speed_text(percent_speed_of_light);
// set_worldline_length_text(worldline_length);
