angular.module('CVGTool')

    .controller('navbarCtrl', ['$scope', '$state', function ($scope, $state) {
        $scope.loggedIn = function () {
          if ($state.current.name != 'login') {
            return true
          } else return false
        };

        $scope.logOut = function () {
          // TODO: Implement logout when database is up
          // TODO: Show navbar only when the user is logged in, also different options for normal user and admin
        };
}]);
