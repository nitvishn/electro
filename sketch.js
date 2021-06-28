var CoulombConstant = 8987551787.3681764;
var particles = [];
var particle_width = 10;

var metres_per_pixel = 1;
var particle_mass = 1000;
var friction_proportion = 0;
var time_multiplier = 1;
var bounce = true;

var framerate = 30;
var seconds_per_frame = (1 / framerate) * time_multiplier;

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(framerate);

    //sliders
    metresSlider = createSlider(0.01, 2, 1, 0);
    metresSlider.position(20, 20);
    massSlider = createSlider(1, 2000, 1000, 1);
    massSlider.position(20, 50);
    frictionSlider = createSlider(0, 1, 0.05, 0);
    frictionSlider.position(20, 80);
    timeSlider = createSlider(0.1, 2, 1, 0);
    timeSlider.position(20, 110);

    //buttons
    resetButton = createButton('Reset Parameters')
    resetButton.position(20, 170)
    resetButton.mousePressed(reset)

    clearButton = createButton('Clear Particles')
    clearButton.position(20, 200)
    clearButton.mousePressed(clearParticles)

    //bounce
    bounceCheckBox = createInput(0, 1);
    bounceCheckBox.attribute("type", "checkbox");
    bounceCheckBox.position(120, 142);
    bounceCheckBox.attribute('checked', bounce);

    //title
    title = createElement('h1', 'Charged Particle Simulator')
    title.center()
    title.position(title.x, 0)
}

function clearParticles() {
    particles = []
}

function friction(v) {
    return v * friction_proportion;
}

function reset() {
    massSlider.value(1000);
    frictionSlider.value(0.05);
    metresSlider.value(1);
    timeSlider.value(1);
}

function Particle(x, y, charge, xvelocity, yvelocity, xforce, yforce) {
    this.x = x;
    this.y = y;
    this.charge = charge;
    this.xvelocity = xvelocity;
    this.yvelocity = yvelocity;
    this.xforce = xforce;
    this.yforce = yforce;
}

function combinations(list) {
    if (list.length < 2) {
        return [];
    }
    var first = list[0],
        rest = list.slice(1),
        pairs = rest.map(function(x) {
            return [first, x];
        });
    return pairs.concat(combinations(rest));
}

function drawParticles() {
    background(255);
    stroke(255)
    for (var i = 0; i < particles.length; i++) {
        P = particles[i];
        if (P.charge < 0) {
            fill(0, 0, Math.floor(-P.charge * 255));
        } else if (P.charge > 0) {
            fill(Math.floor(P.charge * 255), 0, 0);
        } else {
            fill(0);
        }
        ellipse(P.x, P.y, particle_width);
    }

    fill(0)
    text("Metres Per Pixel: " + String(metres_per_pixel), metresSlider.x * 2 + metresSlider.width, 35);
    text("Particle Mass: " + String(particle_mass), massSlider.x * 2 + massSlider.width, 65);
    text("Friction Percentage: " + String(friction_proportion * 100) + "%", frictionSlider.x * 2 + frictionSlider.width, 95);
    text("Time Multiplier: " + String(time_multiplier), timeSlider.x * 2 + timeSlider.width, 125);
    text("Bounce off edges: ", 20, 155)
}

function distance(P1, P2) {
    return Math.sqrt((P1.x - P2.x) ** 2 + (P1.y - P2.y) ** 2)
}

function slope(P1, P2) {
    return (P1.y - P2.y) / (P1.x - P2.x)
}

function check(arr, item) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === item) {
            return true
        }
    }
    return false
}

