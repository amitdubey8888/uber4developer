// Read Text File Start
var path = require('path');
var SomeHR = require('./src/SomeHR')();
require('colors');

module.exports = {
  parse:parse
}

function parse() {

  return new Promise((resolve, reject)=>{
    var getFileNames = function (filePaths) {
      return filePaths.map(function (file) {
        return path.basename(file);
      }).join(', ');
    };
    var pack = __dirname + '/public';
    SomeHR.iHaveCVPack(pack, function (err, files) {
      var Iam = this,
        ParseBoy,
        savedFiles = 0;
      if (err) {
        return Iam.explainError(err);
      }
      if (!files.length) {
        return Iam.nothingToDo();
      }
      ParseBoy = Iam.needSomeoneToSortCV();
      ParseBoy.willHelpWithPleasure(files, function (PreparedFile) {
        ParseBoy.workingHardOn(PreparedFile, function (Resume) {
          var jsonData = {
            name: Resume.parts.name,
            email: Resume.parts.email,
            phone: Resume.parts.phone,
            skills: Resume.parts.skills,
            technology: Resume.parts.technology,
            summary: Resume.parts.summary
          }
          resolve(jsonData);
        });
      });
    });
  });
}
// Read Text File End