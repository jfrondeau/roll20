(function (jf, undefined){

	jf.capitalizeEachWord = function(str) {
    	return str.replace(/\w\S*/g, function(txt) {
        	return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	    });
	};

	jf.parse = function(statblock){
		statblock = unescape(statblock);
		section = splitSection(statblock);
		var statut = 'created';

		monster = jf.getCharacter(section.name, section.bio);

		console.log(monster);
	}

	var splitRegex = function (source, regex){
	    var precedentKey = 'debut';
	    var precedentIndex = 0;
	    var debut = 0;
	    var section = {};

	    while(match = regex.exec(source))
	    {
	        section[precedentKey] = source.substring(debut, match.index).trim();
	        precedentKey = match[1].toLowerCase();
	        debut = match.index + precedentKey.length + 5;
	    }    
	    section[precedentKey] = source.substring(debut).trim();
	    return section;
	};

	var splitSection = function(statblock){
		var sectionTraits;
		var bio;

		// Check for bio (flavor texte) at the end, separated by at least 3 line break.
		if((pos = statblock.indexOf('<br><br><br>')) != -1){
			bio = statblock.substring(pos + 12);
			statblock = statblock.slice(0,pos);
		}

		// Looking for index of Traits section
        var match = statblock.match(/<br>(?!armor class|hit points|speed|str|dex|con|int|wis|cha|saving throws|skills|damage resistances|damage immunities|condition immunities|damage vulnerabilities|senses|languages|challenge|traits|actions|legendary actions)((?:[A-Z][a-z]+[0-9-\s(\/)]{0,5})+)\./i); 
       	if(null != match) {
       		sectionTraits = statblock.slice(match.index);
       		statblock = statblock.slice(0, match.index);
       	}

       	// Split statblock attributes
        var regex = /<br>\s*(armor class|hit points|speed|str|dex|con|int|wis|cha|saving throws|skills|damage resistances|damage immunities|condition immunities|damage vulnerabilities|senses|languages|challenge)(?:\s|<br>)/gmi;
        var section = splitRegex(statblock, regex);

        //  add title and size
        var pos = section.debut.indexOf('<br>');
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
        	section[key] = value.replace(/\.<br>/g,'.\n').replace(/<br>/g,'');
        });

        // Split rest of statblock as trait, action and legendary action. 
        if(sectionTraits != undefined) {
	        var traits = splitRegex(sectionTraits, /<br>\s*(actions|legendary actions)(?:\s|<br>)/gmi);
	        traits['traits'] = traits['debut'];
	        delete traits['debut'];

	        // Combine traits to section1
	        for (var attrname in traits) { 
	        	section[attrname] = traits[attrname]; 
	        }
    	}

        return section;
	};

	jf.getCharacter = function(name, gmnotes, bio) {

        name = jf.capitalizeEachWord(section.title);

        var obj = findObjs({_type: "character", name: name});

        if (obj.length == 0) {
            obj = jf.fixedCreateObj('character', {
                name: name
            });
        } else {
            obj = getObj('character', obj[0].id);
            statut = 'updated';
        }

        if(gmnotes != undefined)
        	obj.set({gmnotes: gmnotes.replace(/\n/g , '<br>')});

        if(bio != undefined)
        	obj.set({bio: bio.replace(/\n/g , '<br />')});

        log("obj: " + obj);
        
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


	
}(typeof jf === 'undefined' ? jf = {} : jf));


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
function findObjs(filter){ 
	return [obj];
}
function getObj(id){ return obj;}
function getAttrByName(id,attr) {return obj[attr];}
function log(message) {console.log(message);}

