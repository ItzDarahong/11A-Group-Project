// 1. GLOBAL VARIABLES
let goal = 5;
let currentCount = 0;
let targetSeq = [];
let currentIndex = 0;
let startTime, timerInterval, secondTracker;
let isPlaying = false;
let currentMode = 'blitz';
let currentLabAnswer = 0;
let mistakes = 0;
let timelineData = [];

const pairs = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };

// 2. THEME & NAVIGATION
function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-link').forEach(l => {
        l.classList.remove('active');
        if(l.innerText.toLowerCase() === mode) l.classList.add('active');
    });

    if(mode === 'lab') {
        document.getElementById('blitz-area').classList.add('hidden');
        document.getElementById('lab-area').classList.remove('hidden');
    } else {
        document.getElementById('blitz-area').classList.remove('hidden');
        document.getElementById('lab-area').classList.add('hidden');
    }
    smartRestart();
}

function changeTheme(t) {
    document.body.className = t;
    localStorage.setItem('adn-theme', t);
}

function toggleThemeMenu() {
    const modal = document.getElementById('theme-modal');
    if (modal) modal.classList.toggle('hidden');
}

function setGoal(num) {
    goal = num;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', parseInt(b.innerText) === num));
    smartRestart();
}

// 3. TIMER & GRAPHING
function startTimer() {
    if(!isPlaying) {
        isPlaying = true;
        startTime = Date.now();
        timelineData = [0];
        
        secondTracker = setInterval(() => {
            timelineData.push(currentCount);
        }, 1000);

        timerInterval = setInterval(() => {
            document.getElementById('timer-display').innerText = ((Date.now() - startTime)/1000).toFixed(2) + "s";
        }, 10);
    }
}

function drawGraph() {
    const path = document.getElementById('graph-path');
    if (!path) return;
    let points = "";
    const widthStep = 300 / (timelineData.length - 1 || 1);
    const maxVal = Math.max(...timelineData, 1);

    timelineData.forEach((val, i) => {
        let x = i * widthStep;
        let y = 100 - (val / maxVal * 100);
        points += (i === 0 ? "M " : " L ") + x + " " + y;
    });
    path.setAttribute("d", points);
}

// 4. WIN & RESULTS
function win() {
    clearInterval(timerInterval);
    clearInterval(secondTracker);
    timelineData.push(currentCount);
    drawGraph();

    const finalTime = document.getElementById('timer-display').innerText;
    const totalActions = (currentMode === 'blitz') ? (goal * 4) + mistakes : goal + mistakes;
    const accuracy = Math.max(0, Math.round(((totalActions - mistakes) / totalActions) * 100));

    document.getElementById('res-time').innerText = finalTime;
    document.getElementById('res-acc').innerText = accuracy + "%";
    document.getElementById('res-mode').innerText = currentMode;
    document.getElementById('result-screen').classList.remove('hidden');
}

function closeResults() {
    document.getElementById('result-screen').classList.add('hidden');
    smartRestart();
}

// 5. BLITZ LOGIC
function generate() {
    const bases = ['A', 'T', 'C', 'G'];
    targetSeq = [];
    const container = document.getElementById('sequence-flow');
    if(!container) return;
    container.innerHTML = "";
    for(let i=0; i<4; i++) {
        let b = bases[Math.floor(Math.random()*4)];
        targetSeq.push(b);
        let span = document.createElement('span');
        span.innerText = b;
        span.className = 'char';
        if(i === 0) span.classList.add('active');
        container.appendChild(span);
    }
    currentIndex = 0;
}

// Renamed to handleInput to match your HTML onclick
function handleInput(key) {
    if(currentMode !== 'blitz') return;
    startTimer();
    const expected = pairs[targetSeq[currentIndex]];
    const chars = document.querySelectorAll('.char');

    if(key === expected) {
        chars[currentIndex].classList.add('correct');
        currentIndex++;
        if(currentIndex < targetSeq.length) {
            chars[currentIndex].classList.add('active');
        } else {
            currentCount++;
            document.getElementById('progress').innerText = `${currentCount} / ${goal}`;
            if(currentCount >= goal) win();
            else generate();
        }
    } else {
        mistakes++;
        document.querySelector('.display-container').classList.add('shake');
        setTimeout(() => document.querySelector('.display-container').classList.remove('shake'), 300);
        generate();
    }
}

// 6. LAB LOGIC
function generateLabExercise() {
    const qText = document.getElementById('question-text');
    if(!qText) return;
    const type = Math.floor(Math.random() * 2);
    if (type === 0) {
        let a = Math.floor(Math.random() * 30) + 10;
        currentLabAnswer = 50 - a;
        qText.innerText = `ក្នុងម៉ូលេគុល DNA មួយ បើ (A) ស្មើនឹង ${a}% តើ (C) ស្មើនឹងប៉ុន្មាន?`;
    } else {
        let g = (Math.floor(Math.random() * 20) + 5) * 10;
        currentLabAnswer = g;
        qText.innerText = `ប្រសិនបើ DNA មានបាសកានីន (G) ចំនួន ${g} តើបាសស៊ីតូស៊ីន (C) មានចំនួនប៉ុន្មាន?`;
    }
}

function checkLabAnswer() {
    const input = document.getElementById('lab-answer');
    if(!input) return;
    const val = parseInt(input.value);
    if(val === currentLabAnswer) {
        currentCount++;
        document.getElementById('lab-progress').innerText = `Problem: ${currentCount} / ${goal}`;
        input.value = "";
        if(currentCount >= goal) win();
        else generateLabExercise();
    } else {
        mistakes++;
        document.querySelector('.lab-card').classList.add('shake');
        setTimeout(() => document.querySelector('.lab-card').classList.remove('shake'), 300);
        input.value = "";
    }
}

// 7. SHARED UTILS
function smartRestart() {
    isPlaying = false;
    currentCount = 0;
    currentIndex = 0;
    mistakes = 0;
    timelineData = [];
    clearInterval(timerInterval);
    clearInterval(secondTracker);
    document.getElementById('timer-display').innerText = "0.00s";
    
    const prog = document.getElementById('progress');
    const lProg = document.getElementById('lab-progress');
    if(prog) prog.innerText = `0 / ${goal}`;
    if(lProg) lProg.innerText = `Problem: 0 / ${goal}`;
    
    const labInput = document.getElementById('lab-answer');
    if(labInput) labInput.value = "";
    
    generate();
    generateLabExercise();
}

function smartForfeit() { if(confirm("បោះបង់?")) smartRestart(); }

// 8. INITIALIZERS
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('adn-theme') || 'theme-dark';
    changeTheme(savedTheme);
    
    const themeSelect = document.getElementById('theme-select');
    if(themeSelect) themeSelect.value = savedTheme;

    smartRestart();

    // Key Listeners
    document.addEventListener('keydown', e => {
        if(currentMode === 'blitz') {
            const k = e.key.toUpperCase();
            if(['A','T','C','G'].includes(k)) handleInput(k);
        } else if (e.key === 'Enter') {
            checkLabAnswer();
        }
    });
});
