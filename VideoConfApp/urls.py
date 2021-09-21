from django.urls import path
from . import views


app_name = 'VideoConfApp'

urlpatterns = [
	#path('create', views.create_room, name='create'),
	path('<str:link>', views.create_room, name='create'),
]

