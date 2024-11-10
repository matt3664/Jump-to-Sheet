// content.js

// Function to parse text from keys and links into a dictionary
function parseKeyLinks(keysText, linksText) {
    const keys = keysText.split('\n').map(line => line.trim()).filter(line => line);
    const links = linksText.split('\n').map(line => line.trim()).filter(line => line);

    if (keys.length !== links.length) {
        console.warn("Mismatch between number of sheet numbers and links.");
        return {};
    }

    const keyLinks = {};
    for (let i = 0; i < keys.length; i++) {
        keyLinks[keys[i]] = links[i];
    }
    return keyLinks;
}

// Initialize: Check storage to see if extension is enabled and load keyLinks
chrome.storage.local.get(['extensionEnabled', 'keysText', 'linksText'], (result) => {
    if (!result.extensionEnabled) return; // Exit if extension is disabled

    // Create the input box and dropdown if extension is enabled
    const inputBox = document.createElement("input");
    inputBox.type = "text";
    inputBox.placeholder = "Enter sheet # ...";
    inputBox.style.position = "fixed";
    inputBox.style.bottom = "23px";
    inputBox.style.right = "120px";
    inputBox.style.zIndex = "1000";
    inputBox.style.padding = "8px";
    inputBox.style.fontSize = "16px";
    inputBox.style.border = "1px solid #ccc";
    inputBox.style.borderRadius = "5px";
    document.body.appendChild(inputBox);

    // Create a dropdown for suggestions
    const dropdown = document.createElement("div");
    dropdown.style.position = "fixed";
    dropdown.style.bottom = "63px";
    dropdown.style.left = inputBox.getBoundingClientRect().left + "px";
    dropdown.style.width = inputBox.getBoundingClientRect().width + "px";
    dropdown.style.zIndex = "1000";
    dropdown.style.backgroundColor = "#fff";
    dropdown.style.border = "1px solid #ccc";
    dropdown.style.borderRadius = "5px";
    dropdown.style.maxHeight = "150px";
    dropdown.style.overflowY = "auto";
    dropdown.style.display = "none";
    dropdown.style.fontSize = "16px";
    document.body.appendChild(dropdown);

    // Update position and width dynamically in case of window resize
    window.addEventListener("resize", () => {
        dropdown.style.left = inputBox.getBoundingClientRect().left + "px";
        dropdown.style.width = inputBox.getBoundingClientRect().width + "px";
    });

    // Parse keyLinks from stored keysText and linksText
    const keyLinks = parseKeyLinks(result.keysText || '', result.linksText || '');

    let currentSelectionIndex = 0; // Track the selected item in the dropdown

    inputBox.addEventListener("input", () => {
        const query = inputBox.value.trim().toUpperCase();
        dropdown.innerHTML = ""; // Clear previous suggestions
        currentSelectionIndex = 0; // Reset selection index

        if (query) {
            let suggestions = Object.keys(keyLinks).filter(key => key.startsWith(query));
            suggestions = suggestions.slice(0, 4); // Limit to 4 items max

            if (suggestions.length > 0) {
                dropdown.style.display = "block";
                suggestions.forEach((suggestion, index) => {
                    const option = document.createElement("div");
                    option.textContent = suggestion;
                    option.style.padding = "5px";
                    option.style.cursor = "pointer";
                    option.dataset.index = index;

                    option.addEventListener("mouseenter", () => {
                        setActiveOption(index);
                    });

                    option.addEventListener("click", () => {
                        inputBox.value = suggestion;
                        dropdown.style.display = "none";
                    });

                    dropdown.appendChild(option);
                });
            } else {
                dropdown.style.display = "none";
            }
        } else {
            dropdown.style.display = "none";
        }
    });

    inputBox.addEventListener("keydown", (event) => {
        const options = dropdown.querySelectorAll("div");

        if (event.key === "ArrowDown") {
            event.preventDefault();
            currentSelectionIndex = (currentSelectionIndex + 1) % options.length;
            setActiveOption(currentSelectionIndex);
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            currentSelectionIndex = (currentSelectionIndex - 1 + options.length) % options.length;
            setActiveOption(currentSelectionIndex);
        }

        if (event.key === "Enter" && currentSelectionIndex >= 0) {
            event.preventDefault();
            const selectedOption = options[currentSelectionIndex];
            inputBox.value = selectedOption.textContent;
            dropdown.style.display = "none";
            currentSelectionIndex = -1;
        }
    });

    function setActiveOption(index) {
        const options = dropdown.querySelectorAll("div");
        options.forEach((option, i) => {
            if (i === index) {
                option.style.backgroundColor = "gray";
                option.style.color = "white";
            } else {
                option.style.backgroundColor = "";
                option.style.color = "";
            }
        });
    }

    inputBox.addEventListener("keypress", (event) => {
        if (event.key === "Enter" && currentSelectionIndex === -1) {
            const code = inputBox.value.trim().toUpperCase();
            if (keyLinks.hasOwnProperty(code)) {
                window.location.href = keyLinks[code];
            } else {
                alert("Invalid code");
            }
            inputBox.value = ""; // Clear the input field
            dropdown.style.display = "none";
        }
    });
});
