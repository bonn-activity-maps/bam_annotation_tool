angular.module('CVGTool')

    /*
     * Controller of the "Login" view
     */
    .controller('loginCtrl', ['$scope', '$state', 'loginSrvc', 'navSrvc', function ($scope, $state, loginSrvc, navSrvc) {

          // Feedback handling variables
          $scope.errorMsg = "";
          $scope.successMsg = "";
          $scope.error = false;

          // Login variables
          $scope.userName = "";
          $scope.password = "";

          // Hide the error login message
          $scope.hideError = function () {
              $scope.errorMsg = "";
              $scope.error = false;
              $scope.password = "";
          };

          // Callback function to show the error message
          var showError = function (error) {
              $scope.errorMsg = error;
              $scope.error = true;
          };

          // Callback function to redirect the user if the login worked
          var successRedirect = function (user) {
            navSrvc.setUser(user);
            if (user.role.localeCompare('user') == 0) {
                $state.go('taskHome');
            } else {
                $state.go('adminStatistics');
            }
          };

          // Function to login
          $scope.login = function() {
              loginSrvc.login($scope.userName, $scope.password, successRedirect, showError);
          };
}]);
