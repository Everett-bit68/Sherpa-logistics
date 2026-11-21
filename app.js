const PEAKS = [
    {
        id: "PEAK_01",
        name: "FROSTBITE RIDGE",
        baseElevation: 4200,
        summitElevation: 8848,
        startPos: {x : 3, y : 8},
        rations: 12,
        oxygen: 10,
        pitons: 3,
        blizzardRows: [2,6],
        map: [
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
        ]
    },
    {
        id: "PEAK 02",
        name: "SERAC WALL",
        baseElevation: 5100,
        summitElevation: 8611,
        startPos: {x:3,y:9},
        rations: 11,
        oxygen: 9,
        pitons: 2,
        blizzardRows: [1,4,7],
        map:[

        ]
    }
];
let currentPeakIndex = 0;
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
const weatherEl = document.getElementById("weather-display");
const subtitleEl =document.querySelector(".brand .subtitle");
const nextPeakBtn = document.getElementById("btn-next-peak");
const peakSelectEl = document.getElementById("peak-select");
function initGame(peakIndex = currentPeakIndex){
    currentPeakIndex = peakIndex;
    const peak = PEAKS[currentPeakIndex];
    state = {
        grid: peak.map.map(row => [...row]),
        rows: peak.map.length,
        cols: peak.map[0].length,
        player: {...peak.startPos},
        turn: 1,
        rations: peak.rations,
        oxygen: peak.oxygen,
        pitons: peak.pitons,
        blizzardRows: [...peak.blizzardRows],
        gameOver: false
    };
    if (subtitleEl){
        subtitleEl.textContent = `${peak.id}: ${peak.name}`;
    }
    if (nextPeakBtn){
        nextPeakBtn.classList.add("hidden");
    }
    logEl.innerHTML = "";
    modalOverlay.classList.add("hidden");
    addLog(`${peak.id} (${peak.name}) basecamp departed. Plan your route.`);    
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
    if (targetX < 0 || targetX >= state.cols|| targetY < 0 || targetY >=state.rows) return;
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
    if (state.grid[targetY][targetX] !== 9){
        advanceBlizzards(false);
    }
    checkEndConditions();
    render();
}
function pitchTent(){
    if (state.gameOver) return;
    if (state.rations <= 1){
        addLog("Not enough rations to make camp.");
        return;
    }
    state.rations -=1;
    state.oxygen +=2;
    state.turn +=1;
    addLog("Pitched tent. Recovered +2 Oxygen (-1 Ration)");
    advanceBlizzards(true);
    checkEndConditions();
    render();
}
function checkEndConditions(){
    const currentTile = state.grid[state.player.y][state.player.x];
    if (currentTile === 9){
        state.gameOver = true;
        const peak = PEAKS[currentPeakIndex];
        const hasNextPeak = currentPeakIndex<PEAKS.length-1;
        if (nextPeakBtn){
            nextPeakBtn.classList.toggle("hidden",!hasNextPeak);
        }
        showModal(
            "SUMMIT REACHED!",
            `You conquered ${peak.name} in ${state.turn - 1} turns with ${state.rations} rations and ${state.oxygen} oxygen remaining.`
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
    const peak = PEAKS[currentPeakIndex];
    const progress = (state.rows - 1-state.player.y)/(state.rows-1);
    const elevation =Math.round(peak.baseElevation+progress*(peak.summitElevation-peak.baseElevation));
    elevationEl.textContent = `${elevation.toLocaleString()}m`;
    const forecastRows = state.blizzardRows.map(getNextRow);
    const playerInStorm = state.blizzardRows.includes(state.player.y);
    const playerInForecast = forecastRows.includes(state.player.y);
    if (playerInStorm){
        weatherEl.textContent = "WEATHER: WHITEOUT";
        weatherEl.classList.add("storm-alert");
    } else if (playerInForecast){
        weatherEl.textContent = "WEATHER: STORM INCOMING";
        weatherEl.classList.add("storm-alert");
    } else {
        weatherEl.textContent = "WEATHER: CLEAR";
        weatherEl.classList.remove("storm-alert");
    }
    gridEl.innerHTML = "";
    for (let y =0; y<state.rows; y++){
        for (let x = 0; x<state.cols;x++){
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
            if(state.blizzardRows.includes(y) && tileVal !== 3 && tileVal !== 9){
                cell.classList.add("blizzard");
            } else if (forecastRows.includes(y) && tileVal !== 3 && tileVal !==9){
                cell.classList.add("forecast");
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
if (peakSelectEl){
    peakSelectEl.addEventListener("change",(e)=>{
        initGame(Number(e.target.value));
    });
}
if (nextPeakBtn){
    nextPeakBtn.addEventListener("click",()=>{
        const nextIndex = (currentPeakIndex + 1) % PEAKS.length;
        if (peakSelectEl) peakSelectEl.value = String(nextIndex);
        initGame(nextIndex);
    });
}
document.getElementById("btn-tent").addEventListener("click",pitchTent);
document.getElementById("btn-restart").addEventListener("click", initGame);
document.getElementById("btn-modal-restart").addEventListener("click", initGame);
function getNextRow(row){
    return row >= state.rows - 2?1:row+1;
}
function advanceBlizzards(isSheltered){
    state.blizzardRows = state.blizzardRows.map(getNextRow);
    const inStorm = state.blizzardRows.includes(state.player.y);
    if (inStorm){
        if(isSheltered){
            addLog("Blizzard roared overhead, but your tent held firm!(0 Storm Damage)");
        } else {
            state.oxygen -=1;
            addLog("CAUGHT IN WHITEOUT! Freezing winds drained -1 Oxygen");
        }
    }
}
initGame();