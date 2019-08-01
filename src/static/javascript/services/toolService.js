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
                callbackSuccess(response.data.msg.image, response.data.msg.filename, response.data.msg.frame);
            }, function errorCallback(response) {
                console.log(response.data.msg)
            });
        },

        // Gets the annotations of a frame, from a video, a dataset and a user
        getAnnotationOfFrame: function(scene, frame, dataset, user, callbackSuccess) {
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

        // Projects "points" into the camera "cameraName" for the frame "frame"
        projectToCamera: function(uid, type, points, frame, cameraName, dataset, canvasNumber, callbackSuccess) {
            $http({
                method: 'GET',
                url: '/api/aik/projectToCamera',
                headers: {
                    'points': JSON.stringify(points),
                    'frame': frame,
                    'cameraName': cameraName,
                    'dataset': dataset
                }
            }).then(function successCallback(response) {
                callbackSuccess(canvasNumber, uid, type, frame, response.data.msg)
            }, function errorCallback(response) {
                console.log(response.data.msg);
            })
        },

        // Get Epipolar line
        getEpiline: function(frame, dataset, point, camera1, camera2, camera2Index, camera1Index, callbackSuccess) {
            $http({
                method: 'GET',
                url: '/api/aik/computeEpiline',
                headers: {
                    'point': JSON.stringify(point),
                    'frame': frame,
                    'cam1': camera1,
                    'cam2': camera2,
                    'dataset': dataset
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg, camera2Index, camera1Index);
            }, function errorCallback(response) {
                console.log(response.data.msg);
            })
        },

        // Sends the 2D points to the server to triangulate and create the new 3D point
        updateAnnotation: function(user, dataset, scene, frame, object, point1, point2, camera1, camera2, callbackSuccess) {
            $http({
                method: 'POST',
                url: '/api/annotation/updateAnnotation',
                data: {
                    'user': user,
                    'dataset': dataset.name,
                    'datasetType': dataset.type,
                    'scene': scene,
                    'frame': frame,
                    'objects': {
                        uid: object.uid,
                        type: object.type,
                        keypoints: [{
                            p1: point1,
                            cam1: camera1,
                            p2: point2,
                            cam2: camera2
                        }]
                    }
                }
            }).then(function successCallback(response) {
                callbackSuccess(object.uid, object.type, frame);
            }, function errorCallback(response) {
                console.log(response)
            })
        },

        // Create new object
        createNewObject: function(user, dataset, scene, type, frame, callbackSuccess) {
            $http({
                    method: 'POST',
                    url: '/api/annotation/createNewUidObject',
                    data: {
                        'user': user,
                        'dataset': dataset,
                        'scene': scene,
                        'type': type,
                        'frame': frame
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg.maxUid, type)
                }),
                function errorCallback(response) {
                    console.log(response);
                }
        },

        interpolate: function(user, dataset, scene, startFrame, endFrame, uidObject, callbackSuccess) {
            $http({
                    method: 'POST',
                    url: "/api/annotation/interpolate",
                    data: {
                        'user': user,
                        'dataset': dataset,
                        'scene': scene,
                        'startFrame': startFrame,
                        'endFrame': endFrame,
                        'uidObject': uidObject
                    }
                }).then(function successCallback(repsonse) {
                    callbackSuccess();
                }),
                function errorCallback(response) {
                    console.log(response);
                }
        }
    }
});