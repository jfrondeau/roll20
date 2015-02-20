(function (jf, undefined){

    jf.monsterAsMinHp = true; // generated token hp can't be lower than average hp
    jf.rollMonsterHpOnDrop = true; // will roll HP when character are dropped on map
    
    jf.tools = {
        version: 1,
        RegisterTHandlers: function () {
            on('chat:message', HandleInput);
        
            if(jf.rollMonsterHpOnDrop == true) {
                on("add:graphic", function(obj) {
                    jf.rollHp(obj);
                });
            }
        }
    }
    
    function HandleInput(msg) {
        
        if (msg.type !== "api") {return;}

        args = msg.content.split(/\s+/);

        switch(args[0]) {
            case '!jf-rollHp':
                return jf.rollHp(msg.selected); break;
            case '!jf-kill':
                return jf.kill(msg.selected); break;
            case '!jf-xp':
                return jf.getXp(msg.selected); break;

        }
    }
    

    jf.rollHp = function(tokens) {
        if(tokens == undefined){
            log('No token selected');
            return;
        }
        if(tokens.length != undefined) {
            _.each(tokens, function (token) {
                var obj = getObj('graphic', token._id);
                validateAndRollHp(obj);
            });
        }
        else {
            validateAndRollHp(tokens);
        }
    }
    
    function validateAndRollHp(token) {
        if(token.get('type') != 'graphic' ||  token.get('subtype') !=  'token'){
            log('Invalide token (!graphic and !token)');
            return;
        }
        
        var represent = '';
        if((represent = token.get('represents')) == '')
        {
            log('Token do not represent character');
            return;
        }
        
        if(token.get('bar3_link') == ""){
            var total = RollCharacterHp(represent, function(total){
                token.set({bar3_value: total, bar3_max: total})
                sendChat('GM', 'Hp rolled: ' + total);
            });
        }
    }
      
    function RollCharacterHp(id, callback) {
        var hd = getAttrByName(id, 'npc_HP_hit_dice', 'current');
            
        if(hd == ''){
            sendChat('GM', 'Can\'t roll: Hit dice not defined'); return;
        }
            
        var npc_constitution_mod = Math.floor( (getAttrByName(id, 'npc_constitution', 'current') - 10) / 2);            
        var total = 0;
        var nb_hit_dice = 1;
            
        sendChat("GM", "/roll " + hd, function(ops) {
            var rollResult = JSON.parse(ops[0].content);
            if(_.has(rollResult,'total'))
            {
                var total = rollResult.total;
                
                // Ad Con modifier x number of hit dice
                nb_hit_dice = rollResult.rolls[0].dice;
                total = Math.floor( nb_hit_dice * npc_constitution_mod + total);
                
                if(jf.monsterAsMinHp == true)
                {
                    // Calculate average HP, has written in statblock.
                    var nbFace = rollResult.rolls[0].sides;
                    var average_hp = Math.floor(((nbFace + 1) / 2 + npc_constitution_mod) * nb_hit_dice);
                    log('Avg: ' + average_hp + ", Total: " + total);
                    if(average_hp > total) {
                        total = average_hp;
                    }
                }
                log(total);
                callback(total);
            } 
        });
    }

    jf.kill = function(tokens){
        tokens = jf.getTokens(tokens);

        if(tokens.length == 0)
            return "Aucun token selectionné";

        _.each(tokens, function (obj) {
            obj.set("status_dead", true);
            obj.set('bar3_value', 0);
        });
    
        //sendChat('JF Tool', 'Xp total: ' + total);
    }

    jf.getXp = function(tokens){
        tokens = jf.getTokens(tokens);
        if(tokens.length == 0)
            return "Aucun token selectionné";
    
        var total = 0;
        
        _.each(tokens, function (obj) {
            var xp = getAttrByName(obj.get('represents'), 'npc_xp', 'current');
            total = total + parseInt(xp);
        });
    
        sendChat('GM', 'Total XP: ' + total);
    };

}(typeof jf === 'undefined' ? jf = {} : jf));

on("ready",function(){
    log("Ready from Tools");
    'use strict';
    jf.tools.RegisterTHandlers();
});

jf.monsterAsMinHp = true;