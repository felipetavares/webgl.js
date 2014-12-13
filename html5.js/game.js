function vSub (v0, v1) {
	return [v0[0]-v1[0],v0[1]-v1[1]];
}

function vDot (v0, v1) {
	return v0[0]*v1[0]+v0[1]*v1[1];
}

function vLen (v) {
	return Math.sqrt (v[0]*v[0]+v[1]*v[1]);
}

function noiseTransfer (x) {
	return 3*x*x-2*x*x*x;
}

function g (p, grd) {
	return vNormalize([p[0]*(p[0]%2?-1:1)+grd[0][0], p[1]*(p[1]%2?-1:1)]+grd[0][1]);
}

function noise2d (p, grd) {
	var n0 = [Math.floor(p[0]),Math.floor(p[1])];
	var n1 = [Math.ceil(p[0]),Math.floor(p[1])];
	var n2 = [Math.ceil(p[0]),Math.ceil(p[1])];
	var n3 = [Math.floor(p[0]),Math.ceil(p[1])];

	var s = vDot(vSub(p, n0), g(n0,grd));
	var t = vDot(vSub(p, n1), g(n1,grd));
	var u = vDot(vSub(p, n2), g(n2,grd));
	var v = vDot(vSub(p, n3), g(n3,grd));
	
	var sx = 3*Math.pow(p[0]-n0[0],2)-2*Math.pow(p[0]-n0[0],3);
	var a = s+sx*(t-s);
	var b = u+sx*(v-u);
	
	var sy = 3*Math.pow(p[1]-n3[1],2)-2*Math.pow(p[1]-n3[1],3);
	
	return s*t*u*v/4;
}

function vNormalize (v) {
	var d = vLen(v);
	return [v[0]/d,v[1]/d];
}

function vMul (v,s) {
	return [v[0]*s, v[1]*s];
}

function begin () {
	html5.getCanvas2dContext();
	html5.context.clearRect (0,0,html5.canvas.width, html5.canvas.height);

	var grd = [];
	
	for (var g=0;g<4;g++) {
		grd.push([Math.random()-0.5,Math.random()-0.5]);
	}
	
	for (var y=0;y<html5.canvas.height;y++)
		for (var x=0;x<html5.canvas.width;x++) {
			var v = Math.floor(Math.abs(noise2d([2*x/html5.canvas.width,2*y/html5.canvas.height],grd))*10000);
			html5.context.fillStyle = "rgb("+v+","+v+","+v+")";
			html5.context.fillRect(x,y,1,1);
		}
}
