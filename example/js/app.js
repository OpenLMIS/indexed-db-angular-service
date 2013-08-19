angular.module('indexedDbExample', ['IndexedDB']).config(function (IndexedDBProvider) {
  IndexedDBProvider
    .setDbName('SampleDatabase')
    .migration(2, migrationFunc);
});