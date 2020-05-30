var ws;

function Osc() {}

var osc = new Osc();

jQuery.extend(Osc.prototype,jQuery.eventEmitter);


function initiate(nEditors) {
	linkWS();

	console.log("Setup was triggered");
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    var url = 'ws://' + location.hostname + ':' + location.port;
    console.log("attempting websocket connection to " + url);
    ws = new WebSocket(url);
    ws.onopen = function () {
		console.log("extramuros websocket connection opened");
    };
    ws.onerror = function () {
		console.log("ERROR opening extramuros websocket connection");
    };
    ws.onmessage = function (m) {
		var data = JSON.parse(m.data);

		if(data.type === 'osc') {
			var address = data.address.substring(1);

			// Tidal-specific double-mappings for incoming /play messages
			if(address === "play") {
				data.args.name = data.args[1];
				data.args.begin = data.args[3];
				data.args.end = data.args[4];
				data.args.speed = data.args[5];
				data.args.pan = data.args[6];
				data.args.gain = data.args[14];
				// full list of parameters at bottom
			}

			if (address.startsWith("extramuros/editor/")) {
				evaluateBuffer("edit" + address.replace("extramuros/editor/", ""));
			}
			else if (address.startsWith("extramuros/overdub/channel/")) {
				sampleOSC(
					address.replace("extramuros/overdub/channel/", ""),
					data.args[1],
					data.args[3],
					data.args[5],
					"1",
					"stack"
				);
			} else if (address.startsWith("extramuros/cat/channel/")) {
				sampleOSC(
					address.replace("extramuros/cat/channel/", ""),
					data.args[1],
					data.args[3],
					data.args[5],
					data.args[7],
					"cat"
				);
			}
			else if (address.startsWith("extramuros/notes")) {
				addNotes(data.args[1]);
			}
			else if (address.startsWith("extramuros/channels/position/")) {
				triggerEvaluation(address.replace("extramuros/channels/position/", ""));
			} else {
				$(osc).trigger(address);
				eval( address + "(data.args)");
			}
			// ummm... we should check to make sure the function exists first!...
		}
		if (data.type === 'input') {
			for(var x=1;x<=nEditors;x++) {
				openExistingDocument(
					document.getElementById('proxy' + x.toString()),
					'edit' + x.toString(),
					'proxy' + x.toString()
				);
			}
		}
		if(data.type === 'js') {
			eval(data.code);
		}
		if(data.type === 'feedback') {
			var fb = $('#feedback');
			var oldText = fb.val();
			if(oldText.length > 10000) oldText = ""; // short-term solution...
			fb.val(oldText+data.text);
			fb.scrollTop(fb[0].scrollHeight);
		}
    };
    for(var x=1;x<=nEditors;x++) {
    	openEditor(x.toString());
	}

    setupKeyboardHandlers();
    setupVisuals();
}

function addNotes(notes) {
	let elem = $(document.activeElement);
	inputEditor(elem[0], notes);
}

function triggerEvaluation(channel) {
	for (let x = 0; x < 4; x++) {
		evaluateBuffer("edit" + (parseInt(channel) + (x * 3)));
	}
}

function evaluateBuffer(name) {
	var msg = { request: "eval", bufferName: name };
	ws.send(JSON.stringify(msg));
	changeActiveChannel(name);
	retriggerAnimation(name);
}

function evaluateCode (name, code) {
	var msg = { request: "evalCode", bufferName: name, code: code };
	ws.send(JSON.stringify(msg));
	changeActiveChannel(name);
}

// d\d{1,2}\s*\$\s*cat\s\[(\n?\s*s\s+\"[a-z]+:\d{1,3}",?)*\n\s*\]
// d1\s*\$\s*cat\s\[(\n?\s*s\s+\"[a-z]+:\d{1,3}".*,?)*\n\s*\]
// Detect cat blocks

/**
 *
 * @param extChannel - Extramuros channel (1..3)
 * @param tidalChannel - TidalCycles channel (d1...d12)
 * @param sampleName - Name of sample (mgit, dgit, bd)
 * @param sampleBank -  Bank of sample (0..n i.e mgit:2)
 * @param executeCode - Trigger code after change editor content (1|0)
 */
