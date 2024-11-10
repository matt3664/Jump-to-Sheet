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

    // Create container for the input box
    const inputContainer = document.createElement("div");
    inputContainer.style.position = "fixed";
    inputContainer.style.bottom = "23px";
    inputContainer.style.right = "120px";
    inputContainer.style.zIndex = "1000";
    inputContainer.style.display = "flex";
    inputContainer.style.flexDirection = "column";
    inputContainer.style.alignItems = "flex-end";
    document.body.appendChild(inputContainer);

    // Create wrapper for input
    const inputWrapper = document.createElement("div");
    inputWrapper.style.position = "relative"; // So that the tooltip can be positioned
    inputContainer.appendChild(inputWrapper);

    // Create the input box
    const inputBox = document.createElement("input");
    inputBox.type = "text";
    inputBox.placeholder = "Enter Sheet # ...";
    inputBox.style.fontSize = "16px";
    inputBox.style.height = "40px"; // Adjust the height as desired
    inputBox.style.lineHeight = "40px";
    inputBox.style.border = "1px solid #ccc";
    inputBox.style.borderRadius = "5px";
    inputBox.style.boxSizing = "border-box"; // Ensure padding is included in width
    inputBox.style.width = "165px"; // Adjust width as needed
    inputWrapper.appendChild(inputBox);

    // Create a tooltip element
    const tooltip = document.createElement('div');
    tooltip.textContent = "Shortcut: Ctrl+Shift+S"; // Updated tooltip text
    tooltip.style.position = 'absolute';
    tooltip.style.padding = '5px 10px';
    tooltip.style.backgroundColor = '#333';
    tooltip.style.color = '#fff';
    tooltip.style.borderRadius = '5px';
    tooltip.style.fontSize = '14px';
    tooltip.style.whiteSpace = 'nowrap';
    tooltip.style.opacity = '0'; // Start hidden
    tooltip.style.transition = 'opacity 0.3s';
    tooltip.style.pointerEvents = 'none'; // So it doesn't interfere with mouse events
    tooltip.style.zIndex = '1001'; // Above other elements
    document.body.appendChild(tooltip);

    // Variable to store the tooltip timeout
    let tooltipTimeout;

    // Event listeners for showing/hiding the tooltip
    inputBox.addEventListener('mouseenter', () => {
        tooltipTimeout = setTimeout(() => {
            // Position the tooltip
            const inputRect = inputBox.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();

            // Calculate position (above the input box)
            const tooltipX = inputRect.left + (inputRect.width - tooltipRect.width) / 2;
            const tooltipY = inputRect.top - tooltipRect.height - 5; // 5px above the input box

            tooltip.style.left = tooltipX + 'px';
            tooltip.style.top = tooltipY + 'px';
            tooltip.style.opacity = '1';
        }, 1000); // Delay of 1 second
    });

    inputBox.addEventListener('mouseleave', () => {
        clearTimeout(tooltipTimeout);
        tooltip.style.opacity = '0';
    });

    // Hide the tooltip when the input box gains focus
    inputBox.addEventListener('focus', () => {
        clearTimeout(tooltipTimeout);
        tooltip.style.opacity = '0';
    });

    // Create a dropdown for suggestions
    const dropdown = document.createElement("div");
    dropdown.style.position = "absolute";
    dropdown.style.bottom = inputBox.offsetHeight + "px"; // Position above the input box without gap
    dropdown.style.right = "0px";
    dropdown.style.width = inputBox.offsetWidth + "px"; // Set dropdown width to match input box
    dropdown.style.zIndex = "1000";
    dropdown.style.backgroundColor = "#fff";
    dropdown.style.border = "1px solid #ccc";
    dropdown.style.borderRadius = "5px";
    dropdown.style.maxHeight = "165px"; // Adjust max height as needed
    dropdown.style.overflowY = "auto";
    dropdown.style.display = "none";
    dropdown.style.fontSize = "16px";
    dropdown.style.boxSizing = "border-box";
    inputContainer.appendChild(dropdown);

    // Update dropdown width when window is resized
    window.addEventListener("resize", () => {
        dropdown.style.width = inputBox.offsetWidth + "px";
    });

    // Parse keyLinks from stored keysText and linksText
    const keyLinks = parseKeyLinks(result.keysText || '', result.linksText || '');

    let currentSelectionIndex = -1; // Track the selected item in the dropdown

    // Detect Ctrl+Shift+S to focus on the input box
    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "s") {
            inputBox.focus();
            event.preventDefault(); // Prevent any default action of Ctrl+Shift+S
        }
    });

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
                    option.style.padding = "8px";
                    option.style.cursor = "pointer";
                    option.style.fontSize = "16px";
                    option.style.boxSizing = "border-box";
                    option.dataset.index = index;

                    option.addEventListener("mouseenter", () => {
                        setActiveOption(index);
                    });

                    option.addEventListener("click", () => {
                        inputBox.value = suggestion;
                        dropdown.style.display = "none";
                        inputBox.focus();
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

        if (event.key === "ArrowDown" && options.length > 0) {
            event.preventDefault();
            currentSelectionIndex = (currentSelectionIndex + 1) % options.length;
            setActiveOption(currentSelectionIndex);
        }

        if (event.key === "ArrowUp" && options.length > 0) {
            event.preventDefault();
            currentSelectionIndex = (currentSelectionIndex - 1 + options.length) % options.length;
            setActiveOption(currentSelectionIndex);
        }

        if (event.key === "Enter") {
            event.preventDefault();
            if (currentSelectionIndex >= 0 && options.length > 0) {
                const selectedOption = options[currentSelectionIndex];
                inputBox.value = selectedOption.textContent;
                dropdown.style.display = "none";
                currentSelectionIndex = -1;
            }

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
});
