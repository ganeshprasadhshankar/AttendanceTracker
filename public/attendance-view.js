// DOM Elements
const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.getElementById('exportBtn');
const filterType = document.getElementById('filterType');
const dateFilter = document.getElementById('dateFilter');
const weekInput = document.getElementById('weekInput');
const monthInput = document.getElementById('monthInput');
const filterBtn = document.getElementById('filterBtn');
const totalCountElement = document.getElementById('totalCount');
const selectedDateElement = document.getElementById('selectedDate');
const attendanceRecordsContainer = document.getElementById('attendanceRecords');

// Filter elements containers
const dayFilterDiv = document.getElementById('dayFilter');
const weekFilterDiv = document.getElementById('weekFilter');
const monthFilterDiv = document.getElementById('monthFilter');

// Current data for export
let currentAttendanceData = [];
let currentFilterType = 'day';
let currentFilterValue = '';
let currentDateRange = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
    loadTodaysAttendance();
    
    // Set up event listeners
    refreshBtn.addEventListener('click', handleRefresh);
    exportBtn.addEventListener('click', exportToExcel);
    filterBtn.addEventListener('click', handleFilter);
    filterType.addEventListener('change', handleFilterTypeChange);
    dateFilter.addEventListener('change', handleFilter);
    weekInput.addEventListener('change', handleFilter);
    monthInput.addEventListener('change', handleFilter);
});

