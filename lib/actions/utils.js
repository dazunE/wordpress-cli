var fs = require('fs');
var fsExtra = require('fs-extra');
var _ =  require('lodash');
var request = require('request');
var unzip = require('unzip');
var mv = require('mv');
var shelljs = require('shelljs/shell');

require('string-prototype');

var env = require('../env');

function getFileContent(tplFp, tplParams) {
  var tplContent = Utils.readFileSync(tplFp);

  if (!tplParams) {
    return tplContent;
  }
  return _.template(tplContent)(tplParams);
}

var Utils = {
  getTemplatePath: function(fp) {
    return `${__dirname}/../templates/${fp}.tpl`;
  },

  getResourcePath: function(fp) {
    return `${__dirname}/../resources/${fp}`;
  },

  writeFileSync: function(targetFp, tplFp, tplParams) {
    var fileContent = getFileContent(tplFp, tplParams);
    fsExtra.outputFileSync(targetFp, fileContent);
  },

  readFileSync: function(fp, charset=null) {
    var content = fs.readFileSync(fp, charset);
    return content;
  },

  copyFileSync: function(srcFp, targetFp) {
    shelljs.cp('-R', srcFp, targetFp);
  },

  isFileExists: function(fp) {
    try {
      fs.lstatSync(fp);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return false;
      } else {
        throw err;
      }
    }

    return true;    
  },
  
  mkdirSync: function(dir) {
    try {
      fs.statSync(dir);
    } catch(err) {
      fs.mkdirSync(dir);
    }
  },

  moveDir: function(srcDir, targetDir, cb) {
    mv(srcDir, targetDir, { mkdirp: true }, function(err) {
      if (err) {
        cb(err, null);
        return;
      }
      cb(null, true);
    });
  },

  downloadFile: function(fileUrl, targetFp, cb) {
    request(
      {
        url: fileUrl,
        encoding: null
      },
      function(err, resp, body) {
        if (err) {
          cb(err, null);
          return;
        }
        
        if (resp && resp.statusCode == 200) {
          try {
            fs.writeFileSync(targetFp, body);
            cb(null, {fp: targetFp});
          } catch(err) {
            cb(err, null);
            return;
          }
        } else {
          cb({
            name: 'Error',
            message: 'Invalid URL'
          }, null);
        }
      }
    );
  },

  unzipFile: function(srcFp, targetDir, cb) {
    var stream = fs.createReadStream(srcFp)
      .pipe(unzip.Extract({ path: targetDir }));

    stream.on('error', function (err) {
      cb(err, null);
      return;
    });

    stream.on('finish', function () {
      cb(null, true)
    });    
  },

  unlinkSync: function(fp) {
    if (typeof fp === 'object') {
      fp.forEach(function(file) {
        fs.unlinkSync(file);
      });
    } else {
      fs.unlinkSync(fp);
    }
  },

  forceUnlink: function(fp) {
    if (typeof fp !== 'object') {
      return;
    }
    shelljs.rm('-rf', fp);
  },

  getWorkingDir: function() {
    return shelljs.pwd();
  }
};

module.exports = Utils;
