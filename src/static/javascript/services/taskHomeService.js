angular.module('CVGTool')

.factory('taskHomeSrvc', ['navSrvc', '$state', '$http', '$httpParamSerializer', function(navSrvc, $state, $http, $httpParamSerializer) {
    return {
        getFrameInfo: function (dataset, datasetType, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: '/api/frame/getFrameInfoOfDataset',
                headers: {
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg)
            }, function errorCallback(response) {
                callbackError('danger', "Error while retrieving info from videos.")
            });
        },
    }
}]);