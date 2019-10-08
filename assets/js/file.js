function save() {
    let obj = {};
    for (let x = 1; x <= 12; x++) {
        obj["edit" + x] = document.getElementById("edit" + x).value
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
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

        // Only process image files.
        if (!f.type.match('application/json')) {
            continue;
        }

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function(theFile) {
            return function(e) {
                // Render thumbnail.
                let p = JSON.parse(e.target.result);

                for (var key in p) {
                    if (p.hasOwnProperty(key)) {
                        ins(key, p[key]);
                    }
                }
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsText(f);
    }

    document.getElementById("files").value = "";


}
document.getElementById('files').addEventListener('change', loadFile, false);


function ins(name, code) {
    var elem = document.getElementById(name);
    if( elem != null) {
        sharejs.open(name, 'text', function (error, doc) {
            doc.del(0, elem.textLength);
            elem.value = "";
            doc.insert(0, code);
            elem.value = code;
        });
    }
}
