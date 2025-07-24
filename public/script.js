// DOM Elements
const attendanceForm = document.getElementById('attendanceForm');
const messageDiv = document.getElementById('message');
const dateInput = document.getElementById('date');

// Login elements
const viewAttendanceBtn = document.getElementById('viewAttendanceBtn');
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const closeModal = document.querySelector('.close');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeDate();
    
    // Set up event listeners
    attendanceForm.addEventListener('submit', handleFormSubmit);
    
    // Login functionality
    viewAttendanceBtn.addEventListener('click', showLoginModal);
    loginForm.addEventListener('submit', handleLoginSubmit);
    closeModal.addEventListener('click', hideLoginModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            hideLoginModal();
        }
    });
});

// Initialize date field
function initializeDate() {
    const now = new Date();
    
    // Set current date
    const today = now.toISOString().split('T')[0];
    dateInput.value = today;
}

// Show login modal
function showLoginModal() {
    loginModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Hide login modal
function hideLoginModal() {
    loginModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
    
    // Clear form and message
    loginForm.reset();
    loginMessage.style.display = 'none';
}

// Handle login form submission
async function handleLoginSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(loginForm);
    const loginData = {
        username: formData.get('username').trim(),
        password: formData.get('password').trim()
    };
    
    // Validate form data
    if (!loginData.username || !loginData.password) {
        showLoginMessage('Please fill in all fields.', 'error');
        return;
    }
    
    try {
        // Disable submit button during request
        const submitBtn = loginForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;
        
        // Fetch login credentials
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showLoginMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to attendance view after a short delay
            setTimeout(() => {
                window.location.href = 'attendance-view.html';
            }, 1000);
        } else {
            showLoginMessage(result.message, 'error');
        }
        
        // Re-enable submit button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
    } catch (error) {
        console.error('Error during login:', error);
        showLoginMessage('Login failed. Please try again.', 'error');
        
        // Re-enable submit button
        const submitBtn = loginForm.querySelector('.submit-btn');
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        submitBtn.disabled = false;
    }
}

// Show login message
function showLoginMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `message ${type}`;
    loginMessage.style.display = 'block';
    
    // Hide message after 5 seconds (except success messages)
    if (type !== 'success') {
        setTimeout(() => {
            loginMessage.style.display = 'none';
        }, 5000);
    }
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(attendanceForm);
    const attendanceData = {
        associate_id: formData.get('associateId').trim(),
        associate_name: formData.get('associateName').trim(),
        date: formData.get('date')
    };
    
    // Validate form data
    if (!attendanceData.associate_id || !attendanceData.associate_name) {
        showMessage('Please fill in all required fields.', 'error');
        return;
    }
    
    // Validate Associate ID is a number
    if (!/^\d+$/.test(attendanceData.associate_id)) {
        showMessage('Associate ID must contain only numbers.', 'error');
        return;
    }
    
    // Validate Associate Name contains only letters and spaces
    if (!/^[A-Za-z\s]+$/.test(attendanceData.associate_name)) {
        showMessage('Associate Name must contain only letters and spaces.', 'error');
        return;
    }
    
    // Additional validation for empty spaces
    if (attendanceData.associate_name.trim().length === 0) {
        showMessage('Associate Name cannot be empty or contain only spaces.', 'error');
        return;
    }
    
    try {
        // Disable submit button during request
        const submitBtn = attendanceForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Marking Attendance...';
        submitBtn.disabled = true;
        
        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(attendanceData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(result.message, 'success');
            
            // Clear form inputs (except date)
            document.getElementById('associateId').value = '';
            document.getElementById('associateName').value = '';
        } else {
            showMessage(result.message, 'error');
        }
        
        // Re-enable submit button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
    } catch (error) {
        console.error('Error marking attendance:', error);
        showMessage('Failed to mark attendance. Please try again.', 'error');
        
        // Re-enable submit button
        const submitBtn = attendanceForm.querySelector('.submit-btn');
        submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Mark Attendance';
        submitBtn.disabled = false;
    }
}

// Show message to user
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Hide message after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Add some visual feedback for form interactions
document.getElementById('associateId').addEventListener('input', function() {
    // Remove any non-numeric characters
    this.value = this.value.replace(/[^0-9]/g, '');
});

document.getElementById('associateName').addEventListener('input', function() {
    // Remove any non-letter characters (except spaces)
    this.value = this.value.replace(/[^A-Za-z\s]/g, '');
    // Capitalize first letter of each word
    this.value = this.value.replace(/\b\w/g, l => l.toUpperCase());
}); 