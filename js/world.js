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
                let g = 0;
                let b = 20;

                if(decimal >= 18) {
                    g = 100 + (((18 - decimal) * 12.5));
                }
                else if(decimal >= 7) {
                    g = 100;
                }
                else if(decimal >= 3) {
                    g = 50 + (25 - ((6 - decimal) * 25));
                }

                if(g < 30)
                    g = 30;

                g = Math.round(g);

                this.emit("timeUpdated", r, g, b, hours, minutes);
            }
        }

        static getVillageBrightnessPrc(date) {
            if(!(date instanceof Date))
                date = new Date();

            let hours = date.getHours();
            let minutes = date.getMinutes();

            let decimal = hours + minutes / 60;

            let prc = 25;

            if(decimal >= 18) {
                prc = 100 * (1 - ((decimal - 18) / 8));
            }
            else if(decimal >= 7) {
                prc = 100;
            }
            else if(decimal >= 3) {
                prc = 25 * (decimal - 3);
            }

            return Math.round(prc);
        }

        static getSkyColorCSS(date) {
            if(!(date instanceof Date))
                date = new Date();

            let hours = date.getHours();
            let minutes = date.getMinutes();

            let decimal = hours + minutes / 60;

            let r = 0;
            let g = 0;
            let b = 0;

            if(decimal >= 23) {
                r = 55 * ((24 - decimal));
                g = 0;
                b = 55 * ((24 - decimal));
            }
            else if(decimal >= 22) {
                r = 55 * (1 - (23 - decimal));
                g = 0;
                b = 110 * ((24 - decimal) / 2);
            }
            else if(decimal >= 21) {
                r = 0;
                g = 0;
                b = 220 * ((23 - decimal) / 2);
            }
            else if(decimal >= 18) {
                r = 0;
                g = 220 * ((21 - decimal) / 3)
                b = 220;
            }
            else if(decimal >= 6) {
                r = 0;
                g = 220;
                b = 220;
            }
            else if(decimal >= 5.5) {
                r = 220 * ((6 - decimal) * 2);
                g = 220;
                b = 220 * (1 - (6 - decimal) * 2);
            }
            else if(decimal >= 5) {
                r = 220;
                g = 220 * (1 - (5.5 - decimal) * 2);
                b = 0;
            }
            else if(decimal >= 3) {
                r = 220 * (1 - (5 - decimal) * 2);
                g = 0;
                b = 0;
            }
            else {
                r = 0;
                g = 0;
                b = 0;
            }
            
            r = Math.round(r);
            g = Math.round(g);
            b = Math.round(b);

            return "rgb(" + r + "," + g + "," + b + ")";
        }
    }

})(null, null);
