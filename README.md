# Attendance Tracker Web Application

A modern web application for tracking associate attendance with real-time updates and JSON file storage. Easily deployable to AWS using multiple deployment options.

## Features

- **Modern Web Interface**: Clean, responsive design with HTML5, CSS3, and JavaScript
- **Login Protection**: Secure access to attendance view with modal login system
- **Auto-populated Date**: Current date is automatically filled
- **JSON Database Storage**: Uses JSON files for simple data persistence
- **Real-time Updates**: Attendance list refreshes automatically
- **Duplicate Prevention**: Prevents multiple attendance entries for the same day
- **Professional UI**: Modern gradient design with Font Awesome icons

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js with Express.js
- **Database**: JSON file storage (easily upgradeable to RDS/DynamoDB)
- **Styling**: Google Fonts (Inter), Font Awesome icons
- **API**: RESTful endpoints for attendance management
- **Deployment**: AWS-ready with Elastic Beanstalk, EC2, and App Runner support

## Installation

1. **Install Node.js** (if not already installed)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Application**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Open your browser and go to: `http://localhost:3001`

## Deployment

### AWS Deployment

This application is configured for easy deployment to AWS. See `DEPLOYMENT.md` for detailed instructions.

**Quick Start with Elastic Beanstalk:**
```bash
# Install AWS CLI and EB CLI
pip install awsebcli --upgrade --user

# Initialize and deploy
eb init
eb create attendance-app-prod
eb open
```

**Available deployment options:**
- **AWS Elastic Beanstalk** (Recommended)
- **AWS EC2** with manual setup
- **AWS App Runner** with containers
- **CI/CD** with GitHub Actions or AWS CodePipeline

## Usage

### Login to View Attendance

To access the attendance view page, you need to log in with valid credentials:

**Available Login Credentials:**
- **Username**: `admin` / **Password**: `admin123`
- **Username**: `manager` / **Password**: `manager123`
- **Username**: `hr` / **Password**: `hr123`

1. Click the **"View Attendance"** button in the navigation
2. Enter your username and password in the modal
3. Click **"Login"** to access the attendance view

### Marking Attendance

1. Enter your **Associate ID** (numbers only, e.g., 12345)
2. Enter your **Associate Name** (letters and spaces only, automatically capitalized)
3. **Date** is auto-populated with current date
4. Click **"Mark Attendance"** to submit

### Input Validation

- **Associate ID**: Must contain only numbers (1-9999999...)
- **Associate Name**: Must contain only letters and spaces (A-Z, a-z, and spaces)
- Invalid characters are automatically filtered as you type

### Viewing Attendance

- The right panel shows today's attendance records
- Records update automatically every 5 minutes
- Click **"Refresh"** to manually update the list
- View total count of attendees for the day

## API Endpoints

### POST `/api/login`
Validate user credentials
```json
{
  "username": "admin",
  "password": "admin123"
}
```

### POST `/api/attendance`
Mark attendance for an associate
```json
{
  "associate_id": "12345",
  "associate_name": "John Doe",
  "date": "2024-01-15"
}
```

**Validation Rules:**
- `associate_id`: Must be numeric only (e.g., "12345")
- `associate_name`: Must contain only letters and spaces (e.g., "John Doe")
- `date`: Must be in YYYY-MM-DD format

### GET `/api/attendance`
Get all attendance records (optionally filter by date)
```
/api/attendance?date=2024-01-15
```

### GET `/api/attendance/:associate_id`
Get attendance history for a specific associate
```
/api/attendance/EMP001
```

## Database Schema

The application uses JSON file storage with the following structure:

```json
{
  "attendance": [
    {
      "id": 1,
      "associate_id": "12345",
      "associate_name": "John Doe",
      "date": "2024-01-15",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "nextId": 2
}
```

**For Production**: Consider upgrading to AWS RDS (MySQL/PostgreSQL) or DynamoDB for better scalability and durability.

## File Structure

```
AttendanceApp/
├── server.js                    # Express server and API routes
├── package.json                 # Dependencies and scripts
├── attendance.json              # JSON database for attendance records
├── login.json                   # Login credentials storage
├── DEPLOYMENT.md                # AWS deployment guide
├── Dockerfile                   # Container configuration for App Runner
├── buildspec.yml                # AWS CodeBuild configuration
├── .ebextensions/
│   └── nodejs.config           # Elastic Beanstalk configuration
├── .github/workflows/
│   └── deploy-aws.yml          # GitHub Actions deployment workflow
├── public/
│   ├── index.html              # Main HTML page with login modal
│   ├── attendance-view.html    # Protected attendance view page
│   ├── attendance-view.js      # JavaScript for attendance view
│   ├── styles.css              # CSS styling with modal styles
│   └── script.js               # JavaScript functionality with login
└── README.md                   # This file
```

## Features in Detail

### Frontend
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Login Modal**: Secure modal-based login system
- **Form Validation**: Client-side validation with user feedback
- **Auto-formatting**: Associate names to title case
- **Visual Feedback**: Loading states, success/error messages
- **Protected Views**: Attendance view requires login authentication

### Backend
- **RESTful API**: Clean API endpoints for all operations
- **Data Validation**: Server-side validation for all inputs
- **Duplicate Prevention**: Prevents multiple entries for same day
- **Error Handling**: Comprehensive error handling and user feedback
- **CORS Enabled**: Cross-origin requests supported
- **Static File Serving**: Serves frontend files efficiently

### Database
- **JSON Files**: Simple, lightweight data storage (development/small scale)
- **Automatic Creation**: Files created automatically if they don't exist
- **Data Integrity**: Unique ID generation and validation
- **Timestamps**: Automatic timestamp tracking for audit trail
- **User Management**: Separate login credentials file for security
- **Production Ready**: Easy migration path to AWS RDS or DynamoDB

## Customization

### Adding Users
To add new login users, edit the `login.json` file:
```json
{
  "users": [
    {"username": "admin", "password": "admin123"},
    {"username": "newuser", "password": "newpassword"}
  ]
}
```

### Changing Database
To use a different database system, modify the file operations in `server.js` to use your preferred database.

### Styling
Modify `public/styles.css` to customize the appearance. The design uses CSS Grid and Flexbox for layout.

### Additional Fields
To add more fields (e.g., department, shift), update:
1. Database schema in `server.js`
2. HTML form in `public/index.html`
3. JavaScript validation in `public/script.js`

## Security Considerations

- **Input Sanitization**: All user inputs are sanitized
- **SQL Injection Prevention**: Uses parameterized queries
- **XSS Protection**: HTML escaping for displayed content
- **CORS Configuration**: Properly configured for production use

## Troubleshooting

### Common Issues

1. **Port Already in Use**: Change the PORT in server.js or environment variables
2. **Database Errors**: Ensure write permissions in the application directory
3. **Module Not Found**: Run `npm install` to install dependencies
4. **Browser Cache**: Clear browser cache if changes don't appear

### Development Mode
Run with `npm run dev` to enable auto-restart on file changes (requires nodemon).

## License

MIT License - Feel free to modify and distribute as needed.

## Support

For issues or questions, check the console logs in your browser's developer tools and the server console for error messages. 