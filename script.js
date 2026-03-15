let cast = [];
let tribes = { A: [], B: [], Merged: [] };
let episode = 1;

// MERGE RULES
let merged = false;
let mergeAt = Math.floor(Math.random() * 4) + 8;
let minMergeEpisode = 4 + Math.floor(Math.random() * 2);

// RELATIONSHIPS + STATS + EPISODE RESULTS + PHOTOS
let relationships = {};
let stats = {};
let episodeResults = [];
let photos = {};

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
            placement: null,
            eliminatedEpisode: null
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

function showImage(player) {
    const src = photos[player] || "https://via.placeholder.com/80?text=No+Image";
    return `<img class="contestant-photo" src="${src}" alt="${player}">`;
}

function showImages(playersArray) {
    if (!playersArray || playersArray.length === 0) return "";
    return `<div class="icon-grid">` +
        playersArray.map(p => showImage(p)).join("") +
        `</div>`;
}

function randomEvent(tribe) {
    if (tribe.length < 2) {
        return showImages([tribe[0]]) + `${tribe[0]} spends the day alone.`;
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

    return showImages([p1, p2]) + event.text;
}

function checkMerge() {
    if (merged) return false;

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
                <th rowspan="2">Contestant</th>
                <th rowspan="2">Photo</th>`;

    for (let i = 1; i <= totalEpisodes; i++) {
        html += `<th>Ep. ${i}</th>`;
    }

    html += `</tr>`;

    // HEADER ROW 2 (PHASE CELLS)
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
                    <td>${player}</td>
                    <td>${showImage(player)}</td>`;

        const eliminatedEp = stats[player].eliminatedEpisode; // null for winner

        episodeResults.forEach((ep, index) => {
            const epNum = index + 1;

            // Grey out all episodes AFTER elimination
            if (eliminatedEp && epNum > eliminatedEp) {
                html += `<td style="background:#dddddd;"></td>`;
                return;
            }

            let result = ep.results[player] || "";

            let bg = "white";
            let color = "black";

            if (result === "OUT") bg = "#ff9999";

            if (result === "IMM") {
                // Team vs individual immunity by phase
                if (ep.phase === "Pre-Merge") {
                    bg = "#55cc55"; // darker green for team immunity
                } else {
                    bg = "#99ff99"; // lighter green for individual immunity
                }
            }

            if (result === "SAFE") bg = "white";

            if (result === "TIE") {
                bg = "#ffbb66"; // lighter orange
                color = "black";
            }

            if (result === "TIEBRK") {
                bg = "#cc5500"; // darker orange
                color = "white";
                result = "TIE"; // display text
            }

            html += `<td style="background:${bg}; color:${color};">${result}</td>`;
        });

        html += `</tr>`;
    });

    html += `</table>`;

    document.getElementById("log").innerHTML += html;
}

// ---- TIEBREAKER SYSTEM ----

