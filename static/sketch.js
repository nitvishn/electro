var CoulombConstant = 8987551787.3681764;
var metres_per_pixel = 1;
var particle_width = 10;
var particle_mass = 1000;
var particles = [];
var framerate = 60;

var last = -1;

var friction_proportion = 0.05;
var collision_proportion = 0;

var seconds_per_frame = 1/framerate;

function setup() {
	createCanvas(windowWidth, windowHeight);
	frameRate(framerate)
}

function friction(v){
	return v*friction_proportion;
}

function Particle(x, y, charge, xvelocity, yvelocity){
	this.x = x;
	this.y = y;
	this.charge = charge;
	this.xvelocity = xvelocity;
	this.yvelocity = yvelocity;
}

function combinations(list) {
  if (list.length < 2) { return []; }
  var first = list[0],
      rest  = list.slice(1),
      pairs = rest.map(function (x) { return [first, x]; });
  return pairs.concat(combinations(rest));
}

function drawParticles(){
	background(0);
	for(var i = 0; i<particles.length; i++){
		P = particles[i];
		if(P.charge < 0){
			fill(0, 0, 255);
		}else if(P.charge > 0){
			fill(255, 0, 0);
		}else{
			fill(255);
		}
		ellipse(P.x, P.y, particle_width);
	}
}

function distance(P1, P2){
	return Math.sqrt((P1.x - P2.x)**2 + (P1.y - P2.y)**2)
}

function slope(P1, P2){
	return (P1.y - P2.y)/(P1.x - P2.x)
}

function check(arr, item){
	for(var i = 0; i < arr.length; i++){
		if(arr[i]===item){
			return true
		}
	}
	return false
}

function combineParticles(p1, p2){
	neutral = new Particle((p1.x+p2.x)/2, (p1.y+p2.y)/2, 0, (p1.xvelocity+p2.xvelocity)/2, (p1.yvelocity+p2.yvelocity)/2);
	particles.push(neutral)
	particles.splice(particles.indexOf(p1), 1)
	particles.splice(particles.indexOf(p2), 1)
	console.log(particles)
}

function neutralise(p1, p2){
	p1.charge = 0;
	p2.charge = 0;
}

function keyPressed(){
	if(keyCode === 78){
		charge = -1;
		particles.push(new Particle(mouseX, mouseY, charge, 0, 0))
	}else if(keyCode === 80){
		charge = 1
		particles.push(new Particle(mouseX, mouseY, charge, 0, 0))
	}
}

function updateVelocities(){
	pairs = combinations(particles)
	for(var i = 0; i < pairs.length; i++){
		p1 = pairs[i][0]
		p2 = pairs[i][1]
		theta1 = Math.atan(slope(p1, p2))
		theta2 = Math.atan(slope(p1, p2))
		if(p1.x < p2.x){
			theta1 += Math.PI
		}else{
			theta2 += Math.PI
		}
		force = (CoulombConstant*p1.charge*p2.charge)/((distance(p1, p2)*metres_per_pixel)**2);
		if(distance(p1, p2)<(particle_width*1.2) && ((p1.charge>0&&p2.charge<0)||(p1.charge<0&&p2.charge>0))){
			// p1.xvelocity = 0;
			// p1.yvelocity = 0;
			// p2.xvelocity = 0;
			// p2.yvelocity = 0;

			buff = [p1.xvelocity, p1.yvelocity]
			p1.xvelocity = p2.xvelocity - collision_proportion*p2.xvelocity;
			p1.yvelocity = p2.yvelocity - collision_proportion*p2.yvelocity;
			p2.xvelocity = buff[0] - collision_proportion*buff[0];
			p2.yvelocity = buff[1] - collision_proportion*buff[1];
			neutralise(p1, p2)
			continue;
		}
		p1.xvelocity += (force*Math.cos(theta1)/particle_mass)*seconds_per_frame
		p2.xvelocity += (force*Math.cos(theta2)/particle_mass)*seconds_per_frame

		p1.yvelocity += (force*Math.sin(theta1)/particle_mass)*seconds_per_frame
		p2.yvelocity += (force*Math.sin(theta2)/particle_mass)*seconds_per_frame

		p1.xvelocity -= friction(p1.xvelocity)
		p2.xvelocity -= friction(p2.xvelocity)
		p1.yvelocity -= friction(p1.yvelocity)
		p2.yvelocity -= friction(p2.yvelocity)

	}
}

function updatePositions(){
	for(var i = 0; i < particles.length; i++){
		particles[i].x += particles[i].xvelocity * seconds_per_frame
		particles[i].y += particles[i].yvelocity * seconds_per_frame
	}
}

function draw() {
	drawParticles();
	updateVelocities();
	updatePositions();
}
