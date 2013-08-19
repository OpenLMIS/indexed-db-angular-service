function AppSetupController(IndexedDB) {
  this.save = function () {
    IndexedDB.put("sample", this.sample, function () {
      console.log("Updated!")
    }, function () {
      console.log("Failed");
    });
  }
}
