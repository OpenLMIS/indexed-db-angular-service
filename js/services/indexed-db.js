/*
 * This program is part of the OpenLMIS logistics management information system platform software.
 * Copyright © 2013 VillageReach
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *  
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License along with this program.  If not, see http://www.gnu.org/licenses.  For additional information contact info@OpenLMIS.org. 
 */

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
        if (key === '$$hashKey') delete item;
        if (typeof item == "object") {
          removeHashKey(item);
        } else if(typeof item === "string") item = item.trim();
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
