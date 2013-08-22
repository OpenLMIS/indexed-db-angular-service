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
        if (typeof successFunc === 'function') successFunc(e);
        if (!$rootScope.$$phase) $rootScope.$apply();
      };
      transaction.onerror = function (e) {
        if (typeof errorFunc === 'function') errorFunc(e);
        if (!$rootScope.$$phase) $rootScope.$apply();
      };
      return transaction;
    }

    function removeHashKey(data) {
      for (var key in data) {
        var item = data[key];
        if (key === '$$hashKey') delete data[key];
        if (typeof item == "object") {
          removeHashKey(item);
        }
      }
    }

    var get = function (objectStore, operationKey, onRequestSuccess, onRequestError, onTransactionSuccess,
                        onTransactionError) {
      execute(function (connection) {
        var transaction = getTransaction(connection, objectStore, "readonly", onTransactionSuccess, onTransactionError);
        var request = transaction.objectStore(objectStore).get(operationKey);
        request.onsuccess = function (e) {
          if (typeof onRequestSuccess === 'function') onRequestSuccess(e);
          if (!$rootScope.$$phase) $rootScope.$apply();
        };
        request.onerror = function (e) {
          if (typeof onRequestError === 'function') onRequestError(e);
          if (!$rootScope.$$phase) $rootScope.$apply();
        };
      });
    };

    var put = function (objectStore, data, onRequestSuccess, onRequestError, onTransactionSuccess, onTransactionError) {
      removeHashKey(data);
      execute(function (connection) {
        var transaction = getTransaction(connection, objectStore, "readwrite", onTransactionSuccess,
            onTransactionError);
        var request = transaction.objectStore(objectStore).put(data);
        request.onsuccess = function (e) {
          if (typeof onRequestSuccess === 'function') onRequestSuccess(e);
          if (!$rootScope.$$phase) $rootScope.$apply();
        };
        request.onerror = function (e) {
          if (typeof onRequestError === 'function') onRequestError(e);
          if (!$rootScope.$$phase) $rootScope.$apply();
        };
      });

    };

    return {
      execute: execute,
      get: get,
      put: put
    }

  }

});
