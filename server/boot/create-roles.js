'use strict';
module.exports = function(server) {
  const Role = server.models.Role;
  let appRoles = ['client', 'freelancer','admin'];
  appRoles.forEach((appRole) => {
    Role.findOne({where:{'name': appRole}},function(err, role) {
        if(role == null){
            Role.create({
                name: appRole,
            }, function(err, role) {
                if (err)
                    console.log(err);
                else
                    console.log('ROLE CREATED = ', role);
            });
        }else {
            console.log('ROLE ' + role + ' ALREADY EXISTS');
        }
    });
  });
};
