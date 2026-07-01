// Initialize Firebase
// (Make sure to swap these placeholder values with your real project keys!)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://charity-dinner-2026-default-rtdb.asia-southeast1.firebasedatabase.app", 
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Global image compression data holder
let compressedReceiptBase64 = "";

// =========================================================
// 1. PAYMENT OPTION TOGGLE FUNCTIONS
// =========================================================
function showPayment(method) {
    // Reveal the hidden content wrappers
    document.getElementById('paymentBox').classList.remove('hidden');
    document.getElementById('publicDonationForm').classList.remove('hidden');
    
    const qrContent = document.getElementById('qrContent');
    const accContent = document.getElementById('accountContent');
    const btnQr = document.getElementById('btnQr');
    const btnAcc = document.getElementById('btnAcc');

    // Reset visual layouts
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

// =========================================================
// 2. BRICK LOGIC & AUTO-CALCULATOR ENGINE
// =========================================================
const COST_NORMAL_BRICK = 10;
const COST_GRANITE_BRICK = 301;

function handleContributionViewType(chosenMode) {
    const brickContainer = document.getElementById('brickInputSection');
    const amountField = document.getElementById('amount');
    
    if (chosenMode === 'money') {
        brickContainer.style.display = 'none';
        amountField.readOnly = false;
        amountField.value = ""; // Clear for fresh financial inputs
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
    
    // Compute total sum matching the RM10 and RM301 rates
    const overallSum = (countNormal * COST_NORMAL_BRICK) + (countGranite * COST_GRANITE_BRICK);
    
    // Inject straight into the visible payment property input block
    document.getElementById('amount').value = overallSum;
}

// =========================================================
// 3. RECEIPT MOBILE IMAGE COMPRESSION SCRIPT
// =========================================================
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
            compressedReceiptBase64 = canvas.toDataURL('image/jpeg', 0.7);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// =========================================================
// 4. SUBMISSION FLOW & FIREBASE LINKAGE
// =========================================================
// FIXED: This now accurately listens to "publicDonationForm" matching your HTML layout layout
document.getElementById('publicDonationForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    
    // Prevent system double clicks instantly
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

    const tableNum = document.getElementById('tableNumber').value;
    const donorName = document.getElementById('donorName').value;
    const donateAmount = document.getElementById('amount').value;
    const presentedTo = document.getElementById('presentedBy').value || "N/A";
    
    // Gather contribution meta choices for the admin dashboard display stream
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

    // Push right up to Firebase node streams
    database.ref('donations').push(transactionPayload)
        .then(() => {
            document.getElementById('portalCard').classList.add('hidden');
            document.getElementById('successBox').classList.remove('hidden');
            window.scrollTo(0, 0);
        })
        .catch((error) => {
            alert("Database Error: " + error.message);
            submitBtn.disabled = false;
            submitBtn.innerText = "Submit Donation Details";
            submitBtn.style.background = "#6b3e00";
            submitBtn.style.cursor = "pointer";
        });
});
