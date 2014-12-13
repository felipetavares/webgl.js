function begin () {
	//alert (noise2d([0.2,0], [[1,0],[0,1],[0.72,0.72],[-1,0]]));

	// Initialize webgl
	render.begin("canvas");
	render.makeShader ("texture", "v-texture", "f-texture",
	{"vertexPosition": "vertexPosition",
	"texCoord": "texCoord"},
	{"pMatrix": "pMatrix",
	 "mvMatrix": "mvMatrix",
	 "sampler": "sampler"});
	
	// Vertices
	render.createBuffer ("vertices",
		new Float32Array([
			0,-1,0,
			-1,1,0,
			1,1,0,
		]),
		3,false
	);

	// Vertices
	render.createBuffer ("screen-vertices",
		new Float32Array([
			-1,-1,0,
			1,-1,0,
			1,1,0,
			-1,1,0
		]),
		3,false
	);
	
	// Texture Coords
	render.createBuffer ("textures",
		new Float32Array([
			0,0,
			1,0,
			1,1,
			0,1
		]),
		2,false
	);


	// Create a triangle
	render.createBuffer ("triangle",
		new Uint16Array([
			0,1,2,0
		]),
		1,true
	);

	// Create a square
	render.createBuffer ("square",
		new Uint16Array([
			0,1,2,3,0
		]),
		1,true
	);

	render.createFrameBuffer ("screen", render.canvas.width, render.canvas.height);
	
	render.clearColor ([0,0,0,1]);

	render.viewport();

	// Verify if everything is ok
	if (render.good()) {
		setTimeout (draw, 0);
	}
}

function draw () {
	render.perspective (3.14/2, render.canvas.width/render.canvas.height,
						1, 100);
	render.mvMatrix = mIdentity();
	render.mvMatrix = mTranslate (render.mvMatrix, [0,0,5]);
	// Rotate the thing
	//render.mvMatrix = mRotateY (render.mvMatrix, new Date()/1000);
	
	render.useFrameBuffer("screen");
	render.useShader ("default");
	
	// Use the vertices we created
	render.useBuffer("vertices","vertexPosition");
	
	render.useBuffer("triangle",null);
	render.clear();
	render.draw(true);

	render.useFrameBuffer("default");
	render.useShader ("texture");
	
	// Use the vertices we created
	render.useBuffer("screen-vertices","vertexPosition");
	render.useBuffer("textures","texCoord");
	render.useFrameBufferAsTexture ("screen","sampler");

	render.useBuffer("square",null);
	render.clear();
	
	render.pMatrix = mIdentity();
	render.mvMatrix = mIdentity();

	render.draw();
	
	setTimeout (draw, 1000/60);
}