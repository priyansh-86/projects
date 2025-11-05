// Google Sheets API Configuration
const CLIENT_ID = '893953549229-77mhk8me4r4lkomv5jo1gba7qb9ef9a6.apps.googleusercontent.com';
const API_KEY = 'AIzaSyASNTy5UqShIgGsFf-AGO4Ioi-r4Gj-OD4';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

let tokenClient;
let gapiInited = false;
let gisInited = false;
let isAuthenticated = false;

// Initialize Google APIs
function initializeGoogleAPIs() {
    return new Promise((resolve, reject) => {
        // Load gapi client
        gapi.load('client', function() {
            gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: DISCOVERY_DOCS,
            }).then(function() {
                gapiInited = true;
                console.log('Google API client initialized successfully!');
                
                // Initialize GIS
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (tokenResponse) => {
                        if (tokenResponse && tokenResponse.access_token) {
                            console.log('Authentication successful!');
                            isAuthenticated = true;
                            updateGoogleSheetsStatus('Authenticated successfully!', 'success');
                            resolve(true);
                        } else {
                            console.log('Authentication failed or was canceled.');
                            updateGoogleSheetsStatus('Authentication failed or was canceled.', 'error');
                            reject(new Error('Authentication failed'));
                        }
                    },
                });
                
                gisInited = true;
                console.log('Google Identity Services initialized.');
                
                if (!isAuthenticated) {
                    // Auto-request authentication
                    tokenClient.requestAccessToken();
                }
            }).catch(function(error) {
                console.error("Error initializing gapi.client:", error);
                updateGoogleSheetsStatus(`Error initializing Google API: ${error.message}`, 'error');
                reject(error);
            });
        });
    });
}

// Update Google Sheets status
function updateGoogleSheetsStatus(message, type) {
    const statusElement = document.getElementById('googleSheetsStatus');
    if (statusElement) {
        statusElement.innerHTML = message;
        if (type === 'success') {
            statusElement.style.backgroundColor = '#E8F5E9';
            statusElement.style.color = '#2E7D32';
            statusElement.style.border = '1px solid #4CAF50';
        } else if (type === 'error') {
            statusElement.style.backgroundColor = '#FFEBEE';
            statusElement.style.color = '#C62828';
            statusElement.style.border = '1px solid #F44336';
        } else {
            statusElement.style.backgroundColor = '#E3F2FD';
            statusElement.style.color = '#1565C0';
            statusElement.style.border = '1px solid #2196F3';
        }
    }
}

// Save loan details to Google Sheets
async function saveToGoogleSheets() {
    if (!isAuthenticated) {
        updateGoogleSheetsStatus('Initializing Google APIs...', 'loading');
        try {
            await initializeGoogleAPIs();
        } catch (error) {
            updateGoogleSheetsStatus('Failed to initialize Google APIs', 'error');
            return;
        }
    }

    updateGoogleSheetsStatus('Saving to Google Sheets...', 'loading');

    try {
        // Create a new spreadsheet
        const spreadsheetResponse = await gapi.client.sheets.spreadsheets.create({
            properties: {
                title: `Loan Calculator Results - ${new Date().toLocaleDateString()}`
            }
        });

        const spreadsheetId = spreadsheetResponse.result.spreadsheetId;
        
        // Get current loan data
        const loanData = getCurrentLoanData();
        
        // Prepare data for sheets
        const values = [
            ['Loan Calculator Results', '', '', '', '', ''],
            ['Generated on:', new Date().toLocaleString(), '', '', '', ''],
            ['', '', '', '', '', ''],
            ['Basic Loan Details', '', '', '', '', ''],
            ['Loan Amount (₹):', loanData.loanAmount, '', '', '', ''],
            ['Interest Rate (%):', loanData.interestRate, '', '', '', ''],
            ['Loan Tenure (Years):', loanData.loanTenure, '', '', '', ''],
            ['Compounding Frequency:', loanData.compoundingFrequency, '', '', '', ''],
            ['', '', '', '', '', ''],
            ['Calculated Results', '', '', '', '', ''],
            ['Monthly EMI (₹):', loanData.monthlyEmi, '', '', '', ''],
            ['Total Interest (₹):', loanData.totalInterest, '', '', '', ''],
            ['Total Payment (₹):', loanData.totalPayment, '', '', '', ''],
            ['Interest Percentage:', loanData.interestPercent, '', '', '', ''],
            ['Number of EMIs:', loanData.numberOfEmis, '', '', '', ''],
            ['', '', '', '', '', ''],
            ['Amortization Schedule', '', '', '', '', ''],
            ['Payment No.', 'EMI Amount', 'Principal', 'Interest', 'Total Interest', 'Balance'],
        ];

        // Add schedule data (first 50 payments to avoid too much data)
        if (loanData.schedule && loanData.schedule.length > 0) {
            loanData.schedule.slice(0, 50).forEach(payment => {
                values.push([
                    payment.paymentNumber,
                    payment.emiAmount,
                    payment.principal,
                    payment.interest,
                    payment.totalInterest,
                    payment.balance
                ]);
            });
        }

        // Write data to spreadsheet
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: 'A1',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: values
            }
        });

        // Format the spreadsheet
        await gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: spreadsheetId,
            resource: {
                requests: [
                    {
                        repeatCell: {
                            range: {
                                sheetId: 0,
                                startRowIndex: 0,
                                endRowIndex: 1
                            },
                            cell: {
                                userEnteredFormat: {
                                    textFormat: {
                                        bold: true,
                                        fontSize: 16
                                    },
                                    backgroundColor: {
                                        red: 0.2627,
                                        green: 0.6,
                                        blue: 0.9333
                                    }
                                }
                            },
                            fields: "userEnteredFormat(textFormat,backgroundColor)"
                        }
                    },
                    {
                        repeatCell: {
                            range: {
                                sheetId: 0,
                                startRowIndex: 17,
                                endRowIndex: 18
                            },
                            cell: {
                                userEnteredFormat: {
                                    textFormat: {
                                        bold: true
                                    },
                                    backgroundColor: {
                                        red: 0.9,
                                        green: 0.9,
                                        blue: 0.9
                                    }
                                }
                            },
                            fields: "userEnteredFormat(textFormat,backgroundColor)"
                        }
                    }
                ]
            }
        });

        updateGoogleSheetsStatus(`Successfully saved! <a href="https://docs.google.com/spreadsheets/d/${spreadsheetId}" target="_blank" style="color: white; text-decoration: underline;">Open Spreadsheet</a>`, 'success');

    } catch (error) {
        console.error('Error saving to Google Sheets:', error);
        updateGoogleSheetsStatus(`Error saving to Google Sheets: ${error.message}`, 'error');
    }
}

