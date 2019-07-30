angular.module('CVGTool')

    .factory('adminDatasetsSrvc', function ($state, $http, $httpParamSerializer) {

        return {
            getInfoOfVideos: function (callbackSuccess, activeDataset) {
                $http({
                    method: 'GET',
                    url: '/api/dataset/getVideos',
                    headers: {
                        'dataset': activeDataset
                    }
                }).then(function successCallback(response) {
                    if (response.data.msg.length === 0) {
                        callbackSuccess([])
                    } else {
                        callbackSuccess(response.data.msg)
                    }
                }, function errorCallback(response) {
                    console.log("ERROR while retrieving info from videos.")
                });
            },

          readData: function (dataset, type, callbackFinished) {
              $http({
                  method: 'POST',
                  url: '/api/dataset/readData',
                  data: {
                      'dataset': dataset,
                      'type': type
                  }
              }).then(function successCallback(response) {
                  console.log('read data finished')
                  //callbackFinished(dataset)
              }, function errorCallback(response) {
                  console.log(response.data.msg)
              });
          },

            updateVideosFrames: function (dataset, callback) {
                $http({
                    method: 'POST',
                    url: '/api/dataset/updateVideosFrames',
                    headers: {
                        'dataset': dataset
                    }
                }).then(function successCallback(response) {
                    callback();
                    console.log("Updated frames for videos of" + dataset + " in database")
                }, function errorCallback(response) {
                    console.log(response.data.msg)
                });
            },

            createDataset: function (name, type, callback) {
                $http({
                    method: 'POST',
                    url: '/api/dataset/createDataset',
                    data: {
                        'name': name,
                        'type': type
                    }
                }).then(function successCallback(response) {
                    console.log("Created dataset and videos in database");
                    callback();
                }, function errorCallback(response) {
                    console.log(response.data.msg)
                });
            },

            getDatasets: function (callback) {
                $http({
                    method: 'GET',
                    url: '/api/dataset/getDatasets'
                }).then(function successCallback(response) {
                    callback(response.data.msg);
                    console.log("Successfully retrieved list of users")
                }, function errorCallback(response) {
                    console.log(response.data.msg)
                });
            },

            getDataset: function (datasetName, callbackSuccess) {
                $http({
                    method: 'GET',
                    url: '/api/dataset/getDataset',
                    headers: {
                        'name': datasetName
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
                    data: {
                        'name': name
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                }, function errorCallback(response) {
                    callbackError(response.data.msg)
                });
            },

            exportDataset: function (name, callbackSuccess, callbackError) {
                $http({
                    method: 'GET',
                    url: '/api/dataset/exportDataset',
                    data: {
                        'name': name
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                }, function errorCallback(response) {
                    callbackError(response.data.msg)
                });
            },

            getZipFiles: function(callback) {
                console.log("service");
                $http({
                    method: 'GET',
                    url: 'api/dataset/getZipFiles'
                }).then(function successCallback(response) {
                    callback(response.data.msg)
                }, function errorCallback(response) {
                    console.log(response.data.msg)
                })
            },

            loadZip: function(name, type, callbackSuccess, callbackError) {
                $http({
                    method: 'POST',
                    url: 'api/dataset/loadZip',
                    data: {
                        'name': name,
                        'type': type
                    }
                }).then(function successCallback(response) {
                    callbackSuccess(response.data.msg)
                }, function errorCallback(response) {
                    callbackError(response.data.msg);
                    console.log(response.data.msg)
                })
            }
        }
    });
