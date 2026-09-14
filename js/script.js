class WordGuess {
    static KEYBOARD_LAYOUT = [
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
        ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
    ];

    constructor(config) {
        this.currentWord = String(config.TODAY_WORD).trim().toUpperCase();
        this.currentGuess = "";
        this.messageTimeout = null;
        this.guesses = [""]
        this.cacheElements()
        this.initializeGame()
    }

    cacheElements() {
        this.elements = {
            guess_word: document.getElementById("guess_word"),
            guess_input: document.getElementById("guess_input"),
            guesses: document.getElementById("guesses"),
            keyboard: document.getElementById("keyboard"),
            message: document.getElementById("message"),
            modal: document.getElementById("modal"),
            modalTitle: document.getElementById("modalTitle"),
            modalMessage: document.getElementById("modalMessage"),
            wordMeaning: document.getElementById("wordMeaning"),
            closeModal: document.getElementById("closeModal"),
            copyResults: document.getElementById("copyResults"),
        };
    }

    initializeGame() {
        this.createGuessWord()
        this.createKeyboard()
        this.setupEventListeners()
    }

    createGuessWord() {
        const fragment = document.createDocumentFragment();
        for (let index = 0; index < this.currentWord.length; index++) {
            const tile = document.createElement("div")
            tile.className = "tile"
            // tiles.push(tile)
            fragment.appendChild(tile)
        }
        this.elements.guess_word.replaceChildren(fragment)
    }

    createKeyboard() {
        const fragment = document.createDocumentFragment();

        for (const rowKeys of WordGuess.KEYBOARD_LAYOUT) {
            const keyboardRow = document.createElement("div");
            keyboardRow.className = "keyboard-row";

            for (const key of rowKeys) {
                const keyElement = document.createElement("button");

                keyElement.type = "button";
                keyElement.className = "key";
                keyElement.dataset.key = key;
                keyElement.textContent = key === "BACKSPACE" ? "⌫" : key;

                if (key === "ENTER" || key === "BACKSPACE") {
                    keyElement.classList.add("wide");
                }

                keyElement.addEventListener("click", (event) => {
                    event.preventDefault();
                    this.handleKeyPress(key);
                });

                keyElement.addEventListener("contextmenu", (event) => {
                    event.preventDefault();
                });

                keyboardRow.appendChild(keyElement);
            }

            fragment.appendChild(keyboardRow);
        }

        this.elements.keyboard.replaceChildren(fragment);
    }

    handleKeyPress(key) {
        // if (this.gameEnded || this.isAnimating) {
        //     return;
        // }

        switch (key) {
            case "ENTER":
                this.submitGuess();
                break;

            case "BACKSPACE":
                this.deleteLetter();
                break;

            default:
                this.addLetter(key);
        }
    }

    deleteLetter() {
        if (this.currentGuess.length === 0) {
            return;
        }

        this.currentGuess = this.currentGuess.slice(0, -1);
        this.updateGuess();
    }

    submitGuess() {
        const guess_entry = document.createElement("div")
        guess_entry.className = "guess_entry"
        guess_entry.textContent = this.currentGuess
        this.elements.guesses.appendChild(guess_entry)
        this.currentGuess = "";
    }

    addLetter(letter) {
        this.currentGuess += letter;
        this.updateGuess();
    }

    updateGuess() {
        const fragment = document.createDocumentFragment();
        for (let index = 0; index < this.currentGuess.length; index++) {
            const tile = document.createElement("div")
            tile.textContent = this.currentGuess[index];
            tile.className = "tile"
            // tiles.push(tile)
            fragment.appendChild(tile)
        }
        this.elements.guess_input.replaceChildren(fragment)
    }

    showMessage(text, type = "") {
        clearTimeout(this.messageTimeout);

        this.elements.message.hidden = false;
        this.elements.message.textContent = text;
        this.elements.message.className = `message ${type}`.trim();

        this.messageTimeout = setTimeout(() => {
            this.elements.message.textContent = "";
            this.elements.message.className = "message";
            this.elements.message.hidden = true;
        }, 3000);
    }

    showModal() {
        this.elements.modal.style.display = "block";
    }

    hideModal() {
        this.elements.modal.style.display = "none";
    }

    setupEventListeners() {
        document.addEventListener("keydown", (event) => {
            const key = event.key.toUpperCase();

            if (key === "ENTER" || key === "BACKSPACE") {
                this.handleKeyPress(key);
                return;
            }

            if (/^[A-Z]$/.test(key)) {
                this.handleKeyPress(key);
            }
        });

        this.elements.closeModal.addEventListener("click", () => {
            this.hideModal();
        });

        // this.elements.copyResults.addEventListener("click", () => {
        //     this.copyResults();
        // });

        window.addEventListener("click", (event) => {
            if (event.target === this.elements.modal) {
                this.hideModal();
            }
        });
    }
}

async function loadDailyWordConfig() {
    const response = await fetch(`${CONFIG_URL}?t=${Date.now()}`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(
            `Could not load daily word configuration: ${response.status}`
        );
    }

    const config = await response.json();

    if (!config.TODAY_WORD) {
        throw new Error("The Gist does not contain TODAY_WORD.");
    }

    if (!Number.isInteger(Number(config.MAX_ATTEMPTS))) {
        throw new Error("The Gist contains an invalid MAX_ATTEMPTS.");
    }

    return config;
}

const CONFIG_URL = "https://gist.githubusercontent.com/jltwiao/ec0ed2f1aeb966f5f78ffab13a3e2959/raw/bible-wordle.json";

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const config = await loadDailyWordConfig();
        new WordGuess(config);
    } catch (error) {
        console.error("Could not start grab config:", error);

        const message = document.getElementById("message");

        if (message) {
            message.hidden = false;
            message.className = "message error";
            message.textContent = "Could not load config.";
        }
    }
});