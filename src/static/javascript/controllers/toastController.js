angular.module('CVGTool')
    /*
     * Controller of the Toast/snackbar element
     * Available notification types: primary, secondary, success, danger, warning, info, light, dark
     * Special message: loading, finish
     * */
    .controller('toastCtrl', ['$scope', '$rootScope', '$state', 'ngToast', function($scope, $rootScope, $state, ngToast) {

        // Event handler
        $scope.$on('sendMsg', function(evt, data) {

            if (data.type === 'loading') {
                $scope.loadingToast(data.msg)
            } else if (data.type === 'finish') {
                $scope.finishToast(data.msg)
            } else {
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
                dismissButton: true,
                animation: 'slide'
            });
        };

        $scope.loadingToast = function(msg) {
            $scope.loadToast = ngToast.create({
                content: msg,
                className: 'info',
                dismissOnTimeout: false,
                dismissButton: false
            });
            // $scope.loadToast.create()
        };

        $scope.finishToast = function(msg) {
            ngToast.dismiss($scope.loadToast);
            ngToast.create({
                content: msg,
                className: 'info',
                dismissOnTimeout: true,
                timeout: 3000,
                dismissButton: true
            });
        };


    }]);