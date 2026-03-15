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

function assignTribes() {
    const shuffled = shuffle([...cast]);
    const half = Math.ceil(shuffled.length / 2);
    tribes.A = shuffled.slice(0, half);
    tribes.B = shuffled.slice(half);
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

/* ============================================================
   HIDDEN IMMUNITY IDOL SYSTEM (NEW)
   ============================================================ */

// Idol mode: "none", "one", or "tribes"
let idolMode = "tribes";

// Idols expire at F4/F5/F6
let idolExpireAt = 5;

// Idol pools (whether an idol is hidden in each area)
let idolPool = {
    A: false,
    B: false,
    Merged: false,
    global: false
};

// Who currently holds idols
let idolsHeld = {}; // { playerName: true }

// Whether idols have been placed this season
let idolsPlaced = false;

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
   IDOL PLACEMENT (NEW)
   ============================================================ */

function resetIdolsForNewSeason() {
    idolsPlaced = false;
    idolsHeld = {};
    idolPool = { A: false, B: false, Merged: false, global: false };
}

function placeIdols() {
    idolsPlaced = true;

    // Reset pools
    idolPool = { A: false, B: false, Merged: false, global: false };

    if (idolMode === "none") return;

    if (idolMode === "one") {
        idolPool.global = true;
        return;
    }

    if (idolMode === "tribes") {
        if (tribes.A.length > 0) idolPool.A = true;
        if (tribes.B.length > 0) idolPool.B = true;
    }
}

function placeMergeIdol() {
    if (idolMode !== "tribes") return;
    if (idolPool.Merged) return;
    idolPool.Merged = true;
}

/* ============================================================
   IDOL FINDING (NEW)
   ============================================================ */

function attemptIdolFind(tribePlayers, tribeName) {
    if (idolMode === "none") return "";
    if (!idolPool[tribeName] && !idolPool.global) return "";

    let html = "";

    tribePlayers.forEach(player => {
        if (idolsHeld[player]) return;

        const luck = stats[player]?.luck ?? 3;
        const chance = 0.03 + (luck * 0.01);

        if (Math.random() < chance) {
            idolsHeld[player] = true;

            if (idolPool[tribeName]) idolPool[tribeName] = false;
            else if (idolPool.global) idolPool.global = false;

            html += `
                <div class="idolFoundBox">
                    ⭐ <strong>${player} found a Hidden Immunity Idol!</strong>
                </div>
            `;
        }
    });

    return html;
}

function runEventWithIdols(tribePlayers, tribeName) {
    let html = "";
    html += attemptIdolFind(tribePlayers, tribeName);
    html += runEvent(tribePlayers);
    return html;
}

function recordTribeHistory() {
    [...tribes.A, ...tribes.B, ...tribes.Merged].forEach(p => {
        if (tribes.A.includes(p)) stats[p].tribeHistory.push("A");
        else if (tribes.B.includes(p)) stats[p].tribeHistory.push("B");
        else stats[p].tribeHistory.push("Merged");
    });
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

/* ============================================================
   IDOL EXPIRATION (NEW)
   ============================================================ */

function disableExpiredIdols() {
    const remaining = [...tribes.A, ...tribes.B, ...tribes.Merged].length;

    if (remaining <= idolExpireAt) {
        idolsHeld = {};
        idolPool = { A: false, B: false, Merged: false, global: false };
    }
}
/* ============================================================
   MAIN EPISODE LOOP
   ============================================================ */

function runEpisode() {
    let html = `<h3>Episode ${episode}</h3>`;

    recordTribeHistory();

    // IDOL EXPIRATION CHECK (NEW)
    disableExpiredIdols();

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

        // PLACE MERGE IDOL (NEW)
        placeMergeIdol();
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
        // IDOL-FINDING EVENTS (NEW)
        html += `<p>${runEventWithIdols(tribes.A, "A")}</p>`;
        html += `<p>${runEventWithIdols(tribes.B, "B")}</p>`;
    } else {
        html += `<p>${runEventWithIdols(currentRemaining, "Merged")}</p>`;
        html += `<p>${runEventWithIdols(currentRemaining, "Merged")}</p>`;
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

        /* ============================================================
           VOTING
           ============================================================ */

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

        /* ============================================================
           IDOL PLAY (NEW)
           ============================================================ */

        const idolResult = handleIdolPlay(voters, immune);
        html += idolResult.html;

        const { newVotes, nullifiedCount } = nullifyVotes(votes, idolResult.playedBy);

        if (idolResult.playedBy) {
            html += `<p><strong>${nullifiedCount} vote(s) against ${idolResult.playedBy} do not count.</strong></p>`;
        }

        /* ============================================================
           TALLY VOTES (WITH IDOLS)
           ============================================================ */

        let tally = {};
        voters.forEach(p => tally[p] = 0);

        for (const target of Object.values(newVotes)) {
            if (target && tally[target] !== undefined) {
                tally[target]++;
            }
        }

        let sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);

        let highestVotes = sorted[0][1];
        let highestPlayers = sorted.filter(e => e[1] === highestVotes).map(e => e[0]);

        let secondHighestVotes = sorted.find(e => e[1] < highestVotes)?.[1] ?? 0;
        let secondHighestPlayers = sorted.filter(e => e[1] === secondHighestVotes).map(e => e[0]);

        /* ============================================================
           ELIMINATION LOGIC (WITH IDOLS)
           ============================================================ */

        if (idolResult.playedBy && highestPlayers.includes(idolResult.playedBy)) {

            // Idol protected the top vote-getter → eliminate second-highest
            if (secondHighestPlayers.length === 1) {
                eliminated = secondHighestPlayers[0];
                html += showImages([eliminated]) +
                    `<p><strong>${eliminated} is eliminated with the second-highest votes.</strong></p>`;
            } else {
                html += `<p><strong>There is a tie for second-highest votes.</strong></p>`;
                const tb = runRandomCompetitionTiebreaker(secondHighestPlayers);
                eliminated = tb.eliminated;
                html += tb.log;
            }

        } else if (highestPlayers.length === 1) {

            // Normal elimination
            eliminated = highestPlayers[0];
            html += showImages([eliminated]) +
                `<p><strong>${eliminated} is voted out.</strong></p>`;

        } else {

            // Tie → tiebreaker
            html += `<p><strong>The vote is tied between ${highestPlayers.join(", ")}.</strong></p>`;
            const tb = runRandomCompetitionTiebreaker(highestPlayers);
            eliminated = tb.eliminated;
            html += tb.log;
        }

        /* ============================================================
           RECORD ELIMINATION
           ============================================================ */

        stats[eliminated].votesReceived += tally[eliminated];
        stats[eliminated].placement = currentRemaining.length;
        stats[eliminated].eliminatedEpisode = episode;

        const wasMerged = merged || tribes.Merged.includes(eliminated);
        if (wasMerged) jury.push(eliminated);

        if (merged) {
            tribes.Merged = voters.filter(p => p !== eliminated);
        } else {
            tribes[losingTribe] = voters.filter(p => p !== eliminated);
        }

        /* ============================================================
           EPISODE TRACK RECORD
           ============================================================ */

        let epData = { phase: merged ? "Merge" : "Pre-Merge", results: {} };

        currentRemaining.forEach(p => {
            if (p === eliminated) {
                epData.results[p] = "OUT";
            } else if (p === immune) {
                epData.results[p] = "IMM";
            } else {
                epData.results[p] = "SAFE";
            }
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

    // RESET IDOLS (NEW)
    resetIdolsForNewSeason();

    if (cast.length < 10) {
        merged = true;
        tribes.A = [];
        tribes.B = [];
        tribes.Merged = [...cast];
    } else {
        assignTribes();
    }

    // PLACE INITIAL IDOLS (NEW)
    placeIdols();

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
