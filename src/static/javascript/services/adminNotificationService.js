angular.module('CVGTool')

.factory('adminNotificationSrvc', ['navSrvc', '$state', '$http', '$httpParamSerializer', function(navSrvc, $state, $http, $httpParamSerializer) {
    return {
        updateNotificationState: function(notificationMessage, showNotification, callback) {
            $http({
                method: 'POST',
                url: '/api/notification/update',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    notificationMessage: notificationMessage,
                    showNotification: showNotification
                }
            }).then(function successCallback(response) {
                callback("success", "Notification state updated!")
            }, function errorCallBack(response) {
                callback("danger", "An error ocurred when updating the notification state!")
            });
        },

        obtainNotificationState: function(callbackSucces, callbackError) {
            $http({
                method: 'GET',
                url: '/api/notification/obtain',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                }
            }).then(function successCallback(response) {
                callbackSucces(response.data.msg)
            }, function errorCallBack(response) {
                callbackError("danger", "An error ocurred when requesting the notification state!")
            });
        }
    }
}]);