// Initialize filters with current date/week/month
function initializeFilters() {
    const today = new Date();
    
    // Initialize daily filter
    const todayString = today.toISOString().split('T')[0];
    dateFilter.value = todayString;
    
    // Initialize weekly filter
    const year = today.getFullYear();
    const weekNumber = getWeekNumber(today);
    weekInput.value = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    
    // Initialize monthly filter
    const monthString = `${year}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    monthInput.value = monthString;
    
    // Set initial values
    currentFilterType = 'day';
    currentFilterValue = todayString;
    updateSelectedDateDisplay();
}

// Handle filter type change
function handleFilterTypeChange() {
    currentFilterType = filterType.value;
    
    // Hide all filter inputs
    dayFilterDiv.style.display = 'none';
    weekFilterDiv.style.display = 'none';
    monthFilterDiv.style.display = 'none';
    
    // Show appropriate filter input
    switch (currentFilterType) {
        case 'day':
            dayFilterDiv.style.display = 'block';
            currentFilterValue = dateFilter.value;
            break;
        case 'week':
            weekFilterDiv.style.display = 'block';
            currentFilterValue = weekInput.value;
            break;
        case 'month':
            monthFilterDiv.style.display = 'block';
            currentFilterValue = monthInput.value;
            break;
    }
    
    updateSelectedDateDisplay();
    handleFilter();
}

// Handle filter application
function handleFilter() {
    switch (currentFilterType) {
        case 'day':
            currentFilterValue = dateFilter.value;
            if (currentFilterValue) {
                loadAttendanceByDate(currentFilterValue);
            }
            break;
        case 'week':
            currentFilterValue = weekInput.value;
            if (currentFilterValue) {
                loadAttendanceByWeek(currentFilterValue);
            }
            break;
        case 'month':
            currentFilterValue = monthInput.value;
            if (currentFilterValue) {
                loadAttendanceByMonth(currentFilterValue);
            }
            break;
    }
    updateSelectedDateDisplay();
}

// Handle refresh button
function handleRefresh() {
    handleFilter();
}

// Get week number for a date
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Update selected date display based on filter type
function updateSelectedDateDisplay() {
    const today = new Date().toISOString().split('T')[0];
    
    switch (currentFilterType) {
        case 'day':
            if (currentFilterValue === today) {
                selectedDateElement.textContent = 'Today';
                currentDateRange = 'Today';
            } else if (currentFilterValue) {
                const date = new Date(currentFilterValue);
                const formatted = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
                selectedDateElement.textContent = formatted;
                currentDateRange = formatted;
            }
            break;
            
        case 'week':
            if (currentFilterValue) {
                const [year, week] = currentFilterValue.split('-W');
                const weekDates = getWeekDateRange(parseInt(year), parseInt(week));
                selectedDateElement.textContent = `Week ${week}, ${year}`;
                currentDateRange = `${weekDates.start} - ${weekDates.end}`;
            }
            break;
            
        case 'month':
            if (currentFilterValue) {
                const [year, month] = currentFilterValue.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                const formatted = date.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                });
                selectedDateElement.textContent = formatted;
                currentDateRange = formatted;
            }
            break;
    }
}

// Get date range for a week
function getWeekDateRange(year, week) {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
    const startDate = new Date(year, 0, 1 + daysToAdd);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return {
        start: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        end: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
}

// Load today's attendance records
async function loadTodaysAttendance() {
    const today = new Date().toISOString().split('T')[0];
    await loadAttendanceByDate(today);
}

// Load attendance records by week
async function loadAttendanceByWeek(weekValue) {
    try {
        const [year, week] = weekValue.split('-W');
        const startDate = getWeekStartDate(parseInt(year), parseInt(week));
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        
        await loadAttendanceByDateRange(startDate, endDate);
    } catch (error) {
        console.error('Error loading weekly attendance:', error);
        showErrorMessage('Failed to load weekly attendance records');
    }
}

// Load attendance records by month
async function loadAttendanceByMonth(monthValue) {
    try {
        const [year, month] = monthValue.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
        
        await loadAttendanceByDateRange(startDate, endDate);
    } catch (error) {
        console.error('Error loading monthly attendance:', error);
        showErrorMessage('Failed to load monthly attendance records');
    }
}

// Get start date of a week
function getWeekStartDate(year, week) {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (week - 1) * 7 - firstDayOfYear.getDay() + 1;
    return new Date(year, 0, 1 + daysToAdd);
}

// Load attendance records by date range
async function loadAttendanceByDateRange(startDate, endDate) {
    try {
        // Add loading animation to refresh button
        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        refreshBtn.disabled = true;
        
        // Get all attendance records
        const response = await fetch('/api/attendance');
        const result = await response.json();
        
        if (result.success) {
            // Filter records by date range
            const filteredRecords = result.data.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate >= startDate && recordDate <= endDate;
            });
            
            currentAttendanceData = filteredRecords;
            displayAttendanceRecords(currentAttendanceData);
            updateAttendanceStats(currentAttendanceData.length);
        } else {
            console.error('Failed to load attendance records:', result.message);
            showErrorMessage('Failed to load attendance records');
        }
        
        // Restore refresh button
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
        
    } catch (error) {
        console.error('Error loading attendance records:', error);
        showErrorMessage('Network error. Please check your connection.');
        
        // Restore refresh button
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        refreshBtn.disabled = false;
    }
}

// Show error message
function showErrorMessage(message) {
    attendanceRecordsContainer.innerHTML = `
        <div class="no-records">
            <i class="fas fa-exclamation-triangle"></i>
            ${message}
        </div>
    `;
}

// Load attendance records by date
async function loadAttendanceByDate(date) {
    try {
        // Add loading animation to refresh button
        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        refreshBtn.disabled = true;
        
        const response = await fetch(`/api/attendance?date=${date}`);
        const result = await response.json();
        
        if (result.success) {
            currentAttendanceData = result.data;
            displayAttendanceRecords(currentAttendanceData);
            updateAttendanceStats(currentAttendanceData.length);
        } else {
            console.error('Failed to load attendance records:', result.message);
            attendanceRecordsContainer.innerHTML = `
                <div class="no-records">
                    <i class="fas fa-exclamation-triangle"></i>
                    Failed to load attendance records
                </div>
            `;
        }
        
        // Restore refresh button
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
        
    } catch (error) {
        console.error('Error loading attendance records:', error);
        attendanceRecordsContainer.innerHTML = `
            <div class="no-records">
                <i class="fas fa-wifi"></i>
                Network error. Please check your connection.
            </div>
        `;
        
        // Restore refresh button
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        refreshBtn.disabled = false;
    }
}

// Display attendance records
function displayAttendanceRecords(records) {
    if (records.length === 0) {
        const filterText = currentFilterType === 'day' ? 'selected date' : 
                          currentFilterType === 'week' ? 'selected week' : 'selected month';
        attendanceRecordsContainer.innerHTML = `
            <div class="no-records">
                <i class="fas fa-users"></i>
                No attendance records for ${filterText}
            </div>
        `;
        return;
    }
    
    // Sort records by date, then by time
    const sortedRecords = records.sort((a, b) => {
        const dateComparison = new Date(a.date) - new Date(b.date);
        if (dateComparison !== 0) return dateComparison;
        return new Date(a.created_at) - new Date(b.created_at);
    });
    
    const recordsHTML = sortedRecords.map((record, index) => {
        const createdAtFormatted = formatDateTime(record.created_at);
        const recordDate = new Date(record.date);
        const dateFormatted = recordDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: currentFilterType === 'month' ? 'numeric' : undefined
        });
        const dayOfWeek = recordDate.toLocaleDateString('en-US', { weekday: 'short' });
        
        // Show date info for week/month views
        const showDateInfo = currentFilterType !== 'day';
        
        return `
            <div class="record-item">
                <div class="record-header">
                    <div class="record-info">
                        <div class="record-name">${escapeHtml(record.associate_name)}</div>
                        <div class="record-id">ID: ${escapeHtml(record.associate_id)}</div>
                        ${showDateInfo ? `<div class="record-date">${dayOfWeek}, ${dateFormatted}</div>` : ''}
                    </div>
                    <div class="record-details">
                        <div class="record-time">${createdAtFormatted}</div>
                        <div class="record-number">#${index + 1}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    attendanceRecordsContainer.innerHTML = recordsHTML;
}

