from django.conf.urls import url
from django.urls import path, re_path

from . import consumers

websocket_urlpatterns = [
	re_path(r'^meet/(?P<room_name>[^/]+)', consumers.VideoCallSignalConsumer.as_asgi()),
	#re_path('meet/<str:room_name>/', consumers.VideoCallSignalConsumer.as_asgi()),
]