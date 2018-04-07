"use strict";

let debug = (function() {
    let catchingUp = false;

    (() => {
    let _emitEvent = EventEmitter.prototype.emitEvent;
    EventEmitter.prototype.emitEvent = function(e, t) {
        if(catchingUp) {
            return;
        }
        else
            _emitEvent.bind(this)(e, t);
    }
    })();

    let model = {
        player: null,
        battle: null,
        menu: null,
        clock: 0,
        start: Date.now(),
        flags: {
            clickedHelp: false,
            lowPerformanceMode: false
        },
        version: 12
    }

    let paused = false;

    load();
    onLowPerformanceChecked(model.flags.lowPerformanceMode, true);

    if(model.player.inventory.length === 0) {
        model.player.addItem(new Item().generateRandom(null, 0, Item.WEAPON));
        model.player.addItem(new Item().generateRandom(null, 0, Item.ARMOR));
    }

    try {
        let buttonHelp = document.getElementById("buttonHelp");
        if(!model.flags.clickedHelp)
            Utility.swapClass("button-c-", "button-c-yellow", buttonHelp);
        document.getElementById("buttonHelp").onclick = function(e) {
            model.flags.clickedHelp = true;
            Utility.swapClass("button-c-", "button-c-default", buttonHelp);

            let description = "<div style='text-align:left'>";
            description += "<p>This is a game about fighting enemies and finding new weapons.</p>";
            description += "<p>Your inventory is at the bottom of the screen. You start with two weapons. You can have a maximum of two weapons equipped. Click an item, then click Equip in the menu that opens, to equip an item.</p>";
            description += "<p>To start fighting, click the Battle button on the left panel. The game will now always fight and collect new weapons, as well as automatically sell them.</p>";
            description += "<p>Equip stronger items and get further!</p>";
            description += "<hr>"
            description += "<p>Each weapon has a number of stats on it.</p>"
            description += "<div><span class='icon-damage'></span> - Damage - the weapon's damage</div>";
            description += "<div><span class='icon-health' style='float:left'></span> - Health - added to the player's health</div>";
            description += "<div><span class='icon-damagespeed'></span> - Damage Speed - attack speed of the weapon, in seconds</div>";
            description += "<div><span class='icon-reach'></span> - Reach - how many enemies the weapon will hit at once, if there are multiple</div>";
            description += "<div><span class='icon-str'></span> - If your STR is higher than enemy DEF, you will deal more damage (and vice versa, same for enemies).</div>";
            description += "<div><span class='icon-def'></span> - If your DEF is higher than enemy STR, you will receive less damage (and vice versa, same for enemies)</div>";
            description += "<div><span class='icon-agi'></span> - If your AGI is higher than enemy AGI, you will gain dodge chance (and vice versa). Each stat difference is 1% compounding dodge chance";
            description += "</div>";
            model.menu.create(Math.floor(window.innerWidth / 2 - window.innerWidth * 0.25), Math.floor(window.innerHeight / 2 - window.innerWidth * 0.11) - 100, 
            "50vw", "22vw", "Help", description);
        }
        document.getElementById("buttonBattle").onclick = e => model.battle.startNewRun(model.player);
        document.getElementById("buttonPause").onclick = function(e) {
            paused = !paused;

            if(paused) {
                Utility.swapClass("button-c-", "button-c-red", this);
                this.innerHTML = "Paused!";
            }
            else {
                Utility.swapClass("button-c-", "button-c-default", this);
                this.innerHTML = "Pause";
            }
        }

        document.getElementById("buttonChangeValueWeights").onclick = function(e) {
            model.menu.createChangeValueWeights(model.player, window.innerWidth, window.innerHeight);
        }

        document.getElementById("buttonInventorySort").onclick = e => model.player.sortInventory();
        document.getElementById("buttonInventoryDestroyWeakItems").onclick = e => model.player.destroyWeakItems();

        document.getElementById("checkboxLowPerformance").onchange = function(e) {
            model.flags.lowPerformanceMode = this.checked;
            onLowPerformanceChecked(this.checked);
        }

        document.getElementById("containerProgressRarityChance").onclick = e => {
            let wave = model.battle.wave;
            let startingRarity = Item.getRarityRollStartingRarity(wave);
            let offset = Item.getRarityRollOffset(wave);

            let description = '';

            description += "Wave " + wave + "<br><br>";
            let prcTotal = 100;
            let arr = [];
            for(let i = startingRarity + 6; i > startingRarity; i--) {
                let prc = Math.floor((offset / Math.pow(10, i - startingRarity) * prcTotal) * 100000)/100000;
                prcTotal -= prc;
                arr[i - startingRarity] = prc;
            }
            arr[0] = prcTotal;

            for(let i = 0; i < arr.length; i++) {
                description += "Rarity " + (i + startingRarity) + ": " + (Math.floor(arr[i] * 100000) / 100000) + "%<br>";
            }

            model.menu.create(e.clientX, e.clientY, "20vw", "auto", "Rarity Chance Breakdown", description);
        }
    } catch(e) {
        console.error(e);
    }

    try {
        document.getElementById("textPlayerHealth").innerHTML = model.player.health;
        document.getElementById("textPlayerMaxHealth").innerHTML = model.player.maxHealth;
    } catch(e) {
        console.error(e);
    }

    function save() {
        localStorage.setItem("_save0_", JSON.stringify(model));
        console.game(console.SAVED, "Game Saved!");
    }

    function load() {
        let s = localStorage.getItem("_save0_");
        s = JSON.parse(s);

        if(s != null && model.version === s.version) {
            if(s.clock != null) model.clock = s.clock;
            if(s.flags != null) model.flags = s.flags;
            if(s.start != null) model.start = s.start;

            model.player = new Player(s.player);
            model.battle = new Battle(s.battle);
            model.menu = new Menu(s.menu, document);
        }
        else {
            model.player = new Player(null);
            model.battle = new Battle(null);
            model.menu = new Menu(null, document);
        }
        (() => {
            function refreshEnemyStats(elem, enemy) {
                let arr = elem != null ? [{elem:elem,enemy:enemy}] : ((() => {
                    let arr = [];
                    let enemies = model.battle.enemies;
                    let l = enemies.length;
                    for(let i = 0; i < l; i++) {
                        let enemy = enemies[i];
                        arr[i] = {elem:document.getElementById("enemy" + enemy.id), enemy:enemy};
                    }
                    return arr;
                })());

                let l = arr.length;
                for(let i = 0; i < l; i++) {
                    let obj = arr[i];
                    elem = obj.elem;
                    enemy = obj.enemy;

                    elem.children[0].children[0].innerHTML = Math.ceil(Battle.getDamage(enemy.damage, enemy.stats.str, model.player.stats.def.total));
                    elem.children[0].children[1].innerHTML = "(" + Math.ceil(enemy.damage) + ")";
                    elem.children[0].children[3].innerHTML = Math.ceil(1 / (Battle.getEnemyInterval(enemy.damageSpeed, enemy.stats.agi, model.player.stats.agi.total) / 1000) * 10) / 10;
                    elem.children[1].children[0].innerHTML = Math.ceil(enemy.health) + "/" + Math.ceil(enemy.maxHealth);
                    elem.children[1].children[1].style.transform = "translateX(-" + (100 - Math.ceil(enemy.health / enemy.maxHealth * 100)) + "%)";
                    let j = 2;
                    for(let name in enemy.stats) {
                        elem.children[j].style.transform = "translateX(-" + (100 - enemy.stats[name] / model.player.stats[name].total * 100) + "%)";
                        j++;
                    }
                }
            }

            function refreshEnemyProgress(enemy) {
                let node = document.getElementById("enemy" + enemy.id);
                if(node != null) {
                    node = node.querySelector(".enemy-attack-progress");
                    node.style.transform = "translateX(-" + (100 - enemy._battleCoordinatorClockSelf / enemy._battleCoordinatorClockSelfFinish * 100) + "%)";
                }
                
            }

            (() => {
                function refreshItemProgress(item) {
                    let elem = cache.get(item);
                    let node = elem.querySelector(".item-attack-progress");
                    node.style.transform = "translateX(-" + (100 - item._battleClockSpeed / item._battleClockSpeedFinish * 100) + "%)";
                
                    node = elem.querySelector(".item-regen-progress");
                    node.style.transform = "translateX(-" + (100 - item._battleClockRegenSpeed / item._battleClockRegenSpeedFinish * 100) + "%)";;
                }

                let cache = new Map();

                model.player.on("itemsChanged", (items, allItems) => {
                    try {
                        let containerInventory = document.getElementById("containerInventory");

                        if(!(items instanceof Array))
                            items = [items];

                        if(allItems) {
                            let a = Array.from(document.getElementsByClassName("item"));
                            let l = a.length;
                            for(let i = 0; i < l; i++) {
                                a[i].parentNode.removeChild(a[i]);
                            }
                            cache = new Map();
                        }

                        let l = items.length;
                        for(let i = 0; i < l; i++) {
                            let item = items[i];

                            let existingElem = cache.get(item);
                            if(item._deleted === true && existingElem != null) {
                                cache.delete(item);
                                cache = new Map(cache);

                                existingElem.onclick = null;
                                existingElem.parentNode.removeChild(existingElem);
                                continue;
                            }
                            else if(item._deleted) {
                                continue;
                            }
                            let fragment;
                            let nextChild = 0;

                            if(item.type === Item.WEAPON) {
                                fragment = document.getElementById("template_item_weapon").content.cloneNode(true);
                                fragment.children[0].children[0].children[0].innerHTML = Math.round(item.getValue(model.player.weights));
                                fragment.children[0].children[1].children[0].innerHTML = Math.floor(item.damageSpeed * 10) / 10;
                                fragment.children[0].children[2].children[0].innerHTML = item.damage;
                                fragment.children[0].children[3].children[0].innerHTML = item.reach;
                                nextChild = 4;
                            }
                            else if(item.type === Item.ARMOR) {
                                fragment = document.getElementById("template_item_armor").content.cloneNode(true);
                                fragment.children[0].children[0].children[0].innerHTML = Math.round(item.getValue(model.player.weights));
                                fragment.children[0].children[1].children[0].innerHTML = item.health;
                                fragment.children[0].children[2].children[0].innerHTML = item.regen;
                                fragment.children[0].children[3].children[0].innerHTML = item.regenSpeed;
                                nextChild = 4;
                            }
                            else {
                                fragment = document.getElementById("template_item_default").content.cloneNode(true);
                                fragment.children[0].children[0].children[0].innerHTML = Math.round(item.getValue(model.player.weights));
                                nextChild = 1;
                            }

                            let height = Math.ceil(100 / Object.keys(item.stats).length * 100) / 100;
                            for(let name in item.stats) {
                                let div = document.createElement("div");
                                div.className = "progress-bar bg-" + name;
                                div.style.position = "relative";
                                div.style.height = height + "%";

                                div.style.transform = "translateX(-" + (100 - Math.ceil(item.stats[name] / item.getStatRoll(true) * 100)) + "%)";

                                fragment.children[0].children[nextChild].appendChild(div);
                            }

                            let elem = Array.prototype.slice.call(fragment.childNodes, 0)[1];

                            
                            if(existingElem != null)
                                existingElem.parentNode.removeChild(existingElem);
                            
                            cache.set(item, elem);

                            switch(item._inventory.id) {
                            case Player.INVENTORY:
                                containerInventory.appendChild(fragment);
                                break;
                            case Player.EQUIPMENT:
                                let slotElem = document.getElementById("containerCharacterItemSlot" + item._inventory.data);
                                let existingItemInSlot = slotElem.children[0];
                                if(existingItemInSlot != null)
                                    containerInventory.appendChild(existingItemInSlot);
                                slotElem.appendChild(fragment);
                                break;
                            case Player.BACKPACK:
                                document.getElementById("containerItemBackpack").appendChild(fragment);
                            }

                            refreshItemProgress(item);
                            refreshEnemyStats();

                            elem.className += " item-rarity-" + item.rarity + " item-" + item.type;

                            elem.onclick = (e) => {
                                model.menu.createItem(e.clientX, e.clientY, item, model.player,
                                    (slot) => {
                                        model.player.equipItem(item, slot);
                                    },
                                    () => {
                                        let rollsArr = [10, 100, 1000];

                                        model.menu.createItemReroll(e.clientX, e.clientY, item, model.player, rerolls => {
                                            model.player.rerollItem(item, rerolls);
                                        });
                                    },
                                    () => model.player.sellItem(item),
                                    () => model.player.backpackItem(item));
                            };
                        }
                    } catch(e){
                        console.error(e);
                    }
                });

                model.battle.on("playerUpdated", player => {
                    try {
                        let l = player.inventory.length;
                        for(let i = 0; i < l; i++) {
                            let item = player.inventory[i];

                            if(item._inventory.id !== Player.EQUIPMENT) 
                                continue;

                            if(item == null)
                                continue;

                            refreshItemProgress(item);
                        }
                    } catch(e){console.error(e);}
                });
            })();

            model.player.on("rageChanged", (value, max) => {
                document.getElementById("progressPlayerRage").style.transform = "translateX(-" + (100 - Math.ceil(value / max * 100)) + "%)";
            });

            model.player.on("statsUpdated", player => {
                try {
                    document.getElementById("textPlayerLevel").innerHTML = model.player.level;
                    document.getElementById("textPlayerXP").innerHTML = model.player.xp + " / " + model.player.getCurrentMaxXP() + " XP";
                    document.getElementById("progressPlayerXP").style.transform = "translateX(-" + (100 - Math.ceil(model.player.xp / model.player.getCurrentMaxXP() * 100)) + "%)";

                    document.getElementById("textPlayerGold").innerHTML = player.gold.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

                    let containerStats = document.getElementById("containerStats");
                    if(containerStats.children.length === 0) {
                        for(let name in player.stats) {
                            let div = document.createElement("div");
                            div.className = "icon-" + name;
                            div.id = "textPlayer" + name.toUpperCase();

                            containerStats.appendChild(div);
                        }
                    }

                    for(let name in player.stats)
                        containerStats.querySelector("#textPlayer" + name.toUpperCase()).innerHTML = ": " + player.stats[name].total + " (L:" + player.stats[name].level + ", I:" + player.stats[name].item + ", T:" + player.stats[name].trained + ")";
                } catch(e){console.error(e);}
            });

            model.player.on("itemRerolled", (originalValue, newValue) => {
                let description = "Item successfully rerolled<br><br>Old value: " + Utility.prettify(originalValue) + "<br>New value: " + Utility.prettify(newValue);
                model.menu.create(Math.floor(window.innerWidth / 2 - window.innerWidth * 0.1), Math.floor(window.innerHeight / 2 - window.innerWidth * 0.05), "20vw", "10vw", "Item Rerolled", description);
            });

            model.battle.on("nextWaveStarted", (wave, subWave, maxSubWave, highestWave, maxSubWaveCurrentZone) => {
                try {
                    document.getElementById("textBattleWave").innerHTML = "Wave " + wave;
                    document.getElementById("progressBattleWave").style.transform = "translateX(-" + (100 - (subWave / maxSubWave) * 100) + "%)";
                    document.getElementById("textBattleHighestWave").innerHTML = highestWave;
                    document.getElementById("progressBattleMaxSubWaveCurrentZone").style.transform = "translateX(-" + (100 - (maxSubWaveCurrentZone / maxSubWave) * 100) + "%)";

                    let containerProgressRarityChance = document.getElementById("containerProgressRarityChance");

                    let offset = Item.getRarityRollOffset(wave);

                    containerProgressRarityChance.innerHTML = "";

                    let startingRarity = Item.getRarityRollStartingRarity(wave);

                    for(let i = 0; i < 5; i++) {
                        //TODO merge with item.js func maybe
                        let div = document.createElement("div");
                        div.className = "progress-bar item-rarity-" + (i + startingRarity);

                        div.style.transform = "translateX(-" + (100 - (offset / Math.pow(10, i)) * 100) + "%)";
                        containerProgressRarityChance.appendChild(div);
                    }
                    

                } catch(e) {console.error(e);}
            });

            model.battle.on("playerUpdated", player => {
                try {
                    document.getElementById("textPlayerHealth").innerHTML = Math.ceil(player.health);
                    document.getElementById("textPlayerMaxHealth").innerHTML = player.maxHealth;
                    document.getElementById("progressPlayerHealth").style.transform = "translateX(-" + (100 - Math.ceil((player.health / player.maxHealth) * 100)) + "%)";
                } catch(e) {console.error(e);}
            });

            model.battle.on("enemyDamaged", enemy => {
                try {
                    let elem = document.getElementById("enemy" + enemy.id);
                    if(elem != null) {
                        elem.querySelector(".progress-bar-text").innerHTML = Math.ceil(enemy.health) + "/" + enemy.maxHealth;
                        elem.querySelector(".progress-bar").style.transform = "translateX(-" + (100 - Math.ceil(enemy.health / enemy.maxHealth * 100)) + "%)";
                    }
                } catch(e) {console.error(e);}
            });

            model.battle.on("enemyUpdated", enemy => {
                try {
                    refreshEnemyProgress(enemy);
                } catch(e) {console.error(e);}
            });


            model.battle.on("enemiesRemoved", enemies => {
                try {
                    let containerBattleEnemy = document.getElementById("containerBattleEnemy");
                    if(enemies == null) {
                        containerBattleEnemy.innerHTML = "";
                    }
                    else {
                        let l = enemies.length;
                        for(let i = 0; i < l; i++) {
                            let enemy = containerBattleEnemy.querySelector("#enemy" + enemies[i].id)
                            if(enemy != null)
                                containerBattleEnemy.removeChild(enemy);
                        }
                    }
                } catch(e) {console.error(e);}
            });

            model.battle.on("enemiesAdded", enemies => {
                try {
                    let fragmentContainer = document.createDocumentFragment();
                    let l = enemies.length;
                    for(let i = 0; i < l; i++) {
                        let enemy = enemies[i];
                        let fragment = document.getElementById("template_enemy").content.cloneNode(true);

                        for(let name in enemy.stats) {
                            let div = document.createElement("div");
                            div.className = "progress-bar bg-" + name;
                            div.style.position = "relative";
                            div.style.height = "6px";

                            fragment.children[0].appendChild(div);
                        }
                                        
                        
                        refreshEnemyStats(fragment.children[0], enemy);

                        let elem = Array.prototype.slice.call(fragment.childNodes, 0)[1];
                        elem.id = "enemy" + enemy.id;
                        elem.style.left = enemy.screenX + "%";
                        elem.style.top = enemy.screenY + "%";

                        fragmentContainer.appendChild(fragment);
                    }
                    
                    let containerBattleEnemy = document.getElementById("containerBattleEnemy");
                    containerBattleEnemy.appendChild(fragmentContainer);
                } catch(e) {console.error(e);}
            });
        })();

        model.battle.init();
        model.player.init();
        model.menu.init();
    }

    (() => {
        let frameTime = 100;
        let frameClock = 0;
        let lastTimestamp = 0;

        offlineLoop();
        window.requestAnimationFrame(coreLoop);

        function offlineLoop() {
            let now = Date.now();
            let dif = (now - model.start) - model.clock;

            catchingUp = true;
            while(dif >= frameTime) {
                model.battle.update(frameTime, model.clock, model.player);
                dif -= frameTime;
                model.clock += frameTime;
            }
            catchingUp = false;

            model.battle.init();
            model.player.init();
            model.menu.init();
        }

        function coreLoop(timestamp) {
            frameClock += (timestamp - lastTimestamp);

            if(frameClock >= frameTime * 10) {
                let loops = Math.floor(frameClock / frameTime);

                catchingUp = true;
                for(let i = 0; i < loops; i++) {
                    loop(frameTime);
                    frameClock -= frameTime;
                    model.clock += frameTime;
                }
                catchingUp = false;

                model.battle.init();
                model.player.init();
            }
            else if(frameClock >= frameTime) {
                frameClock -= frameTime;
                model.clock += frameTime;

                loop(frameTime);

                document.getElementById("textTimer").innerHTML = Utility.getFormattedTime(model.clock);
                document.getElementById("textTimerRun").innerHTML = Utility.getFormattedTime(model.battle.timestampTimeElapsedInRun);

                if(model.clock % 5000 === 0)
                    save();
            }

            lastTimestamp = timestamp;
            window.requestAnimationFrame(coreLoop);
        }
    })();

    function loop(frameTime) {
        if(!paused) {
            model.battle.update(frameTime, model.clock, model.player);
        }
    }

    function onLowPerformanceChecked(checked, init) {
        if(checked)
            Utility.swapClass("body-performance-", "body-performance-low", document.body);
        else
            Utility.swapClass("body-performance-", "body-performance-high", document.body);

        if(init) {
            document.getElementById("checkboxLowPerformance").checked = checked;
        }
    }

    return {
        model
    }
})();