
var InitDataCtrl = function ($scope, ViewService, Data, $location){


  Data.init();

  var selectedVersion = null;
  var selectedBuildObj = null;
  var urlArgs = $location.search();
  function initFilters(){

    $scope.filterMenues = [{
        "title": "Total Passed",
        "key": "abspassed",
        "value": 100,
        "options": [0, 50, 100, 500],
        "i": 0
      }, {
        "title": "Total Failed",
        "key": "absfailed",
        "value": 25,
        "options": [0, 10, 25, 50],
        "i": 1
      }, {
        "title": "Perc. Passed",
        "key": "percpassed",
        "value": 75,
        "options": [0, 25, 50, 75],
        "i": 2
      }, {
        "title": "Perc. Failed",
        "key": "percfailed",
        "value": 10,
        "options": [0, 10, 25, 50],
        "i": 3
      }
    ];

    // filters
    $scope.filterBy = $scope.filterMenues[0];
  }

  function initTargets(){

    $scope.viewTargets = [{
        "title": "Couchbase Server",
        "bucket": "server",
        "key": "abspassed",
        "value": 100,
        "options": [0, 50, 100, 500],
        "i": 0
      }, {
        "title": "Mobile",
        "bucket": "mobile",
        "key": "abspassed",
        "value": 100,
        "options": [0, 50, 100, 500],
        "i": 1
      }/*, {
        "title": "SDK Tools",
        "bucket": "sdk",
        "key": "abspassed",
        "value": 100,
        "options": [0, 50, 100, 500],
        "i": 2
      }*/
    ];

    // filters
    $scope.targetBy = $scope.viewTargets[0];
  }

  // pull version and build from urlArgs
  if ("version" in urlArgs){
    selectedVersion = urlArgs.version;
  }



  // next version selector
  var nextVersion = function(version){
      var next;
      var idx = Data.versions.indexOf(version);
      if ((idx > -1) && (idx < (Data.versions.length - 1))){
          next = Data.versions[idx + 1];
      }
      return next;
  }

  initFilters();
  initTargets();

  // pull filter values from urlArgs
  if (("fi" in urlArgs) && ("fv" in urlArgs)){
    $scope.filterBy = $scope.filterMenues[urlArgs.fi];
    $scope.filterBy.value = urlArgs.fv;
  }

  // init controller data
  var selectVersion = function(){
      return ViewService.versions().then(function(versions){
        Data.versions = versions;
        $scope.pagerVersions = versions;
        if (selectedVersion){
          Data.selectedVersion = selectedVersion;
        } else {
          Data.selectedVersion = versions[versions.length - 1];
        }

        $scope.selectedVersion = Data.selectedVersion;
      });
  };

  var initVersionBuild = function(){

    // get builds for version
    var filterBy = $scope.filterBy;
    var selectedVersion = Data.selectedVersion;
    var endVersion = nextVersion(selectedVersion);
    return ViewService.timeline(selectedVersion, filterBy, endVersion).then(function(response){

      if (response.allBuilds.length > 0 && response.versionBuilds.length == 0){

          // try a lower filter when data exists but is being excluded
          var options = $scope.filterBy.options;
          var filterIdx = options.indexOf($scope.filterBy.value);
          if (filterIdx > 0){
            $scope.filterBy.value = options[filterIdx - 1];
            $location.search("fv", $scope.filterBy.value);
            return initVersionBuild(); // re-init
          }
      }

      Data.timelineAbsData = response.absData;
      Data.timelineRelData = response.relData;
      Data.versionBuilds = response.versionBuilds;
      if ("build" in urlArgs){
        Data.selectedBuildObj = Data.findBuildObj(urlArgs.build);
      } else {
        Data.selectedBuildObj = Data.lastVersionBuild();
      }
    });
  };

  var updateLocation = function(){
    $location.search("version", Data.selectedVersion);
    $location.search("build", Data.selectedBuildObj.Version);
    $location.search("fi", $scope.filterBy.i);
    $location.search("fv", $scope.filterBy.value);
  }


  var initData = function(){
    initVersionBuild()
        .then(function(){
            updateLocation();
            Data.refreshSidebar = true;
            Data.refreshTimeline = true;
            Data.refreshJobs = true;
        });
  }

  var clearPlatformCategories = function(){
      $location.search("excluded_platforms", null);
      $location.search("excluded_categories", null);
  }

  // pagination controls
  $scope.didSelectVersion = function(version){
      Data.init();
      clearPlatformCategories();
      Data.selectedVersion = version;
      $scope.selectedVersion = version;
      initData();
  };
  $scope.didSelectFilter = function(value){
    // change filter.by value  and update timeline
    $scope.filterBy.value = value;
    clearPlatformCategories();
    initData();

  };
  $scope.didSelectMenu = function(menu){
    // change filter.by menu and update timeline
    $scope.filterBy = menu;
    initData();
  };

  $scope.didSelectTarget = function(target){
    $scope.targetBy = target;
    Data.bucket = target.bucket;
    main();
  };

  // main
  function main(){
      selectVersion()
        .then(initData);
  }

  main();
};

