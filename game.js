var  Game = (function () {
    var WIDTH = 200;
    var HEIGHT = 200;
    var CELL = 10;
    var ROWS = HEIGHT/CELL;
    var COLS = WIDTH/CELL ;

    function getNumb(min, max) {
        return  Math.floor(Math.random() * (max + 1 - min));
    }

    function getPosition (field) {
        var position = [getNumb(1,COLS),getNumb(1,ROWS)];
        if (field[position]) {
            return getPosition(field);
        }
        return position;
    }

    var interface = function () {
        var score = "Score";
        var buttons = "Start";
        var wrapper = document.createElement("div");
        var canvas = document.createElement("canvas");
        var label = document.createElement("span");
        var button = document.createElement("button");
        var context = canvas.getContext("2d");
        wrapper.id = "wrapper";
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        wrapper.appendChild(canvas);

        var buttonFunctions = function newGame() {
            if (game) {
                game.stop();
            }
            game = undefined;
            context.clearRect(0, 0, WIDTH, HEIGHT);
            game = new Game();
            game.updateScore(0);
            game.start();
        }
        button.innerHTML = buttons;
        button.addEventListener("click", buttonFunctions, false);
        wrapper.appendChild(button);
        label.innerHTML = score + ":0";
        label.id = score;
        wrapper.appendChild(label);
        document.body.appendChild(wrapper);
        document.body.addEventListener("keydown",function (event) {
            getPressedKey(event);
        },false);

        return context;
    };

    var context = interface();
    var clicked = undefined;

    var Entity = (function () {
        function Entity(field, position, kind) {
            this.kind = kind;
            this.position = position;
            this.cell = CELL;
            field [this.position] = this.kind;
        };

        Entity.prototype.grow = function (field, newPosition) {
            this.clear();
            field[this.position] = null;
            this.position = newPosition;
            this.draw();
            field[this.position] = this.kind;
        };

        Entity.prototype.delete = function (field) {
            this.clear();
            field[this.position] = null;
        };

        Entity.prototype.clear = function () {
            var x = (this.position[0] + 1) * this.cell - this.cell;
            var y = (this.position[1] + 1) * this.cell - this.cell;
            context.clearRect(x, y, CELL, CELL);
        };

        Entity.prototype.draw = function () {

            var img_apple = new Image();
            var img_snake = new Image();
            img_snake.src = 'images/images_snake.png';
            img_apple.src = 'images/apples.png';
            context.beginPath();
            var coord_x = (this.position[0]) * this.cell;
            var coord_y = (this.position[1]) * this.cell;
            context.rect(coord_x, coord_y, CELL, CELL);
            context.closePath();

            if (this.kind === "apple") {

                var pattern_apple = context.createPattern(img_apple, 'repeat');
                var pattern_snake = context.createPattern(img_snake, 'repeat');
                context.fillStyle = pattern_apple;
                context.fill();
                context.fillStyle = pattern_snake;
            }
            else {
                context.fill();
            }
        };

        return Entity;
    }());

    var Apple = (function () {
        var points = 10;
        function Apple (field,kind) {
            var position = getPosition (field);
            this.points = points;
            Entity.call(this,field,position,kind);
            this.draw();
        };
	
       Apple.prototype = Object.create(Entity.prototype);

        Apple.prototype.draw = function () {
            Entity.prototype.draw.call(this);
        };

        Apple.prototype.grow = function (field,newPosition) {
            Entity.prototype.grow .call(this,field, newPosition);
        };

        Apple.prototype.clear= function () {
            Entity.prototype.clear.call(this);
        };

        return Apple;
    }());

    var Snake = (function () {

        var LENGTH = 3;
        var DIRECTIONS = {
            "left": {"x":-1, "y":0},
            "right": {"x":1, "y":0},
            "up": {"x":0, "y":-1},
            "down": {"x":0, "y":1}
        };

        function createSnake (field) {
            var bodySnake =[];
            var position = [getNumb(1,COLS),getNumb(1,ROWS)];
            for (var i = 0;  i < LENGTH; i++) {
                var newEntity = new Entity(field,[position[0]+i,position[1]],"snake")
                bodySnake.push(newEntity);
                newEntity.draw();
            }
            return bodySnake;
        }

        function Snake (field) {
            var bodySnake = createSnake (field);
            this.bodySnake = bodySnake;
            this.head = bodySnake[bodySnake.length-1];
            this.tail = bodySnake[0];
            this.direction ="right";
            this.applesEaten = 0;
        }

        Snake.prototype.grow = function (field,newPosition) {

            this.tail.grow(field,newPosition)
            var newHead = this.bodySnake.shift();
            this.bodySnake.push(newHead);
            this.head = newHead;
            this.tail = this.bodySnake[0];
        };

        Snake.prototype.calcNewPosition = function() {

            var direction = DIRECTIONS [this.direction];
            var newPosition= [];
            newPosition[0] = this.head.position[0] + direction["x"];
            newPosition[1] = this.head.position[1] + direction["y"];
            newPosition = redraw(newPosition);

            return newPosition;
        };
        Snake.prototype.eat = function (field,apple) {
            var score = apple.points;
            this.applesEaten +=1;
            var position = apple.position;
            apple.delete(field);
            this.head = new Entity(field,position,"snake");
            this.bodySnake.push(this.head);
            this.head.draw();

            return score;
        };
        Snake.prototype.changeDirection = function (event) {
            if(!(event === this.direction)) {
                switch(event) {
                    case "right":
                        if(!(this.direction === "left")){
                            this.direction = "right";
                        }
                        break;
                    case "left":
                        if(!(this.direction === "right")){
                            this.direction = "left";
                        }
                        break;
                    case "up":
                        if(!(this.direction === "down")){
                            this.direction = "up";
                        }
                        break;
                    case "down":
                        if(!(this.direction ===  "up")){
                            this.direction = "down";
                        }
                        break;
                }
            }
        };

        return Snake;
    }());

    function Game () {
        this.field = {};
        this.score = 0;
        this.snake = new Snake(this.field);
        this.apple = new Apple(this.field,"apple");
        this.animation = undefined;
    }

    Game.prototype.start = function () {
        var that = this;
        var speed = 250;
        this.animation = setInterval (function () {
            that.animate();
        },speed);
    };

    Game.prototype.stop = function (){
        clearInterval(this.animation);
    };

   Game.prototype.animate = function(){
        if (clicked) {
            this.snake.changeDirection(clicked);
        }
        var newPosition = this.snake.calcNewPosition();
        if (this.field[newPosition] === "apple") {
            this.score += this.snake.eat(this.field,this.apple);
            this.updateScore();
            this.apple = new Apple(this.field,"apple");
            this.apple.draw();
            return;
        } else if (this.field[newPosition] === "snake") {
            this.endGame();
            return;
        }
        this.snake.grow(this.field,newPosition);
    };

    Game.prototype.endGame = function () {
        this.stop();
        game = null;
        context.clearRect(0,0,WIDTH,HEIGHT);
        context.fillText("GAME OVER",WIDTH/3,HEIGHT/2);
    };

    function redraw (position) {
        if (position[0] < 0){
            position[0] += COLS;
        } else  if (position[0] > COLS) {
            position[0] -= COLS;
        } else if (position[1] < 0) {
            position[1] += ROWS;
        } else if (position[1] > ROWS) {
            position[1] -= ROWS;
        }

        return position;
    }

    Game.prototype.updateScore = function (){
        var scoreLabel = document.getElementById("Score");
        scoreLabel.innerHTML = "Score: " + this.score;
    };

    function getPressedKey(e){

        var key;
        (window.event) ? key = e.keyCode :
            (e.which) ? key = e.which :
                key = undefined;
        (key === 37) ? key = "left" :
            (key === 38) ? key = "up" :
                (key ===39) ? key = "right" :
                    (key === 40) ? key = "down" :
                        key = undefined;

        clicked = key;
    }

    var game = new Game();
    return game;

}());


