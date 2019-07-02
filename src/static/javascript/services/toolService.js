angular.module('CVGTool')

.factory('toolSrvc', function($state, $http, $httpParamSerializer) {

    return {
        // Gets the information of all the available videos of a dataset
        getInfoOfVideos: function(callbackSuccess, dataset) {
            $http({
                method: 'GET',
                url: '/api/dataset/getVideos',
                headers: {
                    'dataset': dataset
                }
            }).then(function successCallback(response) {
                if (response.data.msg.length === 0) {
                    callbackSuccess([])
                } else {
                    callbackSuccess(response.data.msg)
                }
            }, function errorCallback(response) {
                console.log(response.data.msg);
            });
        },

        // Gets the image of a frame, from a video and a dataset
        getFrame: function(fileName, frame, dataset, callbackSuccess) {
            $http({
                method: 'GET',
                url: '/api/dataset/getFrameVideo',
                headers: {
                    'fileName': fileName,
                    'frame': frame,
                    'dataset': dataset
                }
            }).then(function successCallback(response) {
                console.log(response.data.msg)
                callbackSuccess(response.data.msg.image, response.data.msg.filename, response.data.msg.frame);
            }, function errorCallback(response) {
                console.log(response.data.msg)
            });
        },

        // Gets the annotations of a frame, from a video, a dataset and a user
        getAnnotationOfFrame: function(scene, frame, dataset, user, callbackSuccess) {
            user = "root"; // TODO: remove this when tasks exist
            $http({
                    method: 'GET',
                    url: '/api/annotation/getAnnotation',
                    headers: {
                        'scene': scene,
                        'frame': frame,
                        'dataset': dataset,
                        'user': user
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                }),
                function errorCallback(response) {
                    console.log(response)
                }
        },

        // Gets all the available objects types: Person, microwave, etc
        retrieveAvailableObjectTypes: function(datasetType, callbackSuccess) {
            $http({
                method: 'GET',
                url: '/api/objectType/getObjectTypes',
                headers: {
                    'datasetType': datasetType
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg);
            }, function errorCallback(response) {
                console.log(response.data.msg);
            });
        },
    }
});