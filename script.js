const form = document.getElementById('donationForm');

// UI Toggle for Payment Methods
function selectPayment(method) {
    const qrBox = document.getElementById('qrInstructions');
    const accBox = document.getElementById('accountInstructions');
    const btnQr = document.getElementById('btnQr');
    const btnAcc = document.getElementById('btnAcc');

    if (method === 'qr') {
        qrBox.classList.remove('hidden');
        accBox.classList.add('hidden');
        btnQr.classList.add('active');
        btnAcc.classList.remove('active');
    } else {
        accBox.classList.remove('hidden');
        qrBox.classList.add('hidden');
        btnAcc.classList.add('active');
        btnQr.classList.remove('active');
    }
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

// Intercept Form Submissions
form.addEventListener('submit', function(e){
    e.preventDefault();

    const donor = document.getElementById('donorName').value;
    const amount = document.getElementById('amount').value;
    const table = document.getElementById('tableNumber').value;
    const presented = document.getElementById('presentedBy').value;

    const numAmount = parseFloat(amount);

    // Format raw box numbers with standard accounting comma splits
    const formattedAmount = numAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const dynamicWords = convertNumberToWords(numAmount);

    // Render straight to visual layers using unchanged class coordinates
    document.getElementById('payeeText').innerText = donor;
    document.getElementById('amountWordsText').innerText = dynamicWords;
    document.getElementById('amountText').innerText = formattedAmount;
    document.getElementById('presentedText').innerText = presented;
    document.getElementById('tableText').innerText = 'TABLE ' + table;

    // Push data to localStorage for admin visibility
    saveDonation(donor, amount, table, presented);
});

function saveDonation(donor, amount, table, presented){
    let donations = JSON.parse(localStorage.getItem('donations')) || [];
    donations.push({
        donor,
        amount: parseFloat(amount).toFixed(2),
        table,
        presented: presented || 'N/A',
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
    localStorage.setItem('donations', JSON.stringify(donations));
}

function downloadCheque(){
    alert('Mock cheque rendering complete! Data stored for IT room printing options.');
}