var sequencerWs;
let wslider = document.getElementById("width-range");
let vslider = document.getElementById("volume-range");
let rows = document.getElementsByClassName("editors");

Prism.plugins.NormalizeWhitespace.setDefaults({
    'remove-trailing': true,
    'remove-indent': true,
    'left-trim': true,
    'right-trim': true,
    'tabs-to-spaces': 4
});

var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
var popoverList = popoverTriggerList.map(function(popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
});

function Osc() {}

jQuery.extend(Osc.prototype, jQuery.eventEmitter);

$(document).ready(function() {
    linkWS();
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    var url = 'ws://' + location.hostname + ':' + location.port;
    console.log("attempting websocket connection to " + url);
    sequencerWs = new WebSocket(url);
    sequencerWs.onopen = function() {
        console.log("CycSeq websocket connection opened");
    };
    sequencerWs.onerror = function() {
        console.log("ERROR opening CycSeq websocket connection");
    };
    sequencerWs.onmessage = function(m) {
        let data = JSON.parse(m.data);
        if (data.type === 'osc') {
            const address = data.address.substring(1);

            if (address.startsWith("cycseq")) {
                handleExternalControls(data, address);
                // Tidal-specific double-mappings for incoming /play messages
            } else if (address === "play") {
                data.args.name = data.args[1];
                data.args.begin = data.args[3];
                data.args.end = data.args[4];
                data.args.speed = data.args[5];
                data.args.pan = data.args[6];
                data.args.gain = data.args[14];
                // full list of parameters at bottom
            } else {
                //$(osc).trigger(address);
                eval(address + "(data.args)");
            }
        }

        let feedbackContainer = document.getElementById("feedback-container");

        if (data.type === 'feedback') {
            let p = document.createElement("p");
            let content = data.text.replace(/tidal>/g, '');
            p.textContent = content;

            feedbackContainer.appendChild(p);
            if (!$("#feedback").hasClass("show")) {
                $("#feedback").addClass("show");
                $("#feedback").attr("role", "dialog");
                $("#feedback").css({
                    "visibility": "visible"
                });
            }
            $(".feedback-icon").addClass("bi-caret-up-fill", 1000);
            $("#feedback-button").addClass("show-feedback", 1000);
        } else {
            feedbackContainer.innerHTML = '';
        }
    };

    setupKeyboardHandlers();
    newEditor("", "");
    newSoundElement(1, "808", 6);
    evaluateCode("editorX", "all $ (# gain \"1\")");
});

$("#feedback-button").on("click", function() {
    if (!$("#feedback").hasClass("show")) {
        $("#feedback").removeClass("show");
        $("#feedback").removeAttr("role");
        $(this).removeClass("show-feedback");
        $(".feedback-icon").removeClass("bi-caret-up-fill", 1000);
    } else {
        $("#feedback").addClass("show");
        $("#feedback").attr("role", "dialog");
        $("#feedback").css({
            "visibility": "visible"
        });
        $(this).addClass("show-feedback");
        $(".feedback-icon").addClass("bi-caret-up-fill", 1000);
    }
});
$("#sound-button").on("click", function() {
    $("#feedback-button").removeClass("show-feedback");
    $(".feedback-icon").removeClass("bi-caret-up-fill", 1000);
});

