function preventEvent (evt) {
	evt.preventDefault();
}

function mMul (m0, m1) {
	// Result
	var r = [0,0,0,0,
			 0,0,0,0,
			 0,0,0,0,
			 0,0,0,0];
	var i,j,k;
	
	for (k=0;k<4;k++)
		for (j=0;j<4;j++) {
			for (i=0;i<4;i++) {
				r[j+4*k] += m0[i+4*k]*m1[4*i+j];
			}
		}
	
	return r;
}

function mRotateX (m0, a) {
	var rX = [
		1,0,0,0,
		0,Math.cos(a),-Math.sin(a),0,
		0,Math.sin(a),Math.cos(a),0,
		0,0,0,1
	];
	
	return mMul(m0,rX);
}

function mRotateY (m0, a) {
	var rY = [
		Math.cos(a),0,Math.sin(a),0,
		0,1,0,0,
		-Math.sin(a),0,Math.cos(a),0,
		0,0,0,1
	];
	
	return mMul(m0,rY);
}

function mRotateZ (m0, a) {
	var rZ = [
		Math.cos(a),-Math.sin(a),0,0,
		Math.sin(a),Math.cos(a),0,0,
		0,0,1,0,
		0,0,0,1
	];
	
	return mMul(m0,rZ);
}

function mTranslate (m0, v) {
	var r = [];
	for (var i=0;i<16;i++)
		r[i] = m0[i];
	r[12] -= v[0];
	r[13] -= v[1];
	r[14] -= v[2];
	return r;
}

function mIdentity () {
	return [
		1,0,0,0,
		0,1,0,0,
		0,0,1,0,
		0,0,0,1
	];
}

