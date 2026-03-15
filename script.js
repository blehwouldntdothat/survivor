let cast = [];
let tribes = { A: [], B: [] };
let episode = 1;

function setLog(html) {
    document.getElementById("log").innerHTML = html;
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
        `${p1} and ${p2} bond over camp life.`,
        `${p1} annoys ${p2} with their attitude.`,
        `${p1} finds some extra food.`,
        `${p1} and ${p2} argue about strategy.`,
        `${p1} takes a nap instead of working.`,
    ];

    return events[Math.floor(Math.random() * events.length)];
}

function runEpisode() {
    let html = `<h3>Episode ${episode}</h3>`;

    // IMMUNITY
    const winning = Math.random() < 0.5 ? "A" : "B";
    const losing = winning === "A" ? "B" : "A";

    html += `<p><strong>Immunity Challenge:</strong> Tribe ${winning} wins immunity!</p>`;

    // POST-CHALLENGE EVENTS
    html += `<h4>Post-Challenge Events</h4>`;
    html += `<p>${randomEvent(tribes.A)}</p>`;
    html += `<p>${randomEvent(tribes.B)}</p>`;

    // TRIBAL COUNCIL
    html += `<h4>Tribal Council (${losing})</h4>`;
    const tribe = tribes[losing];

    if (tribe.length === 1) {
        const eliminated = tribe[0];
        html += `<p>${eliminated} is automatically eliminated.</p>`;
        tribes[losing] = [];
    } else {
        let votes = {};

        tribe.forEach(voter => {
            let voteFor = voter;
            while (voteFor === voter) {
                voteFor = tribe[Math.floor(Math.random() * tribe.length)];
            }
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

        tribes[losing] = tribe.filter(p => p !== eliminated);
    }

    // WINNER CHECK
    const remaining = [...tribes.A, ...tribes.B];
    if (remaining.length === 1) {
        html += `<h2>${remaining[0]} wins Survivor!</h2>`;
        document.getElementById("nextEpisodeBtn").disabled = true;
    }

    setLog(html);
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
