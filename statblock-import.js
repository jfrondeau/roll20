var fixedCreateObj = fixedCreateObj || function() {
    var obj = createObj.apply(this, arguments);
    if (obj && !obj.fbpath) {
        obj.fbpath = obj.changed._fbpath.replace(/([^\/]*\/){4}/, "/");
    }
    return obj;
};

function capitalizeEachWord(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function sortString(data){
    // temporary holder of position and sort-value
    var map = data.map(function(e, i) {
        return { index: i, value: e.toLowerCase() };
    })
    // sorting the map containing the reduced values
    map.sort(function(a, b) {
        return +(a.value > b.value) || +(a.value === b.value) - 1;
    });
    // container for the resulting order
    var result = map.map(function(e){
      return data[e.index];
    });
    return result;
}

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

on("chat:message", function(msg) {
    // Exit if not an api command
    if (msg.type != "api") {
        return;
    }

    msg.who = msg.who.replace(" (GM)", "");
    //msg.content = msg.content.replace("(GM) ", "");
    var command = msg.content.split(" ", 1);

    if (command != "!build-monster") {
        sendChat('GM', "Commande " + command + " invalide");
        return;
    }
    if (!msg.selected) {
        sendChat("GM", "Vous devez selectionner un token");
        return;
    }

    var token = getObj("graphic", msg.selected[0]._id);
    if (token.get("subtype") != 'token') {
        sendChat('GM', "Pas un token");
        return;
    }

    var statblock = token.get('gmnotes');

    var parser = new Parser();
    parser.parse(statblock);
    log("================");
});


var Parser = function() {
    this.keyword = ['armor class', 'hit points', 'speed', 'str', 'dex', 'con', 'int', 'wis', 'cha', 'saving throws', 'skills', 'damage resistance', 'damage immunities', 'condition immunities','damage vulnerabilities','senses', 'languages', 'challenge', 'traits', 'actions','legendary actions', 'bio'];
    this.skills = {
        acrobatics: 'dexterity', 
        "animal handling": 'wisdom', 
        arcana: 'intelligence', 
        athletics: 'strength', 
        deception: 'charisma',
        history: 'intelligence',
        insigth: 'wisdom',
        intimidation: 'charisma',
        investigation: 'intelligence',
        medecine: 'wisdom',
        nature: 'intelligence',
        perception: 'wisdom',
        performance: 'charisma',
        persuation: 'charisma',
        religion: 'intelligence',
        "sleight of Hand": 'dexterity',
        stealth: 'dexterity',
        survival: 'wisdom'
    }
    this.statblock = '';
    this.npc = undefined;

    this.parse = function(statblock) {
        
        this.statblock = this.clean(statblock);
        section = this.splitSection(this.statblock);
        this.createCharacter(section.title);
        
        var keys = Object.keys(section);
        keys = sortString(keys); // Be sure to process abilities first since other attribut need abilities modifier to be computed.
        
        for(i = 0, len = keys.length; i < len;++i)
        {    
            //log("Len=" + len + "; i = " + i);
            key = keys[i];
            //log('Parsing ' + key);
            switch (key) {
                case 'armor class':
                    this.parseArmorClass(section[key]); break;
                case 'size':
                    this.parseSize(section[key]); break;
                case 'hit points':
                    this.parseHp(section[key]); break;
                case 'speed':
                    this.parseSpeed(section[key]); break;
                case 'abilities':
                    this.parseAbilities(section[key]); break;
                case 'challenge':
                    this.parseChallenge(section[key]); break;
                case 'saving throws':
                    this.parseSavingThrow(section[key]); break;
                case 'skills':
                    this.parseSkills(section[key]); break;
                case 'damage resistance':
                case 'damage immunities':
                case 'condition immunities':
                case 'damage vulnerabilities':
                case 'senses':
                case 'languages':
                    var attr = 'npc_' + key.replace(' ', '_').replace('ties', 'ty');
                    var value = section[key].substring(key.length+1);
                    this.setAttribut(this.npc.id, attr, value);
                    break;
                case 'traits':
                    this.parseTraits(section[key]); 
                    break;
                case 'actions':
                    this.parseActions(section[key]); 
                    break;
                case 'title': 
                    break;
                
                default:
                    log("Missing parse " + key)
            }
        }
    }


    this.clean = function(text) {
        var map = {
            "%20": " ",
            "%22": "'",
            "%26lt": "<",
            "%26gt": ">",
            "%27": "'",
            "%28": "(",
            "%29": ")",
            "%2C": ",",
            "%3A": ":",
            "%3B": ";",
            "%3D": "=",
            "%3E": "",
            "%3F": "?"
        };
        var re = new RegExp(Object.keys(map).join("|"), "g");
        text = text.replace(re, function(matched) {
            return map[matched];
        });

        text = text.replace(/\s*%3Cbr/g, "#");
        text = text.replace(/#\s+/g, "#");
        text = text.replace(/\s{2,}/g, " ");
        
        return text;
    },

    this.splitSection = function(statblock) {
        var keyPos = {};
        var regex = /#\s*(armor class|hit points|speed|str|dex|con|int|wis|cha|saving throws|skills|damage resistance|damage immunities|condition immunities|damage vulnerabilities|senses|languages|challenge|traits|actions|legendary actions|bio)(?:\s|#)/gmi;
        //log(statblock);
        while(match = regex.exec(statblock)){
            keyPos[match[1].toLowerCase()] = match.index;
        };
        
        // Cherche l'index du début du trait
        var match = statblock.match(/#(?!armor class|hit points|speed|str|dex|con|int|wis|cha|saving throws|skills|damage resistance|damage immunities|condition immunities|damage vulnerabilities|senses|languages|challenge|traits|actions|legendary actions|bio)((?:\w|\s)+)\./i);
        keyPos['traits'] = match.index;
        
        var keysSorted = Object.keys(keyPos).sort(function(a, b) {
            return keyPos[b] - keyPos[a]
        })
        
        var last = statblock.length;
        var section = {};
                
        _.each(keysSorted, function(key){
            var content = statblock.substring(keyPos[key], last);
            if(content.indexOf('#' + key)===0)
            {
                content = content.substring(key.length + 1);
            }
            if(key != 'traits' && key != 'actions' && key != 'legendary actions')
                content = content.replace(/#/g, ' ');
            section[key] = content.trim();
            last = keyPos[key];
        })
        
        var pos = statblock.indexOf('#');
        section['title'] =  statblock.substring(0, pos);
        section['size'] = statblock.substring(pos+1, last);
        
        var abilitiesName = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        var abilities = '';
        for (i = 0, len = abilitiesName.length; i < len; ++i) {
            if (section[abilitiesName[i]] != undefined) {
                abilities += section[abilitiesName[i]] + ' ';
                delete section[abilitiesName[i]];
            }
        }
        section['abilities'] = abilities;
        return section;
    }

    this.createCharacter = function(name) {
        name = capitalizeEachWord(name);
        var obj = findObjs({
            _type: "character",
            name: name
        });

        if (obj.length == 0) {
            obj = fixedCreateObj('character', {
                name: name
            });
            log("Creating new character");
        } else {
            obj = getObj('character', obj[0].id);
            log("Character will be updated");
        }

        obj.set({
            gmnotes: this.statblock.replace(/#/g , "\n")
        });
        this.npc = obj;
        this.setAttribut(obj.id, 'is_npc', 1);
    }

    this.setAttribut = function(id, name, currentVal, max) {
        max = max || '';
        
        if(currentVal == undefined){
            log("Error: " + name);
            return;
        }

        var attr = findObjs({
            _type: 'attribute',
            _characterid: id,
            name: name
        })[0];
        if (attr == undefined) {
            createObj('attribute', {
                name: name,
                current: currentVal,
                max: max,
                characterid: id
            });
            //log('Attribut ' + name + " created with " + currentVal);
        } else {
            //log("Trying to set " + name);
            attr.set({
                current: currentVal,
                max: max
            });
            //log('Attribut ' + name + " updated to " + currentVal);
        }
    }

    this.parseArmorClass = function(input) {
        var match = input.match(/(\d+)\s?(.*)/);
        this.setAttribut(this.npc.id, 'npc_AC', match[1]);
        this.setAttribut(this.npc.id, 'npc_AC_note', match[2]);
    }

    this.parseSize = function(input) {
        var match = input.match(/(.*?) (.*?), (.*)/i);
        this.setAttribut(this.npc.id, 'npc_size', match[1]);
        this.setAttribut(this.npc.id, 'npc_type', match[2]);
        this.setAttribut(this.npc.id, 'npc_alignment', match[3]);
    }

    this.parseHp = function(input) {
        var match = input.match(/.*?(\d+)\s+\(((?:\d+)d(?:\d+))/i);
        this.setAttribut(this.npc.id, 'npc_HP', match[1], match[1]);
        this.setAttribut(this.npc.id, 'npc_HP_hit_dice', match[2]);
    }
    
    this.parseSpeed = function(input) {
        var match = input.match(/(speed|fly|climb|swim|burrow)\s*(\d+)/gi);
        
        _.each(match, function(speed){
            var tmp = speed.split(' ');
            
            switch(tmp[0].toLowerCase()){
                case 'speed': this.setAttribut(this.npc.id, 'npc_speed', tmp[1]); break;
                case 'fly': this.setAttribut(this.npc.id, 'npc_speed_fly', tmp[1]); break;
                case 'climb': this.setAttribut(this.npc.id, 'npc_speed_climb', tmp[1]); break;
                case 'swim': this.setAttribut(this.npc.id, 'npc_speed_swim', tmp[1]); break;
                case 'burrow': this.setAttribut(this.npc.id, 'npc_speed_burrow', tmp[1]); break;
            }
        }, this);
    }
    
    this.parseAbilities = function(input) { 
        var regex = /(\d+)\s*\(/g;
        var match = [];
        while(matches = regex.exec(input)){
            match.push(matches[1]);
        }
        this.setAttribut(this.npc.id, 'npc_strength', match[0]);
        this.setAttribut(this.npc.id, 'npc_dexterity', match[1]);
        this.setAttribut(this.npc.id, 'npc_constitution', match[2]);
        this.setAttribut(this.npc.id, 'npc_intelligence', match[3]);
        this.setAttribut(this.npc.id, 'npc_wisdom', match[4]);
        this.setAttribut(this.npc.id, 'npc_charisma', match[5]);
    }
    
    this.parseChallenge = function(input) {
        input = input.replace(/[, ]/g, '');
        var match = input.match(/(\d+).*?(\d+)/);
        this.setAttribut(this.npc.id, 'npc_challenge', parseInt(match[1]));
        this.setAttribut(this.npc.id, 'npc_xp', parseInt(match[2]));
    }
    
    this.parseSavingThrow = function(input){
        var regex = /(STR|DEX|CON|INT|WIS|CHA).*?(\d+)/gi;
        var attr, value;
        while(match = regex.exec(input)){            
            switch(match[1].toLowerCase())
            {
                case 'str': attr = 'npc_strength'; break;
                case 'dex': attr = 'npc_dexterity'; break;
                case 'con': attr = 'npc_constitution'; break;
                case 'int': attr = 'npc_intelligence'; break;
                case 'wis': attr = 'npc_wisdom'; break;
                case 'cha': attr = 'npc_charisma'; break;
            }
            this.setAttribut(this.npc.id, attr + '_save_bonus', match[2] - Math.floor((getAttrByName(this.npc.id,attr)-10)/2));
        }
    }
    
    this.parseSkills = function(input){
        input = input.replace(/Skills\s+/i, '');
        var regex = /(\w+).*?(\d+)/gi;
        while(match = regex.exec(input)){
            var skill = match[1].toLowerCase();
            var abilitymod = this.skills[skill];
            var attr = 'npc_' + skill.replace(' ','') + '_bonus';
            var tmp = Math.floor((getAttrByName(this.npc.id,'npc_'+ abilitymod)-10)/2);
            //log(abilitymod + " = " + tmp);
            this.setAttribut(this.npc.id, attr, match[2] - Math.floor((getAttrByName(this.npc.id,'npc_'+ abilitymod)-10)/2));
        }
    }
    
    this.parseTraits = function(input){
        power = this.parsePower(input);
        
        var texte = "";
        _.each(power, function(value, key){
            texte += key + ': ' + value + '\n';
        });
        texte = texte.slice(0, -1);
        this.setAttribut(this.npc.id, 'npc_traits', texte);
    }
    
    this.parseActions = function(input){
        
        var actions = this.parsePower(input);
        
        /*npc_action_name1
        npc_action_description1
        npc_action_effect1
        */
        
        var cpt = 1;
        
         _.each(actions, function(value, key){
            this.setAttribut(this.npc.id, 'npc_action_name' + cpt, key);
            this.setAttribut(this.npc.id, 'npc_action_description' + cpt, value);
            cpt++;
        }, this);
    }
    
    this.parsePower = function(input){
        //log(input);
        
        var power = {};
        var regex = /#((?:[A-Z][a-z]+[0-9-\s(\/)]{0,5})+)\./g;
        var precedentKey;
        var precedentIndex = 0;
        while(match = regex.exec(input)){
            if(match.index > 0 && precedentKey != undefined){
                power[precedentKey] = input.substring(precedentIndex + precedentKey.length + 2, match.index -1).replace(/\.#/g,'.\n').replace(/#/g,' ').trim();
            }
                
            precedentKey = match[1];
            precedentIndex = match.index;
        }    
        power[precedentKey] = input.substring(precedentIndex + precedentKey.length + 2).replace(/\.#/g,'.\n').replace(/#/g,' ').trim();
        
        return power;
    }
};