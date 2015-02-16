D&D 5e Statblock to Roll20.net character

This script parse the content of a token GM note to create 5e monster character sheet.

Usage: Write !build-monster in chat.

The script read the statblock from the current selected token to create a monster character sheet. If the monster already exist, it will be updated.
RULE:
Name: Must be the first line of statblock.
Size: If included, must be the second line.
Flavor text (bio): If included, must be at the end and separate by at least 2 empty line form the statblock.

Here is the additionnal keyword that this script can find:
armor class, hit points, speed, str, dex, con, int, wis, cha, saving throws, skills, damage resistances, damage immunities, condition immunities, damage vulnerabilities, senses, languages, challenge, traits, actions, legendary actions.

BUG:
Need to find a way to parse actions when Actions not present.
Bug when crature has no traits (skeleton)

LOG:
Better clean text form percent-encoding and html tags.
Challenge rating as fraction now ok.
Bio not present won't break.

Note: abilities need to be include or already on the character sheet for the script to calculate the real bonus value for Skills and Saving Throw since they are already include in the monster statblock.
