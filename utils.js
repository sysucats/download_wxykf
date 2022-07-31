const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

async function waitLine(prompt) {
    return new Promise((resolve, _) => {
        readline.question(prompt, line => {
            resolve(line);
        });
    });
}

module.exports = {
    waitLine,
}