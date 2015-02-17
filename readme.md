D&D 5e Statblock to Roll20.net character

This script parse the content of a token GM note to create 5e monster character sheet.

Usage: copy statblock from PDF to a token gmnotes.
Write !build-monster in chat and press enter!.

The script read the statblock from the current selected token to create a monster character sheet. If the monster already exist, it will be updated.
RULE:
Name: Must be the first line of statblock.
Size: If included, must be the second line.
Flavor text (bio): If included, must be at the end and separate by at least 2 empty line form the statblock.
If statblock include Traits, the Actions keyword must be present to separate Traits from Actions
Ability Scores need to be include or already on the character sheet for the script to calculate the real bonus value for Skills and Saving Throw since they include ability modifier in the monster statblock.

Here is the additionnal keyword that this script can parse
armor class, hit points, speed, str, dex, con, int, wis, cha, saving throws, skills, damage resistances, damage immunities, condition immunities, damage vulnerabilities, senses, languages, challenge, traits, actions, legendary actions.

BUG:

TODO
Parse action has inline roll.

