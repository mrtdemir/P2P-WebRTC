var mapPeers = {};

var mapScreenPeers = {};

const localVideo = document.querySelector('#local-video');

var localStream = new MediaStream();

var localDisplayStream = new MediaStream();

btnToggleAudio = document.querySelector("#btn-toggle-audio");
btnToggleVideo = document.querySelector("#btn-toggle-video");

var messageInput = document.querySelector('#msg');
var btnSendMsg = document.querySelector('#btn-send-msg');

var ul = document.querySelector("#message-list");

var loc = window.location;

var endPoint = '';
var wsStart = 'ws://';

if(loc.protocol == 'https:'){
    wsStart = 'wss://';
}

var endPoint = wsStart + loc.host + loc.pathname;

document.querySelector('#roomurl').innerHTML = "Room URL : https://videoconference.herokuapp.com/meet/"+roomName+"?passcode="+passcode

var webSocket;

var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);
var guest_password = urlParams.get('passcode')

if (username == null){
    do{
        username = prompt("Please enter a username: ", "");
    }while(username == null || username == "" );
}

if (userStatus != "host" && guest_password == null){
    do{
        guest_password = prompt("Please enter the passcode: ", "" );
    }while(guest_password == null || guest_password == "" );
    while(passcode!=guest_password){
        alert("Wrong passcode.")
        do{
            guest_password = prompt("Please enter the passcode: ", "" );
        }while(guest_password == null || guest_password == "" );
    }
    userStatus = "guest";
}

if (!userStatus){
    userStatus = "guest";
}

    document.querySelector('#label-username').innerHTML = username;
    document.querySelector('#label-status').innerHTML = "("+userStatus+")";
    webSocket = new WebSocket(endPoint);
    my_userstatus = userStatus;
    webSocket.onopen = function(e){
        console.log('Connection opened! ', e);

        sendSignal('new-peer', {
            'status': userStatus,
            'roomName':roomName,
            'passcode':passcode,
            'username':username
        });
    
    webSocket.onmessage = webSocketOnMessage;
    
    webSocket.onclose = function(e){
        console.log('Connection closed! ', e);
    }
    
    webSocket.onerror = function(e){
        console.log('Error occured! ', e);
    }

    btnSendMsg.disabled = false;
    messageInput.disabled = false;
    }

function webSocketOnMessage(event){
    var parsedData = JSON.parse(event.data);

    var action = parsedData['action'];

    var peerUsername = parsedData['peer'];

    var peeruserStatus = parsedData['message']['status'];
    
    console.log('peerUsername: ', peerUsername);
    console.log('action: ', action);

    if(peerUsername == username){
        return;
    }

    var remoteScreenSharing = parsedData['message']['local_screen_sharing'];

    var receiver_channel_name = parsedData['message']['receiver_channel_name'];
    console.log('receiver_channel_name: ', receiver_channel_name);
    if (action=="makeobserver"){
        localStream = window.stream;

        audioTracks = localStream.getAudioTracks();
        videoTracks = localStream.getVideoTracks();

        audioTracks[0].enabled = !audioTracks[0].enabled;
        videoTracks[0].enabled = !videoTracks[0].enabled;

        if(!audioTracks[0].enabled){
            btnToggleAudio.disabled = true;
            btnToggleVideo.disabled = true;
            document.getElementById('label-status').innerHTML = "Observer";
            return;
        }
        btnToggleAudio.disabled = false;
        btnToggleVideo.disabled = false;
        document.getElementById('label-status').innerHTML = "Guest";
    }
    // in case of new peer
    if(action == 'new-peer'){
        console.log('New peer: ', peerUsername);

        // create new RTCPeerConnection
        createOfferer(peerUsername, false, remoteScreenSharing, receiver_channel_name,peeruserStatus);

        return;
    }

    // remote_screen_sharing from the remote peer
    // will be local screen sharing info for this peer
    var localScreenSharing = parsedData['message']['remote_screen_sharing'];

    if(action == 'new-offer'){
        console.log('Got new offer from ', peerUsername);

        // create new RTCPeerConnection
        // set offer as remote description
        var offer = parsedData['message']['sdp'];
        console.log('gelenOffer: ', peeruserStatus);

        var peer = createAnswerer(offer, peerUsername, localScreenSharing, remoteScreenSharing, receiver_channel_name,peeruserStatus);
        return;
    }
    
    if(action == 'new-answer'){

        var peer = null;
        
        if(remoteScreenSharing){
            // if answerer is screen sharer
            peer = mapPeers[peerUsername + ' Screen'][0];
        }else if(localScreenSharing){
            // if offerer was screen sharer
            peer = mapScreenPeers[peerUsername][0];
        }else{
            // if both are non-screen sharers
            peer = mapPeers[peerUsername][0];
        }

        // get the answer
        var answer = parsedData['message']['sdp'];
        
        console.log('mapPeers:');
        for(key in mapPeers){
            console.log(key, ': ', mapPeers[key]);
        }

        console.log('peer: ', peer);
        console.log('answer: ', answer);

        peer.setRemoteDescription(answer);

        return;
    }
}

