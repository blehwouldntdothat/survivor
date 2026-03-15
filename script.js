/* ============================================================
   GLOBALS
   ============================================================ */

let cast = [];
let tribes = { A: [], B: [], Merged: [] };
let episode = 1;

// MERGE RULES
let merged = false;
let mergeAt = Math.floor(Math.random() * 4) + 8;
let minMergeEpisode = 4 + Math.floor(Math.random() * 2);

// RELATIONSHIPS + STATS + EPISODE RESULTS + PHOTOS + JURY + FINALE
let relationships = {};
let stats = {};
let episodeResults = [];
let photos = {};
let jury = [];
let finaleSize = null;
let finaleFinalists = [];
let finaleWinner = null;

// SETTINGS
let finaleSetting = "random";

/* ============================================================
   BASIC HELPERS
   ============================================================ */

function setLog(html) {
    document.getElementById("log").innerHTML = html;
}

function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
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

/* ============================================================
   RELATIONSHIPS + STATS
   ============================================================ */

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
            eliminatedEpisode: null,

            physical: 3,
            endurance: 3,
            mental: 3,
            social: 3,
            temperament: 3,
            luck: 3,
            strategy: 3,
            loyalty: 3,

            votedForWinner: null
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

/* ============================================================
   TRIBE ASSIGNMENT
   ============================================================ */

function assignTribes() {
    const shuffled = shuffle([...cast]);
    const half = Math.ceil(shuffled.length / 2);
    tribes.A = shuffled.slice(0, half);
    tribes.B = shuffled.slice(half);
}

/* ============================================================
   EVENTS (from events.js)
   ============================================================ */

function runEvent(tribe) {
    const size = tribe.length;

    const possible = EVENTS.filter(e =>
        (typeof e.players === "number" && e.players <= size) ||
        e.players === "tribe"
    );

    if (possible.length === 0) return "";

    const event = possible[Math.floor(Math.random() * possible.length)];

    let chosenPlayers;

    if (event.players === "tribe") {
        chosenPlayers = [...tribe];
    } else {
        chosenPlayers = shuffle([...tribe]).slice(0, event.players);
    }

    event.change.forEach(([a, b, amount]) => {
        adjustRelationship(chosenPlayers[a], chosenPlayers[b], amount);
    });

    return showImages(chosenPlayers) + event.text(chosenPlayers);
}

/* ============================================================
   CHALLENGES (from challenges.js)
   ============================================================ */

