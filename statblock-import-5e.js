
(function(jf, undefined) {
    jf.whisperTraitsToGm = true;
    jf.createAbilityAsToken = true;
    jf.usePowerAbility = false;

    jf.statblock = {
        version: "1.6",
        RegisterHandlers: function() {
            on('chat:message', HandleInput);
            log("JF Statblock ready");
        }
    }

    var status = '';
    var errors = [];

    function HandleInput(msg) {

        if(msg.type !== "api") {
            return;
        }

        args = msg.content.split(/\s+/);

        switch(args[0]) {
            case '!build-monster':
            case '!jf-parse':
                jf.getSelectedToken(msg, jf.ImportStatblock);
                break;
        }
    }

    jf.getSelectedToken = jf.getSelectedToken || function(msg, callback, limit) {
        try {
            if(msg.selected == undefined || msg.selected.length == undefined)
                throw 'No token selected';

            limit = parseInt(limit, 10) | 0;

            if(limit == undefined || limit > msg.selected.length + 1 || limit < 1)
                limit = msg.selected.length;

            for(i = 0; i < limit; i++) {
                if(msg.selected[i]._type == 'graphic') {
                    var obj = getObj('graphic', msg.selected[i]._id);
                    if(obj !== undefined && obj.get('subtype') == 'token') {
                        callback(obj);
                    }
                }
            }
        } catch(e) {
            log('Exception: ' + e);
        }
    }

    jf.capitalizeEachWord = function(str) {
        return str.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    jf.fixedCreateObj = jf.fixedCreateObj || function() {
        //Aaron fix
        var obj = createObj.apply(this, arguments);
        if(obj && !obj.fbpath) {
            obj.fbpath = obj.changed._fbpath.replace(/([^\/]*\/){4}/, "/");
        }
        return obj;
    }

    jf.getCharacter = function(name, gmnotes, bio) {
        if(name == undefined)
            throw("Impossible to create or update character if name not found");

        name = jf.capitalizeEachWord(name);

        var obj = findObjs({
            _type: "character",
            name: name
        });

        if(obj.length == 0) {
            obj = jf.fixedCreateObj('character', {
                name: name
            });
            status = 'Character ' + name + ' created';
        } else {
            obj = getObj('character', obj[0].id);
            status = 'Character ' + name + ' updated';
        }

        if(obj == undefined)
            throw("Something prevent script to create or find character " + name);

        if(gmnotes != undefined)
            obj.set({
                gmnotes: gmnotes
            });

        if(bio != undefined)
            obj.set({
                bio: bio
            });

        jf.setAttribut(obj.id, 'is_npc', 1);

        return obj;
    }

    jf.setAttribut = function(id, name, currentVal, max) {

        if(name == undefined)
            throw("Name required to set attribut");

        max = max || '';

        if(currentVal == undefined) {
            log("Error setting empty value: " + name);
            return;
        }

        var attr = findObjs({
            _type: 'attribute',
            _characterid: id,
            name: name
        })[0];

        if(attr == undefined) {
            log("Creating attribut " + name);
            createObj('attribute', {
                name: name,
                current: currentVal,
                max: max,
                characterid: id
            });
        } 
        else {             
            if(attr.get('current') == undefined || attr.get('current').toString() != currentVal) {
                log("Updating attribut " + name);
                attr.set({
                    current: currentVal,
                    max: max
                });
            }
        }
    }

    jf.setAbility = function(id, name, description, action, istokenaction) {
        if(name == undefined)
            throw("Name required to set ability");

        var obj = findObjs({
            _type: "ability",
            _characterid: id,
            name: name
        });
        
        if(obj == undefined)
            throw("Something prevent script to create or find ability " + name);
        
        if(obj.length == 0) {
            obj = jf.fixedCreateObj('ability', {
                _characterid: id,
                name: name,
                description: description,
                action: action,
                istokenaction: istokenaction
            });
            log("Ability " + name + " created");
        } 
        else {
            obj = getObj('ability', obj[0].id);
            if(obj.get('description') != description || obj.get('action') !== action || obj.get('istokenaction')!=istokenaction){
                obj.set({
                    description: description,
                    action: action,
                    istokenaction: istokenaction
                });
                log("Ability " + name + " updated");
            }
        }
    }

    jf.getAttribut = function(id, name) {
        if(name == undefined)
            throw("undefined attribute name to get");

        var attr = findObjs({
            _type: 'attribute',
            _characterid: id,
            name: name
        })[0];
        return attr != undefined ? attr.get('current') : false;
    }

    jf.ImportStatblock = function(token) {
        status = 'Nothing modified';
        errors = [];

        try {
            var statblock = token.get('gmnotes').trim();

            if(statblock == '')
                throw("This token GM Notes was empty.");

            var id = jf.parseStatblock(statblock);
            token.set("represents", id);
        } catch(e) {
            status = "Parsing was incomplete due to error(s)";
            errors.push(e);
        }

        log(status);
        sendChat('GM', '/w GM ' + status);

        if(errors.length > 0) {
            log(errors);
            sendChat('GM', '/w GM Error(s):\n/w GM ' + errors.join('\n/w GM '));
        }
    }


    jf.parseStatblock = function(statblock) {
        log("+++++ Parsing statblock ++++++");
        //Clean text     
        statblock = unescape(statblock);
        statblock = statblock.replace(/–/g, '-');
        statblock = statblock.replace(/<br[^>]*>/g, '#').replace(/(<([^>]+)>)/ig, ""); 
        statblock = statblock.replace(/#\s+/g, '#');
        statblock = statblock.replace(/#(?=[^A-Z1-9])/g, '');
        statblock = statblock.replace(/[#\s]+$/g, '');
        statblock = statblock.replace(/\s+/g, ' ');
        section = splitSection(statblock);

        var monster = jf.getCharacter(section.title, statblock.replace(/#/g, '<br>'), section.bio);
        var id = monster.id;

        if('abilities' in section) parseAbilities(id); // Be sure to process abilities first since other attributes need abilities modifier to be know.
        if('armor class' in section) parseArmorClass(id);
        if('size' in section) parseSize(id);
        if('hit points' in section) parseHp(id);
        if('speed' in section) parseSpeed(id);
        if('challenge' in section) parseChallenge(id);
        if('saving throws' in section) parseSavingThrow(id);
        if('skills' in section) parseSkills(id);

        if('damage immunities' in section) jf.setAttribut(id, 'npc_damage_immunity', section['damage immunities']);
        if('condition immunities' in section) jf.setAttribut(id, 'npc_condition_immunity', section['condition immunities']);
        if('damage vulnerabilities' in section) jf.setAttribut(id, 'npc_damage_vulnerability', section['damage vulnerabilities']);
        if('senses' in section) jf.setAttribut(id, 'npc_senses', section['senses']);
        if('languages' in section) jf.setAttribut(id, 'npc_languages', section['languages']);
        if('damage resistances' in section) jf.setAttribut(id, 'npc_damage_resistance', section['damage resistances']);


        if('traits' in section) parseTraits(id);
        if('actions' in section) parseActions(id);

        return id;
    }

    function splitRegex(source, regex) {
        var precedentKey = 'debut';
        var precedentIndex = 0;
        var debut = 0;
        var section = {};

        while(match = regex.exec(source)) {
            section[precedentKey] = source.substring(debut, match.index).trim();
            precedentKey = match[1].toLowerCase();
            debut = match.index + precedentKey.length + 2;
        }
        section[precedentKey] = source.substring(debut).trim();

        if(section.debut == '') delete section.debut;

        return section;
    }

    function splitSection(statblock) {
        var sectionTraits;
        var bio;

        // Check for bio (flavor texte) at the end, separated by at least 3 line break.
        if((pos = statblock.indexOf('###')) != -1) {
            bio = statblock.substring(pos + 3);
            statblock = statblock.slice(0, pos);
        }

        // Looking for index of Traits section
        var match = statblock.match(/#(?!armor class|hit points|speed|str|dex|con|int|wis|cha|saving throws|skills|damage resistances|damage immunities|condition immunities|damage vulnerabilities|senses|languages|challenge|traits|actions|legendary actions)((?:[A-Z][a-z]+[0-9-\s(\/)]{0,5})+)\./i);
        if(null == match) {
            match = statblock.indexOf('/#actions/gi');
            if(null == match) {
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
        if(pos != -1) {
            section.title = section.debut.slice(0, pos);
            section.size = section.debut.slice(pos);
        } else
            section.title = section.debut;
        delete section.debut;

        if(bio != undefined)
            section.bio = bio;

        // regroup abilities
        var abilitiesName = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        var abilities = '';
        for(i = 0, len = abilitiesName.length; i < len; ++i) {
            if(section[abilitiesName[i]] != undefined) {
                abilities += section[abilitiesName[i]] + ' ';
                delete section[abilitiesName[i]];
            }
        }
        section.abilities = abilities;

        // Clean section
        _.each(section, function(value, key) {
            section[key] = value.replace(/\.#/g, '.\n').replace(/#/g, '');
        });

        // Split rest of statblock as trait, action and legendary action. 
        if(sectionTraits != undefined) {
            var traits = splitRegex(sectionTraits, /#\s*(actions|legendary actions)(?:\s|#)/gmi);
            traits['traits'] = traits['debut'];
            delete traits['debut'];

            if(traits.actions == undefined) {
                traits.actions = traits.traits;
                delete traits.traits;
            }

            // Combine traits to section1
            for(var attrname in traits) {
                section[attrname] = traits[attrname];
            }
        }
        return section;
    }

    function parseAbilities(id) {
        var regex = /(\d+)\s*\(/g;
        var match = [];
        
        while(matches = regex.exec(section['abilities'])) {
            match.push(matches[1]);
        }
        
        jf.setAttribut(id, 'npc_strength', match[0]);
        jf.setAttribut(id, 'npc_dexterity', match[1]);
        jf.setAttribut(id, 'npc_constitution', match[2]);
        jf.setAttribut(id, 'npc_intelligence', match[3]);
        jf.setAttribut(id, 'npc_wisdom', match[4]);
        jf.setAttribut(id, 'npc_charisma', match[5]);
    }

    function parseArmorClass(id) {
        var match = section['armor class'].match(/(\d+)\s?(.*)/);
        jf.setAttribut(id, 'npc_AC', match[1]);
        jf.setAttribut(id, 'npc_AC_note', match[2]);
    }

    function parseSize(id) {
        var match = section['size'].match(/(.*?) (.*?), (.*)/i);
        jf.setAttribut(id, 'npc_size', match[1]);
        jf.setAttribut(id, 'npc_type', match[2]);
        jf.setAttribut(id, 'npc_alignment', match[3]);
    }

    function parseHp(id) {
        var match = section['hit points'].match(/.*?(\d+)\s+\(((?:\d+)d(?:\d+))/i);
        jf.setAttribut(id, 'npc_HP', match[1], match[1]);
        jf.setAttribut(id, 'npc_HP_hit_dice', match[2]);
    }

    function parseSpeed(id) {
        var baseAttr = 'npc_speed';
        var regex = /(|fly|climb|swim|burrow)\s*(\d+)(?:ft\.|\s)+(\(.*\))?/gi;
        while(match = regex.exec(section['speed'])) {

            var attrName = baseAttr + (match[1] != '' ? '_' + match[1].toLowerCase() : '');
            var value = match[2];
            if(match[3] != undefined)
                value += ' ' + match[3];

            jf.setAttribut(id, attrName, value);
        }
    }

    function parseChallenge(id) {
        input = section['challenge'].replace(/[, ]/g, '');
        var match = input.match(/([\d/]+).*?(\d+)/);
        jf.setAttribut(id, 'npc_challenge', match[1]);
        jf.setAttribut(id, 'npc_xp', parseInt(match[2]));
    }

    function parseSavingThrow(id) {
        var regex = /(STR|DEX|CON|INT|WIS|CHA).*?(\d+)/gi;
        var attr, value;
        while(match = regex.exec(section['saving throws'])) {
            switch(match[1].toLowerCase()) {
                case 'str':
                    attr = 'npc_strength';
                    break;
                case 'dex':
                    attr = 'npc_dexterity';
                    break;
                case 'con':
                    attr = 'npc_constitution';
                    break;
                case 'int':
                    attr = 'npc_intelligence';
                    break;
                case 'wis':
                    attr = 'npc_wisdom';
                    break;
                case 'cha':
                    attr = 'npc_charisma';
                    break;
            }
            jf.setAttribut(id, attr + '_save_bonus', match[2] - Math.floor((getAttrByName(id, attr) - 10) / 2));
        }
    }

    function parseSkills(id) {
        var skills = {
            acrobatics: 'dexterity',
            "animal handling": 'wisdom',
            arcana: 'intelligence',
            athletics: 'strength',
            deception: 'charisma',
            history: 'intelligence',
            insight: 'wisdom',
            intimidation: 'charisma',
            investigation: 'intelligence',
            medicine: 'wisdom',
            nature: 'intelligence',
            perception: 'wisdom',
            performance: 'charisma',
            persuasion: 'charisma',
            religion: 'intelligence',
            "sleight of hand": 'dexterity',
            stealth: 'dexterity',
            survival: 'wisdom'
        };

        input = section['skills'].replace(/Skills\s+/i, '');
        var regex = /([\w\s]+).*?(\d+)/gi;
        while(match = regex.exec(input)) {
            var skill = match[1].trim().toLowerCase();
            if(skill in skills) {
                var abilitymod = skills[skill];
                var attr = 'npc_' + skill.replace(' ', '') + '_bonus';
                jf.setAttribut(id, attr, match[2] - Math.floor((getAttrByName(id, 'npc_' + abilitymod) - 10) / 2));
            } else {
                errors.push("Skill " + skill + ' is not a valid skill');
            }
        }
    }

    function parseTraits(id) {
        var texte = "";
        //var traits = splitRegex(section['traits'], /#([A-Z].*?)\./g);
        var traits = splitRegex(section['traits'], /#([A-Z][\w-]+(?:\s[A-Z\(\d][\w-\)]+)*)\./g);

        _.each(traits, function(value, key) {
            texte += jf.capitalizeEachWord(key) + ': ' + value.replace(/\.#/g, '.\n').replace(/#/g, ' ') + '\n';
        });
        texte = texte.slice(0, -1);

        // Add legendary action to traits
        if('legendary actions' in section) {
            var legendary = splitRegex(section['legendary actions'], /#([A-Z][\w-]+(?:\s[A-Z\(\d][\w-\)]+)*)\./g);
            texte += '\n\nLegendary Actions\n' + legendary.debut.replace(/\.#/g, '.\n').replace(/#/g, ' ') + '\n';
            delete legendary.debut;

            _.each(legendary, function(value, key) {
                if(value != '')
                    texte += jf.capitalizeEachWord(key) + ': ' + value.replace(/#/g, ' ') + '\n';
            });
            texte = texte.slice(0, -1);
        }

        if(jf.whisperTraitsToGm == true)
            texte = texte.replace(/\n/g, '\n/w GM ');

        jf.setAttribut(id, 'npc_traits', texte);
    }

    function parseActions(id) {
        if(section.actions.indexOf('#') !== 0)
            section.actions = '#' + section.actions;

        //var actions = splitRegex(section['actions'], /#((?:[A-Z][a-z]+[0-9-\s(\/)]{0,5})+)\./g);
        var actions = splitRegex(section['actions'], /#([A-Z][\w-]+(?:\s[A-Z\(\d][\w-\)]+)*)\./g);
        var cpt = 1;
        var buffer = [];
        var multi = "";

        //MUltiattack
        if('multiattack' in actions) {
            multi = actions.multiattack.replace(/\.#/g, '.\n').replace(/#/g, ' ');
            jf.setAttribut(id, 'npc_multiattack', multi);
            delete actions.multiattack;
        }

        _.each(actions, function(value, key) {
            if(value == '') return;

            var bufferKey = key;
            if((pos = key.indexOf('(')) > 1) {
                bufferKey = key.substring(0, pos - 1);
            }
            buffer[cpt] = bufferKey;

            key = jf.capitalizeEachWord(key);
            jf.setAttribut(id, 'npc_action_name' + cpt, key);

            value = value.replace(/\.#/g, '.\n').replace(/#/g, '');

            var match = value.match(/(Each|Hit:)/);
            if(match != null) {
                texte = value.substring(0, match.index).replace(/(\+(\d+))/g, '$1 : [[1d20+$2]]|[[1d20+$2]]');
                jf.setAttribut(id, 'npc_action_description' + cpt, texte);

                texte = value.substring(match.index).replace(/(\d+d\d+[\d\s+]*)/g, '[[$1]]')
                jf.setAttribut(id, 'npc_action_effect' + cpt, texte);
            } else {
                texte = value.replace(/(\+(\d+))/g, '$1 : [[1d20+$2]]|[[1d20+$2]]');
                jf.setAttribut(id, 'npc_action_description' + cpt, texte);
            }
            
            // Create token action
            if(jf.usePowerAbility)
                jf.setAbility(id, key, "", powercardAbility(id,cpt), jf.createAbilityAsToken);
            else
                jf.setAbility(id, key, "", "%{selected|NPCAction"+cpt+"}", jf.createAbilityAsToken);

            cpt++;
        });

        if(multi != '') {
            var tmp = buffer.join('|').slice(1);
            var regex = new RegExp("(?:(?:(one|two) with its )?(" + tmp + "))", "gi");
            var macro = "";
            
            while(match = regex.exec(multi)) {
                var action = match[2];
                var nb = match[1] || 'one';
                var actionNumber = buffer.indexOf(action.toLowerCase());
                
                if(actionNumber !== -1) {
                    var txt = "%{selected|NPCAction" + actionNumber + "}\n";
                    if(nb == 'one')
                        macro += txt;
                    else
                        macro += txt + txt;
                    delete buffer[actionNumber]; // Remove 
                }
            }
            
            jf.setAttribut(id, 'npc_action_name' + cpt, 'MultiAttack');
            jf.setAttribut(id, 'npc_action_effect' + cpt, macro);
            jf.setAttribut(id, 'npc_action_multiattack' + cpt, "{{npc_showmultiattack=1}} {{npc_multiattack=@{npc_multiattack}}}");

            if(jf.usePowerAbility)
                jf.setAbility(id, 'MultiAttack', "", powercardAbility(id, cpt), jf.createAbilityAsToken);
            else
                jf.setAbility(id, 'MultiAttack', "", "%{selected|NPCAction" + cpt + "}", jf.createAbilityAsToken);
        }
    }

    function powercardAbility(id, npcActionNumber) {
        //From Skilf
        var action_name = jf.getAttribut(id, "npc_action_name" + npcActionNumber);
        var action_desc = jf.getAttribut(id, "npc_action_description" + npcActionNumber);
        var action_effect = jf.getAttribut(id, "npc_action_effect" + npcActionNumber);
        var action_multi = jf.getAttribut(id, "npc_action_multiattack" + npcActionNumber);
        var action_type = jf.getAttribut(id, "npc_action_type" + npcActionNumber);

        if(action_type !== false) {
            action_type = action_type.substring(action_type.indexOf("(") + 1, action_type.lastIndexOf(")")).trim().toLowerCase();
            if(action_type.indexOf(" ") != -1) {
                action_type = action_type.substring(0, action_type.lastIndexOf(" ")).trim();
            }
        } else {
            action_type = "normal";
        }
        if(action_multi !== false) {
            multi_str = " --Multiattack|Yes ";
        } else {
            multi_str = "";
        }

        var attack_type = action_desc.substring(0, action_desc.indexOf(":"));
        var attack_bonus = action_desc.substring(action_desc.indexOf(":") + 1, action_desc.lastIndexOf(":")).trim();
        var attack_desc = action_desc.substring(action_desc.indexOf(","));
        var attack_string = "[[d20" + attack_bonus + "]]|[[d20" + attack_bonus + "]]";

        var hit_value = action_effect.substring(action_effect.indexOf("(") + 1, action_effect.indexOf(")")).trim();
        var hit_desc = action_effect.substring(action_effect.indexOf(")") + 1);

        var powertext = "!power --charid|" + id + " --emote|" + section.title + " uses " + action_name + "  --format|" + action_type + " --name|" + action_name + "  --leftsub|" + action_type + " --rightsub|" + attack_type + multi_str + " --Attack|" + attack_string + " " + attack_desc + " --Hit|" + hit_value + " " + hit_desc;
        if(jf.whisperTraitsToGm == true) {
            powertext = powertext + " --whisper|GM";
        }
        return powertext;
    }

}(typeof jf === 'undefined' ? jf = {} : jf));

on("ready", function() {
    'use strict';
    jf.statblock.RegisterHandlers();
});
