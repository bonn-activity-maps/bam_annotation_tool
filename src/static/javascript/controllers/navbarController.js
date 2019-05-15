angular.module('CVGTool')

    .controller('navbarCtrl', ['$scope', '$state', 'navSrvc' ,function ($scope,$state, navSrvc) {
        $scope.user = {
          name: "",
          email: "",
          role: "",
          assignedTo: []
        };

        $scope.activeDataset = "";

        $scope.getUserInfo = function () {
            $scope.user = navSrvc.getUser();
            $scope.activeDataset = navSrvc.getActiveDataset();
        };

        $scope.loggedIn = function () {
          if ($state.current.name != 'login') {
            return true
          } else return false
        };

        $scope.logOut = function () {
          navSrvc.logout();
        };

        // Watcher that detects changes in the state to get the info
        var watcher = $scope.$watch(function(){
            return $state.$current.name
        }, function(newVal, oldVal){
            if (oldVal.localeCompare('login') == 0) {
              $scope.getUserInfo();
            }
        })

}]);
