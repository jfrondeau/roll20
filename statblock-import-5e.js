(function (jf, undefined){
    
    var status = 'created';

    jf.whisperTraitsToGm = true;

    jf.statblock = {
        version: 1,
        RegisterHandlers: function () {
            on('chat:message', HandleInput);
            log("JF Statblock ready");
        }
    }

    jf.capitalizeEachWord = function(str) {
        return str.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    };

    jf.parse = function(statblock){

        //Clean text       
        statblock = unescape(statblock).replace(/<br[^>]*>/g, '#').replace(/(<([^>]+)>)/ig,"").replace('–', '-');

        section = splitSection(statblock);
        var statut = 'created';

        monster = jf.getCharacter(section.title, statblock.replace(/#/g, '<br>'), section.bio);

        if('abilities' in section) parseAbilities(); // Be sure to process abilities first since other attributes need abilities modifier to be know.
        if('armor class' in section) parseArmorClass();
        if('size' in section) parseSize(); 
        if('hit points' in section) parseHp();
        if('speed' in section) parseSpeed();
        if('challenge' in section) parseChallenge();
        if('saving throws' in section) parseSavingThrow();
        if('skills' in section) parseSkills();
        
        if('traits' in section) parseTraits();
        if('actions' in section) parseActions();

        if('damage immunities' in section) jf.setAttribut(monster.id, 'npc_damage_immunity', section['damage immunities']);
        if('condition immunities' in section) jf.setAttribut(monster.id, 'npc_condition_immunity', section['condition immunities']);
        if('damage vulnerabilities' in section) jf.setAttribut(monster.id, 'npc_damage_vulnerability', section['damage vulnerabilities']);
        if('senses' in section) jf.setAttribut(monster.id, 'npc_senses', section['senses']);
        if('languages' in section) jf.setAttribut(monster.id, 'npc_languages', section['languages']);
        if('damage resistances' in section) jf.setAttribut(monster.id, 'npc_damage_resistance', section['damage resistances']);
        
        
        message = 'Character ' + status;
        log(message);
        sendChat('GM', message);
    
        return monster;
    }

    jf.getCharacter = function(name, gmnotes, bio) {

        name = jf.capitalizeEachWord(name);

        var obj = findObjs({_type: "character", name: name});

        if (obj.length == 0) {
            obj = jf.fixedCreateObj('character', {
                name: name
            });
        } else {
            obj = getObj('character', obj[0].id);
            status = 'updated';
        }

        if(gmnotes != undefined)
            obj.set({gmnotes: gmnotes});

        if(bio != undefined)
            obj.set({bio: bio});
        
        jf.setAttribut(obj.id, 'is_npc', 1);
        return obj;
    };

    jf.setAttribut = function(id, name, currentVal, max) {
        max = max || '';
        
        if(currentVal == undefined){
            log("Error setting empty value: " + name);
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
    };

    jf.fixedCreateObj = jf.fixedCreateObj || function() {
        var obj = createObj.apply(this, arguments);
        if (obj && !obj.fbpath) {
            obj.fbpath = obj.changed._fbpath.replace(/([^\/]*\/){4}/, "/");
        }
        return obj;
    };

    jf.RegisterEventHandlers = function(){
        
        
    }

    function HandleInput(msg){
        if (msg.type !== "api") {
            return;
        }

        if(msg.content != '!build-monster')
            return;

        if (!msg.selected) {
            sendChat("GM", "No token selected");
            return;
        }

        var token = getObj("graphic", msg.selected[0]._id);
        if (token.get("subtype") != 'token') {
            sendChat("GM", "No token selected");
            return;
        }

        return jf.parse(token.get('gmnotes'));
    }


    function splitRegex(source, regex){
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

        if(section.debut == '') delete section.debut;

        return section;
    };

    function splitSection(statblock){
        var sectionTraits;
        var bio;

        // Check for bio (flavor texte) at the end, separated by at least 3 line break.
        if((pos = statblock.indexOf('###')) != -1){
            bio = statblock.substring(pos + 3);
            statblock = statblock.slice(0,pos);
        }

        // Looking for index of Traits section
        var match = statblock.match(/#(?!armor class|hit points|speed|str|dex|con|int|wis|cha|saving throws|skills|damage resistances|damage immunities|condition immunities|damage vulnerabilities|senses|languages|challenge|traits|actions|legendary actions)((?:[A-Z][a-z]+[0-9-\s(\/)]{0,5})+)\./i); 
        if(null == match) {
            match = statblock.indexOf('/#actions/gi');
            if(null == match)
            {
                log("Warning: no traits ans Actions found...")
            }
            sectionTraits = statblock.slice(match.index);
            statblock = statblock.slice(0, match.index);
        }
        if(null != match) {
            sectionTraits = statblock.slice(match.index);
            statblock = statblock.slice(0, match.index);
        }

        // Split statblock attributes
        var regex = /#\s*(armor class|hit points|speed|str|dex|con|int|wis|cha|saving throws|skills|damage resistances|damage immunities|condition immunities|damage vulnerabilities|senses|languages|challenge)(?:\s|#)/gmi;
        var section = splitRegex(statblock, regex);

        //  add title and size
        var pos = section.debut.indexOf('#');
        if(pos != -1){
            section.title = section.debut.slice(0, pos);
            section.size = section.debut.slice(pos);
        }
        else
            section.title = section.debut;
        delete section.debut;

        if(bio != undefined)
            section.bio = bio;

        // regroup abilities
        var abilitiesName = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        var abilities = '';
        for (i = 0, len = abilitiesName.length; i < len; ++i) {
            if (section[abilitiesName[i]] != undefined) {
                abilities += section[abilitiesName[i]] + ' ';
                delete section[abilitiesName[i]];
            }
        }
        section.abilities = abilities;

        // Clean section
        _.each(section, function(value, key){
            section[key] = value.replace(/\.#/g,'.\n').replace(/#/g,'');
        });

        // Split rest of statblock as trait, action and legendary action. 
        if(sectionTraits != undefined) {
            var traits = splitRegex(sectionTraits, /#\s*(actions|legendary actions)(?:\s|#)/gmi);
            traits['traits'] = traits['debut'];
            delete traits['debut'];

            if(traits.actions == undefined){
                traits.actions = traits.traits;
                delete traits.traits;
            }

            // Combine traits to section1
            for (var attrname in traits) { 
                section[attrname] = traits[attrname]; 
            }
        }
        return section;
    };


    function parseAbilities(){
        var regex = /(\d+)\s*\(/g;
        var match = [];
        while(matches = regex.exec(section['abilities'])){
            match.push(matches[1]);
        }
        jf.setAttribut(monster.id, 'npc_strength', match[0]);
        jf.setAttribut(monster.id, 'npc_dexterity', match[1]);
        jf.setAttribut(monster.id, 'npc_constitution', match[2]);
        jf.setAttribut(monster.id, 'npc_intelligence', match[3]);
        jf.setAttribut(monster.id, 'npc_wisdom', match[4]);
        jf.setAttribut(monster.id, 'npc_charisma', match[5]);
    }

    function parseArmorClass(){
        var match = section['armor class'].match(/(\d+)\s?(.*)/);
        jf.setAttribut(monster.id, 'npc_AC', match[1]);
        jf.setAttribut(monster.id, 'npc_AC_note', match[2]);
    }

    function parseSize() {
        var match = section['size'].match(/(.*?) (.*?), (.*)/i);
        jf.setAttribut(monster.id, 'npc_size', match[1]);
        jf.setAttribut(monster.id, 'npc_type', match[2]);
        jf.setAttribut(monster.id, 'npc_alignment', match[3]);
    }

    function parseHp() {
        var match = section['hit points'].match(/.*?(\d+)\s+\(((?:\d+)d(?:\d+))/i);
        jf.setAttribut(monster.id, 'npc_HP', match[1], match[1]);
        jf.setAttribut(monster.id, 'npc_HP_hit_dice', match[2]);
    }
    
    function parseSpeed(){
        var baseAttr = 'npc_speed';
        var regex = /(|fly|climb|swim|burrow)\s*(\d+)(?:ft\.|\s)+(\(.*\))?/gi;
        while(match = regex.exec(section['speed']))
        {
            
            var attrName = baseAttr + (match[1] != '' ? '_' + match[1].toLowerCase(): '');
            var value = match[2];
            if(match[3] != undefined)
                value += ' ' + match[3];

            jf.setAttribut(monster.id, attrName, value);
        }
    }

    function parseChallenge(){
        input = section['challenge'].replace(/[, ]/g, '');
        var match = input.match(/([\d/]+).*?(\d+)/);
        jf.setAttribut(monster.id, 'npc_challenge', match[1]);
        jf.setAttribut(monster.id, 'npc_xp', parseInt(match[2]));
    }

    function parseSavingThrow(){
        var regex = /(STR|DEX|CON|INT|WIS|CHA).*?(\d+)/gi;
        var attr, value;
        while(match = regex.exec(section['saving throws'])){            
            switch(match[1].toLowerCase())
            {
                case 'str': attr = 'npc_strength'; break;
                case 'dex': attr = 'npc_dexterity'; break;
                case 'con': attr = 'npc_constitution'; break;
                case 'int': attr = 'npc_intelligence'; break;
                case 'wis': attr = 'npc_wisdom'; break;
                case 'cha': attr = 'npc_charisma'; break;
            }
            jf.setAttribut(monster.id, attr + '_save_bonus', match[2] - Math.floor((getAttrByName(monster.id,attr)-10)/2));
        }
    }

    function parseSkills(){
        var skills = {acrobatics: 'dexterity', "animal handling": 'wisdom', arcana: 'intelligence', athletics: 'strength', deception: 'charisma',history: 'intelligence',insigth: 'wisdom',intimidation: 'charisma',investigation: 'intelligence',medecine: 'wisdom',nature: 'intelligence',perception: 'wisdom',performance: 'charisma',persuation: 'charisma',religion: 'intelligence',"sleight of Hand": 'dexterity', stealth: 'dexterity', survival: 'wisdom'};
        input = section['skills'].replace(/Skills\s+/i, '');
        var regex = /(\w+).*?(\d+)/gi;
        while(match = regex.exec(input)){
            var skill = match[1].toLowerCase();
            var abilitymod = skills[skill];
            var attr = 'npc_' + skill.replace(' ','') + '_bonus';
            //var tmp = Math.floor((getAttrByName(monster.id,'npc_'+ abilitymod)-10)/2);
            //log(abilitymod + " = " + tmp);
            jf.setAttribut(monster.id, attr, match[2] - Math.floor((getAttrByName(monster.id,'npc_'+ abilitymod)-10)/2));
        }
    }

    function parseTraits(){
        var texte = "";
        var traits = splitRegex(section['traits'], /#([A-Z].*?)\./g);

        _.each(traits, function(value, key){
            texte += jf.capitalizeEachWord(key) + ': ' + value.replace(/\.#/g,'.\n').replace(/#/g,' ') + '\n';
        });
        texte = texte.slice(0, -1);

        // Add legendary action to traits
        if('legendary actions' in section)
        {
            var legendary = splitRegex(section['legendary actions'], /#((?:[A-Z][a-z]+[0-9-\s(\/)]{0,5})+)\./g);
            texte += '\n\nLegendary Actions\n' + legendary.debut.replace(/\.#/g,'.\n').replace(/#/g,' ') + '\n';
            delete legendary.debut;

            _.each(legendary, function(value, key){
            if(value  != '')
                texte += jf.capitalizeEachWord(key) + ': ' + value.replace(/#/g,' ') + '\n';
            });
            texte = texte.slice(0, -1);        
        }

        if(jf.whisperTraitsToGm == true)
            texte = texte.replace(/\n/g, '\n/w GM ');

        jf.setAttribut(monster.id, 'npc_traits', texte);
    }

    function parseActions(){
        if(section.actions.indexOf('#')!==0)
            section.actions = '#' + section.actions;

        log(section['actions']);
        log('--');
        
        var actions = splitRegex(section['actions'], /#((?:[A-Z][a-z]+[0-9-\s(\/)]{0,5})+)\./g);
        var cpt = 1;

        _.each(actions, function(value, key){

            if(value  == '') return;

            if(key == 'multiattack') {
                jf.setAttribut(monster.id, 'npc_multiattack', value.replace(/\.#/g,'.\n').replace(/#/g,' '));
                return;
            }

            log(key + ': ' + value);

            jf.setAttribut(monster.id, 'npc_action_name' + cpt, jf.capitalizeEachWord(key));
            //var pos = value.indexOf('Hit:');
            var match = value.match(/(Each|Hit:)/);
            if(match != null) {
                texte = value.substring(0, match.index).replace(/\.#/g,'.\n').replace(/#/g,'').trim();
                texte = texte.replace(/(\+(\d+))/g, '$1 : [[1d20+$2]]|[[1d20+$2]]');
                jf.setAttribut(monster.id, 'npc_action_description' + cpt, texte);

                texte = value.substring(match.index).replace(/\.#/g,'.\n').replace(/#/g,'').trim();
                texte = texte.replace(/(\d+d\d+[\d\s+]*)/g, '[[$1]]')
                jf.setAttribut(monster.id, 'npc_action_effect' + cpt, texte);

            }
            else {
                texte = value.replace(/\.#/g,'.\n').replace(/#/g,'').trim();
                texte = texte.replace(/(\+(\d+))/g, '$1 : [[1d20+$2]]|[[1d20+$2]]');
                jf.setAttribut(monster.id, 'npc_action_description' + cpt, texte);
            }
            
            cpt++;
        }, this);
    }   

}(typeof jf === 'undefined' ? jf = {} : jf));

on("ready",function(){
    'use strict';

    jf.statblock.RegisterHandlers();
});


//jf.whisperTraitsToGm = false; //Default to true. If true, the traits information will be prefixed with /w GM so only GM will see Traits in chat windows.