let cast = [];
let tribes = { A: [], B: [] };
let episode = 1;

function setLog(text) {
    const logDiv = document.getElementById("log");
    logDiv.innerHTML = text; // replaces instead of appending
}

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function assignTribes() {
    const shuffled = shuffle([...cast]);
    const half = Math.ceil(shuffled.length / 2);
    tribes.A = shuffled.slice(0, half);
    tribes.B = shuffled.slice(half);
}

function randomEvent(tribeMembers) {
    if (tribeMembers.length < 2) {
        return `${tribeMembers[0]} spends the day alone.`;
    }

    const p1 = tribeMembers[Math.floor(Math.random() * tribeMembers.length)];
    let p2 = p1;
    while (p2 === p1) {
        p2 = tribeMembers[Math.floor(Math.random() * tribeMembers.length)];
    }

    const events = [
        `${p1} and ${p2} bond over camp life.`,
        `${p1} annoys ${p2} with their attitude.`,
        `${p1} finds some extra food.`,
        `${p1} and ${p2} argue about strategy.`,
        `${p1} takes a nap instead of working.`,
    ];

    return events[Math.floor(Math.random() * events.length)];
}

function runEpisode() {
    let logText = `<h3>Episode ${episode}</h3>`;

    // 1. Immunity
    const winningTribe = Math.random() < 0.5 ? "A" : "B";
    const losingTribe = winningTribe === "A" ? "B" : "A";

    logText += `<p><strong>Immunity Challenge:</strong> Tribe ${winningTribe} wins immunity!</p>`;

    // 2. Post-challenge events
    logText += `<h4>Post-Challenge Events</h4>`;
    logText += `<p>${randomEvent(tribes.A)}</p>`;
    logText += `<p>${randomEvent(tribes.B)}</p>`;

    // 3. Tribal Council
    const tribeMembers = tribes[losingTribe];

    logText += `<h4>Tribal Council (${losingTribe})</h4>`;

    if (tribeMembers.length === 1) {
        // Auto-eliminate
        const eliminated = tribeMembers[0];
        logText += `<p>${eliminated} is automatically eliminated.</p>`;
        tribes[losingTribe] = [];
    } else {
        // Voting
        let votes = {};
        tribeMembers.forEach(voter => {
            let voteFor = voter;
            while (voteFor === voter) {
                voteFor = tribeMembers[Math.floor(Math.random() * tribeMembers.length)];
            }
            votes[voter] = voteFor;
        });

        // Display votes
        logText += `<p><strong>Votes:</strong></p>`;
        Object.entries(votes).forEach(([voter, target]) => {
            logText += `<p>${voter} voted for ${target}</p>`;
        });

        // Count votes
        let tally = {};
        Object.values(votes).forEach(target => {
            tally[target] = (tally[target] || 0) + 1;
        });

        // Find highest vote-getter
        let eliminated = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
        logText += `<p><strong>${eliminated} is voted out.</strong></p>`;

        // Remove from tribe
        tribes[losingTribe] = tribeMembers.filter(p => p !== eliminated);
    }

    // 4. Check for winner
    const remaining = [...tribes.A, ...tribes.B];
    if (remaining.length === 1) {
        logText += `<h2>${remaining[0]} wins Survivor!</h2>`;
        document.getElementById("nextEpisodeBtn").disabled = true;
    }

    setLog(logText);
    episode++;
}

document.getElementById("startBtn").onclick = () => {
    const input = document.getElementById("castInput").value.trim();
    cast = input.split("\n").map(x => x.trim()).filter(x => x.length > 0);

    if (cast.length < 2) {
        alert("Enter at least 2 castaways.");
        return;
    }

    assignTribes();

    document.getElementById("setup").style.display = "none";
    document.getElementById("game").style.display = "block";

    setLog(`
        <h3>Season Begins!</h3>
        <p><strong>Tribe A:</strong> ${tribes.A.join(", ")}</p>
        <p><strong>Tribe B:</strong> ${tribes.B.join(", ")}</p>
    `);
};

document.getElementById("nextEpisodeBtn").onclick = runEpisode;
