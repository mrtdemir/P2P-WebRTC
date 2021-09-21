from django.shortcuts import render, redirect,HttpResponseRedirect,reverse
from django.contrib.auth.base_user import BaseUserManager
from django.utils.safestring import mark_safe
from django.contrib.auth import login, authenticate, logout
import json
from .forms import *
from .models import *
from django.contrib import messages
from django.http import JsonResponse
from urllib.parse import urlencode, quote_plus

# Create your views here.

def index(request):
    join_form = JoinForm(request.POST or None)
    create_form = CreateForm(request.POST or None)

    if join_form.is_valid():
        link = join_form.cleaned_data['meet_id']
        room = Room.objects.filter(link=link)
        if not room:
            messages.warning(request,"Room not valid.")
            return redirect('index')
        else:
            username = join_form.cleaned_data.get('user')
            user = Contact(username=username, role='guest')
            user.save()
            room[0].users.add(user.id)

            request.session['username'] = username
            request.session['user_status'] = user.role
            return redirect('meet/'+link)
    elif create_form.is_valid():
        username = create_form.cleaned_data.get('user')
        user = Contact(username=username, role='host')
        user.save()

        room = Room(status="Active")
        room.save()
        room.users.add(user.id)
        room.passcode = BaseUserManager().make_random_password(4)
        passcode = room.passcode

        link = BaseUserManager().make_random_password(5)
        link = str(link) + str(room.id)
        room.link = link
        room.save()
        request.session.flush()

        request.session['username'] = username
        request.session['user_status'] = user.role
        context = {
            'passcode': passcode,
        }
        result = urlencode(context, quote_via=quote_plus)
        return redirect('meet/'+link+"?%s"%result)

    context = {
        'join_form': join_form,
        'create_form': create_form,
    }
    return render(request, "index.html", context)

def create_room(request, link):
    room = (Room.objects.filter(link=link))[0]
    try:
        userstatus = request.session['user_status'] 
        username = request.session['username']
    except:
        userstatus = None
        username = None
    return render(request, 'video.html', {
        'room_name_json': mark_safe(json.dumps(link)),
        'userStatus': mark_safe(json.dumps(userstatus)),
        'username': mark_safe(json.dumps(username)),
        'passcode': mark_safe(json.dumps(room.passcode))
    })