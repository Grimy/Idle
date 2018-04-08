const Item = ((window, document) => {
    "use strict";

    class Item {
        constructor(init) {
            init = init || {};

            this.type = init.type || 0;
    
            this.rarity = init.rarity || 0;
    
            this.damage = init.damage || 0;
            this.reach = init.reach || 0;
            this.damageSpeed = init.damageSpeed || 0;
            this.health = init.health || 0;
            this.regen = init.regen || 0;
            this.regenSpeed = init.regenSpeed || 0;
            
            init.stats = init.stats || {};
            this.stats = {};
            this.stats.str = init.stats.str || 0;
            this.stats.def = init.stats.def || 0;
            this.stats.agi = init.stats.agi || 0;
    
            this._inventory = init._inventory || {
                id: 0,
                data: null,
            };
            this._deleted = init._deleted || false;
    
            this._battleClockSpeed = init._battleClockSpeed || 0;
            this._battleClockSpeedFinish = init._battleClockSpeedFinish || 0;

            this._battleClockRegenSpeed = init._battleClockRegenSpeed || 0;
            this._battleClockRegenSpeedFinish = init._battleClockRegenSpeedFinish || 0;
        }
    
        generateRandom(wave, rarity, type) {
            if(rarity == null) {
                this.rarity = Item.getRarityRoll(wave);
            }
            else {
                this.rarity = rarity;
            }

            if(type != null) {
                this.type = type;
            }
            else {
                if(Utility.getRandomInt(0, 2) === 0)
                    this.type = Item.WEAPON;
                else
                    this.type = Item.ARMOR;
            }

            if(this.type === Item.WEAPON) {
                this.damage = this.getDamageRoll();
                this.damageSpeed = this.getDamageSpeedRoll();
                this.reach = this.getReachRoll();

                this.health = 0;
                this.regen = 0;
                this.regenSpeed = 0;
            }
            else if(this.type === Item.ARMOR) {
                this.damage = 0;
                this.damageSpeed = 0;
                this.reach = 0;

                this.health = this.getHealthRoll();
                this.regen = this.getRegenRoll();
                this.regenSpeed = this.getRegenSpeedRoll();
            }
            
            for(let name in this.stats)
                this.stats[name] = this.getStatRoll();
    
            return this;
        }

        static getRarityRollStartingRarity(wave) {
            return Math.ceil(wave/10) - 1;
        }

        static getRarityRollOffset(wave) {
            wave = wave - (Item.getRarityRollStartingRarity(wave) * 10);
            return Math.pow(10, wave/10);
        }
        
        static getRarityRoll(wave) {
            wave = wave || 1;

            let startingRarity = Item.getRarityRollStartingRarity(wave);

            let offset = Item.getRarityRollOffset(wave);

            let rarity = startingRarity;
            if     (Utility.getRandomInt(0, 1000000) <= offset) rarity = startingRarity + 6;
            else if(Utility.getRandomInt(0, 100000) <= offset) rarity = startingRarity + 5;
            else if(Utility.getRandomInt(0, 10000) <= offset) rarity = startingRarity + 4;
            else if(Utility.getRandomInt(0, 1000) <= offset) rarity = startingRarity + 3;
            else if(Utility.getRandomInt(0, 100) <= offset) rarity = startingRarity + 2;
            else if(Utility.getRandomInt(0, 10) <= offset) rarity = startingRarity + 1;
            return rarity;
        }

        getStatRoll(max) {
            return Item.getRoll(0, 5 * (this.rarity + 1), 0.9, 4, 0.1, 1, max)
        }

        getDamageRoll(max) {
            return Item.getRoll(2, 10, 0.8, 50, 0.2, this.rarity + 1, max);
        }

        getHealthRoll(max) {
            return Item.getRoll(20, 100, 0.8, 50, 0.2, this.rarity + 1, max);
        }

        getRegenRoll(max) {
            return Item.getRoll(10, 30, 0.8, 50, 0.2, this.rarity + 1, max) / 10;
        }

        getDamageSpeedRoll(max) {
            return Item.getRoll(2, 20, 0.8, 50, 0.2, 1, max) / 10;
        }

        getRegenSpeedRoll(max) {
            return Item.getRoll(1, 30, 0.8, 50, 0.2, 1, max) / 100;
        }

        getReachRoll(max) {
            return Item.getRoll(0, this.rarity + 1, 0.8, 50, 0.2, 1, max);
        }


        static getRoll(minIncl, maxIncl, v1, degree, v2, triangular, max) {
            let dice = 100000;
            let x = Utility.getRandomInt(0, dice+1) //roll 0-100000
            x = x / dice;

            //http://fooplot.com/#W3sidHlwZSI6MCwiZXEiOiIwLjl4XjEwKzAuMXgiLCJjb2xvciI6IiMwMDAwMDAifSx7InR5cGUiOjEwMDAsIndpbmRvdyI6WyIwIiwiMSIsIjAiLCIxIl0sImdyaWQiOlsiIiwiMC4xIl19XQ--
            let y = (Math.pow(x, degree) * v1) + (v2 * x);

            if(max)
                y = 1;

            y = y * (maxIncl - minIncl);
            y += minIncl;

            return Math.ceil(y * Math.triangular(triangular));
        }
    
        static getRerollCost(rarity, rolls) {
            return Math.pow(10, rarity) * (rolls) / 2;
        }

        getSaleGoldValue() {
            return Math.pow(10, this.rarity);
        }

        getValue(weights) {
            let totalStats = 0;
            let maxStats = 0;
            for(let name in this.stats) {
                totalStats += this.stats[name];
                maxStats += this.getStatRoll(true);
            }

            if(this.type === Item.WEAPON) {
                let w1 = weights.damage;
                let w2 = weights.damageSpeed;
                let w3 = weights.reach;
                let w4 = weights.playerStats;

                let m1 = this.getDamageRoll(true);
                let m2 = this.getDamageSpeedRoll(true);
                let m3 = this.getReachRoll(true);
                let m4 = maxStats;

                let c1 = this.damage;
                let c2 = this.damageSpeed;
                let c3 = this.reach;
                let c4 = totalStats;

                return Math.sqrt((c1*c2*c3)*(c4/m4)) * 10;
            }
            else if(this.type === Item.ARMOR) {
                let w1 = weights.health;
                let w2 = weights.regen;
                let w3 = weights.regenSpeed;
                let w4 = weights.playerStats;

                let m1 = this.getHealthRoll(true);
                let m2 = this.getRegenRoll(true);
                let m3 = this.getRegenSpeedRoll(true);
                let m4 = maxStats;

                let c1 = this.health / 10;
                let c2 = this.regen;
                let c3 = this.regenSpeed;
                let c4 = totalStats;

                return Math.sqrt((c1*c2*c3)*(c4/m4)) * 10;
            }
            else {
                return 0;
            }
        }
    }

    Item.WEAPON = 0;
    Item.ARMOR = 1;

    return Item;
})(null, null);