messageInput.addEventListener('keyup', function(event){
    if(event.keyCode == 13){
        event.preventDefault();
        btnSendMsg.click();
    }
});

btnSendMsg.onclick = btnSendMsgOnClick;

function btnSendMsgOnClick(){
    var message = messageInput.value;
    
    var li = document.createElement("li");
    li.className = "list-group-item";
    li.appendChild(document.createTextNode("Me: " + message));
    ul.appendChild(li);
    
    var dataChannels = getDataChannels();

    console.log('Sending: ', message);

    for(index in dataChannels){
        dataChannels[index].send(username + ': ' + message);
    }
    
    messageInput.value = '';
}

const constraints = {
    "audio": true,
    "video": true
};

const iceConfiguration = {
    iceServers: [
        {
            url: 'stun:stun.l.google.com:19302'
        },
        {
            urls: ['turn:numb.viagenie.ca'],
            credential: "ID",
            username: "xxx@gmail.com"
        }
    ]
};

userMedia = navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localStream = stream;
        console.log('Got MediaStream:', stream);
        var mediaTracks = stream.getTracks();
        
        for(i=0; i < mediaTracks.length; i++){
            console.log(mediaTracks[i]);
        }
        
        localVideo.srcObject = localStream;
        localVideo.muted = true;

        window.stream = stream;

        audioTracks = stream.getAudioTracks();
        videoTracks = stream.getVideoTracks();

        audioTracks[0].enabled = true;
        videoTracks[0].enabled = true;

        btnToggleAudio.onclick = function(){
            audioTracks[0].enabled = !audioTracks[0].enabled;
            if(audioTracks[0].enabled){
                btnToggleAudio.innerHTML = 'Audio Mute';
                return;
            }
            
            btnToggleAudio.innerHTML = 'Audio Unmute';
        };

        btnToggleVideo.onclick = function(){
            videoTracks[0].enabled = !videoTracks[0].enabled;
            if(videoTracks[0].enabled){
                btnToggleVideo.innerHTML = 'Video Off';
                return;
            }

            btnToggleVideo.innerHTML = 'Video On';
        };
    });

function sendSignal(action, message){
    webSocket.send(
        JSON.stringify(
            {
                'peer': username,
                'action': action,
                'message': message,
            }
        )
    )
}

function createOfferer(peerUsername, localScreenSharing, remoteScreenSharing, receiver_channel_name,peeruserStatus){
    var peer = new RTCPeerConnection(iceConfiguration);
    
    addLocalTracks(peer, localScreenSharing);

    var dc = peer.createDataChannel("channel");
    dc.onopen = () => {
        console.log("Connection opened.");
    };
    var remoteVideo = null;
    if(!localScreenSharing && !remoteScreenSharing){
    
        dc.onmessage = dcOnMessage;

        remoteVideo = createVideo(peerUsername,peeruserStatus);
        setOnTrack(peer, remoteVideo);
        console.log('Remote video source: ', remoteVideo.srcObject);

        mapPeers[peerUsername] = [peer, dc];

        peer.oniceconnectionstatechange = () => {
            var iceConnectionState = peer.iceConnectionState;
            if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed"){
                console.log('Deleting peer');
                delete mapPeers[peerUsername];
                if(iceConnectionState != 'closed'){
                    peer.close();
                }
                removeVideo(remoteVideo);
            }
        };
    }else {

        dc.onmessage = (e) => {
            console.log('New message from %s: ', peerUsername, e.data);
        };

        mapScreenPeers[peerUsername] = [peer, dc];

        peer.oniceconnectionstatechange = () => {
            var iceConnectionState = peer.iceConnectionState;
            if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed"){
                delete mapScreenPeers[peerUsername];
                if(iceConnectionState != 'closed'){
                    peer.close();
                }
            }
        };
    }

    peer.onicecandidate = (event) => {
        if (event.candidate) { 
               return;
            }
        
        console.log('Gathering finished! Sending offer SDP to ', peerUsername, '.',peeruserStatus);
        console.log('receiverChannelName: ', receiver_channel_name);

        sendSignal('new-offer', {
            'status': userStatus,
            'roomName':roomName,
            'passcode':passcode,
            'username':username,
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name,
            'local_screen_sharing': localScreenSharing,
            'remote_screen_sharing': remoteScreenSharing,
        });
    }

    peer.createOffer()
        .then(o => peer.setLocalDescription(o))
        .then(function(event){
            console.log("Local Description Set successfully.");
        });

    return peer;
}

