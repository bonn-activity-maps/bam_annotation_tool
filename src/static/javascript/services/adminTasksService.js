angular.module('CVGTool')

.factory('adminTasksSrvc', ['navSrvc', '$state', '$http', '$httpParamSerializer', function(navSrvc, $state, $http, $httpParamSerializer) {
    return {
        getUsersByDataset: function(dataset, role, callbackSuccess) {
            $http({
                method: 'GET',
                url: '/api/user/getUsersByDataset',
                headers: {
                    dataset: dataset,
                    role: role,
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                }
            }).then(function successCallback(response) {
                if (response.data.msg.length === 0) {
                    callbackSuccess([])
                } else {
                    callbackSuccess(response.data.msg)
                }
            }, function errorCallBack(response) {
                console.log(response.data.msg)
            });
        },

        getDatasets: function(callback) {
            $http({
                method: 'GET',
                url: '/api/dataset/getDatasets',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                }
            }).then(function successCallback(response) {
                callback(response.data.msg);
                console.log("Successfully retrieved list of users")
            }, function errorCallback(response) {
                console.log(response.data.msg)
            });
        },
    }
}]);