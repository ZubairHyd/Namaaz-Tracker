// --- Core Data and State Management ---

// A single object to store all application data in local storage
// The key for local storage. This will store an object of all daily records.
const STORAGE_KEY = 'namaazTrackerData';

// This is our main data structure. It will be an object where keys are YYYY-MM-DD date strings.
// The value for each key is an object containing the prayer status for that day.
let namaazData = {};

// Points configuration
const PRAYER_POINTS = {
    'jamaat': 5,
    'individual': 3,
    'qaza': 2,
    'none': 0
};
const FRIDAY_JUMA_POINTS = 10; // Special points for Friday Juma prayer

// The current date being viewed in the daily view
let currentDailyViewDate = new Date();
let currentMonthlyViewDate = new Date();
let currentYearlyViewDate = new Date();

// --- DOM Element References ---
const navTabs = document.querySelector('.nav-tabs');
const dailyView = document.getElementById('daily-view');
const monthlyView = document.getElementById('monthly-view');
const yearlyView = document.getElementById('yearly-view');
const totalPointsSpan = document.getElementById('total-points');
const currentStreakSpan = document.getElementById('current-streak');
const dailyDateHeader = document.getElementById('daily-date');
const prayerTrackerDiv = document.getElementById('prayer-tracker');
const calendarGrid = document.getElementById('calendar-grid');
const monthlyTitle = document.getElementById('monthly-title');
const yearlyTitle = document.getElementById('yearly-title');
const yearlyCalendarGrid = document.getElementById('yearly-calendar-grid');
const prayerModal = document.getElementById('prayer-modal');
const modalDate = document.getElementById('modal-date');
const modalPrayerName = document.getElementById('modal-prayer-name');
const modalSaveButton = document.getElementById('modal-save-button');
const modalCloseButton = document.querySelector('.modal .close-button');

// --- Utility Functions ---

// Formats a date object to a YYYY-MM-DD string for data keys
const formatDateKey = (date) => date.toISOString().slice(0, 10);

// Formats a date object to a readable string
const formatReadableDate = (date) => date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

// --- Data Persistence Functions ---

// Saves the entire namaazData object to local storage
const saveNamaazData = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(namaazData));
    } catch (e) {
        console.error("Could not save to local storage", e);
    }
};

// Loads data from local storage on startup
const loadNamaazData = () => {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            namaazData = JSON.parse(storedData);
        } else {
            namaazData = {}; // Initialize as an empty object if no data exists
        }
    } catch (e) {
        console.error("Could not load from local storage", e);
        namaazData = {};
    }
};

// --- View and Display Functions ---

// Updates the stats display (total points and streak)
const updateStats = () => {
    let totalPoints = 0;
    let currentStreak = 0;
    let lastDateHadNamaaz = null;

    const sortedDates = Object.keys(namaazData).sort();
    
    // Calculate total points
    sortedDates.forEach(date => {
        const dailyData = namaazData[date];
        for (const prayer in dailyData) {
            if (dailyData[prayer].status !== 'none') {
                 // Check if it's Friday and Dhuhr/Juma prayer
                const day = new Date(date);
                if (day.getDay() === 5 && prayer === 'Dhuhr') {
                    totalPoints += FRIDAY_JUMA_POINTS;
                } else {
                    totalPoints += dailyData[prayer].points;
                }
            }
        }
    });

    // Calculate streak
    let currentDay = new Date();
    currentDay.setHours(0, 0, 0, 0); // Normalize to start of day
    let streakCount = 0;

    for(let i = 0; i < sortedDates.length; i++) {
        const dateKey = formatDateKey(currentDay);
        const dayRecord = namaazData[dateKey];
        if (dayRecord) {
             // Check if all 5 prayers are completed for the day
            const prayersCompleted = Object.values(dayRecord).filter(p => p.status !== 'none').length;
            if (prayersCompleted === 5) {
                streakCount++;
                currentDay.setDate(currentDay.getDate() - 1);
            } else {
                break;
            }
        } else {
            break;
        }
    }
    
    currentStreak = streakCount;

    totalPointsSpan.textContent = totalPoints;
    currentStreakSpan.textContent = currentStreak;
};


