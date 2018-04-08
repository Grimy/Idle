const World = ((window, document) => {
    "use strict";

    return class World extends EventEmitter {
        constructor(init) {
            super();

            init = init || {};

            this.sClock = Symbol();
            this[this.sClock] = 0;

            this.sInterval = Symbol();
            this[this.sInterval] = 60000;
        }

        init() {
            this[this.sClock] = this[this.sInterval];
            this.update(0);
        }

        update(frameTime) {
            this[this.sClock] += frameTime;

            if(this[this.sClock] >= this[this.sInterval]) {
                this[this.sClock] = 0;

                let date = new Date();
                let hours = date.getHours();
                let minutes = date.getMinutes();

                let decimal = hours + minutes / 60;

                let r = 20;
                let g = 20;
                let b = 20;

                if(decimal >= 22) {
                    g = 50;
                }
                else if(decimal >= 18) {
                    g = 100 + (((18 - decimal) * 12.5));
                }
                else if(decimal >= 7) {
                    g = 100;
                }
                else if(decimal >= 5) {
                    g = 50 + (25 - ((6 - decimal) * 25));
                }
                else if(decimal >= 0) {
                    g = 50;
                }

                this.emit("timeUpdated", r, g, b, hours, minutes);
            }
        }
    }

})(null, null);