var bugbear = "Test%20BUGBEAR%3Cbr%3EMedium%20humanoid%20%28goblinoid%29%2C%20chaotic%20evil%3Cbr%3EArmor%20Class%2016%20%28hide%20armor%2C%20shield%29%3Cbr%3EHit%20Points%2027%20%285d8%20+%205%29%3Cbr%3ESpeed%2040%20ft.%2C%20climb%2040%20ft.%2C%20fly%2080%20ft.%20(hover)%3Cbr%3E%20%20STR%20%20DEX%20%20CON%20%20INT%20%20WIS%20%20CHA%3Cbr%3E%20%2015%20%28+2%29%20%2014%20%28+2%29%20%2013%20%28+1%29%20%208%20%28%u22121%29%20%2011%20%28+0%29%20%209%20%28%u22121%29%3Cbr%3ESaving%20Throws%20Wis%20+2%2C%20Cha%20+4%3Cbr%3ESkills%20Stealth%20+6%2C%20Survival%20+2%2C%20Athletics%20+5%2C%20Perception%20+3%3Cbr%3EDamage%20Resistances%20acid%2C%20fire%2C%20lightning%2C%20thunder%3B%20bludgeoning%2C%20%3Cbr%3Epiercing%2C%20and%20slashing%20from%20nonmagical%20weapons%3Cbr%3EDamage%20Immunities%20cold%2C%20necrotic%2C%20poison%3Cbr%3ECondition%20Immunities%20charmed%2C%20exhaustion%2C%20frightened%2C%20%3Cbr%3Egrappled%2C%20paralyzed%2C%20petrified%2C%20poisoned%2C%20prone%2C%20restrained%3Cbr%3EDamage%20Vulnerabilities%20fire%3Cbr%3ESenses%20darkvision%2060%20ft.%2C%20passive%20Perception%2010%3Cbr%3ELanguages%20Common%2C%20Goblin%3Cbr%3EChallenge%201%20%281%2C200%20XP%29%3Cbr%3EBrute.%20A%20melee%20weapon%20deals%20one%20extra%20die%20of%20its%20damage%20when%20the%20%3Cbr%3Ebugbear%20hits%20with%20it%20%28included%20in%20the%20attack%29.%3Cbr%3ESurprise%20Attack.%20If%20the%20bugbear%20surprises%20a%20creature%20and%20hits%20it%20%3Cbr%3Ewith%20an%20attack%20during%20the%20first%20round%20of%20combat%2C%20the%20target%20takes%20%3Cbr%3Ean%20extra%207%20%282d6%29%20damage%20from%20the%20attack.%3Cbr%3EActions%3Cbr%3EMorningstar.%20Melee%20Weapon%20Attack%3A%20+4%20to%20hit%2C%20reach%205%20ft.%2C%20one%20%3Cbr%3Etarget.%20Hit%3A%2011%20%282d8%20+%202%29%20piercing%20damage.%3Cbr%3EJavelin.%20Melee%20or%20Ranged%20Weapon%20Attack%3A%20+4%20to%20hit%2C%20reach%205%20ft.%20or%20%3Cbr%3Erange%2030/120%20ft.%2C%20one%20target.%20Hit%3A%209%20%282d6%20+%202%29%20piercing%20damage%20%3Cbr%3Ein%20melee%20or%205%20%281d6%20+%202%29%20piercing%20damage%20at%20range.%3Cbr%3Ebio%3Cbr%3EBugbears%20are%20hairy%20goblinoids%20born%20for%20battle%20and%20%3Cbr%3Emayhem.%20They%20survive%20by%20raiding%20and%20hunting%2C%20but%20are%20%3Cbr%3Efond%20of%20setting%20ambushes%20and%20fleeing%20when%20outmatched.%3Cbr%3E%3Cbr%3E";
var dragon = "Adult%20Red%20Dragon%3Cbr%3EHuge%20dragon%2C%20chaotic%20evil%3Cbr%3EArmor%20Class%2019%20%28natural%20armor%29%3Cbr%3EHit%20Points%20256%20%2819d12%20+%20133%29%3Cbr%3ESpeed%2040%20ft.%2C%20climb%2040%20ft.%2C%20fly%2080%20ft.%3Cbr%3E%20%20STR%20%20DEX%20%20CON%20%20INT%20%20WIS%20%20CHA%3Cbr%3E%20%2027%20%28+8%29%20%2010%20%28+0%29%20%2025%20%28+7%29%20%2016%20%28+3%29%20%2013%20%28+1%29%20%2021%20%28+5%29%3Cbr%3ESaving%20Throws%20Dex%20+6%2C%20Con%20+13%2C%20Wis%20+7%2C%20Cha%20+11%3Cbr%3ESkills%20Perception%20+13%2C%20Stealth%20+6%3Cbr%3EDamage%20Immunities%20fire%3Cbr%3ESenses%20blindsight%2060%20ft.%2C%20darkvision%20120%20ft.%2C%20passive%20Perception%2023%3Cbr%3ELanguages%20Common%2C%20Draconic%3Cbr%3EChallenge%2017%20%2818%2C000%20XP%29%3Cbr%3ELegendary%20Resistance%20%283/Day%29.%20If%20the%20dragon%20fails%20a%20saving%20%3Cbr%3Ethrow%2C%20it%20can%20choose%20to%20succeed%20instead.%3Cbr%3EActions%3Cbr%3EMultiattack.%20The%20dragon%20can%20use%20its%20Frightful%20Presence.%20It%20then%20%3Cbr%3Emakes%20three%20attacks%3A%20one%20with%20its%20bite%20and%20two%20with%20its%20claws.%3Cbr%3EBite.%20Melee%20Weapon%20Attack%3A%20+14%20to%20hit%2C%20reach%2010%20ft.%2C%20one%20target.%20%3Cbr%3EHit%3A%2019%20%282d10%20+%208%29%20piercing%20damage%20plus%207%20%282d6%29%20fire%20damage.%3Cbr%3EClaw.%20Melee%20Weapon%20Attack%3A%20+14%20to%20hit%2C%20reach%205%20ft.%2C%20one%20target.%20%3Cbr%3EHit%3A%2015%20%282d6%20+%208%29%20slashing%20damage.%3Cbr%3ETail.%20Melee%20Weapon%20Attack%3A%20+14%20to%20hit%2C%20reach%2015%20ft.%2C%20one%20target.%20%3Cbr%3EHit%3A%2017%20%282d8%20+%208%29%20bludgeoning%20damage.%3Cbr%3EFrightful%20Presence.%20Each%20creature%20of%20the%20dragon%u2019s%20choice%20that%20%3Cbr%3Eis%20within%20120%20feet%20of%20the%20dragon%20and%20aware%20of%20it%20must%20succeed%20%3Cbr%3Eon%20a%20DC%2019%20Wisdom%20saving%20throw%20or%20become%20frightened%20for%201%20%3Cbr%3Eminute.%20A%20creature%20can%20repeat%20the%20saving%20throw%20at%20the%20end%20of%20%3Cbr%3Eeach%20of%20its%20turns%2C%20ending%20the%20effect%20on%20itself%20on%20a%20success.%20If%20a%20%3Cbr%3Ecreature%u2019s%20saving%20throw%20is%20successful%20or%20the%20effect%20ends%20for%20it%2C%20%3Cbr%3Ethe%20creature%20is%20immune%20to%20the%20dragon%u2019s%20Frightful%20Presence%20for%20%3Cbr%3Ethe%20next%2024%20hours.%3Cbr%3EFire%20Breath%20%28Recharge%205%u20136%29.%20The%20dragon%20exhales%20fire%20in%20a%2060-foot%20%3Cbr%3Econe.%20Each%20creature%20in%20that%20area%20must%20make%20a%20DC%2021%20Dexterity%20%3Cbr%3Esaving%20throw%2C%20taking%2063%20%2818d6%29%20fire%20damage%20on%20a%20failed%20save%2C%20or%20%3Cbr%3Ehalf%20as%20much%20damage%20on%20a%20successful%20one.%3Cbr%3ELegendary%20Actions%3Cbr%3EThe%20dragon%20can%20take%203%20legendary%20actions%2C%20choosing%20from%20the%20%3Cbr%3Eoptions%20below.%20Only%20one%20legendary%20action%20option%20can%20be%20used%20%3Cbr%3Eat%20a%20time%20and%20only%20at%20the%20end%20of%20another%20creature%u2019s%20turn.%20The%20%3Cbr%3Edragon%20regains%20spent%20legendary%20actions%20at%20the%20start%20of%20its%20turn.%3Cbr%3EDetect.%20The%20dragon%20makes%20a%20Wisdom%20%28Perception%29%20check.%3Cbr%3ETail%20Attack.%20The%20dragon%20makes%20a%20tail%20attack.%3Cbr%3EWing%20Attack%20%28Costs%202%20Actions%29.%20The%20dragon%20beats%20its%20wings.%20%3Cbr%3EEach%20creature%20within%2010%20feet%20of%20the%20dragon%20must%20succeed%20%3Cbr%3Eon%20a%20DC%2022%20Dexterity%20saving%20throw%20or%20take%2015%20%282d6%20+%208%29%20%3Cbr%3Ebludgeoning%20damage%20and%20be%20knocked%20prone.%20The%20dragon%20can%20%3Cbr%3Ethen%20fly%20up%20to%20half%20its%20flying%20speed.%3Cbr%3E%3Cbr%3E%3Cbr%3E%3Cbr%3EThe%20odor%20of%20sulfur%20and%20pumice%20surrounds%20a%20red%20dragon%2C%20%3Cbr%3Ewhose%20swept-back%20horns%20and%20spinal%20frill%20define%20its%20%3Cbr%3Esilhouette.%20Its%20beaked%20snout%20vents%20smoke%20at%20all%20times%2C%20%3Cbr%3Eand%20its%20eyes%20dance%20with%20flame%20when%20it%20is%20angry.";
var res = jf.parse(dragon);