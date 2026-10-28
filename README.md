
# ExpenseX – Expense Tracker 💰

A responsive expense management web application that helps users track their income, manage expenses, organize transactions, and monitor their financial activities. The application uses Django REST Framework (DRF) for backend API development and JWT authentication to secure user access.

## 🚀 Features

- **User Authentication**
  - User registration and login
  - JWT-based authentication
  - Secure access to protected APIs
  - Access token and refresh token support

- **Dashboard**
  - Overview of total income and expenses
  - Current balance summary
  - Recent transaction details

- **Transaction Management**
  - Add income and expense transactions
  - View transaction history
  - Update and delete transactions
  - Categorize transactions

- **Analytics**
  - Analyze income and spending patterns
  - Visualize financial data using charts
  - Monitor expenses by category

- **Account Management**
  - View and update profile information
  - Manage account details

- **Responsive User Interface**
  - Built with HTML, CSS, and JavaScript
  - Sidebar navigation
  - Active navigation indicators
  - Responsive layout for desktop, tablet, and mobile

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Python | Backend programming language |
| Django | Web framework |
| Django REST Framework | REST API development |
| Simple JWT | JWT authentication |
| HTML5 | Page structure |
| CSS3 | Styling and responsive design |
| JavaScript | Frontend interactions and API requests |
| SQLite / PostgreSQL | Database (depending on configuration) |
| Git & GitHub | Version control and source code management |

## 📂 Project Structure

The following is a sample project structure. Update it to match your actual repository.

```text
ExpenseX/
│
├── manage.py
├── requirements.txt
├── README.md
├── .env
├── .gitignore
│
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── users/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── permissions.py
│
├── transactions/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
│
├── templates/
│   ├── base.html
│   ├── dashboard.html
│   ├── transactions.html
│   ├── analytics.html
│   └── accounts.html
│
└── static/
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── auth.js
    │   ├── nav.js
    │   ├── script.js
    │   ├── transactions.js
    │   ├── analytics.js
    │   └── accounts.js
    └── images/
```

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ExpenseX.git
```

Navigate to the project directory:

```bash
cd ExpenseX
```

### 2. Create a Virtual Environment

```bash
python -m venv venv
```

Activate the environment.

**Windows:**

```bash
venv\Scripts\activate
```

**Linux / macOS:**

```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

If you do not have a `requirements.txt` file yet, install the core packages:

```bash
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers python-dotenv
```

Install a PostgreSQL driver if your project uses PostgreSQL.

### 4. Configure Environment Variables

Create a `.env` file in the project root if your settings load environment variables from this file.

Example:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
```

For PostgreSQL, configure the database variables required by your Django settings, for example:

```env
DB_NAME=expensex_db
DB_USER=postgres
DB_PASSWORD=your-database-password
DB_HOST=localhost
DB_PORT=5432
```

**Important:** Replace the example values with your actual configuration. Never commit real secrets or production credentials to GitHub.

### 5. Apply Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

If Django displays `No changes detected`, it means it did not find new model changes to generate migrations for the apps it checked. Ensure your applications are registered in `INSTALLED_APPS` and your models are saved.

### 6. Create a Superuser (Optional)

```bash
python manage.py createsuperuser
```

Use the superuser credentials to access the Django admin panel if it is configured.

### 7. Run the Development Server

```bash
python manage.py runserver
```

Open the application in your browser:

```text
http://127.0.0.1:8000/
```

The Django admin panel, if enabled, is available at:

```text
http://127.0.0.1:8000/admin/
```

## 🔐 JWT Authentication

ExpenseX uses JSON Web Tokens (JWT) to authenticate users when accessing protected API endpoints.

### Authentication Flow

1. A user registers an account.
2. The user logs in with their credentials.
3. The backend validates the credentials and issues JWT tokens.
4. The frontend includes the access token in requests to protected APIs.
5. The backend validates the token before processing the request.
6. When the access token expires, the frontend can request a new token using the refresh token, if refresh support is configured.

### Example Authorization Header

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Example API Request Using JavaScript

```javascript
const token = localStorage.getItem("access_token");

const response = await fetch("/api/transactions/", {
    method: "GET",
    headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    }
});

if (response.ok) {
    const data = await response.json();
    console.log(data);
} else {
    console.error("Failed to fetch transactions:", response.status);
}
```

Adjust the token storage key and API URL to match your frontend implementation.

## 🌐 API Endpoints

The following endpoints are examples of a possible API design. Replace them with the actual routes defined in your Django URL configuration.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/register/` | Register a new user |
| POST | `/api/users/login/` | Obtain JWT tokens |
| POST | `/api/users/token/refresh/` | Refresh an access token |
| GET | `/api/users/profile/` | Retrieve the user's profile |
| PUT / PATCH | `/api/users/profile/` | Update the user's profile |
| GET | `/api/transactions/` | List transactions |
| POST | `/api/transactions/` | Create a transaction |
| GET | `/api/transactions/<id>/` | Retrieve a transaction |
| PUT / PATCH | `/api/transactions/<id>/` | Update a transaction |
| DELETE | `/api/transactions/<id>/` | Delete a transaction |
| GET | `/api/analytics/` | Retrieve financial analytics |

All endpoint paths and supported methods depend on the actual implementation.

## 🧪 Testing the API

You can test the backend using **Postman** or another REST API client.

1. Start the Django development server.
2. Send a POST request to your registration endpoint with the required user details.
3. Log in and retrieve the JWT access token.
4. Copy the access token.
5. Open a protected endpoint and add the authorization header:

   ```http
   Authorization: Bearer YOUR_ACCESS_TOKEN
   ```

6. Send GET, POST, PUT, PATCH, or DELETE requests as supported by the endpoint.
7. Verify the response status and returned JSON data.

Common HTTP response codes include:

- `200 OK` – Request successful.
- `201 Created` – Resource created.
- `400 Bad Request` – Invalid request data.
- `401 Unauthorized` – Missing, invalid, or expired authentication credentials.
- `403 Forbidden` – Access denied.
- `404 Not Found` – Requested resource does not exist.

## 🔒 Security Considerations

- Keep Django's `SECRET_KEY` private.
- Never commit `.env` files or database passwords.
- Use HTTPS in production.
- Validate and sanitize incoming data through serializers.
- Protect private APIs using appropriate authentication and permissions.
- Ensure users can access only their own transactions.
- Use secure token storage and configure token expiration appropriately.
- Disable Django debug mode in production.
- Configure allowed hosts and CORS policies appropriately.

## 🚀 Future Enhancements

- Monthly and yearly financial reports
- Budget limits and spending alerts
- Export transactions to CSV or PDF
- Recurring income and expense tracking
- Search, filtering, and pagination
- Email notifications
- Dark mode
- Progressive Web App (PWA) support

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push your branch to GitHub.
5. Open a pull request describing your changes.

## 📄 License

This project is available for educational and personal development purposes. Add a `LICENSE` file to specify the license under which you distribute the project.

## 👨‍💻 Author

**Your Name**

GitHub: https://github.com/your-username

---

⭐ If you find ExpenseX useful, consider giving the repository a star!
```
