var JF = JF || {};

JF.monsterAsMinHp = true;  // Token ne peut avoir moins d'hp que le hp moyen

JF.executeCommand = function(cmd, tokens)
{
    //log(tokens);
    var resultat = "";
    switch(cmd)
    {
        case 'range':
            JF.getDistance(tokens); break;
        case 'hp':
            JF.rollHp(tokens); break;
        case 'xp':
            JF.getXp(tokens); break;
        case 'kill':
            JF.kill(tokens); break;
            
        default: 
            resultat = cmd + ": commande invalide";
    }
}

JF.rollHp = function(tokens){
    
    if(tokens.length == 0)
        return "Aucun token selectionné";
    
    _.each(tokens, function (obj) {
        if(obj.get('subtype') == 'token' 
            && obj.get('represents') != ''
            && obj.get('bar3_link') == ''
            //&& obj.get('bar3_max') == ''
        )
        {   
            var hd = getAttrByName(obj.get('represents'), 'npc_HP_hit_dice', 'current');
            
            if(hd == '')
            {
                sendChat('JF', 'Hit dice non défini');
                return;
            }
            
            var mod = getAttrByName(obj.get('represents'), 'npc_constitution', 'current');            
            mod = (mod - 10) / 2; 
            
            var roll = 0;
            var nbHd = 1;
            
            sendChat("GM", "/roll " + hd, function(ops) {
                var rollResult = JSON.parse(ops[0].content);
                if(_.has(rollResult,'total'))
                {
                    roll = rollResult.total;
                    nbHd = rollResult.rolls[0].dice;
                    
                    var hp = nbHd * mod + roll;
                    
                    if(JF.monsterAsMinHp == true)
                    {
                        nbFace = rollResult.rolls[0].sides;
                        var min = Math.floor(((nbFace + 1) / 2 + mod) * nbHd);
                        if(min > hp)
                        hp = min;
                    }
                    
                    obj.set({bar3_value: hp,bar3_max: hp})
                }
            });
        }
        else {
            return 'Token pas valide';
        }
    });
};

JF.getDistance = function(tokens){
    if(tokens.length != 2)    
        return "2 token doivent etre sélectionné."
        
    var page = getObj("page", tokens[0].get("pageid"));
    var scale = page.get("scale_number");
    
    var rawDistance = Math.sqrt(
        Math.pow(tokens[0].get('left') - tokens[1].get('left'), 2) + 
        Math.pow(tokens[0].get('top') - tokens[1].get('top'), 2)
    );
    
    rawDistance =Math.round(rawDistance / (70 / scale));
    sendChat('JF Tool', rawDistance.toString());
};

JF.getXp = function(tokens){

    if(tokens.length == 0)
        return "Aucun token selectionné";
    
    var total = 0;
        
    _.each(tokens, function (obj) {
        var xp = getAttrByName(obj.get('represents'), 'npc_xp', 'current');
        total = total + parseInt(xp);
    });
    
    sendChat('JF Tool', 'Xp total: ' + total);
};

JF.kill = function(tokens){

    if(tokens.length == 0)
        return "Aucun token selectionné";
        
    _.each(tokens, function (obj) {
        obj.set("status_dead", true);
        obj.set('bar3_value', 0);
    });
    
    //sendChat('JF Tool', 'Xp total: ' + total);
};

on("chat:message", function (msg) {
    
    if(msg.type != "api") return;
        
    var content = msg.content.trim().toLowerCase();    
    
    if(content.indexOf('!jf') != 0) return;
    if(content.indexOf('!jf ') != 0) 
    {
        sendChat('JFTools', "Aucun argument spécifié");
        return;
    }
    
    var counter=0;
    var tokens = new Array();
    
    _.each(msg.selected, function (obj) {
        var tmp = getObj('graphic', obj._id);
        if(tmp.get("subtype") == 'token') 
        {
            tokens[counter++] = tmp;
        }
    });
    
    var command = content.split(" ", 2)[1];
   
    JF.executeCommand(command, tokens);
});

on("ready", function() 
{    
    on("add:graphic", function(obj) {
        JF.rollHp([obj]);
    });
});

