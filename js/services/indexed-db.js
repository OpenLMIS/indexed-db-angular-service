angular.module('IndexedDB', []).provider('IndexedDB', function () {

  var thisService = this;
  var db, onUpgrade, version;

  thisService.setDbName = function (name) {
    db = name;
    return thisService;
  };

  thisService.migration = function (newVersion, upgradeFunction) {
    onUpgrade = upgradeFunction;
    version = newVersion;
    return thisService;
  };

  this.$get = function ($rootScope, $q) {

    var deferred = $q.defer();
    var request = indexedDB.open(db, version);
    var indexedDBConnection = null;

    request.onupgradeneeded = function (e) {
      onUpgrade(e);
      console.log(db + " database version upgraded");
    };

    request.onsuccess = function (event) {
      indexedDBConnection = event.currentTarget.result;
      deferred.resolve();
      if (!$rootScope.$$phase) $rootScope.$apply();
    };


    var execute = function (transactionFunction) {
      if (!indexedDBConnection) {
        deferred.promise.then(function () {
          transactionFunction(indexedDBConnection);
        });
      } else {
        transactionFunction(indexedDBConnection);
      }
    };

    function getTransaction(connection, objectStore, mode, successFunc, errorFunc) {
      var transaction = connection.transaction(objectStore, mode);
      transaction.oncomplete = function (e) {
        if (successFunc) successFunc(e);
        if (!$rootScope.$$phase) $rootScope.$apply();
      };
      transaction.onerror = function (e) {
        if (errorFunc) errorFunc(e);
        if (!$rootScope.$$phase) $rootScope.$apply();
      };
      return transaction;
    }

    var get = function (objectStore, operationKey, successFunc, errorFunc) {
      execute(function (connection) {
        var transaction = getTransaction(connection, objectStore, "readonly", successFunc, errorFunc);
        transaction.objectStore(objectStore).get(operationKey);
      });
    };

    var put = function (objectStore, data, successFunc, errorFunc) {
      execute(function (connection) {
        var transaction = getTransaction(connection, objectStore, "readwrite", successFunc, errorFunc);
        transaction.objectStore(objectStore).put(data);
      });

    };

    return {
      execute: execute,
      get: get,
      put: put
    }

  }

});
