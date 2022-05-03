angular.module('CVGTool')

.factory('toolSrvc', ['navSrvc', '$state', '$http', '$httpParamSerializer', function(navSrvc, $state, $http, $httpParamSerializer) {

    return {
        // Gets the information of all the available videos of a dataset
        getInfoOfVideos: function(callbackSuccess, dataset) {
            $http({
                method: 'GET',
                url: '/api/video/getVideos',
                headers: {
                    'dataset': dataset,
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
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
                url: '/api/video/getFrameVideo',
                headers: {
                    'video': fileName,
                    'frame': frame,
                    'dataset': dataset,
                    'datasetType': type,
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data, fileName, frame);
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg)
            });
        },

        // Gets the image of a frame, from a video and a dataset
        getFrame2: function(fileName, frame, dataset, type, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: '/api/video/getFramesVideo',
                headers: {
                    'video': fileName,
                    'frame': frame,
                    'dataset': dataset,
                    'datasetType': type,
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data, fileName, frame);
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg)
            });
        },

        // getMaxVideoFrame: function(dataset, datasetType, video, callbackSuccess, callbackError) {
        //     $http({
        //         method: 'GET',
        //         url: '/api/video/getMaxFrame',
        //         headers: {
        //             'Authorization': 'Bearer ' + navSrvc.getSessionToken(),
        //             'video': video,
        //             'dataset': dataset,
        //             'datasetType': datasetType
        //         }
        //     }).then(function successCallback(response) {
        //         callbackSuccess(response.data.msg)
        //     }, function errorCallback(response) {
        //         callbackError('danger', response.data.msg)
        //     });
        // },

        // Gets the image of a frame range, from a video and a dataset
        getFrames: function(fileName, frameStart, frameEnd, dataset, datasetType, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: '/api/video/getFramesVideo',
                headers: {
                    'video': fileName,
                    'startFrame': frameStart,
                    'endFrame': frameEnd,
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
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
                        'user': user,
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                },
                function errorCallback(response) {
                    callbackError('danger', response.data.msg)
                })
        },

        // Gets all the available objects types: Person, microwave, etc
        retrieveAvailableObjectTypes: function(datasetType, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: '/api/objectType/getObjectTypes',
                headers: {
                    'datasetType': datasetType,
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
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
                    'user': user,
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg);
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg);
            })
        },

        // Projects "points" into the camera "cameraName" for the frame "frame"
        projectToCamera: function(username, uid, type, startFrame, endFrame, cameraName, dataset, datasetType, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: '/api/aik/projectToCamera',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken(),
                    'uidObject': uid,
                    'user': username,
                    'startFrame': startFrame,
                    'endFrame': endFrame,
                    'cameraName': cameraName,
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'objectType': type,
                }
            }).then(function successCallback(response) {
                callbackSuccess(uid, type, startFrame, endFrame, response.data.msg)
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg);
            })
        },
        

        // Get Epipolar line
        getEpiline: function(frame, dataset, datasetType, point, camera1, camera2, camera1Index, camera2Index, pointNumber, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: '/api/aik/computeEpiline',
                headers: {
                    'point': JSON.stringify(point),
                    'frame': frame,
                    'cam1': camera1,
                    'cam2': camera2,
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg, camera1Index, camera2Index, pointNumber);
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg);
            })
        },

        // Retrieves the object defined by objectUid
        getAnnotationOfFrameByUID: function(user, dataset, datasetType, scene, objectUid, objectType, startFrame, endFrame, callbackSuccess, callbackError, track_id) {
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
                    "uidObject": objectUid,
                    "track_id": track_id || 0,
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg);
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg);
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
                    "objectType": objectType,
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg, frame);
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg);
            })
        },

        // Sends the 2D points to the server to triangulate and create the new 3D point
        updateAnnotation: function(user, dataset, scene, frame, object, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/annotation/updateAnnotation',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'user': user,
                    'dataset': dataset.name,
                    'datasetType': dataset.type,
                    'scene': scene,
                    'frame': frame,
                    'object': object
                }
            }).then(function successCallback(response) {
                if (dataset.type.localeCompare("poseTrack") !== 0) {
                    callbackSuccess(object.uid, object.type, frame);
                } else {
                    callbackSuccess(object.track_id, object.type, frame);
                }
                
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg)
            })
        },

        // Create new object
        createNewObject: function(user, dataset, datasetType, scene, type, frame, callbackSuccess, callbackError) {
            $http({
                    method: 'POST',
                    url: '/api/annotation/createNewUidObject',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                    },
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
                },
                function errorCallback(response) {
                    callbackError('danger', response.data.msg);
                })
        },

        isPersonIDInUse: function(dataset, datasetType, person_id, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: '/api/annotation/isPersonIDInUse',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken(),
                    dataset: dataset,
                    datasetType: datasetType,
                    personID: person_id
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg)
            }, function errorCallback(response) {
                callbackError('danger', response)
            })
        },

        // Create new poseTrack person (bbox + bbox_head + person objects) and precompute annotations
        createPersonPT: function(scene, dataset, datasetType, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/annotation/createPersonPT',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'dataset': dataset,
                    'scene': scene,
                    'datasetType': datasetType
                }
            }).then(function successCallback(response) {
                callbackSuccess()
            }, function errorCallback(response) {
                    callbackError('danger', response.data.msg);
            })
        },

        // Create new poseTrack IgnoreRegion and precompute annotations
        createIgnoreRegion: function(scene, dataset, datasetType, minIRTrackID, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/annotation/createIgnoreRegion',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'dataset': dataset,
                    'scene': scene,
                    'datasetType': datasetType,
                    'minIRTrackID': minIRTrackID
                }
            }).then(function successCallback(response) {
                callbackSuccess()
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg);
            })
        },

        // Create new poseTrack person (bbox + bbox_head + person objects) and precompute annotations
        updatePersonID: function(scene, dataset, datasetType, track_id, new_person_id, user, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/annotation/updatePersonID',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'dataset': dataset,
                    'scene': scene,
                    'datasetType': datasetType,
                    "newPersonID": new_person_id,
                    "trackID": track_id,
                    "user": user
                }
            }).then(function successCallback(response) {
                    callbackSuccess("Person ID changed!", new_person_id)
                },
                function errorCallback(response) {
                    callbackError('danger', response.data.msg);
                })
        },

        // Change track id of an object
        updateTrackID: function(scene, dataset, datasetType, track_id, new_track_id, user, obj_type,
                                frame_start, frame_end, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/annotation/updateTrackID',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'dataset': dataset,
                    'scene': scene,
                    'datasetType': datasetType,
                    "newTrackID": new_track_id,
                    "trackID": track_id,
                    "user": user,
                    "obj_type": obj_type,
                    "frame_start": frame_start,
                    "frame_end": frame_end
                }
            }).then(function successCallback(response) {
                    callbackSuccess("Track ID changed!", new_track_id)
                },
                function errorCallback(response) {
                    callbackError('danger', response.data.msg);
                })
        },

        interpolate: function(user, dataset, datasetType, scene, startFrames, endFrame, uidObject, objectType,
            uidObject2, callbackSuccess, callbackError, track_id) {
            $http({
                method: 'POST',
                url: "/api/annotation/interpolate",
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'user': user,
                    'dataset': dataset,
                    'scene': scene,
                    'startFrames': startFrames,
                    'endFrame': endFrame,
                    'uidObject': uidObject,
                    'track_id': track_id || 0,  // if no track_id, set to 0. Only one track_id because it's constant
                    'datasetType': datasetType,
                    'objectType': objectType,
                    'uidObject2': uidObject2
                }
            }).then(function successCallback(response) {
                    callbackSuccess(uidObject, objectType, startFrames, endFrame);
                },
                function errorCallback(response) {
                    callbackError('danger', response.data.msg);
                })
        },

        replicate: function(user, dataset, datasetType, scene, startFrame, endFrame, uidObject, objectType,
            callbackSuccess, callbackError, track_id, forward) {
            $http({
                method: 'POST',
                url: "/api/annotation/replicate/object",
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'user': user,
                    'dataset': dataset,
                    'scene': scene,
                    'startFrame': startFrame,
                    'endFrame': endFrame,
                    'uidObject': uidObject,
                    'track_id': track_id || 0,  // if no track_id, set to 0. Only one track_id because it's constant
                    'datasetType': datasetType,
                    'objectType': objectType,
                    'forward': forward === undefined ? true : forward  // If not specified, it's forwards
                }
            }).then(function successCallback(response) {
                    callbackSuccess(uidObject, objectType, startFrame, endFrame);
                },
                function errorCallback(response) {
                    callbackError('danger', response.data.msg);
                })
        },

        getVideoFramesToAnnotate: function(video, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: '/api/annotation/getFramesToAnnotatePersonsPT',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken(),
                    'video': video
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg);
            }, function errorCallback(response) {
                callbackError("danger", response.data.msg);
            })
        },

        replicateStaticObject: function(user, dataset, datasetType, scene, startFrame, endFrame, maxFrame, uidObject, objectType, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/annotation/replicate/staticobject',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'user': user,
                    'dataset': dataset,
                    'scene': scene,
                    'startFrame': startFrame,
                    'endFrame': endFrame,
                    'lastDatasetFrame': maxFrame,
                    'uidObject': uidObject,
                    'datasetType': datasetType,
                    'objectType': objectType,
                }
            }).then(function successCallback(response) {
                callbackSuccess(uidObject, objectType, startFrame, endFrame);
            }, function errorCallback(response) {
                callbackError("danger", response.data.msg);
            })
        },

        autoComplete: function(user, dataset, datasetType, scene, startFrames, endFrame, uidObject, objectType,
            uidObject2, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: "/api/annotation/autocomplete",
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'user': user,
                    'dataset': dataset,
                    'scene': scene,
                    'startFrames': startFrames,
                    'endFrame': endFrame,
                    'uidObject': uidObject,
                    'datasetType': datasetType,
                    'objectType': objectType,
                    'uidObject2': uidObject2
                }
            }).then(function successCallback(response) {
                callbackSuccess(uidObject, objectType, startFrames, endFrame);
            },
            function errorCallback(response) {
                callbackError('danger', response.data.msg);
            })
        },

        // Get list of possible Actions
        getActivitiesList: function(dataset, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: '/api/activity/getActivities',
                headers: {
                    dataset: dataset,
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                }
            }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                },
                function errorCallback(response) {
                    callbackError('danger', response.data.msg);
                })
        },

        // Create a new action
        createAction: function(user, startFrame, endFrame, activity, object, dataset, datasetType, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/action/createAction',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'user': user,
                    'dataset': dataset,
                    'datasetType': datasetType,
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
        getActions: function(user, startFrame, endFrame, dataset, datasetType, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: '/api/action/getActions',
                headers: {
                    'user': user,
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'startFrame': startFrame,
                    'endFrame': endFrame,
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                }
            }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                },
                function errorCallback(response) {
                    callbackError('danger', response.data.msg);
                })
        },

        // Fetch the list of all Actions of an Object in the frame
        getActionsByUID: function(user, objectUID, startFrame, endFrame, dataset, datasetType, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: '/api/action/getActionsByUID',
                headers: {
                    'user': user,
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'objectUID': objectUID,
                    'startFrame': startFrame,
                    'endFrame': endFrame,
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                }
            }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg, objectUID)
                },
                function errorCallback(response) {
                    callbackError('danger', response.data.msg);
                })
        },

        // Remove an action
        removeAction: function(name, user, objectUID, startFrame, endFrame, dataset, datasetType, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/action/removeAction',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'name': name,
                    'user': user,
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'objectUID': objectUID,
                    'startFrame': startFrame,
                    'endFrame': endFrame
                }
            }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                },
                function errorCallback(response) {
                    callbackError('danger', response.data.msg);
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
                    'uid': objectUID,
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
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
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
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
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
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
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg);
            })
        },

        // Batch delete annotations
        batchDeleteLabel: function(dataset, datasetType, scene, startFrame, endFrame, username, uidObject, objectType, labelIndex, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/annotation/removeAnnotation/object/label',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'scene': scene,
                    'startFrame': startFrame,
                    'endFrame': endFrame,
                    'user': username,
                    'uidObject': uidObject,
                    'objectType': objectType,
                    'label': labelIndex 
                }
            }).then(function successCallback() {
                callbackSuccess();
            }, function errorCallback() {
                callbackError();
            })
        },

        // Run sanity check on loaded frames for the video
        runSanityCheck: function(dataset, datasetType, scene, startFrame, endFrame, username, callbackSuccess, callbackError){
            $http({
                method: 'GET',
                url: '/api/annotation/getSanityCheck',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken(),
                    "dataset": dataset,
                    "datasetType": datasetType,
                    "user": username,
                    "scene": scene,
                    "startFrame": startFrame,
                    "endFrame": endFrame,
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg);
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg);
            })
        },

        // Transfer object
        transferObject: function(dataset, datasetType, scene, startFrame, endFrame, username, oldUid, newUid, objectType, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/annotation/transferObject',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'scene': scene,
                    'startFrame': startFrame,
                    'endFrame': endFrame,
                    'user': username,
                    'oldUid': oldUid,
                    'newUid': newUid,
                    'objectType': objectType
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg);
            }, function errorCallback(response) {
                callbackError(response.data.msg);
            })
        },

        getPoseAIKLimbsLength: function(dataset, datasetType, scene, objectType, uid, callbackSuccess, callbackError) {
            $http({
                method: 'GET',
                url: '/api/poseProperty/getPoseProperty/uid',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken(),
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'scene': scene,
                    'uidObject': uid,
                    'objectType': objectType
                }
            }).then(function successCallback(response) {
                callbackSuccess(response.data.msg, uid);
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg)
            })
        },

        updatePoseAIKLimbsLength: function(dataset, datasetType, scene, objectType, uid, limbs, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/poseProperty/updatePoseProperty',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'scene': scene,
                    'uidObject': uid,
                    'objectType': objectType,
                    'upperArmLength': limbs[0],
                    'lowerArmLength': limbs[1],
                    'upperLegLength': limbs[2],
                    'lowerLegLength': limbs[3]  
                }
            }).then(function successCallback(response) {
                callbackSuccess('success', 'Limbs updated!');
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg)
            })
        },
        forcePoseAIKLimbLength: function(dataset, datasetType, scene, user, objectType, uid, frame, startLabels, endLabels, limbLength, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/annotation/forceLimbLength',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'scene': scene,
                    'user': user,
                    'uidObject': uid,
                    'objectType': objectType,
                    "frame": frame,
                    "startLabels": startLabels,
                    "endLabels": endLabels,
                    "limbLength": limbLength
                    
                }
            }).then(function successCallback(response) {
                callbackSuccess(uid, objectType, frame)
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg)
            })
        },
        forcePoseAIKLimbLengthForRange: function(dataset, datasetType, scene, user, objectType, uid, startFrame, endFrame, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/annotation/forceLimbsLength',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'scene': scene,
                    'user': user,
                    'uidObject': uid,
                    'objectType': objectType,
                    "startFrame": startFrame,
                    "endFrame": endFrame
                    
                }
            }).then(function successCallback(response) {
                callbackSuccess(uid, objectType, startFrame, endFrame)
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg)
            })
        },
        extendBoxToGround: function(dataset, datasetType, scene, user, objectType, uid, frame, callbackSuccess, callbackError) {
            $http({
                method: 'POST',
                url: '/api/annotation/extendBox',
                headers: {
                    'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                },
                data: {
                    'dataset': dataset,
                    'datasetType': datasetType,
                    'scene': scene,
                    'user': user,
                    'uidObject': uid,
                    'objectType': objectType,
                    "frame": frame
                }
            }).then(function successCallback(response) {
                callbackSuccess(uid, objectType, frame)
            }, function errorCallback(response) {
                callbackError('danger', response.data.msg)
            })
        }

    }
}]);