function createAnswerer(offer, peerUsername, localScreenSharing, remoteScreenSharing, receiver_channel_name,peeruserStatus){
    var peer = new RTCPeerConnection(iceConfiguration);

    addLocalTracks(peer, localScreenSharing);

    if(!localScreenSharing && !remoteScreenSharing){

        var remoteVideo = createVideo(peerUsername, peeruserStatus);

        setOnTrack(peer, remoteVideo);

        peer.ondatachannel = e => {
            console.log('e.channel.label: ', e.channel.label);
            peer.dc = e.channel;
            peer.dc.onmessage = dcOnMessage;
            peer.dc.onopen = () => {
                console.log("Connection opened.");
            }

            mapPeers[peerUsername] = [peer, peer.dc];
        }

        peer.oniceconnectionstatechange = () => {
            var iceConnectionState = peer.iceConnectionState;
            if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed"){
                delete mapPeers[peerUsername];
                if(iceConnectionState != 'closed'){
                    peer.close();
                }
                removeVideo(remoteVideo);
            }
        };
    }else if(localScreenSharing && !remoteScreenSharing){
        peer.ondatachannel = e => {
            peer.dc = e.channel;
            peer.dc.onmessage = (evt) => {
                console.log('New message from %s: ', peerUsername, evt.data);
            }
            peer.dc.onopen = () => {
                console.log("Connection opened.");
            }

            mapScreenPeers[peerUsername] = [peer, peer.dc];

            peer.oniceconnectionstatechange = () => {
                var iceConnectionState = peer.iceConnectionState;
                if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed"){
                    delete mapScreenPeers[peerUsername];
                    if(iceConnectionState != 'closed'){
                        peer.close();
                    }
                }
            };
        }
    }else{

        var remoteVideo = createVideo(peerUsername + '-screen', userStatus);
        setOnTrack(peer, remoteVideo);

        peer.ondatachannel = e => {
            peer.dc = e.channel;
            peer.dc.onmessage = evt => {
                console.log('New message from %s\'s screen: ', peerUsername, evt.data);
            }
            peer.dc.onopen = () => {
                console.log("Connection opened.");
            }

            mapPeers[peerUsername + ' Screen'] = [peer, peer.dc];
            
        }
        peer.oniceconnectionstatechange = () => {
            var iceConnectionState = peer.iceConnectionState;
            if (iceConnectionState === "failed" || iceConnectionState === "disconnected" || iceConnectionState === "closed"){
                delete mapPeers[peerUsername + ' Screen'];
                if(iceConnectionState != 'closed'){
                    peer.close();
                }
                removeVideo(remoteVideo);
            }
        };
    }

    peer.onicecandidate = (event) => {
        if(event.candidate){
            console.log("New Ice Candidate! Reprinting SDP" + JSON.stringify(peer.localDescription));
            return;
        }

        sendSignal('new-answer', {
            'status': userStatus,
            'roomName':roomName,
            'passcode':passcode,
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name,
            'local_screen_sharing': localScreenSharing,
            'remote_screen_sharing': remoteScreenSharing,
        });
    }

    peer.setRemoteDescription(offer)
        .then(() => {
            console.log('Set offer from %s.', peerUsername);
            return peer.createAnswer();
        })
        .then(a => {
            console.log('Setting local answer for %s.', peerUsername);
            return peer.setLocalDescription(a);
        })
        .then(() => {
            console.log('Answer created for %s.', peerUsername);
            console.log('localDescription: ', peer.localDescription);
            console.log('remoteDescription: ', peer.remoteDescription);
        })
        .catch(error => {
            console.log('Error creating answer for %s.', peerUsername);
            console.log(error);
        });

    return peer
}