function getRandomChallenge(type) {
    const pool = CHALLENGES.filter(c => c.type === type);
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

function computePlayerScore(player, weights) {
    let score = 0;
    for (const key in weights) {
        if (stats[player][key] !== undefined) {
            score += stats[player][key] * weights[key];
        }
    }
    score += stats[player].luck * 0.2;
    return score;
}

function computeTribeScore(tribePlayers, weights) {
    if (!tribePlayers || tribePlayers.length === 0) return 0;
    let total = 0;
    tribePlayers.forEach(p => {
        total += computePlayerScore(p, weights);
    });
    return total / tribePlayers.length;
}

/* ============================================================
   TIEBREAKERS (from tiebreakers.js)
   ============================================================ */

function getRandomTiebreaker() {
    if (!TIEBREAKERS || TIEBREAKERS.length === 0) return null;
    return TIEBREAKERS[Math.floor(Math.random() * TIEBREAKERS.length)];
}

/* ============================================================
   TRACK RECORD
   ============================================================ */

function showTrackRecord() {
    let html = `<h2>Season Track Record</h2>`;

    const totalEpisodes = episodeResults.length;

    html += `<table border="1" cellpadding="6" style="margin:auto; border-collapse:collapse;">`;

    html += `<tr>
                <th rowspan="2">Rank</th>
                <th rowspan="2">Contestant</th>
                <th rowspan="2">Photo</th>`;

    for (let i = 1; i <= totalEpisodes; i++) {
        html += `<th>Ep. ${i}</th>`;
    }

    html += `<th>Ep. ${episode}</th>`;
    html += `</tr>`;

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

    html += `<td style="background:#ddd; font-weight:bold;">Final</td>`;
    html += `</tr>`;

    const sortedPlayers = Object.keys(stats).sort((a, b) => stats[a].placement - stats[b].placement);

    let runnerUps = [];
    if (finaleFinalists.length > 0 && finaleWinner) {
        runnerUps = finaleFinalists.filter(p => p !== finaleWinner);
    }
    let printedSecondPlace = false;

    sortedPlayers.forEach(player => {
        const placement = stats[player].placement;
        const isRunnerUp = runnerUps.includes(player) && runnerUps.length === 2;

        html += `<tr>`;

        if (placement === 2 && isRunnerUp) {
            if (!printedSecondPlace) {
                html += `<td rowspan="2">2</td>`;
                printedSecondPlace = true;
            }
        } else {
            html += `<td>${placement}</td>`;
        }

        html += `<td>${player}</td>`;
        html += `<td>${showImage(player)}</td>`;

        const eliminatedEp = stats[player].eliminatedEpisode;

        episodeResults.forEach((ep, index) => {
            const epNum = index + 1;

            if (eliminatedEp && epNum > eliminatedEp) {
                html += `<td style="background:#dddddd;"></td>`;
                return;
            }

            let result = ep.results[player] || "";

            let bg = "white";
            let color = "black";

            if (result === "OUT") bg = "#ff9999";
            if (result === "IMM") bg = ep.phase === "Pre-Merge" ? "#55cc55" : "#99ff99";
            if (result === "SAFE") bg = "white";
            if (result === "TIE") bg = "#ffbb66";
            if (result === "TIEBRK") {
                bg = "#cc5500";
                color = "white";
                result = "TIE";
            }

            html += `<td style="background:${bg}; color:${color};">${result}</td>`;
        });

        if (jury.includes(player)) {
            const votedFor = stats[player].votedForWinner || "—";
            html += `<td style="background:#e6e6e6; color:black; text-align:center;">
                        <strong>JUROR</strong><br>
                        <small><em>(${votedFor})</em></small>
                     </td>`;
        } else if (finaleFinalists.includes(player)) {
            if (player === finaleWinner) {
                html += `<td style="background:#ffd700; font-weight:bold; text-align:center;">WINNER</td>`;
            } else {
                html += `<td style="background:#c0c0c0; font-weight:bold; text-align:center;">RUNNER-UP</td>`;
            }
        } else {
            html += `<td style="background:#dddddd;"></td>`;
        }

        html += `</tr>`;
    });

    html += `</table>`;

    document.getElementById("log").innerHTML += html;
}

/* ============================================================
   JURY VOTING
   ============================================================ */

function juryVote(juror, finalists) {
    let best = finalists[0];
    let bestScore = -Infinity;

    finalists.forEach(f => {
        const rel = relationships[juror]?.[f] ?? 50;
        if (rel > bestScore) {
            bestScore = rel;
            best = f;
        }
    });

    return best;
}

/* ============================================================
   FINALE
   ============================================================ */

function runFinale(finalists) {
    finaleFinalists = [...finalists];

    let html = `<h3>Final Tribal Council (${finalists.length} finalists)</h3>`;

    html += showImages(finalists);
    html += `<p>The finalists face the jury.</p>`;

    if (jury.length === 0) {
        html += `<p>No jury exists. A random winner is chosen.</p>`;
        const winner = finalists[Math.floor(Math.random() * finalists.length)];
        finaleWinner = winner;

        stats[winner].placement = 1;
        finalists.forEach(p => {
            if (p !== winner) stats[p].placement = 2;
        });

        html += showImages([winner]) + `<h2>${winner} wins Survivor</h2>`;
        setLog(html);
        showTrackRecord();
        document.getElementById("nextEpisodeBtn").disabled = true;
        return;
    }

    html += `<h4>Jury Votes</h4>`;

    let voteTally = {};
    finalists.forEach(f => voteTally[f] = 0);

    jury.forEach(juror => {
        const voteFor = juryVote(juror, finalists);
        voteTally[voteFor]++;
        stats[juror].votedForWinner = voteFor;

        html += showImages([juror, voteFor]) +
            `<p>${juror} votes for ${voteFor}.</p>`;
    });

    let maxVotes = Math.max(...Object.values(voteTally));
    let winners = Object.keys(voteTally).filter(p => voteTally[p] === maxVotes);

    let winner;
    if (winners.length === 1) {
        winner = winners[0];
    } else {
        winner = winners[Math.floor(Math.random() * winners.length)];
        html += `<p>The jury is tied. By random draw, ${winner} wins.</p>`;
    }

    finaleWinner = winner;

    stats[winner].placement = 1;
    finalists.forEach(p => {
        if (p !== winner) stats[p].placement = 2;
    });

    html += `<h4>Final Vote Tally</h4><ul>`;
    finalists.forEach(f => {
        html += `<li>${f}: ${voteTally[f]} vote(s)</li>`;
    });
    html += `</ul>`;

    html += showImages([winner]) + `<h2>${winner} wins Survivor</h2>`;

    setLog(html);
    showTrackRecord();
    document.getElementById("nextEpisodeBtn").disabled = true;
}

/* ============================================================
   TIEBREAKERS
   ============================================================ */

function runRandomCompetitionTiebreaker(tiedPlayers) {
    const tb = getRandomTiebreaker();
    let html = "";

    if (!tb) {
        const loser = tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];
        html += showImages(tiedPlayers);
        html += `<p><strong>Tiebreaker:</strong> Random draw.</p>`;
        html += `<p>${loser} loses the tiebreaker.</p>`;
        return { eliminated: loser, log: html };
    }

    html += showImages(tiedPlayers);
    html += `<p><strong>Tiebreaker:</strong> ${tb.name}</p>`;
    html += `<p>${tb.description}</p>`;

    let scores = tiedPlayers.map(p => ({
        player: p,
        score: computePlayerScore(p, tb.weights)
    }));

    scores.sort((a, b) => a.score - b.score);

    const lowestScore = scores[0].score;
    const lowestPlayers = scores.filter(s => s.score === lowestScore).map(s => s.player);

    const loser = lowestPlayers[Math.floor(Math.random() * lowestPlayers.length)];

    html += `<p>${loser} performs the worst and is eliminated.</p>`;

    return { eliminated: loser, log: html };
}

