angular.module('CVGTool')

.controller('adminNotificationCtrl', ['$scope', '$rootScope', 'adminNotificationSrvc', function($scope, $rootScope , adminNotificationSrvc) {
    $scope.notificationValues = {
        notificationMessage: "",
        showNotification: false
    }

    function MessagesManager() {
        var _this = this;

        // FUNCTIONS //
        _this.sendMessage = function(type, msg) {
            $rootScope.$broadcast('sendMsg', { 'type': type, 'msg': msg });
        };
    }

    $scope.messagesManager = new MessagesManager();

    $scope.obtainNotificationState = function() {
        var callbackSuccess = function(response) {
            $scope.notificationValues.notificationMessage = response.notificationMessage;
            $scope.notificationValues.showNotification = response.showNotification;
        }

        adminNotificationSrvc.obtainNotificationState(callbackSuccess, $scope.messagesManager.sendMessage);
    }

    $scope.updateNotificationState = function() {
        adminNotificationSrvc.updateNotificationState($scope.notificationValues.notificationMessage, $scope.notificationValues.showNotification, $scope.messagesManager.sendMessage)
    }

    $scope.obtainNotificationState();

}]);