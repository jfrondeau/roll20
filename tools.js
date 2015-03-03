
(function (jf, undefined){

    jf.monsterAsMinHp = true; // generated token hp can't be lower than the average hp
    jf.rollMonsterHpOnDrop = true; // will roll HP when character are dropped on map
    jf.hpBarNumber = 1;
    
    jf.tools = {
        version: 1.1,
        RegisterTHandlers: function () {
            on('chat:message', HandleInput);
        
            if(jf.rollMonsterHpOnDrop == true) {
                on("add:graphic", function(obj) {
                    jf.rollTokenHp(obj);
                });
            }
            log("Jf Tools ready");
        }
    }
    
    function HandleInput(msg) {
        
        if (msg.type !== "api") {return;}

        args = msg.content.split(/\s+/);

        switch(args[0]) {
            case '!jf-rollhp':
                return jf.rollHpForSelectedToken(msg); break;
            case '!jf-kill':
                return jf.kill(msg); break;
            case '!jf-totalxp':
                return jf.getTotalXP(msg); break;
            case '!jf-clone':
                return jf.cloneToken(msg, args[1]); break;
            case '!jf-test':
                return jf.test(msg); break;
        }
    }
    
    jf.getSelectedToken = jf.getSelectedToken || function(msg, callback, limit){
        try{
            if(msg.selected == undefined || msg.selected.length == undefined)
                throw('No token selected');
            
            limit = parseInt(limit, 10) | 0;
            
            if(limit == undefined || limit > msg.selected.length + 1 || limit < 1)
                limit = msg.selected.length;
            
            for(i = 0; i < limit; i++){
                if(msg.selected[i]._type == 'graphic'){
                    var obj = getObj('graphic', msg.selected[i]._id);
                    if(obj!==undefined && obj.get('subtype') == 'token'){
                        callback(obj);
                    }
                }
            }
        }
        catch(e) {
            log('Exception: ' + e);
        }    
    }
    
    jf.getTotalXP = function(msg){
        var total = 0;
        jf.getSelectedToken(msg, function(token){
            total += parseInt(getAttrByName(token.get('represents'), 'npc_xp', 'current'),10);
        });
        
        var message = "Total xp: " + total;             
        sendChat('GM', message);
        log(message);
    }
    
    jf.rollHpForSelectedToken = function(msg){
        jf.getSelectedToken(msg, jf.rollTokenHp);
    }
    
    jf.rollTokenHp = function(token){
        var bar = 'bar' + jf.hpBarNumber;
        var represent = '';
        try{
            if((represent = token.get('represents')) == '')
                throw('Token do not represent character');
                 
            if(token.get(bar + '_link') != "")
                throw('Token ' + bar + ' is linked');
                
            rollCharacterHp(represent, function(total){
                token.set(bar+'_value', total);
                token.set(bar+'_max', total);
                sendChat('GM', 'Hp rolled: ' + total);
            });
        }
        catch(e) {
            log('Exception: ' + e);
        }
    }
    
    function rollCharacterHp(id, callback) {
        var hd = getAttrByName(id, 'npc_HP_hit_dice', 'current');
        if(hd == '')
            throw 'Character has no HP Hit Dice defined';
        
        var match = hd.match(/^(\d+)d(\d+)$/);
        if(match == null || match[1] == undefined || match[2] == undefined){
            throw 'Character dont have valid HP Hit Dice format';
        }
        
        var nb_dice = parseInt(match[1], 10);
        var nb_face = parseInt(match[2], 10)
        var total = 0;
        
        sendChat("GM", "/roll " + hd, function(ops) {
            var rollResult = JSON.parse(ops[0].content);
            if(_.has(rollResult,'total'))
            {
                total = rollResult.total;
                
                // Add Con modifier x number of hit dice
                var npc_constitution_mod = Math.floor( (getAttrByName(id, 'npc_constitution', 'current') - 10) / 2);            
                total = Math.floor(nb_dice * npc_constitution_mod + total);
                
                if(jf.monsterAsMinHp == true)
                {
                    // Calculate average HP, has written in statblock.
                    var average_hp = Math.floor(((nb_face + 1) / 2 + npc_constitution_mod) * nb_dice);
                    if(average_hp > total) {
                        total = average_hp;
                    }
                }
                callback(total);
            } 
        });
    }
    
    jf.cloneToken = function (msg, number) {
        
        log('Cloning ' + number);
        
        jf.getSelectedToken(msg, function(token){
            var match = token.get('imgsrc').match(/images\/.*\/(thumb|max)/i);
            
            if(match == null)
                throw("The token imgsrc do not come from you library. Unable to clone");
                
            number = parseInt(number, 10) || 1;
            var imgsrc = token.get('imgsrc').replace('/max.', '/thumb.');
            var name = token.get("name") + " ";
            log(name);
            token.set({"name": name + randomInteger(99), showname: true});
            
            for(i = 0; i < number; i++){
                var left = (parseInt(token.get("left")) + (70 * (i+1)));
                var obj = createObj("graphic", {
                    name: name + randomInteger(99),
                    controlledby: token.get("controlledby"),
                    left: left,
                    top: token.get("top"),
                    width: token.get("width"),
                    height: token.get("height"),
                    showname: true,
                    imgsrc: imgsrc,
                    pageid: token.get("pageid"),
                    represents: token.get('represents'),
                    //showplayers_name: true,
                    //showplayers_bar1: true,
                    //bar1_value: token.get("bar1_value"),
                    //bar1_max: token.get("bar1_max"),
                    layer: "objects"
                });
                if(jf.rollMonsterHpOnDrop == true)
                    jf.rollTokenHp(obj);
            }
        }, 1);
    }

    jf.kill = function(msg){
        var bar = 'bar' + jf.hpBarNumber + "_value";
        jf.getSelectedToken(msg, function(token){
            token.set("status_dead", true);
            //token.set('bar', 0);
        })
    }
    
    jf.test = function(msg){
        jf.getSelectedToken(msg, function(token){
            var imgsrc = token.get('imgsrc');
            log(imgsrc);
        }, 1);
    }

  
}(typeof jf === 'undefined' ? jf = {} : jf));

on("ready",function(){
    'use strict';
    jf.tools.RegisterTHandlers();
});

//jf.monsterAsMinHp = true;         // default: true. Generated token hp can't be lower than the average hp
//jf.rollMonsterHpOnDrop = true;    // default: true. Will roll HP when character are dropped on map
//jf.hpBarNumber = 1;               // default 1. 1 = green bar, 2 = blue bar, 3 = red bar.