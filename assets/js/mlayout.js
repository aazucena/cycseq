function loadProxy() {
    $("code").on({
        keydown: function (event) {
            if (event.ctrlKey && event.which >= 97 && event.which <= 106) {
                let number = (event.which - 96);
                changeProxyAndEditor(number);
            }
        }
    });

    $(".proxy").click(function (event) {
        changeProxyAndEditor(event.target.id.replace("proxy", ""));
    });
}

function changeProxyAndEditor(num) {
    openExistingEditor("edit" + num);
    changeSingleEditor("edit" + num);
    proxyActiveClass("proxy" + num);
}

function proxyActiveClass(id) {
    $(".proxy").removeClass("active");
    $("#"+ id +":first").parent().addClass("active");
}

function changeSingleEditor(id) {
    let arr = $("pre.editor").children();

    for (let i = 0; i < arr.size(); i++) {
       arr[i].classList.add('hidden');
    }

    document.getElementById(id).classList.remove('hidden');
    document.getElementById(id).focus();
}