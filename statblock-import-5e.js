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

    var command = msg.content.split(" ", 1);

    if (command != "!build-monster") {
        return;
    }
    
    if (!msg.selected) {
        sendChat("GM", "No token selected");
        return;
    }

    var token = getObj("graphic", msg.selected[0]._id);
    if (token.get("subtype") != 'token') {
        sendChat("GM", "No token selected");
        return;
    }

    var statblock = token.get('gmnotes');

    var parser = new Parser();
    parser.parse(statblock);
    sendChat('GM', "Character created or updated");
});

function splitRegex(source, regex)
{
    var precedentKey = 'debut';
    var precedentIndex = 0;
    var debut = 0;
    var section = {};

    while(match = regex.exec(source))
    {
        section[precedentKey] = source.substring(debut, match.index).trim();
        precedentKey = match[1].toLowerCase();
        debut = match.index + precedentKey.length + 2;
    }    
    section[precedentKey] = source.substring(debut).trim();
    return section;
}

var Parser = function() {
    this.statblock = '';
    this.npc = undefined;
    this.section = {};

    this.parse = function(statblock) {
        
        this.statblock = this.clean(statblock);
        this.section = this.splitSection(this.statblock);

        //log(this.section);

        this.createCharacter();

        if('abilities' in this.section)
            this.parseAbilities(); // Be sure to process abilities first since other attributes need abilities modifier to be know.
        if('armor class' in this.section)
            this.parseArmorClass();
        if('size' in this.section)
            this.parseSize(); 
        if('hit points' in this.section)
            this.parseHp();
        if('speed' in this.section)
            this.parseSpeed();
        if('challenge' in this.section)
            this.parseChallenge();
        if('saving throws' in this.section)
            this.parseSavingThrow();
        if('skills' in this.section)
            this.parseSkills();
        if('traits' in this.section)
            this.parseTraits();
        if('actions' in this.section)
            this.parseActions();

        if('damage immunities' in this.section)
            this.setAttribut(this.npc.id, 'npc_damage_immunity', this.section['damage immunities']);
        if('condition immunities' in this.section)
            this.setAttribut(this.npc.id, 'npc_condition_immunity', this.section['condition immunities']);
        if('damage vulnerabilities' in this.section)
            this.setAttribut(this.npc.id, 'npc_damage_vulnerability', this.section['damage vulnerabilities']);
        if('senses' in this.section)
            this.setAttribut(this.npc.id, 'npc_senses', this.section['senses']);
        if('languages' in this.section)
            this.setAttribut(this.npc.id, 'npc_languages', this.section['languages']);
        if('damage resistances' in this.section)
            this.setAttribut(this.npc.id, 'npc_damage_resistance', this.section['damage resistances']);
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
            "%3F": "?",
            "%u2019" : "'",
            "%u2013" : "-"
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

        var bio;

        // Cherche l'index du début du trait
        var match = statblock.match(/#(?!armor class|hit points|speed|str|dex|con|int|wis|cha|saving throws|skills|damage resistances|damage immunities|condition immunities|damage vulnerabilities|senses|languages|challenge|traits|actions|legendary actions)((?:[A-Z][a-z]+[0-9-\s(\/)]{0,5})+)\./i);
        
        if(match !== null)
        {
            attributes = statblock.substring(0, match.index);
            powers = statblock.substring(match.index);

            if((pos = powers.indexOf('###')) != -1){
                bio = powers.substring(pos).replace(/#{2,}/g, '').replace(/\.#/g,'.\n').replace(/#/g,' ');
                powers = powers.substring(0,pos);
            }
        }    

        // Split les attributs du statblock;
        var regex = /#\s*(armor class|hit points|speed|str|dex|con|int|wis|cha|saving throws|skills|damage resistances|damage immunities|condition immunities|damage vulnerabilities|senses|languages|challenge)(?:\s|#)/gmi;
        var section = splitRegex(attributes, regex);

        _.each(section, function(value, key){
            section[key] = value.replace(/\.#/g,'.\n').replace(/#/g,' ');
        });
      
        //  title, size and abilities
        var pos = statblock.indexOf('#');
        section['title'] =  section['debut'].substring(0, pos);
        section['size'] = section['debut'].substring(pos+1);
        
        var abilitiesName = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        var abilities = '';
        for (i = 0, len = abilitiesName.length; i < len; ++i) {
            if (section[abilitiesName[i]] != undefined) {
                abilities += section[abilitiesName[i]] + ' ';
                delete section[abilitiesName[i]];
            }
        }
        section['abilities'] = abilities;


        // reste du statblock
        var section2 = splitRegex(powers, /#\s*(actions|legendary actions)(?:\s|#)/gmi);
        section2['traits'] = section2['debut'];
        delete section2['debut'];
        
        for (var attrname in section2) { section[attrname] = section2[attrname]; } // Combine le tout.
        section.bio = bio;
        
        //log(section);
        return section;
    }

    this.createCharacter = function() {
        name = capitalizeEachWord(this.section.title);
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

        obj.set({gmnotes: this.statblock.replace(/#/g , '<br />')});
        if('bio' in this.section && this.section.bio != undefined) {
            log(this.section.bio);
            //obj.set({bio: this.section.bio.replace(/#/g , '<br />')});
        }

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
        } 
        else {//log("Trying to set " + name);
            attr.set({
                current: currentVal,
                max: max
            });
        }
    }

    this.parseArmorClass = function() {
        var match = this.section['armor class'].match(/(\d+)\s?(.*)/);
        this.setAttribut(this.npc.id, 'npc_AC', match[1]);
        this.setAttribut(this.npc.id, 'npc_AC_note', match[2]);
    }

    this.parseSize = function() {
        var match = this.section['size'].match(/(.*?) (.*?), (.*)/i);
        this.setAttribut(this.npc.id, 'npc_size', match[1]);
        this.setAttribut(this.npc.id, 'npc_type', match[2]);
        this.setAttribut(this.npc.id, 'npc_alignment', match[3]);
    }

    this.parseHp = function() {
        var match = this.section['hit points'].match(/.*?(\d+)\s+\(((?:\d+)d(?:\d+))/i);
        this.setAttribut(this.npc.id, 'npc_HP', match[1], match[1]);
        this.setAttribut(this.npc.id, 'npc_HP_hit_dice', match[2]);
    }
    
    this.parseSpeed = function() {

        var baseAttr = 'npc_speed';
        var regex = /(|fly|climb|swim|burrow)\s*(\d+)(?:ft\.|\s)+(\(.*\))?/gi;
        while(match = regex.exec(this.section['speed']))
        {
            
            var attrName = baseAttr + (match[1] != '' ? '_' + match[1].toLowerCase(): '');
            var value = match[2];
            if(match[3] != undefined)
                value += ' ' + match[3];

            this.setAttribut(this.npc.id, attrName, value);
        }
    }
    
    this.parseAbilities = function() { 
        var regex = /(\d+)\s*\(/g;
        var match = [];
        while(matches = regex.exec(this.section['abilities'])){
            match.push(matches[1]);
        }
        this.setAttribut(this.npc.id, 'npc_strength', match[0]);
        this.setAttribut(this.npc.id, 'npc_dexterity', match[1]);
        this.setAttribut(this.npc.id, 'npc_constitution', match[2]);
        this.setAttribut(this.npc.id, 'npc_intelligence', match[3]);
        this.setAttribut(this.npc.id, 'npc_wisdom', match[4]);
        this.setAttribut(this.npc.id, 'npc_charisma', match[5]);
    }
    
    this.parseChallenge = function() {
        input = this.section['challenge'].replace(/[, ]/g, '');
        var match = input.match(/(\d+).*?(\d+)/);
        this.setAttribut(this.npc.id, 'npc_challenge', parseInt(match[1]));
        this.setAttribut(this.npc.id, 'npc_xp', parseInt(match[2]));
    }
    
    this.parseSavingThrow = function(){
        var regex = /(STR|DEX|CON|INT|WIS|CHA).*?(\d+)/gi;
        var attr, value;
        while(match = regex.exec(this.section['saving throws'])){            
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
    
    this.parseSkills = function(){

        var skills = {acrobatics: 'dexterity', "animal handling": 'wisdom', arcana: 'intelligence', athletics: 'strength', deception: 'charisma',history: 'intelligence',insigth: 'wisdom',intimidation: 'charisma',investigation: 'intelligence',medecine: 'wisdom',nature: 'intelligence',perception: 'wisdom',performance: 'charisma',persuation: 'charisma',religion: 'intelligence',"sleight of Hand": 'dexterity', stealth: 'dexterity', survival: 'wisdom'};

        input = this.section['skills'].replace(/Skills\s+/i, '');
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
    
    this.parseTraits = function(){
        //var traits = this.parsePower(this.section['traits']);

        var texte = "";

        var traits = splitRegex(this.section['traits'], /#((?:[A-Z][a-z]+[0-9-\s(\/)]{0,5})+)\./g);
        _.each(traits, function(value, key){
            if(value  != '')
                texte += capitalizeEachWord(key) + ': ' + value.replace(/\.#/g,'.\n').replace(/#/g,' ') + '\n';
        });

        texte = texte.slice(0, -1);

        // Add legendary action to traits
        if('legendary actions' in this.section)
        {
            var legendary = splitRegex(this.section['legendary actions'], /#((?:[A-Z][a-z]+[0-9-\s(\/)]{0,5})+)\./g);
            texte += '\n\nLegendary Actions\n' + legendary.debut.replace(/\.#/g,'.\n').replace(/#/g,' ') + '\n';
            delete legendary.debut;

            _.each(legendary, function(value, key){
            if(value  != '')
                texte += capitalizeEachWord(key) + ': ' + value.replace(/#/g,' ') + '\n';
            });
            texte = texte.slice(0, -1);        
        }
        this.setAttribut(this.npc.id, 'npc_traits', texte);
    }
    
    this.parseActions = function(){

        this.section['actions'] = '#' + this.section['actions'];
        var actions = splitRegex(this.section['actions'], /#((?:[A-Z][a-z]+[0-9-\s(\/)]{0,5})+)\./g);
        var cpt = 1;

        _.each(actions, function(value, key){
            if(value  == '') return;

            if(key == 'multiattack') {
                this.setAttribut(this.npc.id, 'npc_multiattack', value.replace(/\.#/g,'.\n').replace(/#/g,' '));
                return;
            }

            this.setAttribut(this.npc.id, 'npc_action_name' + cpt, capitalizeEachWord(key));
            var pos = value.indexOf('Hit:');
            if(pos != -1) {
                this.setAttribut(this.npc.id, 'npc_action_description' + cpt, value.substring(0, pos).replace(/\.#/g,'.\n').replace(/#/g,' '));
                this.setAttribut(this.npc.id, 'npc_action_effect' + cpt, value.substring(pos).replace(/\.#/g,'.\n').replace(/#/g,' '));
            }
            else {
                this.setAttribut(this.npc.id, 'npc_action_description' + cpt, value.replace(/\.#/g,'.\n').replace(/#/g,' '));
            }
            
            cpt++;
        }, this);
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
statblock = "Adult%20Red%20Dragon%3Cbr%3EHuge%20dragon%2C%20chaotic%20evil%3Cbr%3EArmor%20Class%2019%20%28natural%20armor%29%3Cbr%3EHit%20Points%20256%20%2819d12%20+%20133%29%3Cbr%3ESpeed%2040%20ft.%2C%20climb%2040%20ft.%2C%20fly%2080%20ft.%3Cbr%3E%20%20STR%20%20DEX%20%20CON%20%20INT%20%20WIS%20%20CHA%3Cbr%3E%20%2027%20%28+8%29%20%2010%20%28+0%29%20%2025%20%28+7%29%20%2016%20%28+3%29%20%2013%20%28+1%29%20%2021%20%28+5%29%3Cbr%3ESaving%20Throws%20Dex%20+6%2C%20Con%20+13%2C%20Wis%20+7%2C%20Cha%20+11%3Cbr%3ESkills%20Perception%20+13%2C%20Stealth%20+6%3Cbr%3EDamage%20Immunities%20fire%3Cbr%3ESenses%20blindsight%2060%20ft.%2C%20darkvision%20120%20ft.%2C%20passive%20Perception%2023%3Cbr%3ELanguages%20Common%2C%20Draconic%3Cbr%3EChallenge%2017%20%2818%2C000%20XP%29%3Cbr%3ELegendary%20Resistance%20%283/Day%29.%20If%20the%20dragon%20fails%20a%20saving%20%3Cbr%3Ethrow%2C%20it%20can%20choose%20to%20succeed%20instead.%3Cbr%3EActions%3Cbr%3EMultiattack.%20The%20dragon%20can%20use%20its%20Frightful%20Presence.%20It%20then%20%3Cbr%3Emakes%20three%20attacks%3A%20one%20with%20its%20bite%20and%20two%20with%20its%20claws.%3Cbr%3EBite.%20Melee%20Weapon%20Attack%3A%20+14%20to%20hit%2C%20reach%2010%20ft.%2C%20one%20target.%20%3Cbr%3EHit%3A%2019%20%282d10%20+%208%29%20piercing%20damage%20plus%207%20%282d6%29%20fire%20damage.%3Cbr%3EClaw.%20Melee%20Weapon%20Attack%3A%20+14%20to%20hit%2C%20reach%205%20ft.%2C%20one%20target.%20%3Cbr%3EHit%3A%2015%20%282d6%20+%208%29%20slashing%20damage.%3Cbr%3ETail.%20Melee%20Weapon%20Attack%3A%20+14%20to%20hit%2C%20reach%2015%20ft.%2C%20one%20target.%20%3Cbr%3EHit%3A%2017%20%282d8%20+%208%29%20bludgeoning%20damage.%3Cbr%3EFrightful%20Presence.%20Each%20creature%20of%20the%20dragon%u2019s%20choice%20that%20%3Cbr%3Eis%20within%20120%20feet%20of%20the%20dragon%20and%20aware%20of%20it%20must%20succeed%20%3Cbr%3Eon%20a%20DC%2019%20Wisdom%20saving%20throw%20or%20become%20frightened%20for%201%20%3Cbr%3Eminute.%20A%20creature%20can%20repeat%20the%20saving%20throw%20at%20the%20end%20of%20%3Cbr%3Eeach%20of%20its%20turns%2C%20ending%20the%20effect%20on%20itself%20on%20a%20success.%20If%20a%20%3Cbr%3Ecreature%u2019s%20saving%20throw%20is%20successful%20or%20the%20effect%20ends%20for%20it%2C%20%3Cbr%3Ethe%20creature%20is%20immune%20to%20the%20dragon%u2019s%20Frightful%20Presence%20for%20%3Cbr%3Ethe%20next%2024%20hours.%3Cbr%3EFire%20Breath%20%28Recharge%205%u20136%29.%20The%20dragon%20exhales%20fire%20in%20a%2060-foot%20%3Cbr%3Econe.%20Each%20creature%20in%20that%20area%20must%20make%20a%20DC%2021%20Dexterity%20%3Cbr%3Esaving%20throw%2C%20taking%2063%20%2818d6%29%20fire%20damage%20on%20a%20failed%20save%2C%20or%20%3Cbr%3Ehalf%20as%20much%20damage%20on%20a%20successful%20one.%3Cbr%3ELegendary%20Actions%3Cbr%3EThe%20dragon%20can%20take%203%20legendary%20actions%2C%20choosing%20from%20the%20%3Cbr%3Eoptions%20below.%20Only%20one%20legendary%20action%20option%20can%20be%20used%20%3Cbr%3Eat%20a%20time%20and%20only%20at%20the%20end%20of%20another%20creature%u2019s%20turn.%20The%20%3Cbr%3Edragon%20regains%20spent%20legendary%20actions%20at%20the%20start%20of%20its%20turn.%3Cbr%3EDetect.%20The%20dragon%20makes%20a%20Wisdom%20%28Perception%29%20check.%3Cbr%3ETail%20Attack.%20The%20dragon%20makes%20a%20tail%20attack.%3Cbr%3EWing%20Attack%20%28Costs%202%20Actions%29.%20The%20dragon%20beats%20its%20wings.%20%3Cbr%3EEach%20creature%20within%2010%20feet%20of%20the%20dragon%20must%20succeed%20%3Cbr%3Eon%20a%20DC%2022%20Dexterity%20saving%20throw%20or%20take%2015%20%282d6%20+%208%29%20%3Cbr%3Ebludgeoning%20damage%20and%20be%20knocked%20prone.%20The%20dragon%20can%20%3Cbr%3Ethen%20fly%20up%20to%20half%20its%20flying%20speed.%3Cbr%3E%3CbrThe%20odor%20of%20sulfur%20and%20pumice%20surrounds%20a%20red%20dragon%2C%20%3Cbr%3Ewhose%20swept-back%20horns%20and%20spinal%20frill%20define%20its%20%3Cbr%3Esilhouette.%20Its%20beaked%20snout%20vents%20smoke%20at%20all%20times%2C%20%3Cbr%3Eand%20its%20eyes%20dance%20with%20flame%20when%20it%20is%20angry.%3Cbr%3E%3Cbr%3E";
parser.parse(statblock);

//log(obj);