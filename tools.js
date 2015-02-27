(function (jf, undefined){

    jf.monsterAsMinHp = true; // generated token hp can't be lower than average hp
    jf.rollMonsterHpOnDrop = true; // will roll HP when character are dropped on map
    jf.hpBarNumber = 3;
    
    jf.tools = {
        version: 1,
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
    
    jf.getSelectedToken = function(msg, callback, limit){
        try{
            if(msg.selected == undefined || msg.selected.length == undefined){
                throw 'No token selected';
            limit = parseInt(limit, 10);
            if(limit == undefined || limit > msg.selected.length + 1 || limit < 0)
                limit = msg.selected.length;
                
            for(i = 0; i < limit; i++){
                if(selected[i]._type == 'graphic'){
                    var obj = getObj('graphic', selected[i]._id);
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
    
    jf.getSelectedTokenOld = function(msg, callback){
        var res = [];
        try{
            if(msg.selected == undefined || msg.selected.length == undefined){
                throw 'No token selected';
            }
            _.each(msg.selected, function(selected){
                if(selected._type == 'graphic'){
                    var obj = getObj('graphic', selected._id);
                    if(obj!==undefined && obj.get('subtype') == 'token'){
                        res.push(callback(obj));
                    }
                }
            });
        }
        catch(e) {
            log('Exception: ' + e);
        }
        finally {
            return res;
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
    
    jf.rollHpForSelectedToken = function(msg)
    {
        jf.getSelectedToken(msg, jf.rollTokenHp(token));
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
                    //log('Avg: ' + average_hp + ", Total: " + total);
                    if(average_hp > total) {
                        total = average_hp;
                    }
                }
                callback(total);
            } 
        });
    }
    
    jf.cloneToken = function (msg, number) {
        var counter = 1;
        jf.getSelectedToken(msg, function(token, number){
            number = parseInt(number, 10) || 1;
            
            createObj("graphic", {
                    name: obj.get("name") + ' ' + counter++,
                    controlledby: obj.get("controlledby"),
                    left: obj.get("left")+70,
                    top: obj.get("top"),
                    width: obj.get("width"),
                    height: obj.get("height"),
                    //bar1_value: obj.get("bar1_value"),
                    //bar1_max: obj.get("bar1_max"),
                    showname: true,
                    //showplayers_name: true,
                    //showplayers_bar1: true,
                    imgsrc: obj.get("imgsrc"),
                    pageid: obj.get("pageid"),
                    represents: obj.get('represents'),
                    layer: "objects"
            });
        }, 1);
    }

    //********************************************

    jf.kill = function(msg){
        getSelectedToken(msg, function(token){
            token.set("status_dead", true);
            token.set('bar3_value', 0);
        })
    }

  
}(typeof jf === 'undefined' ? jf = {} : jf));

on("ready",function(){
    'use strict';
    jf.tools.RegisterTHandlers();
});

jf.monsterAsMinHp = true;