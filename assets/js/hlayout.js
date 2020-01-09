function loadProxy() {
    $("code").on({
        keydown: function (event) {
            if (event.ctrlKey && event.which >= 97 && event.which <= 106) {
                let number = (event.which - 96);
                changeProxyAndEditor(number);
            }
        }
    });

    $(".proxy-group").click(function (event) {
        changeProxyAndEditor(event.currentTarget.id.replace("proxy-group", ""));
    });
}

function changeProxyAndEditor(group) {
    //openExistingEditor("edit" + group);
    group = ((group - 1) % 3) + 1;

    changeActiveEditors(group);
    proxyActiveClass(group);
}

function proxyActiveClass(id) {
    $(".proxy-group").removeClass("active");
    $("#proxy-group"+ id +":first").addClass("active");
}

function changeActiveEditors(group) {
    let arr = $("pre.editor");

    for (let i = 0; i < arr.size(); i++) {
       arr[i].classList.add('hidden');
    }

    for (let i = group * 3; i >= (group * 3 ) - 2; i--) {
        let id = "pre-edit" + i;
        document.getElementById(id).classList.remove('hidden');

        if (i % 3 === 1) document.getElementById(id).children[0].focus();
    }
}