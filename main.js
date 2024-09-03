const config = {
    type: Phaser.AUTO,
    width: window.innerWidth * 0.8,
    height: window.innerHeight * 0.8,
    backgroundColor: '#bfcc00',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let snake;
let food;
let poison;
let powerup;
let cursors;
let score = 0;
let scoreText;
let startButton;
let restartButton;
let eatSound;
let deathSound;
let normalMusic;
let backgroundColors = ['#bfcc00', '#ffcc00', '#00ccbf', '#cc00bf', '#ccbf00', '#bf00cc'];

const UP = 0;
const DOWN = 1;
const LEFT = 2;
const RIGHT = 3;

const game = new Phaser.Game(config);

function preload() {
    this.load.image('food', 'assets/food.png');
    this.load.image('body', 'assets/body.png');
    this.load.image('poison', 'assets/poison.png');
    this.load.image('powerup', 'assets/powerup.png');
    this.load.audio('eat', 'assets/eat.mp3');
    this.load.audio('normal', 'assets/normal.mp3');
    this.load.audio('death', 'assets/death.mp3');
    this.load.audio('powerup', 'assets/powerup.mp3');
}

function create() {
    let Food = new Phaser.Class({
        Extends: Phaser.GameObjects.Image,
        initialize: function Food(scene, x, y) {
            Phaser.GameObjects.Image.call(this, scene, x * 16, y * 16, 'food');
            this.setScale(0.17);
            this.setOrigin(0);
            this.total = 0;
            scene.children.add(this);
        },
        eat: function () {
            this.total++;
        }
    });

    let Poison = new Phaser.Class({
        Extends: Phaser.GameObjects.Image,
        initialize: function Poison(scene, x, y) {
            Phaser.GameObjects.Image.call(this, scene, x * 16, y * 16, 'poison');
            this.setScale(0.12);
            this.setOrigin(0);
            scene.children.add(this);
        }
    });

    let Powerup = new Phaser.Class({
        Extends: Phaser.GameObjects.Image,
        initialize: function Powerup(scene, x, y) {
            Phaser.GameObjects.Image.call(this, scene, x * 16, y * 16, 'powerup');
            this.setScale(0.5);
            this.setOrigin(0);
            scene.children.add(this);
        }
    });

    let Snake = new Phaser.Class({
        initialize: function Snake(scene, x, y) {
            this.headPosition = new Phaser.Geom.Point(x, y);
            this.body = scene.add.group();
            this.head = this.body.create(x * 16, y * 16, 'body');
            this.head.setOrigin(0);
            this.alive = false;
            this.speed = 100;
            this.moveTime = 0;
            this.tail = new Phaser.Geom.Point(x, y);
            this.heading = RIGHT;
            this.direction = RIGHT;
            this.lastSpeedIncreaseTime = 0;
        },
        update: function (time) {
            if (time >= this.moveTime) {
                this.checkAndIncreaseSpeed(time);
                return this.move(time);
            }
        },
        checkAndIncreaseSpeed: function(time) {
            if (time - this.lastSpeedIncreaseTime > 10000) {
                this.speed = Math.max(20, this.speed - 10);
                this.lastSpeedIncreaseTime = time;
            }
        },
        faceLeft: function () {
            if (this.direction === UP || this.direction === DOWN) {
                this.heading = LEFT;
            }
        },
        faceRight: function () {
            if (this.direction === UP || this.direction === DOWN) {
                this.heading = RIGHT;
            }
        },
        faceUp: function () {
            if (this.direction === LEFT || this.direction === RIGHT) {
                this.heading = UP;
            }
        },
        faceDown: function () {
            if (this.direction === LEFT || this.direction === RIGHT) {
                this.heading = DOWN;
            }
        },
        move: function (time) {
            switch (this.heading) {
                case LEFT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 70);
                    break;
                case RIGHT:
                    this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 70);
                    break;
                case UP:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 30);
                    break;
                case DOWN:
                    this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 50);
                    break;
            }

            this.direction = this.heading;

            Phaser.Actions.ShiftPosition(this.body.getChildren(), this.headPosition.x * 16, this.headPosition.y * 16, 1, this.tail);

            if (Phaser.Actions.GetFirst(this.body.getChildren(), { x: this.head.x, y: this.head.y }, 1)) {
                this.alive = false;
                alert('You died');
                playDeathSound();
                return false;
            } else {
                this.moveTime = time + this.speed;
                return true;
            }
        },
        grow: function () {
            let newPart = this.body.create(this.tail.x, this.tail.y, 'body');
            newPart.setOrigin(0);
        },
        collideWithFood: function (food) {
            if (this.head.x === food.x && this.head.y === food.y) {
                this.grow();
                food.eat();
                score += 10;
                scoreText.setText('Score: ' + score);
                playEatSound();
                changeBackgroundColor();
                return true;
            }
            return false;
        },
        collideWithPoison: function (poison) {
            if (this.head.x === poison.x && this.head.y === poison.y) {
                score -= 100;
                scoreText.setText('Score: ' + score);
                return true;
            }
            return false;
        },
        collideWithPowerup: function (powerup) {
            if (this.head.x === powerup.x && this.head.y === powerup.y) {
                score += 30;
                scoreText.setText('Score: ' + score);
                this.grow();
                this.grow();
                this.grow();
                this.speed = Math.min(this.speed + 20, 100);
                return true;
            }
            return false;
        },
        updateGrid: function (grid) {
            this.body.children.each(function (segment) {
                let bx = segment.x / 16;
                let by = segment.y / 16;
                grid[by][bx] = false;
            });
            return grid;
        }
    });

    food = new Food(this, 3, 4);
    poison = new Poison(this, 10, 12);
    powerup = new Powerup(this, 15, 15);
    snake = new Snake(this, 8, 8);
    cursors = this.input.keyboard.createCursorKeys();

    scoreText = this.add.text(config.width / 2, 10, 'Score: 0', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5, 0);

    startButton = document.getElementById('start-button');
    restartButton = document.getElementById('restart-button');

    eatSound = this.sound.add('eat');
    deathSound = this.sound.add('death');
    normalMusic = this.sound.add('normal', { loop: true });

    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);

    showStartScreen();
    normalMusic.play();
}

