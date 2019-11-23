angular.module('CVGTool')

.factory('taskHomeSrvc', function($state, $http, $httpParamSerializer) {
    return {
        getFrameInfo: function (dataset, datasetType, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: '/api/frame/getFrameInfoOfDataset',
                headers: {
                    'dataset': dataset,
                    'datasetType': datasetType
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg)
            }, function errorCallback(response) {
                callbackError('danger', "Error while retrieving info from videos.")
            });
        },
    }
});