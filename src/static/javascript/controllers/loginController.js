angular.module('CVGTool')

    /*
     * Controller of the "Login" view
     */
    .controller('loginCtrl', ['$scope', '$state', 'loginSrvc', function ($scope, $state, loginSrvc) {

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
              $scope.userName = "";
              $scope.password = "";
          };

          // Callback function to show the error message
          var showError = function (error) {
              $scope.errorMsg = error;
              $scope.error = true;
          };

          // Callback function to redirect the user if the login worked
          var successRedirect = function (role) {
            if (role.localeCompare('None')) {
                $state.go('tool')
            } else {
                $state.go('adminStatistics')
            }
          };

          // Function to login
          $scope.login = function() {
              loginSrvc.login($scope.userName, $scope.password, successRedirect, showError);
          };
}]);
