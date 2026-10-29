from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    user = models.ForeignKey(User,on_delete=models.CASCADE)
    type = models.CharField(max_length=20)
    
class Transaction(models.Model):
    user = models.ForeignKey(User,on_delete=models.CASCADE)
    type = models.CharField(max_length=20)
    category = models.ForeignKey(Category,on_delete=models.CASCADE)
    date = models.DateField(null=True)
    amount = models.DecimalField(max_digits=10,decimal_places=2)
    note = models.TextField()