// Get current loan data
function getCurrentLoanData() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const loanTenure = parseFloat(document.getElementById('loanTenure').value) || 0;
    const compoundingFrequency = document.getElementById('compoundingFrequency').value;
    
    // Calculate EMI and other values
    const calculation = calculateEMI(loanAmount, interestRate, loanTenure, compoundingFrequency);
    
    return {
        loanAmount: formatCurrency(loanAmount),
        interestRate: interestRate + '%',
        loanTenure: loanTenure + ' years',
        compoundingFrequency: compoundingFrequency,
        monthlyEmi: formatCurrency(calculation.emi),
        totalInterest: formatCurrency(calculation.totalInterest),
        totalPayment: formatCurrency(calculation.totalPayment),
        interestPercent: calculation.interestPercent + '%',
        numberOfEmis: calculation.numberOfPayments,
        schedule: generateAmortizationSchedule(loanAmount, interestRate, loanTenure, compoundingFrequency)
    };
}

// Global variables for calculations
let currentEmiData = {
    emi: 0,
    totalInterest: 0,
    totalPayment: 0,
    interestPercent: 0,
    numberOfPayments: 0
};

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Calculate EMI based on compounding frequency
function calculateEMI(principal, annualRate, years, compoundingFreq) {
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = years * 12;
    
    let emi;
    if (monthlyRate === 0) {
        emi = principal / numberOfPayments;
    } else {
        emi = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }
    
    const totalPayment = emi * numberOfPayments;
    const totalInterest = totalPayment - principal;
    const interestPercent = (totalInterest / principal) * 100;
    
    return {
        emi: Math.round(emi),
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(totalPayment),
        interestPercent: Math.round(interestPercent * 100) / 100,
        numberOfPayments: numberOfPayments
    };
}

// Generate amortization schedule
function generateAmortizationSchedule(principal, annualRate, years, compoundingFreq) {
    const calculation = calculateEMI(principal, annualRate, years, compoundingFreq);
    const monthlyRate = annualRate / 100 / 12;
    const emi = calculation.emi;
    
    let balance = principal;
    let totalInterestPaid = 0;
    const schedule = [];
    
    for (let i = 1; i <= calculation.numberOfPayments; i++) {
        const interestPayment = Math.round(balance * monthlyRate);
        const principalPayment = Math.round(emi - interestPayment);
        balance = Math.round(balance - principalPayment);
        totalInterestPaid += interestPayment;
        
        // Adjust last payment if needed
        if (i === calculation.numberOfPayments && balance !== 0) {
            const lastPrincipalPayment = principalPayment + balance;
            balance = 0;
        }
        
        schedule.push({
            paymentNumber: i,
            emiAmount: emi,
            principal: principalPayment,
            interest: interestPayment,
            totalInterest: totalInterestPaid,
            balance: Math.max(0, balance)
        });
    }
    
    return schedule;
}

// Update UI with calculated values
function updateLoanResults(calculation) {
    document.getElementById('emiValue').textContent = formatCurrency(calculation.emi);
    document.getElementById('totalInterest').textContent = formatCurrency(calculation.totalInterest);
    document.getElementById('totalPayment').textContent = formatCurrency(calculation.totalPayment);
    document.getElementById('interestPercent').textContent = calculation.interestPercent + '%';
    document.getElementById('numberOfEmis').textContent = calculation.numberOfPayments;
    
    // Update progress bar
    const progressBar = document.getElementById('loanProgressBar');
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.textContent = '0% Repaid';
    }
    
    // Store current data globally
    currentEmiData = calculation;
}