function update(time) {
    if (!snake.alive) {
        normalMusic.stop();
        return;
    }

    if (cursors.left.isDown) {
        snake.faceLeft();
    }
    else if (cursors.right.isDown) {
        snake.faceRight();
    }
    else if (cursors.up.isDown) {
        snake.faceUp();
    }
    else if (cursors.down.isDown) {
        snake.faceDown();
    }

    if (snake.update(time)) {
        if (snake.collideWithFood(food)) {
            repositionFood();
        }
        if (snake.collideWithPoison(poison)) {
            repositionPoison();
        }
        if (snake.collideWithPowerup(powerup)) {
            repositionPowerup();
        }
    }
}

function repositionFood() {
    let testGrid = Array.from({ length: 30 }, () => Array(40).fill(true));
    snake.updateGrid(testGrid);

    let validLocations = [];
    for (let y = 0; y < 30; y++) {
        for (let x = 0; x < 40; x++) {
            if (testGrid[y][x]) {
                validLocations.push({ x: x, y: y });
            }
        }
    }

    if (validLocations.length > 0) {
        let pos = Phaser.Math.RND.pick(validLocations);
        food.setPosition(pos.x * 16, pos.y * 16);
    }
}

function repositionPoison() {
    let testGrid = Array.from({ length: 30 }, () => Array(40).fill(true));
    snake.updateGrid(testGrid);

    let validLocations = [];
    for (let y = 0; y < 30; y++) {
        for (let x = 0; x < 40; x++) {
            if (testGrid[y][x]) {
                validLocations.push({ x: x, y: y });
            }
        }
    }

    if (validLocations.length > 0) {
        let pos = Phaser.Math.RND.pick(validLocations);
        poison.setPosition(pos.x * 16, pos.y * 16);
    }
}

function repositionPowerup() {
    let testGrid = Array.from({ length: 50 }, () => Array(40).fill(true));
    snake.updateGrid(testGrid);

    let validLocations = [];
    for (let y = 0; y < 30; y++) {
        for (let x = 0; x < 40; x++) {
            if (testGrid[y][x]) {
                validLocations.push({ x: x, y: y });
            }
        }
    }

    if (validLocations.length > 0) {
        let pos = Phaser.Math.RND.pick(validLocations);
        powerup.setPosition(pos.x * 16, pos.y * 16);
    }
}

function startGame() {
    snake.alive = true;
    score = 0;
    scoreText.setText('Score: ' + score);
    hideStartScreen();
    normalMusic.play();
}

function restartGame() {
    snake.alive = true;
    score = 0;
    scoreText.setText('Score: ' + score);
    snake.body.clear(true, true);
    snake = new Snake(this.scene, 8, 8);
    repositionFood();
    repositionPoison();
    repositionPowerup();
    normalMusic.play();
}

function showStartScreen() {
    startButton.style.display = 'block';
    restartButton.style.display = 'none';
}

function hideStartScreen() {
    startButton.style.display = 'none';
    restartButton.style.display = 'none';
}

function playEatSound() {
    eatSound.play();
}

function playDeathSound() {
    deathSound.play();
}

function changeBackgroundColor() {
    let randomColor = Phaser.Math.RND.pick(backgroundColors);
    game.scene.scenes[0].cameras.main.setBackgroundColor(randomColor);
}