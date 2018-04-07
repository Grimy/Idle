"use strict";

(function() {
    console.SAVED = "SAVED";
    console.INFO = "INFO";

    let divSaved = null;

    console.game = function(type, str) {
        let containerLog = document.getElementById("containerLog");
        if(containerLog != null) {
            let span = document.createElement("span");

            switch(type) {
            case console.SAVED:
                span.className = "c-green";
                break;
            default:
                span.className = "c-white";
                break;
            }

            span.innerHTML = str;

            add(containerLog, span, type);
        }
    }

    let _log = console.log;
    console.log = function() {
        _log(arguments);

        let containerLog = document.getElementById("containerLog");
        if(containerLog != null) {
            let span = document.createElement("span");
            span.className = "c-gray";
            span.innerHTML = Array.from(arguments).join();

            add(containerLog, span);
        }
    }

    let _warn = console.warn;
    console.warn = function() {
        _warn(arguments);

        let containerLog = document.getElementById("containerLog");
        if(containerLog != null) {
            let span = document.createElement("span");
            span.className = "c-orange";
            span.innerHTML = Array.from(arguments).join();

            add(containerLog, span);
        }
    }

    /*let _error = console.error;
    console.error = function() {
        _error(arguments);

        let containerLog = document.getElementById("containerLog");
        if(containerLog != null) {
            let span = document.createElement("span");
            span.className = "c-red";
            span.innerHTML = Array.from(arguments).join();

            add(containerLog, span);
        }
    }*/
    
    function add(containerLog, span, type) {
        let date = new Date();

        let h = date.getHours().toString();
        let m = date.getMinutes().toString();
        let s = date.getSeconds().toString();

        h = h.length < 2 ? "0" + h : h;
        m = m.length < 2 ? "0" + m : m;
        s = s.length < 2 ? "0" + s : s;

        span.innerHTML = "[" + h + ":" + m + ":" + s + "] " + span.innerHTML;
        
        let div = document.createElement("div");
        div.className = "chat-line";

        div.appendChild(span);

        containerLog.appendChild(div);

        if(type === console.SAVED) {
            try {
            if(divSaved != null)
                containerLog.removeChild(divSaved);
            } catch(e){}

            divSaved = div;
        }

        if(containerLog.children.length > 30)
            containerLog.removeChild(containerLog.firstChild);

        containerLog.scrollTop = containerLog.scrollHeight;
    }
})();