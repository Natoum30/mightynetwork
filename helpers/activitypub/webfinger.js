module.exports.isResourceValid = function(value) {

    var exists = function(value) {
      return value !== undefined && value !== null;
    };
  
    if (!exists(value)) return false;
    if (value.startsWith('acct:') === false) return false;
  
    var actorWithHost = value.substr(5);
    var actorParts = actorWithHost.split('@');
  
    if (actorParts.length !== 2) return false;
  
    //  return sanitizeHost(host, REMOTE_SCHEME.HTTP) === CONFIG.WEBSERVER.HOST;
  };
  