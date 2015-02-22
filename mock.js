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
function sendChat(chanel, message) {}
function findObjs(filter){ return [{id: 1}]}
function getObj(id){ return obj;}
function getAttrByName(id,attr) {return obj[attr];}
function log(message) {console.log(message);}

jf.setAttribut = function(id, name, currentVal, max) {obj[name] = currentVal; return;}  // Override for test


jf.setAttribut = function(id, name, currentVal, max) {obj[name] = currentVal; return;}  // Override for test

var bugbear = "Test%20BUGBEAR%3Cbr%3EMedium%20humanoid%20%28goblinoid%29%2C%20chaotic%20evil%3Cbr%3EArmor%20Class%2016%20%28hide%20armor%2C%20shield%29%3Cbr%3EHit%20Points%2027%20%285d8%20+%205%29%3Cbr%3ESpeed%2040%20ft.%2C%20climb%2040%20ft.%2C%20fly%2080%20ft.%20(hover)%3Cbr%3E%20%20STR%20%20DEX%20%20CON%20%20INT%20%20WIS%20%20CHA%3Cbr%3E%20%2015%20%28+2%29%20%2014%20%28+2%29%20%2013%20%28+1%29%20%208%20%28%u22121%29%20%2011%20%28+0%29%20%209%20%28%u22121%29%3Cbr%3ESaving%20Throws%20Wis%20+2%2C%20Cha%20+4%3Cbr%3ESkills%20Stealth%20+6%2C%20Survival%20+2%2C%20Athletics%20+5%2C%20Perception%20+3%3Cbr%3EDamage%20Resistances%20acid%2C%20fire%2C%20lightning%2C%20thunder%3B%20bludgeoning%2C%20%3Cbr%3Epiercing%2C%20and%20slashing%20from%20nonmagical%20weapons%3Cbr%3EDamage%20Immunities%20cold%2C%20necrotic%2C%20poison%3Cbr%3ECondition%20Immunities%20charmed%2C%20exhaustion%2C%20frightened%2C%20%3Cbr%3Egrappled%2C%20paralyzed%2C%20petrified%2C%20poisoned%2C%20prone%2C%20restrained%3Cbr%3EDamage%20Vulnerabilities%20fire%3Cbr%3ESenses%20darkvision%2060%20ft.%2C%20passive%20Perception%2010%3Cbr%3ELanguages%20Common%2C%20Goblin%3Cbr%3EChallenge%201%20%281%2C200%20XP%29%3Cbr%3EBrute.%20A%20melee%20weapon%20deals%20one%20extra%20die%20of%20its%20damage%20when%20the%20%3Cbr%3Ebugbear%20hits%20with%20it%20%28included%20in%20the%20attack%29.%3Cbr%3ESurprise%20Attack.%20If%20the%20bugbear%20surprises%20a%20creature%20and%20hits%20it%20%3Cbr%3Ewith%20an%20attack%20during%20the%20first%20round%20of%20combat%2C%20the%20target%20takes%20%3Cbr%3Ean%20extra%207%20%282d6%29%20damage%20from%20the%20attack.%3Cbr%3EActions%3Cbr%3EMorningstar.%20Melee%20Weapon%20Attack%3A%20+4%20to%20hit%2C%20reach%205%20ft.%2C%20one%20%3Cbr%3Etarget.%20Hit%3A%2011%20%282d8%20+%202%29%20piercing%20damage.%3Cbr%3EJavelin.%20Melee%20or%20Ranged%20Weapon%20Attack%3A%20+4%20to%20hit%2C%20reach%205%20ft.%20or%20%3Cbr%3Erange%2030/120%20ft.%2C%20one%20target.%20Hit%3A%209%20%282d6%20+%202%29%20piercing%20damage%20%3Cbr%3Ein%20melee%20or%205%20%281d6%20+%202%29%20piercing%20damage%20at%20range.%3Cbr%3Ebio%3Cbr%3EBugbears%20are%20hairy%20goblinoids%20born%20for%20battle%20and%20%3Cbr%3Emayhem.%20They%20survive%20by%20raiding%20and%20hunting%2C%20but%20are%20%3Cbr%3Efond%20of%20setting%20ambushes%20and%20fleeing%20when%20outmatched.%3Cbr%3E%3Cbr%3E";
var dragon = "Adult%20Red%20Dragon%3Cbr%3EHuge%20dragon%2C%20chaotic%20evil%3Cbr%3EArmor%20Class%2019%20%28natural%20armor%29%3Cbr%3EHit%20Points%20256%20%2819d12%20+%20133%29%3Cbr%3ESpeed%2040%20ft.%2C%20climb%2040%20ft.%2C%20fly%2080%20ft.%3Cbr%3E%20%20STR%20%20DEX%20%20CON%20%20INT%20%20WIS%20%20CHA%3Cbr%3E%20%2027%20%28+8%29%20%2010%20%28+0%29%20%2025%20%28+7%29%20%2016%20%28+3%29%20%2013%20%28+1%29%20%2021%20%28+5%29%3Cbr%3ESaving%20Throws%20Dex%20+6%2C%20Con%20+13%2C%20Wis%20+7%2C%20Cha%20+11%3Cbr%3ESkills%20Perception%20+13%2C%20Stealth%20+6%3Cbr%3EDamage%20Immunities%20fire%3Cbr%3ESenses%20blindsight%2060%20ft.%2C%20darkvision%20120%20ft.%2C%20passive%20Perception%2023%3Cbr%3ELanguages%20Common%2C%20Draconic%3Cbr%3EChallenge%2017%20%2818%2C000%20XP%29%3Cbr%3ELegendary%20Resistance%20%283/Day%29.%20If%20the%20dragon%20fails%20a%20saving%20%3Cbr%3Ethrow%2C%20it%20can%20choose%20to%20succeed%20instead.%3Cbr%3EActions%3Cbr%3EMultiattack.%20The%20dragon%20can%20use%20its%20Frightful%20Presence.%20It%20then%20%3Cbr%3Emakes%20three%20attacks%3A%20one%20with%20its%20bite%20and%20two%20with%20its%20claws.%3Cbr%3EBite.%20Melee%20Weapon%20Attack%3A%20+14%20to%20hit%2C%20reach%2010%20ft.%2C%20one%20target.%20%3Cbr%3EHit%3A%2019%20%282d10%20+%208%29%20piercing%20damage%20plus%207%20%282d6%29%20fire%20damage.%3Cbr%3EClaw.%20Melee%20Weapon%20Attack%3A%20+14%20to%20hit%2C%20reach%205%20ft.%2C%20one%20target.%20%3Cbr%3EHit%3A%2015%20%282d6%20+%208%29%20slashing%20damage.%3Cbr%3ETail.%20Melee%20Weapon%20Attack%3A%20+14%20to%20hit%2C%20reach%2015%20ft.%2C%20one%20target.%20%3Cbr%3EHit%3A%2017%20%282d8%20+%208%29%20bludgeoning%20damage.%3Cbr%3EFrightful%20Presence.%20Each%20creature%20of%20the%20dragon%u2019s%20choice%20that%20%3Cbr%3Eis%20within%20120%20feet%20of%20the%20dragon%20and%20aware%20of%20it%20must%20succeed%20%3Cbr%3Eon%20a%20DC%2019%20Wisdom%20saving%20throw%20or%20become%20frightened%20for%201%20%3Cbr%3Eminute.%20A%20creature%20can%20repeat%20the%20saving%20throw%20at%20the%20end%20of%20%3Cbr%3Eeach%20of%20its%20turns%2C%20ending%20the%20effect%20on%20itself%20on%20a%20success.%20If%20a%20%3Cbr%3Ecreature%u2019s%20saving%20throw%20is%20successful%20or%20the%20effect%20ends%20for%20it%2C%20%3Cbr%3Ethe%20creature%20is%20immune%20to%20the%20dragon%u2019s%20Frightful%20Presence%20for%20%3Cbr%3Ethe%20next%2024%20hours.%3Cbr%3EFire%20Breath%20%28Recharge%205%u20136%29.%20The%20dragon%20exhales%20fire%20in%20a%2060-foot%20%3Cbr%3Econe.%20Each%20creature%20in%20that%20area%20must%20make%20a%20DC%2021%20Dexterity%20%3Cbr%3Esaving%20throw%2C%20taking%2063%20%2818d6%29%20fire%20damage%20on%20a%20failed%20save%2C%20or%20%3Cbr%3Ehalf%20as%20much%20damage%20on%20a%20successful%20one.%3Cbr%3ELegendary%20Actions%3Cbr%3EThe%20dragon%20can%20take%203%20legendary%20actions%2C%20choosing%20from%20the%20%3Cbr%3Eoptions%20below.%20Only%20one%20legendary%20action%20option%20can%20be%20used%20%3Cbr%3Eat%20a%20time%20and%20only%20at%20the%20end%20of%20another%20creature%u2019s%20turn.%20The%20%3Cbr%3Edragon%20regains%20spent%20legendary%20actions%20at%20the%20start%20of%20its%20turn.%3Cbr%3EDetect.%20The%20dragon%20makes%20a%20Wisdom%20%28Perception%29%20check.%3Cbr%3ETail%20Attack.%20The%20dragon%20makes%20a%20tail%20attack.%3Cbr%3EWing%20Attack%20%28Costs%202%20Actions%29.%20The%20dragon%20beats%20its%20wings.%20%3Cbr%3EEach%20creature%20within%2010%20feet%20of%20the%20dragon%20must%20succeed%20%3Cbr%3Eon%20a%20DC%2022%20Dexterity%20saving%20throw%20or%20take%2015%20%282d6%20+%208%29%20%3Cbr%3Ebludgeoning%20damage%20and%20be%20knocked%20prone.%20The%20dragon%20can%20%3Cbr%3Ethen%20fly%20up%20to%20half%20its%20flying%20speed.%3Cbr%3E%3Cbr%3E%3Cbr%3E%3Cbr%3EThe%20odor%20of%20sulfur%20and%20pumice%20surrounds%20a%20red%20dragon%2C%20%3Cbr%3Ewhose%20swept-back%20horns%20and%20spinal%20frill%20define%20its%20%3Cbr%3Esilhouette.%20Its%20beaked%20snout%20vents%20smoke%20at%20all%20times%2C%20%3Cbr%3Eand%20its%20eyes%20dance%20with%20flame%20when%20it%20is%20angry.";
var skeleton = "%3Cem%3ESkeleton%3Cbr%3EMedium%20undead%2C%20lawful%20evil%3C/em%3E%3Cbr%3EArmor%20Class%2013%20%28armor%20scraps%29%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3EHit%20Points%2013%20%282d8%20+%204%29%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3ESpeed%2030%20ft.%3Cbr%3ESTR%20%3Cspan%20style%3D%22font-size%3A%208pt%22%3E10%20%28+0%29%3Cbr%3EDEX%20%3Cspan%20style%3D%22font-size%3A%208pt%22%3E14%20%28+2%29%3Cbr%3E%3Cspan%20style%3D%22font-size%3A%208pt%22%3ECON%20%3Cspan%20style%3D%22font-size%3A%208pt%22%3E15%20%28+2%29%3Cbr%3E%3Cspan%20style%3D%22font-size%3A%208pt%22%3EINT%20%3Cspan%20style%3D%22font-size%3A%209pt%22%3E6%20%28-2%29%3Cbr%3EWIS%208%20%28-1%29%3Cbr%3ECHA%20%3Cspan%20style%3D%22font-size%3A%209pt%22%3E5%20%28-3%29%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3Cbr%3EDamage%20Vulnerabilities%20bludgeoning%3Cbr%3EDamage%20Immunities%20poison%3Cbr%3ECondition%20Immunities%20exhaustion%2C%20poisoned%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3E%3Cspan%20style%3D%22font-size%3A%208pt%22%3E%3Cspan%20style%3D%22font-size%3A%209pt%22%3E%3Cbr%3E%3Cspan%20style%3D%22font-size%3A%208pt%22%3ESenses%20darkvision%2060ft.%2C%20passive%20Perception%209%3Cbr%3E%3Cspan%20style%3D%22font-size%3A%208pt%22%3ELanguages%20understands%20%3Cspan%20style%3D%22font-size%3A%208pt%20%3B%20color%3A%20rgb%28%2056%20%2C%2029%20%2C%2019%20%29%22%3Eall%20%3Cspan%20style%3D%22font-size%3A%208pt%20%3B%20color%3A%20rgb%28%2041%20%2C%2013%20%2C%207%20%29%22%3Elanguages%20it%20knew%20in%20life%20but%3Cbr%3E%3Cspan%20style%3D%22font-size%3A%208pt%20%3B%20color%3A%20rgb%28%2056%20%2C%2029%20%2C%2019%20%29%22%3Ecan%27t%20speak%3Cbr%3E%3Cspan%20style%3D%22font-size%3A%208pt%20%3B%20color%3A%20rgb%28%2041%20%2C%2013%20%2C%207%20%29%22%3EChallenge%20%3Cspan%20style%3D%22font-size%3A%208pt%20%3B%20color%3A%20rgb%28%2056%20%2C%2029%20%2C%2019%20%29%22%3E1/4%20%3Cspan%20style%3D%22font-size%3A%208pt%20%3B%20color%3A%20rgb%28%2041%20%2C%2013%20%2C%207%20%29%22%3E%2850%20%3Cspan%20style%3D%22font-size%3A%208pt%20%3B%20color%3A%20rgb%28%2056%20%2C%2029%20%2C%2019%20%29%22%3EXP%29%3Cbr%3E%3Cspan%20style%3D%22font-size%3A%209pt%20%3B%20color%3A%20rgb%28%2025%20%2C%2026%20%2C%2025%20%29%22%3E%3Cem%3EShortsword.%20Melee%20Weapon%20Attack%3A%20%3C/em%3E%3Cspan%20style%3D%22font-size%3A%208pt%22%3E+4%20to%20hit%2C%20reach%205%20ft.%2C%20one%3Cbr%3E%3Cspan%20style%3D%22font-size%3A%208pt%22%3Etarget%3Cspan%20style%3D%22font-size%3A%208pt%20%3B%20color%3A%20rgb%28%2069%20%2C%2070%20%2C%2065%20%29%22%3E.%20%3Cspan%20style%3D%22font-size%3A%209pt%20%3B%20color%3A%20rgb%28%2025%20%2C%2026%20%2C%2025%20%29%22%3E%3Cem%3EHit%3A%20%3C/em%3E%3Cspan%20style%3D%22font-size%3A%208pt%22%3E5%20%281d6%20+%202%29%20piercing%20damage.%3Cbr%3E%3Cspan%20style%3D%22font-size%3A%209pt%22%3E%3Cem%3EShortbow.%20Ranged%20Weapon%20Attack%3A%20%3C/em%3E%3Cspan%20style%3D%22font-size%3A%208pt%22%3E+4%20to%20hit%2C%20range%2080f320%20ft%20%3Cspan%20style%3D%22font-size%3A%208pt%20%3B%20color%3A%20rgb%28%2056%20%2C%2029%20%2C%2019%20%29%22%3E.%2C%3Cbr%3E%3Cspan%20style%3D%22font-size%3A%208pt%20%3B%20color%3A%20rgb%28%2025%20%2C%2026%20%2C%2025%20%29%22%3Eone%20target.%20%3Cspan%20style%3D%22font-size%3A%209pt%22%3E%3Cem%3EHit%3A%20%3C/em%3E%3Cspan%20style%3D%22font-size%3A%208pt%22%3E5%20%281d6%20+%202%29%20piercing%20damage.%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E%3C/span%3E";
var Owlbear = "Owlbear%3Cbr%3ELarge%20monstrosity%2C%20unaligned%3Cbr%3EArmor%20Class%2013%20%28natural%20armor%29%3Cbr%3EHit%20Points%2059%20%287d10%20+%2021%29%3Cbr%3ESpeed%2040%20ft.%3Cbr%3E%20%20STR%20%20DEX%20%20CON%20%20INT%20%20WIS%20%20CHA%3Cbr%3E%20%2020%20%28+5%29%20%2012%20%28+1%29%20%2017%20%28+3%29%20%203%20%28%u22124%29%20%2012%20%28+1%29%20%207%20%28%u22122%29%3Cbr%3ESkills%20Perception%20+3%3Cbr%3ESenses%20darkvision%2060%20ft.%2C%20passive%20Perception%2013%3Cbr%3ELanguages%20%u2014%3Cbr%3EChallenge%203%20%28700%20XP%29%3Cbr%3EKeen%20Sight%20and%20Smell.%20The%20owlbear%20has%20advantage%20on%20Wisdom%20%3Cbr%3E%28Perception%29%20checks%20that%20rely%20on%20sight%20or%20smell.%3Cbr%3EActions%3Cbr%3EMultiattack.%20The%20owlbear%20makes%20two%20attacks%3A%20one%20with%20its%20beak%20%3Cbr%3Eand%20one%20with%20its%20claws.%3Cbr%3EBeak.%20Melee%20Weapon%20Attack%3A%20+7%20to%20hit%2C%20reach%205%20ft.%2C%20one%20creature.%20%3Cbr%3EHit%3A%2010%20%281d10%20+%205%29%20piercing%20damage.%3Cbr%3EClaws.%20Melee%20Weapon%20Attack%3A%20+7%20to%20hit%2C%20reach%205%20ft.%2C%20one%20target.%20%3Cbr%3EHit%3A%2014%20%282d8%20+%205%29%20slashing%20damage.%3Cbr%3E%3Cbr%3E%3Cbr%3EA%20monstrous%20cross%20between%20giant%20owl%20and%20bear%2C%20an%20%3Cbr%3Eowlbear%u2019s%20reputation%20for%20ferocity%20and%20aggression%20makes%20%3Cbr%3Eit%20one%20of%20the%20most%20feared%20predators%20of%20the%20wild.%3Cbr%3E";
var acolyte = "Acolyte%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3EMedium%20humanoid%20%28any%20race%29%2C%20any%20alignment%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3EArmor%20Class%2010%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3EHit%20Points%209%20%282d8%29%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3ESpeed%2030%20ft.%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3ESTR%20DEX%20CON%20INT%20WIS%20CHA%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3E10%20%28+0%29%2010%20%28+0%29%2010%20%28+0%29%2010%20%28+0%29%2014%20%28+2%29%2011%20%28+0%29%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3ESkills%20Medicine%20+4%2C%20Religion%20+2%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3ESenses%20passive%20Perception%2010%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3ELanguages%20any%20one%20language%20%28usually%20Common%29%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3EChallenge%201/4%20%2850%20XP%29%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3ESpellcasting.%20The%20acolyte%20is%20a%201st-level%20spellcaster.%20Its%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3Espellcasting%20ability%20is%20Wisdom%20%28spell%20save%20DC%2012%2C%20+4%20to%20hit%20with%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3Espell%20attacks%29.%20The%20acolyte%20has%20following%20cleric%20spells%20prepared%3A%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3ECantrips%20%28at%20will%29%3A%20light%2C%20sacred%20flame%2C%20thaumaturgy%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3E1st%20level%20%283%20slots%29%3A%20bless%2C%20cure%20wounds%2C%20sanctuary%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3EActions%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3EClub.%20Melee%20Weapon%20Attack%3A%20+2%20to%20hit%2C%20reach%205%20ft.%2C%20one%20target.%3Cbr%20style%3D%22color%3A%20rgb%28%2051%20%2C%2051%20%2C%2051%20%29%22%3EHit%3A%202%20%281d4%29%20bludgeoning%20damage.";
//log(jf.parse(Owlbear));
jf.ImportStatblock(acolyte);
