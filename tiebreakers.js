// tiebreakers.js
// Defines all tiebreaker competitions and their stat weightings

const TIEBREAKERS = [
    {
        name: "Fire-Making Duel",
        description: "Contestants must build a fire strong enough to burn through a rope.",
        weights: {
            mental: 0.40,
            endurance: 0.30,
            luck: 0.30
        }
    },
    {
        name: "Balance Beam",
        description: "A test of balance and composure.",
        weights: {
            endurance: 0.50,
            physical: 0.20,
            luck: 0.30
        }
    },
    {
        name: "Puzzle Tiebreaker",
        description: "A quick puzzle to determine who stays.",
        weights: {
            mental: 0.70,
            luck: 0.30
        }
    },
    {
        name: "Speed Grab",
        description: "A reflex-based challenge to grab an object first.",
        weights: {
            physical: 0.40,
            luck: 0.60
        }
    }
];
