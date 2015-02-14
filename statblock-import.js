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

function splitRegex(source, regex, map)
{
    var precedentKey;
    var precedentIndex = 0;
    var debut = 0;
    var section = {};

    while(match = regex.exec(source))
    {
        if(match.index > 0 && precedentKey != undefined)
        {
            if(map)
                section[precedentKey] = map(source.substring(precedentIndex + precedentKey.length + 2, match.index).trim());    
            else
                section[precedentKey] = source.substring(precedentIndex + precedentKey.length + 2, match.index).trim();
        }
            
        precedentKey = match[1].toLowerCase();
        precedentIndex = match.index;

        if(debut == 0 ) {
            debut = precedentIndex;
            section.debut = match.index;
        }
    }    
    section[precedentKey] = source.substring(precedentIndex + precedentKey.length + 2).trim();
    return section;
}


var Parser = function() {
    this.keyword = ['armor class', 'hit points', 'speed', 'str', 'dex', 'con', 'int', 'wis', 'cha', 'saving throws', 'skills', 'damage resistance', 'damage immunities', 'condition immunities','damage vulnerabilities','senses', 'languages', 'challenge', 'traits', 'actions','legendary actions', 'bio'];
    this.statblock = '';
    this.npc = undefined;

    this.parse = function(statblock) {
        
        this.statblock = this.clean(statblock);
        section = this.splitSection(this.statblock);

        this.createCharacter(section.title);

        // Be sure to process abilities first since other attribut need abilities modifier to be computed.
        this.parseAbilities(section['abilities']);

        _.each(section, function(value, key)
        {
            switch (key) {
                case 'armor class': this.parseArmorClass(section[key]); break;
                case 'size': this.parseSize(section[key]); break;
                case 'hit points': this.parseHp(section[key]); break;
                case 'speed': this.parseSpeed(section[key]); break;
                
                case 'challenge': this.parseChallenge(section[key]); break;
                case 'saving throws': this.parseSavingThrow(section[key]); break;
                case 'skills': this.parseSkills(section[key]); break;
                case 'traits': this.parseTraits(section[key]); break;
                case 'actions': this.parseActions(section[key]); break;
                case 'damage immunities':
                case 'condition immunities':
                case 'damage vulnerabilities':
                case 'senses':
                case 'languages':
                    var attr = 'npc_' + key.replace(' ', '_').replace('ties', 'ty');                    
                    this.setAttribut(this.npc.id, attr, section[key]);
                    break;
                case 'damage resistances':
                    var attr = 'npc_damage_resistance';
                    this.setAttribut(this.npc.id, attr, section[key]);
                    break;
                
                case 'title': 
                    break;
                
                default:
                    log("Missing parse " + key)
            }
        }, this);
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

        var attributes = statblock;
        var powers;

        // Cherche l'index du début du trait
        var match = statblock.match(/#(?!armor class|hit points|speed|str|dex|con|int|wis|cha|saving throws|skills|damage resistances|damage immunities|condition immunities|damage vulnerabilities|senses|languages|challenge|traits|actions|legendary actions|bio)((?:\w|\s)+)\./i);
        var posTraits = match.index;
        if(match !== null)
        {
            attributes = statblock.substring(0, match.index);
            powers = statblock.substring(match.index);
        }    

        // Split les attributs du statblock;
        var regex = /#\s*(armor class|hit points|speed|str|dex|con|int|wis|cha|saving throws|skills|damage resistances|damage immunities|condition immunities|damage vulnerabilities|senses|languages|challenge)(?:\s|#)/gmi;
        var section = splitRegex(attributes, regex, function(texte){
            return texte.replace(/\.#/g,'.\n').replace(/#/g,' ');  
        });

        // Traite title, size and abilities
        var pos = statblock.indexOf('#');
        section['title'] =  statblock.substring(0, pos);
        section['size'] = statblock.substring(pos+1, section.debut);
        
        var abilitiesName = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        var abilities = '';
        for (i = 0, len = abilitiesName.length; i < len; ++i) {
            if (section[abilitiesName[i]] != undefined) {
                abilities += section[abilitiesName[i]] + ' ';
                delete section[abilitiesName[i]];
            }
        }
        section['abilities'] = abilities;

        // Traite le reste du statblock
        var section2 = splitRegex(powers, /#\s*(actions|legendary actions|bio)(?:\s|#)/gmi);
        section2['traits'] = powers.substring(0, section2.debut);
        
        for (var attrname in section2) { section[attrname] = section2[attrname]; } // Combine le tout.
        delete section.debut;

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

        obj.set({gmnotes: this.statblock.replace(/#/g , '\n')});
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

        var baseAttr = 'npc_speed';
        var regex = /(|fly|climb|swim|burrow)\s*(\d+)(?:ft\.|\s)+(\(.*\))?/gi;
        while(match = regex.exec(input))
        {
            
            var attrName = baseAttr + (match[1] != '' ? '_' + match[1].toLowerCase(): '');
            var value = match[2];
            if(match[3] != undefined)
                value += ' ' + match[3];

            this.setAttribut(this.npc.id, attrName, value);
        }
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

        var skills = {acrobatics: 'dexterity', "animal handling": 'wisdom', arcana: 'intelligence', athletics: 'strength', deception: 'charisma',history: 'intelligence',insigth: 'wisdom',intimidation: 'charisma',investigation: 'intelligence',medecine: 'wisdom',nature: 'intelligence',perception: 'wisdom',performance: 'charisma',persuation: 'charisma',religion: 'intelligence',"sleight of Hand": 'dexterity', stealth: 'dexterity', survival: 'wisdom'};

        input = input.replace(/Skills\s+/i, '');
        var regex = /(\w+).*?(\d+)/gi;
        while(match = regex.exec(input)){
            var skill = match[1].toLowerCase();
            var abilitymod = skills[skill];
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
        var cpt = 1;
        
         _.each(actions, function(value, key){
            this.setAttribut(this.npc.id, 'npc_action_name' + cpt, key);
            var pos = value.indexOf('Hit:');
            this.setAttribut(this.npc.id, 'npc_action_description' + cpt, value.substring(0, pos).trim());
            this.setAttribut(this.npc.id, 'npc_action_effect' + cpt, value.substring(pos).trim());
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


/**
    This section is used to test script outside roll20 and locally using node.js
    Do not copy this section on roll20
**/

_ = require('./underscore-min.js');

var obj = {
    id: 1,
    set: function(attr) {
        for (var prop in attr) {
            if (attr.hasOwnProperty(prop)) {
                this[prop] = attr[prop];
            }
        }
    }
}
function on(event, callback){}
function findObjs(filter){ return [{id: 1}]}
function getObj(id){ return obj;}
function getAttrByName(id,attr) {return obj[attr];}
function log(message) {console.log(message);}

parser = new Parser();
parser.setAttribut = function(id, name, currentVal, max) {obj[name] = currentVal; return;}  // Override for test

statblock = "Test%20BUGBEAR%3Cbr%3EMedium%20humanoid%20%28goblinoid%29%2C%20chaotic%20evil%3Cbr%3EArmor%20Class%2016%20%28hide%20armor%2C%20shield%29%3Cbr%3EHit%20Points%2027%20%285d8%20+%205%29%3Cbr%3ESpeed%2040%20ft.%2C%20climb%2040%20ft.%2C%20fly%2080%20ft.%20(hover)%3Cbr%3E%20%20STR%20%20DEX%20%20CON%20%20INT%20%20WIS%20%20CHA%3Cbr%3E%20%2015%20%28+2%29%20%2014%20%28+2%29%20%2013%20%28+1%29%20%208%20%28%u22121%29%20%2011%20%28+0%29%20%209%20%28%u22121%29%3Cbr%3ESaving%20Throws%20Wis%20+2%2C%20Cha%20+4%3Cbr%3ESkills%20Stealth%20+6%2C%20Survival%20+2%2C%20Athletics%20+5%2C%20Perception%20+3%3Cbr%3EDamage%20Resistances%20acid%2C%20fire%2C%20lightning%2C%20thunder%3B%20bludgeoning%2C%20%3Cbr%3Epiercing%2C%20and%20slashing%20from%20nonmagical%20weapons%3Cbr%3EDamage%20Immunities%20cold%2C%20necrotic%2C%20poison%3Cbr%3ECondition%20Immunities%20charmed%2C%20exhaustion%2C%20frightened%2C%20%3Cbr%3Egrappled%2C%20paralyzed%2C%20petrified%2C%20poisoned%2C%20prone%2C%20restrained%3Cbr%3EDamage%20Vulnerabilities%20fire%3Cbr%3ESenses%20darkvision%2060%20ft.%2C%20passive%20Perception%2010%3Cbr%3ELanguages%20Common%2C%20Goblin%3Cbr%3EChallenge%201%20%281%2C200%20XP%29%3Cbr%3EBrute.%20A%20melee%20weapon%20deals%20one%20extra%20die%20of%20its%20damage%20when%20the%20%3Cbr%3Ebugbear%20hits%20with%20it%20%28included%20in%20the%20attack%29.%3Cbr%3ESurprise%20Attack.%20If%20the%20bugbear%20surprises%20a%20creature%20and%20hits%20it%20%3Cbr%3Ewith%20an%20attack%20during%20the%20first%20round%20of%20combat%2C%20the%20target%20takes%20%3Cbr%3Ean%20extra%207%20%282d6%29%20damage%20from%20the%20attack.%3Cbr%3EActions%3Cbr%3EMorningstar.%20Melee%20Weapon%20Attack%3A%20+4%20to%20hit%2C%20reach%205%20ft.%2C%20one%20%3Cbr%3Etarget.%20Hit%3A%2011%20%282d8%20+%202%29%20piercing%20damage.%3Cbr%3EJavelin.%20Melee%20or%20Ranged%20Weapon%20Attack%3A%20+4%20to%20hit%2C%20reach%205%20ft.%20or%20%3Cbr%3Erange%2030/120%20ft.%2C%20one%20target.%20Hit%3A%209%20%282d6%20+%202%29%20piercing%20damage%20%3Cbr%3Ein%20melee%20or%205%20%281d6%20+%202%29%20piercing%20damage%20at%20range.%3Cbr%3Ebio%3Cbr%3EBugbears%20are%20hairy%20goblinoids%20born%20for%20battle%20and%20%3Cbr%3Emayhem.%20They%20survive%20by%20raiding%20and%20hunting%2C%20but%20are%20%3Cbr%3Efond%20of%20setting%20ambushes%20and%20fleeing%20when%20outmatched.%3Cbr%3E%3Cbr%3E";
parser.parse(statblock);