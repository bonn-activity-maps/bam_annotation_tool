angular.module('CVGTool')

    .controller('navbarCtrl', ['$scope', '$state', 'navSrvc' ,function ($scope, $state, navSrvc) {
        $scope.user = {
          name: "",
          email: "",
          role: "",
          assignedTo: []
        };

        $scope.activeDataset;

        $scope.getUserInfo = function () {
            $scope.user = navSrvc.getUser();
            $scope.activeDataset = $scope.user.assignedTo[0];
        };

        $scope.loggedIn = function () {
          if ($state.current.name != 'login') {
            return true
          } else return false
        };

        $scope.logOut = function () {
          navSrvc.logout();
        };

        $scope.getUserInfo();
}]);