// Renders the daily view for a specific date
const renderDailyView = (date) => {
    const dateKey = formatDateKey(date);
    dailyDateHeader.textContent = formatReadableDate(date);
    prayerTrackerDiv.innerHTML = '';
    
    // Check if there's data for this date, otherwise initialize it
    if (!namaazData[dateKey]) {
        namaazData[dateKey] = {};
        ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach(prayer => {
            namaazData[dateKey][prayer] = { status: 'none', points: 0 };
        });
    }

    const todayData = namaazData[dateKey];

    // Create the prayer items
    for (const prayer in todayData) {
        const prayerStatus = todayData[prayer].status;
        const prayerItem = document.createElement('div');
        prayerItem.classList.add('prayer-item');

        const prayerContent = document.createElement('div');
        prayerContent.classList.add('prayer-item-content');
        prayerContent.innerHTML = `
            <h4>${prayer}</h4>
            <p>Status: ${prayerStatus}</p>
        `;
        
        const logButton = document.createElement('button');
        logButton.classList.add('log-button');
        logButton.dataset.prayer = prayer;
        logButton.dataset.date = dateKey;
        logButton.textContent = prayerStatus !== 'none' ? 'Logged' : 'Log Prayer';
        if (prayerStatus !== 'none') {
            logButton.classList.add('logged');
        }
        
        prayerItem.appendChild(prayerContent);
        prayerItem.appendChild(logButton);
        prayerTrackerDiv.appendChild(prayerItem);
    }
};

// Renders the monthly view for a specific month
const renderMonthlyView = (date) => {
    monthlyTitle.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    calendarGrid.innerHTML = '';
    
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Add empty days for the preceding month
    const startDay = firstDayOfMonth.getDay();
    for (let i = 0; i < startDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('day', 'empty');
        calendarGrid.appendChild(emptyDay);
    }

    // Add days of the current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const day = document.createElement('div');
        day.classList.add('day');
        
        const dayDate = new Date(year, month, i);
        const dateKey = formatDateKey(dayDate);
        const dailyData = namaazData[dateKey];
        
        const prayerCount = dailyData ? Object.values(dailyData).filter(p => p.status !== 'none').length : 0;
        const completionPercentage = (prayerCount / 5) * 100;

        day.dataset.date = dateKey;
        day.innerHTML = `
            <span class="day-number">${i}</span>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${completionPercentage}%;"></div>
            </div>
        `;
        
        const progressBar = day.querySelector('.progress-bar');
        if (completionPercentage === 100) {
            progressBar.classList.add('completed');
        }

        if (formatDateKey(dayDate) === formatDateKey(new Date())) {
            day.classList.add('today');
        }
        
        day.addEventListener('click', () => {
            showModal(dayDate);
        });

        calendarGrid.appendChild(day);
    }
};

// Renders the yearly view
const renderYearlyView = (date) => {
    yearlyTitle.textContent = date.getFullYear();
    yearlyCalendarGrid.innerHTML = '';
    
    for (let month = 0; month < 12; month++) {
        const monthCard = document.createElement('div');
        monthCard.classList.add('month-card');
        
        const monthTitle = document.createElement('h3');
        monthTitle.textContent = new Date(date.getFullYear(), month).toLocaleDateString('en-US', { month: 'long' });
        monthCard.appendChild(monthTitle);
        
        const monthlyCalendar = document.createElement('div');
        monthlyCalendar.classList.add('calendar-grid');

        const firstDayOfMonth = new Date(date.getFullYear(), month, 1);
        const lastDayOfMonth = new Date(date.getFullYear(), month + 1, 0);
        const startDay = firstDayOfMonth.getDay();
        
        // Add empty days
        for (let i = 0; i < startDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('day', 'empty');
            monthlyCalendar.appendChild(emptyDay);
        }

        // Add days of the current month
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            const day = document.createElement('div');
            day.classList.add('day');
            
            const dayDate = new Date(date.getFullYear(), month, i);
            const dateKey = formatDateKey(dayDate);
            const dailyData = namaazData[dateKey];
            
            const prayerCount = dailyData ? Object.values(dailyData).filter(p => p.status !== 'none').length : 0;
            day.innerHTML = `<span class="day-number">${i}</span><span class="day-points">${prayerCount}/5</span>`;
            if (formatDateKey(dayDate) === formatDateKey(new Date())) {
                day.classList.add('today');
            }
            day.addEventListener('click', () => {
                showModal(dayDate);
            });
            monthlyCalendar.appendChild(day);
        }
        
        monthCard.appendChild(monthlyCalendar);
        yearlyCalendarGrid.appendChild(monthCard);
    }
};


// Shows a specific view and hides the others
const showView = (viewName) => {
    const views = {
        'daily': dailyView,
        'monthly': monthlyView,
        'yearly': yearlyView
    };

    // Hide all views
    Object.values(views).forEach(view => view.classList.remove('active-view'));

    // Show the requested view
    const activeView = views[viewName];
    if (activeView) {
        activeView.classList.add('active-view');
        // Re-render the correct view
        if (viewName === 'daily') renderDailyView(currentDailyViewDate);
        if (viewName === 'monthly') renderMonthlyView(currentMonthlyViewDate);
        if (viewName === 'yearly') renderYearlyView(currentYearlyViewDate);
    }

    // Update active nav tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === viewName);
    });
};

// --- Modal Functions ---

