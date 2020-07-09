function save() {
    let obj = [];
    const editors = document.getElementById("editor-wrapper").children.length;

    for (let x = 1; x <= editors; x++) {
        let curr = {};
        curr["edit"] = document.getElementById("edit" + x).innerText
        curr["cycle"] = document.getElementById("editor-cycle-" + x).innerText
        obj.push(curr);
    }
    download(document.getElementById("filename").value, JSON.stringify(obj));
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename +".json");

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function loadFile(evt) {
    document.getElementById("editor-wrapper").innerHTML = "";

    let f = evt.target.files[0]; // FileList object

    let reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function () {
        return function (e) {
            // Render thumbnail.
            let p = JSON.parse(e.target.result);

            for (const i in p) {
                newEditor(p[i].cycle, p[i].edit);
            }
            Prism.highlightAll();

        };
    })(f);

    // Read in the image file as a data URL.
    reader.readAsText(f);

    document.getElementById("files").value = "";
}

document.getElementById('files').addEventListener('change', loadFile, false);
