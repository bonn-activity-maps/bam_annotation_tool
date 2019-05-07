angular.module('CVGTool')

    .controller('navbarCtrl', ['$scope', '$state', 'loginSrvc' ,function ($scope, $state, loginSrvc) {
        $scope.user = {
          name: "",
          email: "",
          role: "",
          assignedTo: []
        };

        $scope.getUserInfo = function () {
            $scope.user = loginSrvc.getUser();
        };
        
        $scope.loggedIn = function () {
          if ($state.current.name != 'login') {
            return true
          } else return false
        };

        $scope.logOut = function () {
          loginSrvc.logout();
        };

        $scope.getUserInfo();
}]);
