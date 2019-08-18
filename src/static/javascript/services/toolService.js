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
        getFrame: function(fileName, frame, dataset, type, callbackSuccess) {
            $http({
                method: 'GET',
                url: '/api/dataset/getFrameVideo',
                headers: {
                    'fileName': fileName,
                    'frame': frame,
                    'dataset': dataset,
                    'type': type
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

        // Get all object UIDs with its types
        retrieveObjects: function(dataset, scene, user, callbackSuccess) {
            $http({
                mehtod: 'GET',
                url: '/api/annotation/getObjects',
                headers: {
                    'dataset': dataset,
                    'scene': scene,
                    'user': user
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg);
            }, function errorCallback(response) {
                console.log(response.data.msg);
            })
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
        getEpiline: function(frame, dataset, point, camera1, camera2, camera2Index, camera1Index, pointNumber, callbackSuccess) {
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
                callbackSuccess(response.data.msg, camera2Index, camera1Index, pointNumber);
            }, function errorCallback(response) {
                console.log(response.data.msg);
            })
        },

        // Retrieves the object defined by objectUid
        getAnnotationOfFrameByUID: function(user, dataset, scene, objectUid, frame, callbackSuccess) {
            $http({
                method: 'GET',
                url: "/api/annotation/getAnnotation/object",
                headers: {
                    "dataset": dataset,
                    "user": user,
                    "scene": scene,
                    "frame": frame,
                    "uidObject": objectUid
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg, frame);
            }, function errorCallback(response) {
                console.log(response);
            })
        },

        // Sends the 2D points to the server to triangulate and create the new 3D point
        updateAnnotation: function(user, dataset, scene, frame, object, point1, point2, point3, point4, camera1, camera2, camera3, camera4, callbackSuccess) {
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
                            cam2: camera2,
                            p3: point3,
                            cam3: camera3,
                            p4: point4,
                            cam4: camera4
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

        interpolate: function(user, dataset, scene, startFrame, endFrame, uidObject, frameArray, callbackSuccess) {
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
            }).then(function successCallback(response) {
                    callbackSuccess(uidObject, frameArray);
                },
                function errorCallback(response) {
                    console.log(response);
                })
        },

        // Get list of possible Actions
        getActivitiesList: function(dataset, callbackSuccess) {
            $http({
                method: 'GET',
                url: '/api/action/getActivities',
                headers: {
                    dataset: dataset
                }
            }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                },
                function errorCallback(response) {
                    console.log(response);
                })
        },

        // Create a new action
        createAction: function(user, startFrame, endFrame, activity, object, dataset, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/action/createAction',
                data: {
                    'user': user,
                    'dataset': dataset,
                    'name': activity,
                    'objectUID': object,
                    'startFrame': startFrame,
                    'endFrame': endFrame
                }
            }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                },
                function errorCallback(response) {
                    console.log(response);
                    callbackError(response.data.msg)
                })
        },

        // Fetch the list of all Actions in the frame
        getActions: function(user, startFrame, endFrame, dataset, callbackSuccess) {
            $http({
                method: 'GET',
                url: '/api/action/getActions',
                headers: {
                    'user': user,
                    'dataset': dataset,
                    'startFrame': startFrame,
                    'endFrame': endFrame
                }
            }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                },
                function errorCallback(response) {
                    console.log(response);
                })
        },

        // Fetch the list of all Actions of an Object in the frame
        getActionsByUID: function(user, objectUID, startFrame, endFrame, dataset, callbackSuccess) {
            $http({
                method: 'GET',
                url: '/api/action/getActionsByUID',
                headers: {
                    'user': user,
                    'dataset': dataset,
                    'objectUID': objectUID,
                    'startFrame': startFrame,
                    'endFrame': endFrame
                }
            }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                },
                function errorCallback(response) {
                    console.log(response);
                })
        },

        // Remove an action
        removeAction: function(name, user, objectUID, startFrame, endFrame, dataset, callbackSuccess) {
            $http({
                method: 'POST',
                url: '/api/action/removeAction',
                data: {
                    'name': name,
                    'user': user,
                    'dataset': dataset,
                    'objectUID': objectUID,
                    'startFrame': startFrame,
                    'endFrame': endFrame
                }
            }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                },
                function errorCallback(response) {
                    console.log(response);
                })
        }
    }
});