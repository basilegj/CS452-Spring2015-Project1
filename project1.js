var gl;
var points;
var vPosition;
var cbuffer, vbuffer, vColor;
var program;
var uModelViewMatrix, ModelViewMatrix;
var score = 0; var High = 0; 
var vertices = new Float32Array([0.1, 0.1, 0.1, -0.1, -0.1, -0.1, -0.1, 0.1]);
var oModelViewMatrix = mat4();
var dx = 0; var dy = 0;
var hit = 0; var start = 0;
var oVertices;
var xo, yo, zo; var xvel, yvel, dir;
var obuffer, oColor, ovbuffer, oPosition;
var colors = [
        //vec4(0, 0, 0, 1), // black
        vec4(1.0, 0, 0, 1), // red
        //vec4(1.0, 1.0, 0, 1), // yelow
        vec4(0, 1.0, 0, 1), // green
        //vec4(0, 0, 1.0, 1), // blue
        vec4(1.0, 0, 1.0, 1), // magenta
        vec4(0, 1.0, 1.0, 1)   // cyan  /**/
    ];
var t,l,r,b,x,y;

var xpos = 0;
var ypos = 0;
        
window.onload = function init(){
    
    // Retrieve Canvas:
    var canvas = document.getElementById("gl-canvas");
    // Get rendering context from WebGL
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

// Configure WebGL
// Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

// Initiate obstacle and buffer	data
	//create_obstacle();
	//console.log(score);
    init_main();
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	document.getElementById("button1").onclick = function(){start = 1;};	
	document.getElementById("button2").onclick = function(){
		start = 0;
	};	
	document.getElementById("button3").onclick = function(){
		start = 0;
		score = 0;
    	document.getElementById("score").innerHTML = score;
		create_obstacle();
		xpos = 0; ypos = 0;
		prep_main();
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	};	

	create_obstacle();
    render();
};

var counter = 0; 

function render() {
	
	gl.clear(gl.COLOR_BUFFER_BIT);
	ModelViewMatrix = mat4();
	ModelViewMatrix = mult(ModelViewMatrix,translate(xpos, ypos, 0));
	if (counter == 0) stime = (new Date).getTime();
	counter += 1;
	if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
		create_obstacle();
		counter = 0;
		score = 0;
    	document.getElementById("score").innerHTML = score;
	};
	if(start == 1){
		prep_obstacle();
		move_obstacle();
		draw_obstacle();
	
	collision_detect();
	}
	prep_main();
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

	window.requestAnimFrame( render );
	
}

window.addEventListener("keydown", function (event) {
    var key = String.fromCharCode(event.keyCode);
    
    //console.log(key);
	if(start == 1){
    switch (key) {
        case 'W': // Go Up            
		xpos += 0.0; ypos += 0.1;
		if (ypos+vertices[1] > 1.1) {
			ypos += -0.1;
		}
            break;
        case 'S': // go Down
		xpos += 0.0; ypos += -0.1;
		if (ypos+vertices[3] < -1.1) {
			ypos += 0.1;
		}
            break;
        case 'D':  // Go Right
		xpos += 0.1; ypos += 0.0;
		if (xpos+vertices[0] > 1.1) {
			xpos += -0.1;
		}
	    	break;
        case 'A':  // Go Left
 		xpos += -0.1; ypos += 0.0;
		if (xpos+vertices[6] < -1.1) {
			xpos += 0.1;
		}
		       	
      		break;
        case '1':  // reset
		ModelViewMatrix = mat4();
		xpos = 0;
		ypos = 0;
            	break;
        default:
		console.log("Wrong Input, but printed");
		break;
    }
	}
});

function init_main(){
	cbuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, cbuffer );
	gl.bufferData( gl.ARRAY_BUFFER,flatten(colors), gl.STATIC_DRAW );

	vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vColor );

	vbuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vbuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

	vPosition = gl.getAttribLocation( program, "vPosition" );
	gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vPosition );
	
    uModelViewMatrix = gl.getUniformLocation(program, "uModelViewMatrix");
}

function prep_main(){
	gl.bindBuffer(gl.ARRAY_BUFFER, cbuffer);
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray(vColor);

	gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
	gl.vertexAttribPointer(oPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray(vPosition);
	gl.uniformMatrix4fv(uModelViewMatrix, 0, flatten( ModelViewMatrix ) );
}

function starting_pos(){
	rand_side = Math.floor((100-0)*Math.random() % 4);
	side_loc = (0.8+0.8)*Math.random() - 0.8;
	if(rand_side == 0){ // left
		dir = new Float32Array([1, 0]);
		xo = -0.95; yo = side_loc;
	}
	else if(rand_side == 1){ // up
		dir = new Float32Array([0, -1]);
		xo = side_loc; yo = 0.95;
	}
	else if(rand_side == 2){ // right
		dir = new Float32Array([-1, 0]);
		xo = 0.95; yo = side_loc;
	}
	else { // (rand_side == 3){ // down
		dir = new Float32Array([0, 1]);
		xo = side_loc; yo = -0.95;
	}
	var k = 2/1.5/100;
	var difficulty_scale = Math.floor(score/5)/10; 
    xvel = k*dir[0]*(1+difficulty_scale); 
	yvel = k*dir[1]*(1+difficulty_scale);
}

function init_obstacle(){
	obuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, obuffer );
	gl.bufferData( gl.ARRAY_BUFFER,flatten(colors[1]), gl.STATIC_DRAW );

	oColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(oColor, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( oColor );

	ovbuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, ovbuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(oVertices), gl.STATIC_DRAW );

	oPosition = gl.getAttribLocation( program, "vPosition" );
	gl.vertexAttribPointer( oPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( oPosition );
	
	ouModelViewMatrix = gl.getUniformLocation(program, "uModelViewMatrix");
	gl.uniformMatrix4fv(ouModelViewMatrix, 0, flatten( oModelViewMatrix ) );
}

function create_obstacle(){
	dx = 0; dy = 0;
	rand_side = Math.floor((100-0)*Math.random() % 4);
	starting_pos();
	oVertices = new Float32Array([xo,yo]);
	init_obstacle();
}

function prep_obstacle(){
	gl.bindBuffer(gl.ARRAY_BUFFER, obuffer);
	gl.vertexAttribPointer(oColor, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray(oColor);

	gl.bindBuffer(gl.ARRAY_BUFFER, ovbuffer);
	gl.vertexAttribPointer(oPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray(oPosition);
	
	oModelViewMatrix = mat4();
	oModelViewMatrix = mult(oModelViewMatrix,translate(dx, dy, 0));
	gl.uniformMatrix4fv(ouModelViewMatrix, 0, flatten( oModelViewMatrix ) );
}

function move_obstacle(){
	dx += xvel; dy += yvel;
}

function draw_obstacle(){
	gl.drawArrays(gl.POINTS, 0, 1)	
}

function collision_detect(){
	r = vertices[0] + xpos;
	l = vertices[4] + xpos;
	t = vertices[2] + ypos;
	b = vertices[3] + ypos;
	x = xo + dx; y = yo + dy;
	if ( x > l && x < r && y < t && y > b  ){
		create_obstacle();
		counter = 0; dx = 0; dy = 0;
		score += 1;	
		document.getElementById("score").innerHTML = score;
		if(score > High){
			High = score;
			document.getElementById("High").innerHTML = High;
		}
	}
}



