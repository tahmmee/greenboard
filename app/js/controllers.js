//======TESTING=========
//var app = angular.module('greenboardControllers', ['greenboardServices']);
//======TESTING=========
var app = angular.module('greenboardControllers', ['greenboardDirectives', 'greenboardServices', 'ngSanitize']);


app.controller('InitDataCtrl', ['$scope', 'ViewService', 'Data', '$location', InitDataCtrl]);
app.controller('TimelineCtrl', ['$scope', 'ViewService', 'Data', '$location', TimelineCtrl]);
app.controller('SidebarCtrl', ['$scope', 'ViewService', 'Data', '$location', SidebarCtrl]);
app.controller('JobsCtrl', ['$scope', 'ViewService', 'Data', '$location', JobsCtrl]);