function sampleOSC(extChannel, tidalChannel, sampleName, sampleBank, executeCode, mode) {
	let searchString = new RegExp(tidalChannel + '\\s*\\$\\s*' + mode + '\\s\\[(\\n?\\s*s\\s+\\"[a-z]+:\\d{1,3}".*,?)*\\n?\\s*\\]', "gm");

	let activeChannelEditor = document.activeElement.id;

	//let currentid = "edit" + (parseInt((extChannel - 1) * 3) + x);
	let samplePattern = "s \"" + sampleName + ":" + sampleBank+"\"";
	let currentValue = document.getElementById(activeChannelEditor).textContent;
	let searchResult = currentValue.search(searchString);

	if (searchResult === -1) {

		let code =tidalChannel + " $ " + mode + " [\n     "+samplePattern+"\n]";
		let elem = document.getElementById(activeChannelEditor);
		elem.textContent = code;
		Prism.highlightElement(elem);
	} else {
		let matchResult = currentValue.match(searchString);
		if (matchResult.length > 0) {
			let newResult = matchResult[0].replace("\n\]", ",\n\]");
			newResult = newResult.replace("]", "     " + samplePattern + "\n]");
			console.log("Matchresult: " + matchResult[0]);
			console.log("NewResult: " + newResult);
			currentValue = currentValue.replace(matchResult[0], newResult);

			let elem = document.getElementById(activeChannelEditor);
			elem.textContent = currentValue;
			Prism.highlightElement(elem);
		}
	}

	//let activeChannelEditor = getActiveChannelEditor(extChannel);

	if (executeCode === "1") {
		evaluateCode(activeChannelEditor, document.getElementById(activeChannelEditor).textContent);
		ins(activeChannelEditor, document.getElementById(activeChannelEditor).textContent + '\n');
	}

}

function getActiveChannelEditor(channel) {
	for (let x = 1; x < 4 ; x++) {
		let editorID = (parseInt((channel - 1) * 3) + x);

		if ($("#edit" + editorID).parent().hasClass("active")) {
			return "edit" + editorID;
		}
	}
}

function broadcastInput(name, position) {
	let msg = {request: "sendInput", bufferName: name, caret: position};
	ws.send(JSON.stringify(msg));
}

function triggerEditorOSC(name) {
	let msg = {request: "triggerEditorOSC", bufferName: name};
	ws.send(JSON.stringify(msg));
}

// This is hardcoded to 3 channels for each line
function changeActiveChannel(name) {
	let startingLine = parseInt((name.replace("edit", "") - 1)/3) * 3 + 1;
	for (let x = 0; x < 3; x++) {
		$("#edit"+ (startingLine + x) ).parent().removeClass("active");
	}

	$("#"+name ).parent().addClass("active");

}

function evaluateJavaScriptGlobally(code) {
	var msg = { request: "evalJS", code: code };
	ws.send(JSON.stringify(msg));
}

function openExistingEditor(name) {
	let elem = $(".language-tidal").children()[0];
	openExistingDocument(elem, name, elem.id);
}

function openExistingDocument(elem, name, id) {
}

function openEditor(number) {
	let name = "edit" + number;

    let elem = document.getElementById(name);
    let proxy = document.getElementById("proxy" + number);
}

function setupKeyboardHandlers(id) {
	if (id === undefined) {
		id = 'code';

		$('body').keydown(function (event) {
			if (event.keyCode === 13 && event.altKey) {
				newEditor();
			}
		});

	} else {
		id = "#" + id;
	}

    $(id).keydown(function (event) {
    	console.log(event);
		if (event.keyCode === 8 && event.altKey) {
			removeEditor(event.currentTarget.parentNode.parentNode);
		}
		if(event.which === 13 && event.shiftKey && event.ctrlKey) {
			// ctrl+shift+enter: evaluate buffer as Javascript through server
			event.preventDefault();
			evaluateJavaScriptGlobally($(this).val());
		}
		else if(event.which === 13 && event.ctrlKey) {
			// ctrl+Enter: evaluate text as JavaScript in local browser
			event.preventDefault();
			eval($(this).val());
		}
		else if(event.which === 13 && event.shiftKey) {
			// shift+Enter: evaluate buffer globally through the server
			event.preventDefault();

			retriggerAnimation(event.currentTarget.id);
			//triggerEditorOSC(event.target.id);
			evaluateCode(event.target.id, event.target.textContent);
		}
		else if(event.which === 67 && event.ctrlKey && event.shiftKey) {
			// ctrl+shift+c: global clear() on visuals
			event.preventDefault();
			evaluateJavaScriptGlobally("clear();");
		}
		else if(event.which === 82 && event.ctrlKey && event.shiftKey) {
			// ctrl+shift+r: global retick() on visuals
			event.preventDefault();
			evaluateJavaScriptGlobally("retick();");
		}
		else if(event.which === 67 && event.altKey) {
			// alt+c: global clear() on visuals
			event.preventDefault();
			evaluateJavaScriptGlobally("clear();");
		}
		else if(event.which === 82 && event.altKey) {
			// alt+r: global retick() on visuals
			event.preventDefault();
			evaluateJavaScriptGlobally("retick();");
		}

    });

	$(id).on({
		input: function() {
			inputEditor(this);
		},
		keydown: function(event) {
			if (event.which === 13 && !event.shiftKey) {
				let element = $('#'+this.id);
				let position = element.caret('pos');
				element.html(element.text().splice(position,  0, "\n"));
				element.caret('pos', position + 1);
				broadcastInput(this.id, position);
			}
		}
	});

}

