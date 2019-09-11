angular.module('CVGTool')
    /*
     * Controller of the Toast/snackbar element
     */
    .controller('toastCtrl', ['$scope', '$rootScope', '$state', '$mdToast', function($scope, $rootScope, $state, $mdToast) {

        //event handler
        $rootScope.$on("sendMsg", function (evt, data) {
            $scope.msg = "Inside MyController3 : " + data;
            console.log($scope.msg)
            console.log('toast')
        });

        // $scope.openToast = function($event) {
        //     $mdToast.show($mdToast.simple().textContent('Hello!'));
        //     // Could also do $mdToast.showSimple('Hello');
        // };

    }]);