ThreadsAnim = new (function(){
'use strict';
let canvas;
let width;
let height;
let deskImage;
let chairImage;
let deskBackImage;
let studentImages = [];
let studentSitImage;

let numThreads = 4;
let taskWait = 50;
let ballSpeed = 15;
let ballCount = 16;
let multithread = false;
let workStealing = false;

const accel = 2;
const animFrames = 10;
const ballRadius = 5;
const deskOffset = [30, 35];

const IDLE = 0;
const WALKING = 1;
const SIT = 2;

const walkSpeed = 5;

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
                this.pos[0] += this.pos[0] < this.dest ? walkSpeed : -walkSpeed;
        }
        else if(this.state === SIT/* && this.balls.length === 0*/){
            if(this.cooldown <= 0){
                if(this.heldBall){
                    this.cooldown += this.heldBall.throw(mainThread, this);
                    this.heldBall = null;
                }
                if(this.balls.length !== 0 && this.heldBall === null){
                    this.heldBall = this.balls.pop();
                    this.cooldown = taskWait * (Math.random() + 0.5);
                }
                else if(balls.reduce((acc, ball) => acc && ball.owner !== this, true)){
                    // If a ball is flying towards us, don't fetch the next ball or return.
                    if(mainThread.tasks.length === 0){
                        this.dest = 0;
                        this.state = WALKING;
                    }
                    else if(workStealing){
                        // fetch task
                        let ball = mainThread.tasks.pop();
                        ball.throw(this, mainThread);
                    }
                }
            }
            else{
                --this.cooldown;
            }
        }
        else if(this.state === IDLE && mainThread.tasks.length !== 0){
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
            ball.pos[0] = this.pos[0] + deskOffset[0] - ballRadius * (j + 1);
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

        if(this.state === WALKING){
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
        // const speed = ballSpeed * (Math.random() + 0.5);
        /// x = 1/2 * v * t^2 => t = \sqrt{2x/v}
        // const timeToArrive = (2 * speed / accel);
        /// v = (2 * x) / t^2
        const timeToArrive = ballSpeed * (Math.random() + 0.5);
        const speed = 2 * timeToArrive / accel;
        this.owner = target;
        this.pos[0] = source.pos[0] + deskOffset[0];
        this.pos[1] = source.pos[1] + deskOffset[1];
        this.velo[0] = ((target.pos[0]) - (source.pos[0])) / timeToArrive;
        this.velo[1] = -speed;
        balls.push(this);

        ballThrows++;
        const elem = document.getElementById("ballThrows");
        if(elem)
            elem.innerHTML = ballThrows;

        return timeToArrive;
    }
}

window.addEventListener('load', function() {
    const workStealingCheck = document.getElementById("workStealingCheck");
    if(workStealingCheck){
        workStealingCheck.addEventListener("click", function(){
            workStealing = workStealingCheck.checked;
        });
    }

    var multithreadCheck = document.getElementById("MultithreadCheck");
    if(multithreadCheck){
        multithreadCheck.addEventListener("click", function(){
            multithread = multithreadCheck.checked;
        });
    }

    const taskWaitEdit = this.document.getElementById("taskWaitEdit");
    if(taskWaitEdit){
        taskWaitEdit.addEventListener("change", function(){
            taskWait = parseFloat(taskWaitEdit.value);
        });
    }

    function sliderInit(sliderId, labelId, writer){
        const slider = document.getElementById(sliderId);
        const label = document.getElementById(labelId);
        label.innerHTML = slider.value;

        slider.addEventListener("input", (_event) => {
            let value = parseFloat(slider.value);
            label.innerHTML = value;
            writer(value);
        });
    };

    sliderInit("numThreads", "numThreadsLabel", value => numThreads = parseFloat(value));
    sliderInit("taskWait", "taskWaitLabel", value => taskWait = parseFloat(value));
    sliderInit("ballSpeed", "ballSpeedLabel", value => ballSpeed = parseFloat(value));
    sliderInit("ballCount", "ballCountLabel", value => ballCount = parseFloat(value));

    canvas = document.getElementById("scratch");
    if ( ! canvas || ! canvas.getContext ) {
        return false;
    }
    width = parseInt(canvas.style.width);
    height = parseInt(canvas.style.height);

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
    // window.setInterval(timerProc, 50);
    window.setTimeout(timerProc, 50);
});

var ballThrows = 0;
var balls = [];
let workerThreads;
let mainThread = new Person({
    id: -1,
    name: "mainThread",
    dest: 0,
    pos: [100, 300],
    balls: [],
});

mainThread.tasks = [];

let desks;
let walkCooldown = 0;

function resetState(){
    workerThreads = [...Array(numThreads)].map((_, i) => new Person({
        id: i,
        name: "ABCDEFGHJKLMOPQR"[i],
        dest: i * 100 + 100,
        pos: [0, 300],
        balls: [], cooldown: i === 0 ? 10 : 0
    }));
    desks = [...Array(numThreads)].map((_, i) => new Desk([i * 100 + 100, 300]))

    mainThread.pos[0] = workerThreads.length * 100 + 100;
}

resetState();

// for(var i = 0; i < 10; i++){
//     var target = people[Math.floor(Math.random() * people.length)];
//     balls.push(new Ball(target));
// }



function timerProc(){
    animate();
    draw();
    window.requestAnimationFrame(timerProc);
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
            ball.pos[0] = ball.owner.pos[0] + deskOffset[0];
            ball.pos[1] = ball.owner.pos[1] + deskOffset[1];
            continue;
        }
        else
            i++;
    }

    for(var i = 0; i < workerThreads.length; i++){
        var person = workerThreads[i];
        person.animate();
    }

    if(0 === mainThread.tasks.length && workerThreads.reduce((accum, worker) => accum && worker.state === IDLE, true)){
        mainThread.tasks = [...Array(ballCount)].map((_, i) => new Ball(mainThread));
        mainThread.balls = [];
        resetState();
    }
    else{
        for(let i = 0; i < mainThread.tasks.length; i++){
            const ball = mainThread.tasks[i];
            ball.pos[0] = mainThread.pos[0] + deskOffset[0] + i * ballRadius;
            ball.pos[1] = mainThread.pos[1] + deskOffset[1] - 2. * ballRadius;
        }
        for(let i = 0; i < mainThread.balls.length; i++){
            const ball = mainThread.balls[i];
            ball.pos[0] = mainThread.pos[0] + deskOffset[0] + i * ballRadius;
            ball.pos[1] = mainThread.pos[1] + deskOffset[1];
        }

        if(!workStealing && workerThreads.reduce((acc, worker) => acc && worker.state === SIT, true) && 0 < mainThread.tasks.length){
            let ball;
            while(ball = mainThread.tasks.pop()){
                ball.throw(workerThreads[mainThread.tasks.length % workerThreads.length], mainThread);
            }
        }
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

    const desiredWidth = workerThreads.length * 100 + 200;
    if(width < desiredWidth){
        ctx.scale(width / desiredWidth, width / desiredWidth);
    }

    for(let desk of desks)
        desk.draw(ctx, 2);

    for(let desk of desks)
        desk.draw(ctx, 1);

    // Draw people (represents threads)
    for(var i = 0; i < workerThreads.length; i++)
        workerThreads[i].draw(ctx, 1);

    for(let desk of desks)
        desk.draw(ctx, 0);

    for(var i = 0; i < workerThreads.length; i++)
        workerThreads[i].draw(ctx, 0);

    for(let i = 0; i < mainThread.tasks.length; i++)
        drawBall(mainThread.tasks[i], ctx);

    for(let i = 0; i < mainThread.balls.length; i++)
        drawBall(mainThread.balls[i], ctx);

    for(var i = 0; i < balls.length; i++){
        drawBall(balls[i], ctx);
    }

    setIdentity();
}
})();
