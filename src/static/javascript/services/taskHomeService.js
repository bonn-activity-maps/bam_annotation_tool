angular.module('CVGTool')

.factory('taskHomeSrvc', function($state, $http, $httpParamSerializer) {
    return {
        getFrameInfo: function (dataset, video, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: '/api/video/getFrameInfoOfVideo',
                headers: {
                    'dataset': dataset,
                    'video': video
                }
            }).then(function successCallback(response) {
                if (response.data.msg.length === 0) {
                    callbackSuccess([], video)
                } else {
                    callbackSuccess(response.data.msg, video)
                }
            }, function errorCallback(response) {
                callbackError('danger', "Error while retrieving info from videos.")
            });
        },
    }
});