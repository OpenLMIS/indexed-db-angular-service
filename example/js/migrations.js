var migrationFunc = function (event) {
  var connection = event.currentTarget.result;

  var dropDatastores = function () {
    $(connection.objectStoreNames).each(function (index, objectStore) {
      connection.deleteObjectStore(objectStore);
    });
  };

  if (!event.oldVersion || event.oldVersion < 2) {
    dropDatastores();
    createSampleStore();
  }

  function createSampleStore() {
    var distributionStore = connection.createObjectStore("sample", {"keyPath": "id", autoIncrement: true});
    distributionStore.createIndex("index_code", "code", {"unique": true});
  }
};