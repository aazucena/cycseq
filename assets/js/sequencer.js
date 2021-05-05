const EDITOR_ID = "edit";
const EDITOR_CYCLE_ID = "editor-cycle-";
const EDITOR_TRIGGER_ID = "editor-trigger-";

let isStarted = false;
let isRunning = false;
let isRepeating = false;

let cycleCounter = 1;
let editorNumber = 1;
let trigger = 0;

function abletonOSCMessage(command) {
    let msg = { request: "ableton", command: command };
    sequencerWs.send(JSON.stringify(msg));
}

function resetSequencer(number, started) {
    isStarted = started;
    isRunning = false;
    editorNumber = number;
    cycleCounter = 1;
}

function start() {
    resetSequencer(1, true);
    abletonOSCMessage('play');

    let startBtn = document.getElementById("play");
    startBtn.src = 'assets/img/play-green.png';
}

function record() {
    resetSequencer(1, true);
    abletonOSCMessage('record');

    let startBtn = document.getElementById("play");
    startBtn.src = 'assets/img/play-green.png';

    let recordBtn = document.getElementById("record");
    recordBtn.src = 'assets/img/record-red.svg';
}

function startFrom(number) {
    removeActiveClass();
    abletonOSCMessage('play');
    resetSequencer(number, true);
}

function toggleRepeat(elem) {
    isRepeating = !isRepeating;

    if (isRepeating) { elem.children[0].src = 'assets/img/repeat-orange.png' } else { elem.children[0].src = 'assets/img/repeat.png' }
}

//This function opens a help popup section
$(".open").on("click", function() {
    $(".help-overlay, .help-modal, .help-content").addClass("active");
});

//removes the "active" class to .popup and .popup-content when the "Close" button is clicked 
$(".close").on("click", function() {
    $(".help-overlay, .help-modal, .help-content").removeClass("active");
});

function stop() {
    removeActiveClass();
    resetSequencer(1, false);
    abletonOSCMessage('stop');
    evaluateCode("editorX", "hush");

    let startBtn = document.getElementById("play");
    startBtn.src = 'assets/img/play.svg';

    let recordBtn = document.getElementById("record");
    recordBtn.src = 'assets/img/record.svg';
}

function removeActiveClass() {
    const editors = document.getElementsByTagName("code");
    for (let i = 0; i < editors.length; i++) {
        editors[i].classList.remove('active');
    }
}


function next(number) {
    const prevEditor = document.getElementById(EDITOR_ID + (number - 1));
    const editor = document.getElementById(EDITOR_ID + number);

    if (editor === null && isRepeating) {
        editorNumber = 1;
        const editor = document.getElementById(EDITOR_ID + editorNumber);
        activateEditor(editor, prevEditor)
    } else if (editor === null) {
        stop();
    } else {
        activateEditor(editor, prevEditor)
    }
}

function activateEditor(editor, prevEditor) {
    retriggerAnimation(editor.id);

    editor.classList.add('active');

    if (prevEditor !== null) {
        prevEditor.classList.remove('active');
    }

    evaluateCode(editor.id, editor.innerText);
}

function linkWS() {

    window.WebSocket = window.WebSocket || window.MozWebSocket;
    var url = 'ws://' + location.hostname + ':' + 8001;
    console.log("attempting websocket connection to " + url);
    let linkWS = new WebSocket(url);

    linkWS.onopen = function() {
        console.log("extramuros websocket connection opened");
    };
    linkWS.onerror = function() {
        console.log("ERROR opening extramuros websocket connection");
    };
    linkWS.onmessage = function(m) {
        var data = JSON.parse(m.data);

        if (data.type === 'linkInfos') {
            document.getElementById("tempo").innerText = Math.round(data.tempo);

            if (data.numPeers === 0 || data.numPeers === undefined) {
                document.getElementById("peers").innerText = "Link";
            } else {
                document.getElementById("peers").innerText = data.numPeers + " Link";

            }
        }

        if (data.type === 'linkBeat') {
            const beat = data.phase;
            document.getElementById("phase").innerText = Math.trunc(data.phase) + 1 + "/4";


            if (Math.trunc(data.phase) === 0) {
                trigger = document.getElementById("cycles-trigger").value - 1;
            }

            if (isStarted && beat > trigger && trigger > 0.0) {
                if (!isRunning) {
                    next(editorNumber);
                    isRunning = true
                } else {
                    let editorCycles = parseInt(document.getElementById(EDITOR_CYCLE_ID + editorNumber).innerText, 10);

                    if (cycleCounter > editorCycles) {
                        cycleCounter = 1;
                        editorNumber++;
                        next(editorNumber);
                    }
                }

                trigger = 0.0;
                cycleCounter++;
            }
        }
    }
}