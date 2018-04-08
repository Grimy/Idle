const Player = ((window, document) => {
    "use strict";

    class Player extends EventEmitter {
        static get Stat() {
            return class Stat {
                constructor(init) {
                    if(init != null) {
                        this.total = init.total;
            
                        this.level = init.level;
                        this.item = init.item;
                        this.trained = init.trained;
                    }
                    else {
                        this.empty();
                    }
                }
            
                empty() {
                    this.total = 0;
            
                    this.level = 0;
                    this.item = 0;
                    this.trained = 0;
            
                    return this;
                }
            
                calculateTotal() {
                    this.total = this.level + this.item + this.trained;
            
                    return this;
                }
            }
        }
        
        constructor(init) {
            super();
    
            init = init || {};
    
            this.level = init.level || 1;
            this.xp = init.xp || 0;
            this.gold = init.gold || 0;
    
            this.health = init.health || 0;
            this.maxHealth = init.maxHealth || 0;
    
            this.damage = init.damage || 0;
            this.reach = init.reach || 0;

            init.stats = init.stats || {};
            this.stats = {};
            this.stats.str = new Player.Stat(init.stats.str);
            this.stats.def = new Player.Stat(init.stats.def);
            this.stats.agi = new Player.Stat(init.stats.agi);

            init.rage = init.rage || {}
            this.rage = {};
            this.rage.value = init.rage.value || 0;
            this.rage.max = init.rage.max || 0;

            init.weights = init.weights || {}
            this.weights = {};
            this.weights.damage = init.weights.damage || 1;
            this.weights.reach = init.weights.reach || 1;
            this.weights.damageSpeed = init.weights.damageSpeed || 1;
            this.weights.health = init.weights.health || 1;
            this.weights.regen = init.weights.regen || 1;
            this.weights.regenSpeed = init.weights.regenSpeed || 1;
            this.weights.playerStats = init.weights.playerStats || 1;

            this.inventory = init.inventory || [];
            for(let i = 0; i < this.inventory.length; i++) {
                this.inventory[i] = new Item(this.inventory[i]);
            }

            this.lastGoldEarned = init.lastGoldEarned || 0;
        }
    
        init() {
            this.emit("itemsChanged", this.inventory, true);

            this.updateStats();
        }

        getItemInventoryIndex(item, logData) {
            if(!(item instanceof Item)) {
                console.warn(this, logData, "called on non-Item");
                return null;
            }

            if(item._deleted) {
                console.warn(this, logData, "Item has already been deleted");
                return null;
            }

            let index = this.inventory.indexOf(item);
            if(index < 0) {
                console.log(this, logData, "Item is not in Player's inventory");
                return null;
            }

            return index;
        }
        
        addItem(item) {
            if(!(item instanceof Item)) {
                console.warn(this, "addItem", "called on non-Item");
                return false;
            }
    
            let index = this.inventory.indexOf(item);
            if(index > -1) {
                console.log(this, "addItem", "Item is already in Player's inventory");
                return false;
            }
    
            item._deleted = false;
            item._inventory.id = Player.INVENTORY;
            item._inventory.data = null;
    
            this.inventory.push(item);
            this.emit("itemsChanged", [item], false);
    
            if(this.inventory.length > 52)
                this.destroyWeakItems();
            return true;
        }

        moveItem(item, id, data) {
            let index = this.getItemInventoryIndex(item, "moveItem");
            if(index == null)
                return false;

            item._inventory.id = id;
            item._inventory.data = data;
            this.emit("itemsChanged", item, false);

            return true;
        }

        rerollItem(item, rolls) {
            let cost = Item.getRerollCost(item.rarity, rolls);

            if(this.gold < cost) {
                console.game(console.INFO, "Not enough gold to reroll item.");
                return false;
            }

            let originalValue = item.getValue(this.weights);

            let value = 0;
            let newItem = null;

            for(let i = 0; i < rolls; i++) {
                item.generateRandom(null, item.rarity, item.type);
                let newValue = item.getValue(this.weights);
                if(newValue >= value) {
                    value = newValue;
                    newItem = new Item(item);   
                }
            }

            if(this.replaceItem(item, newItem)) {
                this.gold -= cost;
                this.updateStats();
                this.emit("itemRerolled", originalValue, value);
                this.sortInventory();
                return true;
            }
            return false;
        }

        replaceItem(item, newItem) {
            let index = this.getItemInventoryIndex(item, "moveItem");
            if(index == null)
                return false;
            
            if(!(newItem instanceof Item)) {
                console.warn(this, "replaceItem", "called on non-Item (arg 1)");
                return false;
            }

            item._deleted = true;
            newItem._inventory = item._inventory;
            this.inventory[index] = newItem;

            this.updateStats();
            this.emit("itemsChanged", [item, newItem], false);

            return true;
        }
        
        backpackItem(item) {
            let index = this.getItemInventoryIndex(item, "backpackItem");
            if(index == null)
                return false;

            if(item._inventory.id === Player.BACKPACK) {
                item._inventory.id = Player.INVENTORY;
                item._inventory.data = null;
            }
            else {
                let l = this.inventory.length;
                let totalInBackpack = 0;
                for(let i = 0; i < l; i++) {
                    if(this.inventory[i]._inventory.id === Player.BACKPACK)
                        totalInBackpack++;
                }

                if(totalInBackpack >= 6) {
                    console.game(console.INFO, "Backpack reached capacity: 6");
                    return false;
                }

                item._equipped = false;
                item._inventory.id = Player.BACKPACK;
                item._inventory.data = null;
            }
    
            this.updateStats();
            this.emit("itemsChanged", item, false);

            return true;
        }

        equipItem(item, slot) {
            let index = this.getItemInventoryIndex(item, "equipItem");
            if(index == null)
                return false;
    
            if(!(slot >= 0)) {
                console.warn(this, "equipItem", "Can't equip item to slot: " + slot);
                return false;
            }

            let items = [];
            items.push(item);

            let equipped = this.inventory.find(item => item._inventory.id === Player.EQUIPMENT && item._inventory.data === slot);
            if(equipped != null) {
                if(equipped._inventory.id === item._inventory.id && equipped._inventory.data === item._inventory.data) {
                    this.unequipItem(item);
                    return;
                }
                
                equipped._inventory.id = item._inventory.id;
                equipped._inventory.data = item._inventory.data;

                if(equipped._inventory.id !== Player.EQUIPMENT) {
                    equipped._battleClockSpeed = 0;
                    equipped._battleClockRegenSpeed = 0;
                }

                items.push(equipped);
            }

            item._inventory.id = Player.EQUIPMENT;
            item._inventory.data = slot;
    
            this.updateStats();
            this.emit("itemsChanged", items, false);
            return true;
        }
    
        unequipItem(item) {
            let index = this.getItemInventoryIndex(item, "unequipItem");
            if(index == null)
                return false;
    
            item._inventory.id = Player.INVENTORY;
            item._inventory.data = null;

            item._battleClockSpeed = 0;
            item._battleClockRegenSpeed = 0;
    
            this.updateStats();
            this.emit("itemsChanged", item, false);
            return true;
        }
    
        updateStats() {
            if(this.xp >= this.getCurrentMaxXP()) {
                this.xp = 0;
                this.level += 1;
            }

            for(let name in this.stats)
                this.stats[name].empty();
    
            this.damage = 0;
            this.reach = 0;
    
            this.maxItemsEquipped = 2;
            this.maxHealth = 10;

            this.rage.max = 100;
            
            let l = this.inventory.length;
            for(let i = 0; i < l; i++) {
                let item = this.inventory[i];

                if(item._inventory.id !== Player.EQUIPMENT)
                    continue;
    
                this.damage += item.damage;
                this.reach += item.reach;
                this.maxHealth += item.health;

                for(let name in this.stats)
                    this.stats[name].item += item.stats[name];
            }
            
            for(let name in this.stats)
                this.stats[name].level += this.level;

            for(let name in this.stats)
                this.stats[name].calculateTotal();
    
            if(this.health > this.maxHealth)
                this.health = this.maxHealth;
    
            this.emit("statsUpdated", this);
            return true;
        }

        addRage(amt) {
            let rage = this.rage;

            if(amt == null) {
                rage.value = rage.max;
            }
            else {
                rage.value += amt;
                if(rage.value > rage.max)
                    rage.value = rage.max;
            }

            this.emit("rageChanged", rage.value, rage.max, rage.threshold);
        }

        removeRage(amt) {
            let rage = this.rage;
            
            if(amt == null) {
                rage.value = 0;
            }
            else {
                rage.value -= amt;
                if(rage.value < 0)
                    rage.value = 0;
            }

            this.emit("rageChanged", rage.value, rage.max, rage.threshold);
        }

        heal(amt) {
            if(amt == null)
                this.health = this.maxHealth;
            else
                this.health += amt;
            
            this.updateStats();
        }
    
        sortInventory() {
            this.inventory.sort((a, b) => {
                return (
                    a.type - b.type || b.getValue(this.weights) - a.getValue(this.weights)
                );
            });
    
            this.emit("itemsChanged", this.inventory, true);
        }

        sellItem(item) {
            let index = this.getItemInventoryIndex(item, "sellItem");
            if(index == null)
                return false;

            this.gold += item.getSaleGoldValue();

            item._deleted = true;
            this.emit("itemsChanged", [item], false);
            this.inventory.splice(index, 1);

            this.updateStats();
            return true;
        }
    
        destroyWeakItems() {
            this.sortInventory();

            let ignoreThresholdWeapon = 13;
            let ignoreThresholdArmor = 13;

            let l = this.inventory.length;
            for(let i = 0; i < l; i++) {
                let item = this.inventory[i];
                if(item._inventory.id === Player.INVENTORY) {
                    if(item.type === Item.WEAPON) {
                        ignoreThresholdWeapon--;
                        if(ignoreThresholdWeapon < 0 && this.sellItem(item)) {
                            i--;
                            l--;
                        }
                    }
                    else if(item.type === Item.ARMOR) {
                        ignoreThresholdArmor--;
                        if(ignoreThresholdArmor < 0 && this.sellItem(item)) {
                            i--;
                            l--;
                        }
                    }
                }
            }
        }
    
        getCurrentMaxXP() {
            return this.level * 1000;
        }
    }

    Player.INVENTORY = 0;
    Player.EQUIPMENT = 1;
    Player.BACKPACK = 2;

    return Player;
})(null, null);