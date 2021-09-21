from django import forms

class JoinForm(forms.Form):
    meet_id = forms.CharField(max_length=50, label="Enter video conference id:")
    user = forms.CharField(max_length=50, label="Your Name:")

class CreateForm(forms.Form):
    user = forms.CharField(max_length=50, label="Your Name:")