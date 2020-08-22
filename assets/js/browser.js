var sequencerWs;

function Osc() {}

jQuery.extend(Osc.prototype,jQuery.eventEmitter);

function initiate() {
	linkWS();
	window.WebSocket = window.WebSocket || window.MozWebSocket;
    var url = 'ws://' + location.hostname + ':' + location.port;
    console.log("attempting websocket connection to " + url);
    sequencerWs = new WebSocket(url);
    sequencerWs.onopen = function () {
		console.log("extramuros websocket connection opened");
    };
    sequencerWs.onerror = function () {
		console.log("ERROR opening extramuros websocket connection");
    };
    sequencerWs.onmessage = function (m) {
		let data = JSON.parse(m.data);
		if(data.type === 'osc') {
			const address = data.address.substring(1);

			if (address.startsWith("cycseq")) {
				handleExternalControls(data, address);
			// Tidal-specific double-mappings for incoming /play messages
			} else if(address === "play") {
				data.args.name = data.args[1];
				data.args.begin = data.args[3];
				data.args.end = data.args[4];
				data.args.speed = data.args[5];
				data.args.pan = data.args[6];
				data.args.gain = data.args[14];
				// full list of parameters at bottom
			}  else {
				//$(osc).trigger(address);
				eval( address + "(data.args)");
			}
		}

		let feedbackContainer = document.getElementById("feedback-container");

		if (data.type === 'feedback') {
			let p = document.createElement("p");
			let content = data.text.replace(/tidal>/g, '');
			p.textContent = content;

			feedbackContainer.appendChild(p);
		} else {
			feedbackContainer.innerHTML = '';
		}
    };

    setupKeyboardHandlers();
}

function handleExternalControls(data, address) {
	if ( address === "cycseq/editor") {
		startFrom(data.args[0]);
	} else if (address === "cycseq/play") {
		start();
	}else if (address === "cycseq/stop") {
		stop();
	}else if (address === "cycseq/record") {
		record();
	}
}

function evaluateCode (name, code) {
	let msg = { request: "evalCode", bufferName: name, code: code };
	sequencerWs.send(JSON.stringify(msg));
}

function setupKeyboardHandlers(id) {
	if (id === undefined) {
		id = 'code';
		$('body').keydown(function (event) {
			if (event.keyCode === 13 && event.altKey) {
				if (!event.target.id.startsWith("edit")) newEditor("", "");
				else {
					event.target.parentNode.parentNode.after(newEditorElement(0, "",""));
					setupKeyboardHandlers("edit0");
					fixEditorIds();
				}
			}
		});
	} else {
		id = "#" + id;
	}

    $(id).keydown(function (event) {
		if (event.keyCode === 8 && event.altKey) {
			removeEditor(event.currentTarget.parentNode.parentNode);
		}
		else if(event.which === 13 && event.shiftKey) {
			// shift+Enter: evaluate buffer globally through the server
			event.preventDefault();

			retriggerAnimation(event.currentTarget.id);
			evaluateCode(event.target.id, event.target.textContent);
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

// Remove, add and play functions for keyboard control
function newEditor(cycle, content) {
	let contentWrapper = receiveContentWrapper();
	let newElement = newEditorElement(contentWrapper.childElementCount + 1, cycle, content);

	contentWrapper.append(newElement);

	setupKeyboardHandlers("edit" + (contentWrapper.childElementCount));
}

function removeEditor(row) {
	let contentWrapper = receiveContentWrapper();
	contentWrapper.removeChild(row);
	fixEditorIds();
}

function newEditorElement(number, cycle, content) {
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
	cyclePre.innerText = cycle;
	cyclePre.classList.add("config-box");

	let editorPre = document.createElement("pre");
	editorPre.classList.add("language-tidal");
	editorPre.classList.add("editor-box");

	let editorCode = document.createElement("code");
	editorCode.setAttribute("id", "edit" + number);
	editorCode.setAttribute("tabindex", number + 4);
	editorCode.setAttribute("spellcheck", "false");
	editorCode.setAttribute("contenteditable", "true");
	editorCode.innerHTML = content;
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