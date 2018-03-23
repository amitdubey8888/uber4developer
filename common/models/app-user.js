'use strict';

module.exports = function(AppUser) {
    AppUser.observe('after save', function(ctx, next) {
        var inst = ctx.instance ;
        var RoleMapping = AppUser.app.models.RoleMapping;
        var Role = AppUser.app.models.Role;
      Role.findOne({where:{name: inst.role}}, function(err, role) {
        if (err){
            console.log(err);
            next(err);
        } else if (role == null) {
            next() ;
        } else {
            role.principals.create({
                principalType: RoleMapping.USER,
                principalId: inst.id,
            }, function(err, principal) {
                console.log(err, principal);
                if(inst.role == "client"){
                    var Client = AppUser.app.models.Client ;
                    var clientObj = {} ;
                    clientObj.userId = inst.id ;
                    Client.create(clientObj,(err, clientInst) => {
                        if(err){
                            console.log(err);
                            next(err) ;
                        }
                    }) ;
                }else if(inst.role == ""){
                    var Freelancer = AppUser.app.models.Freelancer ;
                    var flObj = {} ;
                    flObj.userId = inst.id ;
                    Freelancer.create(flObj,(err, flInst) => {
                        if(err){
                            console.log(err);
                            next(err) ;
                        }
                    }) ;
                }
                next() ;
            });
        }
      });
    });
};
