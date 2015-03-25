
(function(jf, undefined) {

    jf.createAbilityAsToken = true;
    jf.monsterAsMinHp = true; // generated token hp can't be lower than the average hp
    jf.rollMonsterHpOnDrop = true; // will roll HP when character are dropped on map

    // Green bar
    jf.parsebar1 = 'npc_passive_perception'; //'npc_HP';
    // Blue bar
    jf.parsebar2 = 'npc_AC'; 
    // Red bar
    jf.parsebar3 = 'npc_HP'; //npc_speed'; 

    jf.statblock = {
        version: "2.2",
        RegisterHandlers: function() {
            on('chat:message', HandleInput);

            if(jf.rollMonsterHpOnDrop == true) {
                on("add:graphic", function(obj) {
                    jf.rollTokenHp(obj);
                });
            }

            log("JF Statblock ready");
        }
    }

    var status = ''; // To display in chat
    var errors = []; // To log error
    var characterId = null;

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
            case '!jf-rollhp':
                return jf.rollHpForSelectedToken(msg);
                break;
        }
    }

    jf.getSelectedToken = jf.getSelectedToken || function(msg, callback, limit) {
        try {
            if(msg.selected == undefined || msg.selected.length == undefined)
                throw('No token selected');

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
            sendChat('GM', '/w GM ' + e);
        }
    }

    jf.rollHpForSelectedToken = function(msg) {
        jf.getSelectedToken(msg, jf.rollTokenHp);
    }

    jf.rollTokenHp = function(token) {
        var number = 0;
        for(i = 1; i < 4; i++){
            if(jf['parsebar'+ i] == 'npc_HP')
            {
                number = i;
                break;
            }
        }
        if(number == 0) {
            throw('One of the jf.parsebar option has to be set to "npc_HP" for random HP roll');
        }
        
        var bar = 'bar' + number;
        var represent = '';
        try {
            if((represent = token.get('represents')) == '')
                throw('Token do not represent character');

            if(token.get(bar + '_link') != "")
                throw('Token ' + bar + ' is linked');

            rollCharacterHp(represent, function(total, original) {
                token.set(bar + '_value', total);
                token.set(bar + '_max', total);
                var message = '/w GM Hp rolled: ' + total;
                if(original > 0)
                    message += ' ajusted from original result of ' + original;
                sendChat('GM', message);
            });
        } catch(e) {
            log('Exception: ' + e);
        }
    }

    function rollCharacterHp(id, callback) {
        var hd = getAttrByName(id, 'npc_HP_hit_dice', 'current');
        if(hd == '')
            throw 'Character has no HP Hit Dice defined';

        var match = hd.match(/^(\d+)d(\d+)$/);
        if(match == null || match[1] == undefined || match[2] == undefined) {
            throw 'Character dont have valid HP Hit Dice format';
        }

        var nb_dice = parseInt(match[1], 10);
        var nb_face = parseInt(match[2], 10)
        var total = 0;
        var original = 0;

        sendChat("GM", "/roll " + hd, function(ops) {
            var rollResult = JSON.parse(ops[0].content);
            if(_.has(rollResult, 'total')) {
                total = rollResult.total;

                // Add Con modifier x number of hit dice
                var npc_constitution_mod = Math.floor((getAttrByName(id, 'npc_constitution', 'current') - 10) / 2);
                total = Math.floor(nb_dice * npc_constitution_mod + total);

                if(jf.monsterAsMinHp == true) {
                    // Calculate average HP, has written in statblock.
                    var average_hp = Math.floor(((nb_face + 1) / 2 + npc_constitution_mod) * nb_dice);
                    if(average_hp > total) {
                        original = total;
                        total = average_hp;
                    }
                }
                callback(total, original);
            }
        });
    }

    jf.capitalizeEachWord = function(str) {
        return str.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    jf.setCharacter = function(name, gmnotes, bio) {
        if(name == undefined)
            throw("Name require to get or create character");
        name = jf.capitalizeEachWord(name);

        var obj = findObjs({
            _type: "character",
            name: name
        });

        if(obj.length == 0) {
            obj = createObj('character', {
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

        characterId = obj.id;
        setAttribut('is_npc', 1);

        return obj;
    }

    jf.ImportStatblock = function(token) {
        status = 'Nothing modified';
        errors = [];
        try {
            var statblock = token.get('gmnotes').trim();

            if(statblock == '')
                throw("Selected token GM Notes was empty.");

            var name = jf.parseStatblock(statblock);
            if(characterId != null) {
                token.set("represents", characterId);
                
                processBarSetting(1, token, name);
                processBarSetting(2, token, name);
                processBarSetting(3, token, name);
            }
        } catch(e) {
            status = "Parsing was incomplete due to error(s)";
            log(e);
            errors.push(e);
        }

        log(status);
        sendChat('GM', '/w GM ' + status);

        if(errors.length > 0) {
            log(errors.join('\n'));
            sendChat('GM', '/w GM Error(s):\n/w GM ' + errors.join('\n/w GM '));
        }
    }

    function setAttribut(name, currentVal, max) {

        if(name == undefined)
            throw("Name required to set attribut");

        max = max || '';

        if(currentVal == undefined) {
            log("Error setting empty value: " + name);
            return;
        }

        var attr = findObjs({
            _type: 'attribute',
            _characterid: characterId,
            name: name
        })[0];

        if(attr == undefined) {
            log("Creating attribut " + name);
            createObj('attribute', {
                name: name,
                current: currentVal,
                max: max,
                characterid: characterId
            });
        } else if(attr.get('current') == undefined || attr.get('current').toString() != currentVal) {
            log("Updating attribut " + name);
            attr.set({
                current: currentVal,
                max: max
            });
        }
    }

    function setAbility(name, description, action, istokenaction) {
        if(name == undefined)
            throw("Name required to set ability");

        var ability = findObjs({
            _type: "ability",
            _characterid: characterId,
            name: name
        });

        if(ability == undefined)
            throw("Something prevent script to create or find ability " + name);

        if(ability.length == 0) {
            ability = createObj('ability', {
                _characterid: characterId,
                name: name,
                description: description,
                action: action,
                istokenaction: istokenaction
            });
            log("Ability " + name + " created");
        } else {
            ability = getObj('ability', ability[0].id);
            if(ability.get('description') != description || ability.get('action') !== action || ability.get('istokenaction') != istokenaction) {
                ability.set({
                    description: description,
                    action: action,
                    istokenaction: istokenaction
                });
                log("Ability " + name + " updated");
            }
        }
    }

    jf.parseStatblock = function(statblock) {

        log("---- Parsing statblock ----");

        texte = clean(statblock);
        var keyword = findKeyword(texte);
        var section = splitStatblock(texte, keyword);
        jf.setCharacter(section.attr.name, '', section.bio);
        processSection(section);
        return section.attr.name;
    }

    function clean(statblock) {
        statblock = unescape(statblock);
        statblock = statblock.replace(/–/g, '-');
        statblock = statblock.replace(/<br[^>]*>/g, '#').replace(/(<([^>]+)>)/ig, "");
        statblock = statblock.replace(/\s+#\s+/g, '#');
        statblock = statblock.replace(/#(?=[a-z])/g, ' ');
        statblock = statblock.replace(/\s+/g, ' ');

        //log(statblock)  ;
        return statblock;
    }

    function findKeyword(statblock) {
        var keyword = {
            attr: {},
            traits: {},
            actions: {},
            legendary: {}
        };

        var indexAction = 0;
        var indexLegendary = statblock.length;

        // Standard keyword
        var regex = /#\s*(tiny|small|medium|large|huge|gargantuan|armor class|hit points|speed|str|dex|con|int|wis|cha|saving throws|skills|damage resistances|damage immunities|condition immunities|damage vulnerabilities|senses|languages|challenge|traits|actions|legendary actions)(?=\s|#)/gi;
        while(match = regex.exec(statblock)) {
            key = match[1].toLowerCase();

            if(key == 'actions') {
                indexAction = match.index;
                keyword.actions.Actions = match.index;
            } else if(key == 'legendary actions') {
                indexLegendary = match.index;
                keyword.legendary.Legendary = match.index;
            } else {
                keyword.attr[key] = match.index;
            }
        }

        // Power
        regex = /(?:#|\.\s+)([A-Z][\w-]+(?:\s(?:[A-Z][\w-]+|[\(\)\d/-]|of)+)*)(?=\s*\.)/g;
        while(match = regex.exec(statblock)) {
            if(keyword.attr[match[1].toLowerCase()] == undefined) {
                if(match.index < indexAction)
                    keyword.traits[match[1]] = match.index;
                else if(match.index < indexLegendary)
                    keyword.actions[match[1]] = match.index;
                else
                    keyword.legendary[match[1]] = match.index;
            }
        }

        return keyword;
    }

    function splitStatblock(statblock, keyword) {
        // Check for bio (flavor texte) at the end, separated by at least 3 line break.
        var bio;
        if((pos = statblock.indexOf('###')) != -1) {
            bio = statblock.substring(pos + 3).replace(/^[#\s]/g, "");
            bio = bio.replace(/#/g, "<br>").trim();
            statblock = statblock.slice(0, pos);
        }

        var debut = 0;
        var fin = 0;
        var keyName = 'name';
        var sectionName = 'attr';

        for(var section in keyword) {
            var obj = keyword[section];
            for(var key in obj) {
                var fin = parseInt(obj[key], 10);
                keyword[sectionName][keyName] = extractSection(statblock, debut, fin, keyName);
                keyName = key;
                debut = fin;
                sectionName = section;
            }
        }
        keyword[sectionName][keyName] = extractSection(statblock, debut, statblock.length, keyName);

        delete keyword.actions.Actions;
        delete keyword.legendary.Legendary;

        if(bio != null) keyword.bio = bio;

        // Patch for multiline abilities
        var abilitiesName = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        var abilities = '';
        for(i = 0, len = abilitiesName.length; i < len; ++i) {
            if(keyword.attr[abilitiesName[i]] != undefined) {
                abilities += keyword.attr[abilitiesName[i]] + ' ';
                delete keyword.attr[abilitiesName[i]]
            }
        }
        keyword.attr.abilities = abilities;

        // Size attribut:
        var size = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];
        for(i = 0, len = abilitiesName.length; i < len; ++i) {
            if(keyword.attr[size[i]] != undefined) {
                keyword.attr.size = size[i] + ' ' + keyword.attr[size[i]];
                delete keyword.attr[size[i]];
                break
            }
        }

        //Move legendary action summary to trait.
        if(keyword.legendary["Legendary Actions"] !== undefined) {
            keyword.traits["Legendary Actions"] = keyword.legendary["Legendary Actions"];
            delete keyword.legendary["Legendary Actions"];
        }
        return keyword;
    }

    function extractSection(texte, debut, fin, title) {
        section = texte.substring(debut, fin);
        // Remove action name from action description and clean.
        section = section.replace(new RegExp("^[\\s\\.#]*" + title.replace(/([-()\\/])/g, "\\$1") + "?[\\s\\.#]*", 'i'), '');
        section = section.replace(/#/g, ' ');
        return section;
    }

    function processSection(section) {
        // Process abilities first cause needed by other attribut.
        if('abilities' in section.attr) parseAbilities(section.attr.abilities);
        if('size' in section.attr) parseSize(section.attr.size);
        if('armor class' in section.attr) parseArmorClass(section.attr['armor class']);
        if('hit points' in section.attr) parseHp(section.attr['hit points']);
        if('speed' in section.attr) parseSpeed(section.attr.speed);
        if('challenge' in section.attr) parseChallenge(section.attr.challenge);
        if('saving throws' in section.attr) parseSavingThrow(section.attr['saving throws']);
        if('skills' in section.attr) parseSkills(section.attr.skills);
        if('senses' in section.attr) parseSenses(section.attr.senses);

        if('damage immunities' in section.attr) setAttribut('npc_damage_immunity', section.attr['damage immunities']);
        if('condition immunities' in section.attr) setAttribut('npc_condition_immunity', section.attr['condition immunities']);
        if('damage vulnerabilities' in section.attr) setAttribut('npc_damage_vulnerability', section.attr['damage vulnerabilities']);
        if('languages' in section.attr) setAttribut('npc_languages', section.attr['languages']);
        if('damage resistances' in section.attr) setAttribut('npc_damage_resistance', section.attr['damage resistances']);

        parseTraits(section.traits);
        parseActions(section.actions, section.legendary);
    }

    /* Section parsing function */
    function parseAbilities(abilities) {
        var regex = /(\d+)\s*\(/g;
        var match = [];

        while(matches = regex.exec(abilities)) {
            match.push(matches[1]);
        }

        setAttribut('npc_strength', match[0]);
        setAttribut('npc_dexterity', match[1]);
        setAttribut('npc_constitution', match[2]);
        setAttribut('npc_intelligence', match[3]);
        setAttribut('npc_wisdom', match[4]);
        setAttribut('npc_charisma', match[5]);
    }

    function parseSize(size) {
        var match = size.match(/(.*?) (.*?), (.*)/i);
        setAttribut('npc_size', match[1]);
        setAttribut('npc_type', match[2]);
        setAttribut('npc_alignment', match[3]);
    }

    function parseArmorClass(ac) {
        var match = ac.match(/(\d+)\s?(.*)/);
        setAttribut('npc_AC', match[1]);
        setAttribut('npc_AC_note', match[2]);
    }

    function parseHp(hp) {
        var match = hp.match(/.*?(\d+)\s+\(((?:\d+)d(?:\d+))/i);
        setAttribut('npc_HP', match[1], match[1]);
        setAttribut('npc_HP_hit_dice', match[2]);
    }

    function parseSpeed(speed) {
        var baseAttr = 'npc_speed';
        var regex = /(|fly|climb|swim|burrow)\s*(\d+)(?:ft\.|\s)+(\(.*\))?/gi;
        while(match = regex.exec(speed)) {
            var attrName = baseAttr + (match[1] != '' ? '_' + match[1].toLowerCase() : '');
            var value = match[2];
            if(match[3] != undefined)
                value += ' ' + match[3];

            setAttribut(attrName, value);
        }
    }

    function parseChallenge(cr) {
        input = cr.replace(/[, ]/g, '');
        var match = input.match(/([\d/]+).*?(\d+)/);
        setAttribut('npc_challenge', match[1]);
        setAttribut('npc_xp', parseInt(match[2]));
    }

    function parseSavingThrow(save) {
        var regex = /(STR|DEX|CON|INT|WIS|CHA).*?(\d+)/gi;
        var attr, value;
        while(match = regex.exec(save)) {
            // Substract ability modifier from this field since sheet compute it
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
            setAttribut(attr + '_save_bonus', match[2] - Math.floor((getAttrByName(characterId, attr) - 10) / 2));
        }
    }

    function parseSkills(skills) {
        // Need to substract ability modifier skills this field since sheet compute it
        var skillAbility = {
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

        var regex = /([\w\s]+).*?(\d+)/gi;
        while(match = regex.exec(skills.replace(/Skills\s+/i, ''))) {
            var skill = match[1].trim().toLowerCase();
            if(skill in skillAbility) {
                var abilitymod = skillAbility[skill];
                var attr = 'npc_' + skill.replace(/\s/g, '') + '_bonus';
                setAttribut(attr, match[2] - Math.floor((getAttrByName(characterId, 'npc_' + abilitymod) - 10) / 2));
            } else {
                errors.push("Skill " + skill + ' is not a valid skill');
            }
        }
    }

    function parseSenses(senses) {
        senses = senses.replace(/[,\s]*passive.*/i, '');
        if(senses.length > 0)
            setAttribut('npc_senses', senses);
    }

    function parseTraits(traits) {
        var texte = "";
        _.each(traits, function(value, key) {
            value = value.replace(/[\.\s]+$/, '.')
            texte += '**' + key + '**: ' + value + ' ';
        });

        texte = texte.slice(0, -1);
        setAttribut('npc_traits', texte);
    }

    function parseActions(actions, legendary) {

        var multiattackText = '';
        var actionPosition = []; // For use with multiattack.

        if('Multiattack' in actions) {
            setAttribut('npc_multiattack', actions.Multiattack);
            multiattackText = actions.Multiattack
            delete actions.Multiattack;
        }

        var cpt = 1;
        _.each(actions, function(value, key) {
            if((pos = key.indexOf('(')) > 1)
                actionPosition[cpt] = key.substring(0, pos - 1).toLowerCase();
            else
                actionPosition[cpt] = key.toLowerCase();

            setAttribut('npc_action_name' + cpt, key);

            // Convert dice to inline roll and split description from effect
            var match = value.match(/(Each|Hit:)/);
            if(match != null) {
                texte = value.substring(0, match.index).replace(/(\+\s?(\d+))/g, '$1 : [[1d20+$2]]|[[1d20+$2]]');
                setAttribut('npc_action_description' + cpt, texte);

                texte = value.substring(match.index).replace(/(\d+d\d+[\d\s+]*)/g, '[[$1]]')
                setAttribut('npc_action_effect' + cpt, texte);
            } else {
                texte = value.replace(/(\+\s?(\d+))/g, '$1 : [[1d20+$2]]|[[1d20+$2]]');
                setAttribut('npc_action_description' + cpt, texte);
            }

            // Create token action
            if(jf.usePowerAbility)
                setAbility(key, "", powercardAbility(id, cpt), jf.createAbilityAsToken);
            else
                setAbility(key, "", "%{selected|NPCAction" + cpt + "}", jf.createAbilityAsToken);

            cpt++;
        });

        var actionList = actionPosition.join('|').slice(1);

        if(multiattackText != '') {
            //var regex = new RegExp("(?:(?:(one|two) with its )?(" + actionList + "))", "gi");
            var regex = new RegExp("(one|two)? (?:with its )?(" + actionList + ")", "gi");
            var macro = "";

            while(match = regex.exec(multiattackText)) {
                var action = match[2];
                var nb = match[1] || 'one';
                var actionNumber = actionPosition.indexOf(action.toLowerCase());

                if(actionNumber !== -1) {
                    macro += "%{selected|NPCAction" + actionNumber + "}\n";
                    if(nb == 'two')
                        macro += "%{selected|NPCAction" + actionNumber + "}\n";
                    delete actionPosition[actionNumber]; // Remove 
                }
            }

            setAttribut('npc_action_name' + cpt, 'MultiAttack');
            setAttribut('npc_action_effect' + cpt, macro.slice(0, -1));
            setAttribut('npc_action_multiattack' + cpt, "{{npc_showmultiattack=1}} {{npc_multiattack=@{npc_multiattack}}}");

            if(jf.usePowerAbility)
                setAbility('MultiAttack', "", powercardAbility(id, cpt), jf.createAbilityAsToken);
            else
                setAbility('MultiAttack', "", "%{selected|NPCAction" + cpt + "}", jf.createAbilityAsToken);
            cpt++;
        }

        _.each(legendary, function(value, key) {
            setAttribut('npc_action_name' + cpt, key);
            setAttribut('npc_action_type' + cpt, '(Legendary Action)');

            var regex = new RegExp("makes a (" + actionList + ")", "i");
            var match = value.match(regex);
            if(match != null) {
                var macro = "%{selected|NPCAction" + actionPosition.indexOf(match[1].toLowerCase()) + "}";
                setAttribut('npc_action_effect' + cpt, macro);
            } else {
                var match = value.match(/(Each|Hit:)/);
                if(match != null) {
                    texte = value.substring(0, match.index).replace(/(\+\s?(\d+))/g, '$1 : [[1d20+$2]]|[[1d20+$2]]');
                    setAttribut('npc_action_description' + cpt, texte);

                    texte = value.substring(match.index).replace(/(\d+d\d+[\d\s+]*)/g, '[[$1]]')
                    setAttribut('npc_action_effect' + cpt, texte);
                } else {
                    texte = value.replace(/(\+\s?(\d+))/g, '$1 : [[1d20+$2]]|[[1d20+$2]]');
                    setAttribut('npc_action_description' + cpt, texte);
                }
            }
            cpt++;
        });
    }
    
    function processBarSetting(i, token, name)
    { 
        var attribut =  jf['parsebar'+ i];
        if(attribut != '' && attribut != undefined){
            value = getAttrByName(characterId, attribut, 'current');
            if(value=='') {
                log("Character don't have '"+ attribut+ "' to set has bar" + i);
            }
            else if(isNaN(value))
            {
                var formula = value.replace(/@{/g, '@{' + name +'|');
                sendChat("GM", "/roll " + formula, function(ops) {
                    var rollResult = JSON.parse(ops[0].content);
                    if(_.has(rollResult, 'total')) {
                        setBarValue(token, i, rollResult.total);
                    }
                    else {
                        log('Unable to parse ' + attribut + ' formula');
                    }
                });
            }
            else {
                setBarValue(token, i, value);
            }
        }
    }

    
    function setBarValue(token, barNumber, value){
        if(value != undefined && value != ''){
            var bar = 'bar' + barNumber;
           // log("Setting " + bar + " to value " + value);
            token.set(bar + '_value', value);
            token.set(bar + '_max', value);   
        }
        else {
            log("Can't set empty value to bar " + barNumber);
        }
    }

}(typeof jf === 'undefined' ? jf = {} : jf));

on("ready", function() {
    'use strict';
    jf.statblock.RegisterHandlers();
});