// Generate and display amortization schedule
function generateScheduleTable(principal, annualRate, years, compoundingFreq) {
    const schedule = generateAmortizationSchedule(principal, annualRate, years, compoundingFreq);
    const tbody = document.getElementById('scheduleBody');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Display first 12 months, then yearly summary
    schedule.forEach((payment, index) => {
        if (index < 12 || (index + 1) % 12 === 0) {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${payment.paymentNumber}</td>
                <td>${formatCurrency(payment.emiAmount)}</td>
                <td>${formatCurrency(payment.principal)}</td>
                <td>${formatCurrency(payment.interest)}</td>
                <td>${formatCurrency(payment.totalInterest)}</td>
                <td>${formatCurrency(payment.balance)}</td>
            `;
        }
    });
}

// Create payment breakdown chart
function createPaymentChart(principal, totalInterest) {
    const ctx = document.getElementById('paymentBreakdownChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (window.paymentChart) {
        window.paymentChart.destroy();
    }
    
    window.paymentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal Amount', 'Interest Amount'],
            datasets: [{
                data: [principal, totalInterest],
                backgroundColor: ['#4361ee', '#7209b7'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Create interest heatmap
function createInterestHeatmap(principal, annualRate, years) {
    const heatmapContainer = document.getElementById('interestHeatmap');
    if (!heatmapContainer) return;
    
    const monthsPerYear = 12;
    const totalMonths = years * monthsPerYear;
    const schedule = generateAmortizationSchedule(principal, annualRate, years, 'monthly');
    
    // Create grid layout
    const cellsPerRow = 12; // 12 months per row
    const rows = Math.ceil(totalMonths / cellsPerRow);
    
    heatmapContainer.style.gridTemplateColumns = `60px repeat(${cellsPerRow}, 1fr)`;
    heatmapContainer.innerHTML = '';
    
    // Add header row
    const headerRow = ['Year'];
    for (let month = 1; month <= 12; month++) {
        headerRow.push(month.toString());
    }
    
    headerRow.forEach(header => {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell heatmap-header';
        cell.textContent = header;
        heatmapContainer.appendChild(cell);
    });
    
    // Find max interest for color scaling
    const maxInterest = Math.max(...schedule.map(s => s.interest));
    
    // Add data rows
    for (let year = 1; year <= years; year++) {
        // Year label
        const yearLabel = document.createElement('div');
        yearLabel.className = 'heatmap-cell heatmap-row-label';
        yearLabel.textContent = year.toString();
        heatmapContainer.appendChild(yearLabel);
        
        // Monthly cells
        for (let month = 1; month <= 12; month++) {
            const scheduleIndex = (year - 1) * 12 + (month - 1);
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            
            if (scheduleIndex < schedule.length) {
                const payment = schedule[scheduleIndex];
                const intensity = payment.interest / maxInterest;
                const red = Math.floor(255 * intensity);
                const blue = Math.floor(255 * (1 - intensity));
                
                cell.style.backgroundColor = `rgb(${red}, 100, ${blue})`;
                cell.textContent = formatCurrency(payment.interest).replace('₹', '').replace(',', 'k');
                cell.title = `Year ${year}, Month ${month}: ${formatCurrency(payment.interest)} interest`;
            } else {
                cell.style.backgroundColor = '#f0f0f0';
                cell.textContent = '-';
            }
            
            heatmapContainer.appendChild(cell);
        }
    }
}

// Export functions
function exportToTXT() {
    const data = getCurrentLoanData();
    let content = `Loan Calculator Results\n`;
    content += `Generated on: ${new Date().toLocaleString()}\n\n`;
    content += `Basic Loan Details:\n`;
    content += `Loan Amount: ${data.loanAmount}\n`;
    content += `Interest Rate: ${data.interestRate}\n`;
    content += `Loan Tenure: ${data.loanTenure}\n`;
    content += `Compounding Frequency: ${data.compoundingFrequency}\n\n`;
    content += `Calculated Results:\n`;
    content += `Monthly EMI: ${data.monthlyEmi}\n`;
    content += `Total Interest: ${data.totalInterest}\n`;
    content += `Total Payment: ${data.totalPayment}\n`;
    content += `Interest Percentage: ${data.interestPercent}\n`;
    content += `Number of EMIs: ${data.numberOfEmis}\n\n`;
    
    downloadFile(content, 'loan_calculator_results.txt', 'text/plain');
}

function exportToCSV() {
    const data = getCurrentLoanData();
    let content = `Loan Calculator Results\n`;
    content += `Generated on,${new Date().toLocaleString()}\n\n`;
    content += `Loan Amount,${data.loanAmount}\n`;
    content += `Interest Rate,${data.interestRate}\n`;
    content += `Loan Tenure,${data.loanTenure}\n`;
    content += `Monthly EMI,${data.monthlyEmi}\n`;
    content += `Total Interest,${data.totalInterest}\n`;
    content += `Total Payment,${data.totalPayment}\n\n`;
    content += `Payment No.,EMI Amount,Principal,Interest,Total Interest,Balance\n`;
    
    if (data.schedule) {
        data.schedule.forEach(payment => {
            content += `${payment.paymentNumber},${payment.emiAmount},${payment.principal},${payment.interest},${payment.totalInterest},${payment.balance}\n`;
        });
    }
    
    downloadFile(content, 'loan_calculator_results.csv', 'text/csv');
}

function exportToMD() {
    const data = getCurrentLoanData();
    let content = `# Loan Calculator Results\n\n`;
    content += `**Generated on:** ${new Date().toLocaleString()}\n\n`;
    content += `## Basic Loan Details\n\n`;
    content += `- **Loan Amount:** ${data.loanAmount}\n`;
    content += `- **Interest Rate:** ${data.interestRate}\n`;
    content += `- **Loan Tenure:** ${data.loanTenure}\n`;
    content += `- **Compounding Frequency:** ${data.compoundingFrequency}\n\n`;
    content += `## Calculated Results\n\n`;
    content += `- **Monthly EMI:** ${data.monthlyEmi}\n`;
    content += `- **Total Interest:** ${data.totalInterest}\n`;
    content += `- **Total Payment:** ${data.totalPayment}\n`;
    content += `- **Interest Percentage:** ${data.interestPercent}\n`;
    content += `- **Number of EMIs:** ${data.numberOfEmis}\n\n`;
    
    downloadFile(content, 'loan_calculator_results.md', 'text/markdown');
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const data = getCurrentLoanData();
    
    // Title
    doc.setFontSize(20);
    doc.text('Loan Calculator Results', 105, 20, { align: 'center' });
    
    // Date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 40);
    
    // Loan details
    doc.setFontSize(16);
    doc.text('Basic Loan Details', 20, 60);
    
    doc.setFontSize(12);
    doc.text(`Loan Amount: ${data.loanAmount}`, 20, 75);
    doc.text(`Interest Rate: ${data.interestRate}`, 20, 85);
    doc.text(`Loan Tenure: ${data.loanTenure}`, 20, 95);
    doc.text(`Compounding Frequency: ${data.compoundingFrequency}`, 20, 105);
    
    // Results
    doc.setFontSize(16);
    doc.text('Calculated Results', 20, 125);
    
    doc.setFontSize(12);
    doc.text(`Monthly EMI: ${data.monthlyEmi}`, 20, 140);
    doc.text(`Total Interest: ${data.totalInterest}`, 20, 150);
    doc.text(`Total Payment: ${data.totalPayment}`, 20, 160);
    doc.text(`Interest Percentage: ${data.interestPercent}`, 20, 170);
    doc.text(`Number of EMIs: ${data.numberOfEmis}`, 20, 180);
    
    doc.save('loan_calculator_results.pdf');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Tab functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Dark mode toggle
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    
    // Check for saved dark mode preference - but don't rely on localStorage in Claude environment
    if (body.classList.contains('dark-mode')) {
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        
        if (body.classList.contains('dark-mode')) {
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });
}

// Initialize sliders
function initializeSliders() {
    const loanAmountSlider = document.getElementById('loanAmountSlider');
    const loanAmountInput = document.getElementById('loanAmount');
    const interestRateSlider = document.getElementById('interestRateSlider');
    const interestRateInput = document.getElementById('interestRate');
    const loanTenureSlider = document.getElementById('loanTenureSlider');
    const loanTenureInput = document.getElementById('loanTenure');
    
    // Sync sliders with inputs
    if (loanAmountSlider && loanAmountInput) {
        loanAmountSlider.addEventListener('input', (e) => {
            loanAmountInput.value = e.target.value;
            calculateAndUpdate();
        });
        
        loanAmountInput.addEventListener('input', (e) => {
            loanAmountSlider.value = e.target.value;
            calculateAndUpdate();
        });
    }
    
    if (interestRateSlider && interestRateInput) {
        interestRateSlider.addEventListener('input', (e) => {
            interestRateInput.value = e.target.value;
            calculateAndUpdate();
        });
        
        interestRateInput.addEventListener('input', (e) => {
            interestRateSlider.value = e.target.value;
            calculateAndUpdate();
        });
    }
    
    if (loanTenureSlider && loanTenureInput) {
        loanTenureSlider.addEventListener('input', (e) => {
            loanTenureInput.value = e.target.value;
            calculateAndUpdate();
        });
        
        loanTenureInput.addEventListener('input', (e) => {
            loanTenureSlider.value = e.target.value;
            calculateAndUpdate();
        });
    }
}

// Calculate and update all displays
function calculateAndUpdate() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const loanTenure = parseFloat(document.getElementById('loanTenure').value) || 0;
    const compoundingFrequency = document.getElementById('compoundingFrequency').value;
    
    if (loanAmount && interestRate && loanTenure) {
        const calculation = calculateEMI(loanAmount, interestRate, loanTenure, compoundingFrequency);
        updateLoanResults(calculation);
        generateScheduleTable(loanAmount, interestRate, loanTenure, compoundingFrequency);
        createPaymentChart(loanAmount, calculation.totalInterest);
        createInterestHeatmap(loanAmount, interestRate, loanTenure);
    }
}

// Scenario calculations
function calculateEmiScenario() {
    const extraEmi = parseFloat(document.getElementById('extraEmi').value) || 0;
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const loanTenure = parseFloat(document.getElementById('loanTenure').value) || 0;
    
    if (!loanAmount || !interestRate || !loanTenure) return;
    
    const originalCalculation = calculateEMI(loanAmount, interestRate, loanTenure, 'monthly');
    const newEmi = originalCalculation.emi + extraEmi;
    
    // Calculate new tenure with increased EMI
    const monthlyRate = interestRate / 100 / 12;
    let newTenureMonths = 0;
    let balance = loanAmount;
    
    while (balance > 0 && newTenureMonths < 600) { // Max 50 years safety check
        const interestPayment = balance * monthlyRate;
        const principalPayment = newEmi - interestPayment;
        balance -= principalPayment;
        newTenureMonths++;
    }
    
    const newTotalPayment = newEmi * newTenureMonths;
    const newTotalInterest = newTotalPayment - loanAmount;
    const interestSaved = originalCalculation.totalInterest - newTotalInterest;
    const timeSaved = originalCalculation.numberOfPayments - newTenureMonths;
    
    document.getElementById('emiSavings').innerHTML = `
        <strong>Impact of increasing EMI by ${formatCurrency(extraEmi)}:</strong><br>
        Interest Saved: ${formatCurrency(interestSaved)}<br>
        Time Saved: ${Math.floor(timeSaved / 12)} years ${timeSaved % 12} months<br>
        New Loan Tenure: ${Math.floor(newTenureMonths / 12)} years ${newTenureMonths % 12} months
    `;
}

function calculatePrepaymentScenario() {
    const prepaymentAmount = parseFloat(document.getElementById('prepaymentAmount').value) || 0;
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const loanTenure = parseFloat(document.getElementById('loanTenure').value) || 0;
    
    if (!loanAmount || !interestRate || !loanTenure) return;
    
    const originalCalculation = calculateEMI(loanAmount, interestRate, loanTenure, 'monthly');
    const reducedPrincipal = loanAmount - prepaymentAmount;
    
    if (reducedPrincipal <= 0) {
        document.getElementById('prepaymentSavings').innerHTML = `
            <strong>Prepayment of ${formatCurrency(prepaymentAmount)} will close your loan immediately!</strong><br>
            Interest Saved: ${formatCurrency(originalCalculation.totalInterest)}<br>
            You'll save the entire interest amount!
        `;
        return;
    }
    
    const newCalculation = calculateEMI(reducedPrincipal, interestRate, loanTenure, 'monthly');
    const interestSaved = originalCalculation.totalInterest - newCalculation.totalInterest;
    
    document.getElementById('prepaymentSavings').innerHTML = `
        <strong>Impact of ${formatCurrency(prepaymentAmount)} prepayment:</strong><br>
        Interest Saved: ${formatCurrency(interestSaved)}<br>
        New Monthly EMI: ${formatCurrency(newCalculation.emi)}<br>
        EMI Reduction: ${formatCurrency(originalCalculation.emi - newCalculation.emi)}
    `;
}

function calculateEarlyClosure() {
    const prepaymentAmount = parseFloat(document.getElementById('earlyClosurePrepayment').value) || 0;
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const loanTenure = parseFloat(document.getElementById('loanTenure').value) || 0;
    
    if (!loanAmount || !interestRate || !loanTenure) return;
    
    const originalCalculation = calculateEMI(loanAmount, interestRate, loanTenure, 'monthly');
    const remainingBalance = loanAmount - prepaymentAmount;
    
    if (remainingBalance <= 0) {
        document.getElementById('earlyClosureResult').innerHTML = `
            <strong>Early Closure Analysis:</strong><br>
            Loan can be closed immediately with ${formatCurrency(prepaymentAmount)}<br>
            Total Interest Saved: ${formatCurrency(originalCalculation.totalInterest)}<br>
            <span style="color: #4CAF50;">Recommended: Close the loan to save maximum interest!</span>
        `;
    } else {
        const monthsToClose = Math.ceil(remainingBalance / originalCalculation.emi);
        const interestForRemainingPeriod = (originalCalculation.emi * monthsToClose) - remainingBalance;
        
        document.getElementById('earlyClosureResult').innerHTML = `
            <strong>Early Closure Analysis:</strong><br>
            After ${formatCurrency(prepaymentAmount)} prepayment:<br>
            Remaining Balance: ${formatCurrency(remainingBalance)}<br>
            Months to close at current EMI: ${monthsToClose}<br>
            Interest for remaining period: ${formatCurrency(interestForRemainingPeriod)}
        `;
    }
}

function calculateInflationScenario() {
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) || 0;
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const loanTenure = parseFloat(document.getElementById('loanTenure').value) || 0;
    
    if (!loanAmount || !interestRate || !loanTenure) return;
    
    const calculation = calculateEMI(loanAmount, interestRate, loanTenure, 'monthly');
    const realInterestRate = interestRate - inflationRate;
    const presentValueOfPayments = calculation.totalPayment / Math.pow(1 + inflationRate/100, loanTenure);
    
    document.getElementById('inflationImpact').innerHTML = `
        <strong>Inflation Impact Analysis:</strong><br>
        Real Interest Rate: ${realInterestRate.toFixed(2)}%<br>
        Present Value of Total Payments: ${formatCurrency(presentValueOfPayments)}<br>
        ${realInterestRate < 0 ? '<span style="color: #4CAF50;">Your real borrowing cost is negative due to inflation!</span>' : 'Your real cost after inflation adjustment'}
    `;
}

function calculateRefinanceScenario() {
    const refinanceAfterYears = parseFloat(document.getElementById('refinanceAfterYears').value) || 0;
    const newRate = parseFloat(document.getElementById('newRefinanceRate').value) || 0;
    const newTenure = parseFloat(document.getElementById('newRefinanceTenure').value) || 0;
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const loanTenure = parseFloat(document.getElementById('loanTenure').value) || 0;
    
    if (!loanAmount || !interestRate || !loanTenure) return;
    
    const originalCalculation = calculateEMI(loanAmount, interestRate, loanTenure, 'monthly');
    
    // Calculate remaining balance after refinance years
    const schedule = generateAmortizationSchedule(loanAmount, interestRate, loanTenure, 'monthly');
    const refinanceMonth = refinanceAfterYears * 12;
    const remainingBalance = refinanceMonth < schedule.length ? schedule[refinanceMonth - 1].balance : 0;
    
    if (remainingBalance > 0) {
        const newCalculation = calculateEMI(remainingBalance, newRate, newTenure, 'monthly');
        const originalRemainingCost = originalCalculation.emi * (originalCalculation.numberOfPayments - refinanceMonth);
        const newRemainingCost = newCalculation.totalPayment;
        const savings = originalRemainingCost - newRemainingCost;
        
        document.getElementById('refinanceSavings').innerHTML = `
            <strong>Refinance Analysis:</strong><br>
            Remaining Balance after ${refinanceAfterYears} years: ${formatCurrency(remainingBalance)}<br>
            New EMI: ${formatCurrency(newCalculation.emi)}<br>
            Total Savings: ${formatCurrency(savings)}<br>
            ${savings > 0 ? '<span style="color: #4CAF50;">Refinancing is beneficial!</span>' : '<span style="color: #F44336;">Refinancing may not be worth it.</span>'}
        `;
    }
}

function calculateRateChangeScenario() {
    const rateChangeAfterYears = parseFloat(document.getElementById('rateChangeAfterYears').value) || 0;
    const newRate = parseFloat(document.getElementById('newRateAfterChange').value) || 0;
    const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
    const loanTenure = parseFloat(document.getElementById('loanTenure').value) || 0;
    
    if (!loanAmount || !interestRate || !loanTenure) return;
    
    const originalCalculation = calculateEMI(loanAmount, interestRate, loanTenure, 'monthly');
    
    // Calculate payments with rate change
    const schedule = generateAmortizationSchedule(loanAmount, interestRate, loanTenure, 'monthly');
    const changeMonth = rateChangeAfterYears * 12;
    
    if (changeMonth < schedule.length) {
        const remainingBalance = schedule[changeMonth - 1].balance;
        const remainingTenure = (loanTenure * 12 - changeMonth) / 12;
        const newCalculation = calculateEMI(remainingBalance, newRate, remainingTenure, 'monthly');
        
        const costBeforeChange = originalCalculation.emi * changeMonth;
        const costAfterChange = newCalculation.totalPayment;
        const totalCostWithChange = costBeforeChange + costAfterChange;
        const difference = originalCalculation.totalPayment - totalCostWithChange;
        
        document.getElementById('rateChangeImpact').innerHTML = `
            <strong>Interest Rate Change Impact:</strong><br>
            New EMI after ${rateChangeAfterYears} years: ${formatCurrency(newCalculation.emi)}<br>
            EMI Change: ${formatCurrency(newCalculation.emi - originalCalculation.emi)}<br>
            Total Cost Impact: ${formatCurrency(Math.abs(difference))} ${difference > 0 ? 'savings' : 'additional cost'}<br>
        `;
    }
}

// Home Loan Tax Benefits
function calculateHomeLoanTax() {
    const loanAmount = parseFloat(document.getElementById('hlLoanAmount').value) || 0;
    const interestRate = parseFloat(document.getElementById('hlInterestRate').value) || 0;
    const tenure = parseFloat(document.getElementById('hlTenure').value) || 0;
    const annualIncome = parseFloat(document.getElementById('annualIncome').value) || 0;
    const taxSlab = parseFloat(document.getElementById('taxSlab').value) || 0;
    
    if (!loanAmount || !interestRate || !tenure) return;
    
    const calculation = calculateEMI(loanAmount, interestRate, tenure, 'monthly');
    const yearlyEmi = calculation.emi * 12;
    const yearlyInterest = Math.min(calculation.emi * 12 * 0.7, 200000); // Max 2 lakh under 24(b)
    const yearlyPrincipal = Math.min(calculation.emi * 12 * 0.3, 150000); // Max 1.5 lakh under 80(c)
    const totalDeduction = yearlyInterest + yearlyPrincipal;
    const taxSaving = totalDeduction * taxSlab;
    const effectiveRate = interestRate - (taxSaving / yearlyEmi) * 100;
    
    document.getElementById('yearlyTaxSaving').textContent = formatCurrency(taxSaving);
    document.getElementById('principal80C').textContent = formatCurrency(yearlyPrincipal);
    document.getElementById('interest24b').textContent = formatCurrency(yearlyInterest);
    document.getElementById('totalDeduction').textContent = formatCurrency(totalDeduction);
    document.getElementById('effectiveRate').textContent = effectiveRate.toFixed(1) + '%';
}

// Portfolio management functions
function addLoanRow() {
    const tbody = document.getElementById('portfolioBody');
    const row = tbody.insertRow();
    row.innerHTML = `
        <td><input type="text" value="Loan ${tbody.children.length + 1}"></td>
        <td><input type="number" value="1000000" min="1000"></td>
        <td><input type="number" value="8.0" step="0.1" min="1"></td>
        <td><input type="number" value="10" min="1"></td>
        <td>
            <select>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half-yearly">Half-Yearly</option>
                <option value="yearly">Yearly</option>
            </select>
        </td>
        <td><button class="remove-loan-row"><i class="fas fa-trash"></i></button></td>
    `;
    
    // Add event listener to remove button
    row.querySelector('.remove-loan-row').addEventListener('click', function() {
        row.remove();
    });
}

function calculatePortfolioEMI() {
    const tbody = document.getElementById('portfolioBody');
    const rows = tbody.querySelectorAll('tr');
    let totalEMI = 0;
    let loanCount = 0;
    let longestTenure = 0;
    const loans = [];
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input, select');
        if (inputs.length >= 5) {
            const loanName = inputs[0].value || 'Unnamed Loan';
            const amount = parseFloat(inputs[1].value) || 0;
            const rate = parseFloat(inputs[2].value) || 0;
            const tenure = parseFloat(inputs[3].value) || 0;
            const compounding = inputs[4].value;
            
            if (amount > 0 && rate > 0 && tenure > 0) {
                const calculation = calculateEMI(amount, rate, tenure, compounding);
                totalEMI += calculation.emi;
                loanCount++;
                longestTenure = Math.max(longestTenure, tenure);
                
                loans.push({
                    name: loanName,
                    emi: calculation.emi,
                    tenure: tenure
                });
            }
        }
    });
    
    document.getElementById('totalPortfolioEmi').textContent = formatCurrency(totalEMI);
    document.getElementById('portfolioLoanCount').textContent = loanCount;
    document.getElementById('portfolioLongestTenure').textContent = longestTenure + ' Years';
    
    // Create portfolio chart
    createPortfolioChart(loans);
}

