from django.db import models
from django.db.models.signals import m2m_changed
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User

# Create your models here.

status = (("Active","Active"),("Inactive","Inactive"),("Delete","Delete"))
role = (('host', 'host'), ('guest', 'guest'), ('observer', 'observer'))


class Contact(models.Model):
	username = models.CharField(max_length=50)
	role = models.CharField(max_length=50, choices=role)

class Room(models.Model):
	users = models.ManyToManyField(Contact, related_name='users')
	timestamp = models.DateTimeField(auto_now_add=True, editable=False)
	track = models.TextField(blank=True, editable=False)
	status = models.CharField(max_length=10,choices=status,default='Active')
	passcode = models.CharField(max_length=10, null = True)
	link = models.CharField(max_length=11)

	def __str__(self):
		users = ""
		for usr in self.users.all():
			users = users+usr.username+", "
		return str(users)