function retriggerAnimation(id) {
	let element = $('#' + id).parent();
	element.addClass("backgroundAnimated");

	element[0].style.animation = 'none';
	element[0].offsetHeight; /* trigger reflow */
	element[0].style.animation = null;
}

// path = "/play",
// params = [
//1// S "sound" Nothing,
//2// F "offset" (Just 0),
//3// F "begin" (Just 0),
//4// F "end" (Just 1),
//5// F "speed" (Just 1),
//6// F "pan" (Just 0.5),
//7// F "velocity" (Just 0),
//8// S "vowel" (Just ""),
//9// F "cutoff" (Just 0),
//10// F "resonance" (Just 0),
//11// F "accelerate" (Just 0),
//12// F "shape" (Just 0),
//13// I "kriole" (Just 0),
//14// F "gain" (Just 1),
//15// I "cut" (Just (0)),
//16// F "delay" (Just (0)),
//17// F "delaytime" (Just (-1)),
//18// F "delayfeedback" (Just (-1)),
//19// F "crush" (Just 0),
//20// I "coarse" (Just 0),
//21// F "hcutoff" (Just 0),
//22// F "hresonance" (Just 0),textContent
//23// F "bandf" (Just 0),
//24// F "bandq" (Just 0),
//25// S "unit" (Just "rate"),
//26// I "loop" (Just 1)
// ]


// Remove, add and play functions for keyboard control
function newEditor() {
	let contentWrapper = receiveContentWrapper();
	let newElement = newEditorElement(contentWrapper.childElementCount + 1);

	contentWrapper.append(newElement);

	setupKeyboardHandlers("edit" + (contentWrapper.childElementCount));

}

function removeEditor(row) {
	let contentWrapper = receiveContentWrapper();
	contentWrapper.removeChild(row);
	fixEditorIds();
}

//<img role="button" onclick="startFrom(1)" class="play-box" src="assets/img/play.svg" />


function newEditorElement(number) {
	let slider = document.getElementById("width-range");

	let div = document.createElement("div");
	div.classList.add('row');
	div.style.minHeight = slider.value + "px";

	let playButton = document.createElement("img");
	playButton.addEventListener("click", () => startFrom(number), false);
	playButton.setAttribute("src", "assets/img/play.svg");
	playButton.setAttribute("role", "button");
	playButton.setAttribute("id", "play-" + number);
	playButton.classList.add('play-box');

	let cyclePre = document.createElement("pre");
	cyclePre.setAttribute("id", "editor-cycle-" + number);
	cyclePre.setAttribute("spellcheck", "false");
	cyclePre.setAttribute("contenteditable", "true");
	cyclePre.classList.add("config-box");

	let editorPre = document.createElement("pre");
	editorPre.classList.add("language-tidal");
	editorPre.classList.add("editor-box");

	let editorCode = document.createElement("code");
	editorCode.setAttribute("id", "edit" + number);
	editorCode.setAttribute("tabindex", number + 4);
	editorCode.setAttribute("spellcheck", "false");
	editorCode.setAttribute("contenteditable", "true");
	editorCode.classList.add("language-tidal");

	editorPre.append(editorCode);

	div.append(playButton);
	div.append(cyclePre);
	div.append(editorPre);

	return div;
}

function receiveContentWrapper() {
	return document.getElementById('editor-wrapper');
}


function fixEditorIds() {
	let contentWrapper = receiveContentWrapper();

	for (let i = 0; i < contentWrapper.childElementCount; i++) {

		let playButton = document.createElement("img");
		playButton.addEventListener("click", () => startFrom(i+1), false);
		playButton.setAttribute("src", "assets/img/play.svg");
		playButton.setAttribute("role", "button");
		playButton.setAttribute("id", "play-" + (i+1));

		playButton.classList.add('play-box');

		contentWrapper.children[i].children[0].replaceWith(playButton);
		contentWrapper.children[i].children[1].setAttribute("id", "editor-cycle-" + (i+1));
		contentWrapper.children[i].children[2].children[0].setAttribute("id", "edit" + (i+1));
		contentWrapper.children[i].children[2].children[0].setAttribute("tabindex", i+1+4);
	}
}

// Editor input Control

String.prototype.splice = function(idx, rem, str) {
	return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};

function inputEditor(elem, content) {
	let element = $('#'+elem.id);
	let position = element.caret('pos');

	if (content !== undefined) {
		let elemText =  elem.textContent;
		elem.textContent = elemText.substr(0, position) + content + " " + elemText.substr(position);
		position += content.length + 1;
	}

	Prism.highlightElement(elem);
	element.caret('pos', position );
	ins(elem.id, elem.textContent + '\n');
	broadcastInput(elem.id, position);
}

// Slider
let slider = document.getElementById("width-range");
let rows = document.getElementsByClassName("row");

for (let i = 0; i < rows.length; i++) {
	rows.item(i).style.minHeight = slider.value + "px";
}

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
	for (let i = 0; i < rows.length; i++) {
		rows.item(i).style.minHeight = slider.value + "px";
	}
};