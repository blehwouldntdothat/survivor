// challenges.js
// Defines all challenges and their stat weightings

const CHALLENGES = [
    {
        name: "Endurance Marathon",
        description: "A long, grueling endurance test.",
        type: "tribe",
        weights: {
            physical: 0.20,
            endurance: 0.60,
            mental: 0.10,
            luck: 0.10
        }
    },
    {
        name: "Puzzle Gauntlet",
        description: "A multi-stage puzzle challenge.",
        type: "merge",
        weights: {
            physical: 0.10,
            endurance: 0.10,
            mental: 0.70,
            strategy: 0.10
        }
    },
    {
        name: "Strength Showdown",
        description: "A brute-force strength competition.",
        type: "tribe",
        weights: {
            physical: 0.80,
            endurance: 0.10,
            luck: 0.10
        }
    },
    {
        name: "Balance Battle",
        description: "A balance-focused challenge.",
        type: "merge",
        weights: {
            physical: 0.20,
            endurance: 0.50,
            luck: 0.30
        }
    },
    {
        name: "Strategy Sprint",
        description: "A fast-paced strategic decision challenge.",
        type: "merge",
        weights: {
            strategy: 0.60,
            mental: 0.30,
            luck: 0.10
        }
    }
];
