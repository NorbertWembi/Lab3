const express = require("express");
const path = require("path");

const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(logger);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const API_URL = "https://swapi.info/api/people";

let characters = [];
let nextId = 1;
let dataLoaded = false;

// Load the original characters from SWAPI.
async function loadCharacters() {
    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error("Could not load characters from SWAPI.");
    }

    const data = await response.json();

    characters = data.map(character => ({
        id: Number(character.url.split("/").filter(Boolean).pop()),
        name: character.name,
        height: character.height,
        mass: character.mass,
        gender: character.gender,
        homeworld: character.homeworld
    }));

    nextId = Math.max(...characters.map(character => character.id)) + 1;
    dataLoaded = true;
}

// Load the data only once.
async function ensureCharactersLoaded() {
    if (!dataLoaded) {
        await loadCharacters();
    }
}

// GET: Retrieve all characters.
app.get("/api/items", async (req, res, next) => {
    try {
        await ensureCharactersLoaded();
        res.json(characters);
    } catch (error) {
        next(error);
    }
});

// GET: Retrieve one character by ID.
app.get("/api/items/:id", async (req, res, next) => {
    try {
        await ensureCharactersLoaded();

        const id = Number(req.params.id);

        const character = characters.find(item => item.id === id);

        if (!character) {
            return res.status(404).json({
                error: "Character not found."
            });
        }

        res.json(character);
    } catch (error) {
        next(error);
    }
});

// POST: Create a new character record.
app.post("/api/items", async (req, res, next) => {
    try {
        await ensureCharactersLoaded();

        const { name, height, mass, gender, homeworld } = req.body;

        const fields = [name, height, mass, gender, homeworld];

        const validFields = fields.every(field =>
            typeof field === "string" && field.trim() !== ""
        );

        if (!validFields) {
            const error = new Error(
                "All fields must be non-empty strings."
            );

            error.status = 400;
            return next(error);
        }

        const character = {
            id: nextId++,
            name: name.trim(),
            height: height.trim(),
            mass: mass.trim(),
            gender: gender.trim(),
            homeworld: homeworld.trim()
        };

        characters.push(character);

        res.status(201).json(character);
    } catch (error) {
        next(error);
    }
});

// DELETE: Remove a character by ID.
app.delete("/api/items/:id", async (req, res, next) => {
    try {
        await ensureCharactersLoaded();

        const id = Number(req.params.id);

        const index = characters.findIndex(item => item.id === id);

        if (index === -1) {
            return res.status(404).json({
                error: "Character not found."
            });
        }

        const deletedCharacter = characters.splice(index, 1)[0];

        res.json({
            message: "Character deleted successfully.",
            character: deletedCharacter
        });
    } catch (error) {
        next(error);
    }
});

// Handle unknown routes.
app.use((req, res) => {
    res.status(404).json({
        error: "The requested route does not exist."
    });
});

// Centralized error handling.
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`HottizaPace is running on port ${PORT}`);
});