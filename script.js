let cast = [];
let tribes = { A: [], B: [], Merged: [] };
let episode = 1;

// MERGE RULES
let merged = false;
let mergeAt = Math.floor(Math.random() * 4) + 8; // 8–11 players
let minMergeEpisode = 4 + Math.floor(Math.random() * 2); // episode 4 or 5

// RELATIONSHIPS
let relationships = {}; // relationships[player][other] = score

function setLog(html) {
    document.getElementById("log").innerHTML = html;
}

function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

function initRelationships(players) {
    players.forEach(p => {
        relationships[p] = {};
        players.forEach(o => {
            if (p !== o) {
                relationships[p][o] = 40 + Math.floor(Math.random() * 20); // 40–60
            }
        });
    });
}

function adjustRelationship(a, b, amount) {
    relationships[a][b] = Math.max(0, Math.min(100, relationships[a][b] + amount));
    relationships[b][a] = Math.max(0, Math.min(100, relationships[b][a] + amount));
}

function assignTribes() {
    const shuffled = shuffle([...cast]);
    const half = Math.ceil(shuffled.length / 2);
    tribes.A = shuffled.slice(0, half);
    tribes.B = shuffled.slice(half);
}

function randomEvent(tribe) {
    if (tribe.length < 2) {
        return `${tribe[0]} spends the day alone.`;
    }

    const p1 = tribe[Math.floor(Math.random() * tribe.length)];
    let p2 = p1;
    while (p2 === p1) {
        p2 = tribe[Math.floor(Math.random() * tribe.length)];
    }

    const events = [
        { text: `${p1} and ${p2} bond over camp life.`, change: +10 },
        { text: `${p1} annoys ${p2} with their attitude.`, change: -10 },
        { text: `${p1} finds some extra food.`, change: +5 },
        { text: `${p1} and ${p2} argue about strategy.`, change: -8 },
        { text: `${p1} takes a nap instead of working.`, change: 0 }
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    adjustRelationship(p1, p2, event.change);
    return event.text;
}

function checkMerge() {
    const remaining = [...tribes.A, ...tribes.B];

    if (!merged &&
        remaining.length <= mergeAt &&
        episode >= minMergeEpisode) {

        merged = true;
        tribes.Merged = remaining;
        tribes.A = [];
        tribes.B = [];
        return true;
    }

    return false;
}

function runEpisode() {
    let html = `<h3>Episode ${episode}</h3>`;

    const remaining = [...tribes.A, ...tribes.B, ...tribes.Merged];

    // MERGE CHECK (but continue episode)
    if (checkMerge()) {
        html += `<h2>Merge!</h2>`;
        html += `<p>The tribes merge into one group.</p>`;
    }

    // IMMUNITY
    let immune = null;
    let losingTribe = null;

    if (!merged) {
        const winning = Math.random() < 0.5 ? "A" : "B";
        losingTribe = winning === "A" ? "B" : "A";
        html += `<p><strong>Immunity Challenge:</strong> Tribe ${winning} wins immunity!</p>`;
    } else {
        immune = remaining[Math.floor(Math.random() * remaining.length)];
        html += `<p><strong>Individual Immunity:</strong> ${immune} wins immunity!</p>`;
    }

    // EVENTS
    html += `<h4>Post-Challenge Events</h4>`;
    if (!merged) {
        html += `<p>${randomEvent(tribes.A)}</p>`;
        html += `<p>${randomEvent(tribes.B)}</p>`;
    } else {
        html += `<p>${randomEvent(remaining)}</p>`;
        html += `<p>${randomEvent(remaining)}</p>`;
    }

    // TRIBAL COUNCIL
    html += `<h4>Tribal Council</h4>`;

    let voters = merged ? remaining : tribes[losingTribe];

    if (voters.length === 1) {
        const eliminated = voters[0];
        html += `<p>${eliminated} is automatically eliminated.</p>`;
        if (merged) tribes.Merged = [];
        else tribes[losingTribe] = [];
    } else {
        let votes = {};

        voters.forEach(voter => {
            let choices = voters.filter(p => p !== voter && p !== immune);
            let voteFor = choices[Math.floor(Math.random() * choices.length)];
            votes[voter] = voteFor;
        });

        html += `<p><strong>Votes:</strong></p>`;
        for (const [voter, target] of Object.entries(votes)) {
            html += `<p>${voter} voted for ${target}</p>`;
        }

        let tally = {};
        Object.values(votes).forEach(target => {
            tally[target] = (tally[target] || 0) + 1;
        });

        const eliminated = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
        html += `<p><strong>${eliminated} is voted out.</strong></p>`;

        if (merged) {
            tribes.Merged = voters.filter(p => p !== eliminated);
        } else {
            tribes[losingTribe] = voters.filter(p => p !== eliminated);
        }
    }

    // WINNER CHECK
    const finalRemaining = [...tribes.A, ...tribes.B, ...tribes.Merged];
    if (finalRemaining.length === 1) {
        html += `<h2>${finalRemaining[0]} wins Survivor!</h2>`;
        document.getElementById("nextEpisodeBtn").disabled = true;
    }

    setLog(html);
    episode++;
}

document.getElementById("startBtn").onclick = () => {
    const input = document.getElementById("castInput").value.trim();
    cast = input.split("\n").map(x => x.trim()).filter(x => x.length > 0);

    assignTribes();
    initRelationships(cast);

    document.getElementById("setup").style.display = "none";
    document.getElementById("game").style.display = "block";

    setLog(`
        <h3>Season Begins!</h3>
        <p><strong>Tribe A:</strong> ${tribes.A.join(", ")}</p>
        <p><strong>Tribe B:</strong> ${tribes.B.join(", ")}</p>
    `);
};

document.getElementById("nextEpisodeBtn").onclick = runEpisode;
