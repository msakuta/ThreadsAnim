ThreadsAnim = new (function(){
'use strict';
var canvas;
var width;
var height;
var animImages = [];
var deskImage;
var studentImages = [];

const animFrames = 10;

class Person {
	name = "A";
	pos = [0, 0];
	cooldown = 0;
	balls = [];
	frame = 0;

	constructor(params){
		this.name = params.name;
		this.pos = params.pos;
		this.cooldown = params.cooldown;
		this.balls = params.balls;
	}

	animate(){
		this.pos[0] = (this.pos[0] + 2) % width;
		this.frame = (this.frame + 1) % (2 * animFrames);
	}

	draw(ctx){
		var color = 0 < this.cooldown ? "#7f7f7f" : "#000000";
		var headHeight = 50;

		var animFrame = 0;
		if(0 < this.cooldown)
			animFrame = Math.max(0, Math.min(animImages.length-1, Math.floor(4 * (1. - this.cooldown / taskWait))));

		// ctx.drawImage(animImages[animFrame], this.pos[0] - 30, this.pos[1] - headHeight - 10);
		ctx.drawImage(studentImages[Math.floor(this.frame / animFrames)], this.pos[0] - 30, this.pos[1] - headHeight - 10, 60, 134);

		ctx.font = "15px Arial";
		ctx.fillStyle = color;
		ctx.fillText(this.name, this.pos[0] - 5, this.pos[1] - headHeight - 10);

	}
}

class Desk {
	pos = [0, 0];

	constructor(pos){
		this.pos = pos;
	}

	draw(ctx){
		ctx.drawImage(deskImage, 0, 0, 300, 300, this.pos[0] - 30, this.pos[1], 70, 70);
	}
}

window.addEventListener('load', function() {
	var asyncCheck = document.getElementById("asyncCheck");
	if(asyncCheck){
		asyncCheck.addEventListener("click", function(){
			asynch = asyncCheck.checked;
		});
	}

	var multithreadCheck = document.getElementById("MultithreadCheck");
	if(multithreadCheck){
		multithreadCheck.addEventListener("click", function(){
			multithread = multithreadCheck.checked;
		});
	}

	var edit = this.document.getElementById("taskWaitEdit");
	if(edit){
		edit.addEventListener("change", function(){
			taskWait = parseFloat(edit.value);
		});
	}

	canvas = document.getElementById("scratch");
	if ( ! canvas || ! canvas.getContext ) {
		return false;
	}
	width = parseInt(canvas.style.width);
	height = parseInt(canvas.style.height);

	for(var i = 0; i < 4; i++){
		animImages[i] = new Image();
		animImages[i].src = "assets/anim_000" + i + ".png";
	}

	deskImage = new Image();
	deskImage.src = "assets/desk.png";

	for(let i = 0; i < 2; i++){
		studentImages[i] = new Image();
		studentImages[i].src = `assets/student${i + 1}.png`;
	}

	draw();

	// Animate (framerate could be subject to discuss)
	window.setInterval(timerProc, 50);
});

var taskWait = 8;
var multithread = false;
var asynch = false;
var ballThrows = 0;
var balls = [];
var people = [...Array(4)].map((_, i) => new Person({name: "ABCD"[i], pos: [-30 + i * 100, 300], balls: [], cooldown: i === 0 ? 10 : 0}));
const desks = [...Array(4)].map((_, i) => new Desk([i * 100, 300]));

for(var i = 0; i < 10; i++){
	var target = people[Math.floor(Math.random() * people.length)];
	balls.push({
		pos: [target.pos[0], target.pos[1] + Math.random() * 200],
		velo: [0, -15 * Math.random()],
		owner: target,
		color: "rgb(" + (Math.random() * 255) + ", " + (Math.random() * 255) + ", " + (Math.random() * 255) + ")"
	});
}



function timerProc(){
	animate();
	draw();
}

function animate(){
	var accel = 2;

	for(var i = 0; i < balls.length;){
		var ball = balls[i];
		for(var j = 0; j < 2; j++)
			ball.pos[j] += ball.velo[j];
		// console.log("ball " + i + ": velo: " + ball.velo[1]);
		ball.velo[1] += accel;
		if(ball.owner === null)
			ball.owner = people[0];
		if(ball.owner.pos[1] - 15 < ball.pos[1]){
			ball.owner.balls.push(ball);
			balls.splice(i, 1);
			continue;
		}
		else
			i++;
	}

	for(var i = 0; i < people.length; i++){
		var person = people[i];
		person.animate();
		// console.log("person " + i + ": cooldown: " + person.cooldown);
		for(var j = 0; j < person.balls.length; j++){
			var ball = person.balls[j];
			ball.pos[0] = person.pos[0] - 15 - 5 * j;
			ball.pos[1] = person.pos[1] - 25;
		}
		if(0 < person.cooldown){
			person.cooldown--;
			continue;
		}
		var waitingBalls = balls.reduce(function(count, ball){
			if(ball.owner === person)
				count++;
			return count;
		}, 0);
		if((asynch || !waitingBalls) && 0 < person.balls.length){
			var ball = person.balls.splice(0, 1)[0];
			var leastHardWorkers = multithread ? people.filter(function(person){
				var leastQueue = people.reduce(function(min, person){
					return person.balls.length < min ? person.balls.length : min;
				}, balls.length);
				return leastQueue === person.balls.length;
			}) : people.slice(0, 1);
			// console.log("leastHardWorkers: " + leastHardWorkers.length);
			var target = leastHardWorkers[Math.floor(Math.random() * leastHardWorkers.length)];
			var speed = 10 + Math.random() * 20;
			/// x = 1/2 * v * t^2 => t = \sqrt{2x/v}
			var timeToArrive = (2 * speed / accel);
			ball.owner = target;
			ball.pos[0] = person.pos[0] + 15;
			ball.pos[1] = person.pos[1] - 25;
			ball.velo[0] = ((target.pos[0] - 15) - (person.pos[0] + 15)) / timeToArrive;
			ball.velo[1] = -speed;
			balls.push(ball);
			person.cooldown = taskWait;
			ballThrows++;
			var elem = document.getElementById("ballThrows");
			if(elem)
				elem.innerHTML = ballThrows;
		}
	}
}

function draw() {
	var ctx = canvas.getContext('2d');

	// Draw person shape on pos, annotated by name with color.
	// Pos will be the position of feet.
	function drawPerson(person, color){
		var {pos, name} = person;
		var color = 0 < person.cooldown ? "#7f7f7f" : "#000000";
		var headHeight = 50;
		var headRadius = 10;
		var handLength = 15;

		var animFrame = 0;
		if(0 < person.cooldown)
			animFrame = Math.max(0, Math.min(animImages.length-1, Math.floor(4 * (1. - person.cooldown / taskWait))));

		ctx.drawImage(animImages[animFrame], pos[0] - 30, pos[1] - headHeight - 10);

		ctx.font = "15px Arial";
		ctx.fillStyle = color;
		ctx.fillText(name, pos[0] - 5, pos[1] - headHeight - 10);

		for(var i = 0; i < person.balls.length; i++)
			drawBall(person.balls[i]);
	}

	function drawBall(ball){
		ctx.beginPath();
		ctx.arc(ball.pos[0], ball.pos[1], ballRadius, 0, 2*Math.PI);
		ctx.fillStyle = ball.color;
		ctx.fill();
		ctx.strokeStyle = "#000";
		ctx.stroke();
	}

	function setIdentity(){
		ctx.setTransform(1, 0, 0, 1, 0, 0);
	}

	var ballRadius = 5;
	var offset = 100;

	ctx.clearRect(0,0,width,height);
	ctx.setTransform(1,0,0,1, offset, 0);

	// Draw people (represents threads)
	for(var i = 0; i < people.length; i++)
		people[i].draw(ctx);

	for(let desk of desks)
		desk.draw(ctx);

	for(var i = 0; i < balls.length; i++){
		drawBall(balls[i]);
	}

	setIdentity();
}
})();
