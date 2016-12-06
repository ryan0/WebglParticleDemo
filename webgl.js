var vertexShaderSource = `
attribute vec2 a_point;
uniform highp float u_timer;
uniform highp vec2 u_offset;

void main() {
	float angle = a_point.x;
	float magnitude = a_point.y * u_timer;

	gl_Position = vec4((cos(angle) * magnitude) + u_offset.x, (sin(angle) * magnitude) + u_offset.y, 0, 1);
	gl_PointSize = 5.0;
}`;

var fragmentShaderSource = `
precision mediump float;
uniform highp float u_timer;

void main()
{
	gl_FragColor = vec4(0, 1, 0, 1) - (u_timer - .3);
}`;

var gl;
var timerLoc;
var offsetLoc;

$(document).ready(function() {

	$(window).resize(function() {
		$('canvas').width($('#container').width());
		$('canvas').height($('#container').height());

		if(gl) {
			gl.canvas.width = $('#container').width();
			gl.canvas.height = $('#container').height();
			if(gl.canvas.width > gl.canvas.height) {
				gl.viewport((gl.canvas.width - gl.canvas.height) / 2, 0, gl.canvas.height, gl.canvas.height);
			}
			else {
				gl.viewport(0, (gl.canvas.height - gl.canvas.width) / 2, gl.canvas.width, gl.canvas.width);
			}
		}
	});

	$('canvas').click(function() {
		booms.push(new Boom());
	})

	$("p").on("tap",function(){
		booms.push(new Boom());
	});

	$('canvas').width($('#container').width());
	$('canvas').height($('#container').height());

   	// Initialize the GL contex
   	gl = initWebGL($('canvas')[0])
	if (!gl) { 
		return; 
	}

	var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

	var program = createProgram(gl, vertexShader, fragmentShader);


	var positionAttributeLocation = gl.getAttribLocation(program, "a_point");
	var positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	var points = [];
	for(var i = 0; i < 500; i++) {
		var direction = (Math.random() * 2.0 * Math.PI) - Math.PI;
		var velocity = Math.pow(Math.random() * 0.4, 1.0/5.0) + (Math.random() * .05) - .025;

		points[i * 2] = direction;
		points[(i * 2) + 1] = velocity;
	}


	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
	gl.useProgram(program);

	gl.enableVertexAttribArray(positionAttributeLocation);
	gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
	timerLoc = gl.getUniformLocation(program, "u_timer");
	offsetLoc = gl.getUniformLocation(program, "u_offset")

	run();
});

var booms = [];
var prevTime = new Date().getTime();

function run() {
	var currentTime = new Date().getTime();
	var deltaTime = currentTime - prevTime;
	prevTime = currentTime;

	gl.clear(gl.COLOR_BUFFER_BIT);
	var byBoom = -1;
	for(var i = 0; i < booms.length; i++) {
		booms[i].time += deltaTime;
		gl.uniform1f(timerLoc, booms[i].time / 1900.0);
		gl.uniform2fv(offsetLoc, [booms[i].x, booms[i].y]);
		gl.drawArrays(gl.POINTS, 0, 500);

		if(booms[i].time > 2500) {
			byBoom = i;
		}
	}

	if(byBoom > -1) {
		booms.splice(byBoom, 1);
	}
	
	window.requestAnimationFrame(run);
}

function Boom() {
	this.time = 0;
	this.x = (Math.random() * 2) - 1;
	this.y = (Math.random() * 2) - 1;
}


function initWebGL(canvas) {
	gl = null;
	gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	if(!gl) {
		alert("no webgl for you!");
		return;
	}

	gl.canvas.width = $('#container').width();
	gl.canvas.height = $('#container').height();
	if(gl.canvas.width > gl.canvas.height) {
		gl.viewport((gl.canvas.width - gl.canvas.height) / 2, 0, gl.canvas.height, gl.canvas.height);
	}
	else {
		gl.viewport(0, (gl.canvas.height - gl.canvas.width) / 2, gl.canvas.width, gl.canvas.width);
	}

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	return gl;
}

function createShader(gl, type, source) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}

	console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	var success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}

	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}