/* ============================================================
   MERGE CHECK
   ============================================================ */

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

/* ============================================================
   MAIN EPISODE LOOP
   ============================================================ */

function runEpisode() {
    let html = `<h3>Episode ${episode}</h3>`;

    recordTribeHistory();

    const remaining = [...tribes.A, ...tribes.B, ...tribes.Merged];

    if (!finaleSize) {
        if (finaleSetting === "f2") finaleSize = 2;
        else if (finaleSetting === "f3") finaleSize = 3;
        else finaleSize = Math.random() < 0.5 ? 2 : 3;
    }

    if (remaining.length === finaleSize) {
        runFinale(remaining);
        return;
    }

    if (checkMerge()) {
        html += `<h2>Merge!</h2>`;
        html += `<p>The tribes merge into one group.</p>`;
    }

    const currentRemaining = [...tribes.A, ...tribes.B, ...tribes.Merged];

    let immune = null;
    let losingTribe = null;
    let challenge = getRandomChallenge(merged ? "merge" : "tribe");

    if (!merged) {
        const tribeAScore = challenge ? computeTribeScore(tribes.A, challenge.weights) : Math.random();
        const tribeBScore = challenge ? computeTribeScore(tribes.B, challenge.weights) : Math.random();

        const winning = tribeAScore > tribeBScore ? "A" : "B";
        losingTribe = winning === "A" ? "B" : "A";
        const winningMembers = winning === "A" ? tribes.A : tribes.B;

        if (challenge) {
            html += `<p><strong>Immunity Challenge:</strong> ${challenge.name}</p>`;
            html += `<p>${challenge.description}</p>`;
        }

        html += showImages(winningMembers) +
            `<p>Tribe ${winning} wins immunity.</p>`;
    } else {
        if (!challenge) {
            immune = currentRemaining[Math.floor(Math.random() * currentRemaining.length)];
        } else {
            let scores = currentRemaining.map(p => ({
                player: p,
                score: computePlayerScore(p, challenge.weights)
            }));
            scores.sort((a, b) => b.score - a.score);

            const topScore = scores[0].score;
            const topPlayers = scores.filter(s => s.score === topScore).map(s => s.player);
            immune = topPlayers[Math.floor(Math.random() * topPlayers.length)];

            html += `<p><strong>Immunity Challenge:</strong> ${challenge.name}</p>`;
            html += `<p>${challenge.description}</p>`;
        }

        stats[immune].immunityWins++;
        html += showImages([immune]) +
            `<p><strong>Individual Immunity:</strong> ${immune} wins immunity.</p>`;
    }

    html += `<h4>Post-Challenge Events</h4>`;
    if (!merged) {
        html += `<p>${runEvent(tribes.A)}</p>`;
        html += `<p>${runEvent(tribes.B)}</p>`;
    } else {
        html += `<p>${runEvent(currentRemaining)}</p>`;
        html += `<p>${runEvent(currentRemaining)}</p>`;
    }

    html += `<h4>Tribal Council</h4>`;

    let voters = merged ? currentRemaining : tribes[losingTribe];
    let eliminated;

    if (voters.length === 1) {
        eliminated = voters[0];
        html += showImages([eliminated]) +
            `<p>${eliminated} is automatically eliminated.</p>`;
        stats[eliminated].placement = currentRemaining.length;
        stats[eliminated].eliminatedEpisode = episode;

        if (merged) tribes.Merged = [];
        else tribes[losingTribe] = [];
    } else {
        let votes = {};
        voters.forEach(voter => {
            let choices = voters.filter(p => p !== voter && p !== immune);

            let weightedChoices = choices.map(target => {
                const rel = relationships[voter]?.[target] ?? 50;
               
                const weight =
                    (6 - stats[voter].loyalty) * 0.4 +
                    (6 - stats[target].social) * 0.2 +
                    stats[target].strategy * 0.2 +
                    (100 - rel) * 0.1 +
                    Math.random() * stats[voter].temperament * 0.1 +
                    Math.random() * stats[voter].luck * 0.1;

                return { player: target, weight };
            });

            weightedChoices.sort((a, b) => b.weight - a.weight);

            let voteFor = weightedChoices[0].player;
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
            html += `<p><strong>The vote is tied between ${tied.join(", ")}. They will revote.</strong></p>`;

            let revoteVotes = {};
            voters.forEach(voter => {
                let choices = tied.filter(p => p !== voter && p !== immune);
                if (choices.length === 0) {
                    choices = tied.filter(p => p !== immune);
                }

                let weightedChoices = choices.map(target => {
                    const rel = relationships[voter]?.[target] ?? 50;

                    const weight =
                        (6 - stats[voter].loyalty) * 0.4 +
                        (6 - stats[target].social) * 0.2 +
                        stats[target].strategy * 0.2 +
                        (100 - rel) * 0.1 +
                        Math.random() * stats[voter].temperament * 0.1 +
                        Math.random() * stats[voter].luck * 0.1;

                    return { player: target, weight };
                });

                weightedChoices.sort((a, b) => b.weight - a.weight);
                let voteFor = weightedChoices[0].player;

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
                html += `<p><strong>The revote is still tied. A tiebreaker competition will decide who goes home.</strong></p>`;
                const tb = runRandomCompetitionTiebreaker(revoteTied);
                eliminated = tb.eliminated;
                html += tb.log;
            }
        }

        stats[eliminated].votesReceived += (tally[eliminated] || 0);
        stats[eliminated].placement = currentRemaining.length;
        stats[eliminated].eliminatedEpisode = episode;

        const wasMerged = merged || tribes.Merged.includes(eliminated);
        if (wasMerged) {
            jury.push(eliminated);
        }

        if (merged) {
            tribes.Merged = voters.filter(p => p !== eliminated);
        } else {
            tribes[losingTribe] = voters.filter(p => p !== eliminated);
        }

        let epData = { phase: merged ? "Merge" : "Pre-Merge", results: {} };

        currentRemaining.forEach(p => {
            if (p === eliminated) {
                epData.results[p] = "OUT";
            } else if (p === immune) {
                epData.results[p] = "IMM";
            } else if (!merged && tribes[losingTribe] && !tribes[losingTribe].includes(p)) {
                epData.results[p] = "IMM";
            } else {
                epData.results[p] = "SAFE";
            }
        });

        tiedPlayersFirstVote.forEach(p => {
            if (p !== eliminated) epData.results[p] = "TIE";
        });

        tiedPlayersDeadlock.forEach(p => {
            if (p !== eliminated) epData.results[p] = "TIEBRK";
        });

        episodeResults.push(epData);
    }

    setLog(html);
    episode++;
}

/* ============================================================
   MAIN MENU: CAST + STAT EDITOR + SETTINGS
   ============================================================ */

function renderCastList() {
    const container = document.getElementById("castList");
    container.innerHTML = "";

    cast.forEach(name => {
        const card = document.createElement("div");
        card.className = "castCard";

        const img = document.createElement("img");
        img.src = photos[name] || "https://via.placeholder.com/80?text=No+Image";
        img.alt = name;

        const label = document.createElement("div");
        label.textContent = name;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.onclick = () => {
            cast = cast.filter(n => n !== name);
            delete photos[name];
            delete stats[name];
            delete relationships[name];
            renderCastList();
        };

        card.appendChild(img);
        card.appendChild(label);
        card.appendChild(removeBtn);
        container.appendChild(card);
    });
}

function addContestant() {
    const nameInput = document.getElementById("newName");
    const photoInput = document.getElementById("newPhoto");

    const name = nameInput.value.trim();
    const url = photoInput.value.trim();

    if (!name) return;

    if (!cast.includes(name)) {
        cast.push(name);
        photos[name] = url || null;
    } else {
        photos[name] = url || photos[name] || null;
    }

    nameInput.value = "";
    photoInput.value = "";

    renderCastList();
}

function openStatEditor() {
    if (cast.length === 0) return;

    initRelationships(cast);
    initStats(cast);

    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("settingsMenu").style.display = "none";
    document.getElementById("game").style.display = "none";
    document.getElementById("statEditor").style.display = "block";

    renderStatEditor();
}

function renderStatEditor() {
    const container = document.getElementById("statEditorContent");
    container.innerHTML = "";

    cast.forEach(name => {
        const block = document.createElement("div");
        block.className = "statBlock";

        const header = document.createElement("div");
        header.className = "statHeader";

        const img = document.createElement("img");
        img.src = photos[name] || "https://via.placeholder.com/80?text=No+Image";
        img.alt = name;

        const title = document.createElement("div");
        title.textContent = name;

        header.appendChild(img);
        header.appendChild(title);
        block.appendChild(header);

        const row1 = document.createElement("div");
        row1.className = "statRow";
        row1.appendChild(makeStatField(name, "physical", "Physical"));
        row1.appendChild(makeStatField(name, "endurance", "Endurance"));
        row1.appendChild(makeStatField(name, "mental", "Mental"));
        row1.appendChild(makeStatField(name, "social", "Social"));

        const row2 = document.createElement("div");
        row2.className = "statRow";
        row2.appendChild(makeStatField(name, "temperament", "Temperament"));
        row2.appendChild(makeStatField(name, "luck", "Luck"));
        row2.appendChild(makeStatField(name, "strategy", "Strategy"));
        row2.appendChild(makeStatField(name, "loyalty", "Loyalty"));

        block.appendChild(row1);
        block.appendChild(row2);

        container.appendChild(block);
    });
}

function makeStatField(name, key, labelText) {
    const wrapper = document.createElement("div");

    const label = document.createElement("label");
    label.textContent = labelText + ":";

    const select = document.createElement("select");
    select.dataset.player = name;
    select.dataset.stat = key;

    for (let i = 1; i <= 5; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = i;
        if ((stats[name] && stats[name][key] === i) || (!stats[name] && i === 3)) {
            opt.selected = true;
        }
        select.appendChild(opt);
    }

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    return wrapper;
}

function saveStatsAndReturn() {
    const selects = document.querySelectorAll("#statEditorContent select");
    selects.forEach(sel => {
        const player = sel.dataset.player;
        const key = sel.dataset.stat;
        const value = parseInt(sel.value, 10);

        if (!stats[player]) stats[player] = {};
        stats[player][key] = value;
    });

    document.getElementById("statEditor").style.display = "none";
    document.getElementById("mainMenu").style.display = "block";
}

/* ============================================================
   SETTINGS MENU
   ============================================================ */

function openSettings() {
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("statEditor").style.display = "none";
    document.getElementById("game").style.display = "none";
    document.getElementById("settingsMenu").style.display = "block";

    document.getElementById("finaleSetting").value = finaleSetting;
}

function saveSettings() {
    finaleSetting = document.getElementById("finaleSetting").value;

    document.getElementById("settingsMenu").style.display = "none";
    document.getElementById("mainMenu").style.display = "block";
}

/* ============================================================
   START SEASON
   ============================================================ */

document.getElementById("addContestantBtn").onclick = addContestant;
document.getElementById("editStatsBtn").onclick = openStatEditor;
document.getElementById("settingsBtn").onclick = openSettings;
document.getElementById("saveSettingsBtn").onclick = saveSettings;
document.getElementById("saveStatsBtn").onclick = saveStatsAndReturn;

document.getElementById("startBtn").onclick = () => {
    if (cast.length === 0) return;

    merged = false;
    tribes = { A: [], B: [], Merged: [] };
    episode = 1;
    episodeResults = [];
    jury = [];
    finaleSize = null;
    finaleFinalists = [];
    finaleWinner = null;

    initRelationships(cast);
    initStats(cast);

    if (cast.length < 10) {
        merged = true;
        tribes.A = [];
        tribes.B = [];
        tribes.Merged = [...cast];
    } else {
        assignTribes();
    }

    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("statEditor").style.display = "none";
    document.getElementById("settingsMenu").style.display = "none";
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