// Update attendance statistics
function updateAttendanceStats(count) {
    totalCountElement.textContent = count;
}

// Export to Excel
function exportToExcel() {
    if (currentAttendanceData.length === 0) {
        alert('No attendance data to export!');
        return;
    }
    
    try {
        // Add loading animation to export button
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
        exportBtn.disabled = true;
        
        // Prepare data for Excel
        const excelData = currentAttendanceData.map((record, index) => ({
            'S.No': index + 1,
            'Associate ID': record.associate_id,
            'Associate Name': record.associate_name,
            'Date': record.date,
            'Time Marked': formatDateTime(record.created_at),
            'Day': new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })
        }));
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Set column widths
        const colWidths = [
            { wch: 8 },  // S.No
            { wch: 15 }, // Associate ID
            { wch: 25 }, // Associate Name
            { wch: 12 }, // Date
            { wch: 20 }, // Time Marked
            { wch: 12 }  // Day
        ];
        ws['!cols'] = colWidths;
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
        
        // Generate filename based on filter type
        let filename;
        const dateString = new Date().toISOString().split('T')[0].replace(/-/g, '_');
        
        switch (currentFilterType) {
            case 'day':
                const dayForFile = currentFilterValue.replace(/-/g, '_');
                filename = `Attendance_Daily_${dayForFile}.xlsx`;
                break;
            case 'week':
                const [year, week] = currentFilterValue.split('-W');
                filename = `Attendance_Weekly_${year}_Week_${week}.xlsx`;
                break;
            case 'month':
                const [monthYear, month] = currentFilterValue.split('-');
                filename = `Attendance_Monthly_${monthYear}_${month}.xlsx`;
                break;
            default:
                filename = `Attendance_${dateString}.xlsx`;
        }
        
        // Download file
        XLSX.writeFile(wb, filename);
        
        // Show success message
        showNotification(`Excel file downloaded: ${filename}`, 'success');
        
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showNotification('Failed to export Excel file. Please try again.', 'error');
    } finally {
        // Restore export button
        exportBtn.innerHTML = originalText;
        exportBtn.disabled = false;
    }
}

// Show notification
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Format datetime for display
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    
    try {
        const date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        return dateTimeString;
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Auto-refresh attendance every 5 minutes
setInterval(() => {
    loadAttendanceByDate(currentSelectedDate);
}, 5 * 60 * 1000); 