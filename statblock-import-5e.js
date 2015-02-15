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
        if('bio' in this.section)
            obj.set({bio: this.section.bio.replace(/#/g , '<br />')});

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
