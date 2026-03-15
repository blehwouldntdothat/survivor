/* ============================================================
   GLOBALS
   ============================================================ */

let cast = [];
let tribes = { A: [], B: [], Merged: [] };
let episode = 1;

let merged = false;
let mergeAt = Math.floor(Math.random() * 4) + 8;
let minMergeEpisode = 4 + Math.floor(Math.random() * 2);

let relationships = {};
let stats = {};
let episodeResults = [];
let photos = {};
let jury = [];
let finaleSetting = "random";
let finaleSize = null;
let finaleFinalists = [];
let finaleWinner = null;

/* ============================================================
   IDOL SYSTEM
   ============================================================ */

let idolMode = "tribes";       // "none", "one", "tribes"
let idolExpireAt = 5;          // 4, 5, or 6

let idolPool = {
    A: false,
    B: false,
    Merged: false,
    global: false
};

let idolsHeld = {}; // { playerName: true }
let idolsPlaced = false;

/* ============================================================
   BASIC HELPERS
   ============================================================ */

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showImages(players) {
    if (!players || players.length === 0) return "";
    let html = `<div class="icon-grid">`;
    players.forEach(p => {
        const src = photos[p] || "";
        if (src) {
            html += `<img class="contestant-photo" src="${src}" alt="${p}">`;
        } else {
            html += `<div class="contestant-photo" style="background:#ddd;display:flex;align-items:center;justify-content:center;font-size:12px;">${p}</div>`;
        }
    });
    html += `</div>`;
    return html;
}

/* ============================================================
   SETTINGS
   ============================================================ */

function applySettings() {
    finaleSetting = document.getElementById("finaleSetting").value;
    idolMode = document.getElementById("idolMode").value;
    idolExpireAt = parseInt(document.getElementById("idolExpire").value, 10);
}

/* ============================================================
   IDOL PLACEMENT
   ============================================================ */

function placeIdols() {
    idolsPlaced = true;

    idolPool = { A: false, B: false, Merged: false, global: false };
    idolsHeld = {};

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
   IDOL FINDING (EVENT-BASED)
   ============================================================ */

function attemptIdolFind(tribePlayers, tribeName) {
    if (idolMode === "none") return "";
    if (!idolPool[tribeName] && !idolPool.global) return "";

    let foundHTML = "";

    tribePlayers.forEach(player => {
        if (idolsHeld[player]) return;

        const luck = stats[player]?.luck ?? 3;
        const chance = 0.03 + (luck * 0.01);

        if (Math.random() < chance) {
            idolsHeld[player] = true;

            if (idolPool[tribeName]) idolPool[tribeName] = false;
            else if (idolPool.global) idolPool.global = false;

            foundHTML += `
                <div class="idolFoundBox">
                    ⭐ <strong>${player} found a Hidden Immunity Idol!</strong>
                </div>
            `;
        }
    });

    return foundHTML;
}

function runEventWithIdols(tribePlayers, tribeName) {
    let html = "";
    html += attemptIdolFind(tribePlayers, tribeName);
    html += runEvent(tribePlayers); // from events.js
    return html;
}

/* ============================================================
   IDOL PLAY LOGIC
   ============================================================ */

function shouldPlayIdol(player, voters, immune) {
    if (!idolsHeld[player]) return false;

    const remaining = [...tribes.A, ...tribes.B, ...tribes.Merged].length;
    if (remaining <= idolExpireAt) {
        return true;
    }

    if (player === immune) return false;

    let dangerScore = 0;
    voters.forEach(v => {
        if (v === player) return;
        const rel = relationships[v]?.[player] ?? 50;
        if (rel < 40) dangerScore += 1;
        if (rel < 25) dangerScore += 1;
    });

    if (dangerScore >= Math.floor(voters.length / 3)) {
        return true;
    }

    const chaosChance = 0.05 + (stats[player].temperament * 0.01);
    if (Math.random() < chaosChance) {
        return true;
    }

    return false;
}

function handleIdolPlay(voters, immune) {
    let html = "";
    let playedBy = null;

    voters.forEach(player => {
        if (playedBy) return;
        if (!idolsHeld[player]) return;

        if (shouldPlayIdol(player, voters, immune)) {
            playedBy = player;
            delete idolsHeld[player];

            html += `
                <div class="idolFoundBox" style="background: rgba(255,150,80,0.2); color:#b33;">
                    🛡️ <strong>${player} plays a Hidden Immunity Idol!</strong>
                </div>
            `;
        }
    });

    return { playedBy, html };
}

function nullifyVotes(votes, idolPlayer) {
    if (!idolPlayer) return { newVotes: votes, nullifiedCount: 0 };

    let newVotes = {};
    let nullified = 0;

    for (const [voter, target] of Object.entries(votes)) {
        if (target === idolPlayer) {
            nullified++;
            newVotes[voter] = null;
        } else {
            newVotes[voter] = target;
        }
    }

    return { newVotes, nullifiedCount: nullified };
}

/* ============================================================
   MERGE IDOL + RESET + EXPIRATION
   ============================================================ */

function checkAndPlaceMergeIdol() {
    if (idolMode !== "tribes") return;
    if (!merged) return;
    if (idolPool.Merged) return;
    idolPool.Merged = true;
}

function resetIdolsForNewSeason() {
    idolsPlaced = false;
    idolPool = { A: false, B: false, Merged: false, global: false };
    idolsHeld = {};
}

function disableExpiredIdols() {
    const remaining = [...tribes.A, ...tribes.B, ...tribes.Merged].length;
    if (remaining <= idolExpireAt) {
        idolsHeld = {};
        idolPool = { A: false, B: false, Merged: false, global: false };
    }
}

/* ============================================================
   RELATIONSHIPS + STATS INIT
   ============================================================ */

function initRelationships() {
    relationships = {};
    cast.forEach(a => {
        relationships[a] = {};
        cast.forEach(b => {
            if (a === b) return;
            relationships[a][b] = 40 + Math.floor(Math.random() * 21);
        });
    });
}

function initStats() {
    stats = {};
    cast.forEach(name => {
        stats[name] = {
            physical: 3,
            mental: 3,
            social: 3,
            strategy: 3,
            loyalty: 3,
            temperament: 3,
            luck: 3,
            placement: null,
            eliminatedEpisode: null,
            votesReceived: 0,
            votesCast: []
        };
    });
}

/* ============================================================
   TRIBE ASSIGNMENT
   ============================================================ */

function assignTribes() {
    tribes = { A: [], B: [], Merged: [] };
    merged = false;
    jury = [];
    episode = 1;

    let shuffled = shuffle([...cast]);
    const half = Math.ceil(shuffled.length / 2);
    tribes.A = shuffled.slice(0, half);
    tribes.B = shuffled.slice(half);
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

        checkAndPlaceMergeIdol();

        return true;
    }

    return false;
}