function runRandomCompetitionTiebreaker(tiedPlayers) {
    const competitions = [
        "Fire-making duel",
        "Endurance challenge",
        "Puzzle showdown",
        "Balance challenge",
        "Dexterity challenge",
        "Memory challenge",
        "Luck-based challenge",
        "Speed challenge",
        "Social duel",
        "Random draw"
    ];

    const type = competitions[Math.floor(Math.random() * competitions.length)];
    const loser = tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];

    let html = "";
    html += showImages(tiedPlayers);
    html += `<p><strong>Tiebreaker Competition:</strong> ${type}!</p>`;
    html += `<p>${loser} loses the tiebreaker and is eliminated.</p>`;

    return { eliminated: loser, log: html };
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
        const winningTribeMembers = winning === "A" ? tribes.A : tribes.B;
        html += showImages(winningTribeMembers) +
            `<p><strong>Immunity Challenge:</strong> Tribe ${winning} wins immunity!</p>`;
    } else {
        immune = remaining[Math.floor(Math.random() * remaining.length)];
        stats[immune].immunityWins++;
        html += showImages([immune]) +
            `<p><strong>Individual Immunity:</strong> ${immune} wins immunity!</p>`;
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
        html += showImages([eliminated]) +
            `<p>${eliminated} is automatically eliminated.</p>`;
        stats[eliminated].placement = remaining.length;
        stats[eliminated].eliminatedEpisode = episode;

        if (merged) tribes.Merged = [];
        else tribes[losingTribe] = [];
    } else {
        // FIRST VOTE
        let votes = {};
        voters.forEach(voter => {
            let choices = voters.filter(p => p !== voter && p !== immune);
            let voteFor = choices[Math.floor(Math.random() * choices.length)];
            votes[voter] = voteFor;
            stats[voter].votesCast.push(voteFor);
        });

        html += `<p><strong>Votes:</strong></p>`;
        for (const [voter, target] of Object.entries(votes)) {
            html += showImages([voter, target]) +
                `<p>${voter} voted for ${target}</p>`;
        }

        let tally = {};
        Object.values(votes).forEach(target => {
            tally[target] = (tally[target] || 0) + 1;
        });

        let maxVotes = Math.max(...Object.values(tally));
        let tied = Object.keys(tally).filter(p => tally[p] === maxVotes);

        let tiedPlayersFirstVote = [...tied];
        let tiedPlayersDeadlock = [];

        if (tied.length === 1) {
            eliminated = tied[0];
            html += showImages([eliminated]) +
                `<p><strong>${eliminated} is voted out.</strong></p>`;
        } else {
            // TIE → REVOTE
            html += `<p><strong>The vote is tied between ${tied.join(", ")}. They will revote.</strong></p>`;

            let revoteVotes = {};
            voters.forEach(voter => {
                let choices = tied.filter(p => p !== voter && p !== immune);
                if (choices.length === 0) {
                    choices = tied.filter(p => p !== immune);
                }
                let voteFor = choices[Math.floor(Math.random() * choices.length)];
                revoteVotes[voter] = voteFor;
            });

            html += `<p><strong>Revote:</strong></p>`;
            for (const [voter, target] of Object.entries(revoteVotes)) {
                html += showImages([voter, target]) +
                    `<p>${voter} voted for ${target}</p>`;
            }

            let revoteTally = {};
            Object.values(revoteVotes).forEach(target => {
                revoteTally[target] = (revoteTally[target] || 0) + 1;
            });

            let revoteMax = Math.max(...Object.values(revoteTally));
            let revoteTied = Object.keys(revoteTally).filter(p => revoteTally[p] === revoteMax);

            tiedPlayersDeadlock = [...revoteTied];

            if (revoteTied.length === 1) {
                eliminated = revoteTied[0];
                html += showImages([eliminated]) +
                    `<p><strong>${eliminated} is voted out after the revote.</strong></p>`;
            } else {
                // DEADLOCK → RANDOM COMPETITION TIEBREAKER
                html += `<p><strong>The revote is still tied. A random tiebreaker competition will decide who goes home.</strong></p>`;
                const tb = runRandomCompetitionTiebreaker(revoteTied);
                eliminated = tb.eliminated;
                html += tb.log;
            }
        }

        stats[eliminated].votesReceived += (tally[eliminated] || 0);
        stats[eliminated].placement = remaining.length;
        stats[eliminated].eliminatedEpisode = episode;

        if (merged) {
            tribes.Merged = voters.filter(p => p !== eliminated);
        } else {
            tribes[losingTribe] = voters.filter(p => p !== eliminated);
        }

        // RECORD EPISODE RESULTS
        let epData = { phase: merged ? "Merge" : "Pre-Merge", results: {} };

        remaining.forEach(p => {
            if (p === eliminated) {
                epData.results[p] = "OUT";
            } else if (p === immune) {
                epData.results[p] = "IMM";
            } else if (!merged && tribes[losingTribe] && !tribes[losingTribe].includes(p)) {
                epData.results[p] = "IMM"; // team immunity
            } else {
                epData.results[p] = "SAFE";
            }
        });

        // Mark TIE survivors
        tiedPlayersFirstVote.forEach(p => {
            if (p !== eliminated) epData.results[p] = "TIE";
        });

        // Mark TIEBRK survivors
        tiedPlayersDeadlock.forEach(p => {
            if (p !== eliminated) epData.results[p] = "TIEBRK";
        });

        episodeResults.push(epData);
    }

    // WINNER CHECK
    const finalRemaining = [...tribes.A, ...tribes.B, ...tribes.Merged];
    if (finalRemaining.length === 1) {
        const winner = finalRemaining[0];
        stats[winner].placement = 1;
        stats[winner].eliminatedEpisode = null;

        html += showImages([winner]) + `<h2>${winner} wins Survivor!</h2>`;
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
    const lines = input.split("\n");

    cast = [];
    photos = {};
    merged = false;
    tribes = { A: [], B: [], Merged: [] };
    episode = 1;
    episodeResults = [];
    relationships = {};
    stats = {};

    lines.forEach(line => {
        let parts = line.split(",");
        let name = parts[0].trim();
        let url = parts[1] ? parts[1].trim() : null;

        if (name.length > 0) {
            cast.push(name);
            photos[name] = url || null;
        }
    });

    // AUTO-MERGE MODE: Start merged if cast < 10
    if (cast.length < 10) {
        merged = true;
        tribes.A = [];
        tribes.B = [];
        tribes.Merged = [...cast];
    } else {
        assignTribes();
    }

    initRelationships(cast);
    initStats(cast);

    document.getElementById("setup").style.display = "none";
    document.getElementById("game").style.display = "block";

    if (merged) {
        setLog(`
            <h3>Season Begins!</h3>
            <p>The game begins at the <strong>Merge</strong> due to a small cast (${cast.length} players).</p>
        `);
    } else {
        setLog(`
            <h3>Season Begins!</h3>
            <p><strong>Tribe A:</strong> ${tribes.A.join(", ")}</p>
            <p><strong>Tribe B:</strong> ${tribes.B.join(", ")}</p>
        `);
    }
};

document.getElementById("nextEpisodeBtn").onclick = runEpisode;
