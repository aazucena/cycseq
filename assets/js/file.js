function save() {
    let obj = [];
    const editors = document.getElementById("editor-wrapper").children.length;
    var selectedType = document.getElementById("filetype").options[document.getElementById("filetype").selectedIndex].value;

    if (selectedType == "") {
        alert("No filetype was selected");
    } else if (document.getElementById("filename").value == "") {
        alert("Enter the name of the file");
    } else if (selectedType == ".json") {
        for (let x = 1; x <= editors; x++) {
            let curr = {};
            curr["edit"] = document.getElementById("edit" + x).innerText
            curr["cycle"] = document.getElementById("editor-cycle-" + x).innerText
            obj.push(curr);
        }
        download(document.getElementById("filename").value, "application/json", selectedType, JSON.stringify(obj));
    } else if (selectedType == ".tidal") {
        /*
                var txt = "d1 $ qtrigger 1 $ seqP [\n";
                var start, end = 0;
                for (let x = 1; x <= editors; x++) {

                    var ed = document.getElementById("edit" + x).innerText;
                    var cyc = document.getElementById("editor-cycle-" + x).innerText;

                    //should create like
                     //stack [
                        // s "bd" # speed 2,
                        // n "2 3 4" # s "hh*4",
                      //   fast 2 $ s "sd"
                    // ]
                    
                    var trail = ed.slice(-4);
                    ed = ed.replace(/^/, 'stack [');
                    for (i = 0; i < 16; i++) ed = ed.replace("d" + (i + 1).toString() + " $ ", ""); // replaces d1 - d16 to /blank/
                    ed = ed.replace("\n", ", \n") + trail;
                    ed += "\n]";

                    var space;
                    if (x == editor) space = "\n]";
                    else space = ",\n";

                    end += cyc;

                    txt += "(" + start + ", " + end + ", " + ed + ")" + space;

                    start = cyc;
                }
                txt += "\n]";
                obj.push(txt); 
        */
        obj.push("d1 $ qtrigger 1 $ seqP [\n");
        var start = 0,
            end = 0;
        for (let x = 1; x <= editors; x++) {
            var ed = document.getElementById("edit" + x).innerText;
            var cyc = document.getElementById("editor-cycle-" + x).innerText;

            for (i = 0; i < 16; i++) ed = ed.replace("d" + (i + 1).toString() + " $ ", "");
            var lines = ed.split("\n");



            var space = "),\n";
            if (x == editors) space = ")";
            end = parseInt(cyc) + parseInt(start);
            obj.push("(" + start + ", " + end + ", stack[" + lines.join(",\n") + "]" + space);
            start += parseInt(cyc);
        }
        obj.push("\n]");
        download(document.getElementById("filename").value, "text/plain", selectedType, obj.join(""));
    }
}

function char_count(str) {
    var count = 0;
    for (var pos = 0; pos < str.length; pos++)
        if (str.charAt(pos) == "\n") count++;
    return count;
}

function download(filename, datatype, filetype, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:' + datatype + ';charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename + filetype);

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
    reader.onload = (function() {
        return function(e) {
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