function createPortfolioChart(loans) {
    const ctx = document.getElementById('portfolioEmiChart');
    if (!ctx || loans.length === 0) return;
    
    // Destroy existing chart
    if (window.portfolioChart) {
        window.portfolioChart.destroy();
    }
    
    // Create monthly data for longest tenure
    const maxTenure = Math.max(...loans.map(l => l.tenure));
    const months = Array.from({length: maxTenure * 12}, (_, i) => i + 1);
    
    const datasets = loans.map((loan, index) => ({
        label: loan.name,
        data: months.map(month => month <= loan.tenure * 12 ? loan.emi : 0),
        backgroundColor: `hsla(${index * 360 / loans.length}, 70%, 50%, 0.7)`,
        borderColor: `hsl(${index * 360 / loans.length}, 70%, 40%)`,
        borderWidth: 1
    }));
    
    window.portfolioChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months.filter((_, i) => i % 12 === 0).map(m => `Year ${Math.ceil(m/12)}`),
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                x: { stacked: true },
                y: { 
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                legend: { display: true, position: 'top' }
            }
        }
    });
}

// Affordability calculations
function calculateAffordableLoan() {
    const affordableEmi = parseFloat(document.getElementById('affordableEmi').value) || 0;
    const interestRate = parseFloat(document.getElementById('affordabilityInterestRate').value) || 0;
    const tenure = parseFloat(document.getElementById('affordabilityTenure').value) || 0;
    
    if (!affordableEmi || !interestRate || !tenure) return;
    
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = tenure * 12;
    
    let maxLoanAmount;
    if (monthlyRate === 0) {
        maxLoanAmount = affordableEmi * numberOfPayments;
    } else {
        maxLoanAmount = affordableEmi * (Math.pow(1 + monthlyRate, numberOfPayments) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments));
    }
    
    const totalPayment = affordableEmi * numberOfPayments;
    const totalInterest = totalPayment - maxLoanAmount;
    
    document.getElementById('maxAffordableLoan').textContent = formatCurrency(maxLoanAmount);
    document.getElementById('affordableTotalInterest').textContent = formatCurrency(totalInterest);
    document.getElementById('affordableTotalPayment').textContent = formatCurrency(totalPayment);
}

