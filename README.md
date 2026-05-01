# EduMaster Frontend Testing Interface

A modern, comprehensive web-based testing interface for the EduMaster backend API. This frontend provides an easy-to-use interface for testing all backend features without requiring Postman or similar tools.

## Features

### 🎨 Modern Design
- Premium dark theme with glassmorphism effects
- Smooth animations and transitions
- Responsive layout for all devices
- Real-time API response display
- Toast notifications for user feedback

### ✨ Complete API Coverage
The frontend provides testing interfaces for all backend features:

- **🔐 Authentication & Profile**
  - User login with JWT tokens
  - Profile viewing and updating
  - Automatic token management

- **📚 Subjects Management**
  - Create new subjects
  - List all subjects
  - Subject filtering

- **📄 Documents Management**
  - Upload documents (PDF, DOCX, PPTX, Images)
  - List documents with subject filtering
  - Document details viewing

- **🤖 RAG System**
  - Query documents with AI
  - Generate questions from content
  - Get question suggestions

- **✅ Grading System**
  - Upload answer sheet images
  - Submit for AI-powered grading
  - View detailed grading results

- **🏫 Classes Management**
  - Create classes
  - List all classes
  - Class filtering

- **👨‍🎓 Students Management**
  - Create students
  - List students by class
  - Student details

- **📝 Papers Management**
  - Create exam papers
  - List papers
  - Paper details

- **📊 Analytics & Notifications**
  - View analytics dashboard
  - Check notifications

- **⚙️ System Health**
  - Health check monitoring
  - API configuration

## Getting Started

### Prerequisites
- A running EduMaster backend server (default: `http://localhost:8010`)
- A modern web browser (Chrome, Firefox, Edge, Safari)

### Installation

1. The frontend is already set up in the `frontend/` folder
2. No build process or dependencies required - it's pure HTML, CSS, and JavaScript!

### Running the Frontend

Simply open the `index.html` file in your web browser:

**Option 1: Direct File Open**
```
Double-click index.html
```

**Option 2: Using a Local Server (Recommended)**

If you have Python installed:
```bash
# Python 3
cd frontend
python -m http.server 5174

# Then open http://localhost:5174 in your browser
```

If you have Node.js installed:
```bash
# Install http-server globally (if not already installed)
npm install -g http-server

# Run the server
cd frontend
http-server -p 5174

# Then open http://localhost:5174 in your browser
```

**Option 3: Using VS Code Live Server**
```
1. Install "Live Server" extension in VS Code
2. Right-click on index.html
3. Select "Open with Live Server"
```

## Usage Guide

### 1. Start Your Backend
Make sure your EduMaster backend is running:
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8010
```

### 2. Configure Backend URL
- Open the frontend in your browser
- Go to the **System** tab
- Update the "Backend API URL" if your backend is not running on `http://localhost:8010`
- Click "Update URL"

### 3. Authenticate
- Go to the **Auth** tab
- Enter your credentials (email and password)
- Click "Login"
- The auth status indicator will turn green when authenticated

### 4. Test Features
Navigate through the tabs to test different features:

#### Creating a Subject
1. Go to **Subjects** tab
2. Fill in the subject details
3. Click "Create Subject"
4. View the response in the API Response panel

#### Uploading Documents
1. Go to **Documents** tab
2. Click "🔄 Refresh" to load available subjects
3. Select a subject from the dropdown
4. Choose a file (PDF, DOCX, PPTX, or image)
5. Click "Upload Document"

#### RAG Queries
1. Go to **RAG** tab
2. Select a subject (make sure it has documents uploaded)
3. Enter your query
4. Click "Ask Question"
5. View the AI-generated response

#### Grading Answer Sheets
1. Go to **Grading** tab
2. Upload answer sheet images
3. Fill in grading details
4. Click "Grade Submission"
5. View detailed grading results

### 5. Monitor Responses
- All API responses are displayed in the **API Response** panel at the bottom
- Use the "📋 Copy" button to copy responses
- Use the "🗑️ Clear" button to clear the response panel

## Features Guide

### Authentication Status
The header shows your current authentication status:
- 🔴 **Red dot**: Not authenticated
- 🟢 **Green dot**: Authenticated

### Toast Notifications
- ✅ **Green**: Success messages
- ❌ **Red**: Error messages
- ℹ️ **Blue**: Information messages
- ⚠️ **Orange**: Warning messages

### Dropdown Refresh
Many forms have dropdowns for subjects or classes. Use the "🔄" button next to dropdowns to refresh the options from the backend.

## Troubleshooting

### CORS Errors
If you see CORS errors in the console:

1. Make sure your backend has CORS enabled
2. Check your backend's `.env` file:
   ```
   CORS_ORIGINS=["*"]
   ```
   Or specify your frontend URL:
   ```
   CORS_ORIGINS=["http://localhost:5174"]
   ```

### Backend Connection Failed
- Verify your backend is running
- Check the backend URL in the System tab
- Run a health check from the System tab

### Authentication Issues
- Make sure you have valid credentials
- Check if the auth endpoint matches your backend implementation
- The default endpoint is `/api/v1/auth/login` - adjust in `app.js` if different

### File Upload Failures
- Check file size limits (default max: 50MB)
- Verify file type is supported
- Ensure you're authenticated before uploading

## Customization

### Changing the API Base URL
Edit in `app.js`:
```javascript
let API_BASE_URL = 'http://your-backend-url:port';
```

### Modifying the Theme
Edit colors in `styles.css` under the `:root` section:
```css
:root {
    --accent-primary: #6366f1;
    --accent-secondary: #8b5cf6;
    /* ... more colors */
}
```

### Adding New Endpoints
1. Add a form in `index.html`
2. Create a handler function in `app.js`
3. Use the `apiRequest()` or `apiRequestFormData()` helper functions

## API Response Format

All responses are displayed in JSON format in the response panel. The frontend handles:
- JSON responses (formatted with syntax highlighting)
- Plain text responses
- Error responses with proper error messages

## Browser Compatibility

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

## Tips & Best Practices

1. **Always authenticate first** before testing protected endpoints
2. **Create subjects** before uploading documents or creating papers
3. **Upload documents** before testing RAG queries
4. **Create classes** before adding students
5. **Use the refresh buttons** to update dropdowns after creating new data
6. **Monitor the response panel** to see detailed API responses
7. **Check the health endpoint** if you're having connection issues

## Security Notes

- JWT tokens are stored in browser localStorage
- Tokens persist across page reloads
- Click "Logout" to clear your token
- Don't share your tokens or credentials
- This is a testing interface - not for production use

## Support

If you encounter issues:
1. Check the browser console for errors (F12)
2. Verify your backend is running and accessible
3. Test the health endpoint first
4. Check CORS configuration on the backend
5. Verify authentication credentials

## License

This testing interface is part of the EduMaster project.

---

**Happy Testing! 🎓**
