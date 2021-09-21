web: daphne VideoConference.asgi:application --port $PORT --bind 0.0.0.0 -v2
chatworker: python manage.py runworker  --settings=VideoConference.settings -v2