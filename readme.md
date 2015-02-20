D&D 5e Statblock to Roll20.net character

This script parse the content from a token GM note to create a complete 5e monster character sheet. If the monster already exist, it will be updated.

Usage: copy statblock from PDF to a token gmnotes.
Write !build-monster in chat and press enter!

The script can work arround some bad OCR pdf input, but if there is something wrong, here are the rules the script follow. 

Rules: 
Keyword: The script need to find the keyword from the official 5e statblock, each starting a new line. The attributes values can span on multiple line without problem.
Name: Must be the first line of statblock.
Size: If included, must be the second line.
Flavor text (bio): If included, must be at the end of the statblock and separate by at least 2 empty line form the statblock.
Traits, actions and legendary action: They are detected by capitalized word at the start of a line followed by a period.
If statblock include Traits, the Actions keyword must be present to separate Traits from Actions.
Ability Scores need to be include or already on the character sheet for the script to calculate the real bonus value for Skills and Saving Throw since they include ability modifier in the monster statblock. Abilities can be each one on is line (like from OCR PDF), be one 2 lines, the first starting with STR and second containing all the abilities in right order (like official PDF), or even be all on the same line if the line start with "str".

All the token are listed below, and are case insentitive:
armor class, hit points, speed, str, dex, con, int, wis, cha, saving throws, skills, damage resistances, damage immunities, condition immunities, damage vulnerabilities, senses, languages, challenge, traits, actions, legendary actions.


TODO 
Create token action bar.