/* ============================================================
   EPISODE RUNNER
   ============================================================ */

function runEpisode() {
    const log = document.getElementById("log");
    let html = `<h3>Episode ${episode}</h3>`;

    disableExpiredIdols();

    let currentRemaining = merged ? tribes.Merged : [...tribes.A, ...tribes.B];

    if (currentRemaining.length <= 2) {
        html += `<p>Finale reached.</p>`;
        log.innerHTML += html;
        return;
    }

    if (!merged) {
        html += `<h4>Tribes</h4>`;
        html += `<p><strong>Tribe A:</strong> ${tribes.A.join(", ")}</p>`;
        html += `<p><strong>Tribe B:</strong> ${tribes.B.join(", ")}</p>`;
    } else {
        html += `<h4>Merged Tribe</h4>`;
        html += `<p>${tribes.Merged.join(", ")}</p>`;
    }

    // Challenge
    html += `<h4>Immunity Challenge</h4>`;
    let losingTribe = null;
    let immune = null;

    if (!merged) {
        const result = runTribalChallenge(tribes.A, tribes.B, stats); // from challenges.js
        losingTribe = result.loser;
        html += result.log;
    } else {
        const result = runIndividualChallenge(currentRemaining, stats); // from challenges.js
        immune = result.winner;
        html += result.log;
    }

    // Events
    html += `<h4>Post-Challenge Events</h4>`;

    if (!merged) {
        html += `<p>${runEventWithIdols(tribes.A, "A")}</p>`;
        html += `<p>${runEventWithIdols(tribes.B, "B")}</p>`;
    } else {
        html += `<p>${runEventWithIdols(currentRemaining, "Merged")}</p>`;
        html += `<p>${runEventWithIdols(currentRemaining, "Merged")}</p>`;
    }

    // Tribal Council
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

        const idolResult = handleIdolPlay(voters, immune);
        html += idolResult.html;

        const { newVotes, nullifiedCount } = nullifyVotes(votes, idolResult.playedBy);

        if (idolResult.playedBy) {
            html += `<p><strong>${nullifiedCount} vote(s) against ${idolResult.playedBy} do not count.</strong></p>`;
        }

        let tally = {};
        voters.forEach(p => tally[p] = 0);

        for (const target of Object.values(newVotes)) {
            if (target && tally[target] !== undefined) {
                tally[target]++;
            }
        }

        let sorted = Object.entries(tally)
            .sort((a, b) => b[1] - a[1]);

        let highestVotes = sorted[0][1];
        let highestPlayers = sorted.filter(e => e[1] === highestVotes).map(e => e[0]);

        let secondHighestVotes = sorted.find(e => e[1] < highestVotes)?.[1] ?? 0;
        let secondHighestPlayers = sorted.filter(e => e[1] === secondHighestVotes).map(e => e[0]);

        if (idolResult.playedBy && highestPlayers.includes(idolResult.playedBy)) {
            if (secondHighestPlayers.length === 1) {
                eliminated = secondHighestPlayers[0];
                html += showImages([eliminated]) +
                    `<p><strong>${eliminated} is eliminated with the second-highest votes.</strong></p>`;
            } else {
                html += `<p><strong>There is a tie for second-highest votes.</strong></p>`;
                const tb = runRandomCompetitionTiebreaker(secondHighestPlayers); // from tiebreakers.js
                eliminated = tb.eliminated;
                html += tb.log;
            }

        } else if (highestPlayers.length === 1) {
            eliminated = highestPlayers[0];
            html += showImages([eliminated]) +
                `<p><strong>${eliminated} is voted out.</strong></p>`;

        } else {
            html += `<p><strong>The vote is tied between ${highestPlayers.join(", ")}.</strong></p>`;
            const tb = runRandomCompetitionTiebreaker(highestPlayers);
            eliminated = tb.eliminated;
            html += tb.log;
        }

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

        if (idolResult.playedBy) {
            epData.results[idolResult.playedBy] = "IMM";
        }

        episodeResults.push(epData);
    }

    checkMerge();

    episode++;
    log.innerHTML += html;
}

