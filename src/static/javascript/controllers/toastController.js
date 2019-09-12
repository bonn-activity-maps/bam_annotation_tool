angular.module('CVGTool')
    /*
     * Controller of the Toast/snackbar element
     */
    .controller('toastCtrl', ['$scope', '$rootScope', '$state', 'ngToast', function($scope, $rootScope, $state, ngToast) {

        // Event handler
        $scope.$on('sendMsg', function (evt, data) {

            if (data.type === 'loading') {
                $scope.loadingToast(data.msg)
            } else{
                $scope.openToast(data.type, data.msg)
            }
        });

        // Create toast with type and msg, with close button
        $scope.openToast = function(type, msg) {
            ngToast.create({
                content: msg,
                className: type,
                dismissOnTimeout: true,
                timeout: 3000,
                dismissButton: true
            });
        };

        $scope.loadingToast = function(msg) {
            ngToast.create({
                content: msg,
                className: type,
                dismissOnTimeout: false,
                dismissButton: true
            });
        };

        //
        // $scope.openToast = function(msg) {
        //     $mdToast.show($mdToast.simple().textContent(msg).position(ctrl.toastPosition));
        //     // Could also do $mdToast.showSimple('Hello');
        // };


        //
        // $scope.warning = function(msg) {
        //     ngToast.warning(msg);
        // };
        //
        // $scope.error = function(msg) {
        //     ngToast.danger(msg);
        // };

    }]);