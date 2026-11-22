const PEAKS = [
    {
        id: "PEAK_01",
        name: "FROSTBITE RIDGE",
        baseElevation: 4200,
        summitElevation: 8848,
        startPos: {x : 3, y : 8},
        rations: 14,
        maxRations: 16,
        oxygen: 12,
        maxOxygen: 14,
        pitons: 4,
        maxPitons: 5,
        blizzardRows: [2,6],
        map: [
            [3, 3, 3, 9, 3, 3, 3],
            [3, 0, 2, 1, 2, 0, 3],
            [0, 1, 3, 2, 3, 1, 4],
            [0, 2, 1, 0, 1, 2, 0],
            [0, 2, 4, 0, 1, 2, 0],
            [4, 0, 3, 1, 3, 0, 0],
            [1, 1, 0, 2, 0, 1, 1],
            [0, 4, 1, 0, 1, 3, 0],
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
        rations: 13,
        maxRations: 15,
        oxygen: 11,
        maxOxygen: 12,
        pitons: 3,
        maxPitons: 4,
        blizzardRows: [1,4,7],
        map:[
            [3, 3, 3, 9, 3, 3, 3],
            [3, 1, 2, 1, 2, 1, 3],
            [4, 0, 3, 0, 3, 0, 4],
            [0, 2, 1, 0, 1, 2, 0],
            [3, 1, 3, 2, 3, 1, 3],
            [0, 0, 4, 0, 1, 0, 0],
            [0, 2, 3, 0, 3, 2, 0],
            [4, 0, 0, 2, 0, 1, 4],
            [3, 0, 1, 0, 1, 0, 3],
            [3, 3, 0, 0, 0, 3, 3]
        ]
    },
    {
        id: "PEAK 03",
        name: "DEATH ZONE",
        baseElevation: 6200,
        summitElevation: 8849,
        startPos: { x: 3, y: 9},
        rations: 12,
        maxRations: 14,
        oxygen: 12,
        maxOxygen: 14,
        pitons: 2,
        maxPitons: 2,
        blizzardRows: [1, 4, 7],
        map: [
            [3, 3, 3, 9, 3, 3, 3],
            [3, 2, 0, 2, 0, 2, 3],
            [4, 0, 3, 1, 3, 0, 1],
            [0, 2, 1, 0, 4, 2, 0],
            [3, 0, 3, 1, 3, 0, 3],
            [4, 0, 1, 0, 1, 0, 1],
            [0, 2, 3, 1, 3, 2, 0],
            [1, 1, 0, 2, 0, 0, 4],
            [3, 0, 1, 0, 1, 1, 3],
            [3, 3, 0, 0, 0, 3, 3]
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
const MAX_LOG_ENTRIES = 30;
const SoundFX = (()=>{
    let ctx = null;
    let muted = false;
    function getContext(){
        if (!ctx){
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            ctx = new AudioCtx();
        }
        if (ctx.state === "suspended"){
            ctx.resume();
        }
        return ctx;
    }
    function playTone(freq, duration, type="sine", volume = 0.12, endFreq = null, delay = 0){
        if (muted) return;
        const audioCtx = getContext();
        const now = audioCtx.currentTime + delay;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (endFreq){
            osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
        }
        gain.gain.setValueAtTime(0.001,now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001,now+duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now+duration+0.02);
    }
    function playNoise(duration, filterFreq = 800, volume = 0.08){
        if (muted) return;
        const audioCtx = getContext();
        const now = audioCtx.currentTime;
        const bufferSize = Math.floor(audioCtx.sampleRate * duration);
        const buffer = audioCtx.createBuffer(1,bufferSize,audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i=0; i<bufferSize;i++){
            data[i] = Math.random()*2-1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(filterFreq,now);
        filter.Q.setValueAtTime(2.5,now);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.001,now);
        gain.gain.linearRampToValueAtTime(volume,now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001,now+duration);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noise.start(now);
        noise.stop(now+duration+0.02);
    }
    return{
        toggleMute(){
            muted = !muted;
            return muted;
        },
        isMuted(){
            return muted;
        },
        stepSnow(){
            playNoise(0.09,1100,0.06);
            playTone(190,0.07,"triangle",0.08,130);
        },
        stepRidge(){
            playNoise(0.14,700,0.09);
            playTone(150,0.12,"sawtooth",0.07,95);
        },
        icePiton(){
            playTone(980, 0.08, "square",0.09,620);
            playTone(1420,0.14,"triangle",0.08,880,0.05);
        },
        blocked(){
            playTone(130,0.12,"sawtooth",0.09,85);
        },
        cache(){
            playTone(523,0.1,"triangle",0.11,null,0);
            playTone(659.25,0.1,"triangle",0.11,null,0.08);
            playTone(784,0.18,"triangle",0.12,null,0.16);
        },
        tent(){
            playNoise(0.28,500,0.05);
            playTone(260,0.22,"sine",0.09,340,0.04);
        },
        blizzardHit(){
            playNoise(0.45,420,0.14);
            playTone(220,0.35,"sawtooth",0.09,110);
        },
        blizzardSheltered(){
            playNoise(0.32,320,0.07);
        },
        summit(){
            const notes = [523,659,784,1046.5];
            notes.forEach((n,idx)=>{
                playTone(n, 0.22,"triangle",0.12,null,idx*0.11);
            });
        },
        gameOver(){
            playTone(240,0.22,"sawtooth",0.1,180,0);
            playTone(175,0.35,"sawtooth",0.1,95,0.18);
        }
    };
})();
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
        maxRations: peak.maxRations,
        oxygen: peak.oxygen,
        maxOxygen: peak.maxOxygen,
        pitons: peak.pitons,
        maxPitons: peak.maxPitons,
        blizzardRows: [...peak.blizzardRows],
        gameOver: false
    };
    if (subtitleEl){
        subtitleEl.textContent = `${peak.id}: ${peak.name}`;
    }
    if (peakSelectEl){
        peakSelectEl.value = String(currentPeakIndex);
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
    while (logEl.children.length > MAX_LOG_ENTRIES){
        logEl.lastElementChild.remove();
    }
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
        triggerBlockedFeedback();
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
        triggerBlockedFeedback();
        return;
    }
    if (state.pitons < pitonCost){
        addLog("Need a climbing piton to scale that ice wall!");
        triggerBlockedFeedback();
        return;
    }
    state.player.x = targetX;
    state.player.y = targetY;
    state.rations -= rationCost;
    state.pitons -= pitonCost;
    state.oxygen -=1;
    state.turn +=1;
    if (tile === 4){
        SoundFX.cache();
        const prevRations = state.rations;
        const prevOxygen = state.oxygen;
        const prevPitons = state.pitons;
        state.rations = Math.min(state.maxRations, state.rations+4);
        state.oxygen = Math.min(state.maxOxygen, state.oxygen +3);
        state.pitons = Math.min(state.maxPitons, state.pitons+1);
        state.grid[targetY][targetX] = 0;
        const gainRations = state.rations - prevRations;
        const gainOxygen = state.oxygen - prevOxygen;
        const gainPitons = state.pitons - prevPitons;
        addLog(`Supply cache recovered! (+${gainRations} Rations, +${gainOxygen} O2, +${gainPitons} Piton)`);
    } else if (tile === 2){
        SoundFX.icePiton();
        addLog("Anchored piton and scaled ice wall.");
    } else if (tile === 1){
        SoundFX.stepRidge();
        addLog("Traversed steep ridge (-2 Rations).");
    } else{
        SoundFX.stepSnow();
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
        triggerBlockedFeedback();
        addLog("Not enough rations to make camp.");
        return;
    }
    const prevOxygen = state.oxygen;
    state.rations -=1;
    state.oxygen = Math.min(state.maxOxygen, state.oxygen+2);
    state.turn +=1;
    const gainedOxygen = state.oxygen - prevOxygen;
    addLog(`Pitched tent. Recovered +${gainedOxygen} Oxygen (-1 Ration)`);
    SoundFX.tent();
    advanceBlizzards(true);
    checkEndConditions();
    render();
}
function checkEndConditions(){
    const currentTile = state.grid[state.player.y][state.player.x];
    if (currentTile === 9){
        SoundFX.summit();
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
        SoundFX.gameOver();
        state.gameOver = true;
        showModal("HYPOXIA CRITICAL", "Your oxygen reserves ran dry before reaching the peak.");
        return;
    }
    if (state.rations <= 0){
        SoundFX.gameOver();
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
    rationsEl.textContent = `${state.rations} / ${state.maxRations}`;
    oxygenEl.textContent = `${state.oxygen} / ${state.maxOxygen}`;
    pitonsEl.textContent = `${state.pitons} / ${state.maxPitons}`;
    rationsEl.classList.toggle("stat-critical",state.rations <=2);
    rationsEl.classList.toggle("stat-warn",state.rations > 2 && state.rations <=4);
    oxygenEl.classList.toggle("stat-critical",state.oxygen<=2);
    oxygenEl.classList.toggle("stat-warn", state.oxygen > 2 && state.oxygen <=4);
    pitonsEl.classList.toggle("stat-critical",state.pitons === 0);
    pitonsEl.classList.toggle("stat-warn",state.pitons === 1);
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
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)){
        e.preventDefault();
    }
    if (e.key === "r" || e.key === "R"){
        initGame(currentPeakIndex);
        return;
    }
    if (e.key === "t" || e.key === "T" || e.key === " "){
        pitchTent();
        return;
    }
    if (!state.player) return;
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
const muteBtn = document.getElementById("btn-mute");
if (muteBtn){
    muteBtn.addEventListener("click",()=>{
        const isMuted = SoundFX.toggleMute();
        muteBtn.textContent = isMuted ? "AUDIO: OFF" : "AUDIO: ON";
    });
}
document.getElementById("btn-tent").addEventListener("click",pitchTent);
document.getElementById("btn-restart").addEventListener("click", ()=>initGame(currentPeakIndex));
document.getElementById("btn-modal-restart").addEventListener("click",()=> initGame(currentPeakIndex));
function getNextRow(row){
    return row >= state.rows - 1 ? 1:row+1;
}
function advanceBlizzards(isSheltered){
    const nextRows = [...new Set(state.blizzardRows.map(getNextRow))];
    state.blizzardRows = nextRows;
    const inStorm = state.blizzardRows.includes(state.player.y);
    if (inStorm){
        if(isSheltered){
            SoundFX.blizzardSheltered();
            addLog("Blizzard roared overhead, but your tent held firm!(0 Storm Damage)");
        } else {
            SoundFX.blizzardHit();
            state.oxygen -=1;
            addLog("CAUGHT IN WHITEOUT! Freezing winds drained -1 Oxygen");
        }
    }
}
function triggerBlockedFeedback(){
    SoundFX.blocked();
    if (!gridEl) return;
    gridEl.classList.remove("grid-shake");
    void gridEl.offsetWidth;
    gridEl.classList.add("grid-shake");
}
initGame();