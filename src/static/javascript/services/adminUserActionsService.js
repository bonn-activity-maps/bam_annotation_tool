angular.module('CVGTool')

    .factory('adminUserActionsSrvc', ['navSrvc', '$state', '$http', '$httpParamSerializer', function(navSrvc, $state, $http, $httpParamSerializer) {

        return {
            getUserActions: function (dataset, datasetType, callbackSuccess, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/userAction/getUserActions',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken(),
                        'dataset': dataset,
                        'datasetType': datasetType
                    }
                }).then(function successCallback(response) {
                    if (response.data.msg.length === 0) {
                        callbackSuccess([])
                    } else {
                        callbackSuccess(response.data.msg)
                    }
                }, function errorCallBack(response) {
                    callbackError('danger', response.data.msg);
                });
            }
        }
    }]);
