const Floateys = ((window, document) => {
    "use strict";

    return class Floateys {
        constructor(init, template, container) {
            init = init || {};

            this.sTemplate = Symbol();
            this[this.sTemplate] = template;

            this.sContainer = Symbol();
            this[this.sContainer] = container;

            this.sFloatingNumbers = Symbol();
            this[this.sFloatingNumbers] = [];
        }

        init() {
            
        }

        update(frameTime) {
            let floateys = this[this.sFloatingNumbers];
            let container = this[this.sContainer];

            let l = floateys.length;
            for(let i = 0; i < l; i++) {
                let floatey = floateys[i];
                floatey.translate += 25;
                floatey.elem.style.transform = "translateY(-" + floatey.translate + "%)";

                floatey.clock += frameTime;

                if(floatey.clock >= 1000) {
                    container.removeChild(floatey.elem);
                    floateys.splice(i, 1);
                    i--;
                    l--;
                }
            }

            floateys = Array.from(floateys);
        }

        createFloatingNumber(content, xCSS, yCSS, classCSS) {
            let fragment = this[this.sTemplate].content.cloneNode(true);

            let elem = Array.prototype.slice.call(fragment.childNodes, 0)[1];

            elem.innerHTML = content;
            elem.className = classCSS;
            elem.style.left = xCSS;
            elem.style.top = yCSS;
            
            this[this.sContainer].appendChild(elem);
            this[this.sFloatingNumbers].push({
                elem: elem,
                clock: 0,
                translate: 0,
            })
        }
    }

})(null, null);