function dcOnMessage(event){
    var message = event.data;
    
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(message));
    ul.appendChild(li);
}

function getDataChannels(){
    var dataChannels = [];
    
    for(peerUsername in mapPeers){
        console.log('mapPeers[', peerUsername, ']: ', mapPeers[peerUsername]);
        var dataChannel = mapPeers[peerUsername][1];
        console.log('dataChannel: ', dataChannel);

        dataChannels.push(dataChannel);
    }

    return dataChannels;
}

function getPeers(peerStorageObj){
    var peers = [];
    
    for(peerUsername in peerStorageObj){
        var peer = peerStorageObj[peerUsername][0];
        console.log('peer: ', peer);

        peers.push(peer);
    }

    return peers;
}

function createVideo(peerUsername, userStatus){
    var videoContainer = document.querySelector('#video-container');
    
    var remoteVideo = document.createElement('video');

    remoteVideo.id = peerUsername + '-video';
    remoteVideo.style.objectFit = "cover";
    remoteVideo.style.width = "550px";
    remoteVideo.style.height = "300px";
    remoteVideo.autoplay = true;
    remoteVideo.playsinline = true;
    remoteVideo.className = "col-md-12";

    var colmd4 = document.createElement('div')
    colmd4.className = "col-md-6"

    var videoWrapper = document.createElement('div');
    videoWrapper.className = "card text-center";
    var videocardheader = document.createElement('div');
    videocardheader.className = "card-header";
    var videoLabel = document.createElement('h3');
    videoLabel.innerHTML = peerUsername;
    videoLabel.style.textTransform = "uppercase";

    var statusLabel = document.createElement('p');
    statusLabel.innerHTML = "("+userStatus+")";
    statusLabel.id = "idstatus";
    
    videocardheader.appendChild(videoLabel);
    videocardheader.appendChild(statusLabel);
    videoWrapper.appendChild(videocardheader);

    var videocardbody = document.createElement('div');
    videocardbody.className = "card-body";
    videocardbody.appendChild(remoteVideo);
    videoWrapper.appendChild(videocardbody);
    
    var make_obs = document.createElement('button');
    make_obs.id = "make-observer";
    make_obs.name = "observer-button";
    make_obs.className = "btn btn-info btn-sm";
    make_obs.innerHTML = "Make Observer";
    make_obs.addEventListener("click", function makeObserver(){

        obs_button = document.getElementById('make-observer');
        if (obs_button.innerHTML == "Make Observer"){
            obs_button.innerHTML = "Make Guest";
            document.getElementById('idstatus').innerHTML = 'Observer';
        } else {
            obs_button.innerHTML = "Make Observer";
            document.getElementById('idstatus').innerHTML = 'Guest';
        }
        sendSignal('makeobserver',{
            'peerid':peerUsername
        })
    });
    
    if (my_userstatus!="host") {
        make_obs.style.visibility = "hidden";
    }
    
    var videocardfooter = document.createElement('div');
    videocardfooter.className = "card-footer";
    videocardfooter.appendChild(make_obs);
    videoWrapper.appendChild(videocardfooter);
    colmd4.appendChild(videoWrapper);
    videoContainer.appendChild(colmd4);

    return remoteVideo;
}

function setOnTrack(peer, remoteVideo){
    console.log('Setting ontrack:');
    var remoteStream = new MediaStream();

    remoteVideo.srcObject = remoteStream;

    console.log('remoteVideo: ', remoteVideo.id);

    peer.addEventListener('track', async (event) => {
        console.log('Adding track: ', event.track);
        remoteStream.addTrack(event.track, remoteStream);
    });
}

function addLocalTracks(peer, localScreenSharing){
    if(!localScreenSharing){
        localStream.getTracks().forEach(track => {
            console.log('Adding localStream tracks.');
            peer.addTrack(track, localStream);
        });
        return;
    }

    localDisplayStream.getTracks().forEach(track => {
        console.log('Adding localDisplayStream tracks.');
        peer.addTrack(track, localDisplayStream);
    });
}

function removeVideo(video){
    var videocardBody = video.parentNode;
    var videocard = videocardBody.parentNode;
    var videoWrapper = videocard.parentNode;
    videoWrapper.parentNode.removeChild(videoWrapper);
}
