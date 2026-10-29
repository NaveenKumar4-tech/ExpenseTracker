from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status,permissions
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.shortcuts import render
from .models import *
from django.db.models import Sum,Count
from .serializers import *
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.exceptions import InvalidToken



def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# ---------- Page-rendering views (serve the HTML templates) ----------

def signup_page(request):
    return render(request, "signup.html")

def login_page(request):
    return render(request, "login.html")

def dashboard_page(request):    
    return render(request,"dashboard.html")

def analytics(request):
    return render(request,"analytics.html")

def transaction(request):
    return render(request,"transactions.html")

def accounts(request):
    return render(request,"accounts.html")

# ---------- API views (APIView class format) ----------

class SignupAPIView(APIView):
    """
    POST /api/auth/signup/
    body: { "username": "", "email": "", "password": "", "confirm_password": "" }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            return Response(
                {
                    "message": "Signup successful.",
                    "user": {"id": user.id, "username": user.username, "email": user.email},
                    "tokens": tokens,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginAPIView(APIView):
    """
    POST /api/auth/login/
    body: { "username": "", "password": "" }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            tokens = get_tokens_for_user(user)
            return Response(
                {
                    "message": "Login successful.",
                    "user": {"id": user.id, "username": user.username, "email": user.email},
                    "tokens": tokens,
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutAPIView(APIView):
    """
    POST /api/auth/logout/
    body: { "refresh": "<refresh_token>" }
    Blacklists the refresh token (requires blacklist app enabled).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logout successful."}, status=status.HTTP_205_RESET_CONTENT)
        except TokenError:
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)


class ProfileAPIView(APIView):
    """
    GET /api/auth/profile/
    Protected route - requires a valid access token in the Authorization header.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            status=status.HTTP_200_OK,
        )

        
class ExpenseAPIView(APIView):
     def post(self, request):

        try:
            user = request.user
            category_id = request.data.get("category")
            amount = request.data.get("amount")
            expense_type = request.data.get("type")
            note = request.data.get("description")
            date = request.data.get("date")
            
            if not category_id:
                return Response({
                    "status":"error",
                    "message":"Category required"
                })

            if not amount:
                return Response({
                    "status":"error",
                    "message":"Amount required"
                })

            Transaction.objects.create(
                user=user,
                category_id=category_id,
                amount=amount,
                type=expense_type,
                note = note,
                date = date
            )

            return Response({
                "status":"success",
                "message":"Expense added"
            })

        except Exception as e:

            return Response({
                "status":"error",
                "message":str(e)
            })

class IncomeAPIView(APIView):

    def post(self, request):

        try:
            user = request.user

            category_id = request.data.get("category")
            amount = request.data.get("amount")
            expense_type = request.data.get("type")
            note = request.data.get("description")
            date = request.data.get("date")
            
            print("category", category_id)

            if not category_id:
                return Response({
                    "status": "error",
                    "message": "Category required"
                })

            if not amount:
                return Response({
                    "status": "error",
                    "message": "Amount required"
                })

            Transaction.objects.create(
                user=user,
                category_id=category_id,
                amount=amount,
                type=expense_type,
                note = note,
                date = date
            )

            Transaction.objects.filter(
                user = request.user,
                
            )

            return Response({
                "status": "success",
                "message": "Income added"
            })

        except Exception as e:

            return Response({
                "status": "error",
                "message": str(e)
            })   


class TransactionDetails(APIView):
    
    permission_classes = [IsAuthenticated]

    def get(self,request):
        try:
            transaction = Transaction.objects.filter(user=request.user)
            serializer = TransactionSerializer(transaction,many=True)        
            
            income = Transaction.objects.filter(
                user = request.user,
                type = "income"
            )
            
            expense = Transaction.objects.filter(
                user = request.user,
                type = "expense"
            )
            
            total_income = income.aggregate(total=Sum('amount'))['total'] or 0
            total_expense = expense.aggregate(total=Sum('amount'))['total'] or 0
            balance = total_income - total_expense
            
            return Response({
                "message":"Data fetched",
                "data":serializer.data,
                "success":True,
                "total_income" : total_income,
                "total_expense":total_expense,
                "balance":balance,
                "user":request.user.username
            })
         
        except Exception as e:
            return Response({
                "message":"error",
                "error":str(e)
            })
            
    def delete(self,request,id):
        try:
            transaction= Transaction.objects.get(id=id)
            transaction.delete()

            return Response({
                "message":"Deleted Successfully"
            })
            
        except Exception as e:
            return Response({
                "error":str(e)
            })

class CategoryDetails(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        try:
            category = Category.objects.all()
            serializer = CategorySerializer(category,many=True)
            
            return Response({
                "data":serializer.data,
                "message":"data fetched"
            })
    
        except Exception as e:
            return Response({
                "message":"error",
                "error":str(e)
                })
            

class Transactions(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        try:
            transactions = Transaction.objects.filter(
                user=request.user
            )
            serializer=TransactionSerializer(transactions,many=True)
        
            return Response({
                "message":"data fetched",
                "data":serializer.data,
                "success":True
            })
        except Exception as e :
            return Response({
                "message":"error",
                "error":str(e)
            },status=400)

class UserDetails(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self,request):
        try:
            user = User.objects.filter(
                username = request.user
            )
            serializer = UserSerializer(user,many=True)
            return Response({
                "message":"Details Fetched",
                "data": serializer.data
            })
        except Exception as e:
            return Response({
                "error":str(e)
            })
    
    def put(self, request):
        user = request.user

        serializer = UserSerializer(
            user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response({
                "message": "User edited successfully",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request):
        user = request.user
        user.delete()

        return Response(
            {"message": "User deleted successfully"},
            status=status.HTTP_200_OK
        )
        