function calculateDTI() {
    const monthlyIncome = parseFloat(document.getElementById('monthlyIncome').value) || 0;
    const currentEmi = currentEmiData.emi || 0;
    
    if (!monthlyIncome) return;
    
    const dtiRatio = (currentEmi / monthlyIncome) * 100;
    
    document.getElementById('currentEmiForDti').textContent = formatCurrency(currentEmi);
    document.getElementById('dtiRatio').textContent = dtiRatio.toFixed(1) + '%';
    
    let riskAssessment = '';
    let riskColor = '';
    
    if (dtiRatio <= 20) {
        riskAssessment = 'Excellent: Your EMI burden is very manageable. You have good capacity for additional loans.';
        riskColor = '#4CAF50';
    } else if (dtiRatio <= 40) {
        riskAssessment = 'Good: Your EMI burden is reasonable. You can consider additional loans with caution.';
        riskColor = '#8BC34A';
    } else if (dtiRatio <= 50) {
        riskAssessment = 'Caution: Your EMI burden is high. Consider reducing debt before taking new loans.';
        riskColor = '#FF9800';
    } else {
        riskAssessment = 'High Risk: Your EMI burden is very high. Focus on debt reduction and avoid new loans.';
        riskColor = '#F44336';
    }
    
    document.getElementById('dtiRiskAssessment').innerHTML = riskAssessment;
    document.getElementById('dtiRiskAssessment').style.backgroundColor = riskColor;
}

