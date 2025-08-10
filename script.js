// A simple function to format the current date
const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
};

// Get the date string for the current day to use as a key in local storage
const getCurrentDateString = () => {
    const today = new Date();
    return today.toISOString().slice(0, 10); // Format as YYYY-MM-DD
};

// Array of the five daily prayers
const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

// Get references to the HTML elements
const dateDisplay = document.getElementById('current-date');
const prayerList = document.getElementById('prayer-list');

// This object will hold the completion status for today's prayers
let todayTracker = {};
const storageKey = `namaazTracker-${getCurrentDateString()}`;

// Function to save the current tracker state to local storage
const saveProgress = () => {
    try {
        localStorage.setItem(storageKey, JSON.stringify(todayTracker));
    } catch (e) {
        console.error("Could not save to local storage", e);
    }
};

// Function to load progress from local storage
const loadProgress = () => {
    try {
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
            todayTracker = JSON.parse(storedData);
        } else {
            // If no data exists for today, initialize with all prayers as not completed
            prayers.forEach(prayer => todayTracker[prayer] = false);
        }
    } catch (e) {
        console.error("Could not load from local storage", e);
        // Fallback to initializing prayers if loading fails
        prayers.forEach(prayer => todayTracker[prayer] = false);
    }
};

// Function to render the prayer list on the page
const renderPrayerList = () => {
    // Clear any existing list items
    prayerList.innerHTML = '';
    
    // Create a list item for each prayer
    prayers.forEach(prayer => {
        const li = document.createElement('li');
        li.classList.add('prayer-item');
        li.dataset.prayer = prayer;

        // Check if the prayer is completed and add the 'completed' class
        if (todayTracker[prayer]) {
            li.classList.add('completed');
        }

        // Create the prayer name element
        const prayerName = document.createElement('span');
        prayerName.classList.add('prayer-name');
        prayerName.textContent = prayer;
        
        // Create the checkbox element
        const checkbox = document.createElement('div');
        checkbox.classList.add('checkbox');
        if (todayTracker[prayer]) {
            checkbox.classList.add('checked');
        }

        li.appendChild(prayerName);
        li.appendChild(checkbox);
        prayerList.appendChild(li);
    });
};

// Event listener for clicks on the prayer list
prayerList.addEventListener('click', (event) => {
    // Find the closest list item to the clicked element
    const item = event.target.closest('.prayer-item');
    if (!item) return; // If the click wasn't on a prayer item, do nothing

    const prayerName = item.dataset.prayer;
    
    // Toggle the completion status for the clicked prayer
    todayTracker[prayerName] = !todayTracker[prayerName];

    // Toggle the 'completed' and 'checked' classes
    item.classList.toggle('completed', todayTracker[prayerName]);
    item.querySelector('.checkbox').classList.toggle('checked', todayTracker[prayerName]);
    
    // Save the updated progress to local storage
    saveProgress();
});

// Initial setup on page load
window.onload = () => {
    // Display the current date
    dateDisplay.textContent = formatDate(new Date());
    
    // Load existing progress or initialize for the day
    loadProgress();
    
    // Render the initial list
    renderPrayerList();
};

