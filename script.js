let cast = [];
let tribes = { A: [], B: [] };
let episode = 1;

function log(text) {
    const logDiv = document.getElementById("log");
    logDiv.innerHTML += `<p>${text}</p>`;
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

function runEpisode() {
    log(`<strong>Episode ${episode}</strong>`);

    // 1. Immunity
    const winningTribe = Math.random() < 0.5 ? "A" : "B";
    const losingTribe = winningTribe === "A" ? "B" : "A";
    log(`Tribe ${winningTribe} wins immunity!`);

    // 2. Tribal Council
    const tribeMembers = tribes[losingTribe];
    const votedOut = tribeMembers[Math.floor(Math.random() * tribeMembers.length)];
    log(`Tribe ${losingTribe} goes to Tribal Council.`);
    log(`${votedOut} is voted out.`);

    // Remove from tribe
    tribes[losingTribe] = tribeMembers.filter(p => p !== votedOut);

    // 3. Check for winner
    const remaining = [...tribes.A, ...tribes.B];
    if (remaining.length === 1) {
        log(`<strong>${remaining[0]} wins Survivor!</strong>`);
        document.getElementById("nextEpisodeBtn").disabled = true;
    }

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

    log("Season begins!");
    log(`Tribe A: ${tribes.A.join(", ")}`);
    log(`Tribe B: ${tribes.B.join(", ")}`);
};

document.getElementById("nextEpisodeBtn").onclick = runEpisode;
