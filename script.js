let cast = [];
let tribes = { A: [], B: [], Merged: [] };
let episode = 1;

// MERGE RULES
let merged = false;
let mergeAt = Math.floor(Math.random() * 4) + 8; // 8–11 players
let minMergeEpisode = 4 + Math.floor(Math.random() * 2); // episode 4 or 5

// RELATIONSHIPS + STATS + EPISODE RESULTS
let relationships = {};
let stats = {};
let episodeResults = [];

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
                relationships[p][o] = 40 + Math.floor(Math.random() * 20);
            }
        });
    });
}

function initStats(players) {
    players.forEach(p => {
        stats[p] = {
            tribeHistory: [],
            immunityWins: 0,
            votesReceived: 0,
            votesCast: [],
            placement: null
        };
    });
}

function recordTribeHistory() {
    [...tribes.A, ...tribes.B, ...tribes.Merged].forEach(p => {
        if (tribes.A.includes(p)) stats[p].tribeHistory.push("A");
        else if (tribes.B.includes(p)) stats[p].tribeHistory.push("B");
        else stats[p].tribeHistory.push("Merged");
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

function showTrackRecord() {
    let html = `<h2>Season Track Record</h2>`;

    const totalEpisodes = episodeResults.length;

    html += `<table border="1" cellpadding="6" style="margin:auto; border-collapse:collapse;">`;

    // HEADER ROW 1
    html += `<tr>
                <th rowspan="2">Rank</th>
                <th rowspan="2">Contestant</th>`;

    for (let i = 1; i <= totalEpisodes; i++) {
        html += `<th>Ep. ${i}</th>`;
    }

    html += `</tr>`;

    // HEADER ROW 2 (MERGED PHASE CELLS)
    html += `<tr>`;

    let i = 0;
    while (i < episodeResults.length) {
        let phase = episodeResults[i].phase;
        let span = 1;

        while (
            i + span < episodeResults.length &&
            episodeResults[i + span].phase === phase
        ) {
            span++;
        }

        html += `<td colspan="${span}" style="background:#ddd; font-weight:bold;">${phase}</td>`;
        i += span;
    }

    html += `</tr>`;

    // BODY ROWS
    const sortedPlayers = Object.keys(stats).sort((a, b) => stats[a].placement - stats[b].placement);

    sortedPlayers.forEach(player => {
        html += `<tr>
                    <td>${stats[player].placement}</td>
                    <td>${player}</td>`;

        episodeResults.forEach(ep => {
            let result = ep.results[player] || "";

            // Color coding
            let bg = "#dddddd"; // blank = grey
            if (result === "OUT") bg = "#ff9999";        // red
            if (result === "IMM") bg = "#99ff99";        // bright green
            if (result === "TIMM") bg = "#66cc66";       // darker green
            if (result === "SAFE") bg = "white";         // white

            let display = result === "TIMM" ? "IMM" : result;

            html += `<td style="background:${bg};">${display}</td>`;
        });

        html += `</tr>`;
    });

    html += `</table>`;

    document.getElementById("log").innerHTML += html;
}

function runEpisode() {
    let html = `<h3>Episode ${episode}</h3>`;

    recordTribeHistory();

    const remaining = [...tribes.A, ...tribes.B, ...tribes.Merged];

    // MERGE CHECK
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
        stats[immune].immunityWins++;
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
    let eliminated;

    if (voters.length === 1) {
        eliminated = voters[0];
        html += `<p>${eliminated} is automatically eliminated.</p>`;
        stats[eliminated].placement = remaining.length;

        if (merged) tribes.Merged = [];
        else tribes[losingTribe] = [];
    } else {
        let votes = {};

        voters.forEach(voter => {
            let choices = voters.filter(p => p !== voter && p !== immune);
            let voteFor = choices[Math.floor(Math.random() * choices.length)];
            votes[voter] = voteFor;
            stats[voter].votesCast.push(voteFor);
        });

        html += `<p><strong>Votes:</strong></p>`;
        for (const [voter, target] of Object.entries(votes)) {
            html += `<p>${voter} voted for ${target}</p>`;
        }

        let tally = {};
        Object.values(votes).forEach(target => {
            tally[target] = (tally[target] || 0) + 1;
        });

        eliminated = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
        html += `<p><strong>${eliminated} is voted out.</strong></p>`;

        stats[eliminated].votesReceived += tally[eliminated];
        stats[eliminated].placement = remaining.length;

        if (merged) {
            tribes.Merged = voters.filter(p => p !== eliminated);
        } else {
            tribes[losingTribe] = voters.filter(p => p !== eliminated);
        }
    }

    // RECORD EPISODE RESULTS
    let epData = { phase: merged ? "Merge" : "Pre-Merge", results: {} };

    remaining.forEach(p => {
        if (p === immune) {
            epData.results[p] = "IMM"; // individual immunity
        } else if (!merged && tribes[losingTribe] && !tribes[losingTribe].includes(p)) {
            epData.results[p] = "TIMM"; // tribal immunity
        } else {
            epData.results[p] = "SAFE";
        }
    });

    if (eliminated) epData.results[eliminated] = "OUT";

    episodeResults.push(epData);

    // WINNER CHECK
    const finalRemaining = [...tribes.A, ...tribes.B, ...tribes.Merged];
    if (finalRemaining.length === 1) {
        const winner = finalRemaining[0];
        stats[winner].placement = 1;

        html += `<h2>${winner} wins Survivor!</h2>`;
        setLog(html);

        showTrackRecord();

        document.getElementById("nextEpisodeBtn").disabled = true;
        return;
    }

    setLog(html);
    episode++;
}

document.getElementById("startBtn").onclick = () => {
    const input = document.getElementById("castInput").value.trim();
    cast = input.split("\n").map(x => x.trim()).filter(x => x.length > 0);

    assignTribes();
    initRelationships(cast);
    initStats(cast);

    document.getElementById("setup").style.display = "none";
    document.getElementById("game").style.display = "block";

    setLog(`
        <h3>Season Begins!</h3>
        <p><strong>Tribe A:</strong> ${tribes.A.join(", ")}</p>
        <p><strong>Tribe B:</strong> ${tribes.B.join(", ")}</p>
    `);
};

document.getElementById("nextEpisodeBtn").onclick = runEpisode;
