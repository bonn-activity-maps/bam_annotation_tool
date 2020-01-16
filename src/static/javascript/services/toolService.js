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
        getFrame: function(fileName, frame, dataset, type, callbackSuccess, callbackError) {
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
                callbackError('danger', response.data.msg)
            });
        },

        // Gets the image of a frame range, from a video and a dataset
        getFrames: function(fileName, frameStart, frameEnd, dataset, datasetType, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: '/api/dataset/getFramesVideo',
                headers: {
                    'video': fileName,
                    'startFrame': frameStart,
                    'endFrame': frameEnd,
                    'dataset': dataset,
                    'datasetType': datasetType
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg);
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg)
            });
        },

        // Gets the annotations of a frame range, from a video, a dataset and a user
        getAnnotationsByFrameRange: function(scene, datasetType, frameStart, frameEnd, dataset, user, callbackSuccess, callbackError) {
            $http({
                    method: 'GET',
                    url: '/api/annotation/getAnnotationsByFrameRange',
                    headers: {
                        'scene': scene,
                        'startFrame': frameStart,
                        'endFrame': frameEnd,
                        'dataset': dataset,
                        'datasetType': datasetType,
                        'user': user
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                }),
                function errorCallback(response) {
                    callbackError('danger', response)
                }
        },

        // Gets all the available objects types: Person, microwave, etc
        retrieveAvailableObjectTypes: function(datasetType, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: '/api/objectType/getObjectTypes',
                headers: {
                    'datasetType': datasetType
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg);
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg);
            });
        },

        // Get all object UIDs with its types
        retrieveObjects: function(dataset, scene, user, callbackSuccess, callbackError) {
            $http({
                mehtod: 'GET',
                url: '/api/annotation/getObjects',
                headers: {
                    'dataset': dataset.name,
                    'datasetType': dataset.type,
                    'scene': scene,
                    'user': user
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg);
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg);
            })
        },

        // Projects "points" into the camera "cameraName" for the frame "frame"
        projectToCamera: function(uid, type, points, frame, cameraName, dataset, callbackSuccess, callbackError) {
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
                callbackSuccess(uid, type, frame, response.data.msg)
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg);
            })
        },

        // Get Epipolar line
        getEpiline: function(frame, dataset, point, camera1, camera2, camera1Index, camera2Index, pointNumber, callbackSuccess, callbackError) {
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
                callbackSuccess(response.data.msg, camera1Index, camera2Index, pointNumber);
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg);
            })
        },

        // Retrieves the object defined by objectUid
        getAnnotationOfFrameByUID: function(user, dataset, datasetType, scene, objectUid, objectType, startFrame, endFrame, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: "/api/annotation/getAnnotation/object",
                headers: {
                    "dataset": dataset,
                    "datasetType": datasetType,
                    "user": user,
                    "scene": scene,
                    "objectType": objectType,
                    "startFrame": startFrame,
                    "endFrame": endFrame,
                    "uidObject": objectUid
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg);
            }, function errorCallback(response) {
                callbackError('danger', response);
            })
        },

        // Retrieves the object defined by objectUid
        getAnnotationOfFrameByUIDAndType: function(user, dataset, datasetType, scene, objectUid, frame, objectType, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: "/api/annotation/getAnnotation/objectPT",
                headers: {
                    "dataset": dataset,
                    "datasetType": datasetType,
                    "user": user,
                    "scene": scene,
                    "frame": frame,
                    "uidObject": objectUid,
                    "objectType": objectType
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg, frame);
            }, function errorCallback(response) {
                callbackError('danger', response);
            })
        },

        // Sends the 2D points to the server to triangulate and create the new 3D point
        updateAnnotation: function(user, dataset, scene, frame, objects, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/annotation/updateAnnotation',
                data: {
                    'user': user,
                    'dataset': dataset.name,
                    'datasetType': dataset.type,
                    'scene': scene,
                    'frame': frame,
                    'objects': objects  // TODO: change objects for object
                }
            }).then(function successCallback(response) {
                callbackSuccess(objects.uid, objects.type, frame);
            }, function errorCallback(response) {
                callbackError('danger', response)
            })
        },

        // MERGE THIS INTO THE UPDATEANNOTATION RESPECTING PT STRUCTURE
        // Sends the 2D points to the server
        updateAnnotationPT: function(user, dataset, scene, frame, object, points, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/annotation/updateAnnotation',
                data: {
                    'user': user,
                    'dataset': dataset.name,
                    'datasetType': dataset.type,
                    'scene': scene,
                    'frame': frame,
                    'object': {
                        uid: object.original_uid,
                        type: object.type,
                        track_id: object.uid,
                        points: points
                    }
                }
            }).then(function successCallback(response) {
                callbackSuccess(object.original_uid, object.type, frame);
            }, function errorCallback(response) {
                callbackError('danger', response);
            })
        },

        // Create new object
        createNewObject: function(user, dataset, datasetType, scene, type, frame, callbackSuccess, callbackError) {
            $http({
                    method: 'POST',
                    url: '/api/annotation/createNewUidObject',
                    data: {
                        'user': user,
                        'dataset': dataset,
                        'scene': scene,
                        'type': type,
                        'frame': frame,
                        'datasetType': datasetType
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg.maxUid, type)
                }),
                function errorCallback(response) {
                    callbackError('danger', response);
                }
        },

        interpolate: function(user, dataset, datasetType, scene, startFrame, endFrame, uidObject, frameArray, objectType,
            uidObject2, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: "/api/annotation/interpolate",
                data: {
                    'user': user,
                    'dataset': dataset,
                    'scene': scene,
                    'startFrame': startFrame,
                    'endFrame': endFrame,
                    'uidObject': uidObject,
                    'datasetType': datasetType,
                    'objectType': objectType,
                    'uidObject2': uidObject2
                }
            }).then(function successCallback(response) {
                    callbackSuccess(uidObject, frameArray, objectType);
                },
                function errorCallback(response) {
                    callbackError('danger', response);
                })
        },

        // Get list of possible Actions
        getActivitiesList: function(dataset, callbackSuccess, callbackError) {
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
                    callbackError('danger', response);
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
                    callbackError(response.data.msg)
                })
        },

        // Fetch the list of all Actions in the frame
        getActions: function(user, startFrame, endFrame, dataset, callbackSuccess, callbackError) {
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
                    callbackError('danger', response);
                })
        },

        // Fetch the list of all Actions of an Object in the frame
        getActionsByUID: function(user, objectUID, startFrame, endFrame, dataset, callbackSuccess, callbackError) {
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
                    callbackError('danger', response);
                })
        },

        // Remove an action
        removeAction: function(name, user, objectUID, startFrame, endFrame, dataset, callbackSuccess, callbackError) {
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
                    callbackError('danger', response);
                })
        },

        // Get mughsots of an object
        getMugshots: function(dataset, datasetType, scene, user, objectUID, callbackSuccess) {
            $http({
                method: 'GET',
                url: '/api/aik/getMugshot',
                headers: {
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'scene': scene,
                    'user': user,
                    'uid': objectUID
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg)
            }, function errorCallback(response) {})
        },

        // Delete annotations
        deleteAnnotation: function(dataset, datasetType, scene, frame ,username, uidObject, objectType, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/annotation/removeAnnotation/object',
                data: {
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'scene': scene,
                    'startFrame': frame,
                    'endFrame': frame,
                    'user': username,
                    'uidObject': uidObject,
                    'objectType': objectType 
                }
            }).then(function successCallback() {
                callbackSuccess();
            }, function errorCallback() {
                callbackError();
            })
        },

        // Batch delete annotations
        batchDeleteAnnotations: function(dataset, datasetType, scene, startFrame, endFrame, username, uidObject, objectType, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/annotation/removeAnnotation/object',
                data: {
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'scene': scene,
                    'startFrame': startFrame,
                    'endFrame': endFrame,
                    'user': username,
                    'uidObject': uidObject,
                    'objectType': objectType 
                }
            }).then(function successCallback() {
                callbackSuccess();
            }, function errorCallback() {
                callbackError();
            })
        }
    }
});