render = new function () {
	this.gl = null;
	
	this.shaders = [];
	this.buffers = [];
	this.framebuffers = {
		"default": null
	};

	this.activeShader = null;
	this.activeBuffer = null;

	this.pMatrix = [
		1,0,0,0,
		0,1,0,0,
		0,0,1,0,
		0,0,0,1
	];
	
	this.mvMatrix = [
		1,0,0,0,
		0,1,0,0,
		0,0,1,0,
		0,0,0,1
	];
	
	this.fail = function () {
		alert ("No Web-GL. I cannot run the game.")
	}
	
	this.begin = function (canvasElement) {
		window.addEventListener ("mousewheel", preventEvent);

		this.canvas = document.getElementById(canvasElement);
		
		if (!this.canvas) {
			alert("Invalid canvas element!");
			return;
		}
		
		try {
			this.gl = this.canvas.getContext("experimental-webgl");
			if (!this.gl) {
				this.gl = this.canvas.getContext("webgl");
			}
		} catch (e) {
		}
		
		if (this.gl) {
			this.makeShader ("default", "v-default", "f-default",
			{vertexPosition: "vertexPosition"},
			{pMatrix: "pMatrix",
			 mvMatrix: "mvMatrix"});
			window.onresize();
		} else {
			this.fail();
		}
	}

	this.useFrameBuffer = function (name) {
		this.gl.bindFramebuffer (this.gl.FRAMEBUFFER, this.framebuffers[name]);
	}

	this.createFrameBuffer = function (name, width, height) {
		// Create & bind framebuffer
		var framebuffer = this.gl.createFramebuffer();
		this.gl.bindFramebuffer (this.gl.FRAMEBUFFER, framebuffer);

		// Create & bind texture
		var texture = this.gl.createTexture();
		this.gl.bindTexture (this.gl.TEXTURE_2D, texture);

		// Set texture parameters
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		
		// This can fail if the texture is not a power of two
		this.gl.generateMipmap(this.gl.TEXTURE_2D);
		
		// Set texture size
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);

		// Create & bind depth buffer
		var renderbuffer = this.gl.createRenderbuffer();
		this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, renderbuffer);
		
		// Set depth buffer parameters (size mainly)
		this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, width, height);

		// Attach texture & depth buffer to the framebuffer
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);
		//this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, renderbuffer);

		// Unbind everything
		this.gl.bindTexture(this.gl.TEXTURE_2D, null);
		this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		
		framebuffer.texture = texture;
		
		// Add the framebuffer to the list
		this.framebuffers[name] = framebuffer;
	}
	
	this.makeShader = function (name, vertexName, fragmentName, attrs, uniforms) {
			var shader = this.linkShader (
				this.getShaderFromElement(vertexName),
				this.getShaderFromElement(fragmentName));
			this.registerShader (name, shader,
								attrs,
								uniforms);
		
	}
	
	this.getShaderFromElement = function (elementName) {
		var element = document.getElementById(elementName);
		if (!element)
			return null;
		
		var source = "";
      
		var k = element.firstChild;
		while (k) {
			if (k.nodeType == 3)
				source += k.textContent;
			k = k.nextSibling;
		}
		
		var shader = element.type == "shader/vertex"?
						this.gl.createShader(this.gl.VERTEX_SHADER):
					 (element.type == "shader/fragment"?
						this.gl.createShader(this.gl.FRAGMENT_SHADER):
						null);
		
		if (!shader)
			return null;
		
		this.gl.shaderSource (shader, source);
		this.gl.compileShader (shader);
		
		if (!this.gl.getShaderParameter (shader, this.gl.COMPILE_STATUS)) {
			alert(this.gl.getShaderInfoLog(shader));
			return null;
		}
		return shader;
	}
	
	this.linkShader = function (vertex, fragment) {
		var linked = this.gl.createProgram();
		this.gl.attachShader (linked, vertex);
		this.gl.attachShader (linked, fragment);
		this.gl.linkProgram(linked);
		
		if (!this.gl.getProgramParameter (linked, this.gl.LINK_STATUS)) {
			return null;
		}
		
		return linked;
	}
	
	this.registerShader = function (name, shader, vars, uniforms) {
		this.shaders[name] = shader;

		shader.uAttributes = {};
		for (var v in vars)  {
			shader.uAttributes[v] = this.gl.getAttribLocation(shader, vars[v]);
		}
		
		shader.uUniforms = {};
		for (var u in uniforms) {
			shader.uUniforms[u] = this.gl.getUniformLocation(shader, uniforms[u]);
		}
	}
	
	this.useShader = function (name) {
		this.gl.useProgram (this.shaders[name]);

		if (this.activeShader) {
			for (var a in this.activeShader.uAttributes) {
				this.gl.disableVertexAttribArray(this.activeShader.uAttributes[a]);
			}
		}

		this.activeShader = this.shaders[name];

		for (var a in this.activeShader.uAttributes) {
			this.gl.enableVertexAttribArray(this.activeShader.uAttributes[a]);
		}
	}
	
	this.createBuffer = function (name, data, size, type) {
		var atype = type?this.gl.ELEMENT_ARRAY_BUFFER:this.gl.ARRAY_BUFFER;
		
		var buffer = this.gl.createBuffer();
		buffer.size = size; 
		buffer.len = data.length/size;

		this.gl.bindBuffer(atype, buffer);
	
		this.gl.bufferData(atype, data, this.gl.STATIC_DRAW);
	
		this.buffers[name] = buffer;
	}
	
	this.useBuffer = function (name, type) {
		var atype = type==null?this.gl.ELEMENT_ARRAY_BUFFER:this.gl.ARRAY_BUFFER;
		
		var buffer = this.buffers[name];
		
		this.gl.bindBuffer(atype, buffer);

		if (type) {
			this.gl.vertexAttribPointer(this.activeShader.uAttributes[type], buffer.size, this.gl.FLOAT, false, 0, 0);
		}

		this.activeBuffer = buffer;
	}
	
	this.useFrameBufferAsTexture = function (name, uniformname) {
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.framebuffers[name].texture);
		this.gl.uniform1i(this.activeShader.uUniforms[uniformname], 0);
	}
	
	this.viewport = function (w,h) {
		if (w && h)
			this.gl.viewport(0, 0, w, h);
		else
			this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
	}
	
	this.clear = function () {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	}
	
	this.clearColor = function (color) {
		this.gl.clearColor (color[0],color[1],color[2],color[3]);
	}
	
	this.draw = function (wireframe) {
		this.gl.uniformMatrix4fv(this.activeShader.uUniforms.pMatrix, false, new Float32Array (this.pMatrix));
		this.gl.uniformMatrix4fv(this.activeShader.uUniforms.mvMatrix, false, new Float32Array (this.mvMatrix));
		this.gl.drawElements(wireframe?this.gl.LINE_STRIP:this.gl.TRIANGLE_STRIP, this.activeBuffer.len, this.gl.UNSIGNED_SHORT, 0);	
	}
	
	this.good = function () {
		return true && this.gl;
	}
	
	this.perspective = function (fovy, aspect, near, far) {
	   var f = 1.0 / Math.tan(fovy / 2),
			nf = 1 / (near - far);
		this.pMatrix[0] = f / aspect;
		this.pMatrix[1] = 0;
		this.pMatrix[2] = 0;
		this.pMatrix[3] = 0;
		this.pMatrix[4] = 0;
		this.pMatrix[5] = f;
		this.pMatrix[6] = 0;
		this.pMatrix[7] = 0;
		this.pMatrix[8] = 0;
		this.pMatrix[9] = 0;
		this.pMatrix[10] = (far + near) * nf;
		this.pMatrix[11] = -1;
		this.pMatrix[12] = 0;
		this.pMatrix[13] = 0;
		this.pMatrix[14] = (2 * far * near) * nf;
		this.pMatrix[15] = 0;
	}
	
	window.onresize = function () {
		//this.canvas.width = window.innerWidth;
		//this.canvas.height = window.innerHeight;
	}
}