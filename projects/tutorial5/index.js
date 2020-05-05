let canvas = null; // we'll keep it as a global object
let gl = null; // it will store our context, and all the functions and constants that are needed to use it

function onResize() { // this function resizes our canvas in a way, that makes it fit the entire screen perfectly!
	canvas.width = canvas.clientWidth * window.devicePixelRatio;
	canvas.height = canvas.clientHeight * window.devicePixelRatio;
}

window.onresize = onResize; // sets the window's resize function to be the exact function we use for resizing our canvas

function initWebGL2() {
	canvas = document.createElement("canvas"); // creates a new canvas element ( <canvas></canvas> )
	gl = canvas.getContext("webgl2"); // creates a WebGL2 context, using the canvas
	if(!gl) { // if the gl DIDN'T create properly
		alert("This browser does not support WebGL 2."); // alert the user about it
		return; // go out of the function; stop this function
	}
	canvas.style = "position: absolute; width: 100%; height: 100%; left: 0; top: 0; right: 0; bottom: 0; margin: 0; z-index: -1;"; // we add a simple style to our canvas
	document.body.appendChild(canvas); // appends/adds the canvas element to the document's body
	onResize(); // resizes the canvas (it needs to be done, because otherwise it will not resize until you resize your window)
	
	gl.clearColor(1.0, 0.0, 0.0, 1.0); // specifies the clearing color to be read (using RGBA)
	gl.clear(gl.COLOR_BUFFER_BIT); // clears the screen using a specified color
	
	let vertexBuffer = null;
	let vertexArray = null;
	let vertexShader = null;
	let fragmentShader = null;
	let program = null;
	
	const vertexData = [ // a simple triangle in the middle of the screen, with different colors per every vertex
		-0.5, -0.5, // position 0
		1.0, 0.0, 0.0, 1.0, // color 0
		0.0, 0.5, // position 1
		0.0, 1.0, 0.0, 1.0, // color 1
		0.5, -0.5, // position 2
		0.0, 0.0, 1.0, 1.0 // color 2
	];

	vertexBuffer = gl.createBuffer(); // creates a new buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // binds the vertex buffer as a vertex buffer
	// WebGL2 defines Vertex Buffer as Array Buffer, but it's literally the same thing
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW); // we tell opengl that we want to supply the currently bound vertex buffer (array buffer) with data, that's represented as a 32 bit float array, that will not be changed or modified oftenly (STATIC_DRAW says that)
	gl.bindBuffer(gl.ARRAY_BUFFER, null); // we unbind the currently bound vertex buffer (array buffer)
	
	vertexArray = gl.createVertexArray(); // creates a new vertex array
	gl.bindVertexArray(vertexArray); // binds the new vertex array
	// Now we need to supply our vertex array with vertex layout data. For now it's simple, because it's just one 2d point per vertex, but once it gets more advanced you'll see why you need to understand what's going on here
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // we bind our vertex buffer, because it stores or will store the vertex data (in this example it already stores some, but it doesn't really matter, as long as you bound it in this step)
	// we set our vertex layout here
	// we only have one element in our vertices, so let's specify how it's presented to WebGL2
	
	// Vertex Position
	gl.vertexAttribPointer(
		0, // the location of our vertex layout element, in this case it will be zero, as it's the first one
		2, // how much data this vertex layout element contains, in this case there are 2 floats per point, so that's what we say here
		gl.FLOAT, // what type the data is, as i said, these are floats
		false, // tells WebGL if it should normalize this data (modify it accordingly to the types limitations, to make it a float), when working with floats we don't have to do this, so we say false
		6 * 4, // this specifies a stride, or a size in bytes of one vertex. In our case the full vertex takes up 6 floats (2 for positions, and 4 for colors), and every float is 4 bytes..
		0 // this is an offset, it tells us how far away (in bytes) this vertex layout element is from the start of the vertex
	);
	gl.enableVertexAttribArray(0); // we tell WebGL that we have the first vertex layout location allocated in this vertex array
	// Vertex Color
	gl.vertexAttribPointer(
		1, // the location of our vertex layout element, in this case it will be one, as it's the second element of a vertex
		4, // how much data this vertex layout element contains, in this case there are 4 floats per color, so that's what we say here
		gl.FLOAT, // what type the data is, as i said, these are floats
		false, // tells WebGL if it should normalize this data (modify it accordingly to the types limitations, to make it a float), when working with floats we don't have to do this, so we say false
		6 * 4, // this specifies a stride, or a size in bytes of one vertex. In our case the full vertex takes up 6 floats (2 for positions, and 4 for colors), and every float is 4 bytes..
		2 * 4 // this is an offset, it tells us how far away (in bytes) this vertex layout element is from the start of the vertex, here it's 2 floats away, which basically means we're skipping the vertex position here
	);
	gl.enableVertexAttribArray(1); // we tell WebGL that we have the second vertex layout location allocated in this vertex array
	
	gl.bindBuffer(gl.ARRAY_BUFFER, null); // we unbind the currently bound vertex buffer
	gl.bindVertexArray(null); // unbinds the new vertex array
	
	const vertexShaderCode = "#version 300 es\nprecision mediump float;\n" + // These will have to appear in every shader we write, they set the version of GLSL that's used, and the floating point number's precision, in this case medium
	"layout(location = 0) in vec2 a_Position;" + // This takes in the first element of our vertex, in this case it's the vertex's position
	"layout(location = 1) in vec4 a_Color;" + // This takes in the second element of our vertex, in this case it's the vertex's color

	"out vec4 v_Color;" + // this defines a new varying variable, that will be passed into the fragment shader, it's named v_Color, as it stands for "varying color"

	"void main() {" + // we specify our main function, here we will do all the maths and things
		"gl_Position = vec4(a_Position, 0.0, 1.0);" + // the only thing we do in this shader, is that we set our point's position to be the vertex position we specified
		"v_Color = a_Color;" + // varying variable has to be set to some value, in this case the value is simply our vertex's color 
	"}"; 
	// Also remember that the vertex shader runs per vertex

	const fragmentShaderCode = "#version 300 es\nprecision mediump float;\n" + // as i said, we have to put it into every shader we write
	"layout(location = 0) out vec4 o_Color;" + // as and output of the fragment shader we specify the fragment's (pixel's) color.

	"in vec4 v_Color;" + // we have to take in our varying variable color

	"uniform vec4 u_Color;" + // we specify that we want to take in an uniform variable named u_Color

	"void main() {" + // again, all the maths and operations go here
		"o_Color = v_Color * u_Color;" + // we set the fragment's color to be our varying color, but multiplied by our uniform color
	"}";
	// And keep in mind that the fragment shader runs per fragment (pixel)
	
	vertexShader = gl.createShader(gl.VERTEX_SHADER); // we create a new vertex shader
	gl.shaderSource(vertexShader, vertexShaderCode); // we supply it with code
	gl.compileShader(vertexShader); // we compile it
	
	// simple error handling
	let message = gl.getShaderInfoLog(vertexShader);
	if(message.length > 0) {
		console.error(message);
		return;
	}

	fragmentShader = gl.createShader(gl.FRAGMENT_SHADER); // we create a new fragment shader
	gl.shaderSource(fragmentShader, fragmentShaderCode); // we supply it with code
	gl.compileShader(fragmentShader); // we compile it
	
	// simple error handling
	message = gl.getShaderInfoLog(fragmentShader);
	if(message.length > 0) {
		console.error(message);
		return;
	}

	program = gl.createProgram(); // we create our program
	gl.attachShader(program, vertexShader); // we attach our vertex shader to our program
	gl.attachShader(program, fragmentShader); // we attach our fragment shader to our program
	gl.linkProgram(program); // we link our program (glue it, make it stick toghever)
	gl.useProgram(program); // we bind our program
	gl.useProgram(null); // we unbind our program
	
	//gl.deleteShader(vertexShader); // we delete our vertex shader, cuz we don't need it anymore
	//gl.deleteShader(fragmentShader); // we delete our fragment shader, cuz we don't need it anymore

	// Setting the color uniform
	gl.useProgram(program); // we bind our program
	const colorUniformLocation = gl.getUniformLocation(program, "u_Color"); // we get our uniform's location
	gl.uniform4f(colorUniformLocation, 0.5, 1.0, 0.5, 1.0); // we set the color uniform to red
	gl.useProgram(null); // we unbind our program


	// we declare this function inside of the init function to make passing variables between them easier
	// yes js allows that
	// yes it looks horrible
	function onFrame() { // this function specifies what will happen every frame
		// we have to set the viewport, so that our triangle will render to the whole window
		gl.viewport(0, 0, canvas.width, canvas.height);
		
		// the only thing we want to happen for now, is for our screen to be cleared with a nice green color
		gl.clearColor(0.3, 1.0, 0.4, 1.0); // specifies the clearing color to be read (using RGBA)
		gl.clear(gl.COLOR_BUFFER_BIT); // clears the screen using a specified color
		
		gl.useProgram(program); // we bind our program
		gl.bindVertexArray(vertexArray); // we bind our vertex array
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); // we bind out vertex buffer
		
		gl.drawArrays(
			gl.TRIANGLES, // drawing mode - as i said, we're gonna build our shapes from triangles, so that's what we draw with
			0, // start - specifies the starting vertex from which we should start drawing our shape, we want to start from the beggining, so there's a zero there
			3 // size - specifies the ammount of verticies we want to render, we want to render just one triangle, that's just three verticies, so here's a three
		);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, null); // we unbind our vertex buffer
		gl.bindVertexArray(null); // we unbing our vertex array
		gl.useProgram(null); // we unbind our program
		
		// we also have to tell our browser that we want this function to be called again in the next frame
		window.requestAnimationFrame(onFrame); // we specify what function do we want to be called for the next frame
	}	
	// here we have to tell our browser what function we will call during the next frame
	window.requestAnimationFrame(onFrame);
}

initWebGL2(); // we call our init function, therefore initializing the application