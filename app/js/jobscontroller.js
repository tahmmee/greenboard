
var JobsCtrl = function ($scope, ViewService, Data, $location){

    $scope.data = Data;
    $scope.jobsPending = 0;
    $scope.jobsCompleted = 0;
    $scope.$watch('data.refreshJobs', function(newVal, oldVal){

        // update timeline when data has been updated
        if (newVal  == true){
            displayJobs();
            Data.refreshJobs = false;
        }

    });

    $scope.nameSort = function(el){
        return el.name;
    };

    $scope.predicate = $scope.nameSort;

    function displayJobs(){
      if($scope.runningJobs){ return; } // already running

      $scope.runningJobs = true;
      var build = Data.selectedBuildObj.Version;
      $scope.jobs = [];
      $scope.missingJobs = [];
      $scope.failedJobs = [];
      $scope.unstableJobs = [];
      var dupeChecker = {};
      $scope.testsPassed = 0;
      $scope.testsTotal = 0;
      $scope.failedJobsCount = 0;
      $scope.unstableJobsCount = 0;

      var pushToJobScope = function(response, ctx, isMissingScope, failedCtx, unstableCtx){
            response.forEach(function(job){
                if (job.Bid == -1){
                  job.Bid = "";
                }
                // no double reporting
                if (job.Name in dupeChecker){
                    return;
                }
                if(job.Url.indexOf("macbuild") > -1){
                   job.Url = "https://macbuild.hq.couchbase.com/"
                   job.Bid = "" 
                }

                dupeChecker[job.Name] = true;

                ctx.push({
                   "name": job.Name,
                   "passed": job.Passed,
                   "total": job.Total,
                   "result": job.Result,
                   "priority": job.Priority,
                   "url": job.Url,
                   "bid": job.Bid,
                   "duration": msToTime(job.Duration),
                   "claim": job.Claim
                });
                if (failedCtx != null) {
                  if (job.Result == "FAILURE") {
                    failedCtx.push({
                      "name": job.Name,
                      "passed": job.Passed,
                      "total": job.Total,
                      "result": job.Result,
                      "priority": job.Priority,
                      "url": job.Url,
                      "bid": job.Bid,
                      "duration": msToTime(job.Duration),
                      "claim": job.Claim
                    });
                  }
                }
               if (unstableCtx != null) {
                  if (job.Result == "UNSTABLE") {
                    unstableCtx.push({
                      "name": job.Name,
                      "passed": job.Passed,
                      "total": job.Total,
                      "result": job.Result,
                      "priority": job.Priority,
                      "url": job.Url,
                      "bid": job.Bid,
                      "duration": msToTime(job.Duration),
                      "claim": job.Claim
                    });
                  }
                }

              if(isMissingScope){
                    $scope.testsPending += job.Total;
                } else {
                    $scope.testsPassed += job.Passed;
                    $scope.testsTotal += job.Total;
                }
            });
      }

      var urlArgs = $location.search();
      var platforms = [];
      var categories = [];
      if ("excluded_platforms" in urlArgs){
        platforms = urlArgs.excluded_platforms.split(",");
      }
      if ("excluded_categories" in urlArgs){
        categories = urlArgs.excluded_categories.split(",")
      }

      ViewService.jobs(build, platforms, categories).then(function(response){
        pushToJobScope(response, $scope.jobs, false, $scope.failedJobs, $scope.unstableJobs);
        $scope.jobsCompleted = $scope.jobs.length;
        $scope.failedJobsCount = $scope.failedJobs.length;
        $scope.unstableJobsCount = $scope.unstableJobs.length;

          ViewService.jobs_missing(build, platforms, categories).then(function(response){
            $scope.testsPending = 0;
            pushToJobScope(response, $scope.missingJobs, true, null, null);
            $scope.jobsPending = $scope.missingJobs.length;
            $scope.runningJobs = false;
          });
      });

    }

};

// https://coderwall.com/p/wkdefg/converting-milliseconds-to-hh-mm-ss-mmm
function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
}
