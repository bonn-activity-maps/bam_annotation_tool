angular.module('CVGTool')

    /*
     * Controller of the "Login" view
     */
    .controller('loginCtrl', ['$scope', '$state', 'loginSrvc', function ($scope, $state, loginSrvc) {

          // Feedback handling variables
          $scope.errorMsg = "";
          $scope.successMsg = "";
          $scope.adminError = false;
          $scope.userError = false;

          // Login variables
          $scope.userName = "";
          $scope.adminPass = "";

          // Hide the error login message
          $scope.hideError = function () {
              $scope.errorMsg = "";
              $scope.adminError = false;
              $scope.userError = false;
              $scope.userName = "";
              $scope.adminPass = "";
          };

          // Callback function to show the error message for the admin login
          var showErrorAdmin = function (error) {
              $scope.errorMsg = error;
              $scope.adminError = true;
          };

          // Callback function to show the error message for the user login
          var showErrorUser = function (error) {
              $scope.errorMsg = error;
              $scope.userError = true;
          };

          // Callback function to redirect the user if the admin login worked
          var successRedirectAdmin = function () {
            $state.go('adminStatistics')
          };

          // Callback function to redirect the user if the user login worked
          var successRedirectUser = function () {
            $state.go('home')
          };

          // Function that makes the call to Login as an administrator
          $scope.adminLogin = function() {
            var password = $scope.adminPass;
            loginSrvc.adminLogin(password, successRedirectAdmin, showErrorAdmin);
          };

          // Function that makes the call to Login as an ordinary user
          $scope.userLogin = function() {
            var username = $scope.userName;
            loginSrvc.userLogin(username, successRedirectUser, showErrorUser);
          };

}]);
