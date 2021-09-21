

import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "VideoConference.settings")
import django
django.setup()
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
import VideoConfApp.routing



application = ProtocolTypeRouter({
  "http": get_asgi_application(),
  "websocket": AuthMiddlewareStack(
        URLRouter(
            VideoConfApp.routing.websocket_urlpatterns
        )
    ),
})