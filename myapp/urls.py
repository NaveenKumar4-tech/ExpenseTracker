from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("", dashboard_page, name="dashboard"),
    path("signup/", signup_page, name="signup-page"),
    path("login/", login_page, name="login-page"),
    path("dashboard/", dashboard_page, name="dashboard"),
    path("analytics/", analytics, name="analytics"),
    path("transaction/", transaction, name="transaction"),
    path("accounts/", accounts, name="accounts"),
    
    # API (JWT auth)
    path("api/auth/signup/", SignupAPIView.as_view(), name="api-signup"),
    path("api/auth/login/", LoginAPIView.as_view(), name="api-login"),
    path("api/auth/logout/", LogoutAPIView.as_view(), name="api-logout"),
    path("api/auth/profile/", ProfileAPIView.as_view(), name="api-profile"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    
    path('api/expense/', ExpenseAPIView.as_view()),
    
    path('api/income/',IncomeAPIView.as_view()),
    path("api/transaction",TransactionDetails.as_view()),
    path("api/transaction/<id>",TransactionDetails.as_view()),
    path("api/category",CategoryDetails.as_view()),
    path("api/all-transactions", Transactions.as_view(), name="transactions"),
    path("api/users", UserDetails.as_view())
]