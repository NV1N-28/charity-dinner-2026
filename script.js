// PASTE YOUR EXACT FIREBASE CONFIGURATION OBJECT HERE:
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://charity-dinner-2026-default-rtdb.asia-southeast1.firebasedatabase.app", 
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variable to temporarily house compiled compression string
let compressedReceiptBase64 = "";

// =========================================================
// NEW: CORE CONFIGS & LIVE CALCULATION FOR BRICK SYSTEM
// =========================================================
const COST_NORMAL_BRICK = 10;
const COST_GRANITE_BRICK = 301;

function handleContributionViewType(chosenMode) {
    const brickContainer = document.getElementById('brickInputSection');
    const amountField = document.getElementById('amount');
    
    if (chosenMode === 'money') {
        brickContainer.style.display = 'none';
        amountField.readOnly = false;
        amountField.value = ""; // Clear values to let user input fresh amount
        amountField.placeholder = "e.g. 101";
    } else {
        brickContainer.style.display = 'block';
        amountField.readOnly = true;
        tallyTotalBrickCost();
    }
}

function tallyTotalBrickCost() {
    const countNormal = parseInt(document.getElementById('qtyNormalBrick').value, 10) || 0;
    const countGranite = parseInt(document.getElementById('qtyGraniteBrick').value, 10) || 0;
    
    // Core structural calculation matching exact rules
    const overallSum = (countNormal * COST_NORMAL_BRICK) + (countGranite * COST_GRANITE_BRICK);
    
    // Ship final values straight to master visible property field input
    document.getElementById('amount').value = overallSum;
}
// =========================================================

// INTERACTIVE PANEL CONTROLLER: Seamlessly handles opening sections
function showPayment(method) {
    document.getElementById('paymentBox').classList.remove('hidden');
    document.getElementById('publicDonationForm').classList.remove('hidden');
    
    const qrContent = document.getElementById('qrContent');
    const accContent = document.getElementById('accountContent');
    const btnQr = document.getElementById('btnQr');
    const btnAcc = document.getElementById('btnAcc');

    qrContent.classList.add('hidden');
    accContent.classList.add('hidden');
    btnQr.classList.remove('active');
    btnAcc.classList.remove('active');

    if (method === 'qr') {
        qrContent.classList.remove('hidden');
        btnQr.classList.add('active');
    } else if (method === 'account') {
        accContent.classList.remove('hidden');
        btnAcc.classList.add('active');
    }
}

// IMAGE PROCESSING ENGINE: Compresses massive mobile photo files down instantly
function processReceipt(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Max layout bounds
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Export to 70% quality balanced JPEG payload string
            compressedReceiptBase64 = canvas.toDataURL('image/jpeg', 0.7);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Numbers-to-Words Engine for Malaysian Ringgit
function convertNumberToWords(amount) {
    const words = {
        0: 'ZERO', 1: 'ONE', 2: 'TWO', 3: 'THREE', 4: 'FOUR', 5: 'FIVE', 
        6: 'SIX', 7: 'SEVEN', 8: 'EIGHT', 9: 'NINE', 10: 'TEN', 
        11: 'ELEVEN', 12: 'TWELVE', 13: 'THIRTEEN', 14: 'FOURTEEN', 15: 'FIFTEEN', 
        16: 'SIXTEEN', 17: 'SEVENTEEN', 18: 'EIGHTEEN', 19: 'NINETEEN', 
        20: 'TWENTY', 30: 'THIRTY', 40: 'FORTY', 50: 'FIFTY', 
        60: 'SIXTY', 70: 'SEVENTY', 80: 'EIGHTY', 90: 'NINETY' , 
        100: 'HUNDRED', 1000: 'THOUSAND' ,10000: 'TEN THOUSAND', 100000: 'HUNDRED THOUSAND',
        1000000: 'MILLION'
    };

    if (amount === 0) return 'ZERO RINGGIT ONLY';

    let parts = amount.toString().split('.');
    let ringgit = parseInt(parts[0], 10);
    let sen = parts[1] ? parseInt(parts[1].substring(0, 2), 10) : 0;

    function getWords(num) {
        if (num < 20) return words[num] || '';
        if (num < 100) return words[Math.floor(num / 10) * 10] + (num % 10 ? ' ' + words[num % 10] : '');
        if (num < 1000) return words[Math.floor(num / 100)] + ' HUNDRED' + (num % 100 ? ' AND ' + getWords(num % 100) : '');
        if (num < 100000) return getWords(Math.floor(num / 1000)) + ' THOUSAND' + (num % 1000 ? ' ' + getWords(num % 1000) : '');
        if (num < 1000000) return getWords(Math.floor(num / 1000)) + ' THOUSAND' + (num % 1000 ? ' ' + getWords(num % 1000) : '');
        return '';
    }

    let ringgitWords = ringgit > 0 ? getWords(ringgit) + ' RINGGIT' : '';
    let senWords = sen > 0 ? ' AND SEN ' + getWords(sen) : '';
    
    return (ringgitWords + senWords + ' ONLY').replace(/\s+/g, ' ').trim();
}

// SUBMIT STREAM CONTROLLER: Processes submissions exactly once
document.getElementById('publicDonationForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    
    // STAGE 1 LOCK: Instantly freeze button interaction to destroy double-click loops
    submitBtn.disabled = true;
    submitBtn.innerText = "Processing & Saving Entry... Please Wait...";
    submitBtn.style.background = "#cccccc";
    submitBtn.style.cursor = "not-allowed";

    if (!compressedReceiptBase64) {
        alert("Receipt image processing is still executing. Please wait a brief second and tap submit again.");
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit Donation Details";
        submitBtn.style.background = "#6b3e00";
        submitBtn.style.cursor = "pointer";
        return;
    }

    // Map inputs cleanly
    const tableNum = document.getElementById('tableNumber').value;
    const donorName = document.getElementById('donorName').value;
    const donateAmount = document.getElementById('amount').value;
    const presentedTo = document.getElementById('presentedBy').value || "N/A";
    
    // Check contribution meta selection strings to supply clear labels back to the admin control desk
    const mainContribType = document.querySelector('input[name="mainContribution"]:checked').value;
    let finalNote = presentedTo;
    
    if (mainContribType === 'brick') {
        const countNormal = parseInt(document.getElementById('qtyNormalBrick').value, 10) || 0;
        const countGranite = parseInt(document.getElementById('qtyGraniteBrick').value, 10) || 0;
        finalNote = `🧱 [Bricks Order -> Normal: ${countNormal} | Granite: ${countGranite}] — Presented via: ${presentedTo}`;
    }

    const now = new Date();
    const timestampString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + ' | ' + now.toLocaleDateString();

    const transactionPayload = {
        table: tableNum,
        donor: donorName,
        amount: donateAmount,
        presented: finalNote,
        receipt: compressedReceiptBase64,
        time: timestampString
    };

    // Stream up to central cloud path node
    database.ref('donations').push(transactionPayload)
        .then(() => {
            // Wipe form out of perspective and scale visibility onto success elements
            document.getElementById('portalCard').classList.add('hidden');
            document.getElementById('successBox').classList.remove('hidden');
            window.scrollTo(0, 0);
        })
        .catch((error) => {
            alert("Database Error: " + error.message);
            // Unfreeze safely if network dropped completely
            submitBtn.disabled = false;
            submitBtn.innerText = "Submit Donation Details";
            submitBtn.style.background = "#6b3e00";
            submitBtn.style.cursor = "pointer";
        });
});