function combineParticles(p1, p2) {
    neutral = new Particle((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 0, (p1.xvelocity + p2.xvelocity) / 2, (p1.yvelocity + p2.yvelocity) / 2);
    particles.push(neutral)
    particles.splice(particles.indexOf(p1), 1)
    particles.splice(particles.indexOf(p2), 1)
}

function neutralise(p1, p2) {
    p1.charge = 0;
    p2.charge = 0;
}

function keyPressed() {
    if (keyCode === 78) {
        charge = -1;
        particles.push(new Particle(mouseX, mouseY, charge, 0, 0))
    } else if (keyCode === 80) {
        charge = 1
        particles.push(new Particle(mouseX, mouseY, charge, 0, 0))
    }
}

function touching(p1, p2) {
    return distance(p1, p2) <= 2 * particle_width
}

function forceComponents(force, angle) {
    return [force * Math.cos(angle), force * Math.sin(angle)]
}

function forceFromComponents(xforce, yforce) {
    return [(xforce ** 2) + (yforce ** 2), Math.atan(yforce / xforce)];
}

function forceSum(force1, angle1, force2, angle2) {
    comps = forceComponents(force1, angle1);
    xforce = comps[0];
    yforce = comps[1];
    comps2 = forceComponents(force2, angle2);
    xforce += comps2[0];
    yforce += comps2[1];
    return forceFromComponents(xforce, yforce);
}

function addForce(particle, force, angle) {
    particle.xvelocity += (force * Math.cos(angle) / particle_mass) * seconds_per_frame
    particle.xvelocity += (force * Math.sin(angle) / particle_mass) * seconds_per_frame
}

function outOfBounds(particle) {
    return (particle.x > windowWidth || particle.x < 0 || particle.y > windowHeight || particle.y < 0);
}

function addVelocity(particle, velocity, theta) {
    particle.xvelocity += Math.cos(theta) * velocity
    particle.yvelocity += Math.sin(theta) * velocity
}

function touchingVerticalWalls(particle) {
    return (particle.y + particle_width > windowHeight || particle.y - particle_width < 0)
}

function touchingHorizontalWalls(particle) {
    return (particle.x + particle_width > windowWidth || particle.x - particle_width < 0)
}

function forceFromEquation(p1, p2) {
    return (CoulombConstant * p1.charge * p2.charge) / ((distance(p1, p2) * metres_per_pixel) ** 2);
}

function getForcesForParticles(p1, p2) {
    mutual_force = forceFromEquation(p1, p2);
    theta1 = Math.atan(slope(p1, p2));
    theta2 = Math.atan(slope(p1, p2));
    if (p1.x < p2.x) {
        theta1 += Math.PI;
    } else {
        theta2 += Math.PI;
    }

    comps1 = forceComponents(mutual_force, theta1);
    comps2 = forceComponents(mutual_force, theta2);

    xforce1 = comps1[0];
    yforce1 = comps1[1]
    xforce2 = comps2[0];
    yforce2 = comps2[1]

    if (touching(p1, p2)) {
        buff = [p1.xvelocity, p1.yvelocity]
        p1.xvelocity = (p2.xvelocity + p1.xvelocity) / 2;
        p1.yvelocity = (p2.yvelocity + p1.yvelocity) / 2;
        p2.xvelocity = (buff[0] + p2.xvelocity) / 2;
        p2.yvelocity = (buff[1] + p2.yvelocity) / 2
        comps1 = [0, 0];
        comps2 = [0, 0];
        console.log("Touching!")
        // p1.charge = (p1.charge + p2.charge)/2;
        // p2.charge = p1.charge;
        // p1.xvelocity = 0;
        // p1.yvelocity = 0;
        // p2.xvelocity = 0;
        // p2.yvelocity = 0;
    }

    return [
        [xforce1, yforce1],
        [xforce2, yforce2]
    ]
}

function updateVelocities() {
    pairs = combinations(particles)
    j = pairs.length

    for (var i = 0; i < pairs.length; i++) {
        p1 = pairs[i][0]
        p2 = pairs[i][1]

        bounced = false;

        if (p1.x == p2.x && p1.y == p2.y) {
            neutralise(p1, p2)
            continue;
        }

        if (bounce) {
            if (touchingVerticalWalls(p1)) {
                p1.y -= p1.yvelocity * seconds_per_frame
                p1.x -= p1.xvelocity * seconds_per_frame
                p1.yvelocity = -p1.yvelocity;
                p1.y += p1.yvelocity * seconds_per_frame
                p1.x += p1.xvelocity * seconds_per_frame
                bounced = true;
            } else if (touchingHorizontalWalls(p1)) {
                p1.y -= p1.yvelocity * seconds_per_frame
                p1.x -= p1.xvelocity * seconds_per_frame
                p1.xvelocity = -p1.xvelocity;
                p1.y += p1.yvelocity * seconds_per_frame
                p1.x += p1.xvelocity * seconds_per_frame
                bounced = true;
            }
            if (touchingVerticalWalls(p2)) {
                p2.y -= p2.yvelocity * seconds_per_frame
                p2.x -= p2.xvelocity * seconds_per_frame
                p2.yvelocity = -p2.yvelocity;
                p2.y += p2.yvelocity * seconds_per_frame
                p2.x += p2.xvelocity * seconds_per_frame
                bounced = true;
            } else if (touchingHorizontalWalls(p2)) {
                p2.y -= p2.yvelocity * seconds_per_frame
                p2.x -= p2.xvelocity * seconds_per_frame
                p2.xvelocity = -p2.xvelocity;
                p2.y += p2.yvelocity * seconds_per_frame
                p2.x += p2.xvelocity * seconds_per_frame
                bounced = true;
            }
            if (bounced) {
                continue;
            }
        } else {
            if (outOfBounds(p1)) {
                particles.splice(particles.indexOf(p1), 1)
                pairs = combinations(particles)
                j = pairs.length
                continue;
            }
            if (outOfBounds(p2)) {
                particles.splice(particles.indexOf(p2), 1)
                pairs = combinations(particles)
                j = pairs.length
                continue;
            }
        }

        theta1 = Math.atan(slope(p1, p2))
        theta2 = Math.atan(slope(p1, p2))
        if (p1.x < p2.x) {
            theta1 += Math.PI
        } else {
            theta2 += Math.PI
        }
        forces = getForcesForParticles(p1, p2)

        p1.yvelocity += (forces[0][1] / particle_mass) * seconds_per_frame
        p2.yvelocity += (forces[1][1] / particle_mass) * seconds_per_frame

        p1.xvelocity += (forces[0][0] / particle_mass) * seconds_per_frame
        p2.xvelocity += (forces[1][0] / particle_mass) * seconds_per_frame

        p1.xvelocity -= friction(p1.xvelocity)
        p2.xvelocity -= friction(p2.xvelocity)
        p1.yvelocity -= friction(p1.yvelocity)
        p2.yvelocity -= friction(p2.yvelocity)

    }
}

function updatePositions() {
    for (var i = 0; i < particles.length; i++) {
        particles[i].x += particles[i].xvelocity * seconds_per_frame
        particles[i].y += particles[i].yvelocity * seconds_per_frame
    }
}

function sliderUpdate() {
    metres_per_pixel = metresSlider.value()
    friction_proportion = frictionSlider.value()
    particle_mass = massSlider.value()
    time_multiplier = timeSlider.value()
    bounce = bounceCheckBox.elt.checked;

}

function draw() {
    seconds_per_frame = (1 / framerate) * time_multiplier;
    drawParticles();
    sliderUpdate();
    updateVelocities();
    updatePositions();
}
