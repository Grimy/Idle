const Battle = ((window, document) => {
    "use strict";

    return class Battle extends EventEmitter {
        constructor(init) {
            super();
    
            init = init || {};
    
            this.wave = init.wave || 1;
            this.subWave = init.subWave || 1;
            this.maxSubWave = init.maxSubWave || 20;
            this.highestWave = init.highestWave || 0;
            this.highestWaveSubWave = init.highestWaveSubWave || 0;
            this.maxSubWaveCurrentZone = init.maxSubWaveCurrentZone || 20;
            this.timestampTimeElapsedInRun = init.timestampTimeElapsedInRun || 0;
            
            this.enemies = init.enemies || [];
            for(let i = 0; i < this.enemies.length; i++) {
                this.enemies[i] = new Enemy(this.enemies[i]);
            }
        }
    
        init() {
            this.emit("enemiesRemoved");
            this.emit("enemiesAdded", this.enemies);
            this.emit("nextWaveStarted", this.wave, this.subWave, this.maxSubWave, this.highestWave, this.highestWaveSubWave, this.maxSubWaveCurrentZone);
        }

        

        startNewRun(player) {
            this.timestampTimeElapsedInRun = 0;
            player.heal();
            player.removeRage();
            player.removeFrenzy();
    
            this.wave = 1;
            this.subWave = 0;
            this.maxSubWaveCurrentZone = Battle.getMaxSubWave(this.wave, this.maxSubWave, this.highestWave);
            this.nextWave();
        }
    
        nextWave() {
            if(this.subWave < this.maxSubWaveCurrentZone)
                this.subWave++;
            else {
                this.subWave = 0;
                this.wave += 1;

                this.maxSubWaveCurrentZone = Battle.getMaxSubWave(this.wave, this.maxSubWave, this.highestWave);
            }
    
            let randomOffset = Math.ceil(this.wave / 10);

            let random = Utility.getRandomInt(randomOffset, 4 + randomOffset);
    
            this.emit("enemiesRemoved");
            this.enemies.splice(0, this.enemies.length);
            for(let i = 0; i < random; i++) {
                let hp = Math.floor(Math.triangular((this.wave) / 10) * 100);
                let damage = (Math.triangular((this.wave) / 10) * 10);
    
                let damageSpeed = Utility.getRandomInt(4, 21) / 10;
                damage = damage * damageSpeed;

                hp = Math.ceil(Utility.getRandomInt(hp / 2, hp * 2));
                
                let enemy = new Enemy({
                    id: i,
        
                    screenX:Utility.getRandomInt(20, 81),
                    screenY:Utility.getRandomInt(10, 61),
        
                    health:hp,
                    maxHealth:hp,
        
                    damage:damage,
                    damageSpeed:damageSpeed,
                });

                let statCeiling = Battle.getEnemyStatCeiling(this.wave, Object.keys(enemy.stats).length);

                let arr = [];
                for(let name in enemy.stats)
                    arr.push(Math.random());

                arr = Utility.convertRatioToAddToNumber(arr, statCeiling);

                let j = 0;
                for(let name in enemy.stats) {
                    enemy.stats[name] = Math.ceil(arr[j]);
                    j++;
                }        

                this.enemies.push(enemy);
            }
    
            this.enemies.sort((a, b) => {
                return b.screenY - a.screenY;
            });
    
            if(this.wave > this.highestWave) {
                this.highestWave = this.wave;
                this.highestWaveSubWave = 0;
            }

            if(this.wave === this.highestWave && this.subWave > this.highestWaveSubWave)
                this.highestWaveSubWave = this.subWave;
    
            this.emit("enemiesAdded", this.enemies);
            this.emit("nextWaveStarted", this.wave, this.subWave, this.maxSubWave, this.highestWave, this.highestWaveSubWave, this.maxSubWaveCurrentZone);
        }
    
        update(fixedDelta, clock, player) {
            this.timestampTimeElapsedInRun += fixedDelta;

            let playerHealthBeforeUpdate = player.health;

            let equippedItems = [];

            let jl = player.inventory.length;
            for(let j = 0; j < jl; j++) {
                if(player.inventory[j]._inventory.id === Player.EQUIPMENT)
                    equippedItems.push(player.inventory[j]);
            }

            let el = equippedItems.length;
            for(let j = 0; j < el; j++) {
                let item = equippedItems[j];
    
                if(item.damage > 0) {
                    let interval = 1000 * (1 / item.damageSpeed) * (-player.frenzy.value / (player.frenzy.max * 2) + 1);

                    item._battleClockSpeed += fixedDelta;
                    item._battleClockSpeedFinish = interval;
                    
                    if(item._battleClockSpeed >= interval) {
                        item._battleClockSpeed = 0;
        
                        let il = Math.min(this.enemies.length, item.reach);
                        if(il > 0)
                            player.addRage(1);
                        for(let i = 0; i < il; i++) {
                            let enemy = this.enemies[i];
                            
                            if(Math.random() < Battle.getDodge(enemy.stats.agi, player.stats.agi.total)) {
                                this.emit("enemyDodged", enemy, item._inventory.data);
                            }
                            else {
                                let enemyAtMaxHealth = enemy.health === enemy.maxHealth;
                                let damage = Battle.getDamage(item.damage, player.stats.str.total, enemy.stats.def) * (player.frenzy.value / player.frenzy.max + 1);
                                enemy.health -= damage;
                                this.emit("enemyDamaged", enemy, damage, item._inventory.data);
        
                                if(enemy.health <= 0) {
                                    if(enemyAtMaxHealth)
                                        player.addFrenzy(1);

                                    this.enemies.splice(i, 1);
                                    i--;
                                    il--;
                                    this.emit("enemiesRemoved", [enemy]);

                                    player.xp += Math.ceil(this.wave / 10);
                                    player.addItem(new Item().generateRandom(this.wave));

                                    player.updateStats();
                    
                                    if(this.enemies.length === 0)
                                        this.nextWave();
                                }
                                else {
                                    player.removeFrenzy(2);
                                }
                            }
                        }
                    }
                }

                if(item.regen > 0) {
                    let interval = 1000 * (1 / item.regenSpeed);

                    item._battleClockRegenSpeed += fixedDelta;
                    item._battleClockRegenSpeedFinish = interval;
                
                    if(item._battleClockRegenSpeed >= interval) {
                        item._battleClockRegenSpeed = 0;

                        player.heal(item.regen);
                    }
                }
            }
    
            let l = this.enemies.length;
            for(let i = 0; i < l; i++) {
                let enemy = this.enemies[i];
    
                let enemyInterval = Battle.getEnemyInterval(enemy.damageSpeed, enemy.stats.agi, player.stats.agi.total);
    
                enemy._battleCoordinatorClockSelf += fixedDelta;
                enemy._battleCoordinatorClockSelfFinish = enemyInterval;
    
                if(enemy._battleCoordinatorClockSelf >= enemyInterval) {
                    enemy._battleCoordinatorClockSelf = 0;
                    
                    if(Math.random() < Battle.getDodge(player.stats.agi.total, enemy.stats.agi)) {
                        this.emit("playerDodged", player);
                    }
                    else {
                        player.health -= Battle.getDamage(enemy.damage, enemy.stats.str, player.stats.def.total);
                        player.removeRage(2);

                        if(player.health <= 0) {
                            console.game(console.INFO, "Defeated! Wave: " + this.wave + "." + this.subWave + ". Time: " + Utility.getFormattedTime(this.timestampTimeElapsedInRun));
                            this.startNewRun(player);
                            return;
                        }
                    }
                }
    
                this.emit("enemyUpdated", enemy);
            }
    
            this.emit("playerUpdated", player, (player.health - playerHealthBeforeUpdate));
        }
    
        static getEnemyInterval(enemySpeed, enemySPD, playerSPD) {
            let enemySpeedMult = 1;
            /*if(enemySPD > playerSPD)
                enemySpeedMult = 1 + (enemySPD - playerSPD) / 10;
            else if(enemySPD < playerSPD)
                enemySpeedMult = 1 / (1 + ((playerSPD - enemySPD) / 10));*/
    
            return 1 / ((1 / enemySpeed) * enemySpeedMult) * 1000;
        }
    
        static getDamage(base, mySTR, theirDEF) {
            let mult = Math.pow(64, mySTR / (mySTR + theirDEF) - 0.5);

            return base * mult;
        }

        static getDodge(myAGI, theirAGI) {
            let dodge = 0;
            if(myAGI > theirAGI)
                dodge = 1 - 1 / Math.pow(64, myAGI / (myAGI + theirAGI) - 0.5);

            return dodge;
        }

        static getMaxSubWave(wave, maxSubWave, highestWave) {
            let value = -highestWave + 10 + maxSubWave + wave;

            if(value < 1)
                value = 1;
            else if(value > maxSubWave)
                value = maxSubWave;

            return value
        }

        static getEnemyStatCeiling(wave, statCount) {
            //initial offset   +  rarity offset           +  level offset
            return (25 * 3 * statCount) + Math.ceil((wave / 10) * 25 * statCount) + (wave * statCount);
        }
    }
})(null, null);