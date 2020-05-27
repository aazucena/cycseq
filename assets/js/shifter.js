const EDITOR_ID = "edit";
const EDITOR_CYCLE_ID = "editor-cycle-";
const EDITOR_TRIGGER_ID = "editor-trigger-";

let isStarted = false;
let isRunning = false;

let cycleCounter = 1;
let editorNumber = 1;
let trigger = 0;

function start() {
    isStarted = true;
    isRunning = false;
    editorNumber = 1;
    cycleCounter = 1;
}

function stop() {
    const editors = document.getElementsByTagName("code");

    for (let i = 0; i < editors.length; i++) {
        editors[i].classList.remove('active');
    }

    isStarted = false;
    isRunning = false;
    editorNumber = 1;
    cycleCounter = 1;

    evaluateCode("editorX", "hush");
}

function next(editorNumber) {
    const prevEditor = document.getElementById(EDITOR_ID + (editorNumber - 1));
    const editor = document.getElementById(EDITOR_ID + editorNumber);

    if (editor === null) {
        stop();
    } else {
        retriggerAnimation(editor.id);

        editor.classList.add('active');

        if (prevEditor !== null) {
            prevEditor.classList.remove('active');
        }

        evaluateCode(editor.id, editor.innerText);
    }
}


function linkWS() {

    window.WebSocket = window.WebSocket || window.MozWebSocket;
    var url = 'ws://' + location.hostname + ':' + 8001;
    console.log("attempting websocket connection to " + url);
    let linkWS = new WebSocket(url);

    linkWS.onopen = function () {
        console.log("extramuros websocket connection opened");
    };
    linkWS.onerror = function () {
        console.log("ERROR opening extramuros websocket connection");
    };
    linkWS.onmessage = function (m) {
        var data = JSON.parse(m.data);

        if(data.type === 'linkInfos') {
            document.getElementById("tempo").innerText = Math.round(data.tempo);

            if (data.numPeers === 0 || data.numPeers === undefined) {
                document.getElementById("peers").innerText = "Link";
            } else {
                document.getElementById("peers").innerText = data.numPeers + " Link";

            }
        }

        if(data.type === 'linkBeat') {
            const beat = data.phase;
            document.getElementById("phase").innerText = Math.trunc(data.phase) + 1 + "/4";


            if (Math.trunc(data.phase) === 0) {
                trigger = 3.75;
            }

            if (isStarted && beat > trigger && trigger > 0.0) {
                    if (!isRunning) {
                        next(1);
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