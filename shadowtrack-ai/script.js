// Local FastAPI server endpoint link setup matching port 8000
const API_URL = "http://127.0.0.1:8000/analyze-meal";

// Target Constraints (OMAD Optimization setup)
const dailyCalTarget = 2000;
const dailyProtTarget = 130;

// Application State Structure - Fix: Static key for uniform calendar tracking representation
let trackingData = {}; 
let todayDateKey = "2026-06-14"; // Synced perfectly with the current date layout context

// DOM Element Registry Setup
const fileInput = document.getElementById('imageUpload');
const fileChosenLabel = document.getElementById('file-chosen');
const analyzeBtn = document.getElementById('analyzeBtn');
const calendarGrid = document.getElementById('calendarGrid');

// File Upload Event Controller
fileInput.addEventListener('change', function() {
    fileChosenLabel.textContent = this.files[0] ? this.files[0].name : "No file chosen";
});

// Primary Controller Strategy: Upload Action Interface
analyzeBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
        alert("Please choose a meal image file first!");
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Processing Meal via AI...";

    const formData = new FormData();
    formData.append("file", file);

    try {
        // FastAPI Backend Network Pipeline Call
        const response = await fetch(API_URL, {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("Server transmission error occurred.");
        
        const result = await response.json();
        
        if (result.status === "success") {
            const rawData = JSON.parse(result.data);
            updateDailyLog(rawData.calories, rawData.protein_grams);
        } else {
            alert("Analysis execution failure.");
        }

    } catch (error) {
        console.error("Error connecting to Python backend:", error);
        alert("An unexpected logic error occurred.");
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "Analyze with Gemini";
    }
});

// State Data Mutator Matrix Management
function updateDailyLog(calories, protein) {
    if (!trackingData[todayDateKey]) {
        trackingData[todayDateKey] = { calories: 0, protein: 0 };
    }

    // Cumulative incremental updates
    trackingData[todayDateKey].calories += calories;
    trackingData[todayDateKey].protein += protein;

    // Render operational displays
    renderLiveProgress();
    generateGridCalendar();
}

// Live Dashboard Render Pipeline Execution
function renderLiveProgress() {
    const today = trackingData[todayDateKey] || { calories: 0, protein: 0 };
    
    document.getElementById('current-cal').textContent = today.calories;
    document.getElementById('current-prot').textContent = today.protein;

    const calPercent = Math.min((today.calories / dailyCalTarget) * 100, 100);
    const protPercent = Math.min((today.protein / dailyProtTarget) * 100, 100);

    document.getElementById('cal-progress').style.width = `${calPercent}%`;
    document.getElementById('prot-progress').style.width = `${protPercent}%`;
}

// Automated Month Generation View Pipeline Strategy
function generateGridCalendar() {
    calendarGrid.innerHTML = "";
    const totalDaysInMonth = 30; 
    
    for (let day = 1; day <= totalDaysInMonth; day++) {
        const currentStringDay = day < 10 ? `0${day}` : `${day}`;
        const simulatedDateKey = `2026-06-${currentStringDay}`; 
        
        const dayRecord = trackingData[simulatedDateKey] || { calories: 0, protein: 0 };

        const dayCard = document.createElement('div');
        dayCard.className = "calendar-day";
        dayCard.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="day-stats">
                <div class="day-cal">${dayRecord.calories > 0 ? dayRecord.calories + ' c' : ''}</div>
                <div class="day-prot">${dayRecord.protein > 0 ? dayRecord.protein + ' g' : ''}</div>
            </div>
        `;
        calendarGrid.appendChild(dayCard);
    }
}

// Initializing Dashboard Environment
generateGridCalendar();
renderLiveProgress();