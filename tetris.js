/** @type {CanvasRenderingContext2D} */ // VS Code currently doesn't support the intellisense for html5 canvas element
                                        // so we have to tell what type is canvas
const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");
const scoreElement = document.getElementById("score");

$.ajax({
    url: 'tetrominoes.js', 
    async: false,
    crossDomain: true, // 允许在本地运行
    dataType: "script",
    success: function(){
        const ROW = 20;
        const COLUMN = 10;
        const SQ = 20;
        const VACANT = "WHITE"; // color of an empty square
        
         // draw a square, x and y is the upper-left coordinate of the square
        function drawSquare (x,y,color){
            context.fillStyle = color;
            context.fillRect(x*SQ, y*SQ, SQ, SQ);
        
            context.strokeStyle = "black";
            context.strokeRect(x*SQ, y*SQ, SQ, SQ);
        }
        
        // create the board, a two dimensional array
        let board = [];
        for (r = 0; r < ROW; r++){
            board[r] = [];
            for (c = 0; c < COLUMN; c++){
                board[r][c] = VACANT;
            }
        }
        
        // draw the board to the canvas
        function drawBoard(){
            for (r = 0; r < ROW; r++){
                for (c = 0; c < COLUMN; c++){
                    drawSquare(c,r,board[r][c]);
                }
            }
        }
        
        drawBoard();
        
        
        // the pieces and their colors
        const PIECES = [
            [Z, "red"],
            [S, "green"],
            [T, "yellow"],
            [O, "blue"],
            [L, "purple"],
            [I, "cyan"],
            [J, "orange"],
        ];
        
        // generate a random piece
        function randomPiece(){
            let rand = Math.floor(Math.random() * PIECES.length); // 0 -> 6
            return new Piece(PIECES[rand][0], PIECES[rand][1]); //PIECES[rand][0] = shape, PIECES[rand][1] = color
        }
        
        let p = randomPiece();
        
        // The Object Piece
        function Piece(tetromino, color){
            // tetromino是一个含有四种不同图形的数组，其中每个图形又都是一个三维或四维数组
            this.tetromino = tetromino;
            this.color = color;
        
            this.tetrominoN = 0; // we will start from the first pattern
            this.activeTetromino = this.tetromino[this.tetrominoN];
        
            // set up the initial position of the piece
            this.x = 3;
            this.y = -2; //set to -2 so that when determining game over using this.y+r can work
        }
        
        // fill function
        Piece.prototype.fill = function(color){
            for (r = 0; r < this.activeTetromino.length; r++){
                for (c = 0; c < this.activeTetromino.length; c++){
                    // we only draw the occupied squares
                    if (this.activeTetromino[r][c]){
                        //this.x and this.y represents the coordinate of the piece in the board, while c and r represents the 
                        //relative location of a given square in the piece
                         drawSquare(this.x + c, this.y +  r, color);
                    }
                }
            }
        }
        
        // draw a piece to the board
        Piece.prototype.draw = function(){
            this.fill(this.color);
        }
        
        // undraw a piece
        Piece.prototype.unDraw = function(){
            this.fill(VACANT);
        }
        
        // move down the piece
        Piece.prototype.moveDown = function(){
            if (!this.collision(0,1,this.activeTetromino)){
                // 先将当前的图形清空，再往下落，然后再画图形   
                this.unDraw();
                this.y++;
                this.draw();
            }else{
                // we lock the piece and generate a new piece
                this.lock();
                p = randomPiece();
            }
        }
        
        // move right the piece
        Piece.prototype.moveRight = function(){
           if (!this.collision(1,0,this.activeTetromino)){
                // 先将当前的图形清空，再往右移，然后再画图形   
                this.unDraw();
                this.x++;
                this.draw();
            }
        }
        
        // move left the piece
        Piece.prototype.moveLeft = function(){
            if (!this.collision(-1,0,this.activeTetromino)){
                // 先将当前的图形清空，再往左移，然后再画图形   
                this.unDraw();
                this.x--;
                this.draw();
            }
        }
         
        // rotate the piece
        Piece.prototype.rotate = function(){
            let nextPattern = this.tetromino[(this.tetrominoN + 1) % this.tetromino.length]; // 不停的在0，1，2，3循环
            let kick = 0;
        
            if (this.collision(0,0,nextPattern)){
                if (this.x > COLUMN/2){
                    // it's the right wall
                    kick = -1; // we need to move the piece to left 
                }else{
                    // it's the left wall
                    kick = 1; // we need to move the piece to right
                }
            }
            if (!this.collision(kick,0,nextPattern)){
                // 先将当前的图形清空，再旋转，然后再画图形   
                this.unDraw();
                this.x += kick;
                this.tetrominoN = (this.tetrominoN + 1) % this.tetromino.length; // 不停的在0，1，2，3循环
                this.activeTetromino = this.tetromino[this.tetrominoN];// 更新图形状态
                this.draw();
            }
        }
        
        let score = 0;
        //lock function
        Piece.prototype.lock = function(){
            for (r = 0; r < this.activeTetromino.length; r++){
                for (c = 0; c < this.activeTetromino.length; c++){
                    // we skip the vacant squares
                    if (!this.activeTetromino[r][c]){
                        continue;
                    }
                    //pieces to lock on top = game over
                    if(this.y + r < 0){
                        alert("Game Over!");
                        // stop the request animation frame
                        gameOver = true;
                        break;
                    }
                    // we lock the piece by setting the that piece of board to that color
                    board[this.y + r][this.x + c] = this.color;
                }
            }
            // remove full rows
            for (r = 0; r < ROW; r++){
                let isRowFull = true;
                for (c = 0; c < COLUMN; c++){
                    //只有这一行每个元素都不为vacant才为true
                    isRowFull = isRowFull && (board[r][c] != VACANT);
                }
                if (isRowFull){
                    // if the row is full, we move all the rows down
                    for (y = r; y > 1; y--){
                        for (c = 0; c < COLUMN; c++){
                            board[y][c] = board[y-1][c];
                        }
                    }
                    // 将第一行清空
                    for (c = 0; c < COLUMN; c++){
                        board[0][c] = VACANT;
                    }
                    score += 10;
                }
            }
            // update the board
            drawBoard(); 
        
            // update the score
            scoreElement.innerHTML = score;
        }
        
        
        // collision function
        Piece.prototype.collision = function(x,y,piece){
            for (r = 0; r < piece.length; r++){
                for (c = 0; c < piece.length; c++){
                    // if the square is empty, we skit it
                   if (!piece[r][c]){
                       continue;
                   }
                   // coordinates of the piece after movement
                   let newX =  this.x + c + x;
                   let newY = this.y + r + y;
        
                   // conditions check
                   if (newX < 0 || newX >= COLUMN || newY >= ROW ){
                       return true;
                   }
                   // skip newY < 0; board[-1] will crush our game
                   if (newY < 0){
                       continue;
                   }
                   //check if there is a locked piece already in place
                   if (board[newY][newX] != VACANT){
                       return true;
                   }
                }
            }
            return false;
        }
        
        // CONTROL the piece
        document.addEventListener("keydown", CONTROL);
        
        function CONTROL(event){
            if (event.keyCode == 37){
                p.moveLeft();
            }else if (event.keyCode == 38){
                p.rotate();
            }else if (event.keyCode == 39){
                p.moveRight();
            }else if (event.keyCode == 40){
                p.moveDown();
            }
        }
        
        
        // drop the piece every one second
        let dropStart = Date.now();
        let gameOver = false;
        function drop(){
            let now = Date.now();
            let delta = now - dropStart;
            if (delta > 800){
                p.moveDown();
                dropStart = Date.now();
            }
            if (!gameOver){
                requestAnimationFrame(drop);
            }
        
        }
        
        drop();
        
    }
  });

