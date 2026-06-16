// 1. TERE RENDER ACTIVE CLOUD BACKEND URL
const API_URL = "https://shadowtrack-backend.onrender.com/analyze-meal";

const dailyCalTarget = 2000;
const dailyProtTarget = 130;

// Persistent Local Memory Engine Storage Pull
let trackingData = {};
try {
    const savedData = localStorage.getItem('shadowTrackData');
    if (savedData) {
        trackingData = JSON.parse(savedData);
    }
} catch (e) {
    console.error("Local storage allocation exception", e);
}

let currentDisplayDate = new Date(); 
const todayDateKey = getFormattedDate(new Date()); 
let selectedDateKey = todayDateKey; 

function getFormattedDate(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const fileInput = document.getElementById('imageUpload');
const fileChosenLabel = document.getElementById('file-chosen');
const analyzeBtn = document.getElementById('analyzeBtn');
const calendarGrid = document.getElementById('calendarGrid');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');

if(fileInput) {
    fileInput.addEventListener('change', function() {
        const count = this.files.length;
        fileChosenLabel.textContent = count > 0 ? `${count} file(s) selected` : "No files chosen";
    });
}

analyzeBtn.addEventListener('click', async () => {
    const uploadedFiles = fileInput.files;
    if (!uploadedFiles || uploadedFiles.length === 0) {
        alert("Please choose at least one meal image file first!");
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = `Analyzing ${uploadedFiles.length} Cam Units...`;

    const formData = new FormData();
    // Appending dynamic array structure mapping perfectly with FastAPI parameter List[UploadFile]
    for (let i = 0; i < uploadedFiles.length; i++) {
        formData.append("files", uploadedFiles[i]);
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Cloud server exception response. Code: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === "success" || result.data) {
            const rawData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
            updateDailyLog(parseInt(rawData.calories || 0), parseInt(rawData.protein_grams || 0));
        } else {
            alert("Analysis execution failure context mismatch.");
        }

    } catch (error) {
        console.error("Network Routing Error:", error);
        alert("Transmission Failed. Your Render cloud backend might be spinning up from sleep mode. Give it 20-30 seconds and try again!");
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "Analyze with Gemini";
    }
});

function updateDailyLog(calories, protein) {
    if (!trackingData[selectedDateKey]) {
        trackingData[selectedDateKey] = { calories: 0, protein: 0 };
    }

    trackingData[selectedDateKey].calories += calories;
    trackingData[selectedDateKey].protein += protein;

    // Direct system secure write lock
    localStorage.setItem('shadowTrackData', JSON.stringify(trackingData));

    renderLiveProgress();
    generateGridCalendar();
}

function renderLiveProgress() {
    const activeRecord = trackingData[selectedDateKey] || { calories: 0, protein: 0 };
    
    document.getElementById('current-cal').textContent = activeRecord.calories;
    document.getElementById('current-prot').textContent = activeRecord.protein;

    const calPercent = Math.min((activeRecord.calories / dailyCalTarget) * 100, 100);
    const protPercent = Math.min((activeRecord.protein / dailyProtTarget) * 100, 100);

    document.getElementById('cal-progress').style.width = `${calPercent}%`;
    document.getElementById('prot-progress').style.width = `${protPercent}%`;
    
    const syncLabel = document.getElementById('current-date-sync');
    if (syncLabel) {
        syncLabel.textContent = selectedDateKey;
    }
}

function generateGridCalendar() {
    calendarGrid.innerHTML = "";
    
    const year = currentDisplayDate.getFullYear();
    const month = currentDisplayDate.getMonth(); 
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('month-year-display').textContent = `${monthNames[month]} ${year}`;
    
    for (let day = 1; day <= totalDaysInMonth; day++) {
        const currentStringDay = String(day).padStart(2, '0');
        const currentStringMonth = String(month + 1).padStart(2, '0');
        const loopDateKey = `${year}-${currentStringMonth}-${currentStringDay}`; 
        
        const dayRecord = trackingData[loopDateKey] || { calories: 0, protein: 0 };

        const dayCard = document.createElement('div');
        dayCard.className = "calendar-day";
        dayCard.style.cursor = "pointer";
        
        if (loopDateKey === selectedDateKey) {
            dayCard.style.border = "2px solid #818cf8"; 
            dayCard.style.background = "#22222a";
        } else if (loopDateKey === todayDateKey) {
            dayCard.style.border = "1px dashed #2dd4bf"; 
        }

        dayCard.innerHTML = `
            <div class="day-number" style="${loopDateKey === selectedDateKey ? 'color:#818cf8; font-weight:bold;' : ''}">${day}</div>
            <div class="day-stats">
                <div class="day-cal">${dayRecord.calories > 0 ? dayRecord.calories + ' c' : ''}</div>
                <div class="day-prot">${dayRecord.protein > 0 ? dayRecord.protein + ' g' : ''}</div>
            </div>
        `;
        
        dayCard.addEventListener('click', () => {
            selectedDateKey = loopDateKey;
            renderLiveProgress();
            generateGridCalendar();
        });

        calendarGrid.appendChild(dayCard);
    }
}

prevMonthBtn.addEventListener('click', () => {
    currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1);
    generateGridCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1);
    generateGridCalendar();
});

// Initialization routine
generateGridCalendar();
renderLiveProgress();
