angular.module('CVGTool')

    .factory('adminDatasetsSrvc', ['navSrvc', '$state', '$http', '$httpParamSerializer',function (navSrvc, $state, $http, $httpParamSerializer) {

        return {
            getInfoOfVideos: function (callbackSuccess, activeDataset, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/video/getVideos',
                    headers: {
                        'dataset': activeDataset,
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                    }
                }).then(function successCallback(response) {
                    if (response.data.msg.length === 0) {
                        callbackSuccess([])
                    } else {
                        callbackSuccess(response.data.msg)
                    }
                }, function errorCallback(response) {
                    callbackError('danger', "Error while retrieving info from videos.")
                });
            },

            readData: function (dataset, type, callback) {
                $http({
                    method: 'POST',
                    url: '/api/dataset/readData',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                    },
                    data: {
                        'name': dataset,
                        'type': type
                    }
                }).then(function successCallback(response) {
                    callback('finish', 'Load data finished', 'success')
                }, function errorCallback(response) {
                    callback('finish', response.data.msg, 'danger')
                });
            },

            getDatasets: function (callback, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/dataset/getDatasets',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                    }
                }).then(function successCallback(response) {
                    callback(response.data.msg);
                }, function errorCallback(response) {
                    callbackError('danger', response.data.msg)
                });
            },

            getDataset: function (datasetName, callbackSuccess) {
                $http({
                    method: 'GET',
                    url: '/api/dataset/getDataset',
                    headers: {
                        'name': datasetName,
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg);
                }, function errorCallback(response) {
                    console.log(response.data.msg)
                });
            },

            removeDataset: function (name, callbackSuccess, callbackError) {
                $http({
                    method: 'POST',
                    url: '/api/dataset/removeDataset',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                    },
                    data: {
                        'name': name
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                }, function errorCallback(response) {
                    callbackError(response.data.msg)
                });
            },

            exportDataset: function (name, type, callbackSuccess, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/dataset/exportDataset',
                    headers: {
                        'dataset': name,
                        'datasetType': type,
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                }, function errorCallback(response) {
                    callbackError(response.data.msg)
                });
            },

            getZipFiles: function(callback, callbackError) {
                $http({
                    method: 'GET',
                    url: 'api/dataset/getZipFiles',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                    }
                }).then(function successCallback(response) {
                    callback(response.data.msg)
                }, function errorCallback(response) {
                    callbackError('danger', response.data.msg)
                })
            },

            getAnnotationFolders: function(dataset, callback, callbackError) {
                $http({
                    method: 'GET',
                    url: 'api/annotation/getFolders',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                    }
                }).then(function successCallback(response) {
                   callback(dataset, response.data.msg)
                }, function errorCallback(response) {
                    callbackError('danger', response.data.msg)
                })
            },

            uploadAnnotations: function (name, type, folder ,callbackSuccess, callbackError) {
                $http({
                    method: 'POST',
                    url: '/api/annotation/uploadAnnotations',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                    },
                    data: {
                        'dataset': name,
                        'datasetType': type,
                        'folder': folder
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                }, function errorCallback(response) {
                    callbackError(response.data.msg)
                });
            },

            loadZip: function(name, type, callbackSuccess, callbackError) {
                $http({
                    method: 'POST',
                    url: 'api/dataset/loadZip',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                    },
                    data: {
                        'name': name,
                        'type': type
                    }
                }).then(function successCallback(response) {
                    callbackSuccess('Load zip finished')
                }, function errorCallback(response) {
                    callbackError(response.data.msg);
                })
            },

            // Get list of possible Actions
            getActivitiesList: function(dataset, callbackSuccess) {
                $http({
                    method: 'GET',
                    url: '/api/activity/getActivities',
                    headers: {
                        dataset: dataset,
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                    }
                }).then(function successCallback(response) {
                        callbackSuccess(response.data.msg);
                    },
                    function errorCallback(response) {
                        console.log("Error loading activities")
                    })
            },

            // Get list of possible Actions
            createActivity: function(dataset, activity, callbackSuccess, callbackError) {
                $http({
                    method: 'POST',
                    url: '/api/activity/createActivity',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                    },
                    data: {
                        dataset: dataset,
                        activity: activity
                    }
                }).then(function successCallback(response) {
                        callbackSuccess(response.data.msg)
                    },
                    function errorCallback(response) {
                        callbackError(response.data.msg);
                    })
            },

            // Load Ignore Regions of a local dataset
            loadIgnoreRegions: function(dataset, callbackSuccess, callbackError) {
                $http({
                    method: 'POST',
                    url: '/api/dataset/loadIgnoreRegions',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                    },
                    data: {
                        'name': dataset.name,
                        'type': dataset.type
                }
                }).then(function successCallback(response) {
                        callbackSuccess(response.data.msg)
                    },
                    function errorCallback(response) {
                        callbackError(response.data.msg);
                    })
            },

            // Load Ignore Regions of a local dataset
            loadPTPoses: function(dataset, callbackSuccess, callbackError) {
                $http({
                    method: 'POST',
                    url: '/api/dataset/loadPTPoses',
                    headers: {
                        'Authorization': 'Bearer ' + navSrvc.getSessionToken()
                    },
                    data: {
                        'name': dataset.name,
                        'type': dataset.type
                    }
                }).then(function successCallback(response) {
                        callbackSuccess(response.data.msg)
                    },
                    function errorCallback(response) {
                        callbackError(response.data.msg);
                    })
            }
        }
    }]);
