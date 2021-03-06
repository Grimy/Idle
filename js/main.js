"use strict";

let debug = (function() {
    let model = {
        modules: {
            player: null,
            battle: null,
            menu: null,
            world: null,
            floateys: null,
        },
        clock: 0,
        start: Date.now(),
        flags: {
            clickedHelp: false,
            lowPerformanceMode: false,
            enableDamageNumbers: true,
        },
        version: 12,
        subVersion: 2,
    }

    let assets = {
        imageVillage: new Image(),
        imageVillageLightmap: new Image()
    }

    assets.imageVillage.src = "img/village.png";
    assets.imageVillageLightmap.src = "img/village_lightmap.png";

    let paused = false;

    load();
    onLowPerformanceChecked(model.flags.lowPerformanceMode, true);
    onEnableDamageNumbersChecked(model.flags.enableDamageNumbers, true);

    if(model.modules.player.inventory.length === 0) {
        model.modules.player.addItem(new Item().generateRandom(null, 0, Item.WEAPON));
        model.modules.player.addItem(new Item().generateRandom(null, 0, Item.ARMOR));
    }

    try {
        if(navigator.userAgent.indexOf('Firefox') > -1) {
            document.getElementById("checkboxLowPerformance").disabled = true;
            onLowPerformanceChecked(true, true);
        }
    } catch(e) {console.error(e)}

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
            model.modules.menu.create(Math.floor(window.innerWidth / 2 - window.innerWidth * 0.25), Math.floor(window.innerHeight / 2 - window.innerWidth * 0.11) - 100, 
            "50vw", "22vw", "Help", description);
        }
        document.getElementById("buttonBattle").onclick = e => model.modules.battle.startNewRun(model.modules.player);
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

        document.getElementById("buttonToVillage").onclick = function(e) {
            let date = new Date();
            model.modules.menu.createVillage(date, assets.imageVillage, assets.imageVillageLightmap, window.innerWidth, window.innerHeight);
        }

        document.getElementById("buttonChangeValueWeights").onclick = function(e) {
            model.modules.menu.createChangeValueWeights(model.modules.player, window.innerWidth, window.innerHeight);
        }

        document.getElementById("buttonInventorySort").onclick = e => model.modules.player.sortInventory();
        document.getElementById("buttonInventoryDestroyWeakItems").onclick = e => model.modules.player.destroyWeakItems();

        document.getElementById("checkboxLowPerformance").onchange = function(e) {
            model.flags.lowPerformanceMode = this.checked;
            onLowPerformanceChecked(this.checked);
        }

        document.getElementById("checkboxEnableDamageNumbers").onchange = function(e) {
            model.flags.enableDamageNumbers = this.checked;
            onEnableDamageNumbersChecked(this.checked);
        }

        document.getElementById("containerProgressRarityChance").onclick = e => {
            let wave = model.modules.battle.wave;
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

            model.modules.menu.create(e.clientX, e.clientY, "20vw", "auto", "Rarity Chance Breakdown", description);
        }
    } catch(e) {
        console.error(e);
    }

    try {
        document.getElementById("textPlayerHealth").innerHTML = model.modules.player.health;
        document.getElementById("textPlayerMaxHealth").innerHTML = model.modules.player.maxHealth;
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

            //COMPATIBILITY CODE
            if(s.subVersion == null) {
                s.modules = {};
                s.modules.player = s.player;
                s.modules.battle = s.battle;
                s.modules.menu = s.menu;

                s.subVersion = 1;
            }

            if(s.subVersion <= 1) {
                s.flags.enableDamageNumbers = true;
            }

            model.modules.player = new Player(s.modules.player);
            model.modules.battle = new Battle(s.modules.battle);
            model.modules.menu = new Menu(s.modules.menu, document.getElementById("template_menu"), document.getElementById("containerMenus"));
            model.modules.world = new World(s.modules.world);
            model.modules.floateys = new Floateys(s.modules.floateys, document.getElementById("template_floatey"), document.getElementById("containerFloateys"));
        }
        else {
            model.modules.player = new Player(null);
            model.modules.battle = new Battle(null);
            model.modules.menu = new Menu(null, document.getElementById("template_menu"), document.getElementById("containerMenus"));
            model.modules.world = new World(null);
            model.modules.floateys = new Floateys(null, document.getElementById("template_floatey"), document.getElementById("containerFloateys"));
        }
        (() => {
            function refreshEnemyStats(elem, enemy) {
                let arr = elem != null ? [{elem:elem,enemy:enemy}] : ((() => {
                    let arr = [];
                    let enemies = model.modules.battle.enemies;
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

                    if(elem === null)
                        continue;

                    let elems = Array.from(elem.querySelectorAll("[data-id]"));
                    for(let elem in elems) {
                        elem = elems[elem];

                        switch(elem.dataset["id"]) {
                        case "textDamage":
                            elem.innerHTML = Math.ceil(Battle.getDamage(enemy.damage, enemy.stats.str, model.modules.player.stats.def.total));
                            break;
                        case "textDamageBase":
                            elem.innerHTML = "(" + Math.ceil(enemy.damage) + ")";
                            break;
                        case "textSpeed":
                            elem.innerHTML = Math.ceil(1 / (Battle.getEnemyInterval(enemy.damageSpeed, enemy.stats.agi, model.modules.player.stats.agi.total) / 1000) * 10) / 10;
                            break;
                        case "textHealth":
                            elem.innerHTML = Math.ceil(enemy.health) + "/" + Math.ceil(enemy.maxHealth);
                            break;
                        case "textStatCap":
                            elem.innerHTML = Math.ceil(Battle.getEnemyStatCeiling(model.modules.battle.wave, Object.keys(enemy.stats).length));
                        }

                        for(let name in enemy.stats) {
                            if(elem.dataset["id"] === "progress" + name) {
                                elem.style.transform = Utility.getProgressBarTransformCSS(enemy.stats[name], Battle.getEnemyStatCeiling(model.modules.battle.wave, Object.keys(enemy.stats).length));
                            }
                        }
                    }
                }
            }

            function refreshEnemyProgress(enemy) {
                let node = document.getElementById("enemy" + enemy.id);
                if(node != null) {
                    node = node.querySelector(".enemy-attack-progress");
                    node.style.transform = Utility.getProgressBarTransformCSS(enemy._battleCoordinatorClockSelf, enemy._battleCoordinatorClockSelfFinish);
                }
                
            }

            (() => {
                function refreshItemProgress(item) {
                    let elem = cache.get(item);
                    let node = elem.querySelector(".item-attack-progress");
                    node.style.transform = Utility.getProgressBarTransformCSS(item._battleClockSpeed, item._battleClockSpeedFinish);
                
                    node = elem.querySelector(".item-regen-progress");
                    node.style.transform = Utility.getProgressBarTransformCSS(item._battleClockRegenSpeed, item._battleClockRegenSpeedFinish);
                }

                let cache = new Map();

                model.modules.player.on("itemsChanged", (items, allItems) => {
                    try {
                        let containerInventoryWeapon = document.getElementById("containerInventoryWeapon");
                        let containerInventoryArmor = document.getElementById("containerInventoryArmor");

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
                                fragment.children[0].children[0].children[0].innerHTML = Math.round(item.getValue(model.modules.player.weights));
                                fragment.children[0].children[1].children[0].innerHTML = Math.floor(item.damageSpeed * 10) / 10;
                                fragment.children[0].children[2].children[0].innerHTML = item.damage;
                                fragment.children[0].children[3].children[0].innerHTML = item.reach;
                                nextChild = 4;
                            }
                            else if(item.type === Item.ARMOR) {
                                fragment = document.getElementById("template_item_armor").content.cloneNode(true);
                                fragment.children[0].children[0].children[0].innerHTML = Math.round(item.getValue(model.modules.player.weights));
                                fragment.children[0].children[1].children[0].innerHTML = item.health;
                                fragment.children[0].children[2].children[0].innerHTML = item.regen;
                                fragment.children[0].children[3].children[0].innerHTML = item.regenSpeed;
                                nextChild = 4;
                            }
                            else {
                                fragment = document.getElementById("template_item_default").content.cloneNode(true);
                                fragment.children[0].children[0].children[0].innerHTML = Math.round(item.getValue(model.modules.player.weights));
                                nextChild = 1;
                            }

                            let height = Math.ceil(100 / Object.keys(item.stats).length * 100) / 100;
                            for(let name in item.stats) {
                                let div = document.createElement("div");
                                div.className = "progress-bar bg-" + name;
                                div.style.position = "relative";
                                div.style.height = height + "%";

                                div.style.transform = Utility.getProgressBarTransformCSS(item.stats[name], item.getStatRoll(true));

                                fragment.children[0].children[nextChild].appendChild(div);
                            }

                            let elem = Array.prototype.slice.call(fragment.childNodes, 0)[1];

                            
                            if(existingElem != null)
                                existingElem.parentNode.removeChild(existingElem);
                            
                            cache.set(item, elem);

                            switch(item._inventory.id) {
                            case Player.INVENTORY:
                                if(item.type === Item.WEAPON)
                                    containerInventoryWeapon.appendChild(fragment);
                                else
                                    containerInventoryArmor.appendChild(fragment);
                                break;
                            case Player.EQUIPMENT:
                                let slotElem = document.getElementById("containerCharacterItemSlot" + item._inventory.data);
                                slotElem.appendChild(fragment);
                                break;
                            case Player.BACKPACK:
                                document.getElementById("containerItemBackpack").appendChild(fragment);
                            }

                            refreshItemProgress(item);
                            refreshEnemyStats();

                            elem.className += " item-rarity-" + item.rarity + " item-" + item.type;

                            elem.onclick = (e) => {
                                model.modules.menu.createItem(e.clientX, e.clientY, item, model.modules.player,
                                    (slot) => {
                                        model.modules.player.equipItem(item, slot);
                                    },
                                    () => {
                                        let rollsArr = [10, 100, 1000];

                                        model.modules.menu.createItemReroll(e.clientX, e.clientY, item, model.modules.player, rerolls => {
                                            model.modules.player.rerollItem(item, rerolls);
                                        });
                                    },
                                    () => model.modules.player.sellItem(item),
                                    () => model.modules.player.backpackItem(item));
                            };
                        }
                    } catch(e){
                        console.error(e);
                    }
                });

                model.modules.battle.on("playerUpdated", player => {
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

            model.modules.player.on("rageChanged", (value, max) => {
                document.getElementById("progressPlayerRage").style.transform = Utility.getProgressBarTransformCSS(value, max);
            });

            model.modules.player.on("frenzyChanged", (value, max) => {
                document.getElementById("progressPlayerFrenzy").style.transform = Utility.getProgressBarTransformCSS(value, max);
            });

            model.modules.player.on("statsUpdated", player => {
                try {
                    document.getElementById("textPlayerLevel").innerHTML = model.modules.player.level;
                    document.getElementById("textPlayerXP").innerHTML = model.modules.player.xp + " / " + model.modules.player.getCurrentMaxXP() + " XP";
                    document.getElementById("progressPlayerXP").style.transform = Utility.getProgressBarTransformCSS(model.modules.player.xp, model.modules.player.getCurrentMaxXP());

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

                    let total = 0;
                    for(let name in player.stats) {
                        let cur = player.stats[name].total;
                        total += cur;
                        containerStats.querySelector("#textPlayer" + name.toUpperCase()).innerHTML = ": " + cur + " (L:" + player.stats[name].level + ", I:" + player.stats[name].item + ", T:" + player.stats[name].trained + ")";
                    }

                    document.getElementById("textTotalStats").innerHTML = total;
                } catch(e){console.error(e);}
            });

            model.modules.player.on("itemRerolled", (originalValue, newValue) => {
                let description = "Item successfully rerolled<br><br>Old value: " + Utility.prettify(originalValue) + "<br>New value: " + Utility.prettify(newValue);
                model.modules.menu.create(Math.floor(window.innerWidth / 2 - window.innerWidth * 0.1), Math.floor(window.innerHeight / 2 - window.innerWidth * 0.05), "20vw", "10vw", "Item Rerolled", description);
            });

            model.modules.battle.on("nextWaveStarted", (wave, subWave, maxSubWave, highestWave, highestWaveSubWave, maxSubWaveCurrentZone) => {
                try {
                    document.getElementById("textBattleWave").innerHTML = "Wave " + wave;
                    document.getElementById("progressBattleWave").style.transform = Utility.getProgressBarTransformCSS(subWave, maxSubWave);
                    document.getElementById("textBattleHighestWave").innerHTML = highestWave + "." + highestWaveSubWave;
                    document.getElementById("progressBattleMaxSubWaveCurrentZone").style.transform = Utility.getProgressBarTransformCSS(maxSubWaveCurrentZone, maxSubWave);

                    let containerProgressRarityChance = document.getElementById("containerProgressRarityChance");

                    let offset = Item.getRarityRollOffset(wave);

                    containerProgressRarityChance.innerHTML = "";

                    let startingRarity = Item.getRarityRollStartingRarity(wave);

                    for(let i = 0; i < 5; i++) {
                        //TODO merge with item.js func maybe
                        let div = document.createElement("div");
                        div.className = "progress-bar item-rarity-" + (i + startingRarity);

                        div.style.transform = Utility.getProgressBarTransformCSS(offset, Math.pow(10, i));
                        containerProgressRarityChance.appendChild(div);
                    }
                    

                } catch(e) {console.error(e);}
            });

            model.modules.battle.on("playerUpdated", (player, playerHealthChange) => {
                try {
                    if(model.flags.enableDamageNumbers) {
                        if(playerHealthChange > 0) 
                            model.modules.floateys.createFloatingNumber("+" + (Math.ceil(playerHealthChange * 10) / 10), "75%", "85%", "c-teal");
                        else if(playerHealthChange < 0)
                            model.modules.floateys.createFloatingNumber((Math.ceil(playerHealthChange * 100) / 100), "75%", "85%", "c-red");
                    }

                    document.getElementById("textPlayerHealth").innerHTML = Math.ceil(player.health);
                    document.getElementById("textPlayerMaxHealth").innerHTML = player.maxHealth;
                    document.getElementById("progressPlayerHealth").style.transform = Utility.getProgressBarTransformCSS(player.health, player.maxHealth);
                } catch(e) {console.error(e);}
            });

            model.modules.battle.on("enemyDamaged", (enemy, damage, playerItemId) => {
                try {
                    if(model.flags.enableDamageNumbers)
                        model.modules.floateys.createFloatingNumber("-" + (Math.ceil(damage * 10) / 10), (playerItemId === 1 ? enemy.screenX : enemy.screenX + 12) + "%", (enemy.screenY + 2) + "%", "c-red");

                    let elem = document.getElementById("enemy" + enemy.id);
                    if(elem != null) {
                        elem.querySelector(".progress-bar-text").innerHTML = Math.ceil(Math.max(0, enemy.health)) + "/" + enemy.maxHealth;
                        elem.querySelector(".progress-bar").style.transform = Utility.getProgressBarTransformCSS(enemy.health, enemy.maxHealth);
                    }
                } catch(e) {console.error(e);}
            });

            model.modules.battle.on("enemyDodged", (enemy, playerItemId) => {
                if(model.flags.enableDamageNumbers)
                    model.modules.floateys.createFloatingNumber("Dodged", (playerItemId === 1 ? enemy.screenX : enemy.screenX + 12) + "%", (enemy.screenY + 2) + "%", "c-green");

            });

            model.modules.battle.on("playerDodged", player => {
                if(model.flags.enableDamageNumbers)
                    model.modules.floateys.createFloatingNumber("Dodged", "75%", "85%", "c-green");

            });

            model.modules.battle.on("enemyUpdated", enemy => {
                try {
                    refreshEnemyProgress(enemy);
                } catch(e) {console.error(e);}
            });


            model.modules.battle.on("enemiesRemoved", enemies => {
                try {
                    let containerBattleEnemy = document.getElementById("containerBattleEnemy");

                    if(enemies == null) {
                        let elems = Array.from(containerBattleEnemy.children);
                        let l = elems.length;
                        for(let i = 0; i < l; i++) {
                            if(elems[i].id !== "enemyRemoved")
                                containerBattleEnemy.removeChild(elems[i]);
                        }
                    }
                    else {
                        let l = enemies.length;
                        for(let i = 0; i < l; i++) {
                            let enemy = containerBattleEnemy.querySelector("#enemy" + enemies[i].id)
                            if(enemy != null) {
                                enemy.id = "enemyRemoved";

                                setTimeout(() => containerBattleEnemy.removeChild(enemy), 1000);
                            }
                        }
                    }
                } catch(e) {console.error(e);}
            });

            model.modules.battle.on("enemiesAdded", enemies => {
                try {
                    let fragmentContainer = document.createDocumentFragment();
                    let l = enemies.length;
                    for(let i = 0; i < l; i++) {
                        let enemy = enemies[i];
                        let fragment = document.getElementById("template_enemy").content.cloneNode(true);

                        let containerProgress = fragment.querySelector("[data-id=containerProgress]");
                        
                        for(let name in enemy.stats) {
                            let div = document.createElement("div");
                            div.className = "progress-bar bg-" + name;
                            div.style.position = "relative";
                            div.style.height = "6px";
                            div.style.border = "1px solid black";
                            div.style.marginTop = "-1px";
                            div.dataset.id = "progress" + name;

                            containerProgress.appendChild(div);
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

            model.modules.world.on("timeUpdated", (r, g, b, hours, minutes) => {
                document.getElementById("containerWorld").style.backgroundColor = "rgb(" + r + "," + g + "," + b + ")";
                document.getElementById("textCurrentTime").innerHTML = (hours<10?"0"+hours:hours) + ":" + (minutes<10?"0"+minutes:minutes);
            })
        })();

        for(let module in model.modules) {
            module = model.modules[module];
            if(typeof module.init === "function")
                module.init();
        }
    }

    let frameTime = 100;
    let frameClock = 0;
    let lastTimestamp = 0;
    let animationFrame = null;

    offlineLoop();
    window.requestAnimationFrame(coreLoop);

    function offlineLoop() {
        let now = Date.now();
        let dif = (now - model.start) - model.clock;

        for(let module in model.modules)
            model.modules[module].disableEvents();

        while(dif >= frameTime) {
            model.modules.battle.update(frameTime, model.clock, model.modules.player);
            dif -= frameTime;
            model.clock += frameTime;
        }
        
        for(let module in model.modules) {
            module = model.modules[module];
            module.enableEvents();
            if(typeof module.init === "function")
                module.init();
        }
    }

    function coreLoop(timestamp) {
        frameClock += (timestamp - lastTimestamp);
        lastTimestamp = timestamp;

        if(frameClock >= frameTime * 10) {
            let loops = Math.floor(frameClock / frameTime);

            for(let module in model.modules)
                model.modules[module].disableEvents();
            
            for(let i = 0; i < loops; i++) {
                loop(frameTime);
                frameClock -= frameTime;
                model.clock += frameTime;
            }

            for(let module in model.modules) {
                module = model.modules[module];
                module.enableEvents();
                if(typeof module.init === "function")
                    module.init();
            }
        }
        else if(frameClock >= frameTime) {
            frameClock -= frameTime;
            model.clock += frameTime;

            loop(frameTime);

            model.modules.world.update(frameTime);
            model.modules.floateys.update(frameTime);
            model.modules.menu.update(frameTime);

            document.getElementById("textTimer").innerHTML = Utility.getFormattedTime(model.clock);
            document.getElementById("textTimerRun").innerHTML = Utility.getFormattedTime(model.modules.battle.timestampTimeElapsedInRun);

            if(model.clock % 5000 === 0)
                save();
        }

        window.cancelAnimationFrame(animationFrame);
        animationFrame = window.requestAnimationFrame(coreLoop);
    }

    function loop(frameTime) {
        if(!paused) {
            model.modules.battle.update(frameTime, model.clock, model.modules.player);
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

    function onEnableDamageNumbersChecked(checked, init) {
        if(init) {
            document.getElementById("checkboxEnableDamageNumbers").checked = checked;
        }
    }

    return {
        model,
        offsetFrameClock: function(num) {
            frameClock += num;
        }
    }
})();