angular.module('CVGTool')

    .controller('navbarCtrl', ['$scope', '$state', 'loginSrvc' ,function ($scope, $state, loginSrvc) {
        $scope.user = {
          type: "",
          name: ""
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
          // TODO: Show navbar only when the user is logged in, also different options for normal user and admin
        };

        $scope.getUserInfo();
}]);
