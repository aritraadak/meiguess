// script.js — reverse guessing with improved performance & UI safety

let allNumbers = []; // full search space (5040 entries)
let possibilities = []; // current remaining possibilities
let guess = null;
let attempts = 0;

document.addEventListener("DOMContentLoaded", () => {
    // wire up buttons
    document.getElementById("startBtn").addEventListener("click", startGame);
    document.getElementById("submitBtn").addEventListener("click", submitFeedback);
    document.getElementById("restartBtn").addEventListener("click", restartGame);
    // prepare allNumbers now
    allNumbers = generateAllNumbers();
});

function generateAllNumbers() {
    const nums = [];
    for (let a = 0; a <= 9; a++) {
        for (let b = 0; b <= 9; b++) {
            if (b === a) continue;
            for (let c = 0; c <= 9; c++) {
                if (c === a || c === b) continue;
                for (let d = 0; d <= 9; d++) {
                    if (d === a || d === b || d === c) continue;
                    nums.push([a, b, c, d]);
                }
            }
        }
    }
    return nums;
}

function compareNumbers(guessArr, secretArr) {
    let positionsMatched = 0;
    let digitsMatched = 0;

    for (let i = 0; i < 4; i++) {
        if (guessArr[i] === secretArr[i]) positionsMatched++;
    }
    // count each guess digit at most once (presence)
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (guessArr[i] === secretArr[j]) {
                digitsMatched++;
                break;
            }
        }
    }
    return { digitsMatched, positionsMatched };
}

function formatNumber(arr) {
    return arr.join('');
}

function startGame() {
    possibilities = allNumbers.slice();
    attempts = 0;
    guess = null;
    document.getElementById("startBtn").style.display = "none";
    document.getElementById("feedbackForm").style.display = "block";
    document.getElementById("digitsMatched").value = "";
    document.getElementById("positionsMatched").value = "";
    document.getElementById("note").innerText = "aritraadak.07@gmail.com";
    // first guess: quick fixed guess to avoid heavy first computation
    // choose a reasonable first try that uses 4 distinct digits including 0
    guess = [0, 1, 2, 3];
    attempts = 1;
    document.getElementById("guessDisplay").innerText = `My guess (${attempts}) : ${formatNumber(guess)}`;
}

function submitFeedback() {
    const dVal = document.getElementById("digitsMatched").value;
    const pVal = document.getElementById("positionsMatched").value;
    const dMatched = parseInt(dVal, 10);
    const pMatched = parseInt(pVal, 10);

    if (isNaN(dMatched) || isNaN(pMatched)) {
        alert("Enter numeric feedback (0–4).");
        return;
    }
    if (dMatched < 0 || dMatched > 4 || pMatched < 0 || pMatched > 4) {
        alert("Values must be 0–4.");
        return;
    }
    if (pMatched > dMatched) {
        alert("Positions matched can't be greater than digits matched.");
        return;
    }

    // success
    if (pMatched === 4) {
        document.getElementById("guessDisplay").innerText = `🎉 I guessed it ${formatNumber(guess)} in ${attempts} attempts.`;
        document.getElementById("feedbackForm").style.display = "none";
        document.getElementById("note").innerText = "";
        return;
    }

    // Filter possibilities based on the latest guess & feedback
    possibilities = possibilities.filter(num => {
        const r = compareNumbers(guess, num);
        return r.digitsMatched === dMatched && r.positionsMatched === pMatched;
    });

    if (possibilities.length === 0) {
        document.getElementById("guessDisplay").innerText =
            "No possible number fits that feedback — please check for inconsistent feedback.";
        document.getElementById("feedbackForm").style.display = "none";
        document.getElementById("note").innerText = "";
        return;
    }

    // Clear inputs
    document.getElementById("digitsMatched").value = "";
    document.getElementById("positionsMatched").value = "";

    // Let the UI show the "thinking" text, then compute the best guess (non-blocking)
    const display = document.getElementById("guessDisplay");
    display.innerText = `Thinking... remaining possibilities: ${possibilities.length}`;
    document.getElementById("note").innerText = "Computing optimal guess (may take a moment)...";

    // compute in next tick so browser can repaint
    setTimeout(() => {
        // If possibilities are small, compute exact minimax; otherwise sample for speed
        guess = getBestGuessAdaptive();
        attempts++;
        display.innerText = `My guess (${attempts}) : ${formatNumber(guess)}`;
        document.getElementById("note").innerText = "";
    }, 50);
}

// Adaptive best-guess selection (balances optimality vs speed)
function getBestGuessAdaptive() {
    if (possibilities.length === 1) return possibilities[0];

    // if the set is small, do full minimax
    const FULL_MINIMAX_THRESHOLD = 1200; // tweakable
    let candidates = possibilities;

    // If possibilities is very large, sample some candidates to limit computation
    if (possibilities.length > FULL_MINIMAX_THRESHOLD) {
        // sample up to 800 candidates randomly for evaluation
        const SAMPLE_SIZE = 800;
        const sample = [];
        const used = new Set();
        while (sample.length < Math.min(SAMPLE_SIZE, possibilities.length)) {
            const idx = Math.floor(Math.random() * possibilities.length);
            if (!used.has(idx)) {
                used.add(idx);
                sample.push(possibilities[idx]);
            }
        }
        candidates = sample;
    }

    let bestGuess = null;
    let minWorstCase = Infinity;

    // Evaluate each candidate against all remaining possibilities
    for (let cand of candidates) {
        const outcomeCounts = Object.create(null);
        for (let possible of possibilities) {
            const r = compareNumbers(cand, possible);
            const key = `${r.digitsMatched}-${r.positionsMatched}`;
            outcomeCounts[key] = (outcomeCounts[key] || 0) + 1;
        }
        // find worst-case bucket size
        let worst = 0;
        for (let k in outcomeCounts)
            if (outcomeCounts[k] > worst) worst = outcomeCounts[k];

        if (worst < minWorstCase) {
            minWorstCase = worst;
            bestGuess = cand;
            // small optimization: if best possible worst-case is 1 we can't do better
            if (minWorstCase === 1) break;
        }
    }

    // fallback
    return bestGuess || possibilities[0];
}

function restartGame() {
    document.getElementById("startBtn").style.display = "inline-block";
    document.getElementById("feedbackForm").style.display = "none";
    document.getElementById("guessDisplay").innerText = "";
    document.getElementById("digitsMatched").value = "";
    document.getElementById("positionsMatched").value = "";
    document.getElementById("note").innerText = "";
    possibilities = allNumbers.slice();
    guess = null;
    attempts = 0;

}

