const characterList = document.getElementById("characterList");
const searchInput = document.getElementById("searchInput");
const statusMessage = document.getElementById("statusMessage");
const characterCount = document.getElementById("characterCount");
const loadMoreButton = document.getElementById("loadMoreButton");

const detailsSection = document.getElementById("detailsSection");
const closeDetails = document.getElementById("closeDetails");
const deleteDetailButton = document.getElementById("deleteDetailButton");

const addCharacterForm = document.getElementById("addCharacterForm");
const formMessage = document.getElementById("formMessage");

let characters = [];
let filteredCharacters = [];
let visibleCount = 9;
let selectedCharacter = null;

// Fetch all characters from the Express API.
async function loadCharacters() {
    try {
        statusMessage.textContent = "Loading characters...";

        const response = await fetch("/api/items");

        if (!response.ok) {
            throw new Error("Unable to load characters.");
        }

        characters = await response.json();
        filteredCharacters = characters;

        characterCount.textContent = characters.length;

        renderCharacters();
    } catch (error) {
        statusMessage.textContent = error.message;
    }
}

// Display the character cards.
function renderCharacters() {
    characterList.innerHTML = "";

    const visibleCharacters = filteredCharacters.slice(0, visibleCount);

    if (visibleCharacters.length === 0) {
        statusMessage.textContent = "No characters found.";
        loadMoreButton.hidden = true;
        return;
    }

    statusMessage.textContent =
        `Showing ${visibleCharacters.length} of ${filteredCharacters.length} characters.`;

    visibleCharacters.forEach(character => {
        const card = document.createElement("div");
        card.className = "character-card";

        if (selectedCharacter?.id === character.id) {
            card.classList.add("selected");
        }

        const name = document.createElement("h3");
        name.textContent = character.name;

        const gender = document.createElement("p");
        gender.textContent = `Gender: ${character.gender}`;

        const height = document.createElement("p");
        height.textContent =
            character.height === "unknown"
                ? "Height: Unknown"
                : `Height: ${character.height} cm`;

        const viewButton = document.createElement("button");
        viewButton.className = "view-button";
        viewButton.textContent = "View Details";

        viewButton.addEventListener("click", () => {
            showDetails(character.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", event => {
            event.stopPropagation();
            deleteCharacter(character.id);
        });

        card.append(name, gender, height, viewButton, deleteButton);

        card.addEventListener("click", () => {
            showDetails(character.id);
        });

        characterList.appendChild(card);
    });

    loadMoreButton.hidden =
        visibleCount >= filteredCharacters.length;
}

// Search characters by name.
function searchCharacters() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    filteredCharacters = characters.filter(character =>
        character.name.toLowerCase().includes(searchTerm)
    );

    visibleCount = 9;

    renderCharacters();
}

// Display details for one character.
async function showDetails(id) {
    try {
        const response = await fetch(`/api/items/${id}`);

        if (!response.ok) {
            throw new Error("Character details could not be loaded.");
        }

        const character = await response.json();

        selectedCharacter = character;

        document.getElementById("detailName").textContent = character.name;

        document.getElementById("detailHeight").textContent =
            character.height === "unknown"
                ? "Unknown"
                : `${character.height} cm`;

        document.getElementById("detailMass").textContent =
            character.mass === "unknown"
                ? "Unknown"
                : `${character.mass} kg`;

        document.getElementById("detailGender").textContent =
            character.gender;

        document.getElementById("detailHomeworld").textContent =
            await getHomeworld(character.homeworld);

        detailsSection.hidden = false;

        renderCharacters();

        detailsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    } catch (error) {
        statusMessage.textContent = error.message;
    }
}

// Fetch the character's homeworld.
async function getHomeworld(url) {
    if (!url || url === "unknown") {
        return "Unknown";
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return "Unknown";
        }

        const planet = await response.json();

        return planet.name;
    } catch (error) {
        return "Unknown";
    }
}

// Delete a character through the DELETE endpoint.
async function deleteCharacter(id) {
    const character = characters.find(item => item.id === id);

    if (!character) {
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to delete ${character.name}?`
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`/api/items/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Unable to delete character.");
        }

        characters = characters.filter(item => item.id !== id);

        if (selectedCharacter?.id === id) {
            selectedCharacter = null;
            detailsSection.hidden = true;
        }

        searchCharacters();

        characterCount.textContent = characters.length;

        statusMessage.textContent =
            `${character.name} was deleted successfully.`;
    } catch (error) {
        statusMessage.textContent = error.message;
    }
}

// Add a character through the POST endpoint.
addCharacterForm.addEventListener("submit", async event => {
    event.preventDefault();

    formMessage.textContent = "";

    const formData = new FormData(addCharacterForm);

    const character = {
        name: formData.get("name").trim(),
        height: formData.get("height").trim(),
        mass: formData.get("mass").trim(),
        gender: formData.get("gender").trim(),
        homeworld: formData.get("homeworld").trim()
    };

    try {
        const response = await fetch("/api/items", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(character)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Unable to add character.");
        }

        characters.push(result);

        searchInput.value = "";
        filteredCharacters = characters;
        visibleCount = 9;

        characterCount.textContent = characters.length;

        renderCharacters();

        addCharacterForm.reset();

        formMessage.textContent =
            `${result.name} was added successfully.`;

        statusMessage.textContent =
            "Character list updated successfully.";
    } catch (error) {
        formMessage.textContent = error.message;
    }
});

// Search as the user types.
searchInput.addEventListener("input", searchCharacters);

// Show more characters.
loadMoreButton.addEventListener("click", () => {
    visibleCount += 9;
    renderCharacters();
});

// Close the details panel.
closeDetails.addEventListener("click", () => {
    detailsSection.hidden = true;
    selectedCharacter = null;
    renderCharacters();
});

// Delete from the details panel.
deleteDetailButton.addEventListener("click", () => {
    if (selectedCharacter) {
        deleteCharacter(selectedCharacter.id);
    }
});

// Start the application.
loadCharacters();