/* ============================================================
   UI: CAST SETUP
   ============================================================ */

const addContestantBtn = document.getElementById("addContestantBtn");
const castListDiv = document.getElementById("castList");
const startBtn = document.getElementById("startBtn");
const editStatsBtn = document.getElementById("editStatsBtn");
const settingsBtn = document.getElementById("settingsBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const saveStatsBtn = document.getElementById("saveStatsBtn");
const nextEpisodeBtn = document.getElementById("nextEpisodeBtn");

const mainMenuDiv = document.getElementById("mainMenu");
const statEditorDiv = document.getElementById("statEditor");
const settingsMenuDiv = document.getElementById("settingsMenu");
const gameDiv = document.getElementById("game");

addContestantBtn.onclick = () => {
    const nameInput = document.getElementById("newName");
    const photoInput = document.getElementById("newPhoto");
    const name = nameInput.value.trim();
    const photo = photoInput.value.trim();

    if (!name) return;

    cast.push(name);
    if (photo) photos[name] = photo;

    nameInput.value = "";
    photoInput.value = "";

    renderCastList();
};

function renderCastList() {
    castListDiv.innerHTML = "";
    cast.forEach(name => {
        const card = document.createElement("div");
        card.className = "castCard";

        const imgSrc = photos[name] || "";
        if (imgSrc) {
            card.innerHTML = `
                <img src="${imgSrc}" class="contestant-photo" alt="${name}">
                <p>${name}</p>
                <button data-name="${name}">Remove</button>
            `;
        } else {
            card.innerHTML = `
                <div class="contestant-photo" style="background:#ddd;display:flex;align-items:center;justify-content:center;">${name}</div>
                <p>${name}</p>
                <button data-name="${name}">Remove</button>
            `;
        }

        const btn = card.querySelector("button");
        btn.onclick = () => {
            cast = cast.filter(c => c !== name);
            delete photos[name];
            renderCastList();
        };

        castListDiv.appendChild(card);
    });
}

/* ============================================================
   UI: SETTINGS
   ============================================================ */

settingsBtn.onclick = () => {
    mainMenuDiv.style.display = "none";
    settingsMenuDiv.style.display = "block";
};

saveSettingsBtn.onclick = () => {
    applySettings();
    settingsMenuDiv.style.display = "none";
    mainMenuDiv.style.display = "block";
};

/* ============================================================
   UI: STATS EDITOR
   ============================================================ */

editStatsBtn.onclick = () => {
    if (cast.length === 0) return;

    if (Object.keys(stats).length === 0) {
        initStats();
    }

    const container = document.getElementById("statEditorContent");
    container.innerHTML = "";

    cast.forEach(name => {
        const block = document.createElement("div");
        block.className = "statBlock";

        const imgSrc = photos[name] || "";
        block.innerHTML = `
            <div class="statHeader">
                ${imgSrc ? `<img src="${imgSrc}" alt="${name}">` : `<div class="contestant-photo" style="background:#ddd;display:flex;align-items:center;justify-content:center;">${name}</div>`}
                <h3>${name}</h3>
            </div>
            <div class="statRow">
                <label>Physical:</label>
                <select data-name="${name}" data-stat="physical">${statOptions(stats[name].physical)}</select>
                <label>Mental:</label>
                <select data-name="${name}" data-stat="mental">${statOptions(stats[name].mental)}</select>
                <label>Social:</label>
                <select data-name="${name}" data-stat="social">${statOptions(stats[name].social)}</select>
            </div>
            <div class="statRow">
                <label>Strategy:</label>
                <select data-name="${name}" data-stat="strategy">${statOptions(stats[name].strategy)}</select>
                <label>Loyalty:</label>
                <select data-name="${name}" data-stat="loyalty">${statOptions(stats[name].loyalty)}</select>
                <label>Temperament:</label>
                <select data-name="${name}" data-stat="temperament">${statOptions(stats[name].temperament)}</select>
            </div>
            <div class="statRow">
                <label>Luck:</label>
                <select data-name="${name}" data-stat="luck">${statOptions(stats[name].luck)}</select>
            </div>
        `;

        container.appendChild(block);
    });

    mainMenuDiv.style.display = "none";
    statEditorDiv.style.display = "block";
};

function statOptions(selected) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
        html += `<option value="${i}" ${i === selected ? "selected" : ""}>${i}</option>`;
    }
    return html;
}