// Advanced options toggle functionality
function initializeAdvancedOptions() {
    const toggles = document.querySelectorAll('.option-toggle');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const content = toggle.nextElementSibling;
            const icon = toggle.querySelector('i');
            
            if (content.classList.contains('active')) {
                content.classList.remove('active');
                icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
            } else {
                content.classList.add('active');
                icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
            }
        });
    });
}

// Advanced options: Variable rate functionality
function addVariableRateRow() {
    const tbody = document.getElementById('variableRateBody');
    const row = tbody.insertRow();
    row.innerHTML = `
        <td><input type="number" value="1" min="1"></td>
        <td><input type="number" value="3" min="1"></td>
        <td><input type="number" value="8.5" step="0.1"></td>
        <td><button class="remove-row"><i class="fas fa-trash"></i></button></td>
    `;
    
    row.querySelector('.remove-row').addEventListener('click', function() {
        row.remove();
    });
}

// Advanced options: Prepayment functionality
function addPrepaymentRow() {
    const tbody = document.getElementById('prepaymentBody');
    const row = tbody.insertRow();
    row.innerHTML = `
        <td><input type="number" value="12" min="1"></td>
        <td>
            <select>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half-yearly">Half-Yearly</option>
                <option value="yearly">Yearly</option>
            </select>
        </td>
        <td><input type="number" value="50000" min="0" step="1000"></td>
        <td><button class="remove-row"><i class="fas fa-trash"></i></button></td>
    `;
    
    row.querySelector('.remove-row').addEventListener('click', function() {
        row.remove();
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Initialize components
    initializeTabs();
    initializeDarkMode();
    initializeSliders();
    
    // Initial calculation
    calculateAndUpdate();
    
    // Add event listeners for basic calculator
    document.getElementById('calculateBtn').addEventListener('click', calculateAndUpdate);
    
    // Export buttons
    document.getElementById('exportTxtBtn').addEventListener('click', exportToTXT);
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);
    document.getElementById('exportMdBtn').addEventListener('click', exportToMD);
    document.getElementById('exportPdfBtn').addEventListener('click', exportToPDF);
    
    // Google Sheets button
    document.getElementById('saveToGoogleSheetsBtn').addEventListener('click', saveToGoogleSheets);
    
    // Home loan calculation
    const calculateHlBtn = document.getElementById('calculateHlBtn');
    if (calculateHlBtn) {
        calculateHlBtn.addEventListener('click', calculateHomeLoanTax);
    }
    
    // Scenario buttons
    const calculateEmiScenarioBtn = document.getElementById('calculateEmiScenario');
    if (calculateEmiScenarioBtn) {
        calculateEmiScenarioBtn.addEventListener('click', calculateEmiScenario);
    }
    
    const calculatePrepaymentScenarioBtn = document.getElementById('calculatePrepaymentScenario');
    if (calculatePrepaymentScenarioBtn) {
        calculatePrepaymentScenarioBtn.addEventListener('click', calculatePrepaymentScenario);
    }
    
    const calculateEarlyClosureBtn = document.getElementById('calculateEarlyClosure');
    if (calculateEarlyClosureBtn) {
        calculateEarlyClosureBtn.addEventListener('click', calculateEarlyClosure);
    }
    
    const calculateInflationScenarioBtn = document.getElementById('calculateInflationScenario');
    if (calculateInflationScenarioBtn) {
        calculateInflationScenarioBtn.addEventListener('click', calculateInflationScenario);
    }
    
    const calculateRefinanceScenarioBtn = document.getElementById('calculateRefinanceScenario');
    if (calculateRefinanceScenarioBtn) {
        calculateRefinanceScenarioBtn.addEventListener('click', calculateRefinanceScenario);
    }
    
    const calculateRateChangeScenarioBtn = document.getElementById('calculateRateChangeScenario');
    if (calculateRateChangeScenarioBtn) {
        calculateRateChangeScenarioBtn.addEventListener('click', calculateRateChangeScenario);
    }
    
    // Portfolio buttons
    const addLoanRowBtn = document.querySelector('.add-loan-row');
    if (addLoanRowBtn) {
        addLoanRowBtn.addEventListener('click', addLoanRow);
    }
    
    const calculatePortfolioBtn = document.getElementById('calculatePortfolioBtn');
    if (calculatePortfolioBtn) {
        calculatePortfolioBtn.addEventListener('click', calculatePortfolioEMI);
    }
    
    // Affordability buttons
    const calculateAffordableLoanBtn = document.getElementById('calculateAffordableLoanBtn');
    if (calculateAffordableLoanBtn) {
        calculateAffordableLoanBtn.addEventListener('click', calculateAffordableLoan);
    }
    
    const calculateDtiBtn = document.getElementById('calculateDtiBtn');
    if (calculateDtiBtn) {
        calculateDtiBtn.addEventListener('click', calculateDTI);
    }
    
    // Advanced options
    initializeAdvancedOptions();
    
    // Advanced option buttons
    const addRateRowBtn = document.querySelector('.add-rate-row');
    if (addRateRowBtn) {
        addRateRowBtn.addEventListener('click', addVariableRateRow);
    }
    
    const addPrepaymentRowBtn = document.querySelector('.add-prepayment-row');
    if (addPrepaymentRowBtn) {
        addPrepaymentRowBtn.addEventListener('click', addPrepaymentRow);
    }
    
    // Add remove functionality to existing rows
    document.querySelectorAll('.remove-loan-row').forEach(btn => {
        btn.addEventListener('click', function() {
            btn.closest('tr').remove();
        });
    });
    
    document.querySelectorAll('.remove-row').forEach(btn => {
        btn.addEventListener('click', function() {
            btn.closest('tr').remove();
        });
    });
    
    // Initialize Google APIs when the page loads
    updateGoogleSheetsStatus('Click the button to save your loan data to Google Sheets', 'loading');
    setTimeout(() => {
        if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
            // APIs are loaded, ready to use
            updateGoogleSheetsStatus('Ready to save to Google Sheets. Click the button above.', 'success');
        } else {
            updateGoogleSheetsStatus('Google APIs not loaded. Check your internet connection.', 'error');
        }
    }, 2000);
});