// Show the prayer logging modal
const showModal = (date, prayerName) => {
    prayerModal.style.display = 'flex';
    modalDate.textContent = formatReadableDate(date);
    modalPrayerName.textContent = prayerName;

    const dateKey = formatDateKey(date);
    const prayerStatus = namaazData[dateKey]?.[prayerName]?.status || 'none';
    
    // Pre-select the correct radio button
    const radioButtons = prayerModal.querySelectorAll('input[name="prayer-status"]');
    radioButtons.forEach(radio => {
        if (radio.value === prayerStatus) {
            radio.checked = true;
        } else {
            radio.checked = false;
        }
    });

    // Store the date and prayer in a dataset for the save button
    modalSaveButton.dataset.date = dateKey;
    modalSaveButton.dataset.prayer = prayerName;
};

// --- Event Handlers ---

// This function is no longer needed since we handle saving via the modal
const handleSaveDailyProgress = () => {
    // This is now handled by modal saves
    saveNamaazData();
    updateStats();
    renderDailyView(currentDailyViewDate);
};

// Handles click on a daily prayer item's log button
const handlePrayerItemClick = (event) => {
    // We now only want to handle clicks on the "log-button"
    const logButton = event.target.closest('.log-button');
    if (logButton) {
        const prayer = logButton.dataset.prayer;
        const dateKey = logButton.dataset.date;
        const prayerDate = new Date(dateKey);
        showModal(prayerDate, prayer);
    }
};

// Handles saving from the modal
const handleModalSave = () => {
    const dateKey = modalSaveButton.dataset.date;
    const prayerName = modalSaveButton.dataset.prayer;
    const selectedStatus = prayerModal.querySelector('input[name="prayer-status"]:checked')?.value || 'none';
    const points = PRAYER_POINTS[selectedStatus];

    // Check for Friday Dhuhr/Juma prayer
    const prayerDate = new Date(dateKey);
    const isFriday = prayerDate.getDay() === 5;
    const isDhuhr = prayerName === 'Dhuhr';

    namaazData[dateKey][prayerName].status = selectedStatus;
    namaazData[dateKey][prayerName].points = isFriday && isDhuhr ? FRIDAY_JUMA_POINTS : points;

    saveNamaazData();
    updateStats();
    
    // If we're on the daily view, update it
    if (document.getElementById('daily-view').classList.contains('active-view')) {
        renderDailyView(currentDailyViewDate);
    }
    // If we're on the monthly view, update it
    if (document.getElementById('monthly-view').classList.contains('active-view')) {
        renderMonthlyView(currentMonthlyViewDate);
    }
    // If we're on the yearly view, update it
    if (document.getElementById('yearly-view').classList.contains('active-view')) {
        renderYearlyView(currentYearlyViewDate);
    }

    prayerModal.style.display = 'none';
};

// --- Initial Setup and Event Listeners ---
window.onload = () => {
    loadNamaazData();
    updateStats();
    showView('daily'); // Start on the daily view

    // Navigation tab listeners
    navTabs.addEventListener('click', (event) => {
        if (event.target.classList.contains('nav-tab')) {
            showView(event.target.dataset.view);
        }
    });

    // Daily view navigation
    document.getElementById('prev-day').addEventListener('click', () => {
        currentDailyViewDate.setDate(currentDailyViewDate.getDate() - 1);
        renderDailyView(currentDailyViewDate);
    });
    document.getElementById('next-day').addEventListener('click', () => {
        currentDailyViewDate.setDate(currentDailyViewDate.getDate() + 1);
        renderDailyView(currentDailyViewDate);
    });
    prayerTrackerDiv.addEventListener('click', handlePrayerItemClick);
    document.getElementById('save-daily-progress').addEventListener('click', handleSaveDailyProgress);

    // Monthly view navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonthlyViewDate.setMonth(currentMonthlyViewDate.getMonth() - 1);
        renderMonthlyView(currentMonthlyViewDate);
    });
    document.getElementById('next-month').addEventListener('click', () => {
        currentMonthlyViewDate.setMonth(currentMonthlyViewDate.getMonth() + 1);
        renderMonthlyView(currentMonthlyViewDate);
    });

    // Yearly view navigation
    document.getElementById('prev-year').addEventListener('click', () => {
        currentYearlyViewDate.setFullYear(currentYearlyViewDate.getFullYear() - 1);
        renderYearlyView(currentYearlyViewDate);
    });
    document.getElementById('next-year').addEventListener('click', () => {
        currentYearlyViewDate.setFullYear(currentYearlyViewDate.getFullYear() + 1);
        renderYearlyView(currentYearlyViewDate);
    });

    // Modal listeners
    modalCloseButton.addEventListener('click', () => {
        prayerModal.style.display = 'none';
    });
    modalSaveButton.addEventListener('click', handleModalSave);

    window.addEventListener('click', (event) => {
        if (event.target === prayerModal) {
            prayerModal.style.display = 'none';
        }
    });
};
