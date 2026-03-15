// Each event has:
// players: number of players OR "tribe"
// text: function that receives chosen players
// change: list of [indexA, indexB, amount] relationship changes

const EVENTS = [
    {
        players: 1,
        text: p => `${p[0]} spends time alone reflecting.`,
        change: []
    },
    {
        players: 2,
        text: p => `${p[0]} and ${p[1]} bond over camp life.`,
        change: [[0,1,+10]]
    },
    {
        players: 2,
        text: p => `${p[0]} annoys ${p[1]} with their attitude.`,
        change: [[0,1,-10]]
    },
    {
        players: 3,
        text: p => `${p[0]}, ${p[1]}, and ${p[2]} form a temporary alliance.`,
        change: [[0,1,+5],[1,2,+5],[0,2,+5]]
    },
    {
        players: "tribe",
        text: p => `The entire tribe works together to improve the shelter.`,
        change: []
    }
];
