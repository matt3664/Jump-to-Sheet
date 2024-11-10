document.addEventListener('DOMContentLoaded', function () {
    // Reference to the elements
    const toggleSwitch = document.getElementById('toggle-switch');
    const inputBox1 = document.getElementById('input-box-1');
    const lineCount1 = document.getElementById('line-count-1');
    const inputBox2 = document.getElementById('input-box-2');
    const lineCount2 = document.getElementById('line-count-2');
    const statusMessage = document.getElementById('status-message');

    // Check if elements are found
    if (!toggleSwitch) {
        console.error('toggleSwitch not found in DOM');
        return;
    }
    if (!inputBox1 || !lineCount1 || !inputBox2 || !lineCount2 || !statusMessage) {
        console.error('One or more elements not found in DOM');
        return;
    }

    // Function to update sheet number count
    function updateSheetNumberCount(textarea, lineCountElement) {
        const lines = textarea.value.split('\n').filter(line => line.trim() !== '').length;
        lineCountElement.textContent = `${lines} ${lines === 1 ? 'sheet number' : 'sheet numbers'}`;
        return lines; // Return the line count for further comparison
    }

    // Function to update link count
    function updateLinkCount(textarea, lineCountElement) {
        const lines = textarea.value.split('\n').filter(line => line.trim() !== '').length;
        lineCountElement.textContent = `${lines} ${lines === 1 ? 'link' : 'links'}`;
        return lines; // Return the line count for further comparison
    }

    // Function to update status message based on line counts
    function updateStatusMessage(count1, count2) {
        if (count1 > 0 && count2 > 0) { // Only show the message if both counts are greater than 0
            statusMessage.style.visibility = "visible";
            if (count1 === count2) {
                statusMessage.textContent = "Number of sheet numbers are equal to number of links.";
                statusMessage.style.color = "#4CAF50";
            } else {
                statusMessage.textContent = "Number of sheet numbers are not equal to number of links.";
                statusMessage.style.color = "lightcoral";
            }
        } else {
            statusMessage.style.visibility = "hidden"; // Hide the message if either count is 0
        }
    }

    // Initialize the toggle switch and load saved data
    chrome.storage.local.get(['extensionEnabled', 'keysText', 'linksText'], (result) => {
        toggleSwitch.checked = result.extensionEnabled || false;
        console.log('Loaded extensionEnabled:', toggleSwitch.checked);
        inputBox1.value = result.keysText || '';
        inputBox2.value = result.linksText || '';

        // Initial line count and status update
        const count1 = updateSheetNumberCount(inputBox1, lineCount1);
        const count2 = updateLinkCount(inputBox2, lineCount2);
        updateStatusMessage(count1, count2);
    });

    // Update the extension state when the toggle is clicked
    toggleSwitch.addEventListener('change', () => {
        chrome.storage.local.set({ extensionEnabled: toggleSwitch.checked }, () => {
            console.log('Saved extensionEnabled:', toggleSwitch.checked);
        });
    });

    // Event listeners to update line count and status message on input
    inputBox1.addEventListener('input', () => {
        chrome.storage.local.set({ keysText: inputBox1.value });
        const count1 = updateSheetNumberCount(inputBox1, lineCount1);
        const count2 = updateLinkCount(inputBox2, lineCount2);
        updateStatusMessage(count1, count2);
    });

    inputBox2.addEventListener('input', () => {
        chrome.storage.local.set({ linksText: inputBox2.value });
        const count1 = updateSheetNumberCount(inputBox1, lineCount1);
        const count2 = updateLinkCount(inputBox2, lineCount2);
        updateStatusMessage(count1, count2);
    });

    // Help link event listener
    const linksHelpLink = document.getElementById('links-help');
    if (linksHelpLink) {
        linksHelpLink.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('help.html') });
        });
    } else {
        console.error('links-help element not found in DOM');
    }
});