function copySound() {
    var snip = $(this).children();
    var note = $(this).next().children().val();
    var name = snip.text() + ' # n "' + note + '"'; // grabs the code snippet from <pre> <code>
    const el = document.createElement('textarea');
    el.value = name;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

// plays the snippet codes for tutorials
$(".snippet-button").on("click", function(event) {
    var name = $(this).next().children().text(); // grabs the code snippet from <pre> <code>

    // triggers the animation for the <pre> <code>
    let element = $(this).next();
    element.addClass("backgroundAnimated");
    element[0].style.animation = 'none';
    element[0].offsetHeight; /* trigger reflow */
    element[0].style.animation = null;

    for (i = 0; i < 16; i++) { // replaces d1 - d16 to once
        name = name.replace("d" + (i + 1).toString(), "once");
    }
    evaluateCode("editorX", name);
});

function playSnippet() {
    var snip = $(this).next().children();
    var note = $(this).next().next().children().val();
    var name = snip.text() + ' # n "' + note + '"'; // grabs the code snippet from <pre> <code>

    // triggers the animation for the <pre> <code>
    let element = $(this).next();
    element.addClass("backgroundAnimated");
    element[0].style.animation = 'none';
    element[0].offsetHeight; /* trigger reflow */
    element[0].style.animation = null;

    for (i = 0; i < 16; i++) { // replaces d1 - d16 to once
        name = name.replace("d" + (i + 1).toString(), "once");
    }
    evaluateCode("editorX", name);
};

function handleExternalControls(data, address) {
    if (address === "cycseq/editor") {
        startFrom(data.args[0]);
    } else if (address === "cycseq/play") {
        start();
    } else if (address === "cycseq/stop") {
        stop();
    } else if (address === "cycseq/record") {
        record();
    }
}

function evaluateCode(name, code) {
    let msg = { request: "evalCode", bufferName: name, code: code };
    sequencerWs.send(JSON.stringify(msg));
}

function setupKeyboardHandlers(id) {
    if (id === undefined) {
        id = 'code';
        $('body').keydown(function(event) {
            // [ALT] + [ENTER]: Add new editor to sequence
            if (event.keyCode === 13 && event.altKey) {
                if (!event.target.id.startsWith("edit")) newEditor("", "");
                else {
                    event.target.parentNode.parentNode.after(newEditorElement(0, "", ""));
                    setupKeyboardHandlers("edit0");
                    fixEditorIds();
                }
            }
        });
    } else {
        id = "#" + id;
    }
    // For pressing enter to create newline

    $(id).on({
        input: function() {
            alwaysHighlight(this);
        },
        keydown: function(event) {
            if (event.which === 13 && !event.shiftKey && !event.ctrlKey && !event.altKey) {
                let element = $('#' + this.id);
                let position = element.caret('pos');
                element.html(element.text().splice(position, 0, "\n"));
                element.caret('pos', position + 1);
                alwaysHighlight(this);
            } else if (event.which === 9 && !event.shiftKey && !event.ctrlKey && !event.altKey) {
                let element = $('#' + this.id);
                let position = element.caret('pos');
                element.html(element.text().splice(position, 0, "\t"));
                element.caret('pos', position + 1);
                alwaysHighlight(this);
            } else if (event.keyCode === 46 && event.altKey) {
                //[ALT] + [BACKSPACE]: removes the last editor of the sequence
                removeEditor(event.currentTarget.parentNode.parentNode);
            } else if (event.which === 13 && event.shiftKey) {
                // shift+Enter: evaluate buffer globally through the server
                event.preventDefault();

                retriggerAnimation(event.currentTarget.id);
                evaluateCode(event.target.id, event.target.textContent);
                alwaysHighlight(this);
            } else if (event.ctrlKey && event.altKey && event.which == 72) {
                // CTRL + ALT + H: hushes the current editors
                event.preventDefault();
                evaluateCode("editorX", "hush");
                evaluateCode("editorX", "resetCycles");
                alert("All the sounds are hushed");
            }
        }
    });
}

function alwaysHighlight(that) {
    var restore = saveCaretPosition(that);
    Prism.highlightAll();
    restore();
}


function saveCaretPosition(context) {
    var selection = window.getSelection();
    var range = selection.getRangeAt(0);
    range.setStart(context, 0);
    var len = range.toString().length;

    return function restore() {
        var pos = getTextNodeAtPosition(context, len);
        selection.removeAllRanges();
        var range = new Range();
        range.setStart(pos.node, pos.position);
        selection.addRange(range);

    }
}

function getTextNodeAtPosition(root, index) {
    const NODE_TYPE = NodeFilter.SHOW_TEXT;
    var treeWalker = document.createTreeWalker(root, NODE_TYPE, function next(elem) {
        if (index > elem.textContent.length) {
            index -= elem.textContent.length;
            return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT;
    });
    var c = treeWalker.nextNode();
    return {
        node: c ? c : root,
        position: index
    };
}

function retriggerAnimation(id) {
    let element = $('#' + id).parent();
    element.addClass("backgroundAnimated");

    element[0].style.animation = 'none';
    element[0].offsetHeight; /* trigger reflow */
    element[0].style.animation = null;
}

// Remove, add and play functions for keyboard control
function newEditor(cycle, content) {
    let contentWrapper = receiveContentWrapper();
    let newElement = newEditorElement(contentWrapper.childElementCount + 1, cycle, content);

    contentWrapper.append(newElement);

    setupKeyboardHandlers("edit" + (contentWrapper.childElementCount));
}

function removeCurrentEditor(row) {
    document.getElementById("row-" + row).remove();
    fixEditorIds();
}

function removeEditor(row) {
    let contentWrapper = receiveContentWrapper();
    contentWrapper.removeChild(row);
    fixEditorIds();
}

function newEditorElement(number, cycle, content) {
    let slider = document.getElementById("width-range");


    let div = document.createElement("div");
    div.setAttribute("id", "row-" + number);
    div.classList.add('row');
    div.classList.add('editors');
    div.classList.add('me-2');
    div.classList.add('ms-1');
    div.classList.add('mb-1');
    div.style.minHeight = slider.value + "px";


    let playerPre = document.createElement("pre");
    playerPre.setAttribute("title", "Play This Section");
    playerPre.setAttribute("id", "play-" + number);
    playerPre.classList.add('col-1');
    playerPre.classList.add('d-flex');
    playerPre.classList.add('justify-content-center');
    playerPre.classList.add('text-center');
    playerPre.classList.add("play-box");

    let playButton = document.createElement("i");
    playButton.addEventListener("click", () => startFrom(number), false);
    playButton.setAttribute("title", "Play This Section");
    playButton.setAttribute("role", "button");
    playButton.classList.add('bi');
    playButton.classList.add('bi-play-fill');
    playButton.classList.add('gray');
    playButton.classList.add('lh-lg');
    playButton.classList.add('fs-1');
    playButton.classList.add('m-auto');

    let cyclePre = document.createElement("pre");
    cyclePre.setAttribute("id", "editor-cycle-" + number);
    cyclePre.setAttribute("spellcheck", "false");
    cyclePre.setAttribute("contenteditable", "true");
    cyclePre.innerText = cycle;
    cyclePre.classList.add("col-3");
    cyclePre.classList.add("d-flex");
    cyclePre.classList.add("justify-content-center");
    cyclePre.classList.add("cycle-box");

    let editorPre = document.createElement("pre");
    editorPre.classList.add("col");
    editorPre.classList.add("no-whitespace-normalization");
    editorPre.classList.add("language-tidal");
    editorPre.classList.add("editor-box");

    let editorCode = document.createElement("code");
    editorCode.setAttribute("id", "edit" + number);
    editorCode.setAttribute("tabindex", number + 4); // sets the order of using [Tab] key 
    editorCode.setAttribute("spellcheck", "false");
    editorCode.setAttribute("contenteditable", "true");
    editorCode.innerHTML = content;
    editorCode.classList.add("language-tidal");

    let editorClose = document.createElement("a");
    editorClose.setAttribute("id", "editor-close-" + number);
    editorClose.setAttribute("title", "Remove Editor #" + number);
    editorClose.setAttribute("onclick", "removeCurrentEditor(" + number + ")");
    editorClose.classList.add("col-1");
    editorClose.classList.add("btn");
    editorClose.classList.add("btn-secondary");
    editorClose.classList.add("icon-button");
    editorClose.classList.add("btn-close");
    editorClose.classList.add("edit-close");

    playerPre.append(playButton);
    editorPre.append(editorCode);
    div.append(playerPre);
    div.append(cyclePre);
    div.append(editorPre);
    div.append(editorClose);

    return div;
}

function newSoundElement(index, name, samples) {
    var div1 = document.createElement("div");
    div1.setAttribute("id", "s-" + index);
    div1.classList.add("accordion-item");

    var h = document.createElement("h2");
    h.classList.add("accordion-header");

    var but1 = document.createElement("button");
    but1.setAttribute("id", "s-title-" + index);
    but1.classList.add("accordion-button");
    but1.classList.add("collapsed");
    but1.setAttribute("type", "button");
    but1.setAttribute("data-bs-toggle", "collapse");
    but1.setAttribute("data-bs-target", "#s-content-" + index);
    but1.setAttribute("aria-expanded", "false");
    but1.setAttribute("aria-controls", "s-content-" + index);
    but1.innerHTML = name;

    var div2 = document.createElement("div");
    div2.setAttribute("id", "s-content-" + index);
    div2.classList.add("accordion-collapse");
    div2.classList.add("collapse");
    div2.setAttribute("data-bs-parent", "#sound-body");
    div2.setAttribute("aria-labelledby", "s-title-" + index);

    var div3 = document.createElement("div");
    div3.classList.add("accordion-body");
    div3.classList.add("d-flex-inline");

    var div4 = document.createElement("div");
    div4.classList.add("p-2");
    div4.classList.add("input-group");
    div4.classList.add("justify-content-center");

    var but2 = document.createElement("button");
    but2.classList.add("btn");
    but2.classList.add("btn-secondary");
    but2.classList.add("btn-sm");
    but2.classList.add("icon-button");
    but2.classList.add("s-button");
    but2.classList.add("px-3");
    but2.setAttribute("id", "s-play-" + index);
    but2.onclick = playSnippet; // plays the code snippet of the target sound

    var i = document.createElement("i");
    i.classList.add("bi");
    i.classList.add("bi-play-fill");
    i.setAttribute("title", "Play This Code");
    i.setAttribute("role", "button");

    var pre = document.createElement("pre");
    pre.classList.add("mb-auto");
    pre.classList.add("rounded-end");
    pre.classList.add("p-3");
    pre.classList.add("s-code");
    pre.classList.add("language-tidal");
    pre.setAttribute("id", "s-code-" + index);
    pre.setAttribute("spellcheck", "false");
    pre.setAttribute("style", "max-width: 80%;");
    pre.setAttribute("tabindex", 0);
    pre.onclick = copySound; // plays the code snippet of the target sound

    var code = document.createElement("code");
    code.classList.add("p-1");
    code.classList.add("ms-0");
    code.classList.add("language-tidal");
    code.setAttribute("id", "s-text-" + index);
    code.setAttribute("readonly", "");
    code.innerText = 'd1 $ sound "' + name + '"';

    var div5 = document.createElement("div");
    div5.classList.add("w-100");
    div5.classList.add("form-floating");

    var label = document.createElement("label");
    label.setAttribute("for", "samps-" + index);
    label.classList.add("note-label");
    label.innerHTML = "Select your sound";

    var select = document.createElement("select");
    select.classList.add("justify-content-end");
    select.classList.add("form-select");
    select.classList.add("note-select");
    select.classList.add("mb-3");
    select.setAttribute("id", "samps-" + index);
    select.setAttribute("aria-label", "Samples");

    var opt = document.createElement("option");
    for (var j = 0; j < samples; j++) {
        opt.setAttribute("value", j);
        if (j == 0) opt.setAttribute("selected", "selected");
        opt.innerHTML = j;
        select.options[select.options.length] = new Option(j, j);
    }
    pre.append(code);
    but2.append(i);

    div5.append(select);
    div5.append(label);

    div4.append(but2);
    div4.append(pre);
    div4.append(div5);

    div3.append(div4);

    div2.append(div3);

    h.append(but1);
    div1.append(h);
    div1.append(div2);

    var soundBody = document.getElementById('sound-body');
    soundBody.append(div1);
}

function receiveContentWrapper() {
    return document.getElementById('editor-wrapper');
}

function fixEditorIds() {
    let contentWrapper = receiveContentWrapper();

    for (let i = 0; i < contentWrapper.childElementCount; i++) {

        let playerPre = document.createElement("pre");
        playerPre.setAttribute("title", "Play This Section");
        playerPre.setAttribute("id", "play-" + (i + 1));
        playerPre.classList.add('col-1');
        playerPre.classList.add('d-inline-flex');
        playerPre.classList.add('overflow-hidden');
        playerPre.classList.add("play-box");

        let playButton = document.createElement("i");
        playButton.addEventListener("click", () => startFrom(i + 1), false);
        playButton.setAttribute("title", "Play This Section");
        playButton.setAttribute("role", "button");
        playButton.classList.add('bi');
        playButton.classList.add('bi-play-fill');
        playButton.classList.add('position-relative');
        playButton.classList.add('gray');
        playButton.classList.add('lh-lg');
        playButton.classList.add('fs-1');

        playerPre.append(playButton);

        contentWrapper.children[i].children[0].replaceWith(playerPre);
        contentWrapper.children[i].children[1].setAttribute("id", "editor-cycle-" + (i + 1));
        contentWrapper.children[i].children[2].children[0].setAttribute("id", "edit" + (i + 1));
        contentWrapper.children[i].children[2].children[0].setAttribute("tabindex", i + 1 + 4);
    }
}

// Editor input Control
String.prototype.splice = function(idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};

// Sliders

for (let i = 0; i < rows.length; i++) {
    rows.item(i).style.minHeight = wslider.value + "px";
}

//document.getElementById("width-output").innerHTML = rows.item(0).style.minHeight;
document.getElementById("volume-output").innerHTML = vslider.value + " dB";

// Update the current slider value (each time you drag the slider handle)
wslider.oninput = function() {
    for (let i = 0; i < rows.length; i++) {
        rows.item(i).style.minHeight = wslider.value + "px";
    }
    document.getElementById("width-output").innerHTML = rows.item(0).style.minHeight;
};

vslider.oninput = function() {
    evaluateCode("editorX", "all $ (# gain \"" + this.value + "\")");
    evaluateCode("editorX", "once $ s \"clak\"");
    //alert();
    document.getElementById("volume-output").innerHTML = this.value + " dB";
};

//onrefresh function

window.onload = function() {
    window.addEventListener("beforeunload", function(e) {
        evaluateCode("editorX", "hush");
        evaluateCode("editorX", "resetCycles");
        var confirmationMessage = 'It looks like you have been editing something. ' +
            'If you leave before saving, your changes will be lost.';

        (e || window.event).returnValue = confirmationMessage; //Gecko + IE
        return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
    });
};

$("input#soundfolders").on("change", function(event) {

    var path = event.target.files[0].webkitRelativePath;
    getDir(path.substr(0, path.lastIndexOf("/")));

});



// JSON for Soundboard for Samples, Synths, and Tutorial Content
/*const directory = [];
const path = require('path');
const process = require('process');
const fs = require('fs');


directory.push(process.env.APPDATA + '/Local/SuperCollider/downloaded-quarks/Dirt-Samples', { encoding: 'utf8' });

fs.readdirSync(directory).forEach(file => {
    if (fs.lstatSync(path.resolve(directory, file)).isDirectory()) {
        console.log('Directory: ' + file);
    } else {
        console.log('File: ' + file);
    }
});*/