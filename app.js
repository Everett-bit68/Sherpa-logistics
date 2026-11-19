const PEAK_01_MAP = [
    [3, 3, 3, 9, 3, 3, 3],
    [3, 0, 2, 1, 2, 0, 3],
    [0, 1, 3, 2, 3, 1, 4],
    [0, 2, 1, 0, 1, 2, 0],
    [0, 2, 1, 0, 1, 2, 0],
    [4, 0, 3, 1, 3, 0, 0],
    [1, 1, 0, 2, 0, 1, 1],
    [0, 3, 1, 0, 1, 3, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [3, 3, 0, 0, 0, 3, 3]
];
const ROWS = PEAK_01_MAP.length;
const COLS = PEAK_01_MAP[0].length;
let state = {};
const gridEl = document.getElementById("mountain-grid");
const turnEl = document.getElementById("turn-display");
const rationsEl = document.getElementById("stat-rations");
const oxygenEl = document.getElementById("stat-oxygen");
const pitonsEl = document.getElementById("stat-pitons");
const elevationEl = document.getElementById("stat-elevation");
const logEl = document.getElementById("radio-log");
const modalOverlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
function initGame(){
    state = {
        grid: PEAK_01_MAP.map(row => [...row]),
        player: {x:3, y:8},
        turn : 1,
        rations : 12,
        oxygen : 10,
        pitons : 3,
        gameOver : false
    };
    logEl.innerHTML = "";
    modalOverlay.classList.add("hidden");
    addLog("Basecamp departed. Plan your route to the summit.");
    render();
}
function addLog(msg){
    const entry = document.createElement("div");
    entry.textContent = `[T${String(state.turn).padStart(2, "0")}] ${msg}`;
    logEl.prepend(entry);
}
function isAdjacent(x,y){
    const dx = Math.abs(x -state.player.x);
    const dy = Math.abs(y - state.player.y);
    return(dx + dy === 1);
}
function attemptMove(targetX, targetY){
    if (state.gameOver) return;
    if (targetX < 0 || targetX >= COLS || targetY < 0 || targetY >=ROWS) return;
    if (!isAdjacent(targetX,targetY))return;
    const tile = state.grid[targetY][targetX];
    if (tile === 3){
        addLog("Sheer cliff face. Impassable.");
        return;
    }
    let rationCost = 1;
    let pitonCost = 0;
    if (tile === 1) rationCost = 2;
    if (tile === 2){
        rationCost = 1;
        pitonCost = 1;
    }
    if (state.rations < rationCost){
        addLog("Insufficient rations for that climb!");
        return;
    }
    if (state.pitons < pitonCost){
        addLog("Need a climbing piton to scale that ice wall!");
        return;
    }
    state.player.x = targetX;
    state.player.y = targetY;
    state.rations -= rationCost;
    state.pitons -= pitonCost;
    state.oxygen -=1;
    state.turn +=1;
    if (tile === 4){
        state.rations += 4;
        state.oxygen +=3;
        state.pitons +=1;
        state.grid[targetY][targetX] = 0;
        addLog("Supply cache recovered! (+4 Rations, +3 O2, +1 Piton)");
    } else if (tile === 2){
        addLog("Anchored piton and scaled ice wall.");
    } else if (tile === 1){
        addLog("Traversed steep ridge (-2 Rations).");
    }
    checkEndConditions();
    render();
}
function pitchTent(){
    if (state.gameOver) return;
    if (state.rations < 1){
        addLog("Not enough rations to make camp.");
        return;
    }
    state.rations -=1;
    state.oxygen +=2;
    state.turn +=1;
    addLog("Pitched tent. Recovered +2 Oxygen (-1 Ration)");
    checkEndConditions();
    render();
}
function checkEndConditions(){
    const currentTile = state.grid[state.player.y][state.player.x];
    if (currentTile === 9){
        state.gameOver = true;
        showModal(
            "SUMMIT REACHED!",
            `You conquered Frostbite Ridge in ${state.turn - 1} turns with ${state.rations} rations and ${state.oxygen} oxygen remaining.`
        );
        return;
    }
    if (state.oxygen <=0){
        state.gameOver = true;
        showModal("HYPOXIA CRITICAL", "Your oxygen reserves ran dry before reaching the peak.");
        return;
    }
    if (state.rations <= 0){
        state.gameOver = true;
        showModal("EXHAUSTION", "You ran out of rations and could no longer continue the ascent.");
    }
}
function showModal(title,message){
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalOverlay.classList.remove("hidden");
}
function render(){
    turnEl.innerHTML = `TURN: <strong>${String(state.turn).padStart(2,"0")}</strong>`;
    rationsEl.textContent = state.rations;
    oxygenEl.textContent = state.oxygen;
    pitonsEl.textContent = state.pitons;
    const progress = (ROWS - 1 - state.player.y)/(ROWS - 1);
    const elevation = Math.round(4200 + progress * 4648);
    elevationEl.textContent = `${elevation.toLocaleString()}m`;
    gridEl.innerHTML = "";
    for (let y =0; y<ROWS; y++){
        for (let x = 0; x<COLS;x++){
            const tileVal = state.grid[y][x];
            const cell = document.createElement("div");
            cell.classList.add("tile");
            if (tileVal === 0){
                cell.classList.add("tile-snow");
                cell.textContent = ".";
            } else if (tileVal === 1){
                cell.classList.add("tile-ridge");
                cell.textContent = "^";
            } else if (tileVal === 2){
                cell.classList.add("tile-ice");
                cell.textContent = "#";
            } else if (tileVal === 3){
                cell.classList.add("tile-rock");
                cell.textContent = "X";
            } else if (tileVal === 4){
                cell.classList.add("tile-cache");
                cell.textContent = "+";
            } else if (tileVal === 9){
                cell.classList.add("tile-summit");
                cell.textContent = "PEAK";
            }
            if (isAdjacent(x,y) && tileVal !==3 && !state.gameOver){
                cell.classList.add("adjacent");
            }
            if (state.player.x === x && state.player.y === y){
                cell.innerHTML = `<div class="player-marker">P</div>`;
            }
            cell.addEventListener("click",()=> attemptMove(x,y));
            gridEl.appendChild(cell);
        }
    }
}
document.addEventListener("keydown",(e)=>{
    if (e.key === "r" || e.key === "R"){
        initGame();
        return;
    }
    const {x,y} = state.player;
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") attemptMove(x,y -1);
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") attemptMove(x,y + 1);
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") attemptMove(x - 1,y);
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") attemptMove(x + 1,y);
});
document.getElementById("btn-tent").addEventListener("click",pitchTent);
document.getElementById("btn-restart").addEventListener("click", initGame);
document.getElementById("btn-modal-restart").addEventListener("click", initGame);

initGame();