const Enemy = ((window, document) => {
    "use strict";

    return class Enemy {
        constructor(init) {
            init = init || {};
    
            this.id = init.id || 0;
    
            this.screenX = init.screenX || 0;
            this.screenY = init.screenY || 0;
    
            this.health = init.health || 0;
            this.maxHealth = init.maxHealth || 0;
    
            this.damage = init.damage || 0;
            this.damageSpeed = init.damageSpeed || 0;
    
            init.stats = init.stats || {};
            this.stats = {};
            this.stats.str = init.stats.str || 0;
            this.stats.def = init.stats.def || 0;
            this.stats.agi = init.stats.agi || 0;
    
            this._battleCoordinatorClockSelf = init._battleCoordinatorClockSelf || 0;
            this._battleCoordinatorClockSelfFinish = init._battleCoordinatorClockSelfFinish || 0;
        }
    }
})(null, null);