saveStatsBtn.onclick = () => {
    const selects = statEditorDiv.querySelectorAll("select[data-name]");
    selects.forEach(sel => {
        const name = sel.getAttribute("data-name");
        const stat = sel.getAttribute("data-stat");
        const val = parseInt(sel.value, 10);
        stats[name][stat] = val;
    });

    statEditorDiv.style.display = "none";
    mainMenuDiv.style.display = "block";
};

/* ============================================================
   START SEASON
   ============================================================ */

startBtn.onclick = () => {
    if (cast.length < 4) return;

    applySettings();
    resetIdolsForNewSeason();

    initRelationships();
    initStats();
    assignTribes();
    placeIdols();

    mainMenuDiv.style.display = "none";
    gameDiv.style.display = "block";

    document.getElementById("log").innerHTML = "";
    episodeResults = [];
    jury = [];
    finaleWinner = null;
};

nextEpisodeBtn.onclick = () => {
    runEpisode();
};

/* ============================================================
   TRACK RECORD + FINALE
   ============================================================ */

function buildTrackRecordTable() {
    let html = `<h3>Track Record</h3>`;
    html += `<table border="1" cellpadding="6"><tr><th>Player</th>`;

    episodeResults.forEach((ep, i) => {
        html += `<th>Ep ${i + 1}</th>`;
    });

    html += `</tr>`;

    cast.forEach(player => {
        html += `<tr><td>${player}</td>`;
        episodeResults.forEach(ep => {
            let val = ep.results[player] || "";
            html += `<td>${val}</td>`;
        });
        html += `</tr>`;
    });

    html += `</table>`;
    return html;
}

function runFinale() {
    const log = document.getElementById("log");
    let html = `<h3>Finale</h3>`;

    let finalists = tribes.Merged;

    html += `<p><strong>Finalists:</strong> ${finalists.join(", ")}</p>`;
    html += showImages(finalists);

    let votes = {};
    finalists.forEach(f => votes[f] = 0);

    jury.forEach(juror => {
        let weighted = finalists.map(f => {
            const rel = relationships[juror]?.[f] ?? 50;
            const weight = rel + stats[f].social * 5 + stats[f].strategy * 3;
            return { f, weight };
        });

        weighted.sort((a, b) => b.weight - a.weight);
        votes[weighted[0].f]++;
    });

    html += `<h4>Final Jury Votes</h4>`;
    finalists.forEach(f => {
        html += `<p>${f}: ${votes[f]} vote(s)</p>`;
    });

    finalists.sort((a, b) => votes[b] - votes[a]);
    finaleWinner = finalists[0];

    html += `<h2>🏆 ${finaleWinner} wins Survivor!</h2>`;
    html += showImages([finaleWinner]);

    html += buildTrackRecordTable();

    log.innerHTML += html;
}

/* ============================================================
   ENDGAME CHECK
   ============================================================ */

function checkForFinale() {
    const remaining = tribes.Merged.length;

    if (remaining <= 3) {
        runFinale();
        return true;
    }

    return false;
}
