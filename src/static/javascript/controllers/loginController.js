angular.module('CVGTool')

    .controller('loginCtrl', ['$scope', '$state', 'loginSrvc', function ($scope, $state, loginSrvc) {

    function adminLogIn() {
      // TODO: User auth
    };

    function userLogIn() {
      $state.go('admin');
    };

}]);
