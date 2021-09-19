ThreadsAnim = new (function(){
'use strict';
var canvas;
var width;
var height;
var animImages = [];
let deskImage;
let chairImage;
let deskBackImage;
let studentImages = [];
let studentSitImage;

const accel = 2;
const animFrames = 5;
const ballRadius = 5;
const deskOffset = [30, 35];

const IDLE = 0;
const WALKING = 1;
const SIT = 2;

const walkSpeed = 10;

class Person {
    name = "A";
    pos = [0, 0];
    cooldown = 0;
    balls = [];
    frame = 0;
    state = IDLE;
    heldBall = null;

    constructor(params){
        this.id = params.id;
        this.name = params.name;
        this.pos = params.pos;
        this.dest = params.dest;
        this.cooldown = params.cooldown;
        this.balls = params.balls;
        this.walking = true;
    }

    animate(){
        if(this.state === WALKING){
            if(Math.abs(this.pos[0] - this.dest) < walkSpeed){
                this.state = this.dest === 0 ? IDLE : SIT;
                this.pos[0] = this.dest;
                this.cooldown = 0;
            }
            else
                this.pos[0] = (this.pos[0] + (this.pos[0] < this.dest ? walkSpeed : -walkSpeed) + width) % width;
        }
        else if(this.state === SIT/* && this.balls.length === 0*/){
            if(--this.cooldown <= 0){
                if(this.heldBall){
                    this.heldBall.throw(mainThread, this);
                    this.heldBall = null;
                }
                if(this.balls.length !== 0){
                    this.heldBall = this.balls.pop();
                    this.cooldown = Math.random() * 50 + 100;
                }
                else if(tasks.length === 0){
                    this.dest = 0;
                    this.state = WALKING;
                }
                else{
                    // fetch task
                    let ball = new Ball(this);
                    ball.throw(this, mainThread);
                    this.cooldown += 100;
                    tasks.pop();
                }
            }
        }
        else if(this.state === IDLE && tasks.length !== 0){
            if(walkCooldown <= 0){
                this.state = WALKING;
                this.dest = this.id * 100 + 100;
                walkCooldown += 20;
            }
            walkCooldown--;
        }
        this.frame = (this.frame + 1) % (2 * animFrames);

        for(let j = 0; j < this.balls.length; j++){
            let ball = this.balls[j];
            ball.pos[0] = this.pos[0] + deskOffset[0] - 5 * j;
            ball.pos[1] = this.pos[1] + deskOffset[1];
        }
    }

    draw(ctx, depth){
        if(depth === 0){
            for(let i = 0; i < this.balls.length; i++)
                drawBall(this.balls[i], ctx);
            if(this.heldBall)
                drawBall(this.heldBall, ctx);
            return;
        }
        else if(depth !== 1){
            return;
        }
        var color = 0 < this.cooldown ? "#7f7f7f" : "#000000";
        var headHeight = 40;

        var animFrame = 0;
        if(this.state === WALKING){
            animFrame = Math.max(0, Math.min(animImages.length-1, Math.floor(4 * (1. - this.cooldown / taskWait))));

            // ctx.drawImage(animImages[animFrame], this.pos[0] - 30, this.pos[1] - headHeight - 10);
            ctx.save();
            ctx.translate(this.pos[0], this.pos[1] - headHeight - 10);
            if(this.pos[0] > this.dest)
                ctx.scale(-1, 1);
            ctx.drawImage(studentImages[Math.floor(this.frame / animFrames)],
                0, 0, 95, 214,
                0, 0, 60, 134);
            ctx.restore();
        }
        else if(this.state === SIT){
            ctx.drawImage(studentSitImage, this.pos[0], this.pos[1] - headHeight - 10, 60, 134);
        }
        else
            ctx.drawImage(studentImages[0], this.pos[0], this.pos[1] - headHeight - 10, 60, 134);

        ctx.font = "15px Arial";
        ctx.fillStyle = color;
        ctx.fillText(this.name, this.pos[0] + 30, this.pos[1] - headHeight - 10);
    }
}

class Desk {
    pos = [0, 0];

    constructor(pos){
        this.pos = pos;
    }

    draw(ctx, depth){
        switch(depth){
        case 0: ctx.drawImage(deskImage, 0, 0, 139, 182, this.pos[0], this.pos[1], 69, 91); break;
        case 1: ctx.drawImage(chairImage, 0, 0, 139, 182, this.pos[0], this.pos[1], 69, 91); break;
        case 2: ctx.drawImage(deskBackImage, 0, 0, 139, 182, this.pos[0], this.pos[1], 69, 91); break;
        }
    }
}

class Ball {
    pos = [0, 0];
    velo = [0, -15 * Math.random()];
    owner = null;
    color = "rgb(" + (Math.random() * 255) + ", " + (Math.random() * 255) + ", " + (Math.random() * 255) + ")";

    constructor(target){
        this.pos = [target.pos[0], target.pos[1] + Math.random() * 200];
        this.owner = target;
    }

    animate(){

    }

    throw(target, source){
        const speed = 10 + Math.random() * 20;
        /// x = 1/2 * v * t^2 => t = \sqrt{2x/v}
        const timeToArrive = (2 * speed / accel);
        this.owner = target;
        this.pos[0] = source.pos[0] + deskOffset[0];
        this.pos[1] = source.pos[1] + deskOffset[1];
        this.velo[0] = ((target.pos[0]) - (source.pos[0])) / timeToArrive;
        this.velo[1] = -speed;
        balls.push(this);
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

    chairImage = new Image();
    chairImage.src = "assets/chair.png";

    deskBackImage = new Image();
    deskBackImage.src = "assets/desk-back.png";

    for(let i = 0; i < 2; i++){
        studentImages[i] = new Image();
        studentImages[i].src = `assets/student${i + 1}.png`;
    }

    studentSitImage = new Image();
    studentSitImage.src = "assets/student-sit.png";

    draw();

    // Animate (framerate could be subject to discuss)
    window.setInterval(timerProc, 50);
});

var taskWait = 8;
var multithread = false;
var asynch = false;
var ballThrows = 0;
var balls = [];
var people = [...Array(4)].map((_, i) => new Person({
    id: i,
    name: "ABCD"[i],
    dest: i * 100 + 100,
    pos: [0, 300],
    balls: [], cooldown: i === 0 ? 10 : 0
}));
let mainThread = new Person({
    id: -1,
    name: "mainThread",
    dest: 0,
    pos: [0, 300],
    balls: [],
});

const desks = [...Array(4)].map((_, i) => new Desk([i * 100 + 100, 300]));
let tasks = [...Array(4)].map((_, i) => i);
let walkCooldown = 0;

// for(var i = 0; i < 10; i++){
//     var target = people[Math.floor(Math.random() * people.length)];
//     balls.push(new Ball(target));
// }



function timerProc(){
    animate();
    draw();
}

function animate(){

    for(var i = 0; i < balls.length;){
        var ball = balls[i];
        for(var j = 0; j < 2; j++)
            ball.pos[j] += ball.velo[j];
        // console.log("ball " + i + ": velo: " + ball.velo[1]);
        ball.velo[1] += accel;
        // if(ball.owner === null)
        //     ball.owner = people[0];
        if(ball.owner.pos[1] + deskOffset[0] < ball.pos[1]){
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

    if(0 === tasks.length && people.reduce((accum, person) => accum && person.state === IDLE, true)){
        tasks = [...Array(4)].map((_, i) => i);
    }
}

function drawBall(ball, ctx){
    ctx.beginPath();
    ctx.arc(ball.pos[0], ball.pos[1], ballRadius, 0, 2*Math.PI);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.stroke();
}

function draw() {
    var ctx = canvas.getContext('2d');

    function setIdentity(){
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    var offset = 0;

    ctx.clearRect(0,0,width,height);
    ctx.setTransform(1,0,0,1, offset, 0);

    for(let desk of desks)
        desk.draw(ctx, 2);

    for(let desk of desks)
        desk.draw(ctx, 1);

    // Draw people (represents threads)
    for(var i = 0; i < people.length; i++)
        people[i].draw(ctx, 1);

    for(let desk of desks)
        desk.draw(ctx, 0);

    for(var i = 0; i < people.length; i++)
        people[i].draw(ctx, 0);

    for(var i = 0; i < balls.length; i++){
        drawBall(balls[i], ctx);
    }

    setIdentity();
}
})();
