angular.module('CVGTool')

    .controller('loginCtrl', ['$scope', '$state', 'loginSrvc', function ($scope, $state, loginSrvc) {
          // Feedback handling variables
          $scope.errorMsg = "";
          $scope.successMsg = "";
          $scope.adminError = false;
          $scope.userError = false;

          // Hide the error login message
          $scope.hideError = function () {
              $scope.errorMsg = "";
              $scope.adminError = false;
              $scope.userError = false;
              $scope.userName = "";
              $scope.adminPass = "";
          };

          // Show the error login message
          var showErrorAdmin = function (error) {
              $scope.errorMsg = error;
              $scope.adminError = true;
          };

          var showErrorUser = function (error) {
              $scope.errorMsg = error;
              $scope.userError = true;
          };

          var successRedirectAdmin = function () {
            $state.go('adminStatistics')
          };

          var successRedirectUser = function () {
            $state.go('home')
          };

          // Log in variables
          $scope.userName = "";
          $scope.adminPass = "";

          $scope.adminLogin = function() {
            var password = $scope.adminPass;
            loginSrvc.adminLogin(password, successRedirectAdmin, showErrorAdmin);
          };

          $scope.userLogin = function() {
            $state.go('admin');
          };

}]);
